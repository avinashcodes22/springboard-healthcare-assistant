from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import User
from app.security.auth import hash_password


class AdminProvisioningError(Exception):
    pass


def provision_administrator(
    db: Session,
    *,
    full_name: str,
    email: str,
    phone: str | None,
    password: str,
    preferred_language: str = "en",
) -> User:
    """Create a new administrator account without reusing existing users."""
    normalized_email = email.strip().lower()
    cleaned_name = " ".join(full_name.split())

    if len(cleaned_name) < 2:
        raise AdminProvisioningError("Full name must contain at least 2 characters")

    if len(password) < 8:
        raise AdminProvisioningError("Password must be at least 8 characters")

    existing = db.scalar(
        select(User).where(User.email == normalized_email)
    )
    if existing is not None:
        raise AdminProvisioningError(
            "An account with that email already exists. Existing users cannot "
            "be promoted to administrator through this command."
        )

    user = User(
        full_name=cleaned_name,
        email=normalized_email,
        phone=phone,
        password_hash=hash_password(password),
        role="administrator",
        preferred_language=preferred_language,
        is_active=True,
        is_approved=True,
    )

    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise AdminProvisioningError(
            "An account with that email already exists"
        ) from exc

    return user
