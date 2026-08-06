"""models/response_action.py — Simulated response actions taken on incidents."""

import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ResponseAction(Base):
    __tablename__ = "response_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id: Mapped[str] = mapped_column(String(36), ForeignKey("incidents.id"), nullable=False)

    # What type of action
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)  # block_ip | disable_account | isolate_device | etc.
    target: Mapped[str] = mapped_column(String(200), nullable=True)       # IP, username, or device name
    status: Mapped[str] = mapped_column(String(30), default="simulated")  # simulated | pending | executed
    triggered_by: Mapped[str] = mapped_column(String(100), default="auto")  # auto | analyst username
    reason: Mapped[str] = mapped_column(Text, nullable=True)

    executed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationship
    incident: Mapped["Incident"] = relationship("Incident", back_populates="response_actions")  # type: ignore
