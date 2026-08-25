"""schemas/dashboard.py — Pydantic schema for the dashboard summary endpoint."""

from __future__ import annotations
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_events: int
    total_incidents: int
    critical_incidents: int
    high_incidents: int
    medium_incidents: int
    low_incidents: int
    total_anomalies: int
    unique_users: int
    unique_ips: int
    events_last_24h: int
    incidents_last_24h: int
    security_health_score: int   # 0-100 (documented formula in service)
    open_incidents: int
    contained_incidents: int


class RiskFactor(BaseModel):
    reason: str
    points: int
    count: int   # how many events had this risk reason


class LivePanels(BaseModel):
    # XAI Risk Model — top risk reasons aggregated from all events
    xai_risk_factors: list[RiskFactor]

    # UPI / FinTech Threat Monitor
    upi_total_events: int       # events with event_type='upi'
    upi_anomaly_count: int      # upi events flagged as anomaly
    upi_blocked_count: int      # upi anomalies that generated an incident

    # SMS / Phishing NLP scanner
    nlp_scan_count: int         # events with event_type='phishing' or 'sms'
    nlp_blocked_count: int      # nlp events that triggered an incident
