"""Merge applicant identity into applications and add durable processing jobs."""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "b73a6fb241f9"
branch_labels = None
depends_on = None


def timestamps():
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade():
    op.create_table(
        "import_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("program_id", sa.Integer(), sa.ForeignKey("programs.id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("raw_rows", sa.JSON(), nullable=False),
        sa.Column("next_row", sa.Integer(), server_default="0", nullable=False),
        sa.Column("row_errors", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("auto_score", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("status", sa.String(), server_default="pending", nullable=False),
        sa.Column("error", sa.String()),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        *timestamps(),
    )
    op.create_index("ix_import_jobs_status", "import_jobs", ["status"])
    for name in ("name", "email", "phone_number", "resume_url", "portfolio_url"):
        op.add_column("program_applications", sa.Column(name, sa.String()))
    # Preserve every existing application and its identity before dropping candidates.
    op.execute("""UPDATE program_applications a SET
        name=c.name, email=c.email, phone_number=c.phone_number,
        resume_url=c.resume_url, portfolio_url=c.portfolio_url
        FROM candidates c WHERE c.id=a.candidate_id""")
    op.alter_column("program_applications", "name", nullable=False)
    op.drop_constraint("program_applications_candidate_id_fkey", "program_applications", type_="foreignkey")
    op.drop_column("program_applications", "candidate_id")
    op.drop_table("candidates")
    op.add_column("program_applications", sa.Column("import_job_id", sa.Integer()))
    op.add_column("program_applications", sa.Column("import_row", sa.Integer()))
    op.create_foreign_key("fk_application_import_job", "program_applications", "import_jobs", ["import_job_id"], ["id"])
    op.create_unique_constraint("uq_application_import_row", "program_applications", ["import_job_id", "import_row"])
    for name in ("raw_data", "normalized_data", "normalization_metadata", "score_breakdown"):
        op.add_column("program_applications", sa.Column(name, sa.JSON()))
    op.alter_column("program_applications", "score", type_=sa.Float(), postgresql_using="score::double precision")
    op.drop_column("program_applications", "rank")
    op.create_table(
        "scoring_jobs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("program_id", sa.Integer(), sa.ForeignKey("programs.id"), nullable=False),
        sa.Column("application_id", sa.Integer(), sa.ForeignKey("program_applications.id"), nullable=False),
        sa.Column("configuration", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(), server_default="pending", nullable=False),
        sa.Column("error", sa.String()),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        *timestamps(),
    )
    op.create_index("ix_scoring_jobs_status", "scoring_jobs", ["status"])
    op.create_index("ix_scoring_jobs_application_id", "scoring_jobs", ["application_id"])


def downgrade():
    # Cross-program candidate identities cannot be reconstructed after consolidation.
    raise RuntimeError("Restore a database backup to undo the application identity merge.")
