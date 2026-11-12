from tests.test_documents import (
    PDF_BYTES,
    PNG_BYTES,
    upload_document,
)


def test_patient_can_retrieve_own_history(client, patient_factory):
    patient = patient_factory()

    first = upload_document(
        client,
        patient["headers"],
        filename="prescription.png",
        content=PNG_BYTES,
        category="prescription",
        content_type="image/png",
    )
    second = upload_document(
        client,
        patient["headers"],
        filename="summary.pdf",
        content=PDF_BYTES,
        category="discharge_summary",
    )

    response = client.get(
        "/api/users/me/history",
        headers=patient["headers"],
    )

    assert response.status_code == 200
    history = response.json()
    assert len(history) == 2
    assert [item["document_id"] for item in history] == [
        first.json()["id"],
        second.json()["id"],
    ]
    assert history[0]["original_filename"] == "prescription.png"
    assert history[0]["category"] == "prescription"
    assert history[0]["file_type"] == "image/png"
    assert history[1]["category"] == "discharge_summary"
    assert "stored_filename" not in history[0]
    assert "path" not in str(history).lower()


def test_history_only_contains_authenticated_patients_documents(
    client, patient_factory
):
    patient_a = patient_factory()
    patient_b = patient_factory()

    upload_document(
        client,
        patient_a["headers"],
        filename="a-report.pdf",
    )

    response_b = client.get(
        "/api/users/me/history",
        headers=patient_b["headers"],
    )

    assert response_b.status_code == 200
    assert response_b.json() == []


def test_unauthenticated_history_access_rejected(client):
    response = client.get("/api/users/me/history")

    assert response.status_code == 401
