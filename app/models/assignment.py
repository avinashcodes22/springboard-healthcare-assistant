from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import User


class WorkerPatientAssignment(Base):
    __tablename__ = "worker_patient_assignments"

    __table_args__ = (
        UniqueConstraint(
            "worker_id",
            "patient_id",
            name="uq_worker_patient_assignments_pair",
        ),
        CheckConstraint(
            "worker_id <> patient_id",
            name="ck_worker_patient_assignments_distinct_users",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    worker_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_by_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    worker: Mapped[User] = relationship(
        foreign_keys=[worker_id],
        lazy="joined",
    )
    patient: Mapped[User] = relationship(
        foreign_keys=[patient_id],
        lazy="joined",
    )
    assigned_by: Mapped[User | None] = relationship(
        foreign_keys=[assigned_by_id],
        lazy="joined",
    )

    @property
    def worker_name(self) -> str:
        return self.worker.full_name if self.worker else "Unknown worker"

    @property
    def patient_name(self) -> str:
        return self.patient.full_name if self.patient else "Unknown patient"

    @property
    def assigned_by_name(self) -> str | None:
        return self.assigned_by.full_name if self.assigned_by else None
