import re
from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    FollowUp,
    HealthContent,
    MedicalDocument,
    User,
    WorkerPatientAssignment,
)
from app.schemas.document import DocumentResponse
from app.schemas.worker import (
    FollowUpCreate,
    FollowUpResponse,
    FollowUpStatus,
    FollowUpUpdate,
    WorkerOverview,
    WorkerPatientDetail,
    WorkerPatientSummary,
)
from app.security.dependencies import get_current_healthcare_worker
from app.services.document_storage import (
    DocumentStorageError,
    resolve_stored_path,
)

router = APIRouter(prefix="/api/worker", tags=["Healthcare Worker Workspace"])

_HEADER_UNSAFE = re.compile(r'[\x00-\x1f\x7f"\\]')


def _safe_download_name(filename: str) -> str:
    return _HEADER_UNSAFE.sub("_", filename) or "document"


def _assigned_patient(
    patient_id: int,
    worker_id: int,
    db: Session,
) -> User:
    assignment = db.scalar(
        select(WorkerPatientAssignment).where(
            WorkerPatientAssignment.worker_id == worker_id,
            WorkerPatientAssignment.patient_id == patient_id,
        )
    )
    if assignment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient is not assigned to this healthcare worker",
        )
    return assignment.patient


def _patient_summaries(
    db: Session,
    worker_id: int,
) -> list[WorkerPatientSummary]:
    assignments = db.scalars(
        select(WorkerPatientAssignment)
        .where(WorkerPatientAssignment.worker_id == worker_id)
        .order_by(WorkerPatientAssignment.created_at.desc())
    ).all()
    patient_ids = [assignment.patient_id for assignment in assignments]
    if not patient_ids:
        return []

    document_counts = dict(
        db.execute(
            select(MedicalDocument.owner_id, func.count())
            .where(MedicalDocument.owner_id.in_(patient_ids))
            .group_by(MedicalDocument.owner_id)
        ).all()
    )
    scheduled_counts = dict(
        db.execute(
            select(FollowUp.patient_id, func.count())
            .where(
                FollowUp.worker_id == worker_id,
                FollowUp.patient_id.in_(patient_ids),
                FollowUp.status == "scheduled",
            )
            .group_by(FollowUp.patient_id)
        ).all()
    )

    return [
        WorkerPatientSummary(
            id=assignment.patient.id,
            full_name=assignment.patient.full_name,
            phone=assignment.patient.phone,
            preferred_language=assignment.patient.preferred_language,
            created_at=assignment.patient.created_at,
            document_count=int(document_counts.get(assignment.patient_id, 0)),
            scheduled_follow_ups=int(
                scheduled_counts.get(assignment.patient_id, 0)
            ),
        )
        for assignment in assignments
        if assignment.patient is not None
    ]


@router.get("/overview", response_model=WorkerOverview)
def worker_overview(
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    return WorkerOverview(
        assigned_patients=int(
            db.scalar(
                select(func.count())
                .select_from(WorkerPatientAssignment)
                .where(
                    WorkerPatientAssignment.worker_id == current_worker.id
                )
            )
            or 0
        ),
        scheduled_follow_ups=int(
            db.scalar(
                select(func.count())
                .select_from(FollowUp)
                .where(
                    FollowUp.worker_id == current_worker.id,
                    FollowUp.status == "scheduled",
                )
            )
            or 0
        ),
        overdue_follow_ups=int(
            db.scalar(
                select(func.count())
                .select_from(FollowUp)
                .where(
                    FollowUp.worker_id == current_worker.id,
                    FollowUp.status == "scheduled",
                    FollowUp.due_date < date.today(),
                )
            )
            or 0
        ),
        completed_follow_ups=int(
            db.scalar(
                select(func.count())
                .select_from(FollowUp)
                .where(
                    FollowUp.worker_id == current_worker.id,
                    FollowUp.status == "completed",
                )
            )
            or 0
        ),
        authored_content=int(
            db.scalar(
                select(func.count())
                .select_from(HealthContent)
                .where(HealthContent.author_id == current_worker.id)
            )
            or 0
        ),
        published_content=int(
            db.scalar(
                select(func.count())
                .select_from(HealthContent)
                .where(
                    HealthContent.author_id == current_worker.id,
                    HealthContent.status == "published",
                )
            )
            or 0
        ),
        draft_content=int(
            db.scalar(
                select(func.count())
                .select_from(HealthContent)
                .where(
                    HealthContent.author_id == current_worker.id,
                    HealthContent.status == "draft",
                )
            )
            or 0
        ),
    )


@router.get("/patients", response_model=list[WorkerPatientSummary])
def list_assigned_patients(
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    return _patient_summaries(db, current_worker.id)


@router.get(
    "/patients/{patient_id}",
    response_model=WorkerPatientDetail,
)
def get_assigned_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    patient = _assigned_patient(patient_id, current_worker.id, db)
    documents = db.scalars(
        select(MedicalDocument)
        .where(MedicalDocument.owner_id == patient.id)
        .order_by(
            MedicalDocument.created_at.desc(),
            MedicalDocument.id.desc(),
        )
    ).all()
    scheduled_follow_ups = int(
        db.scalar(
            select(func.count())
            .select_from(FollowUp)
            .where(
                FollowUp.worker_id == current_worker.id,
                FollowUp.patient_id == patient.id,
                FollowUp.status == "scheduled",
            )
        )
        or 0
    )

    return WorkerPatientDetail(
        id=patient.id,
        full_name=patient.full_name,
        phone=patient.phone,
        preferred_language=patient.preferred_language,
        created_at=patient.created_at,
        document_count=len(documents),
        scheduled_follow_ups=scheduled_follow_ups,
        documents=[
            DocumentResponse.model_validate(document)
            for document in documents
        ],
    )


@router.get(
    "/patients/{patient_id}/documents/{document_id}/download",
)
def download_assigned_patient_document(
    patient_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    patient = _assigned_patient(patient_id, current_worker.id, db)
    document = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.owner_id == patient.id,
        )
    )
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    try:
        path = resolve_stored_path(document.stored_filename)
    except DocumentStorageError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file is unavailable",
        ) from exc

    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file is unavailable",
        )

    return FileResponse(
        path=path,
        media_type=document.content_type,
        filename=_safe_download_name(document.original_filename),
    )


@router.get("/follow-ups", response_model=list[FollowUpResponse])
def list_follow_ups(
    follow_up_status: FollowUpStatus | None = Query(
        default=None,
        alias="status",
    ),
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    statement = select(FollowUp).where(
        FollowUp.worker_id == current_worker.id
    )
    if follow_up_status is not None:
        statement = statement.where(
            FollowUp.status == follow_up_status.value
        )

    return db.scalars(
        statement.order_by(FollowUp.due_date.asc(), FollowUp.id.asc())
    ).all()


@router.post(
    "/follow-ups",
    response_model=FollowUpResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_follow_up(
    payload: FollowUpCreate,
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    _assigned_patient(payload.patient_id, current_worker.id, db)

    follow_up = FollowUp(
        worker_id=current_worker.id,
        patient_id=payload.patient_id,
        due_date=payload.due_date,
        status=payload.status.value,
        notes=payload.notes,
    )
    db.add(follow_up)

    try:
        db.commit()
        db.refresh(follow_up)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create follow-up",
        ) from exc

    return follow_up


@router.patch(
    "/follow-ups/{follow_up_id}",
    response_model=FollowUpResponse,
)
def update_follow_up(
    follow_up_id: int,
    payload: FollowUpUpdate,
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    follow_up = db.scalar(
        select(FollowUp).where(
            FollowUp.id == follow_up_id,
            FollowUp.worker_id == current_worker.id,
        )
    )
    if follow_up is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )

    _assigned_patient(
        follow_up.patient_id,
        current_worker.id,
        db,
    )

    updates = payload.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] is not None:
        updates["status"] = updates["status"].value

    for field, value in updates.items():
        if field == "notes" or value is not None:
            setattr(follow_up, field, value)

    try:
        db.commit()
        db.refresh(follow_up)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update follow-up",
        ) from exc

    return follow_up


@router.delete(
    "/follow-ups/{follow_up_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_follow_up(
    follow_up_id: int,
    db: Session = Depends(get_db),
    current_worker: User = Depends(get_current_healthcare_worker),
):
    follow_up = db.scalar(
        select(FollowUp).where(
            FollowUp.id == follow_up_id,
            FollowUp.worker_id == current_worker.id,
        )
    )
    if follow_up is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow-up not found",
        )

    db.delete(follow_up)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete follow-up",
        ) from exc

    return None
