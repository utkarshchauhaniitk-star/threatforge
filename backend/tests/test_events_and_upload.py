import io
import json


def test_upload_valid_json(client):
    events_payload = [
        {
            "timestamp": "2026-11-03T10:00:00Z",
            "event_type": "authentication",
            "source_ip": "198.51.100.10",
            "destination_ip": "10.0.0.1",
            "username": "alice",
            "action": "login",
            "status": "success",
            "severity": "low",
            "description": "User login success",
        },
        {
            "timestamp": "2026-11-03T10:01:00Z",
            "event_type": "authentication",
            "source_ip": "198.51.100.20",
            "destination_ip": "10.0.0.1",
            "username": "bob",
            "action": "login",
            "status": "failure",
            "severity": "medium",
            "description": "Invalid credentials",
        },
    ]

    file_content = json.dumps(events_payload).encode("utf-8")
    files = {"file": ("auth_logs.json", io.BytesIO(file_content), "application/json")}

    response = client.post("/api/events/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["imported_records"] == 2
    assert data["failed_records"] == 0

    # Verify query
    list_resp = client.get("/api/events")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 2


def test_upload_valid_csv(client):
    csv_content = (
        "timestamp,event_type,source_ip,destination_ip,username,action,status,severity,description\n"
        "2026-11-03 12:00:00,network,203.0.113.5,10.0.0.2,admin,connection,denied,high,Firewall drop\n"
    ).encode("utf-8")

    files = {"file": ("firewall.csv", io.BytesIO(csv_content), "text/csv")}
    response = client.post("/api/events/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["imported_records"] == 1


def test_upload_malformed_json_rejected(client):
    malformed = b"{ bad json: missing quote"
    files = {"file": ("corrupt.json", io.BytesIO(malformed), "application/json")}
    response = client.post("/api/events/upload", files=files)
    assert response.status_code == 400
    assert "File rejection error" in response.json()["detail"]["message"]


def test_upload_empty_file_rejected(client):
    empty = b""
    files = {"file": ("empty.json", io.BytesIO(empty), "application/json")}
    response = client.post("/api/events/upload", files=files)
    assert response.status_code == 400


def test_get_event_not_found(client):
    response = client.get("/api/events/nonexistent-id")
    assert response.status_code == 404


def test_upload_partial_valid_json_succeeds(client):
    mixed_payload = [
        {
            "timestamp": "2026-11-03T14:00:00Z",
            "event_type": "authentication",
            "source_ip": "198.51.100.99",
            "username": "charlie",
            "action": "login",
            "status": "success",
            "severity": "low",
            "description": "Valid event in mixed upload",
        },
        "this is an invalid record that is not an object",
    ]
    files = {"file": ("mixed.json", io.BytesIO(json.dumps(mixed_payload).encode("utf-8")), "application/json")}
    response = client.post("/api/events/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_records"] == 2
    assert data["imported_records"] == 1
    assert data["failed_records"] == 1
    assert len(data["errors"]) >= 1

