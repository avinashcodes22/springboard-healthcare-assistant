from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import User


class FollowUp(Base):
    __tablename__ = "follow_ups"

    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled', 'completed', 'cancelled')",
            name="ck_follow_ups_valid_status",
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
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20),
        default="scheduled",
        nullable=False,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
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

    @property
    def patient_name(self) -> str:
        return self.patient.full_name if self.patient else "Unknown patient"

    @property
    def is_overdue(self) -> bool:
        return self.status == "scheduled" and self.due_date < date.today()
