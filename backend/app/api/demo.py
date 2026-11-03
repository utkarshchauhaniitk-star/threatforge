from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.demo_data import load_synthetic_demo_data, reset_demo_data
from app.services.detection_engine import run_threat_detection
from app.schemas.alert import AlertResponse

router = APIRouter(tags=["Demo & Detection Engine"])


@router.post("/demo/load")
def load_demo(
    force: bool = Query(False, description="Force reload/refresh of synthetic demo dataset"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    events_loaded, alerts_gen, message = load_synthetic_demo_data(db, force_reload=force)
    return {
        "status": "success",
        "events_loaded": events_loaded,
        "alerts_generated": alerts_gen,
        "message": message,
    }


@router.post("/demo/reset")
def reset_demo(db: Session = Depends(get_db)) -> Dict[str, Any]:
    return reset_demo_data(db)


@router.post("/detections/run", response_model=List[AlertResponse])
def trigger_detections(db: Session = Depends(get_db)):
    alerts = run_threat_detection(db)
    return alerts
