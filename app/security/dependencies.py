import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:

    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )

        subject = payload.get("sub")

        if not isinstance(subject, str) or not subject.isdigit():
            raise ValueError("Invalid token subject")

        user_id = int(subject)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise unauthorized

    user = db.get(User, user_id)

    if user is None or not user.is_active or not user.is_approved:
        raise unauthorized

    return user


def get_current_healthcare_worker(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "healthcare_worker":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Healthcare worker privileges are required",
        )

    return current_user
