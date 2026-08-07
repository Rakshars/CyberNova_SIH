"""
main.py
--------
FastAPI application entry point.

On startup:
1. Creates all database tables
2. Seeds the database if empty (runs the full ML pipeline)
3. Mounts all API routers

Run with:
    uvicorn app.main:app --reload --port 8000
"""

from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_all_tables, SessionLocal
from app.services.seeder import seed_if_empty
from app.api import dashboard, events, incidents, users, multimodal, soar, copilot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup/shutdown lifecycle manager.
    - Creates DB tables on startup
    - Seeds DB with synthetic data if empty
    """
    logger.info("Starting %s...", settings.app_name)

    # Create tables
    create_all_tables()
    logger.info("Database tables verified/created.")

    # Seed if empty
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()

    logger.info("%s ready.", settings.app_name)
    yield
    logger.info("%s shutting down.", settings.app_name)


app = FastAPI(
    title="Autonomous SOC API",
    description="Full-stack AI-powered Security Operations Center",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allows the React frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(dashboard.router)
app.include_router(events.router)
app.include_router(incidents.router)
app.include_router(users.router)
app.include_router(multimodal.router)
app.include_router(soar.router)
app.include_router(copilot.router)


@app.get("/health")
def health_check() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok", "app": settings.app_name}
