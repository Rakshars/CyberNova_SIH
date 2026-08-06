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
