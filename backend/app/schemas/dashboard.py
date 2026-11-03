from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class SeverityCount(BaseModel):
    severity: str
    count: int
    color: str


class TimeBucketCount(BaseModel):
    timestamp: str
    events: int
    failures: int


class TopIpStat(BaseModel):
    ip: str
    total_events: int
    failed_events: int
    alerts_triggered: int


class DashboardStatsResponse(BaseModel):
    total_events: int
    total_alerts: int
    critical_alerts: int
    high_alerts: int
    medium_alerts: int
    low_alerts: int
    total_investigations: int
    active_investigations: int
    severity_distribution: List[SeverityCount]
    events_over_time: List[TimeBucketCount]
    top_source_ips: List[TopIpStat]
    recent_events: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    recent_investigations: List[Dict[str, Any]]
