"""
api/users.py
-------------
GET /api/users          — list users with risk scores
GET /api/users/{username} — user detail with risk history
"""

from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["Users"])


class UserResponse(BaseModel):
    id: str
    username: str
    department: Optional[str]
    email: Optional[str]
    baseline_country: Optional[str]
    baseline_device: Optional[str]
    risk_score: float
    risk_level: str
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)) -> list[UserResponse]:
    users = db.query(User).order_by(desc(User.risk_score)).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/{username}", response_model=UserResponse)
def get_user(username: str, db: Session = Depends(get_db)) -> UserResponse:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    return UserResponse.model_validate(user)
