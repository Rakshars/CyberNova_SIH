"""
api/events.py
--------------
GET  /api/events      — paginated event list with filters
POST /api/events      — ingest a new event (normalizes, scores, stores)
"""

from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.security_event import SecurityEvent
from app.schemas.security_event import SecurityEventCreate, SecurityEventResponse, SecurityEventListResponse
from app.services.pipeline_service import process_single_event

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("", response_model=SecurityEventListResponse)
def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    username: Optional[str] = None,
    risk_level: Optional[str] = None,
    event_type: Optional[str] = None,
    is_anomaly: Optional[bool] = None,
    db: Session = Depends(get_db),
) -> SecurityEventListResponse:
    """Return a paginated, filterable list of security events."""
    query = db.query(SecurityEvent)

    if username:
        query = query.filter(SecurityEvent.username == username)
    if risk_level:
        query = query.filter(SecurityEvent.risk_level == risk_level)
    if event_type:
        query = query.filter(SecurityEvent.event_type == event_type)
    if is_anomaly is not None:
        query = query.filter(SecurityEvent.is_anomaly.is_(is_anomaly))

    total = query.count()
    events = (
        query.order_by(desc(SecurityEvent.timestamp))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return SecurityEventListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[_to_response(e) for e in events],
    )


@router.get("/{event_id}", response_model=SecurityEventResponse)
def get_event(event_id: str, db: Session = Depends(get_db)) -> SecurityEventResponse:
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _to_response(event)


@router.post("", response_model=SecurityEventResponse, status_code=201)
def ingest_event(
    payload: SecurityEventCreate,
    db: Session = Depends(get_db),
) -> SecurityEventResponse:
    """
    Ingest a new security event.
    The event is immediately normalized, feature-engineered, ML-scored,
    risk-scored, and stored. The scored event is returned in the response.
    """
    # Load user baselines from DB for this user
    from app.models.user import User
    user_record = db.query(User).filter(User.username == payload.username).first()
    baselines = {}
    if user_record:
        baselines[payload.username] = {
            "baseline_country": user_record.baseline_country,
            "baseline_device": user_record.baseline_device,
        }

    event_dict = payload.model_dump()
    db_event = process_single_event(event_dict, db, baselines=baselines)
    return _to_response(db_event)


def _to_response(e: SecurityEvent) -> SecurityEventResponse:
    """Convert ORM object to Pydantic response schema."""
    reasons = e.risk_reasons or []
    # Normalize reasons — could be stored as list of strings or list of dicts
    normalized_reasons = []
    for r in reasons:
        if isinstance(r, dict):
            normalized_reasons.append(r)
        elif isinstance(r, str):
            normalized_reasons.append({"label": r, "points": 0, "category": "rule"})

    return SecurityEventResponse(
        id=e.id,
        event_type=e.event_type,
        timestamp=e.timestamp,
        username=e.username,
        ip_address=e.ip_address,
        country=e.country,
        device=e.device,
        browser=e.browser,
        login_status=e.login_status,
        is_night=bool(e.is_night),
        unusual_country=bool(e.unusual_country),
        unusual_device=bool(e.unusual_device),
        ip_recent_failures=e.ip_recent_failures or 0,
        ml_anomaly_score=e.ml_anomaly_score or 0.0,
        is_anomaly=bool(e.is_anomaly),
        risk_score=e.risk_score or 0,
        risk_level=e.risk_level or "Low",
        risk_reasons=normalized_reasons,
        incident_id=e.incident_id,
        created_at=e.created_at,
    )


# --- Red Team Live Simulation Endpoints ---
@router.post("/simulate/attack")
def trigger_simulated_attack(attack_type: str = Query(..., description="brute_force | upi_fraud | phishing_blast | deepfake_wire"), db: Session = Depends(get_db)):
    """
    Triggers an instant Red Team attack scenario for live hackathon demonstration.
    """
    from datetime import datetime
    import random
    from app.response.policy_engine import policy_engine

    target_user = random.choice(["rahul", "asha", "vikram", "meera"])
    attacker_ip = f"185.220.{random.randint(100,200)}.{random.randint(1,254)}"

    if attack_type == "upi_fraud":
        event_dict = {
            "event_type": "transaction_upi",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "username": target_user,
            "ip_address": attacker_ip,
            "country": "India",
            "device": "Android-Phone",
            "browser": "UPI App Mobile",
            "login_status": "Flagged",
            "risk_score": 92,
            "risk_level": "Critical"
        }
        incident_payload = {
            "title": f"Bharat UPI Micro-Debit Fraud Attack on {target_user}",
            "risk_score": 92,
            "severity": "CRITICAL",
            "event_type": "UPI_ANOMALY",
            "target_user": target_user,
            "ip_address": attacker_ip
        }

    elif attack_type == "phishing_blast":
        event_dict = {
            "event_type": "phishing_sms",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "username": target_user,
            "ip_address": attacker_ip,
            "country": "Nigeria",
            "device": "SMS Gateway",
            "browser": "Automated Botnet",
            "login_status": "Failed",
            "risk_score": 85,
            "risk_level": "High"
        }
        incident_payload = {
            "title": f"Mass SMS Electricity Scam & Phishing Storm targeting {target_user}",
            "risk_score": 85,
            "severity": "HIGH",
            "event_type": "PHISHING_STORM",
            "target_user": target_user,
            "ip_address": attacker_ip
        }

    elif attack_type == "deepfake_wire":
        event_dict = {
            "event_type": "deepfake_wire",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "username": "executive_admin",
            "ip_address": attacker_ip,
            "country": "Russia",
            "device": "Synthetic Audio Generator",
            "browser": "SIP Voice Gateway",
            "login_status": "Flagged",
            "risk_score": 98,
            "risk_level": "Critical"
        }
        incident_payload = {
            "title": "Deepfake CEO Voice Manipulation & Emergency Transfer Request",
            "risk_score": 98,
            "severity": "CRITICAL",
            "event_type": "DEEPFAKE_WIRE_FRAUD",
            "target_user": "executive_admin",
            "ip_address": attacker_ip
        }

    else: # Default brute_force
        event_dict = {
            "event_type": "auth",
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "username": target_user,
            "ip_address": attacker_ip,
            "country": "Russia",
            "device": "Tor Exit Node",
            "browser": "Python Script",
            "login_status": "Failed",
            "risk_score": 88,
            "risk_level": "High"
        }
        incident_payload = {
            "title": f"Credential Stuffing & Impossible Travel Burst on {target_user}",
            "risk_score": 88,
            "severity": "HIGH",
            "event_type": "FAILED_LOGIN_BURST",
            "target_user": target_user,
            "ip_address": attacker_ip
        }

    # Persist Incident to DB for instant visual update on Dashboard
    import uuid
    from app.models.incident import Incident
    from app.models.security_event import SecurityEvent

    db_inc_uuid = str(uuid.uuid4())
    now = datetime.utcnow()
    new_inc_id = f"INC-{str(uuid.uuid4())[:8].upper()}"
    db_inc = Incident(
        id=db_inc_uuid,
        incident_id=new_inc_id,
        title=incident_payload["title"],
        incident_type=incident_payload["event_type"],
        severity=incident_payload["severity"],
        status="open",
        risk_score=incident_payload["risk_score"],
        confidence=0.95,
        affected_username=incident_payload["target_user"],
        affected_ip=incident_payload["ip_address"],
        start_time=now,
        end_time=now,
        event_count=1,
        summary="Pending SOAR evaluation.",
        investigation={},
        mitre_techniques=[],
        similar_incidents=[],
        response_taken=[]
    )
    db.add(db_inc)
    db.flush()

    # Evaluate with SOAR engine immediately (persisting to DB)
    soar_actions = policy_engine.evaluate_incident(incident_payload, db=db, incident_id=db_inc_uuid, commit=True)
    db_inc.response_taken = soar_actions
    db_inc.summary = f"Automated alert generated by Red Team live trigger. SOAR evaluated {len(soar_actions)} containment actions."

    db_evt = SecurityEvent(
        id=str(uuid.uuid4()),
        event_type=event_dict["event_type"],
        timestamp=datetime.utcnow(),
        username=target_user,
        ip_address=attacker_ip,
        country=event_dict["country"],
        device=event_dict["device"],
        browser=event_dict["browser"],
        login_status=event_dict["login_status"],
        risk_score=event_dict["risk_score"],
        risk_level=event_dict["risk_level"],
        is_anomaly=True,
        incident_id=db_inc_uuid
    )
    db.add(db_evt)
    db.commit()

    return {
        "status": "Attack Triggered Live",
        "attack_type": attack_type,
        "target_user": target_user,
        "attacker_ip": attacker_ip,
        "simulated_event": event_dict,
        "incident_summary": incident_payload,
        "soar_autonomous_actions": soar_actions,
        "new_incident_id": new_inc_id
    }


