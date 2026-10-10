from programs.service import ProgramService
import pytest

from fastapi import HTTPException
from sqlalchemy import text
from models import Program, ProgramApplication
from programs.api import get_program_applications, get_program_application, create_program
from programs.schemas import ProgramCreate, ProgramResponse
from program_applications.schemas import ProgramApplicationResponse


class TestApplicationsQuery:
    @pytest.fixture(autouse=True)
    def setup(self, application_db):
        self.session = application_db.session
        self.db = application_db.db

    async def rows(self, **params):
        return await get_program_applications(1, service=ProgramService(self.db), **params)

    async def test_score_order_ties_null_scores_and_program_scope(self):
        rows = await self.rows()
        assert [row.id for row in rows] == [1, 2, 3]
        for row in rows:
            ProgramApplicationResponse.model_validate(row)

    async def test_recent_order(self):
        assert [row.id for row in await self.rows(sort='recent')] == [3, 2, 1]

    async def test_processing_filter_and_combined_search(self):
        assert [row.id for row in await self.rows(status='needs_review', search='ALI')] == [2]
        assert await self.rows(status='failed') == []
        assert [row.id for row in await self.rows(search=' elodie ')] == [1]
        assert [row.id for row in await self.rows(search='2@example.com')] == [2]

    async def test_detail_is_scoped_to_program(self):
        detail = await get_program_application(1, 1, ProgramService(self.db))
        assert detail.name == 'Élodie'
        for program_id, application_id in [(1, 4), (1, 999), (999, 1)]:
            with pytest.raises(HTTPException) as error:
                await get_program_application(program_id, application_id, ProgramService(self.db))
            assert error.value.status_code == 404

    async def test_create_program_persists_and_returns_zero_count(self):
        response = await create_program(ProgramCreate(name='  New program  '), ProgramService(self.db))
        program = ProgramResponse.model_validate(response)
        assert program.name == 'New program'
        assert program.candidates_count == 0
        assert self.session.get(Program, program.id).name == 'New program'

    async def test_filter_keeps_global_rank(self):
        rows = await self.rows(status='needs_review')
        assert [(row.id, row.rank) for row in rows] == [(2, 2)]
        rows = await self.rows(search='Fatou')
        assert rows[0].rank == None

    async def test_application_detail_uses_application_identity_and_scope(self):
        from programs.api import get_application_detail
        detail = await get_application_detail(1, 1, ProgramService(self.db))
        assert detail["application"].name == "Élodie"
        assert detail["application"].id == 1
        with pytest.raises(HTTPException) as error:
            await get_application_detail(1, 4, ProgramService(self.db))
        assert error.value.status_code == 404


class TestApplicationDeletion:
    @pytest.fixture(autouse=True)
    def setup(self, application_db):
        self.session = application_db.session
        self.db = application_db.db

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
        assert self.session.get(ProgramApplication, 1) is None
        assert [row.application_id for row in self.session.scalars(select(ScoringJob)).all()] == [4]
        assert self.session.get(ProgramApplication, 4) is not None
        assert self.session.get(ImportJob, job.id).next_row == 1
        assert self.session.get(Program, 1).configuration == {'criteria': [{'id': 'keep'}]}
        assert (await ProgramService(self.db).get_program(1))['candidates_count'] == 2

    async def test_wrong_program_and_missing_application_are_not_deleted(self):
        for pid, aid in [(1, 4), (1, 999), (999, 1)]:
            with pytest.raises(HTTPException) as error:
                await ProgramService(self.db).delete_application(pid, aid)
            assert error.value.status_code == 404
            await self.db.rollback()
        assert self.session.get(ProgramApplication, 1) is not None
        assert self.session.get(ProgramApplication, 4) is not None

    async def test_running_evaluation_blocks_deletion_without_data_loss(self):
        from jobs.model import ScoringJob
        job = ScoringJob(program_id=1, application_id=1, configuration={}, status='running')
        self.session.add(job)
        self.session.commit()
        with pytest.raises(HTTPException) as error:
            await ProgramService(self.db).delete_application(1, 1)
        assert error.value.status_code == 409
        await self.db.rollback()
        assert self.session.get(ProgramApplication, 1) is not None
        assert self.session.get(ScoringJob, job.id).status == 'running'

    async def test_delete_endpoint_returns_empty_204(self):
        import httpx
        from fastapi import FastAPI
        from programs.api import router, get_program_service
        app = FastAPI()
        app.include_router(router, prefix='/api')
        app.dependency_overrides[get_program_service] = lambda: ProgramService(self.db)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as client:
            response = await client.delete('/api/programs/1/applications/1')
            assert response.status_code == 204
            assert response.content == b''
            assert (await client.delete('/api/programs/1/applications/1')).status_code == 404
