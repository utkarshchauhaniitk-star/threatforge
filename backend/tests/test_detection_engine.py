from datetime import datetime, timezone, timedelta
from app.models.event import SecurityEvent
from app.services.detection_engine import run_threat_detection


def test_rule1_brute_force_detection(db_session):
    now = datetime.now(timezone.utc)
    # Insert 6 failed attempts for same IP and user within 5 minutes
    for i in range(6):
        ev = SecurityEvent(
            id=f"test-bf-{i}",
            timestamp=now - timedelta(minutes=5 - i),
            event_type="authentication",
            source_ip="198.51.100.99",
            destination_ip="10.0.0.5",
            username="target_user",
            action="login",
            status="failure",
            severity="medium",
            description="Failed password",
        )
        db_session.add(ev)
    db_session.commit()

    alerts = run_threat_detection(db_session)
    assert any(a.rule_id == "RULE-BRUTEFORCE" for a in alerts)
    bf_alert = next(a for a in alerts if a.rule_id == "RULE-BRUTEFORCE")
    assert bf_alert.source_ip == "198.51.100.99"
    assert bf_alert.username == "target_user"
    assert bf_alert.event_count >= 5


def test_rule2_suspicious_login_sequence(db_session):
    now = datetime.now(timezone.utc)
    # 2 failures followed by 1 success
    for i in range(2):
        ev = SecurityEvent(
            id=f"test-susp-fail-{i}",
            timestamp=now - timedelta(minutes=10 - i),
            event_type="authentication",
            source_ip="198.51.100.123",
            username="analyst_bob",
            action="login",
            status="failure",
            severity="medium",
            description="Bad credentials",
        )
        db_session.add(ev)

    succ_ev = SecurityEvent(
        id="test-susp-succ",
        timestamp=now - timedelta(minutes=7),
        event_type="authentication",
        source_ip="198.51.100.123",
        username="analyst_bob",
        action="login",
        status="success",
        severity="low",
        description="Login OK",
    )
    db_session.add(succ_ev)
    db_session.commit()

    alerts = run_threat_detection(db_session)
    assert any(a.rule_id == "RULE-SUSP-LOGIN" for a in alerts)


def test_rule3_password_spray_detection(db_session):
    now = datetime.now(timezone.utc)
    users = ["user1", "user2", "user3", "user4"]
    for idx, u in enumerate(users):
        ev = SecurityEvent(
            id=f"test-spray-{idx}",
            timestamp=now - timedelta(minutes=15 - idx),
            event_type="authentication",
            source_ip="203.0.113.77",
            username=u,
            action="login",
            status="failure",
            severity="medium",
            description="Spray failure",
        )
        db_session.add(ev)
    db_session.commit()

    alerts = run_threat_detection(db_session)
    assert any(a.rule_id == "RULE-SPRAY" for a in alerts)
    spray_alert = next(a for a in alerts if a.rule_id == "RULE-SPRAY")
    assert spray_alert.source_ip == "203.0.113.77"


def test_rule4_privileged_activity_detection(db_session):
    now = datetime.now(timezone.utc)
    ev = SecurityEvent(
        id="test-priv-1",
        timestamp=now,
        event_type="authorization",
        source_ip="192.0.2.55",
        username="unprivileged_joe",
        action="privilege_escalation",
        status="failure",
        severity="critical",
        description="Attempted sudo to root without privileges",
    )
    db_session.add(ev)
    db_session.commit()

    alerts = run_threat_detection(db_session)
    assert any(a.rule_id == "RULE-PRIV-ACTION" for a in alerts)


def test_rule5_network_denial_burst(db_session):
    now = datetime.now(timezone.utc)
    for i in range(12):
        ev = SecurityEvent(
            id=f"test-burst-{i}",
            timestamp=now - timedelta(minutes=5) + timedelta(seconds=i * 10),
            event_type="network",
            source_ip="203.0.113.222",
            action="connection",
            status="denied",
            severity="medium",
            description="Firewall drop",
        )
        db_session.add(ev)
    db_session.commit()

    alerts = run_threat_detection(db_session)
    assert any(a.rule_id == "RULE-TRAFFIC-BURST" for a in alerts)
