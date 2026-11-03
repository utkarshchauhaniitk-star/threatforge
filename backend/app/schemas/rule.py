from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class DetectionRuleBase(BaseModel):
    id: str
    name: str
    description: str
    severity: str
    logic_description: str
    is_enabled: bool = True
    parameters: Optional[str] = None  # JSON string
    mitre_attack_id: Optional[str] = None


class DetectionRuleUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    parameters: Optional[str] = None


class DetectionRuleResponse(DetectionRuleBase):
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
