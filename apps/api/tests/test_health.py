from fastapi.testclient import TestClient

from app.main import app


def test_health_reports_dependency_status():
    """Runs without Postgres or Meilisearch: the endpoint must degrade, not raise."""
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"status", "postgres", "meilisearch"}
    assert body["status"] in {"ok", "degraded"}


def test_openapi_schema_is_served():
    with TestClient(app) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.json()["info"]["title"] == "Pelintir API"
