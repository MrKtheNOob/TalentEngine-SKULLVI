from typing import Literal
import unicodedata

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models import Program
from jobs.model import ScoringJob
from program_applications.model import ProgramApplication
from program_applications.schemas import ProgramApplicationResponse, ProcessingStatus
from programs.schemas import ProgramCreate, ProgramUpdate


class ProgramService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_programs(
        self,
        sort: Literal["updated", "name", "candidates"] = "updated",
        search: str = "",
    ):
        candidates_count = func.count(ProgramApplication.id)
        query = (
            select(
                Program.id, Program.name, Program.description, Program.updated_at,
                candidates_count.label("candidates_count"),
            )
            .outerjoin(Program.applications)
            .group_by(Program.id)
        )
        name_order = func.lower(Program.name).asc()
        match sort:
            case 'name':
                query = query.order_by(name_order, Program.id)
            case 'candidates':
                query = query.order_by(candidates_count.desc(), name_order, Program.id)
            case 'updated':
                query = query.order_by(Program.updated_at.desc(), name_order, Program.id)
        result = await self.db.execute(query)
        programs = result.mappings().all()
        # Accent-insensitive search in Python keeps the small MVP free of DB extensions.
        term = self._normalize_name(search.strip())
        if term:
            programs = [program for program in programs if term in self._normalize_name(program['name'])]
        return programs

    async def get_program(self, program_id: int):
        result = await self.db.execute(
            select(
                Program.id, Program.name, Program.description, Program.updated_at,
                func.count(ProgramApplication.id).label("candidates_count"),
            )
            .outerjoin(Program.applications)
            .where(Program.id == program_id)
            .group_by(Program.id)
        )
        program = result.mappings().first()
        if not program:
            raise HTTPException(status_code=404, detail='Program not found')
        return program

    async def get_program_applications(
        self,
        program_id: int,
        status: ProcessingStatus | Literal["all"] = "all",
        sort: Literal["score", "recent"] = "score",
        search: str = "",
    ):
        await self.get_program(program_id)
        query = self._application_query(program_id)
        if status != 'all':
            query = query.where(ProgramApplication.status == status)
        match sort:
            case 'recent':
                query = query.order_by(ProgramApplication.created_at.desc(), ProgramApplication.id)
            case 'score':
                query = query.order_by(ProgramApplication.score.desc().nulls_last(), ProgramApplication.id)
        result = await self.db.execute(query)
        applications = [self._application_response(row) for row in result.all()]
        term = self._normalize_name(search.strip())
        if term:
            applications = [
                application for application in applications
                if term in self._normalize_name(
                    f"{application.name} {application.email or ''}"
                )
            ]
        return applications

    async def get_program_application(self, program_id: int, application_id: int):
        await self.get_program(program_id)
        result = await self.db.execute(
            self._application_query(program_id).where(ProgramApplication.id == application_id)
        )
        row = result.one_or_none()
        if row is None:
            raise HTTPException(status_code=404, detail='Application not found')
        return self._application_response(row)

    async def get_application_detail(self, program_id: int, application_id: int):
        return {
            "program": await self.get_program(program_id),
            "application": await self.get_program_application(program_id, application_id),
        }

    async def delete_application(self, program_id: int, application_id: int):
        # Enqueue requests use this same program lock, preventing new scoring jobs
        # from being added between checking jobs and deleting the application.
        program = (await self.db.execute(
            select(Program).where(Program.id == program_id).with_for_update()
        )).scalar_one_or_none()
        if program is None:
            raise HTTPException(status_code=404, detail="Programme introuvable.")
        application = (await self.db.execute(select(ProgramApplication).where(
            ProgramApplication.id == application_id, ProgramApplication.program_id == program_id,
        ))).scalar_one_or_none()
        if application is None:
            raise HTTPException(status_code=404, detail="Candidature introuvable.")
        # Lock pending jobs before the worker claims them. Already-running work
        # must finish first; this MVP does not introduce job cancellation.
        jobs = (await self.db.execute(select(ScoringJob).where(
            ScoringJob.application_id == application_id,
        ).with_for_update())).scalars().all()
        if any(job.status == "running" for job in jobs):
            raise HTTPException(status_code=409, detail="Une évaluation est en cours. Attendez sa fin avant de supprimer cette candidature.")
        await self.db.execute(delete(ScoringJob).where(ScoringJob.application_id == application_id))
        await self.db.execute(delete(ProgramApplication).where(ProgramApplication.id == application_id))
        # Keep import history/checkpoints: processed rows are not imported again.
        await self.db.commit()

    async def create_program(self, attributes: ProgramCreate):
        program = Program(**attributes.model_dump())
        self.db.add(program)
        await self.db.commit()
        await self.db.refresh(program)
        return await self.get_program(program.id)

    async def update_program(self, program_id: int, attributes: ProgramUpdate):
        program = await self.db.get(Program, program_id)
        if program is None:
            raise HTTPException(status_code=404, detail='Program not found')
        for field, value in attributes.model_dump(exclude_unset=True).items():
            setattr(program, field, value)
        await self.db.commit()
        return await self.get_program(program_id)

    async def get_program_overview(self, program_id: int):
        await self.get_program(program_id)
        result = await self.db.execute(
            select(
                func.count(ProgramApplication.id).label("total"),
                func.count(ProgramApplication.id)
                .filter(ProgramApplication.status == "needs_review").label("review"),
                func.count(ProgramApplication.id)
                .filter(ProgramApplication.status.in_(["received", "processing"]))
                .label("processing"),
                func.count(ProgramApplication.id)
                .filter(ProgramApplication.status == "failed").label("failed"),
            ).where(ProgramApplication.program_id == program_id)
        )
        return result.mappings().one()

    def _normalize_name(self, value: str) -> str:
        return "".join(
            character for character in unicodedata.normalize("NFD", value)
            if not unicodedata.combining(character)
        ).lower()


    def _application_query(self, program_id: int):
        # Compute ranking before applying filters so ranks remain global to the program.
        ranked = (
            select(
                ProgramApplication.id,
                func.row_number().over(
                    order_by=(ProgramApplication.score.desc(), ProgramApplication.id),
                ).label("rank"),
            )
            .where(
                ProgramApplication.program_id == program_id,
                ProgramApplication.score.is_not(None),
            )
            .subquery()
        )
        return (
            select(ProgramApplication, ranked.c.rank)
            .outerjoin(ranked, ranked.c.id == ProgramApplication.id)
            .where(ProgramApplication.program_id == program_id)
        )


    def _application_response(self, row) -> ProgramApplicationResponse:
        application, rank = row
        return ProgramApplicationResponse.model_validate(application).model_copy(update={'rank': rank})
