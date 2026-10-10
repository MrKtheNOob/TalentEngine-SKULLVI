"""Each test gets an isolated SQLite database; no development DB is touched."""
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, MetaData, text, DefaultClause
from sqlalchemy.orm import Session

from models import Base, Program, ProgramApplication


class QuerySession:
    """Expose the async session methods used by services over synchronous SQLite."""

    def __init__(self, session):
        self.session = session

    async def execute(self, query):
        return self.session.execute(query)

    async def get(self, model, identifier, **kwargs):
        return self.session.get(model, identifier, **kwargs)

    async def flush(self):
        self.session.flush()

    async def rollback(self):
        self.session.rollback()

    def add(self, model):
        self.session.add(model)

    async def commit(self):
        self.session.commit()

    async def refresh(self, model):
        self.session.refresh(model)


@pytest.fixture
def application_db():
    fixture = SimpleNamespace()
    fixture.engine = create_engine('sqlite://')
    metadata = MetaData()
    for table in Base.metadata.sorted_tables:
        table.to_metadata(metadata)
    # Adapt only PostgreSQL defaults for this isolated query test database.
    for table in metadata.tables.values():
        for column in table.columns:
            if column.server_default is not None:
                default = str(column.server_default.arg)
                if default == 'now()':
                    column.server_default = DefaultClause(text('CURRENT_TIMESTAMP'))
                elif '::json' in default:
                    column.server_default = DefaultClause(text("'{}'"))
    metadata.create_all(fixture.engine)
    fixture.session = Session(fixture.engine, expire_on_commit=False)
    fixture.session.add_all([Program(id=1, name='Backend'), Program(id=2, name='Frontend')])
    for app_id, program_id, candidate_id, score, status, day in [
        (1, 1, 1, 80, 'ready', 1),
        (2, 1, 2, 80, 'needs_review', 2),
        (3, 1, 3, None, 'received', 3),
        (4, 2, 1, 99, 'ready', 4),
    ]:
        fixture.session.add(ProgramApplication(id=app_id, program_id=program_id,
            name={1: "Élodie", 2: "Ali", 3: "Fatou"}[candidate_id], email=f"{candidate_id}@example.com", score=score, status=status,
            created_at=datetime(2026, 10, day, tzinfo=timezone.utc)))
    fixture.session.commit()
    fixture.db = QuerySession(fixture.session)
    try:
        yield fixture
    finally:
        fixture.session.close()
        fixture.engine.dispose()
