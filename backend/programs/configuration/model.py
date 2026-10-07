from sqlalchemy import JSON, text
from sqlalchemy.orm import Mapped, mapped_column


class ProgramConfigurationMixin:
    """Configuration remains JSON on the program row; no separate table."""
    configuration: Mapped[dict | None] = mapped_column(
        JSON, default=None, server_default=text("'{}'::json"),
    )
