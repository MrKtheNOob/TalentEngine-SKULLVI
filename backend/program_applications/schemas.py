from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict
from candidates.schemas import CandidateResponse

ProcessingStatus = Literal["received", "processing", "ready", "needs_review", "failed"]

class ProgramApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    program_id: int
    candidate_id: int
    status: ProcessingStatus
    score: int | None
    rank: int | None

    created_at: datetime
    candidate: CandidateResponse
