"""
services/pipeline_service.py
------------------------------
The orchestrator — adapted from src/pipeline.py.

In the prototype, pipeline.py was a script that ran once and wrote CSVs.
Here it becomes a callable service used in two ways:

1. BATCH (startup seeding):
   Call run_batch_pipeline() to process all historical events and load them
   into the database. This runs once when the app starts with an empty DB.

2. SINGLE EVENT (real-time, Phase 3):
   Call process_single_event() to score and store one event as it arrives.

The Isolation Forest model is trained on the batch data and saved.
Single-event scoring then loads the saved model — no retraining per event.
"""

from __future__ import annotations
import logging
import uuid
from datetime import datetime

import pandas as pd
from sqlalchemy.orm import Session

from app.detection.feature_engineering import engineer_features_batch, compute_user_baselines, engineer_single_event, FEATURE_COLUMNS
from app.detection.anomaly_detector import get_detector
from app.risk.risk_engine import compute_risk_score, score_dataframe
from app.investigation.summarizer import summarize_event
from app.models.security_event import SecurityEvent
from app.models.incident import Incident
from app.models.user import User

logger = logging.getLogger(__name__)


def run_batch_pipeline(events: list[dict], db: Session) -> dict:
    """
    Process a list of raw event dicts end-to-end:
      Feature Engineering → Anomaly Detection → Risk Scoring → DB Insert

    This replicates the original pipeline.py but writes to the DB instead of CSVs.

    Returns a summary dict with counts.
    """
    if not events:
        return {"total": 0, "anomalies": 0, "high_risk": 0}

    logger.info("Batch pipeline: %d events", len(events))

    # Step 1: Feature engineering (batch — computes baselines from the full dataset)
    df = pd.DataFrame(events)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = engineer_features_batch(df)

    # Step 2: Train or load Isolation Forest, then score
    detector = get_detector()
    detector.load_or_train(df)
    df = detector.predict_batch(df)

    # Step 3: Risk scoring
    df = score_dataframe(df)

    # Step 4: Seed user baselines into the users table
    baselines = compute_user_baselines(df)
    _upsert_users(baselines, df, db)

    # Step 5: Insert scored events into the database
    from app.correlation.correlator import create_incident_from_event
    inserted = 0
    incidents_created = 0
    for _, row in df.iterrows():
        event_dict = row.to_dict()
        db_event = _dict_to_security_event(event_dict)
        db.add(db_event)
        db.flush()
        if (db_event.risk_score or 0) >= 20:
            create_incident_from_event(db_event, db)
            incidents_created += 1
        inserted += 1

    db.commit()

    anomalies = int(df["is_anomaly"].sum())
    high_risk = int((df["risk_score"] >= 40).sum())
    logger.info("Batch complete: %d events, %d anomalies, %d high-risk, %d incidents created", inserted, anomalies, high_risk, incidents_created)
    return {"total": inserted, "anomalies": anomalies, "high_risk": high_risk, "incidents": incidents_created}


def process_single_event(event: dict, db: Session, baselines: dict | None = None) -> SecurityEvent:
    """
    Score and store a single incoming event in real-time.

    baselines: pre-computed user baselines (loaded from DB or cache).
               If None, falls back to defaults (unusual flags will not be reliable).
    """
    if baselines is None:
        baselines = {}

    # Count recent failures from this IP (last 5 minutes) using the DB
    from app.models.security_event import SecurityEvent as SE
    from sqlalchemy import func
    five_min_ago = datetime.fromisoformat(str(event["timestamp"])) if isinstance(event["timestamp"], str) else event["timestamp"]
    recent_failures = (
        db.query(func.count(SE.id))
        .filter(
            SE.ip_address == event.get("ip_address"),
            SE.failed_login.is_(True),
            SE.timestamp >= five_min_ago,
        )
        .scalar()
    ) or 0

    # Feature engineering on the single event
    event = engineer_single_event(event, baselines, recent_failure_count=recent_failures)

    # Anomaly detection
    detector = get_detector()
    if detector.model is None:
        detector.load()
    if detector.model is not None:
        event = detector.predict_single(event)
    else:
        event["ml_anomaly_score"] = 0.0
        event["is_anomaly"] = 0

    # Risk scoring
    event = compute_risk_score(event)

    # Plain-English summary
    event["summary"] = summarize_event(event)

    # Store in DB
    db_event = _dict_to_security_event(event)
    db.add(db_event)
    db.flush()

    # Create incident if high risk
    if (db_event.risk_score or 0) >= 20:
        from app.correlation.correlator import create_incident_from_event
        create_incident_from_event(db_event, db)

    db.commit()
    db.refresh(db_event)

    return db_event


def _dict_to_security_event(d: dict) -> SecurityEvent:
    """Convert a scored event dict to a SecurityEvent ORM object."""
    ts = d.get("timestamp")
    if isinstance(ts, str):
        ts = datetime.fromisoformat(ts)
    elif hasattr(ts, "to_pydatetime"):
        ts = ts.to_pydatetime()

    return SecurityEvent(
        id=str(uuid.uuid4()),
        event_type=d.get("event_type", "auth"),
        timestamp=ts,
        username=str(d.get("username", "")),
        ip_address=str(d.get("ip_address", "")),
        country=str(d.get("country", "")),
        device=str(d.get("device", "")),
        browser=str(d.get("browser", "")),
        login_status=str(d.get("login_status", "")),
        hour=int(d.get("hour", 0)),
        day_of_week=int(d.get("day_of_week", 0)),
        is_night=bool(d.get("is_night", 0)),
        failed_login=bool(d.get("failed_login", 0)),
        unusual_country=bool(d.get("unusual_country", 0)),
        unusual_device=bool(d.get("unusual_device", 0)),
        ip_recent_failures=int(d.get("ip_recent_failures", 0)),
        ml_anomaly_score=float(d.get("ml_anomaly_score", 0.0)),
        is_anomaly=bool(d.get("is_anomaly", 0)),
        risk_score=int(d.get("risk_score", 0)),
        risk_level=str(d.get("risk_level", "Low")),
        risk_reasons=d.get("risk_reasons", []),
        raw_payload={k: str(v) for k, v in d.items() if k not in SecurityEvent.__table__.columns.keys()},
    )


def _upsert_users(baselines: dict, df: pd.DataFrame, db: Session) -> None:
    """Insert or update user records with their behavioral baselines and current risk levels."""
    for username, baseline in baselines.items():
        user_events = df[df["username"] == username]
        if user_events.empty:
            continue
        max_risk = int(user_events["risk_score"].max())
        risk_level = user_events.loc[user_events["risk_score"].idxmax(), "risk_level"]

        existing = db.query(User).filter(User.username == username).first()
        if existing:
            existing.baseline_country = baseline.get("baseline_country")
            existing.baseline_device = baseline.get("baseline_device")
            existing.risk_score = max_risk
            existing.risk_level = str(risk_level)
            existing.updated_at = datetime.utcnow()
        else:
            db.add(User(
                id=str(uuid.uuid4()),
                username=username,
                baseline_country=baseline.get("baseline_country"),
                baseline_device=baseline.get("baseline_device"),
                risk_score=max_risk,
                risk_level=str(risk_level),
            ))
