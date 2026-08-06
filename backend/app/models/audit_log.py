"""models/audit_log.py — Immutable audit trail of all significant system actions."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # What happened
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)  # incident_created | response_taken | analyst_feedback | etc.
    entity_type: Mapped[str] = mapped_column(String(50), nullable=True)   # incident | event | user | asset
    entity_id: Mapped[str] = mapped_column(String(36), nullable=True)

    # Who did it (system or analyst)
    actor: Mapped[str] = mapped_column(String(100), default="system")

    # Full context as JSON
    details: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
