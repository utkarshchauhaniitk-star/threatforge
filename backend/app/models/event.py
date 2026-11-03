import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Index
from app.database.session import Base


def generate_uuid():
    return str(uuid.uuid4())


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(64), primary_key=True, default=generate_uuid, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True, default="authentication")
    source_ip = Column(String(64), nullable=False, index=True)
    destination_ip = Column(String(64), nullable=True, index=True)
    username = Column(String(128), nullable=True, index=True)
    action = Column(String(64), nullable=False, index=True, default="login")
    status = Column(String(32), nullable=False, index=True, default="failure")
    severity = Column(String(32), nullable=False, index=True, default="low")
    description = Column(Text, nullable=False)
    source = Column(String(128), nullable=True, default="auth_log")
    raw_event_data = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_events_source_ip_status", "source_ip", "status"),
        Index("ix_events_user_status", "username", "status"),
        Index("ix_events_type_timestamp", "event_type", "timestamp"),
    )
