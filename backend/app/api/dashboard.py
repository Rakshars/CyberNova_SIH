"""
api/dashboard.py
-----------------
GET /api/dashboard/summary — returns all top-level metrics for the overview page.

Security Health Score formula (documented, not arbitrary):
  Start at 100.
  -5 per open HIGH incident (capped at -30)
  -10 per open CRITICAL incident (capped at -40)
  -2 per MEDIUM incident in last 24h (capped at -20)
  Result clamped to [0, 100].
"""

from __future__ import annotations
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.security_event import SecurityEvent
from app.models.incident import Incident
from app.schemas.dashboard import DashboardSummary

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

    critical = db.query(func.count(Incident.id)).filter(Incident.severity == "critical").scalar() or 0
    high = db.query(func.count(Incident.id)).filter(Incident.severity == "high").scalar() or 0
    medium = db.query(func.count(Incident.id)).filter(Incident.severity == "medium").scalar() or 0
    low = db.query(func.count(Incident.id)).filter(Incident.severity == "low").scalar() or 0

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
