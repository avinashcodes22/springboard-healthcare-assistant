from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MedicalDocument, User
from app.schemas.document import DocumentHistoryItem
from app.schemas.user import (
    UserProfileUpdate,
    UserProfileResponse,
)
from app.security.dependencies import get_current_user

router = APIRouter(prefix="/api/users", tags=["User Profiles"])


@router.get("/me", response_model=UserProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.patch("/me", response_model=UserProfileResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)

    if "full_name" in updates:
        if updates["full_name"] is None:
            raise HTTPException(400, "Full name cannot be empty")
        updates["full_name"] = updates["full_name"].strip()

    if "preferred_language" in updates:
        if updates["preferred_language"] is None:
            raise HTTPException(400, "Preferred language cannot be empty")

    for field, value in updates.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/me/history", response_model=list[DocumentHistoryItem])
def get_medical_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    documents = db.scalars(
        select(MedicalDocument)
        .where(MedicalDocument.owner_id == current_user.id)
        .order_by(MedicalDocument.created_at.asc(), MedicalDocument.id.asc())
    ).all()

    return [DocumentHistoryItem.from_document(document) for document in documents]
