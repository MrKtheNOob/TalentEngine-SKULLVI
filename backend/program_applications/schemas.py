from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict

ProcessingStatus = Literal["received", "processing", "ready", "needs_review", "failed"]


class ProgramApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    program_id: int
    name: str
    email: str | None
    phone_number: str | None
    resume_url: str | None
    portfolio_url: str | None
    status: ProcessingStatus
    score: float | None
    # Ranking is computed by the query, not stored on the application.
    rank: int | None = None
    created_at: datetime
    normalized_data: dict | None = None
    normalization_metadata: dict | None = None
    score_breakdown: list[dict] | None = None
