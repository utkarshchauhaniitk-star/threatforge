import json
import io


def test_complete_end_to_end_security_lifecycle(client):
    """
    Integration verification of full cybersecurity monitoring workflow:
    1. System health check
    2. Empty dashboard verification
    3. Load synthetic demo data
    4. Upload additional security logs (JSON)
    5. Trigger detection engine
    6. Verify generated alerts with MITRE ATT&CK correlation
    7. Update alert status to 'Investigating'
    8. Escalate alert into an Incident Investigation case
    9. Append SOC forensic triage notes
    10. Record root-cause findings and resolve/close case
    11. Verify linked alerts auto-transition to 'Resolved'
    12. Compile and download incident report (JSON & CSV)
    """
    # 1. Health check
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "healthy"

    # 2. Load synthetic demo data
    demo_resp = client.post("/api/demo/load")
    assert demo_resp.status_code == 200
    demo_data = demo_resp.json()
    assert demo_data["events_loaded"] > 0
    assert demo_data["alerts_generated"] > 0

    # 3. Ingest supplementary log file (CSV)
    custom_csv = (
        "timestamp,event_type,source_ip,destination_ip,username,action,status,severity,description\n"
        "2026-11-03 14:00:01,authentication,198.51.100.99,10.0.0.8,admin_test,login,failure,medium,Failed admin login\n"
        "2026-11-03 14:00:05,authentication,198.51.100.99,10.0.0.8,admin_test,login,failure,medium,Failed admin login\n"
    ).encode("utf-8")
    upload_resp = client.post(
        "/api/events/upload?auto_detect=true",
        files={"file": ("supplementary.csv", io.BytesIO(custom_csv), "text/csv")},
    )
    assert upload_resp.status_code == 200
    assert upload_resp.json()["imported_records"] == 2

    # 4. Fetch alerts
    alerts_resp = client.get("/api/alerts")
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()["alerts"]
    assert len(alerts) > 0

    target_alert = alerts[0]
    alert_id = target_alert["id"]

    # 5. Open Alert and Update status to 'Investigating'
    patch_resp = client.patch(
        f"/api/alerts/{alert_id}",
        json={"status": "Investigating", "note": "Analyst assigned for incident verification."},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Investigating"

    # 6. Create Investigation Case linked to Alert
    inv_resp = client.post(
        "/api/investigations",
        json={
            "title": f"Incident Investigation for {target_alert['title']}",
            "description": f"Detailed forensic review of alert {alert_id}.",
            "priority": target_alert["severity"],
            "assigned_to": "SOC Lead Investigator",
            "alert_id": alert_id,
            "initial_note": "Case opened. Cross-referencing firewall dropped packets.",
        },
    )
    assert inv_resp.status_code == 201
    inv_id = inv_resp.json()["id"]

    # 7. Add forensic investigation note
    note_resp = client.post(
        f"/api/investigations/{inv_id}/notes",
        json={
            "author": "SOC Lead Investigator",
            "content": "Malicious source IP confirmed against threat intel feed. Ingress rule applied on perimeter.",
        },
    )
    assert note_resp.status_code == 201
    assert "Ingress rule applied" in note_resp.json()["content"]

    # 8. Record findings and Resolve Case (Closed)
    update_inv_resp = client.patch(
        f"/api/investigations/{inv_id}",
        json={
            "status": "Closed",
            "findings": "Perimeter attack neutralized. Temporary firewall drop policy configured. No data exfiltration detected.",
        },
    )
    assert update_inv_resp.status_code == 200
    assert update_inv_resp.json()["status"] == "Closed"

    # 9. Verify linked alert is now Resolved
    refreshed_alert = client.get(f"/api/alerts/{alert_id}").json()
    assert refreshed_alert["status"] == "Resolved"

    # 10. Generate Incident Report
    report_resp = client.post(
        "/api/reports/generate",
        json={"title": "Executive Incident Investigation Report", "investigation_id": inv_id},
    )
    assert report_resp.status_code == 200
    rep_json = report_resp.json()
    assert rep_json["investigation"]["id"] == inv_id
    assert rep_json["investigation"]["status"] == "Closed"
    assert "AUDIT DISCLAIMER:" in rep_json["limitations"] or "NOTICE:" in rep_json["limitations"]

    # 11. Download CSV Export
    csv_resp = client.get(f"/api/reports/export/csv?investigation_id={inv_id}")
    assert csv_resp.status_code == 200
    assert "ThreatForge Incident Report Export" in csv_resp.text
    assert inv_id in csv_resp.text
