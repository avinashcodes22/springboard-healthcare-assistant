from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict


class DocumentCategory(str, Enum):
    prescription = "prescription"
    discharge_summary = "discharge_summary"
    medical_report = "medical_report"


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_filename: str
    category: str
    content_type: str
    size_bytes: int
    created_at: datetime


class DocumentHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id: int
    original_filename: str
    category: str
    upload_date: datetime
    file_type: str

    @classmethod
    def from_document(cls, document) -> "DocumentHistoryItem":
        return cls(
            document_id=document.id,
            original_filename=document.original_filename,
            category=document.category,
            upload_date=document.created_at,
            file_type=document.content_type,
        )
