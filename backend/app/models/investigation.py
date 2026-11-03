import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database.session import Base


def generate_inv_id():
    return f"INV-{uuid.uuid4().hex[:8].upper()}"


def generate_note_id():
    return f"NOTE-{uuid.uuid4().hex[:8].upper()}"


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(String(64), primary_key=True, default=generate_inv_id, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="Open", index=True)      # Open, In Progress, Closed
    priority = Column(String(32), nullable=False, default="Medium", index=True) # Low, Medium, High, Critical
    assigned_to = Column(String(128), nullable=False, default="SOC Analyst")
    related_alert_ids = Column(Text, nullable=True)  # JSON array: ["ALT-xxx", ...]
    related_event_ids = Column(Text, nullable=True)  # JSON array: ["evt-1", ...]
    findings = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    notes = relationship("InvestigationNote", back_populates="investigation", cascade="all, delete-orphan", order_by="InvestigationNote.created_at.asc()")

    __table_args__ = (
        Index("ix_inv_status_priority", "status", "priority"),
    )


class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(String(64), primary_key=True, default=generate_note_id, index=True)
    investigation_id = Column(String(64), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    author = Column(String(128), nullable=False, default="Analyst")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    investigation = relationship("Investigation", back_populates="notes")
