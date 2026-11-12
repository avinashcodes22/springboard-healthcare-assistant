from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.user import User


class HealthContent(Base):
    __tablename__ = "health_contents"

    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published')",
            name="ck_health_contents_valid_status",
        ),
        CheckConstraint(
            "language IN ('en', 'te', 'hi', 'ta', 'kn', 'ml', 'mr', "
            "'gu', 'bn')",
            name="ck_health_contents_valid_language",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    language: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), default="draft", nullable=False, index=True
    )
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

    author: Mapped[User] = relationship(lazy="joined")

    @property
    def author_name(self) -> str:
        return self.author.full_name if self.author else "Unknown author"
