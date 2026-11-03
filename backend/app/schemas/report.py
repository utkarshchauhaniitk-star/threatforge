from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class IncidentReportRequest(BaseModel):
    title: Optional[str] = "ThreatForge Incident Summary Report"
    investigation_id: Optional[str] = None
    time_range_hours: Optional[int] = 24
    include_events: bool = True
    include_notes: bool = True


class IncidentReportResponse(BaseModel):
    report_id: str
    generated_at: datetime
    title: str
    summary: str
    investigation: Optional[Dict[str, Any]] = None
    alerts: List[Dict[str, Any]] = []
    events_sample: List[Dict[str, Any]] = []
    detection_rules_triggered: List[Dict[str, Any]] = []
    findings: Optional[str] = None
    recommendations: List[str] = []
    limitations: str
