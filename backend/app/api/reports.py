from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.report import IncidentReportRequest, IncidentReportResponse
from app.services.report_generator import generate_incident_report, export_report_to_csv

router = APIRouter(prefix="/reports", tags=["Incident Reports"])


@router.post("/generate", response_model=IncidentReportResponse)
def generate_report(payload: IncidentReportRequest, db: Session = Depends(get_db)):
    report_dict = generate_incident_report(
        db=db,
        title=payload.title or "ThreatForge Incident Summary Report",
        investigation_id=payload.investigation_id,
        time_range_hours=payload.time_range_hours or 24,
        include_events=payload.include_events,
        include_notes=payload.include_notes,
    )
    return report_dict


@router.get("/export/csv")
def export_csv_report(
    investigation_id: Optional[str] = Query(None),
    title: Optional[str] = Query("ThreatForge Incident Report"),
    db: Session = Depends(get_db),
):
    report_dict = generate_incident_report(
        db=db,
        title=title or "ThreatForge Incident Report",
        investigation_id=investigation_id,
    )
    csv_content = export_report_to_csv(report_dict)
    filename = f"threatforge_report_{report_dict['report_id']}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/json")
def export_json_report(
    investigation_id: Optional[str] = Query(None),
    title: Optional[str] = Query("ThreatForge Incident Report"),
    db: Session = Depends(get_db),
):
    import json
    report_dict = generate_incident_report(
        db=db,
        title=title or "ThreatForge Incident Report",
        investigation_id=investigation_id,
    )
    json_content = json.dumps(report_dict, indent=2)
    filename = f"threatforge_report_{report_dict['report_id']}.json"

    return Response(
        content=json_content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
