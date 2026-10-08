import asyncio
import json
import unittest
from contextlib import asynccontextmanager
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import AsyncMock

from fastapi import HTTPException
from sqlalchemy import select

import test_applications
from jobs.job_service import JobService
from jobs.processing import ApplicationProcessor
from jobs.worker import JobWorker
from jobs.model import ImportJob, ScoringJob
from program_applications.model import ProgramApplication
from programs.model import Program
from test_configuration import configuration


def normalized(name="Awa", cv_url=None):
    return {"name": name, "email": "awa@example.com", "phone": None,
            "cv_url": cv_url, "portfolio_url": None,
            "facts": {"skills": ["Python"], "experience": "Projects"},
            "metadata": {"confidence": 0.9, "warnings": []}}


class ProcessingTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.llm = SimpleNamespace(complete=AsyncMock())
        self.cv = SimpleNamespace(read=AsyncMock(return_value="CV text"))
        self.processor = ApplicationProcessor(self.llm, self.cv)

    async def test_cv_is_read_and_its_original_link_is_preserved(self):
        link = "https://example.com/cv.pdf?token=original"
        first = normalized(cv_url=link)
        second = normalized(cv_url="https://example.com/changed.pdf")
        second["facts"]["education"] = "From CV"
        self.llm.complete.side_effect = [json.dumps(first), json.dumps(second)]
        result = await self.processor.normalize({"uploaded_cv": link}, {"name": "Backend"})
        self.cv.read.assert_awaited_once_with(link)
        self.assertEqual(result["cv_url"], link)
        self.assertEqual(result["facts"]["education"], "From CV")
        payload = json.loads(self.llm.complete.call_args.args[0][1]["content"])
        self.assertEqual(payload["cv_text"], "CV text")

    async def test_broken_cv_retains_application_with_warning(self):
        self.llm.complete.return_value = json.dumps(normalized(cv_url="https://example.com/cv.pdf"))
        self.cv.read.side_effect = ValueError("Not readable")
        result = await self.processor.normalize({}, {})
        self.assertEqual(result["name"], "Awa")
        self.assertTrue(result["metadata"]["warnings"])

    async def test_scores_are_weighted_in_backend_and_explained(self):
        config = configuration()
        config["criteria"].append({**config["criteria"][0], "id": "skills", "name": "Skills", "priority": "low"})
        self.llm.complete.return_value = json.dumps({"criteria": {
            "experience": {"score": 80, "reason": "Relevant projects", "value": "Projects"},
            "skills": {"score": 20, "reason": "Limited overlap", "value": "Python"},
        }})
        score, breakdown, warnings = await self.processor.score({}, config)
        self.assertEqual(score, 65)
        self.assertEqual([item["weight"] for item in breakdown], [3, 1])
        self.assertEqual(warnings, [])

    async def test_unknown_missing_out_of_range_and_wrong_type_scores_fail(self):
        config = configuration()
        invalid = [
            {"other": {"score": 50, "reason": "Reason", "value": "text"}},
            {},
            {"experience": {"score": 101, "reason": "Reason", "value": "text"}},
            {"experience": {"score": "50", "reason": "Reason", "value": "text"}},
            {"experience": {"score": 50, "reason": "", "value": "text"}},
            {"experience": {"score": 50, "reason": "Reason", "value": 4}},
        ]
        for criteria in invalid:
            with self.subTest(criteria=criteria):
                self.llm.complete.return_value = json.dumps({"criteria": criteria})
                with self.assertRaises(ValueError):
                    await self.processor.score({}, config)

    async def test_missing_value_is_a_warning_not_low_score_rejection(self):
        self.llm.complete.return_value = json.dumps({"criteria": {
            "experience": {"score": 0, "reason": "No evidence", "value": None},
        }})
        score, _, warnings = await self.processor.score({}, configuration())
        self.assertEqual(score, 0)
        self.assertTrue(warnings)
        self.llm.complete.return_value = json.dumps({"criteria": {
            "experience": {"score": 0, "reason": "Limited experience", "value": "Beginner"},
        }})
        self.assertEqual((await self.processor.score({}, configuration()))[2], [])

    def test_configured_options_and_numbers_are_validated(self):
        criterion = SimpleNamespace(name="Availability", type="select", options=[SimpleNamespace(label="Now")])
        self.processor._validate_value(criterion, "Now")
        with self.assertRaises(ValueError):
            self.processor._validate_value(criterion, "Later")
        criterion.type = "multiselect"
        self.processor._validate_value(criterion, ["Now"])
        with self.assertRaises(ValueError):
            self.processor._validate_value(criterion, "Now")
        criterion.type = "number"
        self.processor._validate_value(criterion, 4)
        with self.assertRaises(ValueError):
            self.processor._validate_value(criterion, True)


class JobTests(unittest.IsolatedAsyncioTestCase):
    setUp = test_applications.ApplicationsQueryTests.setUp
    tearDown = test_applications.ApplicationsQueryTests.tearDown

    def worker(self, processor):
        @asynccontextmanager
        async def sessions():
            try:
                yield self.db
            finally:
                await self.db.rollback()
        return JobWorker(SimpleNamespace(sessions=sessions), processor)

    def test_supported_imports_and_invalid_collections(self):
        service = JobService(self.db)
        self.assertEqual(service.parse_upload("a.json", b'[{"name":"Awa"}]'), [{"name": "Awa"}])
        self.assertEqual(service.parse_upload("a.csv", b'Name,Email\nAwa,awa@example.com'), [{"Name": "Awa", "Email": "awa@example.com"}])
        for filename, content in [
            ("a.json", b'{}'), ("a.json", b'[]'), ("a.json", b'[1]'),
            ("a.json", b'broken'), ("a.json", b'[{"score": NaN}]'), ("a.csv", b'name,name\nA,B'),
            ("a.csv", b'name,email\nA'), ("a.txt", b'anything'),
            ("a.json", b'\xff'),
        ]:
            with self.subTest(content=content), self.assertRaises(HTTPException):
                service.parse_upload(filename, content)

    async def test_import_saves_each_row_and_continues_after_failure(self):
        program = self.session.get(Program, 1)
        program.configuration = configuration()
        self.session.commit()
        response = await JobService(self.db).create_import_job(1, "rows.json", [{"i": 0}, {"i": 1}, {"i": 2}], True)
        job_id = response["id"]

        async def normalize(raw, context):
            # The preceding application is already committed before the next call.
            count = len(self.session.scalars(select(ProgramApplication).where(ProgramApplication.import_job_id == job_id)).all())
            self.assertEqual(count, 0 if raw["i"] == 0 else 1)
            if raw["i"] == 1:
                raise ValueError("Bad extraction")
            return normalized(name=f"Person {raw['i']}")

        worker = self.worker(SimpleNamespace(normalize=normalize))
        await worker.run_once()
        job = self.session.get(ImportJob, job_id)
        self.assertEqual(job.status, "completed")
        self.assertEqual(job.next_row, 3)
        self.assertEqual(job.row_errors, [{"row": 2, "error": "Bad extraction"}])
        applications = self.session.scalars(select(ProgramApplication).where(ProgramApplication.import_job_id == job_id)).all()
        self.assertEqual([application.import_row for application in applications], [0, 2])
        self.assertEqual(len(self.session.scalars(select(ScoringJob)).all()), 2)

    async def test_interrupted_import_resumes_without_duplicates(self):
        response = await JobService(self.db).create_import_job(1, "rows.json", [{"i": 0}, {"i": 1}], False)
        processor = SimpleNamespace(normalize=AsyncMock(side_effect=[normalized(), asyncio.CancelledError()]))
        worker = self.worker(processor)
        with self.assertRaises(asyncio.CancelledError):
            await worker.run_once()
        job = self.session.get(ImportJob, response["id"])
        self.assertEqual(job.next_row, 1)
        self.assertEqual(job.status, "running")
        await worker.recover_interrupted_jobs()
        processor.normalize.side_effect = None
        processor.normalize.return_value = normalized("Second")
        await worker.run_once()
        applications = self.session.scalars(select(ProgramApplication).where(ProgramApplication.import_job_id == job.id)).all()
        self.assertEqual(len(applications), 2)
        self.assertEqual(job.status, "completed")

    async def test_scoring_success_and_failure_preserve_traceability(self):
        application = self.session.get(ProgramApplication, 1)
        application.normalized_data = {"experience": "Projects"}
        application.normalization_metadata = {"warnings": []}
        self.session.get(Program, 1).configuration = configuration()
        self.session.commit()
        service = JobService(self.db)
        await service.enqueue_scoring(1, 1)
        processor = SimpleNamespace(score=AsyncMock(return_value=(12.5, [{"score": 12.5}], [])))
        worker = self.worker(processor)
        await worker.run_once()
        self.assertEqual(application.score, 12.5)
        self.assertEqual(application.status, "ready")  # Low scores are not review/rejection states.
        await service.enqueue_scoring(1, 1)
        processor.score.side_effect = ValueError("Wrong criterion type")
        await worker.run_once()
        self.assertEqual(application.score, 12.5)
        self.assertEqual(application.score_breakdown, [{"score": 12.5}])
        self.assertEqual(application.status, "needs_review")
        jobs = self.session.scalars(select(ScoringJob).order_by(ScoringJob.id)).all()
        self.assertEqual([job.status for job in jobs], ["completed", "failed"])
        self.assertEqual(jobs[1].error, "Wrong criterion type")
        self.assertEqual(application.normalization_metadata["scoring_error"], "Wrong criterion type")

    async def test_scoring_captures_configuration_and_scopes_application(self):
        self.session.get(Program, 1).configuration = configuration()
        self.session.get(ProgramApplication, 1).normalized_data = {"experience": "Projects"}
        self.session.commit()
        await JobService(self.db).enqueue_scoring(1, 1)
        program = self.session.get(Program, 1)
        edited = deepcopy(program.configuration)
        edited["criteria"][0]["priority"] = "low"
        program.configuration = edited
        self.session.commit()
        job = self.session.scalar(select(ScoringJob))
        self.assertEqual(job.configuration["criteria"][0]["priority"], "high")
        with self.assertRaises(HTTPException):
            await JobService(self.db).enqueue_scoring(1, 4)

    async def test_changed_config_updates_pending_or_queues_after_running_job(self):
        program = self.session.get(Program, 1)
        program.configuration = configuration()
        self.session.get(ProgramApplication, 1).normalized_data = {"experience": "Projects"}
        self.session.commit()
        service = JobService(self.db)
        await service.enqueue_scoring(1, 1)
        first = self.session.scalar(select(ScoringJob))
        edited = deepcopy(program.configuration)
        edited["criteria"][0]["priority"] = "low"
        program.configuration = edited
        self.session.commit()
        self.assertEqual((await service.enqueue_scoring(1, 1))["queued"], 1)
        self.assertEqual(first.configuration["criteria"][0]["priority"], "low")
        first.status = "running"
        program.configuration = configuration()
        self.session.commit()
        self.assertEqual((await service.enqueue_scoring(1, 1))["queued"], 1)
        jobs = self.session.scalars(select(ScoringJob).order_by(ScoringJob.id)).all()
        self.assertEqual(len(jobs), 2)
        self.assertEqual(jobs[0].configuration["criteria"][0]["priority"], "low")
        self.assertEqual(jobs[1].configuration["criteria"][0]["priority"], "high")


class JobEndpointTests(unittest.IsolatedAsyncioTestCase):
    setUp = test_applications.ApplicationsQueryTests.setUp
    tearDown = test_applications.ApplicationsQueryTests.tearDown

    async def test_upload_is_persisted_before_202_and_errors_are_reported(self):
        import httpx
        from fastapi import FastAPI
        from jobs.api import router
        from shared.dependencies import get_db

        app = FastAPI()
        app.include_router(router, prefix="/api")
        app.state.worker = object()

        async def get_test_db():
            return self.db

        app.dependency_overrides[get_db] = get_test_db
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/jobs/imports", data={"program_id": "1", "auto_score": "false"}, files={"file": ("data.json", b'[{"name":"Awa"}]', "application/json")})
            self.assertEqual(response.status_code, 202)
            job = self.session.get(ImportJob, response.json()["id"])
            self.assertEqual(job.raw_rows, [{"name": "Awa"}])
            self.assertFalse(job.auto_score)
            history = await client.get("/api/jobs/imports")
            self.assertEqual(history.json()[0]["total"], 1)
            malformed = await client.post("/api/jobs/imports", data={"program_id": "1"}, files={"file": ("data.json", b'{}')})
            self.assertEqual(malformed.status_code, 422)
            app.state.worker = None
            unavailable = await client.post("/api/jobs/imports", data={"program_id": "1"}, files={"file": ("data.json", b'[]')})
            self.assertEqual(unavailable.status_code, 503)
