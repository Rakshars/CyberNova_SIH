"""
models/user.py
---------------
Represents an employee / user account tracked by the SOC.
Stores the behavioral baseline, authentication credentials, and current risk state.
"""

import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(200), nullable=True)

    # Behavioral baseline (most common values seen in logs)
    baseline_country: Mapped[str] = mapped_column(String(100), nullable=True)
    baseline_device: Mapped[str] = mapped_column(String(100), nullable=True)

    # Current risk state
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(20), default="Low")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<User {self.username} risk={self.risk_level}>"
