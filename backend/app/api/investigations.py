import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.database.session import get_db
from app.models.investigation import Investigation, InvestigationNote
from app.models.alert import Alert
from app.schemas.investigation import (
    InvestigationCreate,
    InvestigationUpdate,
    InvestigationResponse,
    InvestigationNoteCreate,
    InvestigationNoteResponse,
)

router = APIRouter(prefix="/investigations", tags=["Incident Investigations"])

VALID_INV_STATUSES = {"Open", "In Progress", "Closed"}
VALID_PRIORITIES = {"Critical", "High", "Medium", "Low"}


@router.get("", response_model=List[InvestigationResponse])
def list_investigations(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Investigation)

    if status_filter:
        query = query.filter(Investigation.status.ilike(status_filter))

    if priority:
        query = query.filter(Investigation.priority.ilike(priority))

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Investigation.title.ilike(pattern),
                Investigation.description.ilike(pattern),
                Investigation.findings.ilike(pattern),
                Investigation.assigned_to.ilike(pattern),
            )
        )

    return query.order_by(desc(Investigation.created_at)).all()


@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(payload: InvestigationCreate, db: Session = Depends(get_db)):
    related_alerts = payload.related_alert_ids or []
    related_events = payload.related_event_ids or []

    # If created directly from a specific alert_id
    if payload.alert_id:
        if payload.alert_id not in related_alerts:
            related_alerts.append(payload.alert_id)
        # Mark alert as 'Investigating'
        target_alert = db.query(Alert).filter(Alert.id == payload.alert_id).first()
        if target_alert:
            target_alert.status = "Investigating"
            if target_alert.evidence:
                try:
                    ev_info = json.loads(target_alert.evidence)
                    if isinstance(ev_info, dict) and "matched_event_ids" in ev_info:
                        for eid in ev_info["matched_event_ids"]:
                            if eid not in related_events:
                                related_events.append(eid)
                except Exception:
                    pass

    inv = Investigation(
        title=payload.title,
        description=payload.description,
        status="Open",
        priority=payload.priority,
        assigned_to=payload.assigned_to,
        related_alert_ids=json.dumps(related_alerts),
        related_event_ids=json.dumps(related_events),
        findings="Investigation initiated. Gathering telemetry and forensic indicators.",
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    if payload.initial_note:
        note = InvestigationNote(
            investigation_id=inv.id,
            author=payload.assigned_to,
            content=payload.initial_note,
        )
        db.add(note)
        db.commit()
        db.refresh(inv)

    return inv


@router.get("/{investigation_id}", response_model=InvestigationResponse)
def get_investigation(investigation_id: str, db: Session = Depends(get_db)):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")
    return inv


@router.patch("/{investigation_id}", response_model=InvestigationResponse)
def update_investigation(
    investigation_id: str,
    update_data: InvestigationUpdate,
    db: Session = Depends(get_db),
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    if update_data.status:
        norm_status = None
        for s in VALID_INV_STATUSES:
            if s.lower() == update_data.status.strip().lower():
                norm_status = s
                break
        if not norm_status:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{update_data.status}'. Allowed: {list(VALID_INV_STATUSES)}",
            )
        inv.status = norm_status

        # If investigation is closed/resolved, also update any related alerts to Resolved
        if norm_status == "Closed" and inv.related_alert_ids:
            try:
                alert_ids = json.loads(inv.related_alert_ids)
                if alert_ids:
                    db.query(Alert).filter(Alert.id.in_(alert_ids)).update(
                        {"status": "Resolved"}, synchronize_session=False
                    )
            except Exception:
                pass

    if update_data.priority:
        norm_priority = None
        for p in VALID_PRIORITIES:
            if p.lower() == update_data.priority.strip().lower():
                norm_priority = p
                break
        if norm_priority:
            inv.priority = norm_priority

    if update_data.title is not None:
        inv.title = update_data.title
    if update_data.description is not None:
        inv.description = update_data.description
    if update_data.assigned_to is not None:
        inv.assigned_to = update_data.assigned_to
    if update_data.findings is not None:
        inv.findings = update_data.findings
    if update_data.related_alert_ids is not None:
        inv.related_alert_ids = update_data.related_alert_ids
    if update_data.related_event_ids is not None:
        inv.related_event_ids = update_data.related_event_ids

    inv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(inv)
    return inv


@router.post("/{investigation_id}/notes", response_model=InvestigationNoteResponse, status_code=status.HTTP_201_CREATED)
def add_investigation_note(
    investigation_id: str,
    note_data: InvestigationNoteCreate,
    db: Session = Depends(get_db),
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail=f"Investigation '{investigation_id}' not found.")

    note = InvestigationNote(
        investigation_id=inv.id,
        author=note_data.author or "SOC Analyst",
        content=note_data.content,
    )
    db.add(note)
    inv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return note
