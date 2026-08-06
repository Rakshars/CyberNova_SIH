"""
api/incidents.py
-----------------
GET  /api/incidents          — paginated incident list
GET  /api/incidents/{id}     — single incident detail
GET  /api/incidents/{id}/timeline — ordered events for the incident
POST /api/incidents/{id}/feedback — analyst verdict
"""

from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.incident import Incident
from app.models.security_event import SecurityEvent
from app.schemas.incident import IncidentResponse, IncidentListResponse, AnalystFeedback
from app.schemas.security_event import SecurityEventResponse
from app.api.events import _to_response as event_to_response

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=IncidentListResponse)
def list_incidents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
) -> IncidentListResponse:
    query = db.query(Incident)
    if severity:
        query = query.filter(Incident.severity == severity.lower())
    if status:
        query = query.filter(Incident.status == status.lower())
    if username:
        query = query.filter(Incident.affected_username == username)

    total = query.count()
    incidents = (
        query.order_by(desc(Incident.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return IncidentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[_to_incident_response(i) for i in incidents],
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)) -> IncidentResponse:
    inc = _get_or_404(incident_id, db)
    return _to_incident_response(inc)


@router.get("/{incident_id}/timeline", response_model=list[SecurityEventResponse])
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)) -> list[SecurityEventResponse]:
    inc = _get_or_404(incident_id, db)
    events = (
        db.query(SecurityEvent)
        .filter(SecurityEvent.incident_id == inc.id)
        .order_by(SecurityEvent.timestamp)
        .all()
    )
    return [event_to_response(e) for e in events]


@router.post("/{incident_id}/feedback", response_model=IncidentResponse)
def submit_feedback(
    incident_id: str,
    feedback: AnalystFeedback,
    db: Session = Depends(get_db),
) -> IncidentResponse:
    inc = _get_or_404(incident_id, db)
    inc.analyst_verdict = feedback.verdict
    inc.analyst_notes = feedback.notes
    db.commit()
    db.refresh(inc)
    return _to_incident_response(inc)


def _get_or_404(incident_id: str, db: Session) -> Incident:
    """Fetch incident by UUID or INC-XXXX string."""
    inc = (
        db.query(Incident)
        .filter((Incident.id == incident_id) | (Incident.incident_id == incident_id))
        .first()
    )
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found")
    return inc


def _to_incident_response(i: Incident) -> IncidentResponse:
    return IncidentResponse(
        id=i.id,
        incident_id=i.incident_id,
        title=i.title,
        incident_type=i.incident_type,
        status=i.status,
        severity=i.severity,
        risk_score=i.risk_score,
        confidence=i.confidence,
        affected_username=i.affected_username,
        affected_ip=i.affected_ip,
        affected_device=i.affected_device,
        start_time=i.start_time,
        end_time=i.end_time,
        event_count=i.event_count,
        summary=i.summary,
        mitre_techniques=i.mitre_techniques or [],
        investigation=i.investigation or {},
        similar_incidents=i.similar_incidents or [],
        response_taken=i.response_taken or [],
        analyst_verdict=i.analyst_verdict,
        created_at=i.created_at,
        updated_at=i.updated_at,
    )
