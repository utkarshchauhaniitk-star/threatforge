import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database.session import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertListResponse, AlertUpdate

router = APIRouter(prefix="/alerts", tags=["Threat Alerts"])

VALID_STATUSES = {"New", "Investigating", "Resolved", "False Positive"}
VALID_SEVERITIES = {"Critical", "High", "Medium", "Low"}


@router.get("", response_model=AlertListResponse)
def list_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    severity: Optional[str] = Query(None, description="Critical, High, Medium, Low"),
    status_filter: Optional[str] = Query(None, alias="status", description="New, Investigating, Resolved, False Positive"),
    rule_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search title, description, IP, or user"),
    db: Session = Depends(get_db),
):
    query = db.query(Alert)

    if severity:
        # Match case-insensitively
        query = query.filter(Alert.severity.ilike(severity))

    if status_filter:
        query = query.filter(Alert.status.ilike(status_filter))

    if rule_id:
        query = query.filter(Alert.rule_id == rule_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Alert.title.ilike(search_pattern),
                Alert.description.ilike(search_pattern),
                Alert.source_ip.ilike(search_pattern),
                Alert.username.ilike(search_pattern),
                Alert.rule_name.ilike(search_pattern),
            )
        )

    total = query.count()
    alerts = (
        query.order_by(desc(Alert.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return AlertListResponse(
        total=total,
        page=page,
        page_size=page_size,
        alerts=alerts,
    )


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with ID '{alert_id}' not found.")
    return alert


@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(alert_id: str, update_data: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert with ID '{alert_id}' not found.")

    if update_data.status:
        # Normalize status capitalization
        normalized_status = None
        for s in VALID_STATUSES:
            if s.lower() == update_data.status.strip().lower():
                normalized_status = s
                break
        if not normalized_status:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{update_data.status}'. Allowed values: {list(VALID_STATUSES)}",
            )
        alert.status = normalized_status

    if update_data.note:
        # Append note to evidence JSON structure
        try:
            evidence_dict = json.loads(alert.evidence or "{}")
        except Exception:
            evidence_dict = {"raw": alert.evidence}
        
        notes_list = evidence_dict.get("analyst_notes", [])
        notes_list.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": update_data.note,
        })
        evidence_dict["analyst_notes"] = notes_list
        alert.evidence = json.dumps(evidence_dict)

    alert.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert
