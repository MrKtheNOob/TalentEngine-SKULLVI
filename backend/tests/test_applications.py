from programs.service import ProgramService
from datetime import datetime, timezone
import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine, MetaData, text, DefaultClause
from sqlalchemy.orm import Session
from models import Base, Program, ProgramApplication
from programs.api import get_program_applications, get_program_application, create_program
from programs.schemas import ProgramCreate, ProgramResponse
from program_applications.schemas import ProgramApplicationResponse


class QuerySession:
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


class ApplicationsQueryTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.engine = create_engine('sqlite://')
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
        metadata.create_all(self.engine)
        self.session = Session(self.engine, expire_on_commit=False)
        self.session.add_all([Program(id=1, name='Backend'), Program(id=2, name='Frontend')])
        for app_id, program_id, candidate_id, score, status, day in [
            (1, 1, 1, 80, 'ready', 1),
            (2, 1, 2, 80, 'needs_review', 2),
            (3, 1, 3, None, 'received', 3),
            (4, 2, 1, 99, 'ready', 4),
        ]:
            self.session.add(ProgramApplication(id=app_id, program_id=program_id,
                name={1: "Élodie", 2: "Ali", 3: "Fatou"}[candidate_id], email=f"{candidate_id}@example.com", score=score, status=status,
                created_at=datetime(2026, 10, day, tzinfo=timezone.utc)))
        self.session.commit()
        self.db = QuerySession(self.session)

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    async def rows(self, **params):
        return await get_program_applications(1, service=ProgramService(self.db), **params)

    async def test_score_order_ties_null_scores_and_program_scope(self):
        rows = await self.rows()
        self.assertEqual([row.id for row in rows], [1, 2, 3])
        for row in rows:
            ProgramApplicationResponse.model_validate(row)

    async def test_recent_order(self):
        self.assertEqual([row.id for row in await self.rows(sort='recent')], [3, 2, 1])

    async def test_processing_filter_and_combined_search(self):
        self.assertEqual([row.id for row in await self.rows(status='needs_review', search='ALI')], [2])
        self.assertEqual(await self.rows(status='failed'), [])
        self.assertEqual([row.id for row in await self.rows(search=' elodie ')], [1])
        self.assertEqual([row.id for row in await self.rows(search='2@example.com')], [2])

    async def test_detail_is_scoped_to_program(self):
        detail = await get_program_application(1, 1, ProgramService(self.db))
        self.assertEqual(detail.name, 'Élodie')
        for program_id, application_id in [(1, 4), (1, 999), (999, 1)]:
            with self.assertRaises(HTTPException) as error:
                await get_program_application(program_id, application_id, ProgramService(self.db))
            self.assertEqual(error.exception.status_code, 404)

    async def test_create_program_persists_and_returns_zero_count(self):
        response = await create_program(ProgramCreate(name='  New program  '), ProgramService(self.db))
        program = ProgramResponse.model_validate(response)
        self.assertEqual(program.name, 'New program')
        self.assertEqual(program.candidates_count, 0)
        self.assertEqual(self.session.get(Program, program.id).name, 'New program')

    async def test_filter_keeps_global_rank(self):
        rows = await self.rows(status='needs_review')
        self.assertEqual([(row.id, row.rank) for row in rows], [(2, 2)])
        rows = await self.rows(search='Fatou')
        self.assertEqual(rows[0].rank, None)

    async def test_application_detail_uses_application_identity_and_scope(self):
        from programs.api import get_application_detail
        detail = await get_application_detail(1, 1, ProgramService(self.db))
        self.assertEqual(detail["application"].name, "Élodie")
        self.assertEqual(detail["application"].id, 1)
        with self.assertRaises(HTTPException) as error:
            await get_application_detail(1, 4, ProgramService(self.db))
        self.assertEqual(error.exception.status_code, 404)


class ApplicationDeletionTests(unittest.IsolatedAsyncioTestCase):
    setUp = ApplicationsQueryTests.setUp
    tearDown = ApplicationsQueryTests.tearDown

    async def test_delete_removes_related_jobs_preserves_program_and_import(self):
        from jobs.model import ImportJob, ScoringJob
        from sqlalchemy import select
        self.session.execute(text('PRAGMA foreign_keys=ON'))
        self.session.get(Program, 1).configuration = {'criteria': [{'id': 'keep'}]}
        job = ImportJob(program_id=1, filename='rows.json', raw_rows=[{'name': 'Élodie'}], next_row=1, status='completed')
        self.session.add(job)
        self.session.flush()
        self.session.get(ProgramApplication, 1).import_job_id = job.id
        self.session.add_all([
            ScoringJob(program_id=1, application_id=1, configuration={}, status='pending'),
            ScoringJob(program_id=1, application_id=1, configuration={}, status='completed'),
            ScoringJob(program_id=2, application_id=4, configuration={}, status='pending'),
        ])
        self.session.commit()
        await ProgramService(self.db).delete_application(1, 1)
        self.assertIsNone(self.session.get(ProgramApplication, 1))
        self.assertEqual([row.application_id for row in self.session.scalars(select(ScoringJob)).all()], [4])
        self.assertIsNotNone(self.session.get(ProgramApplication, 4))
        self.assertEqual(self.session.get(ImportJob, job.id).next_row, 1)
        self.assertEqual(self.session.get(Program, 1).configuration, {'criteria': [{'id': 'keep'}]})
        self.assertEqual((await ProgramService(self.db).get_program(1))['candidates_count'], 2)

    async def test_wrong_program_and_missing_application_are_not_deleted(self):
        for pid, aid in [(1, 4), (1, 999), (999, 1)]:
            with self.assertRaises(HTTPException) as error:
                await ProgramService(self.db).delete_application(pid, aid)
            self.assertEqual(error.exception.status_code, 404)
            await self.db.rollback()
        self.assertIsNotNone(self.session.get(ProgramApplication, 1))
        self.assertIsNotNone(self.session.get(ProgramApplication, 4))

    async def test_running_evaluation_blocks_deletion_without_data_loss(self):
        from jobs.model import ScoringJob
        job = ScoringJob(program_id=1, application_id=1, configuration={}, status='running')
        self.session.add(job)
        self.session.commit()
        with self.assertRaises(HTTPException) as error:
            await ProgramService(self.db).delete_application(1, 1)
        self.assertEqual(error.exception.status_code, 409)
        await self.db.rollback()
        self.assertIsNotNone(self.session.get(ProgramApplication, 1))
        self.assertEqual(self.session.get(ScoringJob, job.id).status, 'running')

    async def test_delete_endpoint_returns_empty_204(self):
        import httpx
        from fastapi import FastAPI
        from programs.api import router, get_program_service
        app = FastAPI()
        app.include_router(router, prefix='/api')
        app.dependency_overrides[get_program_service] = lambda: ProgramService(self.db)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
            response = await client.delete('/api/programs/1/applications/1')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, b'')
            self.assertEqual((await client.delete('/api/programs/1/applications/1')).status_code, 404)
