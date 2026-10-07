from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
import os

from fastapi import FastAPI

from shared.database import DatabaseService
from dotenv import load_dotenv
load_dotenv()

from programs.api import router as programs_router 

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    database = DatabaseService()
    try:
        await database.connect()
        app.state.database = database
        yield
    finally:
        await database.close()
        if hasattr(app.state, "database"):
            del app.state.database


app = FastAPI(title="Talent Engine", lifespan=lifespan)
app.include_router(programs_router, prefix="/api")

@app.get("/api/")
def read_root():
    return {"Hello": "World"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")), log_level="info")
