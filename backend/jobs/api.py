from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from jobs.job_service import JobService
from jobs.schemas import ImportJobResponse, ScoringJobResponse
from programs.configuration.schemas import RescoreResponse
from shared.dependencies import get_db

router = APIRouter(prefix="/jobs", tags=["jobs"])


async def get_job_service(db: AsyncSession = Depends(get_db)):
    return JobService(db)


async def require_worker(request: Request):
    if request.app.state.worker is None:
        raise HTTPException(status_code=503, detail="Configurez OPENROUTER_API_KEY et OPENROUTER_MODEL pour activer le traitement.")


JobServiceDependency = Annotated[JobService, Depends(get_job_service)]


@router.post("/imports", response_model=ImportJobResponse, status_code=202, dependencies=[Depends(require_worker)])
async def create_import(
    service: JobServiceDependency,
    file: UploadFile = File(),
    program_id: int = Form(),
    auto_score: bool = Form(True),
):
    # Parse now and commit raw rows before acknowledging the upload.
    content = await file.read(10 * 1024 * 1024 + 1)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Le fichier dépasse la limite de 10 Mo.")
    filename = file.filename or ""
    rows = service.parse_upload(filename, content)
    return await service.create_import_job(program_id, filename, rows, auto_score)


@router.get("/imports", response_model=list[ImportJobResponse])
async def list_imports(service: JobServiceDependency, program_id: int | None = None):
    return await service.list_imports_jobs(program_id)


@router.get("/imports/{job_id}", response_model=ImportJobResponse)
async def get_import(job_id: int, service: JobServiceDependency):
    return await service.get_import_jobs(job_id)


@router.get("/scoring", response_model=list[ScoringJobResponse])
async def list_scoring(service: JobServiceDependency, program_id: int | None = None):
    return await service.list_scoring_jobs(program_id)


@router.post("/scoring/{program_id}/{application_id}", response_model=RescoreResponse, status_code=202, dependencies=[Depends(require_worker)])
async def score_application(program_id: int, application_id: int, service: JobServiceDependency):
    return await service.enqueue_scoring(program_id, application_id)
