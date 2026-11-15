import itertools
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import User
from app.security.auth import hash_password

DEFAULT_PASSWORD = "StrongPass123!"


@pytest.fixture()
def app_context(tmp_path, monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    TestingSessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False,
        expire_on_commit=False,
    )

    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    upload_dir = tmp_path / "uploads"
    monkeypatch.setattr(settings, "uploads_dir", upload_dir)
    monkeypatch.setattr(
        settings,
        "max_upload_size_bytes",
        10 * 1024 * 1024,
    )

    with TestClient(app) as test_client:
        yield test_client, TestingSessionLocal

    app.dependency_overrides.pop(get_db, None)
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def client(app_context):
    return app_context[0]


@pytest.fixture()
def session_factory(app_context):
    return app_context[1]


@pytest.fixture()
def upload_dir(app_context) -> Path:
    return Path(settings.uploads_dir)


@pytest.fixture()
def patient_factory(client):
    counter = itertools.count()

    def create(
        email: str | None = None,
        password: str = DEFAULT_PASSWORD,
        language: str = "en",
    ) -> dict:
        email = email or f"patient{next(counter)}@example.org"

        register_response = client.post(
            "/api/auth/register",
            json={
                "full_name": "Synthetic Patient",
                "email": email,
                "password": password,
                "preferred_language": language,
            },
        )
        assert register_response.status_code == 201, register_response.text

        login_response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_response.status_code == 200, login_response.text

        token = login_response.json()["access_token"]

        return {
            "email": email,
            "password": password,
            "token": token,
            "id": login_response.json()["user"]["id"],
            "headers": {"Authorization": f"Bearer {token}"},
        }

    return create


@pytest.fixture()
def worker_factory(client, session_factory):
    counter = itertools.count()

    def create(
        email: str | None = None,
        password: str = DEFAULT_PASSWORD,
        approve: bool = False,
    ) -> dict:
        email = email or f"worker{next(counter)}@example.org"

        register_response = client.post(
            "/api/auth/register/healthcare-worker",
            json={
                "full_name": "Synthetic Healthcare Worker",
                "email": email,
                "password": password,
                "preferred_language": "en",
            },
        )
        assert register_response.status_code == 201, register_response.text
        worker_id = register_response.json()["id"]

        if approve:
            from app.services.worker_approval import set_worker_approval

            with session_factory() as db:
                set_worker_approval(db, email, approved=True)

        return {
            "email": email,
            "password": password,
            "id": worker_id,
            "registered": register_response.json(),
        }

    return create


@pytest.fixture()
def admin_factory(client, session_factory):
    counter = itertools.count()

    def create(
        email: str | None = None,
        password: str = DEFAULT_PASSWORD,
    ) -> dict:
        email = email or f"admin{next(counter)}@example.org"

        with session_factory() as db:
            user = User(
                full_name="Synthetic Administrator",
                email=email,
                phone=None,
                password_hash=hash_password(password),
                role="administrator",
                preferred_language="en",
                is_active=True,
                is_approved=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            user_id = user.id

        login_response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert login_response.status_code == 200, login_response.text
        token = login_response.json()["access_token"]

        return {
            "email": email,
            "password": password,
            "token": token,
            "id": user_id,
            "headers": {"Authorization": f"Bearer {token}"},
        }

    return create


def login(client, email: str, password: str = DEFAULT_PASSWORD):
    return client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
