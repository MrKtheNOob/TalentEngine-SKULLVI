from programs.service import ProgramService
import unittest
from sqlalchemy import create_engine, text
from programs.api import get_programs, get_program_overview, get_program
from programs.schemas import ProgramResponse, ProgramUpdate


class QuerySession:
    """Execute the endpoint's real SQL against an isolated SQLite fixture."""
    def __init__(self, connection):
        self.connection = connection

    async def execute(self, query):
        return self.connection.execute(query)


class ProgramsQueryTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
        self.connection = self.engine.connect()
        self.connection.execute(text('''CREATE TABLE programs (
            id INTEGER PRIMARY KEY, name TEXT, description TEXT,
            updated_at DATETIME)'''))
        self.connection.execute(text('''CREATE TABLE program_applications (
            id INTEGER PRIMARY KEY, program_id INTEGER, status TEXT)'''))
        self.connection.execute(text('''INSERT INTO programs VALUES
            (1, 'Zulu Backend', NULL, '2026-10-01 00:00:00'),
            (2, 'Alpha Frontend', NULL, '2026-10-03 00:00:00'),
            (3, 'Beta Backend', NULL, '2026-10-03 00:00:00'),
            (4, '100% Design', NULL, '2026-10-02 00:00:00')'''))
        self.connection.execute(text('''INSERT INTO program_applications VALUES
            (1, 1, 'needs_review'), (2, 1, 'processing'), (3, 3, 'received'), (4, 3, 'failed'), (5, 2, 'ready')'''))
        self.db = QuerySession(self.connection)

    def tearDown(self):
        self.connection.close()
        self.engine.dispose()

    async def rows(self, **params):
        return await get_programs(service=ProgramService(self.db), **params)

    async def test_default_latest_first_and_name_ties(self):
        rows = await self.rows()
        self.assertEqual([row['id'] for row in rows], [2, 3, 4, 1])
        for row in rows:
            ProgramResponse.model_validate(row)

    async def test_count_sort_preserves_zero_and_breaks_ties_by_name(self):
        rows = await self.rows(sort='candidates')
        self.assertEqual([r['id'] for r in rows], [3, 1, 2, 4])
        self.assertEqual([r['candidates_count'] for r in rows], [2, 2, 1, 0])

    async def test_name_sort(self):
        self.assertEqual([r['id'] for r in await self.rows(sort='name')], [4, 2, 3, 1])

    async def test_search_trims(self):
        self.assertEqual([r['id'] for r in await self.rows(search='  BACKEND ')], [3, 1])
        self.assertEqual(await self.rows(search='Unknown'), [])

    async def test_search_treats_wildcards_literally(self):
        self.assertEqual([r['id'] for r in await self.rows(search='%')], [4])
        self.assertEqual(await self.rows(search='_'), [])
        self.assertEqual(len(await self.rows(search='  ')), 4)

    async def test_search_ignores_accents(self):
        self.connection.execute(text("UPDATE programs SET name = 'Développement Backend' WHERE id = 1"))
        self.assertEqual([r['id'] for r in await self.rows(search='developpement')], [1])

    async def test_overview_counts_processing_states(self):
        self.assertEqual(dict(await get_program_overview(1, ProgramService(self.db))), {"total": 2, "review": 1, "processing": 1, "failed": 0})
        self.assertEqual(dict(await get_program_overview(3, ProgramService(self.db))), {"total": 2, "review": 0, "processing": 1, "failed": 1})
        self.assertEqual(dict(await get_program_overview(4, ProgramService(self.db))), {"total": 0, "review": 0, "processing": 0, "failed": 0})

    async def test_missing_program_returns_404(self):
        from fastapi import HTTPException
        for endpoint in (get_program, get_program_overview):
            with self.assertRaises(HTTPException) as error:
                await endpoint(999, ProgramService(self.db))
            self.assertEqual(error.exception.status_code, 404)

    def test_program_edit_validates_name_and_rejects_removed_status(self):
        from pydantic import ValidationError
        for payload in ({"name": "  "}, {"name": None}, {"is_active": True}):
            with self.assertRaises(ValidationError):
                ProgramUpdate.model_validate(payload)
        self.assertEqual(ProgramUpdate(name="  Updated  ").name, "Updated")
        self.assertEqual(ProgramUpdate(description=None).model_dump(exclude_unset=True), {"description": None})

    async def test_edit_changes_only_provided_attributes_and_commits(self):
        from types import SimpleNamespace
        from unittest.mock import AsyncMock
        from programs.api import update_program
        program = SimpleNamespace(name='Original', description='Keep', configuration={'criteria': []})
        self.db.get = AsyncMock(return_value=program)
        self.db.commit = AsyncMock()
        await update_program(1, ProgramUpdate(name=' Updated '), ProgramService(self.db))
        self.assertEqual(program.name, 'Updated')
        self.assertEqual(program.description, 'Keep')
        self.assertEqual(program.configuration, {'criteria': []})
        self.db.commit.assert_awaited_once()

    async def test_edit_missing_program_does_not_commit(self):
        from unittest.mock import AsyncMock
        from fastapi import HTTPException
        from programs.api import update_program
        self.db.get = AsyncMock(return_value=None)
        self.db.commit = AsyncMock()
        with self.assertRaises(HTTPException) as error:
            await update_program(999, ProgramUpdate(name='Updated'), ProgramService(self.db))
        self.assertEqual(error.exception.status_code, 404)
        self.db.commit.assert_not_awaited()

    async def test_route_injects_service_with_request_database(self):
        import json
        from fastapi import FastAPI
        from programs.api import router
        from shared.dependencies import get_db

        app = FastAPI()
        app.include_router(router)
        async def database_override():
            return self.db

        app.dependency_overrides[get_db] = database_override
        messages = []

        async def receive():
            return {'type': 'http.request', 'body': b'', 'more_body': False}

        async def send(message):
            messages.append(message)

        await app({
            'type': 'http', 'asgi': {'version': '3.0'},
            'http_version': '1.1', 'method': 'GET', 'scheme': 'http',
            'path': '/programs/', 'raw_path': b'/programs/',
            'query_string': b'sort=candidates&search=backend',
            'root_path': '', 'headers': [],
            'client': ('test', 1234), 'server': ('test', 80),
        }, receive, send)
        self.assertEqual(messages[0]['status'], 200)
        body = b''.join(message.get('body', b'') for message in messages)
        self.assertEqual([row['id'] for row in json.loads(body)], [3, 1])
