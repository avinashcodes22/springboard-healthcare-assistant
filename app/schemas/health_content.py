import re
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.language import normalize_language

CATEGORY_PATTERN = re.compile(r"^[a-z0-9_\-]{2,50}$")


class ContentStatus(str, Enum):
    draft = "draft"
    published = "published"


def normalize_category(value: str) -> str:
    cleaned = re.sub(r"\s+", "_", value.strip().lower())
    if not CATEGORY_PATTERN.fullmatch(cleaned):
        raise ValueError(
            "Category must be 2-50 characters using letters, numbers, "
            "underscores or hyphens"
        )
    return cleaned


class HealthContentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    content: str = Field(min_length=20, max_length=50_000)
    category: str = Field(min_length=2, max_length=50)
    language: str = Field(default="en", max_length=30)
    status: ContentStatus = ContentStatus.draft

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if len(cleaned) < 3:
            raise ValueError("Title must contain at least 3 characters")
        return cleaned

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        return normalize_category(value)

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str) -> str:
        return normalize_language(value)


class HealthContentUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    content: str | None = Field(default=None, max_length=50_000)
    category: str | None = Field(default=None, max_length=50)
    language: str | None = Field(default=None, max_length=30)
    status: ContentStatus | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.split())
        if len(cleaned) < 3:
            raise ValueError("Title must contain at least 3 characters")
        return cleaned

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if len(cleaned) < 20:
            raise ValueError("Content must contain at least 20 characters")
        return cleaned

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


class HealthContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    category: str
    language: str
    author_id: int
    author_name: str
    status: str
    created_at: datetime
    updated_at: datetime
