from tests.conftest import DEFAULT_PASSWORD, login

PDF_BYTES = b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"

CONTENT_PAYLOAD = {
    "title": "Safe hydration basics",
    "content": (
        "Drink clean water regularly. This is general health education, "
        "not a diagnosis or treatment plan."
    ),
    "category": "nutrition",
    "language": "en",
    "status": "draft",
}


def worker_headers(client, worker):
    response = login(client, worker["email"], worker["password"])
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def upload_patient_document(client, patient):
    return client.post(
        "/api/documents/upload",
        headers=patient["headers"],
        data={"category": "medical_report"},
        files={
            "file": (
                "overview.pdf",
                PDF_BYTES,
                "application/pdf",
            )
        },
    )


def test_public_registration_cannot_create_administrator(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Escalation Attempt",
            "email": "escalation@example.org",
            "password": DEFAULT_PASSWORD,
            "preferred_language": "en",
            "role": "administrator",
        },
    )

    assert response.status_code == 201
    assert response.json()["role"] == "patient"

    login_response = login(client, "escalation@example.org")
    token = login_response.json()["access_token"]
    admin_response = client.get(
        "/api/admin/overview",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert admin_response.status_code == 403


def test_admin_overview_uses_real_aggregate_data(
    client,
    admin_factory,
    patient_factory,
    worker_factory,
):
    admin = admin_factory()
    patient = patient_factory()
    worker = worker_factory(approve=True)
    assert upload_patient_document(client, patient).status_code == 201

    response = client.post(
        "/api/health-content",
        headers=worker_headers(client, worker),
        json={**CONTENT_PAYLOAD, "status": "published"},
    )
    assert response.status_code == 201, response.text

    overview = client.get("/api/admin/overview", headers=admin["headers"])
    assert overview.status_code == 200, overview.text
    body = overview.json()
    assert body["total_patients"] == 1
    assert body["total_workers"] == 1
    assert body["approved_workers"] == 1
    assert body["pending_workers"] == 0
    assert body["total_documents"] == 1
    assert body["total_content"] == 1
    assert body["published_content"] == 1
    assert body["draft_content"] == 0
    assert body["api_status"] == "healthy"
    assert body["database_status"] == "healthy"


def test_patient_and_worker_cannot_access_admin_routes(
    client,
    patient_factory,
    worker_factory,
):
    patient = patient_factory()
    worker = worker_factory(approve=True)
    worker_auth = worker_headers(client, worker)

    assert (
        client.get(
            "/api/admin/overview",
            headers=patient["headers"],
        ).status_code
        == 403
    )
    assert (
        client.get(
            "/api/admin/users",
            headers=worker_auth,
        ).status_code
        == 403
    )
    assert client.get("/api/admin/overview").status_code == 401


def test_admin_user_listing_never_exposes_password_material(
    client,
    admin_factory,
    patient_factory,
):
    admin = admin_factory()
    patient = patient_factory()

    response = client.get("/api/admin/users", headers=admin["headers"])
    assert response.status_code == 200
    body = response.json()
    assert any(user["id"] == patient["id"] for user in body)
    assert "password" not in response.text
    assert "password_hash" not in response.text


def test_admin_can_deactivate_and_reactivate_patient(
    client,
    admin_factory,
    patient_factory,
):
    admin = admin_factory()
    patient = patient_factory()

    deactivate = client.patch(
        f"/api/admin/users/{patient['id']}/status",
        headers=admin["headers"],
        json={"is_active": False},
    )
    assert deactivate.status_code == 200
    assert deactivate.json()["is_active"] is False
    assert login(client, patient["email"]).status_code == 403

    reactivate = client.patch(
        f"/api/admin/users/{patient['id']}/status",
        headers=admin["headers"],
        json={"is_active": True},
    )
    assert reactivate.status_code == 200
    assert reactivate.json()["is_active"] is True
    assert login(client, patient["email"]).status_code == 200


def test_admin_worker_approval_and_revocation(
    client,
    admin_factory,
    worker_factory,
):
    admin = admin_factory()
    worker = worker_factory()

    pending = client.get(
        "/api/admin/workers?approval=pending",
        headers=admin["headers"],
    )
    assert pending.status_code == 200
    assert [item["id"] for item in pending.json()] == [worker["id"]]

    approve = client.post(
        f"/api/admin/workers/{worker['id']}/approve",
        headers=admin["headers"],
    )
    assert approve.status_code == 200
    assert approve.json()["is_approved"] is True
    assert approve.json()["is_active"] is True
    assert login(client, worker["email"]).status_code == 200

    revoke = client.post(
        f"/api/admin/workers/{worker['id']}/revoke",
        headers=admin["headers"],
    )
    assert revoke.status_code == 200
    assert revoke.json()["is_approved"] is False
    assert revoke.json()["is_active"] is False
    assert login(client, worker["email"]).status_code == 403


def test_admin_cannot_modify_own_status_or_another_admin(
    client,
    admin_factory,
):
    admin = admin_factory()
    other = admin_factory()
    same_response = client.patch(
        f"/api/admin/users/{admin['id']}/status",
        headers=admin["headers"],
        json={"is_active": False},
    )
    other_response = client.patch(
        f"/api/admin/users/{other['id']}/status",
        headers=admin["headers"],
        json={"is_active": False},
    )

    assert same_response.status_code == 400
    assert other_response.status_code == 403


def test_admin_can_publish_content_and_see_analytics(
    client,
    admin_factory,
    worker_factory,
    patient_factory,
):
    admin = admin_factory()
    worker = worker_factory(approve=True)
    patient_factory(language="te")
    patient_factory(language="te")
    patient_factory(language="en")
    headers = worker_headers(client, worker)

    create_response = client.post(
        "/api/health-content",
        headers=headers,
        json=CONTENT_PAYLOAD,
    )
    content_id = create_response.json()["id"]
    assert client.get("/api/health-content").json() == []

    content_list = client.get(
        "/api/admin/content?status=draft",
        headers=admin["headers"],
    )
    assert content_list.status_code == 200
    assert [item["id"] for item in content_list.json()] == [content_id]

    publish = client.patch(
        f"/api/admin/content/{content_id}",
        headers=admin["headers"],
        json={"status": "published"},
    )
    assert publish.status_code == 200
    assert publish.json()["status"] == "published"
    assert len(client.get("/api/health-content").json()) == 1

    analytics = client.get(
        "/api/admin/analytics",
        headers=admin["headers"],
    )
    assert analytics.status_code == 200
    body = analytics.json()
    assert body["patient_registrations"] == 3
    assert body["worker_registrations"] == 1
    assert body["published_content"] == 1
    assert body["documents_by_category"] == {
        "prescription": 0,
        "discharge_summary": 0,
        "medical_report": 0,
    }
    language_counts = {
        item["language"]: item["count"]
        for item in body["language_preferences"]
    }
    assert language_counts == {"te": 2, "en": 1}


def test_admin_monitoring_returns_safe_service_status(
    client,
    admin_factory,
):
    admin = admin_factory()

    response = client.get("/api/admin/monitoring", headers=admin["headers"])

    assert response.status_code == 200
    body = response.json()
    assert body["api_status"] == "healthy"
    assert body["database_status"] == "healthy"
    assert body["database_detail"] == "connected"
    assert "secret" not in response.text.lower()
    assert "password" not in response.text.lower()


def test_admin_can_assign_and_remove_patient(
    client,
    admin_factory,
    patient_factory,
    worker_factory,
):
    admin = admin_factory()
    patient = patient_factory()
    worker = worker_factory(approve=True)

    create = client.post(
        "/api/admin/assignments",
        headers=admin["headers"],
        json={"worker_id": worker["id"], "patient_id": patient["id"]},
    )
    assert create.status_code == 201, create.text
    assignment = create.json()
    assert assignment["worker_id"] == worker["id"]
    assert assignment["patient_id"] == patient["id"]
    assert assignment["assigned_by_id"] == admin["id"]
    assert assignment["worker_name"] == "Synthetic Healthcare Worker"
    assert assignment["patient_name"] == "Synthetic Patient"

    duplicate = client.post(
        "/api/admin/assignments",
        headers=admin["headers"],
        json={"worker_id": worker["id"], "patient_id": patient["id"]},
    )
    assert duplicate.status_code == 409

    listed = client.get(
        "/api/admin/assignments",
        headers=admin["headers"],
    )
    assert len(listed.json()) == 1

    delete = client.delete(
        f"/api/admin/assignments/{assignment['id']}",
        headers=admin["headers"],
    )
    assert delete.status_code == 204
    assert client.get(
        "/api/admin/assignments",
        headers=admin["headers"],
    ).json() == []
