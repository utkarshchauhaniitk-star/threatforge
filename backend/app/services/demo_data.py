import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.event import SecurityEvent
from app.models.alert import Alert
from app.models.investigation import Investigation, InvestigationNote
from app.services.detection_engine import run_threat_detection, initialize_default_rules


DEMO_TAG = "DEMO_SYNTHETIC_DATASET_V1"


def load_synthetic_demo_data(db: Session, force_reload: bool = False) -> Tuple[int, int, str]:
    """
    Populate database with realistic, RFC-compliant synthetic cybersecurity telemetry.
    Ensures idempotency so repeated clicks do not create duplicate data explosions.
    Returns: (events_loaded, alerts_generated, status_message)
    """
    initialize_default_rules(db)

    # Check if demo events already exist
    existing_demo_events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.source == DEMO_TAG)
        .count()
    )

    if existing_demo_events > 0 and not force_reload:
        # Already loaded, run detection to ensure alerts are up-to-date and return
        alerts = run_threat_detection(db)
        return 0, len(alerts), f"Demo data is already active ({existing_demo_events} events present). Duplicate creation prevented."

    if force_reload and existing_demo_events > 0:
        # Clear existing demo records cleanly
        db.query(SecurityEvent).filter(SecurityEvent.source == DEMO_TAG).delete(synchronize_session=False)
        db.commit()

    now = datetime.now(timezone.utc)
    events_to_add = []

    # 1. SCENARIO A: Brute Force Attack against 'jdoe'
    # 7 failed attempts within 8 minutes from RFC 5737 doc IP 198.51.100.42
    bf_ip = "198.51.100.42"
    bf_target = "jdoe"
    for i in range(7):
        ts = now - timedelta(minutes=45 - i)
        events_to_add.append(
            SecurityEvent(
                id=f"EVT-BF-{i+1:03d}",
                timestamp=ts,
                event_type="authentication",
                source_ip=bf_ip,
                destination_ip="10.0.0.5",
                username=bf_target,
                action="login",
                status="failure",
                severity="medium",
                description=f"SSH authentication failed for user '{bf_target}' from {bf_ip}: invalid password (attempt {i+1}/7).",
                source=DEMO_TAG,
                raw_event_data=json.dumps({
                    "synthetic": True,
                    "service": "sshd",
                    "auth_method": "password",
                    "attempt": i + 1,
                    "scenario": "brute_force"
                }),
            )
        )

    # 2. SCENARIO B: Password Spray across 5 distinct corporate accounts
    # Source: 203.0.113.88 targeting admin, finance, devops, hr_lead, ceo
    spray_ip = "203.0.113.88"
    spray_users = ["admin", "finance", "devops", "hr_lead", "it_support"]
    for idx, user in enumerate(spray_users):
        ts = now - timedelta(minutes=60 - (idx * 3))
        events_to_add.append(
            SecurityEvent(
                id=f"EVT-SPRAY-{idx+1:03d}",
                timestamp=ts,
                event_type="authentication",
                source_ip=spray_ip,
                destination_ip="10.0.0.10",
                username=user,
                action="login",
                status="failure",
                severity="medium",
                description=f"O365 portal authentication failure for '{user}' from {spray_ip}: invalid credentials.",
                source=DEMO_TAG,
                raw_event_data=json.dumps({
                    "synthetic": True,
                    "service": "azure_ad",
                    "client_app": "browser",
                    "scenario": "password_spray"
                }),
            )
        )

    # 3. SCENARIO C: Suspicious Login Breakthrough
    # 3 failed attempts followed by 1 successful login from 198.51.100.99 for 'mscott'
    susp_ip = "198.51.100.99"
    for i in range(3):
        ts = now - timedelta(minutes=30 - i)
        events_to_add.append(
            SecurityEvent(
                id=f"EVT-SUSP-FAIL-{i+1:03d}",
                timestamp=ts,
                event_type="authentication",
                source_ip=susp_ip,
                destination_ip="10.0.0.8",
                username="mscott",
                action="login",
                status="failure",
                severity="medium",
                description=f"VPN Gateway login failure for user 'mscott' from {susp_ip}.",
                source=DEMO_TAG,
                raw_event_data=json.dumps({
                    "synthetic": True,
                    "service": "vpn_gateway",
                    "scenario": "suspicious_login_sequence"
                }),
            )
        )
    # The breakthrough success
    events_to_add.append(
        SecurityEvent(
            id="EVT-SUSP-SUCC-001",
            timestamp=now - timedelta(minutes=26),
            event_type="authentication",
            source_ip=susp_ip,
            destination_ip="10.0.0.8",
            username="mscott",
            action="login",
            status="success",
            severity="low",
            description=f"VPN Gateway login SUCCEEDED for user 'mscott' from {susp_ip} following multiple failed attempts.",
            source=DEMO_TAG,
            raw_event_data=json.dumps({
                "synthetic": True,
                "service": "vpn_gateway",
                "scenario": "suspicious_login_sequence",
                "auth_factor": "single_password"
            }),
        )
    )

    # 4. SCENARIO D: Unusual Privileged Activity (sudo / shadow read attempt)
    priv_ip = "192.0.2.15"
    events_to_add.append(
        SecurityEvent(
            id="EVT-PRIV-001",
            timestamp=now - timedelta(minutes=20),
            event_type="authorization",
            source_ip=priv_ip,
            destination_ip="10.0.0.20",
            username="dev_alex",
            action="privilege_escalation",
            status="failure",
            severity="critical",
            description="Unauthorized sudo invocation: dev_alex is NOT in sudoers file. Command attempted: '/bin/cat /etc/shadow'.",
            source=DEMO_TAG,
            raw_event_data=json.dumps({
                "synthetic": True,
                "host": "prod-api-server-01",
                "command": "/bin/cat /etc/shadow",
                "tty": "pts/2",
                "scenario": "privilege_violation"
            }),
        )
    )

    # 5. SCENARIO E: High Frequency Network Denials (Port Scan Probing)
    # 12 blocked firewall packets from 203.0.113.201 targeting various ports
    scan_ip = "203.0.113.201"
    ports = [22, 80, 443, 445, 1433, 3389, 5432, 6379, 8080, 8443, 9200, 27017]
    for idx, p in enumerate(ports):
        ts = now - timedelta(minutes=15) + timedelta(seconds=idx * 8)
        events_to_add.append(
            SecurityEvent(
                id=f"EVT-SCAN-{idx+1:03d}",
                timestamp=ts,
                event_type="network",
                source_ip=scan_ip,
                destination_ip=f"10.0.0.{100 + idx}",
                username=None,
                action="connection",
                status="denied",
                severity="medium",
                description=f"Edge firewall policy DROP: TCP SYN packet from {scan_ip} to dst_port {p} denied by default deny rule.",
                source=DEMO_TAG,
                raw_event_data=json.dumps({
                    "synthetic": True,
                    "dst_port": p,
                    "protocol": "TCP",
                    "interface": "eth0",
                    "scenario": "port_scan"
                }),
            )
        )

    # 6. SCENARIO F: Normal Baseline Corporate Telemetry (Benign background activity)
    normal_users = ["alice.smith", "bob.johnson", "charlie.wong", "diana.prince", "elena.rostova"]
    normal_ips = ["10.0.1.15", "10.0.1.22", "10.0.2.45", "10.0.2.80", "10.0.3.12"]
    for i in range(15):
        u = normal_users[i % len(normal_users)]
        ip = normal_ips[i % len(normal_ips)]
        ts = now - timedelta(minutes=120 - (i * 7))
        events_to_add.append(
            SecurityEvent(
                id=f"EVT-NORM-{i+1:03d}",
                timestamp=ts,
                event_type="authentication" if i % 2 == 0 else "system",
                source_ip=ip,
                destination_ip="10.0.0.2",
                username=u,
                action="login" if i % 2 == 0 else "file_access",
                status="success",
                severity="low",
                description=f"Authorized user '{u}' logged in from workstation {ip} via SSO." if i % 2 == 0 else f"User '{u}' accessed corporate file share /docs/reports.",
                source=DEMO_TAG,
                raw_event_data=json.dumps({
                    "synthetic": True,
                    "service": "okta_sso",
                    "mfa_verified": True,
                    "scenario": "benign_activity"
                }),
            )
        )

    # Insert events in batch
    db.add_all(events_to_add)
    db.commit()

    # Automatically execute detection engine to generate corresponding alerts
    generated_alerts = run_threat_detection(db)

    # Create an initial demo investigation for the brute-force alert if an alert exists
    if generated_alerts:
        first_alert = generated_alerts[0]
        existing_inv = db.query(Investigation).filter(Investigation.title.contains("Brute Force")).first()
        if not existing_inv:
            demo_inv = Investigation(
                id=f"INV-{uuid.uuid4().hex[:8].upper()}",
                title=f"Investigation: {first_alert.title} ({first_alert.source_ip})",
                description=f"Investigating suspicious authentication anomaly originating from source IP {first_alert.source_ip} against target {first_alert.username}.",
                status="In Progress",
                priority="High",
                assigned_to="SOC Tier-2 Analyst",
                related_alert_ids=json.dumps([first_alert.id]),
                related_event_ids=json.dumps([e.id for e in events_to_add[:7]]),
                findings="Initial triage confirms 7 sequential authentication failures within an 8-minute period. Source IP traced to external test subnet. Recommend temporary perimeter drop rule.",
            )
            db.add(demo_inv)
            db.commit()
            db.refresh(demo_inv)

            # Add demo notes
            note1 = InvestigationNote(
                investigation_id=demo_inv.id,
                author="SOC Tier-1 Analyst",
                content="Alert acknowledged. Cross-referenced authentication logs against employee schedule. Account owner was not scheduled to work during attempt window.",
                created_at=now - timedelta(minutes=35),
            )
            note2 = InvestigationNote(
                investigation_id=demo_inv.id,
                author="SOC Tier-2 Analyst",
                content="Escalated to Tier-2. Added perimeter block rule for IP and notified identity governance team to enforce MFA reset.",
                created_at=now - timedelta(minutes=15),
            )
            db.add_all([note1, note2])
            db.commit()

    return len(events_to_add), len(generated_alerts), f"Successfully loaded {len(events_to_add)} synthetic security events and triggered {len(generated_alerts)} alerts."


def reset_demo_data(db: Session) -> Dict[str, Any]:
    """Clean reset of synthetic demo data."""
    ev_count = db.query(SecurityEvent).filter(SecurityEvent.source == DEMO_TAG).delete(synchronize_session=False)
    alerts_count = db.query(Alert).delete(synchronize_session=False)
    notes_count = db.query(InvestigationNote).delete(synchronize_session=False)
    inv_count = db.query(Investigation).delete(synchronize_session=False)
    db.commit()
    return {
        "status": "success",
        "message": f"Reset completed. Cleared {ev_count} demo events, {alerts_count} alerts, {inv_count} investigations, and {notes_count} notes.",
    }
