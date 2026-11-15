from datetime import date, timedelta

from app.security.auth import create_access_token
from tests.conftest import login

PDF_BYTES = b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"


def approved_worker_headers(client, worker):
    response = login(client, worker["email"], worker["password"])
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def assign(client, admin, worker, patient):
    response = client.post(
        "/api/admin/assignments",
        headers=admin["headers"],
        json={"worker_id": worker["id"], "patient_id": patient["id"]},
    )
    assert response.status_code == 201, response.text
    return response.json()


def upload_document(client, patient):
    response = client.post(
        "/api/documents/upload",
        headers=patient["headers"],
        data={"category": "prescription"},
        files={
            "file": (
                "shared-prescription.pdf",
                PDF_BYTES,
                "application/pdf",
            )
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_unapproved_and_inactive_worker_isolation(
    client,
    worker_factory,
):
    worker = worker_factory()
    token = create_access_token(worker["id"])
    headers = {"Authorization": f"Bearer {token}"}

    assert client.get("/api/worker/overview", headers=headers).status_code == 401
    assert client.get("/api/worker/patients", headers=headers).status_code == 401
    assert login(client, worker["email"]).status_code == 403


def test_roles_cannot_cross_workspace_boundaries(
    client,
    patient_factory,
    worker_factory,
    admin_factory,
):
    patient = patient_factory()
    worker = worker_factory(approve=True)
    admin = admin_factory()
    worker_auth = approved_worker_headers(client, worker)

    assert (
        client.get(
            "/api/worker/overview",
            headers=patient["headers"],
        ).status_code
        == 403
    )
    assert (
        client.get(
            "/api/worker/overview",
            headers=admin["headers"],
        ).status_code
        == 403
    )
    assert (
        client.get(
            "/api/admin/overview",
            headers=worker_auth,
        ).status_code
        == 403
    )
    assert (
        client.get(
            "/api/documents",
            headers=worker_auth,
        ).status_code
        == 403
    )


def test_worker_only_sees_assigned_patients(
    client,
    admin_factory,
    patient_factory,
    worker_factory,
):
    admin = admin_factory()
    worker = worker_factory(approve=True)
    assigned = patient_factory(email="assigned@example.org")
    unassigned = patient_factory(email="unassigned@example.org")
    assign(client, admin, worker, assigned)
    upload_document(client, assigned)
    upload_document(client, unassigned)
    headers = approved_worker_headers(client, worker)

    patients = client.get("/api/worker/patients", headers=headers)
    assert patients.status_code == 200
    assert [item["id"] for item in patients.json()] == [assigned["id"]]
    assert patients.json()[0]["document_count"] == 1

    detail = client.get(
        f"/api/worker/patients/{assigned['id']}",
        headers=headers,
    )
    assert detail.status_code == 200
    assert detail.json()["documents"][0]["original_filename"] == (
        "shared-prescription.pdf"
    )

    blocked_detail = client.get(
        f"/api/worker/patients/{unassigned['id']}",
        headers=headers,
    )
    assert blocked_detail.status_code == 404

    document_id = upload_document(client, assigned)["id"]
    download = client.get(
        f"/api/worker/patients/{assigned['id']}/documents/"
        f"{document_id}/download",
        headers=headers,
    )
    assert download.status_code == 200
    assert download.content == PDF_BYTES

    blocked_download = client.get(
        f"/api/worker/patients/{unassigned['id']}/documents/"
        f"{document_id}/download",
        headers=headers,
    )
    assert blocked_download.status_code == 404


def test_worker_follow_up_workflow_requires_assignment(
    client,
    admin_factory,
    patient_factory,
    worker_factory,
):
    admin = admin_factory()
    worker = worker_factory(approve=True)
    assigned = patient_factory(email="followup-assigned@example.org")
    unassigned = patient_factory(email="followup-unassigned@example.org")
    assignment = assign(client, admin, worker, assigned)
    headers = approved_worker_headers(client, worker)

    create = client.post(
        "/api/worker/follow-ups",
        headers=headers,
        json={
            "patient_id": assigned["id"],
            "due_date": (date.today() + timedelta(days=2)).isoformat(),
            "notes": "Check whether the patient has questions.",
        },
    )
    assert create.status_code == 201, create.text
    follow_up = create.json()
    assert follow_up["patient_name"] == "Synthetic Patient"
    assert follow_up["status"] == "scheduled"
    assert follow_up["is_overdue"] is False

    overview = client.get("/api/worker/overview", headers=headers)
    assert overview.status_code == 200
    assert overview.json()["assigned_patients"] == 1
    assert overview.json()["scheduled_follow_ups"] == 1

    listed = client.get("/api/worker/follow-ups", headers=headers)
    assert [item["id"] for item in listed.json()] == [follow_up["id"]]

    update = client.patch(
        f"/api/worker/follow-ups/{follow_up['id']}",
        headers=headers,
        json={"status": "completed", "notes": "Follow-up completed."},
    )
    assert update.status_code == 200
    assert update.json()["status"] == "completed"

    blocked_create = client.post(
        "/api/worker/follow-ups",
        headers=headers,
        json={
            "patient_id": unassigned["id"],
            "due_date": date.today().isoformat(),
        },
    )
    assert blocked_create.status_code == 404

    remove_assignment = client.delete(
        f"/api/admin/assignments/{assignment['id']}",
        headers=admin["headers"],
    )
    assert remove_assignment.status_code == 204

    blocked_update = client.patch(
        f"/api/worker/follow-ups/{follow_up['id']}",
        headers=headers,
        json={"status": "cancelled"},
    )
    assert blocked_update.status_code == 404

    delete = client.delete(
        f"/api/worker/follow-ups/{follow_up['id']}",
        headers=headers,
    )
    assert delete.status_code == 204
    assert client.get("/api/worker/follow-ups", headers=headers).json() == []


def test_worker_cannot_manage_another_workers_follow_up(
    client,
    admin_factory,
    patient_factory,
    worker_factory,
):
    admin = admin_factory()
    owner = worker_factory(approve=True)
    other = worker_factory(approve=True)
    patient = patient_factory()
    assign(client, admin, owner, patient)
    assign(client, admin, other, patient)
    owner_headers = approved_worker_headers(client, owner)
    other_headers = approved_worker_headers(client, other)

    create = client.post(
        "/api/worker/follow-ups",
        headers=owner_headers,
        json={
            "patient_id": patient["id"],
            "due_date": date.today().isoformat(),
        },
    )
    follow_up_id = create.json()["id"]

    blocked = client.patch(
        f"/api/worker/follow-ups/{follow_up_id}",
        headers=other_headers,
        json={"status": "completed"},
    )
    assert blocked.status_code == 404
