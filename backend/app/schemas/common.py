from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str
    environment: str
    version: str
    timestamp: datetime


class ImportResultResponse(BaseModel):
    import_id: str
    filename: str
    file_type: str
    total_records: int
    imported_records: int
    failed_records: int
    alerts_generated: int
    errors: List[str]
    success: bool
    message: str
