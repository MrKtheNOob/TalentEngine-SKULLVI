from typing import TYPE_CHECKING
from sqlalchemy.orm import Mapped, mapped_column, relationship

from shared.model import Base
from programs.configuration.model import ProgramConfigurationMixin

if TYPE_CHECKING:
    from program_applications.model import ProgramApplication


class Program(ProgramConfigurationMixin, Base):
    __tablename__ = "programs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    description: Mapped[str | None]
    applications: Mapped[list["ProgramApplication"]] = relationship(
        cascade="all, delete-orphan",
    )
