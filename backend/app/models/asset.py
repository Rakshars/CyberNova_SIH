"""models/asset.py — Tracked endpoints and servers."""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    hostname: Mapped[str] = mapped_column(String(200), nullable=True)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=True)
    asset_type: Mapped[str] = mapped_column(String(50), default="laptop")   # laptop | server | mobile | network
    owner_username: Mapped[str] = mapped_column(String(100), ForeignKey("users.username"), nullable=True)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(30), default="normal")       # normal | suspicious | compromised | isolated

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
