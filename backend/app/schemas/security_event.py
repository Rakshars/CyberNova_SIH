"""
schemas/security_event.py
--------------------------
Pydantic schemas for SecurityEvent API input/output.

Pydantic validates incoming JSON and serializes outgoing responses.
It is completely separate from the SQLAlchemy ORM model.
"""

from __future__ import annotations
from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class SecurityEventCreate(BaseModel):
    """Schema for POST /api/events — ingest a new security event."""
    event_type: str = "auth"
    timestamp: datetime
    username: str
    ip_address: Optional[str] = None
    country: Optional[str] = None
    device: Optional[str] = None
    browser: Optional[str] = None
    login_status: Optional[str] = None
    raw_payload: dict[str, Any] = Field(default_factory=dict)


class RiskReason(BaseModel):
    label: str
    points: int
    category: str  # "rule" or "ml"


class SecurityEventResponse(BaseModel):
    """Schema for GET /api/events response."""
    id: str
    event_type: str
    timestamp: datetime
    username: str
    ip_address: Optional[str]
    country: Optional[str]
    device: Optional[str]
    browser: Optional[str]
    login_status: Optional[str]
    is_night: bool
    unusual_country: bool
    unusual_device: bool
    ip_recent_failures: int
    ml_anomaly_score: float
    is_anomaly: bool
    risk_score: int
    risk_level: str
    risk_reasons: list[RiskReason]
    incident_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class SecurityEventListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[SecurityEventResponse]
