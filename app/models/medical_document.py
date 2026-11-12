from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

DOCUMENT_CATEGORIES = (
    "prescription",
    "discharge_summary",
    "medical_report",
)


class MedicalDocument(Base):
    __tablename__ = "medical_documents"

    __table_args__ = (
        CheckConstraint(
            "category IN ('prescription', 'discharge_summary', "
            "'medical_report')",
            name="ck_medical_documents_valid_category",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    original_filename: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    stored_filename: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    content_type: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    size_bytes: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
