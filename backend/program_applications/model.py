from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.model import Base

if TYPE_CHECKING:
    from candidates.model import Candidate


class ProgramApplication(Base):
    __tablename__ = "program_applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"))
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    score: Mapped[int | None] = mapped_column(nullable=True)
    rank: Mapped[int | None] = mapped_column(nullable=True)
    
    status: Mapped[str] = mapped_column(default="received", server_default="received")

    candidate: Mapped["Candidate"] = relationship()
