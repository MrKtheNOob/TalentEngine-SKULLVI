from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from program_applications.schemas import ProgramApplicationResponse, ProcessingStatus
from programs.configuration.api import router as configuration_router
from programs.schemas import (
    ApplicationDetailResponse,
    ProgramCreate,
    ProgramOverviewResponse,
    ProgramResponse,
    ProgramUpdate,
)
from programs.service import ProgramService
from shared.dependencies import get_db

router = APIRouter(prefix="/programs", tags=["programs"])
router.include_router(configuration_router)


async def get_program_service(db: AsyncSession = Depends(get_db)) -> ProgramService:
    return ProgramService(db)


ProgramServiceDependency = Annotated[ProgramService, Depends(get_program_service)]



@router.get('/', response_model=list[ProgramResponse])
async def get_programs(
    service: ProgramServiceDependency,
    sort: Literal["updated", "name", "candidates"] = "updated",
    search: str = "",
):
    return await service.get_programs(sort=sort, search=search)


@router.get('/{program_id}', response_model=ProgramResponse)
async def get_program(program_id: int, service: ProgramServiceDependency):
    return await service.get_program(program_id=program_id)


@router.get('/{program_id}/applications', response_model=list[ProgramApplicationResponse])
async def get_program_applications(
    program_id: int,
    service: ProgramServiceDependency,
    status: ProcessingStatus | Literal["all"] = "all",
    sort: Literal["score", "recent"] = "score",
    search: str = "",
):
    return await service.get_program_applications(
        program_id=program_id, status=status, sort=sort, search=search,
    )


@router.get('/{program_id}/applications/{application_id}', response_model=ProgramApplicationResponse)
async def get_program_application(
    program_id: int, application_id: int, service: ProgramServiceDependency,
):
    return await service.get_program_application(program_id=program_id, application_id=application_id)


@router.get('/{program_id}/applications/{application_id}/detail', response_model=ApplicationDetailResponse)
async def get_application_detail(
    program_id: int, application_id: int, service: ProgramServiceDependency,
):
    return await service.get_application_detail(program_id, application_id)


@router.delete('/{program_id}/applications/{application_id}', status_code=204)
async def delete_application(program_id: int, application_id: int, service: ProgramServiceDependency):
    await service.delete_application(program_id, application_id)
    return Response(status_code=204)


@router.post('/', response_model=ProgramResponse, status_code=201)
async def create_program(attributes: ProgramCreate, service: ProgramServiceDependency):
    return await service.create_program(attributes=attributes)


@router.patch('/{program_id}', response_model=ProgramResponse)
async def update_program(
    program_id: int, attributes: ProgramUpdate, service: ProgramServiceDependency,
):
    return await service.update_program(program_id=program_id, attributes=attributes)


@router.get('/{program_id}/overview', response_model=ProgramOverviewResponse)
async def get_program_overview(program_id: int, service: ProgramServiceDependency):
    return await service.get_program_overview(program_id=program_id)
