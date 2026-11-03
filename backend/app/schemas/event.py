from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class SecurityEventBase(BaseModel):
    timestamp: datetime = Field(description="Event timestamp in UTC")
    event_type: str = Field(default="authentication", max_length=64)
    source_ip: str = Field(max_length=64)
    destination_ip: Optional[str] = Field(default=None, max_length=64)
    username: Optional[str] = Field(default=None, max_length=128)
    action: str = Field(default="login", max_length=64)
    status: str = Field(default="failure", max_length=32)
    severity: str = Field(default="low", max_length=32)
    description: str = Field(min_length=1)
    source: Optional[str] = Field(default="auth_log", max_length=128)
    raw_event_data: Optional[str] = None


class SecurityEventCreate(SecurityEventBase):
    id: Optional[str] = None


class SecurityEventResponse(SecurityEventBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    events: List[SecurityEventResponse]
