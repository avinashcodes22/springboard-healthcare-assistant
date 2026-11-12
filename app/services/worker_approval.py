from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User


class WorkerApprovalError(Exception):
    pass


def set_worker_approval(
    db: Session,
    email: str,
    approved: bool,
) -> User:
    """Activate or deactivate a healthcare worker account.

    This function is intended for an authorized operator process, not for a
    public API endpoint.
    """
    normalized_email = email.strip().lower()

    user = db.scalar(
        select(User).where(User.email == normalized_email)
    )

    if user is None:
        raise WorkerApprovalError("No account found for that email address")

    if user.role != "healthcare_worker":
        raise WorkerApprovalError(
            "The account is not a healthcare worker account"
        )

    user.is_active = approved
    user.is_approved = approved
    db.commit()
    db.refresh(user)

    return user
