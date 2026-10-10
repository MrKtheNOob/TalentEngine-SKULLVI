import asyncio
import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from auth.service import AuthService, UserNotFoundError
from jobs.api import router as jobs_router
from jobs.cv_reader import CVReader
from jobs.processing import ApplicationProcessor
from jobs.worker import JobWorker
from programs.api import router as programs_router
from auth.api import router as auth_router
from shared.database import DatabaseService
from shared.llm_service import LLMService
from shared.ocr_service import OCRService

load_dotenv()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    database = DatabaseService()
    llm = None
    task = None
    app.state.worker = None
    try:
        await database.connect()
        app.state.database = database
        if os.getenv("OPENROUTER_API_KEY") and os.getenv("OPENROUTER_MODEL"):
            llm = LLMService()
            # CV reading tries local text extraction, then paid OCR for scanned PDFs.
            cv_reader = CVReader(OCRService(llm))
            worker = JobWorker(database, ApplicationProcessor(llm, cv_reader))
            app.state.worker = worker
            task = asyncio.create_task(worker.run(), name="application-jobs")

            def worker_finished(finished):
                app.state.worker = None
                if not finished.cancelled():
                    logger.error("Background worker stopped: %s", finished.exception())

            task.add_done_callback(worker_finished)
        else:
            logger.warning("LLM settings missing: import/scoring submissions are disabled.")
        yield
    finally:
        # Stop processing before closing the LLM client and database pool.
        if task is not None:
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)
        if llm is not None:
            await llm.close()
        await database.close()


app = FastAPI(title="Talent Engine", lifespan=lifespan)
app.include_router(programs_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


PUBLIC_PATHS = {"/api/auth/login", "/api/auth/logout"}

@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path in PUBLIC_PATHS or request.method == "OPTIONS":
        return await call_next(request)

    request.state.user = None
    token = request.cookies.get("access_token")
    if not token:
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})

    if token:
        # Middleware does not resolve Depends: manage its session explicitly.
        async with request.app.state.database.sessions() as session:
            service = AuthService(session)
            try:
                user_id = service.verify_token(token)
                request.state.user = await service.get_user_by_id(user_id)
            except (ValueError, UserNotFoundError):
                return JSONResponse(status_code=401, content={"detail": "Invalid session"})

    return await call_next(request)


# Register last so CORS also covers responses returned early by auth middleware.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)
