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

# --- AI Explanation map keyed by incident_type ---
_ATTACK_INTEL = {
    "FAILED_LOGIN_BURST": {
        "attack_name": "Credential Stuffing & Brute Force Attack",
        "mitre_id": "T1110.001",
        "attack_explanation": (
            "The attacker is rapidly firing hundreds of login attempts from a suspicious IP "
            "(often a Tor exit node or compromised host) to guess or stuff leaked credentials. "
            "This 'brute force burst' also combines with impossible travel — the same account "
            "appears to login from two geographically impossible locations within minutes."
        ),
        "ai_response": (
            "CyberNova AI has: (1) Flagged the source IP as malicious and blocked all further "
            "requests from that subnet. (2) Temporarily locked the targeted account and notified "
            "the user. (3) Escalated to SOAR which auto-triggered a password reset workflow. "
            "(4) Correlated the IP against global threat intelligence feeds."
        ),
        "severity_color": "#ff2a6d",
        "icon": "💥",
    },
    "UPI_ANOMALY": {
        "attack_name": "Bharat UPI Micro-Debit Velocity Fraud",
        "mitre_id": "T1657",
        "attack_explanation": (
            "An automated bot is executing a high-velocity series of micro-debit UPI transactions "
            "across multiple VPAs in rapid succession — a pattern used to drain accounts incrementally "
            "below fraud-detection thresholds. This is a financial fraud technique specific to India's "
            "UPI ecosystem, exploiting the lack of per-transaction velocity checks."
        ),
        "ai_response": (
            "CyberNova AI has: (1) Detected the abnormal transaction velocity (>10x baseline) using "
            "the UPI anomaly ML model. (2) Placed a temporary hold on outgoing UPI transactions for "
            "the affected VPA. (3) Sent an OTP-based re-authorization challenge to the user's "
            "registered mobile. (4) Reported the attacker's VPA to the NPCI fraud registry."
        ),
        "severity_color": "#ffaa00",
        "icon": "💳",
    },
    "PHISHING_STORM": {
        "attack_name": "Mass SMS Phishing / Smishing Campaign",
        "mitre_id": "T1566.004",
        "attack_explanation": (
            "A threat actor operating an automated SMS botnet is sending thousands of fraudulent "
            "messages impersonating electricity boards, banks, and KYC update portals — containing "
            "malicious links designed to harvest credentials or install malware on mobile devices. "
            "The NLP classifier identified the message as a social engineering attack."
        ),
        "ai_response": (
            "CyberNova AI has: (1) Blocked the originating SMS gateway IP and flagged the sender ID. "
            "(2) Extracted and blacklisted all malicious URLs found in the message payload. "
            "(3) Pushed IOC (Indicator of Compromise) data to the firewall and DNS filter. "
            "(4) Alerted all potentially targeted users with a security advisory."
        ),
        "severity_color": "#00f2fe",
        "icon": "📱",
    },
    "DEEPFAKE_WIRE_FRAUD": {
        "attack_name": "Deepfake CEO Voice Impersonation & Wire Fraud",
        "mitre_id": "T1656",
        "attack_explanation": (
            "An AI-synthesized voice/video impersonation of a senior executive (CEO/CFO) is being "
            "used to socially engineer finance staff into authorizing an unauthorized wire transfer. "
            "The ViT-based deepfake classifier detected statistical artifacts in the audio/video "
            "waveform inconsistent with genuine human recording — a hallmark of GAN-generated media."
        ),
        "ai_response": (
            "CyberNova AI has: (1) Flagged the media as synthetic with 97.3% confidence using the "
            "ViT deepfake detection model. (2) Immediately quarantined the request and halted any "
            "pending wire transfer. (3) Notified the actual executive and the security team. "
            "(4) Preserved forensic evidence (audio hash, timestamp) for law enforcement reporting."
        ),
        "severity_color": "#05ffa1",
        "icon": "🎭",
    },
}



@router.get("/latest-threat")
def get_latest_threat(db: Session = Depends(get_db)) -> dict:
    """
    Returns the most recently created incident along with AI-generated
    attack explanation and response plan — used by the SOC blue team
    live alert panel to auto-show when the red team launches an attack.
    """
    inc = (
        db.query(Incident)
        .order_by(desc(Incident.created_at))
        .first()
    )
    if not inc:
        return {"incident": None}

    intel = _ATTACK_INTEL.get(inc.incident_type or "", {})

    return {
        "incident": {
            "id": inc.id,
            "incident_id": inc.incident_id,
            "title": inc.title,
            "incident_type": inc.incident_type,
            "severity": inc.severity,
            "risk_score": inc.risk_score,
            "affected_username": inc.affected_username,
            "affected_ip": inc.affected_ip,
            "created_at": inc.created_at.isoformat() if inc.created_at else None,
            "response_taken": inc.response_taken or [],
            # AI enrichment fields
            "attack_name": intel.get("attack_name", inc.title),
            "mitre_id": intel.get("mitre_id", ""),
            "attack_explanation": intel.get("attack_explanation", "An anomalous security event was detected by the AI engine."),
            "ai_response": intel.get("ai_response", "The autonomous SOAR engine has been triggered to contain the threat."),
            "severity_color": intel.get("severity_color", "#ff2a6d"),
            "icon": intel.get("icon", "🚨"),
        }
    }


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
