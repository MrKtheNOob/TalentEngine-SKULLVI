from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI

from shared.database import DatabaseService


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
