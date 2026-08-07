"""
api/users.py
-------------
GET /api/users          — list users with risk scores
GET /api/users/{username} — user detail with risk history
POST /api/users/register — register a new user in the DB with password hashing
POST /api/users/login — authenticate registered user login with password verification
"""

from __future__ import annotations
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/api/users", tags=["Users"])


def hash_password(password: str) -> str:
    """Generates SHA-256 password hash with salt."""
    salt = "cybernova_secure_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies plain password against stored hash."""
    if not hashed_password:
        return True # Default legacy fallback
    return hash_password(plain_password) == hashed_password


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


class UserRegisterRequest(BaseModel):
    username: str
    password: str = "password123"
    email: Optional[str] = None
    department: Optional[str] = "Engineering"
    baseline_country: Optional[str] = "India"
    baseline_device: Optional[str] = "MacBook Pro"


class UserLoginRequest(BaseModel):
    username: str
    password: str = "password123"


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)) -> list[UserResponse]:
    """Returns only users who are registered in the system database."""
    users = db.query(User).order_by(desc(User.risk_score)).all()
    return [UserResponse.model_validate(u) for u in users]


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)) -> UserResponse:
    """Registers a new user in the system database with password hashing."""
    username_clean = req.username.strip().lower()
    if not username_clean:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    if not req.password or len(req.password.strip()) < 3:
        raise HTTPException(status_code=400, detail="Password must be at least 3 characters long")

    existing = db.query(User).filter(User.username == username_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"User '{username_clean}' is already registered.")

    new_user = User(
        username=username_clean,
        password_hash=hash_password(req.password),
        email=req.email or f"{username_clean}@cybernova.io",
        department=req.department or "Engineering",
        baseline_country=req.baseline_country or "India",
        baseline_device=req.baseline_device or "Workstation",
        risk_score=0.0,
        risk_level="Low"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return UserResponse.model_validate(new_user)


@router.post("/login", response_model=UserResponse)
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)) -> UserResponse:
    """Authenticates login for registered users with password verification."""
    username_clean = req.username.strip().lower()
    user = db.query(User).filter(User.username == username_clean).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"User '{req.username}' is not registered. Please register first."
        )

    # Password check
    if user.password_hash and not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Password verification failed."
        )

    return UserResponse.model_validate(user)


@router.get("/{username}", response_model=UserResponse)
def get_user(username: str, db: Session = Depends(get_db)) -> UserResponse:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    return UserResponse.model_validate(user)
