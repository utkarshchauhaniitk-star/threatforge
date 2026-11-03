import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer, Index
from app.database.session import Base


def generate_alert_id():
    return f"ALT-{uuid.uuid4().hex[:8].upper()}"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, default=generate_alert_id, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False, default="Medium", index=True)  # Critical, High, Medium, Low
    status = Column(String(32), nullable=False, default="New", index=True)        # New, Investigating, Resolved, False Positive
    rule_id = Column(String(64), nullable=False, index=True)
    rule_name = Column(String(255), nullable=False)
    source_ip = Column(String(64), nullable=True, index=True)
    username = Column(String(128), nullable=True, index=True)
    event_count = Column(Integer, default=1)
    evidence = Column(Text, nullable=True)  # JSON string with event IDs, indicators, match context
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_alerts_severity_status", "severity", "status"),
        Index("ix_alerts_rule_timestamp", "rule_id", "timestamp"),
    )
