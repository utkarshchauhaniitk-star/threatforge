from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.session import get_db
from app.models.event import SecurityEvent
from app.models.alert import Alert
from app.models.investigation import Investigation
from app.schemas.dashboard import (
    DashboardStatsResponse,
    SeverityCount,
    TimeBucketCount,
    TopIpStat,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

SEVERITY_COLORS = {
    "Critical": "#EF4444",  # red
    "High": "#F97316",      # orange
    "Medium": "#F59E0B",    # amber
    "Low": "#10B981",       # emerald
}


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_events = db.query(SecurityEvent).count()
    total_alerts = db.query(Alert).count()

    critical_alerts = db.query(Alert).filter(Alert.severity.ilike("Critical")).count()
    high_alerts = db.query(Alert).filter(Alert.severity.ilike("High")).count()
    medium_alerts = db.query(Alert).filter(Alert.severity.ilike("Medium")).count()
    low_alerts = db.query(Alert).filter(Alert.severity.ilike("Low")).count()

    total_investigations = db.query(Investigation).count()
    active_investigations = db.query(Investigation).filter(Investigation.status != "Closed").count()

    # Severity distribution
    severity_distribution = [
        SeverityCount(severity="Critical", count=critical_alerts, color=SEVERITY_COLORS["Critical"]),
        SeverityCount(severity="High", count=high_alerts, color=SEVERITY_COLORS["High"]),
        SeverityCount(severity="Medium", count=medium_alerts, color=SEVERITY_COLORS["Medium"]),
        SeverityCount(severity="Low", count=low_alerts, color=SEVERITY_COLORS["Low"]),
    ]

    # Events over time (bucketed chronologically for charts)
    now = datetime.now(timezone.utc)
    events_over_time: List[TimeBucketCount] = []
    
    # Grab events from recent 24-48 hours
    cutoff = now - timedelta(hours=48)
    recent_events_all = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.timestamp >= cutoff)
        .order_by(SecurityEvent.timestamp.asc())
        .all()
    )

    if recent_events_all:
        time_buckets = defaultdict(lambda: {"events": 0, "failures": 0})
        for ev in recent_events_all:
            # Bucket by hour
            bucket_key = ev.timestamp.strftime("%m/%d %H:00")
            time_buckets[bucket_key]["events"] += 1
            if ev.status in ("failure", "denied", "blocked"):
                time_buckets[bucket_key]["failures"] += 1

        for bucket_key, counts in time_buckets.items():
            events_over_time.append(
                TimeBucketCount(
                    timestamp=bucket_key,
                    events=counts["events"],
                    failures=counts["failures"],
                )
            )
    else:
        # If no events in the last 48 hours or empty DB, provide 6 zero-filled intervals
        for h in range(5, -1, -1):
            ts_label = (now - timedelta(hours=h * 2)).strftime("%m/%d %H:00")
            events_over_time.append(TimeBucketCount(timestamp=ts_label, events=0, failures=0))

    # Top suspicious source IPs
    # Aggregated query on source_ip
    top_ips_raw = (
        db.query(
            SecurityEvent.source_ip,
            func.count(SecurityEvent.id).label("total"),
        )
        .group_by(SecurityEvent.source_ip)
        .order_by(desc("total"))
        .limit(6)
        .all()
    )

    top_source_ips: List[TopIpStat] = []
    for row in top_ips_raw:
        ip = row[0]
        total = row[1]
        failed_count = (
            db.query(SecurityEvent)
            .filter(SecurityEvent.source_ip == ip, SecurityEvent.status.in_(["failure", "denied", "blocked"]))
            .count()
        )
        alert_count = db.query(Alert).filter(Alert.source_ip == ip).count()
        top_source_ips.append(
            TopIpStat(
                ip=ip,
                total_events=total,
                failed_events=failed_count,
                alerts_triggered=alert_count,
            )
        )

    # Recent security events (last 8)
    recent_events_objs = (
        db.query(SecurityEvent)
        .order_by(desc(SecurityEvent.timestamp))
        .limit(8)
        .all()
    )
    recent_events = [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "event_type": e.event_type,
            "source_ip": e.source_ip,
            "username": e.username,
            "action": e.action,
            "status": e.status,
            "severity": e.severity,
            "description": e.description,
        }
        for e in recent_events_objs
    ]

    # Recent alerts (last 6)
    recent_alerts_objs = (
        db.query(Alert)
        .order_by(desc(Alert.timestamp))
        .limit(6)
        .all()
    )
    recent_alerts = [
        {
            "id": a.id,
            "title": a.title,
            "severity": a.severity,
            "status": a.status,
            "source_ip": a.source_ip,
            "username": a.username,
            "timestamp": a.timestamp.isoformat() if a.timestamp else None,
            "rule_id": a.rule_id,
        }
        for a in recent_alerts_objs
    ]

    # Recent investigations (last 5)
    recent_invs_objs = (
        db.query(Investigation)
        .order_by(desc(Investigation.created_at))
        .limit(5)
        .all()
    )
    recent_investigations = [
        {
            "id": inv.id,
            "title": inv.title,
            "status": inv.status,
            "priority": inv.priority,
            "assigned_to": inv.assigned_to,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
        }
        for inv in recent_invs_objs
    ]

    return DashboardStatsResponse(
        total_events=total_events,
        total_alerts=total_alerts,
        critical_alerts=critical_alerts,
        high_alerts=high_alerts,
        medium_alerts=medium_alerts,
        low_alerts=low_alerts,
        total_investigations=total_investigations,
        active_investigations=active_investigations,
        severity_distribution=severity_distribution,
        events_over_time=events_over_time,
        top_source_ips=top_source_ips,
        recent_events=recent_events,
        recent_alerts=recent_alerts,
        recent_investigations=recent_investigations,
    )
