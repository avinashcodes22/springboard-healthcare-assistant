from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.document import DocumentResponse


class FollowUpStatus(str, Enum):
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"


class WorkerPatientSummary(BaseModel):
    id: int
    full_name: str
    phone: str | None
    preferred_language: str
    created_at: datetime
    document_count: int
    scheduled_follow_ups: int


class WorkerPatientDetail(WorkerPatientSummary):
    documents: list[DocumentResponse]


class WorkerOverview(BaseModel):
    assigned_patients: int
    scheduled_follow_ups: int
    overdue_follow_ups: int
    completed_follow_ups: int
    authored_content: int
    published_content: int
    draft_content: int


class FollowUpCreate(BaseModel):
    patient_id: int
    due_date: date
    status: FollowUpStatus = FollowUpStatus.scheduled
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("notes")
    @classmethod
    def clean_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class FollowUpUpdate(BaseModel):
    due_date: date | None = None
    status: FollowUpStatus | None = None
    notes: str | None = Field(default=None, max_length=2000)

    @field_validator("notes")
    @classmethod
    def clean_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class FollowUpResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    worker_id: int
    patient_id: int
    patient_name: str
    due_date: date
    status: str
    notes: str | None
    is_overdue: bool
    created_at: datetime
    updated_at: datetime
