from program_applications.schemas import ProgramApplicationResponse
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

class ProgramResponse(BaseModel):
    id: int
    name: str
    description: str | None
    updated_at: datetime
    candidates_count: int


class ProgramUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError("Program name must not be blank.")
        return value.strip()



class ProgramOverviewResponse(BaseModel):
    total: int
    review: int
    processing: int
    failed: int



class ProgramCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1)
    description: str | None = None

    @field_validator("name", mode="before")
    @classmethod
    def validate_name(cls, value):
        return ProgramUpdate.validate_name(value)


class CandidateDetailResponse(BaseModel):
    program: ProgramResponse
    application: ProgramApplicationResponse
