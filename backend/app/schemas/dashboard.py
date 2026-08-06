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
