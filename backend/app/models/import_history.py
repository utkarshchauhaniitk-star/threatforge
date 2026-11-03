import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, Integer
from app.database.session import Base


def generate_import_id():
    return f"IMP-{uuid.uuid4().hex[:8].upper()}"


class ImportHistory(Base):
    __tablename__ = "import_history"

    id = Column(String(64), primary_key=True, default=generate_import_id, index=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(32), nullable=False)
    total_records = Column(Integer, nullable=False, default=0)
    imported_records = Column(Integer, nullable=False, default=0)
    failed_records = Column(Integer, nullable=False, default=0)
    errors_json = Column(Text, nullable=True)
    imported_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
