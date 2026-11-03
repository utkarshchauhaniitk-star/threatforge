import json
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple
from collections import defaultdict
from sqlalchemy.orm import Session
from app.models.event import SecurityEvent
from app.models.alert import Alert
from app.models.rule import DetectionRule


# Default Rule Definitions with realistic MITRE ATT&CK mappings
DEFAULT_RULES = [
    {
        "id": "RULE-BRUTEFORCE",
        "name": "Possible Brute Force Attack",
        "description": "Detects repeated failed authentication attempts from a single source IP against an account within a configured time window.",
        "severity": "High",
        "logic_description": "Triggers when 5 or more failed authentication events occur for the same source IP and username within a 15-minute sliding window.",
        "is_enabled": True,
        "mitre_attack_id": "T1110.001",
        "parameters": json.dumps({"threshold": 5, "window_minutes": 15}),
    },
    {
        "id": "RULE-SUSP-LOGIN",
        "name": "Suspicious Login Activity",
        "description": "Detects suspicious authentication sequences, including successful logins immediately following multiple failures from the same source IP, or authentication against sensitive service/guest accounts.",
        "severity": "Medium",
        "logic_description": "Triggers when a successful login occurs from an IP that previously registered 2+ failures within 15 minutes, or when known high-risk accounts (guest, test, temp, anonymous) are targeted.",
        "is_enabled": True,
        "mitre_attack_id": "T1078",
        "parameters": json.dumps({"failure_threshold_before_success": 2, "window_minutes": 15}),
    },
    {
        "id": "RULE-SPRAY",
        "name": "Multiple Account Password Spray Attempt",
        "description": "Detects a single source IP attempting authentication across multiple distinct usernames in a short period.",
        "severity": "High",
        "logic_description": "Triggers when a single source IP targets 3 or more distinct usernames with failed authentication attempts within a 30-minute window.",
        "is_enabled": True,
        "mitre_attack_id": "T1110.003",
        "parameters": json.dumps({"distinct_users_threshold": 3, "window_minutes": 30}),
    },
    {
        "id": "RULE-PRIV-ACTION",
        "name": "Unusual Privileged Activity",
        "description": "Detects sensitive privilege escalation attempts, sudo elevation failures, or critical administrative policy modifications.",
        "severity": "Critical",
        "logic_description": "Triggers on any failed or unauthorized privilege escalation attempt, sudo denial, or unauthorized administrative action.",
        "is_enabled": True,
        "mitre_attack_id": "T1078.001",
        "parameters": json.dumps({"monitor_actions": ["privilege_escalation", "sudo", "user_add", "role_change", "permission_grant"]}),
    },
    {
        "id": "RULE-TRAFFIC-BURST",
        "name": "Suspicious Connection Burst / Traffic Anomaly",
        "description": "Detects high frequency of denied network connections or firewall blocks from a single IP, indicative of port scanning or service probing.",
        "severity": "Medium",
        "logic_description": "Triggers when 10 or more denied or blocked network connection attempts are registered from a single source IP within a 10-minute window.",
        "is_enabled": True,
        "mitre_attack_id": "T1046",
        "parameters": json.dumps({"denial_threshold": 10, "window_minutes": 10}),
    },
]


def initialize_default_rules(db: Session) -> None:
    """Ensure baseline detection rules exist in the database."""
    for rule_data in DEFAULT_RULES:
        existing = db.query(DetectionRule).filter(DetectionRule.id == rule_data["id"]).first()
        if not existing:
            new_rule = DetectionRule(**rule_data)
            db.add(new_rule)
    db.commit()


def run_threat_detection(db: Session, lookback_hours: int = 72) -> List[Alert]:
    """
    Execute all enabled detection rules on recent security events.
    Avoids duplicate alerts for the same source IP, rule, and recent timeframe.
    """
    initialize_default_rules(db)
    
    # Fetch active rules
    rules = {r.id: r for r in db.query(DetectionRule).filter(DetectionRule.is_enabled == True).all()}
    if not rules:
        return []

    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.timestamp >= cutoff_time)
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    if not events:
        return []

    new_alerts: List[Alert] = []

    # Fetch recent alerts to prevent duplicate alerts
    recent_alerts = (
        db.query(Alert)
        .filter(Alert.timestamp >= cutoff_time)
        .all()
    )
    existing_alert_keys = {
        (a.rule_id, a.source_ip, a.username) for a in recent_alerts
    }

    # ----------------------------------------------------
    # Rule 1: Brute Force Detection (RULE-BRUTEFORCE)
    # ----------------------------------------------------
    if "RULE-BRUTEFORCE" in rules:
        rule = rules["RULE-BRUTEFORCE"]
        params = json.loads(rule.parameters or "{}")
        threshold = params.get("threshold", 5)
        window_minutes = params.get("window_minutes", 15)
        window = timedelta(minutes=window_minutes)

        # Group failed authentication events by (source_ip, username)
        auth_failures = defaultdict(list)
        for ev in events:
            if ev.event_type == "authentication" and ev.status in ("failure", "denied", "attempt"):
                auth_failures[(ev.source_ip, ev.username or "unknown")].append(ev)

        for (sip, user), ev_list in auth_failures.items():
            # Sliding window check
            for i in range(len(ev_list)):
                window_evs = [
                    e for e in ev_list[i:]
                    if (e.timestamp - ev_list[i].timestamp) <= window
                ]
                if len(window_evs) >= threshold:
                    alert_key = (rule.id, sip, user)
                    if alert_key not in existing_alert_keys:
                        matched_ids = [e.id for e in window_evs]
                        evidence = {
                            "rule_id": rule.id,
                            "rule_name": rule.name,
                            "indicator": f"Observed {len(window_evs)} failed logins within {window_minutes} minutes.",
                            "source_ip": sip,
                            "target_username": user,
                            "event_count": len(window_evs),
                            "first_seen": window_evs[0].timestamp.isoformat(),
                            "last_seen": window_evs[-1].timestamp.isoformat(),
                            "matched_event_ids": matched_ids,
                            "mitre_attack": rule.mitre_attack_id,
                        }
                        alert = Alert(
                            title=rule.name,
                            description=f"Potential brute-force behavior detected: {len(window_evs)} failed authentications from {sip} targeting account '{user}'.",
                            severity=rule.severity,
                            status="New",
                            rule_id=rule.id,
                            rule_name=rule.name,
                            source_ip=sip,
                            username=user,
                            event_count=len(window_evs),
                            evidence=json.dumps(evidence),
                            timestamp=window_evs[-1].timestamp,
                        )
                        db.add(alert)
                        new_alerts.append(alert)
                        existing_alert_keys.add(alert_key)
                    break

    # ----------------------------------------------------
    # Rule 2: Suspicious Login Activity (RULE-SUSP-LOGIN)
    # ----------------------------------------------------
    if "RULE-SUSP-LOGIN" in rules:
        rule = rules["RULE-SUSP-LOGIN"]
        params = json.loads(rule.parameters or "{}")
        fail_thresh = params.get("failure_threshold_before_success", 2)
        window = timedelta(minutes=params.get("window_minutes", 15))

        suspicious_accounts = {"guest", "test", "temp", "anonymous", "backup", "support"}

        # Pattern A: Success right after multiple failures from same IP
        ip_timeline = defaultdict(list)
        for ev in events:
            if ev.event_type == "authentication":
                ip_timeline[ev.source_ip].append(ev)

        for sip, ev_list in ip_timeline.items():
            for idx, ev in enumerate(ev_list):
                if ev.status == "success":
                    # Check prior events within window
                    prior_failures = [
                        e for e in ev_list[:idx]
                        if e.status in ("failure", "denied") and (ev.timestamp - e.timestamp) <= window
                    ]
                    if len(prior_failures) >= fail_thresh:
                        alert_key = (rule.id, sip, ev.username)
                        if alert_key not in existing_alert_keys:
                            matched_ids = [e.id for e in prior_failures] + [ev.id]
                            evidence = {
                                "rule_id": rule.id,
                                "indicator": f"Successful login for '{ev.username}' followed {len(prior_failures)} prior authentication failures from {sip}.",
                                "source_ip": sip,
                                "username": ev.username,
                                "matched_event_ids": matched_ids,
                                "mitre_attack": rule.mitre_attack_id,
                            }
                            alert = Alert(
                                title=rule.name,
                                description=f"Suspicious activity detected: Successful login for '{ev.username}' immediately following repeated failures from {sip}. Potential credential breakthrough requiring investigation.",
                                severity=rule.severity,
                                status="New",
                                rule_id=rule.id,
                                rule_name=rule.name,
                                source_ip=sip,
                                username=ev.username,
                                event_count=len(matched_ids),
                                evidence=json.dumps(evidence),
                                timestamp=ev.timestamp,
                            )
                            db.add(alert)
                            new_alerts.append(alert)
                            existing_alert_keys.add(alert_key)
                            break

                # Pattern B: Risky/service account targeted
                if ev.username and ev.username.lower() in suspicious_accounts:
                    alert_key = (rule.id, sip, ev.username)
                    if alert_key not in existing_alert_keys:
                        evidence = {
                            "rule_id": rule.id,
                            "indicator": f"Authentication attempt detected against known high-risk/guest account '{ev.username}'.",
                            "source_ip": sip,
                            "username": ev.username,
                            "matched_event_ids": [ev.id],
                            "mitre_attack": rule.mitre_attack_id,
                        }
                        alert = Alert(
                            title="High-Risk Account Targeted",
                            description=f"Suspicious authentication activity: Source IP {sip} attempted access using deactivated or default service account '{ev.username}'.",
                            severity="Medium",
                            status="New",
                            rule_id=rule.id,
                            rule_name=rule.name,
                            source_ip=sip,
                            username=ev.username,
                            event_count=1,
                            evidence=json.dumps(evidence),
                            timestamp=ev.timestamp,
                        )
                        db.add(alert)
                        new_alerts.append(alert)
                        existing_alert_keys.add(alert_key)

    # ----------------------------------------------------
    # Rule 3: Multiple Accounts Targeted / Password Spray (RULE-SPRAY)
    # ----------------------------------------------------
    if "RULE-SPRAY" in rules:
        rule = rules["RULE-SPRAY"]
        params = json.loads(rule.parameters or "{}")
        threshold = params.get("distinct_users_threshold", 3)
        window = timedelta(minutes=params.get("window_minutes", 30))

        ip_spray_map = defaultdict(list)
        for ev in events:
            if ev.event_type == "authentication" and ev.status in ("failure", "denied"):
                ip_spray_map[ev.source_ip].append(ev)

        for sip, ev_list in ip_spray_map.items():
            for i in range(len(ev_list)):
                window_evs = [
                    e for e in ev_list[i:]
                    if (e.timestamp - ev_list[i].timestamp) <= window
                ]
                distinct_users = {e.username for e in window_evs if e.username}
                if len(distinct_users) >= threshold:
                    alert_key = (rule.id, sip, "multiple")
                    if alert_key not in existing_alert_keys:
                        matched_ids = [e.id for e in window_evs]
                        evidence = {
                            "rule_id": rule.id,
                            "indicator": f"Single source IP probed {len(distinct_users)} distinct usernames: {', '.join(sorted(list(distinct_users)))}.",
                            "source_ip": sip,
                            "targeted_users": list(distinct_users),
                            "event_count": len(window_evs),
                            "matched_event_ids": matched_ids,
                            "mitre_attack": rule.mitre_attack_id,
                        }
                        alert = Alert(
                            title=rule.name,
                            description=f"Potential password spray activity: Source IP {sip} targeted {len(distinct_users)} distinct accounts ({', '.join(list(distinct_users)[:5])}) with failed credentials within 30 minutes.",
                            severity=rule.severity,
                            status="New",
                            rule_id=rule.id,
                            rule_name=rule.name,
                            source_ip=sip,
                            username=f"{len(distinct_users)} accounts",
                            event_count=len(window_evs),
                            evidence=json.dumps(evidence),
                            timestamp=window_evs[-1].timestamp,
                        )
                        db.add(alert)
                        new_alerts.append(alert)
                        existing_alert_keys.add(alert_key)
                    break

    # ----------------------------------------------------
    # Rule 4: Unusual Privileged Activity (RULE-PRIV-ACTION)
    # ----------------------------------------------------
    if "RULE-PRIV-ACTION" in rules:
        rule = rules["RULE-PRIV-ACTION"]
        params = json.loads(rule.parameters or "{}")
        monitored_actions = set(params.get("monitor_actions", ["privilege_escalation", "sudo", "user_add", "role_change"]))

        for ev in events:
            # Check for privileged activity indicators
            is_priv_action = (
                ev.action.lower() in monitored_actions
                or "sudo" in ev.action.lower()
                or "privilege" in ev.description.lower()
                or "root" in (ev.username or "").lower()
            )
            # Flag if failed, denied, or high/critical severity privileged operation
            if is_priv_action and (ev.status in ("failure", "denied", "attempt") or ev.severity in ("high", "critical")):
                alert_key = (rule.id, ev.source_ip, ev.username or "root")
                if alert_key not in existing_alert_keys:
                    evidence = {
                        "rule_id": rule.id,
                        "indicator": f"Privileged action '{ev.action}' {ev.status} by user '{ev.username or 'unknown'}' from IP {ev.source_ip}.",
                        "source_ip": ev.source_ip,
                        "username": ev.username,
                        "action": ev.action,
                        "status": ev.status,
                        "matched_event_ids": [ev.id],
                        "mitre_attack": rule.mitre_attack_id,
                    }
                    alert = Alert(
                        title=rule.name,
                        description=f"Unusual privileged activity detected: User '{ev.username or 'unknown'}' performed '{ev.action}' ({ev.status}) from {ev.source_ip}. Requires investigation.",
                        severity=rule.severity,
                        status="New",
                        rule_id=rule.id,
                        rule_name=rule.name,
                        source_ip=ev.source_ip,
                        username=ev.username,
                        event_count=1,
                        evidence=json.dumps(evidence),
                        timestamp=ev.timestamp,
                    )
                    db.add(alert)
                    new_alerts.append(alert)
                    existing_alert_keys.add(alert_key)

    # ----------------------------------------------------
    # Rule 5: Suspicious Connection Burst (RULE-TRAFFIC-BURST)
    # ----------------------------------------------------
    if "RULE-TRAFFIC-BURST" in rules:
        rule = rules["RULE-TRAFFIC-BURST"]
        params = json.loads(rule.parameters or "{}")
        denial_threshold = params.get("denial_threshold", 10)
        window = timedelta(minutes=params.get("window_minutes", 10))

        net_denials = defaultdict(list)
        for ev in events:
            if ev.event_type in ("network", "firewall", "connection") and ev.status in ("denied", "failure", "blocked"):
                net_denials[ev.source_ip].append(ev)

        for sip, ev_list in net_denials.items():
            for i in range(len(ev_list)):
                window_evs = [
                    e for e in ev_list[i:]
                    if (e.timestamp - ev_list[i].timestamp) <= window
                ]
                if len(window_evs) >= denial_threshold:
                    alert_key = (rule.id, sip, "network")
                    if alert_key not in existing_alert_keys:
                        matched_ids = [e.id for e in window_evs]
                        evidence = {
                            "rule_id": rule.id,
                            "indicator": f"High volume of blocked connections: {len(window_evs)} network denials within {window.total_seconds() / 60:.0f} minutes.",
                            "source_ip": sip,
                            "event_count": len(window_evs),
                            "matched_event_ids": matched_ids,
                            "mitre_attack": rule.mitre_attack_id,
                        }
                        alert = Alert(
                            title=rule.name,
                            description=f"Traffic anomaly detected: {len(window_evs)} firewall/network rejections observed from source IP {sip} in a short burst. Indicative of network reconnaissance or port scanning.",
                            severity=rule.severity,
                            status="New",
                            rule_id=rule.id,
                            rule_name=rule.name,
                            source_ip=sip,
                            username="N/A",
                            event_count=len(window_evs),
                            evidence=json.dumps(evidence),
                            timestamp=window_evs[-1].timestamp,
                        )
                        db.add(alert)
                        new_alerts.append(alert)
                        existing_alert_keys.add(alert_key)
                    break

    if new_alerts:
        db.commit()
        for alert in new_alerts:
            db.refresh(alert)

    return new_alerts
