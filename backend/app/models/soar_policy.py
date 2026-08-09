import uuid
from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class SOARPolicy(Base):
    __tablename__ = "soar_policies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    condition_type: Mapped[str] = mapped_column(String(50), nullable=False)  # risk_threshold, event_type, severity
    threshold: Mapped[int] = mapped_column(Integer, nullable=True)
    target_event: Mapped[str] = mapped_column(String(100), nullable=True)
    target_severity: Mapped[str] = mapped_column(String(50), nullable=True)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_execute: Mapped[bool] = mapped_column(Boolean, default=True)
