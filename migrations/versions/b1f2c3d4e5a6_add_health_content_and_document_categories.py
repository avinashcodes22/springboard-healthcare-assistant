"""add health content, document categories and worker approval

Revision ID: b1f2c3d4e5a6
Revises: 7a24941a8cfd
Create Date: 2026-11-12 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b1f2c3d4e5a6"
down_revision: Union[str, Sequence[str], None] = "7a24941a8cfd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add additive Module 1 schema changes."""
    op.add_column(
        "users",
        sa.Column(
            "is_approved",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.execute("UPDATE users SET is_approved = is_active")
    op.alter_column("users", "is_approved", server_default=None)

    op.add_column(
        "medical_documents",
        sa.Column(
            "category",
            sa.String(length=50),
            nullable=False,
            server_default="medical_report",
        ),
    )
    op.alter_column("medical_documents", "category", server_default=None)
    op.create_index(
        op.f("ix_medical_documents_category"),
        "medical_documents",
        ["category"],
        unique=False,
    )
    op.create_check_constraint(
        "ck_medical_documents_valid_category",
        "medical_documents",
        "category IN ('prescription', 'discharge_summary', "
        "'medical_report')",
    )

    op.create_table(
        "health_contents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("language", sa.String(length=20), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_health_contents_valid_status",
        ),
        sa.CheckConstraint(
            "language IN ('en', 'te', 'hi', 'ta', 'kn', 'ml', 'mr', "
            "'gu', 'bn')",
            name="ck_health_contents_valid_language",
        ),
        sa.ForeignKeyConstraint(
            ["author_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_health_contents_id"),
        "health_contents",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_health_contents_category"),
        "health_contents",
        ["category"],
        unique=False,
    )
    op.create_index(
        op.f("ix_health_contents_language"),
        "health_contents",
        ["language"],
        unique=False,
    )
    op.create_index(
        op.f("ix_health_contents_author_id"),
        "health_contents",
        ["author_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_health_contents_status"),
        "health_contents",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    """Remove Module 1 additions without touching existing records."""
    op.drop_index(
        op.f("ix_health_contents_status"),
        table_name="health_contents",
    )
    op.drop_index(
        op.f("ix_health_contents_author_id"),
        table_name="health_contents",
    )
    op.drop_index(
        op.f("ix_health_contents_language"),
        table_name="health_contents",
    )
    op.drop_index(
        op.f("ix_health_contents_category"),
        table_name="health_contents",
    )
    op.drop_index(
        op.f("ix_health_contents_id"),
        table_name="health_contents",
    )
    op.drop_table("health_contents")

    op.drop_constraint(
        "ck_medical_documents_valid_category",
        "medical_documents",
        type_="check",
    )
    op.drop_index(
        op.f("ix_medical_documents_category"),
        table_name="medical_documents",
    )
    op.drop_column("medical_documents", "category")

    op.drop_column("users", "is_approved")
