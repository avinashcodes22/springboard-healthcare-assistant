from tests.conftest import login

BODY = (
    "This general health education content explains everyday wellness "
    "practices. It is not a substitute for professional medical advice."
)


def make_payload(
    title="General wellness",
    category="nutrition",
    language="en",
    status="published",
):
    return {
        "title": title,
        "content": BODY,
        "category": category,
        "language": language,
        "status": status,
    }


def worker_headers(client, worker):
    response = login(client, worker["email"], worker["password"])
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_published_content_is_publicly_retrievable(client, worker_factory):
    worker = worker_factory(approve=True)
    headers = worker_headers(client, worker)

    create_response = client.post(
        "/api/health-content",
        headers=headers,
        json=make_payload(title="Safe drinking water"),
    )
    assert create_response.status_code == 201, create_response.text
    content_id = create_response.json()["id"]

    list_response = client.get("/api/health-content")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["author_name"] == (
        "Synthetic Healthcare Worker"
    )

    detail_response = client.get(f"/api/health-content/{content_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["title"] == "Safe drinking water"


def test_draft_content_is_not_publicly_accessible(client, worker_factory):
    worker = worker_factory(approve=True)
    headers = worker_headers(client, worker)

    create_response = client.post(
        "/api/health-content",
        headers=headers,
        json=make_payload(title="Unpublished draft", status="draft"),
    )
    assert create_response.status_code == 201
    content_id = create_response.json()["id"]

    assert client.get("/api/health-content").json() == []
    assert client.get(f"/api/health-content/{content_id}").status_code == 404

    mine_response = client.get("/api/health-content/mine", headers=headers)
    assert mine_response.status_code == 200
    assert [item["id"] for item in mine_response.json()] == [content_id]


def test_language_and_category_filtering(client, worker_factory):
    worker = worker_factory(approve=True)
    headers = worker_headers(client, worker)

    client.post(
        "/api/health-content",
        headers=headers,
        json=make_payload(
            title="English nutrition",
            language="English",
            category="Nutrition",
        ),
    )
    client.post(
        "/api/health-content",
        headers=headers,
        json=make_payload(
            title="Telugu hygiene",
            language="Telugu",
            category="hygiene",
        ),
    )

    telugu_response = client.get(
        "/api/health-content",
        params={"language": "te"},
    )
    assert telugu_response.status_code == 200
    assert [item["title"] for item in telugu_response.json()] == [
        "Telugu hygiene"
    ]

    nutrition_response = client.get(
        "/api/health-content",
        params={"category": "Nutrition"},
    )
    assert nutrition_response.status_code == 200
    assert [item["title"] for item in nutrition_response.json()] == [
        "English nutrition"
    ]

    combined_response = client.get(
        "/api/health-content",
        params={"language": "te", "category": "nutrition"},
    )
    assert combined_response.status_code == 200
    assert combined_response.json() == []

    invalid_response = client.get(
        "/api/health-content",
        params={"language": "unsupported"},
    )
    assert invalid_response.status_code == 422


def test_unauthorized_content_creation_rejected(
    client, patient_factory
):
    patient = patient_factory()

    unauthenticated = client.post(
        "/api/health-content",
        json=make_payload(),
    )
    assert unauthenticated.status_code == 401

    patient_attempt = client.post(
        "/api/health-content",
        headers=patient["headers"],
        json=make_payload(),
    )
    assert patient_attempt.status_code == 403


def test_worker_can_publish_and_manage_own_draft(client, worker_factory):
    worker = worker_factory(approve=True)
    headers = worker_headers(client, worker)

    create_response = client.post(
        "/api/health-content",
        headers=headers,
        json=make_payload(title="Draft to publish", status="draft"),
    )
    content_id = create_response.json()["id"]
    assert client.get("/api/health-content").json() == []

    update_response = client.patch(
        f"/api/health-content/{content_id}",
        headers=headers,
        json={"status": "published", "title": "Now published"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "published"
    assert update_response.json()["title"] == "Now published"

    assert len(client.get("/api/health-content").json()) == 1

    delete_response = client.delete(
        f"/api/health-content/{content_id}",
        headers=headers,
    )
    assert delete_response.status_code == 204
    assert client.get("/api/health-content").json() == []


def test_worker_cannot_manage_another_workers_content(
    client, worker_factory
):
    owner = worker_factory(approve=True)
    other = worker_factory(approve=True)
    owner_headers = worker_headers(client, owner)
    other_headers = worker_headers(client, other)

    create_response = client.post(
        "/api/health-content",
        headers=owner_headers,
        json=make_payload(title="Owned by someone else"),
    )
    content_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/health-content/{content_id}",
        headers=other_headers,
        json={"title": "Hijacked title"},
    )
    assert update_response.status_code == 404

    delete_response = client.delete(
        f"/api/health-content/{content_id}",
        headers=other_headers,
    )
    assert delete_response.status_code == 404
