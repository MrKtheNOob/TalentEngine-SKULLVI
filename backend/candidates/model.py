

from sqlalchemy.orm import Mapped, mapped_column

from shared.model import Base


class Candidate(Base):
    __tablename__ = "candidates"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str]
    phone_number: Mapped[str | None]
    resume_url: Mapped[str | None]
    portfolio_url: Mapped[str | None]
