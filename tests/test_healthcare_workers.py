from app.security.auth import create_access_token
from tests.conftest import login

CONTENT_PAYLOAD = {
    "title": "Staying hydrated",
    "content": (
        "Drink clean water regularly, especially in hot weather. "
        "This is general health education, not medical advice."
    ),
    "category": "nutrition",
    "language": "en",
    "status": "published",
}


def test_worker_registration_is_inactive_and_unapproved(
    client, worker_factory
):
    worker = worker_factory()

    assert worker["registered"]["role"] == "healthcare_worker"
    assert worker["registered"]["is_active"] is False
    assert worker["registered"]["is_approved"] is False

    response = login(client, worker["email"], worker["password"])
    assert response.status_code == 403


def test_inactive_worker_token_cannot_access_protected_functions(
    client, worker_factory
):
    worker = worker_factory()
    token = create_access_token(worker["id"])

    response = client.post(
        "/api/health-content",
        headers={"Authorization": f"Bearer {token}"},
        json=CONTENT_PAYLOAD,
    )

    assert response.status_code == 401


def test_patient_cannot_create_healthcare_content(client, patient_factory):
    patient = patient_factory()

    response = client.post(
        "/api/health-content",
        headers=patient["headers"],
        json=CONTENT_PAYLOAD,
    )

    assert response.status_code == 403


def test_approved_worker_can_login_and_view_profile(
    client, worker_factory
):
    worker = worker_factory(approve=True)

    login_response = login(client, worker["email"], worker["password"])
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile_response = client.get("/api/users/me", headers=headers)
    assert profile_response.status_code == 200
    profile = profile_response.json()
    assert profile["role"] == "healthcare_worker"
    assert profile["is_active"] is True
    assert profile["is_approved"] is True


def test_approved_worker_can_create_content(
    client, worker_factory
):
    worker = worker_factory(approve=True)

    login_response = login(client, worker["email"], worker["password"])
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    response = client.post(
        "/api/health-content",
        headers={"Authorization": f"Bearer {token}"},
        json=CONTENT_PAYLOAD,
    )

    assert response.status_code == 201
    assert response.json()["author_id"] == worker["id"]
    assert response.json()["status"] == "published"
