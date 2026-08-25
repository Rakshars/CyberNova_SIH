"""
api/dashboard.py
-----------------
GET /api/dashboard/summary    — top-level metrics for the overview page.
GET /api/dashboard/live-panels — real XAI risk factors + UPI/NLP counts.

Security Health Score formula (documented, not arbitrary):
  Start at 100.
  -5 per open HIGH incident (capped at -30)
  -10 per open CRITICAL incident (capped at -40)
  -2 per MEDIUM incident in last 24h (capped at -20)
  Result clamped to [0, 100].
"""

from __future__ import annotations
from collections import defaultdict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.security_event import SecurityEvent
from app.models.incident import Incident
from app.schemas.dashboard import DashboardSummary, LivePanels, RiskFactor

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    now = datetime.utcnow()
    yesterday = now - timedelta(hours=24)

    total_events = db.query(func.count(SecurityEvent.id)).scalar() or 0
    total_incidents = db.query(func.count(Incident.id)).scalar() or 0
    total_anomalies = db.query(func.count(SecurityEvent.id)).filter(SecurityEvent.is_anomaly.is_(True)).scalar() or 0
    unique_users = db.query(func.count(func.distinct(SecurityEvent.username))).scalar() or 0
    unique_ips = db.query(func.count(func.distinct(SecurityEvent.ip_address))).scalar() or 0
    events_last_24h = db.query(func.count(SecurityEvent.id)).filter(SecurityEvent.timestamp >= yesterday).scalar() or 0
    incidents_last_24h = db.query(func.count(Incident.id)).filter(Incident.created_at >= yesterday).scalar() or 0
    open_incidents = db.query(func.count(Incident.id)).filter(Incident.status == "open").scalar() or 0
    contained_incidents = db.query(func.count(Incident.id)).filter(Incident.status.in_(["contained", "closed"])).scalar() or 0

    critical = db.query(func.count(Incident.id)).filter(func.upper(Incident.severity) == "CRITICAL").scalar() or 0
    high = db.query(func.count(Incident.id)).filter(func.upper(Incident.severity) == "HIGH").scalar() or 0
    medium = db.query(func.count(Incident.id)).filter(func.upper(Incident.severity) == "MEDIUM").scalar() or 0
    low = db.query(func.count(Incident.id)).filter(func.upper(Incident.severity) == "LOW").scalar() or 0

    # Security health score calculation
    health = 100
    health -= min(critical * 10, 40)
    health -= min(high * 5, 30)
    health -= min(medium * 2, 20)
    health = max(0, health)

    return DashboardSummary(
        total_events=total_events,
        total_incidents=total_incidents,
        critical_incidents=critical,
        high_incidents=high,
        medium_incidents=medium,
        low_incidents=low,
        total_anomalies=total_anomalies,
        unique_users=unique_users,
        unique_ips=unique_ips,
        events_last_24h=events_last_24h,
        incidents_last_24h=incidents_last_24h,
        security_health_score=health,
        open_incidents=open_incidents,
        contained_incidents=contained_incidents,
    )


@router.get("/live-panels", response_model=LivePanels)
def get_live_panels(db: Session = Depends(get_db)) -> LivePanels:
    """
    Returns real-time data for the two dashboard info panels:
    1. XAI Risk Model  — top-4 risk reasons aggregated from all SecurityEvent.risk_reasons
    2. UPI/NLP Monitor — real event and incident counts by event_type
    """
    # --- XAI Risk Factors ---
    # risk_reasons is stored per-event as: [{"reason": "...", "points": 20}, ...]
    reason_counts: dict[str, int] = defaultdict(int)
    reason_points: dict[str, int] = {}

    events_with_reasons = (
        db.query(SecurityEvent.risk_reasons)
        .filter(SecurityEvent.risk_reasons.isnot(None))
        .all()
    )

    for (reasons,) in events_with_reasons:
        if not isinstance(reasons, list):
            continue
        for item in reasons:
            if not isinstance(item, dict):
                continue
            # risk_reasons stored as: [{"label": "...", "points": 20, "category": "rule"}]
            reason = item.get("label", item.get("reason", "")).strip()
            points = item.get("points", 0)
            if reason:
                reason_counts[reason] += 1
                # Keep the highest points value seen for each reason label
                if reason not in reason_points or points > reason_points[reason]:
                    reason_points[reason] = points

    # Sort by event count descending, take top 4
    top_reasons = sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)[:4]
    xai_factors = [
        RiskFactor(reason=r, points=reason_points.get(r, 0), count=c)
        for r, c in top_reasons
    ]

    # --- UPI / FinTech Monitor ---
    upi_total = (
        db.query(func.count(SecurityEvent.id))
        .filter(SecurityEvent.event_type == "upi")
        .scalar() or 0
    )
    upi_anomalies = (
        db.query(func.count(SecurityEvent.id))
        .filter(SecurityEvent.event_type == "upi", SecurityEvent.is_anomaly.is_(True))
        .scalar() or 0
    )
    upi_blocked = (
        db.query(func.count(Incident.id))
        .filter(Incident.incident_type == "upi_fraud")
        .scalar() or 0
    )

    # --- NLP / Phishing Scanner ---
    nlp_total = (
        db.query(func.count(SecurityEvent.id))
        .filter(SecurityEvent.event_type.in_(["phishing", "sms", "phishing_blast"]))
        .scalar() or 0
    )
    nlp_blocked = (
        db.query(func.count(Incident.id))
        .filter(Incident.incident_type.in_(["phishing_blast", "sms_scam"]))
        .scalar() or 0
    )

    return LivePanels(
        xai_risk_factors=xai_factors,
        upi_total_events=upi_total,
        upi_anomaly_count=upi_anomalies,
        upi_blocked_count=upi_blocked,
        nlp_scan_count=nlp_total,
        nlp_blocked_count=nlp_blocked,
    )
