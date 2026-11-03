from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Boolean
from app.database.session import Base


class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False, default="Medium")
    logic_description = Column(Text, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    parameters = Column(Text, nullable=True)  # JSON string: e.g. {"threshold": 5, "window_minutes": 15}
    mitre_attack_id = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
