"""add administrator role, patient assignments and follow-ups

Revision ID: c4d5e6f7a8b9
Revises: b1f2c3d4e5a6
Create Date: 2026-11-13 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, Sequence[str], None] = "b1f2c3d4e5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add additive three-role collaboration schema."""
    op.drop_constraint(
        "ck_users_valid_role",
        "users",
        type_="check",
    )
    op.create_check_constraint(
        "ck_users_valid_role",
        "users",
        "role IN ('patient', 'healthcare_worker', 'administrator')",
    )

    op.create_table(
        "worker_patient_assignments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("worker_id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("assigned_by_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.CheckConstraint(
            "worker_id <> patient_id",
            name="ck_worker_patient_assignments_distinct_users",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["worker_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "worker_id",
            "patient_id",
            name="uq_worker_patient_assignments_pair",
        ),
    )
    op.create_index(
        op.f("ix_worker_patient_assignments_id"),
        "worker_patient_assignments",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_worker_patient_assignments_worker_id"),
        "worker_patient_assignments",
        ["worker_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_worker_patient_assignments_patient_id"),
        "worker_patient_assignments",
        ["patient_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_worker_patient_assignments_assigned_by_id"),
        "worker_patient_assignments",
        ["assigned_by_id"],
        unique=False,
    )

    op.create_table(
        "follow_ups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("worker_id", sa.Integer(), nullable=False),
        sa.Column("patient_id", sa.Integer(), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
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
            "status IN ('scheduled', 'completed', 'cancelled')",
            name="ck_follow_ups_valid_status",
        ),
        sa.ForeignKeyConstraint(
            ["patient_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["worker_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_follow_ups_id"),
        "follow_ups",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_follow_ups_worker_id"),
        "follow_ups",
        ["worker_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_follow_ups_patient_id"),
        "follow_ups",
        ["patient_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_follow_ups_due_date"),
        "follow_ups",
        ["due_date"],
        unique=False,
    )
    op.create_index(
        op.f("ix_follow_ups_status"),
        "follow_ups",
        ["status"],
        unique=False,
    )

    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("administrator_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=80), nullable=False),
        sa.Column("target_type", sa.String(length=50), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["administrator_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_admin_audit_logs_id"),
        "admin_audit_logs",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_admin_audit_logs_administrator_id"),
        "admin_audit_logs",
        ["administrator_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_admin_audit_logs_action"),
        "admin_audit_logs",
        ["action"],
        unique=False,
    )
    op.create_index(
        op.f("ix_admin_audit_logs_target_type"),
        "admin_audit_logs",
        ["target_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_admin_audit_logs_target_id"),
        "admin_audit_logs",
        ["target_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_admin_audit_logs_created_at"),
        "admin_audit_logs",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    """Remove three-role collaboration schema without touching users."""
    op.drop_index(
        op.f("ix_admin_audit_logs_created_at"),
        table_name="admin_audit_logs",
    )
    op.drop_index(
        op.f("ix_admin_audit_logs_target_id"),
        table_name="admin_audit_logs",
    )
    op.drop_index(
        op.f("ix_admin_audit_logs_target_type"),
        table_name="admin_audit_logs",
    )
    op.drop_index(
        op.f("ix_admin_audit_logs_action"),
        table_name="admin_audit_logs",
    )
    op.drop_index(
        op.f("ix_admin_audit_logs_administrator_id"),
        table_name="admin_audit_logs",
    )
    op.drop_index(
        op.f("ix_admin_audit_logs_id"),
        table_name="admin_audit_logs",
    )
    op.drop_table("admin_audit_logs")

    op.drop_index(op.f("ix_follow_ups_status"), table_name="follow_ups")
    op.drop_index(op.f("ix_follow_ups_due_date"), table_name="follow_ups")
    op.drop_index(op.f("ix_follow_ups_patient_id"), table_name="follow_ups")
    op.drop_index(op.f("ix_follow_ups_worker_id"), table_name="follow_ups")
    op.drop_index(op.f("ix_follow_ups_id"), table_name="follow_ups")
    op.drop_table("follow_ups")

    op.drop_index(
        op.f("ix_worker_patient_assignments_assigned_by_id"),
        table_name="worker_patient_assignments",
    )
    op.drop_index(
        op.f("ix_worker_patient_assignments_patient_id"),
        table_name="worker_patient_assignments",
    )
    op.drop_index(
        op.f("ix_worker_patient_assignments_worker_id"),
        table_name="worker_patient_assignments",
    )
    op.drop_index(
        op.f("ix_worker_patient_assignments_id"),
        table_name="worker_patient_assignments",
    )
    op.drop_table("worker_patient_assignments")

    op.drop_constraint(
        "ck_users_valid_role",
        "users",
        type_="check",
    )
    op.create_check_constraint(
        "ck_users_valid_role",
        "users",
        "role IN ('patient', 'healthcare_worker')",
    )
