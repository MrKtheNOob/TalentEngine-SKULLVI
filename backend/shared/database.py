import asyncio
import os

from sqlalchemy import make_url, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine


class DatabaseService:
    """Own the PostgreSQL connection pool and session factory."""

    def __init__(self, database_url: str | None = None) -> None:
        if database_url is None:
            database_url = os.environ.get("DATABASE_URL", "")
        database_url = database_url.strip()
        if not database_url:
            raise RuntimeError("DATABASE_URL is required to start the API.")
        try:
            url = make_url(database_url)
        except Exception:
            raise RuntimeError("DATABASE_URL must be a valid PostgreSQL URL.") from None
        if url.drivername not in {"postgres", "postgresql", "postgresql+psycopg"}:
            raise RuntimeError("DATABASE_URL must use PostgreSQL with the psycopg driver.")
        self.engine: AsyncEngine = create_async_engine(
            url.set(drivername="postgresql+psycopg"),
            pool_pre_ping=True,
            connect_args={"connect_timeout": 5},
        )
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False, class_=AsyncSession)

    async def connect(self) -> None:
        """Verify actual connectivity; constructing an engine alone is lazy."""
        try:
            async with asyncio.timeout(10):
                async with self.engine.connect() as connection:
                    await connection.execute(text("SELECT 1"))
        except Exception:
            # Avoid exposing credentials or connection details in startup tracebacks.
            raise RuntimeError("PostgreSQL startup check failed; API startup aborted.") from None

    async def close(self) -> None:
        await self.engine.dispose()
