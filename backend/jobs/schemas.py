from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, JsonValue, field_validator
from urllib.parse import urlparse

JobStatus = Literal["pending", "running", "completed", "failed"]


class ImportJobResponse(BaseModel):
    id: int
    program_id: int
    filename: str
    status: JobStatus
    total: int
    processed: int
    successful: int
    failed: int
    auto_score: bool
    row_errors: list[dict]
    error: str | None
    created_at: datetime
    finished_at: datetime | None


class ScoringJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    program_id: int
    application_id: int
    status: JobStatus
    error: str | None
    created_at: datetime
    finished_at: datetime | None


class NormalizationMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")
    confidence: float = Field(ge=0, le=1, strict=True)
    warnings: list[str]


class NormalizationOutput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)
    name: str | None = Field(min_length=1)
    email: str | None
    phone: str | None
    cv_url: str | None
    portfolio_url: str | None
    facts: dict[str, JsonValue]
    metadata: NormalizationMetadata

    @field_validator("cv_url", "portfolio_url")
    @classmethod
    def validate_link(cls, value):
        if value is not None:
            url = urlparse(value)
            if url.scheme != "https" or not url.hostname or url.username or url.password:
                raise ValueError("Les documents et portfolios doivent utiliser un lien HTTPS.")
        return value


class CriterionScore(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, allow_inf_nan=False)
    score: float = Field(ge=0, le=100, strict=True)
    reason: str = Field(min_length=1)
    # The interpreted value lets us validate against the configured field type.
    value: JsonValue


class ScoringOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    criteria: dict[str, CriterionScore]
