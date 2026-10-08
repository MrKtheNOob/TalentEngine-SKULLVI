import csv
import io
import json
from copy import deepcopy

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from jobs.model import ImportJob, ScoringJob
from program_applications.model import ProgramApplication
from programs.model import Program
from programs.configuration.schemas import ProgramConfigurationUpdate


class JobService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def parse_upload(self, filename: str, content: bytes) -> list[dict]:
        try:
            text = content.decode("utf-8-sig")
            match filename.rsplit(".", 1)[-1].lower():
                case "json":
                    rows = json.loads(text, parse_constant=self._reject_nonfinite_number)
                    if not isinstance(rows, list) or not all(isinstance(row, dict) for row in rows):
                        raise ValueError("Le JSON doit contenir une liste d’objets.")
                case "csv":
                    reader = csv.DictReader(io.StringIO(text), strict=True)
                    headers = reader.fieldnames
                    if not headers or any(not header.strip() for header in headers) or len(set(headers)) != len(headers):
                        raise ValueError("Le CSV doit avoir des en-têtes distincts et non vides.")
                    rows = list(reader)
                    if any(None in row or None in row.values() for row in rows):
                        raise ValueError("Chaque ligne CSV doit correspondre aux colonnes de l’en-tête.")
                case _:
                    raise ValueError("Choisissez un fichier CSV ou JSON.")
            if not rows:
                raise ValueError("Le fichier ne contient aucune candidature.")
            if len(rows) > 1000:
                raise ValueError("Un import est limité à 1 000 candidatures.")
            return rows
        except (UnicodeDecodeError, ValueError, csv.Error) as error:
            raise HTTPException(status_code=422, detail=str(error)) from error

    def _reject_nonfinite_number(self, value):
        # Python accepts NaN/Infinity by default, but JSON and PostgreSQL do not.
        raise ValueError(f"Nombre JSON invalide : {value}.")

    async def create_import_job(self, program_id: int, filename: str, rows: list[dict], auto_score: bool):
        await self._program(program_id)
        job = ImportJob(program_id=program_id, filename=filename, raw_rows=rows, auto_score=auto_score)
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return self.import_response(job)

    async def list_imports_jobs(self, program_id: int | None = None):
        query = select(ImportJob).order_by(ImportJob.created_at.desc(), ImportJob.id.desc())
        if program_id is not None:
            query = query.where(ImportJob.program_id == program_id)
        jobs = (await self.db.execute(query)).scalars().all()
        return [self.import_response(job) for job in jobs]

    async def get_import_jobs(self, job_id: int):
        job = await self.db.get(ImportJob, job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="Import introuvable.")
        return self.import_response(job)

    async def enqueue_scoring(self, program_id: int, application_id: int | None = None):
        program = await self._program(program_id)
        if not (program.configuration or {}).get("criteria"):
            raise HTTPException(status_code=409, detail="Enregistrez des critères avant de lancer l’évaluation.")
        configuration = ProgramConfigurationUpdate.model_validate(program.configuration)
        query = select(ProgramApplication).where(ProgramApplication.program_id == program_id)
        if application_id is not None:
            query = query.where(ProgramApplication.id == application_id)
        applications = (await self.db.execute(query)).scalars().all()
        if application_id is not None and not applications:
            raise HTTPException(status_code=404, detail="Candidature introuvable.")
        active_jobs = (await self.db.execute(
            select(ScoringJob).where(
                ScoringJob.program_id == program_id, ScoringJob.status.in_(["pending", "running"]),
            )
        )).scalars().all()
        snapshot = configuration.model_dump(mode="json")
        count = 0
        for application in applications:
            if application.normalized_data is None:
                continue
            active = [job for job in active_jobs if job.application_id == application.id]
            pending = next((job for job in active if job.status == "pending"), None)
            if pending is not None:
                if pending.configuration == snapshot:
                    continue
                pending.configuration = deepcopy(snapshot)
            else:
                if any(job.configuration == snapshot for job in active):
                    continue
                # A changed config gets a follow-up job if an old evaluation is running.
                self.db.add(ScoringJob(
                    program_id=program_id, application_id=application.id,
                    configuration=deepcopy(snapshot),
                ))
            count += 1
        await self.db.commit()
        return {
            "message": f"{count} candidature(s) ajoutée(s) à la file d’évaluation. "
                       f"{len(applications) - count} déjà en traitement ou sans données normalisées.",
            "queued": count,
        }

    async def list_scoring_jobs(self, program_id: int | None = None):
        query = select(ScoringJob).order_by(ScoringJob.created_at.desc(), ScoringJob.id.desc())
        if program_id is not None:
            query = query.where(ScoringJob.program_id == program_id)
        return (await self.db.execute(query)).scalars().all()

    def import_response(self, job: ImportJob):
        return {
            "id": job.id, "program_id": job.program_id, "filename": job.filename,
            "status": job.status, "total": len(job.raw_rows), "processed": job.next_row,
            "successful": job.next_row - len(job.row_errors), "failed": len(job.row_errors),
            "auto_score": job.auto_score, "row_errors": job.row_errors, "error": job.error,
            "created_at": job.created_at, "finished_at": job.finished_at,
        }

    async def _program(self, program_id: int):
        # Serialize enqueue requests for a program without holding a lock during LLM calls.
        program = (await self.db.execute(
            select(Program).where(Program.id == program_id).with_for_update()
        )).scalar_one_or_none()
        if program is None:
            raise HTTPException(status_code=404, detail="Programme introuvable.")
        return program
