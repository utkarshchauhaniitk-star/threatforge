from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class AlertBase(BaseModel):
    title: str = Field(max_length=255)
    description: str
    severity: str = Field(default="Medium")  # Critical, High, Medium, Low
    status: str = Field(default="New")        # New, Investigating, Resolved, False Positive
    rule_id: str
    rule_name: str
    source_ip: Optional[str] = None
    username: Optional[str] = None
    event_count: int = 1
    evidence: Optional[str] = None  # JSON string
    timestamp: datetime


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    status: Optional[str] = Field(default=None, description="New, Investigating, Resolved, False Positive")
    note: Optional[str] = Field(default=None, description="Optional note explaining the status change")


class AlertResponse(AlertBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    alerts: List[AlertResponse]
