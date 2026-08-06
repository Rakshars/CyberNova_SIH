"""schemas/incident.py — Pydantic schemas for the Incident API."""

from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class IncidentResponse(BaseModel):
    id: str
    incident_id: str
    title: str
    incident_type: Optional[str]
    status: str
    severity: str
    risk_score: int
    confidence: float
    affected_username: Optional[str]
    affected_ip: Optional[str]
    affected_device: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    event_count: int
    summary: Optional[str]
    mitre_techniques: list[dict[str, Any]]
    investigation: dict[str, Any]
    similar_incidents: list[dict[str, Any]]
    response_taken: list[dict[str, Any]]
    analyst_verdict: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IncidentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[IncidentResponse]


class AnalystFeedback(BaseModel):
    verdict: str   # "true_positive" | "false_positive" | "needs_investigation"
    notes: Optional[str] = None
