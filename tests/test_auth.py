from tests.conftest import DEFAULT_PASSWORD, login


def test_patient_registration_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "  Asha   Rao  ",
            "email": "Asha@Example.org",
            "phone": "9999999999",
            "password": "StrongPass123!",
            "preferred_language": "Telugu",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["full_name"] == "Asha Rao"
    assert body["email"] == "asha@example.org"
    assert body["role"] == "patient"
    assert body["preferred_language"] == "te"
    assert body["is_active"] is True
    assert body["is_approved"] is True
    assert "password" not in body
    assert "password_hash" not in body


def test_duplicate_email_rejected_case_insensitively(client, patient_factory):
    patient = patient_factory(email="duplicate@example.org")

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Another Patient",
            "email": "DUPLICATE@example.org",
            "password": "AnotherPass123!",
            "preferred_language": "en",
        },
    )

    assert response.status_code == 409
    assert patient["email"] == "duplicate@example.org"


def test_login_success(client, patient_factory):
    patient = patient_factory()

    response = login(client, patient["email"])

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["expires_in"] > 0
    assert "password_hash" not in body["user"]


def test_login_invalid_password_rejected(client, patient_factory):
    patient = patient_factory()

    response = login(client, patient["email"], "WrongPassword123!")

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_invalid_jwt_rejected(client):
    response = client.get(
        "/api/users/me",
        headers={"Authorization": "Bearer not-a-real-token"},
    )

    assert response.status_code == 401


def test_unauthenticated_profile_access_rejected(client):
    response = client.get("/api/users/me")

    assert response.status_code == 401


def test_get_own_profile(client, patient_factory):
    patient = patient_factory()

    response = client.get("/api/users/me", headers=patient["headers"])

    assert response.status_code == 200
    assert response.json()["id"] == patient["id"]
    assert response.json()["email"] == patient["email"]


def test_update_profile_and_preferred_language(client, patient_factory):
    patient = patient_factory()

    response = client.patch(
        "/api/users/me",
        headers=patient["headers"],
        json={
            "full_name": "Updated Synthetic Name",
            "phone": "8888888888",
            "preferred_language": "Tamil",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == "Updated Synthetic Name"
    assert body["phone"] == "8888888888"
    assert body["preferred_language"] == "ta"


def test_unsupported_language_rejected(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Language Test",
            "email": "language@example.org",
            "password": DEFAULT_PASSWORD,
            "preferred_language": "klingon",
        },
    )

    assert response.status_code == 422


def test_password_is_never_returned(client, patient_factory):
    patient = patient_factory()

    response = client.get("/api/users/me", headers=patient["headers"])

    assert response.status_code == 200
    assert "password" not in response.text
    assert "password_hash" not in response.text
