import io
import csv
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.models.investigation import Investigation
from app.models.alert import Alert
from app.models.event import SecurityEvent
from app.models.rule import DetectionRule
from app.schemas.report import IncidentReportResponse


REPORT_LIMITATION_TEXT = (
    "NOTICE: This ThreatForge incident report was generated for authorized security monitoring, "
    "educational demonstration, and portfolio verification. Detection results reflect synthetic or "
    "sanitized telemetry analyzed according to configured rule thresholds. This document is not a certified "
    "legal forensic examination and should be reviewed by a human security analyst before taking enforcement action."
)


def generate_incident_report(
    db: Session,
    title: str = "ThreatForge Incident Summary Report",
    investigation_id: Optional[str] = None,
    time_range_hours: int = 24,
    include_events: bool = True,
    include_notes: bool = True,
) -> Dict[str, Any]:
    """Compile comprehensive incident response report data."""
    report_id = f"RPT-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc)

    inv_data = None
    alerts_data: List[Dict[str, Any]] = []
    events_sample: List[Dict[str, Any]] = []
    rules_triggered: List[Dict[str, Any]] = []
    findings = "Automated threat detection review completed. See alert evidence and analyst notes for root-cause details."
    recommendations = [
        "Isolate flagged host or block suspicious source IP at edge firewall.",
        "Enforce multi-factor authentication (MFA) on targeted user accounts.",
        "Rotate compromised credentials and review privileged role grants.",
        "Update detection rule thresholds if excessive false positives occur.",
    ]

    target_alert_ids = []
    target_event_ids = []

    if investigation_id:
        inv: Optional[Investigation] = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if inv:
            notes_data = []
            if include_notes:
                notes_data = [
                    {
                        "id": n.id,
                        "author": n.author,
                        "content": n.content,
                        "created_at": n.created_at.isoformat() if n.created_at else None,
                    }
                    for n in inv.notes
                ]

            inv_data = {
                "id": inv.id,
                "title": inv.title,
                "description": inv.description,
                "status": inv.status,
                "priority": inv.priority,
                "assigned_to": inv.assigned_to,
                "findings": inv.findings,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
                "updated_at": inv.updated_at.isoformat() if inv.updated_at else None,
                "notes": notes_data,
            }

            if inv.findings:
                findings = inv.findings

            try:
                if inv.related_alert_ids:
                    target_alert_ids = json.loads(inv.related_alert_ids)
            except Exception:
                pass

            try:
                if inv.related_event_ids:
                    target_event_ids = json.loads(inv.related_event_ids)
            except Exception:
                pass

    # Query alerts
    if target_alert_ids:
        alerts = db.query(Alert).filter(Alert.id.in_(target_alert_ids)).all()
    else:
        alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(20).all()

    rule_ids_seen = set()
    for a in alerts:
        rule_ids_seen.add(a.rule_id)
        evidence_parsed = None
        if a.evidence:
            try:
                evidence_parsed = json.loads(a.evidence)
                # Accumulate matched event ids if not already specified
                if not target_event_ids and isinstance(evidence_parsed, dict):
                    ev_ids = evidence_parsed.get("matched_event_ids", [])
                    target_event_ids.extend(ev_ids)
            except Exception:
                evidence_parsed = a.evidence

        alerts_data.append({
            "id": a.id,
            "title": a.title,
            "severity": a.severity,
            "status": a.status,
            "rule_id": a.rule_id,
            "rule_name": a.rule_name,
            "source_ip": a.source_ip,
            "username": a.username,
            "event_count": a.event_count,
            "evidence": evidence_parsed,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
        })

    # Query rules triggered
    if rule_ids_seen:
        rules = db.query(DetectionRule).filter(DetectionRule.id.in_(list(rule_ids_seen))).all()
        for r in rules:
            rules_triggered.append({
                "id": r.id,
                "name": r.name,
                "severity": r.severity,
                "mitre_attack_id": r.mitre_attack_id,
                "description": r.description,
            })

    # Query sample events
    if include_events:
        if target_event_ids:
            # deduplicate
            clean_ids = list(dict.fromkeys(target_event_ids))[:50]
            events = db.query(SecurityEvent).filter(SecurityEvent.id.in_(clean_ids)).all()
        else:
            events = db.query(SecurityEvent).order_by(SecurityEvent.timestamp.desc()).limit(30).all()

        for ev in events:
            events_sample.append({
                "id": ev.id,
                "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
                "event_type": ev.event_type,
                "source_ip": ev.source_ip,
                "destination_ip": ev.destination_ip,
                "username": ev.username,
                "action": ev.action,
                "status": ev.status,
                "severity": ev.severity,
                "description": ev.description,
            })

    summary = (
        f"Incident investigation report compiled at {now.strftime('%Y-%m-%d %H:%M:%S UTC')}. "
        f"Encompasses {len(alerts_data)} alert(s) across {len(rules_triggered)} detection rule(s). "
        f"Sampled {len(events_sample)} correlating security event(s)."
    )

    return {
        "report_id": report_id,
        "generated_at": now.isoformat(),
        "title": title,
        "summary": summary,
        "investigation": inv_data,
        "alerts": alerts_data,
        "events_sample": events_sample,
        "detection_rules_triggered": rules_triggered,
        "findings": findings,
        "recommendations": recommendations,
        "limitations": REPORT_LIMITATION_TEXT,
    }


def export_report_to_csv(report_data: Dict[str, Any]) -> str:
    """Format report data into a clean, downloadable CSV spreadsheet."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header metadata
    writer.writerow(["ThreatForge Incident Report Export"])
    writer.writerow(["Report ID", report_data.get("report_id")])
    writer.writerow(["Title", report_data.get("title")])
    writer.writerow(["Generated At", report_data.get("generated_at")])
    writer.writerow(["Summary", report_data.get("summary")])
    writer.writerow([])

    # Investigation metadata
    if report_data.get("investigation"):
        inv = report_data["investigation"]
        writer.writerow(["--- INVESTIGATION DETAILS ---"])
        writer.writerow(["Investigation ID", inv.get("id")])
        writer.writerow(["Title", inv.get("title")])
        writer.writerow(["Status", inv.get("status")])
        writer.writerow(["Priority", inv.get("priority")])
        writer.writerow(["Assigned To", inv.get("assigned_to")])
        writer.writerow(["Findings", inv.get("findings")])
        writer.writerow([])

    # Alerts Section
    writer.writerow(["--- DETECTED ALERTS ---"])
    writer.writerow(["Alert ID", "Title", "Severity", "Status", "Rule ID", "Rule Name", "Source IP", "Username", "Event Count", "Timestamp"])
    for a in report_data.get("alerts", []):
        writer.writerow([
            a.get("id"),
            a.get("title"),
            a.get("severity"),
            a.get("status"),
            a.get("rule_id"),
            a.get("rule_name"),
            a.get("source_ip"),
            a.get("username"),
            a.get("event_count"),
            a.get("timestamp"),
        ])
    writer.writerow([])

    # Security Events Sample
    writer.writerow(["--- SECURITY EVENTS SAMPLE ---"])
    writer.writerow(["Event ID", "Timestamp", "Event Type", "Source IP", "Destination IP", "Username", "Action", "Status", "Severity", "Description"])
    for ev in report_data.get("events_sample", []):
        writer.writerow([
            ev.get("id"),
            ev.get("timestamp"),
            ev.get("event_type"),
            ev.get("source_ip"),
            ev.get("destination_ip"),
            ev.get("username"),
            ev.get("action"),
            ev.get("status"),
            ev.get("severity"),
            ev.get("description"),
        ])
    writer.writerow([])

    # Limitations
    writer.writerow(["--- LIMITATIONS & DISCLAIMER ---"])
    writer.writerow([report_data.get("limitations")])

    return output.getvalue()
