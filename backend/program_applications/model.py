from sqlalchemy import ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from shared.model import Base


class ProgramApplication(Base):
    __tablename__ = "program_applications"
    __table_args__ = (UniqueConstraint("import_job_id", "import_row", name="uq_application_import_row"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    program_id: Mapped[int] = mapped_column(ForeignKey("programs.id"))
    name: Mapped[str]
    email: Mapped[str | None]
    phone_number: Mapped[str | None]
    resume_url: Mapped[str | None]
    portfolio_url: Mapped[str | None]
    import_job_id: Mapped[int | None] = mapped_column(ForeignKey("import_jobs.id"))
    import_row: Mapped[int | None]
    raw_data: Mapped[dict | None] = mapped_column(JSON)
    normalized_data: Mapped[dict | None] = mapped_column(JSON)
    normalization_metadata: Mapped[dict | None] = mapped_column(JSON)
    score_breakdown: Mapped[list[dict] | None] = mapped_column(JSON)
    score: Mapped[float | None]
    status: Mapped[str] = mapped_column(default="received", server_default="received")
