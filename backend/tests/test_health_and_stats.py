def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["version"] == "1.0.0"
    assert "timestamp" in data


def test_dashboard_stats_empty(client):
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_events"] == 0
    assert data["total_alerts"] == 0
    assert data["critical_alerts"] == 0
    assert data["total_investigations"] == 0
    assert len(data["severity_distribution"]) == 4
