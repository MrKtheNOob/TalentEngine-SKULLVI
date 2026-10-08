from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.model import Base

if TYPE_CHECKING:
    from program_applications.model import ProgramApplication


class ImportJob(Base):
    __tablename__ = "import_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    filename: Mapped[str]
    # Persist parsed submissions, not a path to an ephemeral uploaded file.
    raw_rows: Mapped[list[dict]] = mapped_column(JSON)
    next_row: Mapped[int] = mapped_column(default=0, server_default="0")
    row_errors: Mapped[list[dict]] = mapped_column(JSON, default=list, server_default="[]")
    auto_score: Mapped[bool] = mapped_column(default=True, server_default="true")
    status: Mapped[str] = mapped_column(default="pending", server_default="pending", index=True)
    error: Mapped[str | None]
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    applications: Mapped[list["ProgramApplication"]] = relationship()


class ScoringJob(Base):
    __tablename__ = "scoring_jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    application_id: Mapped[int] = mapped_column(ForeignKey("program_applications.id"), index=True)
    # An execution snapshot ensures edits cannot change an in-flight evaluation.
    configuration: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(default="pending", server_default="pending", index=True)
    error: Mapped[str | None]
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
