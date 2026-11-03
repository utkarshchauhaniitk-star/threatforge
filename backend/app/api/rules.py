from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.rule import DetectionRule
from app.schemas.rule import DetectionRuleResponse, DetectionRuleUpdate
from app.services.detection_engine import initialize_default_rules

router = APIRouter(prefix="/rules", tags=["Detection Rules"])


@router.get("", response_model=List[DetectionRuleResponse])
def get_rules(db: Session = Depends(get_db)):
    initialize_default_rules(db)
    return db.query(DetectionRule).order_by(DetectionRule.id).all()


@router.patch("/{rule_id}", response_model=DetectionRuleResponse)
def update_rule(rule_id: str, payload: DetectionRuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(DetectionRule).filter(DetectionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail=f"Rule '{rule_id}' not found.")

    if payload.is_enabled is not None:
        rule.is_enabled = payload.is_enabled
    if payload.parameters is not None:
        rule.parameters = payload.parameters

    rule.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rule)
    return rule
