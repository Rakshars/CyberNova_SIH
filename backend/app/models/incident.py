"""
models/incident.py
-------------------
Represents a correlated security incident — a group of related events
that together form one attack pattern (e.g., brute force followed by
successful login).

This is Phase 4 work, but the model is defined now so the schema
is consistent from day one.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # INC-0001, INC-0002, ...

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    incident_type: Mapped[str] = mapped_column(String(100), nullable=True)  # brute_force, credential_compromise, etc.
    status: Mapped[str] = mapped_column(String(30), default="open")         # open | investigating | contained | closed
    severity: Mapped[str] = mapped_column(String(20), default="medium")     # low | medium | high | critical
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)           # 0.0 to 1.0

    # Affected entities
    affected_username: Mapped[str] = mapped_column(String(100), nullable=True)
    affected_ip: Mapped[str] = mapped_column(String(50), nullable=True)
    affected_device: Mapped[str] = mapped_column(String(100), nullable=True)

    # Time window
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    event_count: Mapped[int] = mapped_column(Integer, default=1)

    # Text content
    summary: Mapped[str] = mapped_column(Text, nullable=True)

    # Structured JSON fields (stored as JSON, queried as Python dicts)
    investigation: Mapped[dict] = mapped_column(JSON, default=dict)          # AI Cyber Detective findings
    mitre_techniques: Mapped[list] = mapped_column(JSON, default=list)       # [{id, name, tactic}]
    similar_incidents: Mapped[list] = mapped_column(JSON, default=list)      # [{id, similarity_score}]
    response_taken: Mapped[list] = mapped_column(JSON, default=list)         # response actions list

    # Analyst feedback
    analyst_verdict: Mapped[str] = mapped_column(String(30), nullable=True)  # true_positive | false_positive
    analyst_notes: Mapped[str] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    events: Mapped[list["SecurityEvent"]] = relationship("SecurityEvent", back_populates="incident")  # type: ignore
    response_actions: Mapped[list["ResponseAction"]] = relationship("ResponseAction", back_populates="incident")  # type: ignore

    def __repr__(self) -> str:
        return f"<Incident {self.incident_id} severity={self.severity} status={self.status}>"
