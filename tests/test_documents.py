from pathlib import Path

from app.config import settings

PDF_BYTES = b"%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG_BYTES = b"\xff\xd8\xff\xe0" + b"\x00" * 64


def upload_document(
    client,
    headers,
    filename="report.pdf",
    content=PDF_BYTES,
    category="medical_report",
    content_type="application/pdf",
):
    return client.post(
        "/api/documents/upload",
        headers=headers,
        data={"category": category},
        files={"file": (filename, content, content_type)},
    )


def test_pdf_upload_success(client, patient_factory, upload_dir):
    patient = patient_factory()

    response = upload_document(
        client,
        patient["headers"],
        filename="blood-test.pdf",
        category="medical_report",
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["original_filename"] == "blood-test.pdf"
    assert body["category"] == "medical_report"
    assert body["content_type"] == "application/pdf"
    assert body["size_bytes"] == len(PDF_BYTES)
    assert "stored_filename" not in body
    assert "path" not in response.text.lower()

    stored_files = list(Path(upload_dir).iterdir())
    assert len(stored_files) == 1
    assert stored_files[0].name != "blood-test.pdf"
    assert stored_files[0].suffix == ".pdf"


def test_image_upload_success(client, patient_factory, upload_dir):
    patient = patient_factory()

    png_response = upload_document(
        client,
        patient["headers"],
        filename="scan.png",
        content=PNG_BYTES,
        category="medical_report",
        content_type="image/png",
    )
    jpeg_response = upload_document(
        client,
        patient["headers"],
        filename="photo.jpeg",
        content=JPEG_BYTES,
        category="prescription",
        content_type="image/jpeg",
    )

    assert png_response.status_code == 201, png_response.text
    assert png_response.json()["content_type"] == "image/png"
    assert jpeg_response.status_code == 201, jpeg_response.text
    assert jpeg_response.json()["content_type"] == "image/jpeg"
    assert len(list(Path(upload_dir).iterdir())) == 2


def test_unsupported_file_rejected(client, patient_factory, upload_dir):
    patient = patient_factory()

    response = upload_document(
        client,
        patient["headers"],
        filename="notes.txt",
        content=b"plain text",
        content_type="text/plain",
    )

    assert response.status_code == 400
    assert not Path(upload_dir).exists() or (
        list(Path(upload_dir).iterdir()) == []
    )


def test_spoofed_extension_rejected(client, patient_factory, upload_dir):
    patient = patient_factory()

    response = upload_document(
        client,
        patient["headers"],
        filename="fake.png",
        content=PDF_BYTES,
        content_type="image/png",
    )

    assert response.status_code == 400
    assert list(Path(upload_dir).iterdir()) == []


def test_empty_file_rejected(client, patient_factory, upload_dir):
    patient = patient_factory()

    response = upload_document(
        client,
        patient["headers"],
        filename="empty.pdf",
        content=b"",
    )

    assert response.status_code == 400
    assert list(Path(upload_dir).iterdir()) == []


def test_oversized_file_rejected(
    client, patient_factory, upload_dir, monkeypatch
):
    patient = patient_factory()
    monkeypatch.setattr(settings, "max_upload_size_bytes", 1024)

    response = upload_document(
        client,
        patient["headers"],
        filename="large.pdf",
        content=PDF_BYTES + b"A" * 4096,
    )

    assert response.status_code == 413
    assert list(Path(upload_dir).iterdir()) == []


def test_invalid_category_rejected(client, patient_factory):
    patient = patient_factory()

    response = upload_document(
        client,
        patient["headers"],
        category="invented_category",
    )

    assert response.status_code == 422


def test_unauthenticated_upload_rejected(client):
    response = upload_document(client, {})

    assert response.status_code == 401


def test_document_listing_and_download(client, patient_factory):
    patient = patient_factory()

    upload_response = upload_document(client, patient["headers"])
    document_id = upload_response.json()["id"]

    list_response = client.get(
        "/api/documents",
        headers=patient["headers"],
    )
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["id"] == document_id

    download_response = client.get(
        f"/api/documents/{document_id}/download",
        headers=patient["headers"],
    )
    assert download_response.status_code == 200
    assert download_response.content == PDF_BYTES
    assert "attachment" in download_response.headers["content-disposition"]


def test_document_ownership_is_enforced(client, patient_factory):
    owner = patient_factory()
    other = patient_factory()

    upload_response = upload_document(client, owner["headers"])
    document_id = upload_response.json()["id"]

    assert (
        client.get(
            f"/api/documents/{document_id}",
            headers=other["headers"],
        ).status_code
        == 404
    )
    assert (
        client.get(
            f"/api/documents/{document_id}/download",
            headers=other["headers"],
        ).status_code
        == 404
    )
    assert (
        client.delete(
            f"/api/documents/{document_id}",
            headers=other["headers"],
        ).status_code
        == 404
    )

    other_list = client.get("/api/documents", headers=other["headers"])
    assert other_list.status_code == 200
    assert other_list.json() == []


def test_document_deletion_removes_record_and_file(
    client, patient_factory, upload_dir
):
    patient = patient_factory()

    upload_response = upload_document(client, patient["headers"])
    document_id = upload_response.json()["id"]
    assert len(list(Path(upload_dir).iterdir())) == 1

    delete_response = client.delete(
        f"/api/documents/{document_id}",
        headers=patient["headers"],
    )

    assert delete_response.status_code == 204
    assert list(Path(upload_dir).iterdir()) == []
    assert (
        client.get(
            f"/api/documents/{document_id}",
            headers=patient["headers"],
        ).status_code
        == 404
    )


def test_path_traversal_filename_is_sanitized(
    client, patient_factory, upload_dir
):
    patient = patient_factory()

    response = upload_document(
        client,
        patient["headers"],
        filename="../../evil.pdf",
    )

    assert response.status_code == 201
    assert response.json()["original_filename"] == "evil.pdf"

    stored_files = list(Path(upload_dir).iterdir())
    assert len(stored_files) == 1
    assert stored_files[0].parent == Path(upload_dir)
