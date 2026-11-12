from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HealthContent, User
from app.schemas.health_content import (
    HealthContentCreate,
    HealthContentResponse,
    HealthContentUpdate,
    normalize_category,
)
from app.security.dependencies import get_current_healthcare_worker
from app.utils.language import normalize_language

router = APIRouter(prefix="/api/health-content", tags=["Healthcare Content"])


def _get_own_content(
    content_id: int,
    author_id: int,
    db: Session,
) -> HealthContent:
    content = db.scalar(
        select(HealthContent).where(
            HealthContent.id == content_id,
            HealthContent.author_id == author_id,
        )
    )

    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found",
        )

    return content


@router.get("", response_model=list[HealthContentResponse])
def list_published_content(
    language: str | None = Query(default=None, max_length=30),
    category: str | None = Query(default=None, max_length=50),
    db: Session = Depends(get_db),
):
    statement = select(HealthContent).where(
        HealthContent.status == "published"
    )

    if language is not None:
        try:
            language_code = normalize_language(language)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exc),
            ) from exc
        statement = statement.where(
            HealthContent.language == language_code
        )

    if category is not None:
        try:
            category_slug = normalize_category(category)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exc),
            ) from exc
        statement = statement.where(
            HealthContent.category == category_slug
        )

    statement = statement.order_by(
        HealthContent.created_at.desc(),
        HealthContent.id.desc(),
    )

    return db.scalars(statement).all()


@router.get("/mine", response_model=list[HealthContentResponse])
def list_own_content(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_healthcare_worker),
):
    return db.scalars(
        select(HealthContent)
        .where(HealthContent.author_id == current_user.id)
        .order_by(
            HealthContent.updated_at.desc(),
            HealthContent.id.desc(),
        )
    ).all()


@router.get("/{content_id}", response_model=HealthContentResponse)
def get_published_content(
    content_id: int,
    db: Session = Depends(get_db),
):
    content = db.scalar(
        select(HealthContent).where(
            HealthContent.id == content_id,
            HealthContent.status == "published",
        )
    )

    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found",
        )

    return content


@router.post(
    "",
    response_model=HealthContentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_content(
    payload: HealthContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_healthcare_worker),
):
    content = HealthContent(
        title=payload.title,
        content=payload.content.strip(),
        category=payload.category,
        language=payload.language,
        author_id=current_user.id,
        status=payload.status.value,
    )

    try:
        db.add(content)
        db.commit()
        db.refresh(content)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create content",
        ) from exc

    return content


@router.patch("/{content_id}", response_model=HealthContentResponse)
def update_content(
    content_id: int,
    payload: HealthContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_healthcare_worker),
):
    content = _get_own_content(content_id, current_user.id, db)

    updates = payload.model_dump(exclude_unset=True)

    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value

    for field, value in updates.items():
        if value is not None:
            setattr(content, field, value)

    try:
        db.commit()
        db.refresh(content)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update content",
        ) from exc

    return content


@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_healthcare_worker),
):
    content = _get_own_content(content_id, current_user.id, db)

    try:
        db.delete(content)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete content",
        ) from exc

    return None
