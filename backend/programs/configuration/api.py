from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from models import Program
from shared.dependencies import get_db
from jobs.job_service import JobService
from jobs.api import require_worker
from .schemas import ProgramConfigurationResponse, ProgramConfigurationUpdate, RescoreResponse

router = APIRouter(prefix='/{program_id}/configuration', tags=['program configuration'])


async def find_program(program_id: int, db: AsyncSession) -> Program:
    program = await db.get(Program, program_id)
    if program is None:
        raise HTTPException(status_code=404, detail='Program not found')
    return program


@router.get('', response_model=ProgramConfigurationResponse)
async def get_configuration(program_id: int, db: AsyncSession = Depends(get_db)):
    program = await find_program(program_id, db)
    return {'programId': program_id, 'criteria': (program.configuration or {}).get('criteria', [])}


@router.put('', response_model=ProgramConfigurationResponse)
async def save_configuration(program_id: int, configuration: ProgramConfigurationUpdate, db: AsyncSession = Depends(get_db)):
    if configuration.programId != program_id:
        raise HTTPException(status_code=422, detail='Configuration programId must match the URL.')
    program = await find_program(program_id, db)
    program.configuration = configuration.model_dump(mode='json')
    await db.commit()
    return configuration


@router.post('/rescore', response_model=RescoreResponse, status_code=202, dependencies=[Depends(require_worker)])
async def rescore_applications(program_id: int, db: AsyncSession = Depends(get_db)):
    return await JobService(db).enqueue_scoring(program_id)
