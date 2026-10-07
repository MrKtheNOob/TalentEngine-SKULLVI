"""Remove program lifecycle status; application processing states remain."""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("programs", "is_active")


def downgrade() -> None:
    op.add_column("programs", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
