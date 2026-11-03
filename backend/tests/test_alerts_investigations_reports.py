import json
from datetime import datetime, timezone
from app.models.alert import Alert
from app.models.investigation import Investigation


def test_alert_lifecycle_and_investigation(client, db_session):
    now = datetime.now(timezone.utc)
    # Create test alert
    alert = Alert(
        id="ALT-TEST-001",
        title="Possible Brute Force Attack",
        description="5 failed attempts from 198.51.100.42",
        severity="High",
        status="New",
        rule_id="RULE-BRUTEFORCE",
        rule_name="Possible Brute Force Attack",
        source_ip="198.51.100.42",
        username="admin",
        event_count=5,
        timestamp=now,
    )
    db_session.add(alert)
    db_session.commit()

    # 1. List alerts
    alerts_resp = client.get("/api/alerts")
    assert alerts_resp.status_code == 200
    assert alerts_resp.json()["total"] == 1

    # 2. Update status and note
    patch_resp = client.patch(
        "/api/alerts/ALT-TEST-001",
        json={"status": "Investigating", "note": "Analyst assigned to review logs"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Investigating"

    # 3. Create Investigation
    inv_resp = client.post(
        "/api/investigations",
        json={
            "title": "Investigate Brute Force 198.51.100.42",
            "description": "Suspicious login burst observed",
            "priority": "High",
            "assigned_to": "SOC Analyst Bob",
            "alert_id": "ALT-TEST-001",
            "initial_note": "Initial triage started.",
        },
    )
    assert inv_resp.status_code == 201
    inv_data = inv_resp.json()
    inv_id = inv_data["id"]
    assert inv_data["status"] == "Open"
    assert len(inv_data["notes"]) == 1

    # 4. Add additional note to investigation
    note_resp = client.post(
        f"/api/investigations/{inv_id}/notes",
        json={"author": "SOC Analyst Bob", "content": "Confirmed IP is external host. Block request submitted."},
    )
    assert note_resp.status_code == 201
    assert "Block request submitted" in note_resp.json()["content"]

    # 5. Update investigation findings & close
    update_inv = client.patch(
        f"/api/investigations/{inv_id}",
        json={"status": "Closed", "findings": "Malicious brute force attempts mitigated by firewall block rule."},
    )
    assert update_inv.status_code == 200
    assert update_inv.json()["status"] == "Closed"

    # Check that related alert was auto-resolved
    refreshed_alert = client.get("/api/alerts/ALT-TEST-001").json()
    assert refreshed_alert["status"] == "Resolved"

    # 6. Generate Report
    report_resp = client.post(
        "/api/reports/generate",
        json={"title": "Weekly Incident Report", "investigation_id": inv_id},
    )
    assert report_resp.status_code == 200
    rep_data = report_resp.json()
    assert rep_data["investigation"]["id"] == inv_id
    assert len(rep_data["alerts"]) >= 1
    assert "NOTICE:" in rep_data["limitations"]

    # 7. Export CSV
    csv_resp = client.get(f"/api/reports/export/csv?investigation_id={inv_id}")
    assert csv_resp.status_code == 200
    assert "ThreatForge Incident Report Export" in csv_resp.text
    assert "ALT-TEST-001" in csv_resp.text


def test_demo_data_loading_idempotent(client):
    # First load
    load1 = client.post("/api/demo/load")
    assert load1.status_code == 200
    d1 = load1.json()
    assert d1["status"] == "success"
    assert d1["events_loaded"] > 0
    assert d1["alerts_generated"] > 0

    # Second load without force: should prevent duplicate explosions
    load2 = client.post("/api/demo/load")
    assert load2.status_code == 200
    d2 = load2.json()
    assert d2["events_loaded"] == 0
    assert "Duplicate creation prevented" in d2["message"]

    # Check dashboard stats reflect loaded demo events
    stats_resp = client.get("/api/dashboard/stats")
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_events"] > 0
    assert stats["total_alerts"] > 0
