"""
correlation/correlator.py
--------------------------
Phase 4 placeholder — groups related security events into incidents.
Currently a stub that creates one incident per high-risk event.
Full time-window correlation logic arrives in Phase 4.
"""

from __future__ import annotations
import uuid
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.incident import Incident
from app.models.security_event import SecurityEvent

logger = logging.getLogger(__name__)

_incident_counter = 0


def _next_incident_id(db: Session) -> str:
    count = db.query(Incident).count()
    return f"INC-{(count + 1):04d}"


def create_incident_from_event(event: SecurityEvent, db: Session) -> Incident:
    """
    Create a single-event incident for a high-risk event.
    Phase 4 will replace this with full correlation logic.
    """
    inc = Incident(
        id=str(uuid.uuid4()),
        incident_id=_next_incident_id(db),
        title=f"Suspicious activity by {event.username} from {event.country}",
        incident_type="auth_anomaly",
        status="open",
        severity=event.risk_level.lower() if event.risk_level else "medium",
        risk_score=event.risk_score or 0,
        confidence=0.7,
        affected_username=event.username,
        affected_ip=event.ip_address,
        affected_device=event.device,
        start_time=event.timestamp,
        end_time=None,
        event_count=1,
        summary=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(inc)
    db.flush()  # get the incident ID without committing

    # Link the event to the incident
    event.incident_id = inc.id
    db.commit()
    db.refresh(inc)
    return inc
