import json
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from app.database.session import get_db
from app.models.event import SecurityEvent
from app.models.import_history import ImportHistory
from app.schemas.event import SecurityEventResponse, EventListResponse
from app.schemas.common import ImportResultResponse
from app.services.log_parser import parse_and_validate_logs
from app.services.detection_engine import run_threat_detection
from app.core.config import settings

router = APIRouter(prefix="/events", tags=["Security Events"])


@router.get("", response_model=EventListResponse)
def list_events(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search query matching IP, user, or description"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    source_ip: Optional[str] = Query(None, description="Filter by source IP"),
    username: Optional[str] = Query(None, description="Filter by username"),
    db: Session = Depends(get_db),
):
    query = db.query(SecurityEvent)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SecurityEvent.source_ip.ilike(search_pattern),
                SecurityEvent.username.ilike(search_pattern),
                SecurityEvent.description.ilike(search_pattern),
                SecurityEvent.action.ilike(search_pattern),
            )
        )

    if event_type:
        query = query.filter(SecurityEvent.event_type == event_type.lower())

    if severity:
        query = query.filter(SecurityEvent.severity == severity.lower())

    if status_filter:
        query = query.filter(SecurityEvent.status == status_filter.lower())

    if source_ip:
        query = query.filter(SecurityEvent.source_ip == source_ip.strip())

    if username:
        query = query.filter(SecurityEvent.username == username.strip())

    total = query.count()
    events = (
        query.order_by(desc(SecurityEvent.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return EventListResponse(
        total=total,
        page=page,
        page_size=page_size,
        events=events,
    )


@router.get("/{event_id}", response_model=SecurityEventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Security event with ID '{event_id}' not found.")
    return event


@router.post("/upload", response_model=ImportResultResponse)
async def upload_log_file(
    file: UploadFile = File(...),
    auto_detect: bool = Query(True, description="Automatically trigger threat detection after ingestion"),
    db: Session = Depends(get_db),
):
    filename = file.filename or "unknown_log.json"
    content_bytes = await file.read()

    # Parse and validate logs
    events, errors, total_records = parse_and_validate_logs(
        content_bytes=content_bytes,
        filename=filename,
        max_bytes=settings.max_upload_bytes,
    )

    if total_records == 0 and errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "File rejection error", "errors": errors},
        )

    # Ingest valid events
    imported_count = len(events)
    failed_count = total_records - imported_count

    if imported_count > 0:
        db.add_all(events)
        db.commit()

    # Run threat detection if requested
    alerts_generated = 0
    if auto_detect and imported_count > 0:
        new_alerts = run_threat_detection(db)
        alerts_generated = len(new_alerts)

    # Record history
    history = ImportHistory(
        filename=filename,
        file_type="json" if filename.lower().endswith(".json") else "csv",
        total_records=total_records,
        imported_records=imported_count,
        failed_records=failed_count,
        errors_json=json.dumps(errors[:20]),
    )
    db.add(history)
    db.commit()

    return ImportResultResponse(
        import_id=history.id,
        filename=filename,
        file_type=history.file_type,
        total_records=total_records,
        imported_records=imported_count,
        failed_records=failed_count,
        alerts_generated=alerts_generated,
        errors=errors[:10],
        success=imported_count > 0,
        message=f"Successfully ingested {imported_count}/{total_records} events. Generated {alerts_generated} alert(s).",
    )
