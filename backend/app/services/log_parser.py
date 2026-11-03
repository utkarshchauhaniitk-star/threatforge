import io
import csv
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from app.models.event import SecurityEvent


STANDARD_EVENT_TYPES = {"authentication", "network", "system", "file", "authorization", "application"}
STANDARD_STATUSES = {"failure", "success", "denied", "attempt", "warning"}
STANDARD_SEVERITIES = {"low", "medium", "high", "critical"}


def parse_timestamp(value: Any) -> datetime:
    """Parse various timestamp formats into timezone-aware UTC datetime."""
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    if isinstance(value, (int, float)):
        # Epoch timestamp (check seconds vs milliseconds)
        if value > 1e11:  # milliseconds
            return datetime.fromtimestamp(value / 1000.0, tz=timezone.utc)
        return datetime.fromtimestamp(value, tz=timezone.utc)

    if isinstance(value, str):
        value_str = value.strip()
        # Handle ISO with 'Z'
        if value_str.endswith("Z"):
            value_str = value_str[:-1] + "+00:00"
        
        # Try common formats
        formats = [
            "%Y-%m-%dT%H:%M:%S%z",
            "%Y-%m-%dT%H:%M:%S.%f%z",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M:%S%z",
            "%Y-%m-%d",
            "%b %d %H:%M:%S",  # Syslog style e.g. Nov 3 14:02:10
        ]
        for fmt in formats:
            try:
                dt = datetime.strptime(value_str, fmt)
                if "%b" in fmt and dt.year == 1900:
                    dt = dt.replace(year=datetime.now(timezone.utc).year)
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                else:
                    dt = dt.astimezone(timezone.utc)
                return dt
            except ValueError:
                continue

        # Last resort fallback: fromisoformat
        try:
            dt = datetime.fromisoformat(value_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            else:
                dt = dt.astimezone(timezone.utc)
            return dt
        except Exception:
            pass

    # If unparseable or absent, default to current UTC time
    return datetime.now(timezone.utc)


def normalize_record(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize raw log fields into standardized ThreatForge event schema."""
    # Normalize keys to lowercase for flexible matching
    raw_lower = {k.lower().strip(): v for k, v in raw.items() if isinstance(k, str)}

    # Source IP
    source_ip = (
        raw_lower.get("source_ip")
        or raw_lower.get("src_ip")
        or raw_lower.get("ip")
        or raw_lower.get("client_ip")
        or raw_lower.get("host")
        or "127.0.0.1"
    )
    if isinstance(source_ip, str):
        source_ip = source_ip.strip()

    # Destination IP
    dest_ip = (
        raw_lower.get("destination_ip")
        or raw_lower.get("dest_ip")
        or raw_lower.get("dst_ip")
        or raw_lower.get("target_ip")
    )
    if isinstance(dest_ip, str):
        dest_ip = dest_ip.strip()

    # Username
    username = (
        raw_lower.get("username")
        or raw_lower.get("user")
        or raw_lower.get("account")
        or raw_lower.get("user_id")
        or raw_lower.get("login")
    )
    if isinstance(username, str):
        username = username.strip()

    # Event Type
    event_type = (
        raw_lower.get("event_type")
        or raw_lower.get("type")
        or raw_lower.get("category")
        or "authentication"
    )
    if isinstance(event_type, str):
        event_type = event_type.strip().lower()

    # Action
    action = (
        raw_lower.get("action")
        or raw_lower.get("activity")
        or raw_lower.get("event")
        or "login"
    )
    if isinstance(action, str):
        action = action.strip().lower()

    # Status
    status = (
        raw_lower.get("status")
        or raw_lower.get("result")
        or raw_lower.get("outcome")
        or "failure"
    )
    if isinstance(status, str):
        status = status.strip().lower()
        if "fail" in status:
            status = "failure"
        elif "succ" in status or "allow" in status or "ok" in status:
            status = "success"
        elif "deny" in status or "denied" in status or "block" in status:
            status = "denied"
        elif "att" in status:
            status = "attempt"

    # Severity
    severity = (
        raw_lower.get("severity")
        or raw_lower.get("level")
        or raw_lower.get("priority")
        or ("high" if status in ("failure", "denied") else "low")
    )
    if isinstance(severity, str):
        severity = severity.strip().lower()
        if severity not in STANDARD_SEVERITIES:
            if severity in ("error", "err", "fatal", "critical"):
                severity = "critical"
            elif severity in ("warn", "warning"):
                severity = "medium"
            elif severity in ("info", "notice", "debug"):
                severity = "low"
            else:
                severity = "low"

    # Description
    description = (
        raw_lower.get("description")
        or raw_lower.get("message")
        or raw_lower.get("msg")
        or raw_lower.get("summary")
        or f"{event_type.capitalize()} {action} {status} for {username or 'unknown'} from {source_ip}"
    )

    # Source service/device
    source = (
        raw_lower.get("source")
        or raw_lower.get("service")
        or raw_lower.get("app")
        or raw_lower.get("facility")
        or "security_monitor"
    )

    # Timestamp
    ts_val = (
        raw_lower.get("timestamp")
        or raw_lower.get("@timestamp")
        or raw_lower.get("time")
        or raw_lower.get("datetime")
        or raw_lower.get("date")
    )
    parsed_ts = parse_timestamp(ts_val)

    # Specific event ID if provided
    event_id = raw_lower.get("id") or raw_lower.get("event_id")

    return {
        "id": str(event_id) if event_id else None,
        "timestamp": parsed_ts,
        "event_type": str(event_type),
        "source_ip": str(source_ip),
        "destination_ip": str(dest_ip) if dest_ip else None,
        "username": str(username) if username else None,
        "action": str(action),
        "status": str(status),
        "severity": str(severity),
        "description": str(description),
        "source": str(source),
        "raw_event_data": json.dumps(raw, default=str),
    }


def parse_and_validate_logs(
    content_bytes: bytes,
    filename: str,
    max_bytes: int
) -> Tuple[List[SecurityEvent], List[str], int]:
    """
    Parse uploaded JSON or CSV file bytes safely.
    Returns: (valid_events, errors_list, total_records)
    """
    if len(content_bytes) == 0:
        return [], ["Uploaded file is empty (0 bytes)."], 0

    if len(content_bytes) > max_bytes:
        return [], [f"File exceeds maximum allowed size of {max_bytes / (1024 * 1024):.1f}MB."], 0

    filename_lower = filename.lower()
    errors: List[str] = []
    events: List[SecurityEvent] = []
    total_records = 0

    # Handle JSON format
    if filename_lower.endswith(".json"):
        try:
            content_str = content_bytes.decode("utf-8", errors="replace")
            parsed_data = json.loads(content_str)
        except Exception as e:
            return [], [f"Invalid JSON format: {str(e)}"], 0

        # Can be list of dicts, or single dict, or dict with "events" key
        if isinstance(parsed_data, dict):
            if "events" in parsed_data and isinstance(parsed_data["events"], list):
                records = parsed_data["events"]
            elif "records" in parsed_data and isinstance(parsed_data["records"], list):
                records = parsed_data["records"]
            else:
                records = [parsed_data]
        elif isinstance(parsed_data, list):
            records = parsed_data
        else:
            return [], ["JSON root must be an array of event objects or an object containing an 'events' list."], 0

        total_records = len(records)
        for idx, rec in enumerate(records):
            if not isinstance(rec, dict):
                errors.append(f"Record #{idx + 1} is not a valid JSON object.")
                continue
            try:
                norm = normalize_record(rec)
                event_kwargs = {k: v for k, v in norm.items() if k != "id" or v is not None}
                events.append(SecurityEvent(**event_kwargs))
            except Exception as e:
                errors.append(f"Record #{idx + 1} failed normalization: {str(e)}")

    # Handle CSV format
    elif filename_lower.endswith(".csv"):
        try:
            content_str = content_bytes.decode("utf-8", errors="replace")
            f = io.StringIO(content_str)
            reader = csv.DictReader(f)
            
            if not reader.fieldnames:
                return [], ["CSV file has no header row or columns."], 0

            records = list(reader)
            total_records = len(records)

            for idx, rec in enumerate(records):
                try:
                    # Strip whitespace from keys and values
                    cleaned_rec = {
                        k.strip() if k else f"col_{cidx}": (v.strip() if isinstance(v, str) else v)
                        for cidx, (k, v) in enumerate(rec.items())
                    }
                    norm = normalize_record(cleaned_rec)
                    event_kwargs = {k: v for k, v in norm.items() if k != "id" or v is not None}
                    events.append(SecurityEvent(**event_kwargs))
                except Exception as e:
                    errors.append(f"CSV Row #{idx + 2} failed normalization: {str(e)}")

        except Exception as e:
            return [], [f"Invalid CSV structure: {str(e)}"], 0
    else:
        return [], ["Unsupported file format. Please upload a .json or .csv log file."], 0

    return events, errors, total_records
