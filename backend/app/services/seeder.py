"""
services/seeder.py
-------------------
Seeds the database with synthetic data on first startup.

Run order:
1. Check if DB has any events
2. If empty: generate 30 days of synthetic events
3. Run batch pipeline (feature engineering → ML → risk scoring → DB insert)

This replaces manually running generate_logs.py and pipeline.py.
The server seeds itself automatically.
"""

from __future__ import annotations
import logging
from sqlalchemy.orm import Session
from app.models.security_event import SecurityEvent
from app.simulation.log_generator import generate_dataset
from app.services.pipeline_service import run_batch_pipeline

logger = logging.getLogger(__name__)


def seed_if_empty(db: Session) -> None:
    """Seed database with synthetic events if it's empty."""
    count = db.query(SecurityEvent).count()
    if count > 0:
        logger.info("Database already has %d events. Skipping seed.", count)
        return

    logger.info("Database is empty. Generating synthetic data...")
    events = generate_dataset(
        num_days=30,
        normal_per_day=40,
        suspicious_per_day=3,
        brute_force_events=5,
        seed=42,
    )
    logger.info("Generated %d synthetic events. Running pipeline...", len(events))
    result = run_batch_pipeline(events, db)
    logger.info(
        "Seed complete. total=%d anomalies=%d high_risk=%d",
        result["total"],
        result["anomalies"],
        result["high_risk"],
    )
