import asyncio
import logging
from copy import deepcopy
from datetime import datetime, timezone

from openai import APIError
from pydantic import ValidationError
from sqlalchemy import select, text, update

from jobs.model import ImportJob, ScoringJob
from jobs.processing import ApplicationProcessor
from program_applications.model import ProgramApplication
from programs.model import Program

logger = logging.getLogger(__name__)


class JobWorker:
    def __init__(self, database, processor: ApplicationProcessor):
        self.database = database
        self.processor = processor

    async def run(self):
        # A session-level PostgreSQL lock elects one worker across API processes.
        # Keep this connection until shutdown; processing uses separate sessions.
        async with self.database.engine.connect() as connection:
            acquired = False
            try:
                while not acquired:
                    acquired = bool(await connection.scalar(text("SELECT pg_try_advisory_lock(742831)")))
                    await connection.commit()
                    if not acquired:
                        await asyncio.sleep(2)
                await self.recover_interrupted_jobs()
                while True:
                    try:
                        worked = await self.run_once()
                    except Exception:
                        logger.exception("Job worker iteration failed")
                        worked = False
                    if not worked:
                        await asyncio.sleep(2)
            finally:
                if acquired:
                    await connection.execute(text("SELECT pg_advisory_unlock(742831)"))
                    await connection.commit()

    async def recover_interrupted_jobs(self):
        async with self.database.sessions() as db:
            # Only the elected worker can recover jobs; import checkpoints prevent duplicates.
            for model in (ImportJob, ScoringJob):
                await db.execute(update(model).where(model.status == "running").values(status="pending"))
            await db.commit()

    async def run_once(self):
        import_id = await self._claim(ImportJob)
        if import_id is not None:
            await self._process_job(ImportJob, import_id, self.process_import)
            return True
        scoring_id = await self._claim(ScoringJob)
        if scoring_id is not None:
            await self._process_job(ScoringJob, scoring_id, self.process_scoring)
            return True
        return False

    async def _process_job(self, model, job_id, process):
        try:
            await process(job_id)
        except Exception as error:
            async with self.database.sessions() as db:
                job = await db.get(model, job_id)
                job.status = "failed"
                job.error = self._error_message(error)
                job.finished_at = datetime.now(timezone.utc)
                await db.commit()

    async def _claim(self, model):
        async with self.database.sessions() as db:
            job = (await db.execute(
                select(model).where(model.status == "pending")
                .order_by(model.id).limit(1).with_for_update(skip_locked=True)
            )).scalar_one_or_none()
            if job is None:
                return None
            job.status = "running"
            job.started_at = datetime.now(timezone.utc)
            job.error = None
            await db.commit()
            return job.id

    async def process_import(self, job_id: int):
        async with self.database.sessions() as db:
            job = await db.get(ImportJob, job_id)
            program = await db.get(Program, job.program_id)
            context = {"name": program.name, "description": program.description}
            rows, start = job.raw_rows, job.next_row
            await db.commit()  # No open database transaction during network calls.
            for position in range(start, len(rows)):
                try:
                    normalized = await self.processor.normalize(rows[position], context)
                    metadata = {**normalized["metadata"], "source": job.filename}
                    application = ProgramApplication(
                        program_id=job.program_id, import_job_id=job_id, import_row=position,
                        name=normalized["name"], email=normalized["email"],
                        phone_number=normalized["phone"], resume_url=normalized["cv_url"],
                        portfolio_url=normalized["portfolio_url"], raw_data=rows[position],
                        normalized_data=normalized["facts"], normalization_metadata=metadata,
                        status="needs_review" if metadata["warnings"] else "received",
                    )
                    db.add(application)
                    await db.flush()
                    # New applications use the current configuration at enqueue time.
                    program = await db.get(Program, job.program_id, populate_existing=True)
                    configuration = deepcopy(program.configuration or {})
                    if job.auto_score and configuration.get("criteria"):
                        db.add(ScoringJob(
                            program_id=job.program_id, application_id=application.id,
                            configuration=deepcopy(configuration),
                        ))
                    # The application, optional scoring job and checkpoint commit together.
                    job.next_row = position + 1
                    await db.commit()
                except Exception as error:
                    await db.rollback()
                    job = await db.get(ImportJob, job_id)
                    job.row_errors = [*job.row_errors, {
                        "row": position + 1, "error": self._error_message(error),
                    }]
                    job.next_row = position + 1
                    await db.commit()
            job.status = "completed"  # Completed can contain row failures, shown in progress.
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()

    async def process_scoring(self, job_id: int):
        async with self.database.sessions() as db:
            job = await db.get(ScoringJob, job_id)
            application = await db.get(ProgramApplication, job.application_id)
            normalized = {
                "name": application.name, "facts": application.normalized_data,
                "metadata": application.normalization_metadata,
            }
            configuration = job.configuration
            application.status = "processing"
            await db.commit()
            try:
                score, breakdown, warnings = await self.processor.score(normalized, configuration)
                # Persist only validated evaluations; failed rescoring retains the prior score.
                application.score = score
                application.score_breakdown = breakdown
                metadata = deepcopy(application.normalization_metadata or {})
                metadata["scoring_warnings"] = warnings
                metadata.pop("scoring_error", None)
                application.normalization_metadata = metadata
                application.status = "needs_review" if metadata.get("warnings") or warnings else "ready"
                job.status = "completed"
            except Exception as error:
                job.error = self._error_message(error)
                job.status = "failed"
                metadata = deepcopy(application.normalization_metadata or {})
                metadata["scoring_error"] = job.error
                application.normalization_metadata = metadata
                application.status = "needs_review"
            job.finished_at = datetime.now(timezone.utc)
            await db.commit()

    def _error_message(self, error: Exception):
        if isinstance(error, ValidationError):
            # Validation messages are useful; raw inputs need not be duplicated in errors.
            return "; ".join(
                f"{'.'.join(map(str, item['loc']))}: {item['msg']}"
                for item in error.errors(include_input=False)
            )
        if isinstance(error, APIError):
            return "Le fournisseur LLM n’a pas pu traiter la demande. Relancez le traitement."
        return str(error)
