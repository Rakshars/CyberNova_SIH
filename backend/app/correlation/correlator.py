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
    inc_uuid = str(uuid.uuid4())
    inc_id_str = _next_incident_id(db)

    # Check for simulated title and attack type overrides in raw_payload
    sim_title = event.raw_payload.get("simulated_title") if isinstance(event.raw_payload, dict) else None
    sim_event_type = event.raw_payload.get("simulated_event_type") if isinstance(event.raw_payload, dict) else None

    incident_payload = {
        "id": inc_uuid,
        "title": sim_title or f"Suspicious activity by {event.username} from {event.country}",
        "risk_score": event.risk_score or 0,
        "severity": (event.risk_level.upper() if event.risk_level else "MEDIUM"),
        "event_type": sim_event_type or event.event_type or "",
        "target_user": event.username,
        "ip_address": event.ip_address
    }

    # Evaluate SOAR policies first without open DB transaction
    from app.response.policy_engine import policy_engine
    from app.models.response_action import ResponseAction
    soar_actions = policy_engine.evaluate_incident(incident_payload, db=None, incident_id=inc_uuid, commit=False)

    now = datetime.utcnow()
    inc = Incident(
        id=inc_uuid,
        incident_id=inc_id_str,
        title=incident_payload["title"],
        incident_type=incident_payload["event_type"],
        status="open",
        severity=incident_payload["severity"],
        risk_score=incident_payload["risk_score"],
        confidence=0.7,
        affected_username=event.username,
        affected_ip=event.ip_address,
        affected_device=event.device,
        start_time=event.timestamp,
        end_time=None,
        event_count=1,
        summary=f"Automated incident created. SOAR evaluated {len(soar_actions)} containment actions.",
        response_taken=soar_actions,
        created_at=now,
        updated_at=now,
    )
    db.add(inc)

    for act in soar_actions:
        db_action = ResponseAction(
            id=act["id"],
            incident_id=inc_uuid,
            action_type=act["action_type"],
            target=act["target"],
            status=act["status"],
            triggered_by=act.get("triggered_by", "Autonomous SOAR Engine"),
            reason=act.get("reason", ""),
            policy_name=act.get("policy_name", "SOAR Policy"),
            executed_at=now
        )
        db.add(db_action)

    event.incident_id = inc_uuid
    db.commit()
    db.refresh(inc)
    return inc
