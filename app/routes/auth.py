from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    TokenResponse,
)
from app.security.auth import (
    hash_password,
    verify_password,
    create_access_token,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def create_user(
    payload: RegisterRequest,
    role: str,
    active: bool,
    approved: bool,
    db: Session,
):
    email = str(payload.email).lower()

    existing = db.scalar(
        select(User).where(User.email == email)
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email address is already registered",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=role,
        preferred_language=payload.preferred_language,
        is_active=active,
        is_approved=approved,
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email address is already registered",
        )

    return user


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_patient(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    return create_user(payload, "patient", True, True, db)


@router.post(
    "/register/healthcare-worker",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_healthcare_worker(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    return create_user(
        payload,
        "healthcare_worker",
        False,
        False,
        db,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    email = str(payload.email).lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not user.is_active or not user.is_approved:
        raise HTTPException(
            status_code=403,
            detail="Account is not active or is awaiting approval",
        )

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
        "user": user,
    }

