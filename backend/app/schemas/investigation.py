from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class InvestigationNoteBase(BaseModel):
    author: str = Field(default="SOC Analyst", max_length=128)
    content: str = Field(min_length=1)


class InvestigationNoteCreate(InvestigationNoteBase):
    pass


class InvestigationNoteResponse(InvestigationNoteBase):
    id: str
    investigation_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvestigationBase(BaseModel):
    title: str = Field(max_length=255)
    description: str
    status: str = Field(default="Open")      # Open, In Progress, Closed
    priority: str = Field(default="Medium")  # Low, Medium, High, Critical
    assigned_to: str = Field(default="SOC Analyst", max_length=128)
    related_alert_ids: Optional[str] = None  # JSON string array
    related_event_ids: Optional[str] = None  # JSON string array
    findings: Optional[str] = None


class InvestigationCreate(BaseModel):
    title: str = Field(max_length=255)
    description: str
    priority: str = Field(default="Medium")
    assigned_to: str = Field(default="SOC Analyst")
    alert_id: Optional[str] = None
    related_alert_ids: Optional[List[str]] = None
    related_event_ids: Optional[List[str]] = None
    initial_note: Optional[str] = None


class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # Open, In Progress, Closed
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    findings: Optional[str] = None
    related_alert_ids: Optional[str] = None
    related_event_ids: Optional[str] = None


class InvestigationResponse(InvestigationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    notes: List[InvestigationNoteResponse] = []

    model_config = ConfigDict(from_attributes=True)
