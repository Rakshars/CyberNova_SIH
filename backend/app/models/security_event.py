"""
models/security_event.py
--------------------------
Represents a single normalized security event.

In Phase 1 this is login events only.
The 'event_type' column is designed to support future event types:
  auth, network, process, file, usb, email
without changing the schema.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type: Mapped[str] = mapped_column(String(50), default="auth")   # auth | network | process | file | usb

    # Raw event fields
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=True)
    device: Mapped[str] = mapped_column(String(100), nullable=True)
    browser: Mapped[str] = mapped_column(String(100), nullable=True)
    login_status: Mapped[str] = mapped_column(String(20), nullable=True)  # Success | Failed

    # Engineered features (from feature_engineering.py)
    hour: Mapped[int] = mapped_column(Integer, nullable=True)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=True)
    is_night: Mapped[bool] = mapped_column(Boolean, default=False)
    failed_login: Mapped[bool] = mapped_column(Boolean, default=False)
    unusual_country: Mapped[bool] = mapped_column(Boolean, default=False)
    unusual_device: Mapped[bool] = mapped_column(Boolean, default=False)
    ip_recent_failures: Mapped[int] = mapped_column(Integer, default=0)

    # ML output (from anomaly_detector.py)
    ml_anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)

    # Risk output (from risk_engine.py)
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_level: Mapped[str] = mapped_column(String(20), default="Low")
    risk_reasons: Mapped[list] = mapped_column(JSON, default=list)        # [{"reason": "...", "points": 20}]

    # Correlation — FK to incident (set after correlation)
    incident_id: Mapped[str] = mapped_column(String(36), ForeignKey("incidents.id"), nullable=True)

    # Extra fields for extensibility (any event-specific payload)
    raw_payload: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    incident: Mapped["Incident"] = relationship("Incident", back_populates="events")  # type: ignore

    def __repr__(self) -> str:
        return f"<SecurityEvent id={self.id} user={self.username} risk={self.risk_score}>"
