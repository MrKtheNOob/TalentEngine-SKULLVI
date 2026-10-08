import asyncio
import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI

from jobs.api import router as jobs_router
from jobs.cv_reader import CVReader
from jobs.processing import ApplicationProcessor
from jobs.worker import JobWorker
from programs.api import router as programs_router
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


@app.get("/api/")
def read_root():
    return {"Hello": "World"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")), log_level="info")
