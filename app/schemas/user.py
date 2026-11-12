from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.utils.language import normalize_language


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=20)
    preferred_language: str | None = Field(default=None, max_length=30)

    @field_validator("full_name")
    @classmethod
    def clean_full_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = " ".join(value.split())
        if len(cleaned) < 2:
            raise ValueError("Full name must contain at least 2 characters")
        return cleaned

    @field_validator("preferred_language")
    @classmethod
    def validate_language(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return normalize_language(value)


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    role: str
    preferred_language: str
    is_active: bool
    is_approved: bool
