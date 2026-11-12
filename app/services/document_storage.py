import re
import uuid
from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile

from app.config import settings

CHUNK_SIZE = 1024 * 1024

_EXTENSION_TYPES: dict[str, str] = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}

_SIGNATURE_TYPES: tuple[tuple[bytes, str], ...] = (
    (b"%PDF-", "application/pdf"),
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
)

_CANONICAL_EXTENSIONS: dict[str, str] = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}

_CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f]")


class DocumentStorageError(Exception):
    status_code = 400
    detail = "Invalid document upload"

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail or type(self).detail
        super().__init__(self.detail)


class UnsupportedDocumentError(DocumentStorageError):
    detail = "Unsupported file type. Allowed types: PDF, JPEG, PNG"


class EmptyDocumentError(DocumentStorageError):
    detail = "Uploaded file is empty"


class DocumentTooLargeError(DocumentStorageError):
    status_code = 413
    detail = "Uploaded file exceeds the maximum allowed size"


class DocumentContentMismatchError(DocumentStorageError):
    detail = "File content does not match its extension"


@dataclass(frozen=True)
class SavedDocument:
    original_filename: str
    stored_filename: str
    content_type: str
    size_bytes: int


def upload_directory() -> Path:
    directory = Path(settings.uploads_dir)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def sanitize_original_filename(filename: str | None) -> str:
    if not filename:
        return "document"

    basename = Path(filename.replace("\\", "/")).name
    cleaned = _CONTROL_CHARACTERS.sub("_", basename).strip()
    cleaned = cleaned.replace("/", "_").replace("\\", "_")

    if not cleaned or cleaned in {".", ".."}:
        return "document"

    if len(cleaned) > 255:
        suffix = Path(cleaned).suffix[:20]
        stem_length = max(1, 255 - len(suffix))
        cleaned = cleaned[:stem_length] + suffix

    return cleaned


def detect_content_type(head: bytes) -> str | None:
    for signature, content_type in _SIGNATURE_TYPES:
        if head.startswith(signature):
            return content_type
    return None


async def save_upload(upload: UploadFile) -> SavedDocument:
    original_filename = sanitize_original_filename(upload.filename)
    extension = Path(original_filename).suffix.lower()

    expected_type = _EXTENSION_TYPES.get(extension)
    if expected_type is None:
        raise UnsupportedDocumentError

    max_size = settings.max_upload_size_bytes
    directory = upload_directory()
    destination: Path | None = None

    try:
        head = await upload.read(16)

        if not head:
            raise EmptyDocumentError

        detected_type = detect_content_type(head)

        if detected_type is None:
            raise UnsupportedDocumentError

        if detected_type != expected_type:
            raise DocumentContentMismatchError

        stored_filename = uuid.uuid4().hex + _CANONICAL_EXTENSIONS[detected_type]
        destination = directory / stored_filename

        total = 0
        with destination.open("xb") as output:
            output.write(head)
            total += len(head)

            while True:
                chunk = await upload.read(CHUNK_SIZE)
                if not chunk:
                    break

                total += len(chunk)
                if total > max_size:
                    raise DocumentTooLargeError

                output.write(chunk)

        if total == 0:
            raise EmptyDocumentError

        return SavedDocument(
            original_filename=original_filename,
            stored_filename=stored_filename,
            content_type=detected_type,
            size_bytes=total,
        )

    except DocumentStorageError:
        if destination is not None:
            destination.unlink(missing_ok=True)
        raise

    except OSError as exc:
        if destination is not None:
            destination.unlink(missing_ok=True)
        raise DocumentStorageError("Unable to store the uploaded file") from exc

    finally:
        await upload.close()


def resolve_stored_path(stored_filename: str) -> Path:
    if not stored_filename or Path(stored_filename).name != stored_filename:
        raise DocumentStorageError("Invalid stored file reference")

    base = upload_directory().resolve()
    candidate = (base / stored_filename).resolve()

    if not candidate.is_relative_to(base) or candidate.parent != base:
        raise DocumentStorageError("Invalid stored file reference")

    return candidate


def delete_stored_file(stored_filename: str) -> None:
    try:
        resolve_stored_path(stored_filename).unlink(missing_ok=True)
    except DocumentStorageError:
        return
