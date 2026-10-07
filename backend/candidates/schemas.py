from pydantic import BaseModel, ConfigDict

class CandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str
    phone_number: str | None
    resume_url: str | None
    portfolio_url: str | None


