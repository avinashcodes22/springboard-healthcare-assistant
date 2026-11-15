from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import (
    FollowUp,
    HealthContent,
    MedicalDocument,
    User,
    WorkerPatientAssignment,
)
from app.schemas.admin import (
    AdminAnalytics,
    AdminAssignmentCreate,
    AdminAssignmentResponse,
    AdminContentUpdate,
    AdminMonitoring,
    AdminOverview,
    AdminUserResponse,
    AdminUserStatusUpdate,
    AdminWorkerResponse,
    LanguageCount,
)
from app.schemas.health_content import ContentStatus, HealthContentResponse
from app.security.dependencies import get_current_administrator
from app.services.admin_audit import record_admin_action

router = APIRouter(prefix="/api/admin", tags=["Administration"])

_DOCUMENT_CATEGORIES = (
    "prescription",
    "discharge_summary",
    "medical_report",
)


def _count(db: Session, statement) -> int:
    return int(db.scalar(statement) or 0)


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def _get_worker_or_404(db: Session, worker_id: int) -> User:
    user = _get_user_or_404(db, worker_id)
    if user.role != "healthcare_worker":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Healthcare worker not found",
        )
    return user


def _database_status(db: Session) -> tuple[str, str]:
    try:
        db.execute(text("SELECT 1"))
        return "connected", "healthy"
    except SQLAlchemyError:
        return "unavailable", "degraded"


def _language_counts(db: Session, column, role: str | None = None) -> list[LanguageCount]:
    statement = select(column, func.count()).group_by(column)
    if role is not None:
        statement = statement.where(User.role == role)
    rows = db.execute(statement.order_by(func.count().desc())).all()
    return [
        LanguageCount(language=str(language), count=int(count))
        for language, count in rows
    ]


def _worker_responses(
    db: Session,
    workers: list[User],
) -> list[AdminWorkerResponse]:
    worker_ids = [worker.id for worker in workers]
    if not worker_ids:
        return []

    assignment_counts = dict(
        db.execute(
            select(
                WorkerPatientAssignment.worker_id,
                func.count(),
            )
            .where(WorkerPatientAssignment.worker_id.in_(worker_ids))
            .group_by(WorkerPatientAssignment.worker_id)
        ).all()
    )
    content_counts = dict(
        db.execute(
            select(
                HealthContent.author_id,
                func.count(),
            )
            .where(HealthContent.author_id.in_(worker_ids))
            .group_by(HealthContent.author_id)
        ).all()
    )

    return [
        AdminWorkerResponse(
            **AdminUserResponse.model_validate(worker).model_dump(),
            assigned_patient_count=int(
                assignment_counts.get(worker.id, 0)
            ),
            authored_content_count=int(content_counts.get(worker.id, 0)),
        )
        for worker in workers
    ]


@router.get("/overview", response_model=AdminOverview)
def admin_overview(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    _, database_status = _database_status(db)

    return AdminOverview(
        total_patients=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "patient"
            ),
        ),
        total_workers=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "healthcare_worker"
            ),
        ),
        approved_workers=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "healthcare_worker",
                User.is_approved.is_(True),
            ),
        ),
        pending_workers=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "healthcare_worker",
                User.is_approved.is_(False),
            ),
        ),
        total_documents=_count(
            db,
            select(func.count()).select_from(MedicalDocument),
        ),
        total_content=_count(
            db,
            select(func.count()).select_from(HealthContent),
        ),
        published_content=_count(
            db,
            select(func.count()).select_from(HealthContent).where(
                HealthContent.status == "published"
            ),
        ),
        draft_content=_count(
            db,
            select(func.count()).select_from(HealthContent).where(
                HealthContent.status == "draft"
            ),
        ),
        active_assignments=_count(
            db,
            select(func.count()).select_from(WorkerPatientAssignment),
        ),
        scheduled_follow_ups=_count(
            db,
            select(func.count()).select_from(FollowUp).where(
                FollowUp.status == "scheduled"
            ),
        ),
        overdue_follow_ups=_count(
            db,
            select(func.count()).select_from(FollowUp).where(
                FollowUp.status == "scheduled",
                FollowUp.due_date < date.today(),
            ),
        ),
        database_status=database_status,
        api_status="healthy",
    )


@router.get("/users", response_model=list[AdminUserResponse])
def list_users(
    role: str | None = Query(default=None, max_length=30),
    account_status: str | None = Query(
        default=None,
        alias="status",
        max_length=20,
    ),
    search: str | None = Query(default=None, max_length=150),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    statement = select(User)

    if role is not None:
        if role not in {"patient", "healthcare_worker", "administrator"}:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Unsupported role filter",
            )
        statement = statement.where(User.role == role)

    if account_status == "active":
        statement = statement.where(User.is_active.is_(True))
    elif account_status == "inactive":
        statement = statement.where(User.is_active.is_(False))
    elif account_status == "pending":
        statement = statement.where(User.is_approved.is_(False))
    elif account_status is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Unsupported status filter",
        )

    if search:
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                User.full_name.ilike(term),
                User.email.ilike(term),
            )
        )

    statement = statement.order_by(User.created_at.desc(), User.id.desc())
    return db.scalars(statement).all()


@router.get("/users/{user_id}", response_model=AdminUserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    return _get_user_or_404(db, user_id)


@router.patch("/users/{user_id}/status", response_model=AdminUserResponse)
def update_user_status(
    user_id: int,
    payload: AdminUserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    user = _get_user_or_404(db, user_id)

    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own administrator status",
        )

    if user.role == "administrator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator accounts cannot be changed here",
        )

    if payload.is_active and user.role == "healthcare_worker":
        if not user.is_approved:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Approve the healthcare worker before activating the account",
            )

    user.is_active = payload.is_active
    if user.role == "healthcare_worker" and not payload.is_active:
        user.is_approved = False

    record_admin_action(
        db,
        current_admin.id,
        "user.status.update",
        "user",
        user.id,
        f"is_active={str(user.is_active).lower()}",
    )

    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update account status",
        ) from exc

    return user


@router.get("/workers", response_model=list[AdminWorkerResponse])
def list_workers(
    approval: str = Query(default="all", max_length=20),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    statement = select(User).where(User.role == "healthcare_worker")

    if approval == "approved":
        statement = statement.where(User.is_approved.is_(True))
    elif approval == "pending":
        statement = statement.where(User.is_approved.is_(False))
    elif approval != "all":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Approval filter must be all, approved or pending",
        )

    workers = db.scalars(
        statement.order_by(User.created_at.desc(), User.id.desc())
    ).all()
    return _worker_responses(db, workers)


@router.post(
    "/workers/{worker_id}/approve",
    response_model=AdminWorkerResponse,
)
def approve_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    worker = _get_worker_or_404(db, worker_id)
    worker.is_active = True
    worker.is_approved = True

    record_admin_action(
        db,
        current_admin.id,
        "worker.approve",
        "user",
        worker.id,
    )

    try:
        db.commit()
        db.refresh(worker)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to approve healthcare worker",
        ) from exc

    return _worker_responses(db, [worker])[0]


@router.post(
    "/workers/{worker_id}/revoke",
    response_model=AdminWorkerResponse,
)
def revoke_worker(
    worker_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    worker = _get_worker_or_404(db, worker_id)
    worker.is_active = False
    worker.is_approved = False

    record_admin_action(
        db,
        current_admin.id,
        "worker.revoke",
        "user",
        worker.id,
    )

    try:
        db.commit()
        db.refresh(worker)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to revoke healthcare worker approval",
        ) from exc

    return _worker_responses(db, [worker])[0]


@router.get("/content", response_model=list[HealthContentResponse])
def list_all_content(
    content_status: ContentStatus | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    statement = select(HealthContent)
    if content_status is not None:
        statement = statement.where(
            HealthContent.status == content_status.value
        )

    return db.scalars(
        statement.order_by(
            HealthContent.updated_at.desc(),
            HealthContent.id.desc(),
        )
    ).all()


@router.patch(
    "/content/{content_id}",
    response_model=HealthContentResponse,
)
def update_content_status(
    content_id: int,
    payload: AdminContentUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    content = db.get(HealthContent, content_id)
    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found",
        )

    updates = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "status" in updates:
        updates["status"] = updates["status"].value

    for field, value in updates.items():
        setattr(content, field, value)

    if updates:
        record_admin_action(
            db,
            current_admin.id,
            "content.update",
            "health_content",
            content.id,
            "fields=" + ",".join(sorted(updates)),
        )

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


@router.get("/analytics", response_model=AdminAnalytics)
def analytics(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    document_rows = db.execute(
        select(MedicalDocument.category, func.count()).group_by(
            MedicalDocument.category
        )
    ).all()
    documents_by_category = {category: 0 for category in _DOCUMENT_CATEGORIES}
    documents_by_category.update(
        {str(category): int(count) for category, count in document_rows}
    )

    return AdminAnalytics(
        patient_registrations=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "patient"
            ),
        ),
        worker_registrations=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "healthcare_worker"
            ),
        ),
        approved_workers=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "healthcare_worker",
                User.is_approved.is_(True),
            ),
        ),
        pending_workers=_count(
            db,
            select(func.count()).select_from(User).where(
                User.role == "healthcare_worker",
                User.is_approved.is_(False),
            ),
        ),
        total_documents=_count(
            db,
            select(func.count()).select_from(MedicalDocument),
        ),
        documents_by_category=documents_by_category,
        total_content=_count(
            db,
            select(func.count()).select_from(HealthContent),
        ),
        published_content=_count(
            db,
            select(func.count()).select_from(HealthContent).where(
                HealthContent.status == "published"
            ),
        ),
        draft_content=_count(
            db,
            select(func.count()).select_from(HealthContent).where(
                HealthContent.status == "draft"
            ),
        ),
        active_assignments=_count(
            db,
            select(func.count()).select_from(WorkerPatientAssignment),
        ),
        scheduled_follow_ups=_count(
            db,
            select(func.count()).select_from(FollowUp).where(
                FollowUp.status == "scheduled"
            ),
        ),
        completed_follow_ups=_count(
            db,
            select(func.count()).select_from(FollowUp).where(
                FollowUp.status == "completed"
            ),
        ),
        language_preferences=_language_counts(
            db,
            User.preferred_language,
            role="patient",
        ),
        content_languages=_language_counts(
            db,
            HealthContent.language,
        ),
    )


@router.get("/monitoring", response_model=AdminMonitoring)
def monitoring(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    database_detail, database_status = _database_status(db)
    return AdminMonitoring(
        api_status="healthy",
        database_status=database_status,
        application_version=settings.app_version,
        checked_at=datetime.now(timezone.utc),
        database_detail=database_detail,
    )


@router.get(
    "/assignments",
    response_model=list[AdminAssignmentResponse],
)
def list_assignments(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    return db.scalars(
        select(WorkerPatientAssignment).order_by(
            WorkerPatientAssignment.created_at.desc(),
            WorkerPatientAssignment.id.desc(),
        )
    ).all()


@router.post(
    "/assignments",
    response_model=AdminAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment(
    payload: AdminAssignmentCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    worker = _get_worker_or_404(db, payload.worker_id)
    patient = _get_user_or_404(db, payload.patient_id)

    if patient.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Selected account is not a patient",
        )

    if not worker.is_active or not worker.is_approved:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only active, approved healthcare workers can be assigned patients",
        )

    if not patient.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Inactive patients cannot be assigned",
        )

    existing = db.scalar(
        select(WorkerPatientAssignment).where(
            WorkerPatientAssignment.worker_id == worker.id,
            WorkerPatientAssignment.patient_id == patient.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This patient is already assigned to that healthcare worker",
        )

    assignment = WorkerPatientAssignment(
        worker_id=worker.id,
        patient_id=patient.id,
        assigned_by_id=current_admin.id,
    )
    db.add(assignment)
    record_admin_action(
        db,
        current_admin.id,
        "assignment.create",
        "worker_patient_assignment",
        None,
        f"worker_id={worker.id};patient_id={patient.id}",
    )

    try:
        db.commit()
        db.refresh(assignment)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This patient is already assigned to that healthcare worker",
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to assign patient",
        ) from exc

    return assignment


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_administrator),
):
    assignment = db.get(WorkerPatientAssignment, assignment_id)
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found",
        )

    record_admin_action(
        db,
        current_admin.id,
        "assignment.delete",
        "worker_patient_assignment",
        assignment.id,
        f"worker_id={assignment.worker_id};patient_id={assignment.patient_id}",
    )
    db.delete(assignment)

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to remove assignment",
        ) from exc

    return None
