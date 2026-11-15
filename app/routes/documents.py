import re

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MedicalDocument, User
from app.schemas.document import DocumentCategory, DocumentResponse
from app.security.dependencies import get_current_patient
from app.services.document_storage import (
    DocumentStorageError,
    delete_stored_file,
    resolve_stored_path,
    save_upload,
)

router = APIRouter(prefix="/api/documents", tags=["Medical Documents"])

_HEADER_UNSAFE = re.compile(r'[\x00-\x1f\x7f"\\]')


def _safe_download_name(filename: str) -> str:
    return _HEADER_UNSAFE.sub("_", filename) or "document"


def _get_owned_document(
    document_id: int,
    owner_id: int,
    db: Session,
) -> MedicalDocument:
    document = db.scalar(
        select(MedicalDocument).where(
            MedicalDocument.id == document_id,
            MedicalDocument.owner_id == owner_id,
        )
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    category: DocumentCategory = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
):
    try:
        saved = await save_upload(file)
    except DocumentStorageError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.detail,
        ) from exc

    document = MedicalDocument(
        owner_id=current_user.id,
        original_filename=saved.original_filename,
        stored_filename=saved.stored_filename,
        category=category.value,
        content_type=saved.content_type,
        size_bytes=saved.size_bytes,
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except SQLAlchemyError as exc:
        db.rollback()
        delete_stored_file(saved.stored_filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save document metadata",
        ) from exc

    return document


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
):
    documents = db.scalars(
        select(MedicalDocument)
        .where(MedicalDocument.owner_id == current_user.id)
        .order_by(
            MedicalDocument.created_at.desc(),
            MedicalDocument.id.desc(),
        )
    ).all()

    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
):
    return _get_owned_document(document_id, current_user.id, db)


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
):
    document = _get_owned_document(document_id, current_user.id, db)

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


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient),
):
    document = _get_owned_document(document_id, current_user.id, db)
    stored_filename = document.stored_filename

    try:
        db.delete(document)
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to delete document",
        ) from exc

    delete_stored_file(stored_filename)

    return None
