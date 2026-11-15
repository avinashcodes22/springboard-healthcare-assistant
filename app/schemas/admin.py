from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.health_content import ContentStatus, normalize_category
from app.utils.language import normalize_language


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    phone: str | None
    role: str
    preferred_language: str
    is_active: bool
    is_approved: bool
    created_at: datetime


class AdminWorkerResponse(AdminUserResponse):
    assigned_patient_count: int = 0
    authored_content_count: int = 0


class AdminUserStatusUpdate(BaseModel):
    is_active: bool


class AdminContentUpdate(BaseModel):
    status: ContentStatus | None = None
    category: str | None = Field(default=None, max_length=50)
    language: str | None = Field(default=None, max_length=30)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_category(value)

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_language(value)


class AdminAssignmentCreate(BaseModel):
    worker_id: int
    patient_id: int


class AdminAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    worker_id: int
    worker_name: str
    patient_id: int
    patient_name: str
    assigned_by_id: int | None
    assigned_by_name: str | None
    created_at: datetime


class LanguageCount(BaseModel):
    language: str
    count: int


class AdminOverview(BaseModel):
    total_patients: int
    total_workers: int
    approved_workers: int
    pending_workers: int
    total_documents: int
    total_content: int
    published_content: int
    draft_content: int
    active_assignments: int
    scheduled_follow_ups: int
    overdue_follow_ups: int
    database_status: str
    api_status: str


class AdminAnalytics(BaseModel):
    patient_registrations: int
    worker_registrations: int
    approved_workers: int
    pending_workers: int
    total_documents: int
    documents_by_category: dict[str, int]
    total_content: int
    published_content: int
    draft_content: int
    active_assignments: int
    scheduled_follow_ups: int
    completed_follow_ups: int
    language_preferences: list[LanguageCount]
    content_languages: list[LanguageCount]


class AdminMonitoring(BaseModel):
    api_status: str
    database_status: str
    application_version: str
    checked_at: datetime
    database_detail: str
