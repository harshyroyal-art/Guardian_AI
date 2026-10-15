"""
Automated integration tests for FastAPI REST API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.state_manager import state_manager


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_events():
    state_manager.clear_events()
    yield
    state_manager.clear_events()


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "AutoGuardian" in data["service"]


def test_status_endpoint(client):
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert "active_profile" in data
    assert "diagnostics" in data
    assert "blind_spot" in data


def test_demo_scenario_trigger_and_events(client):
    res = client.post("/api/demo/scenario", json={"scenario_id": "sustained_eye_closure"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert len(data["events_triggered"]) > 0

    # Verify event appears in /api/events
    events_res = client.get("/api/events")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 1
    assert events[0]["category"] == "DRIVER_ATTENTION"


def test_event_acknowledgement(client):
    client.post("/api/demo/scenario", json={"scenario_id": "rear_parking_stop"})
    events = client.get("/api/events").json()
    evt_id = events[0]["id"]
    assert events[0]["acknowledged"] is False

    ack_res = client.post(f"/api/events/{evt_id}/acknowledge")
    assert ack_res.status_code == 200
    updated_evt = ack_res.json()["event"]
    assert updated_evt["acknowledged"] is True


def test_demo_reset(client):
    client.post("/api/demo/scenario", json={"scenario_id": "vehicle_diagnostic_fault"})
    assert len(client.get("/api/events").json()) >= 1

    reset_res = client.post("/api/demo/reset")
    assert reset_res.status_code == 200
    assert len(client.get("/api/events").json()) == 0


def test_analytics_endpoint(client):
    client.post("/api/demo/scenario", json={"scenario_id": "high_collision_risk"})
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_events"] >= 1
    assert data["severity_counts"]["CRITICAL"] >= 1


def test_settings_get_and_put(client):
    res = client.get("/api/settings")
    assert res.status_code == 200
    settings = res.json()
    assert settings["audio_alerts_enabled"] is True

    # Update settings
    settings["alert_cooldown_seconds"] = 5.0
    put_res = client.put("/api/settings", json=settings)
    assert put_res.status_code == 200
    assert put_res.json()["alert_cooldown_seconds"] == 5.0


def test_csv_export_endpoint(client):
    client.post("/api/demo/scenario", json={"scenario_id": "left_blind_spot"})
    res = client.get("/api/events/export-csv")
    assert res.status_code == 200
    assert res.headers["content-type"].startswith("text/csv")
    assert "BLIND_SPOT" in res.text
