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


def seed_soar_policies(db: Session) -> None:
    """Seed default SOAR policies if the table is empty."""
    from app.models.soar_policy import SOARPolicy
    try:
        count = db.query(SOARPolicy).count()
        if count > 0:
            logger.info("SOAR policies table already seeded.")
            return

        logger.info("Seeding default SOAR policies...")
        default_rules = [
            SOARPolicy(
                id="policy-001",
                name="Critical Threat Auto-Containment",
                condition_type="risk_threshold",
                threshold=80,
                target_event=None,
                target_severity=None,
                action_type="block_user_and_ip",
                description="If threat risk score >= 80, automatically block the target IP address and suspend the user's active session across the network to isolate the threat.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-002",
                name="Credential Brute Force Containment",
                condition_type="event_type",
                threshold=None,
                target_event="FAILED_LOGIN_BURST",
                target_severity=None,
                action_type="rate_limit_ip",
                description="If rapid failed login attempts (burst) are detected, apply adaptive IP-based rate-limiting, prompt for Captcha, and force MFA.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-003",
                name="UPI & FinTech Anomaly Freeze",
                condition_type="event_type",
                threshold=None,
                target_event="UPI_ANOMALY",
                target_severity=None,
                action_type="freeze_upi_vpa",
                description="If unusual high-frequency micro-debits or virtual payment address (VPA) spoofing is detected, temporarily freeze transaction channels and flag the target accounts.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-004",
                name="Incident Escalation to Telegram",
                condition_type="severity",
                threshold=None,
                target_event=None,
                target_severity="HIGH",
                action_type="notify_soc_telegram",
                description="If the incident severity is CRITICAL or HIGH, immediately forward the full diagnostic payload and alert details to the security operations center's Telegram channel.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-005",
                name="Phishing Scam Domain Quarantine",
                condition_type="event_type",
                threshold=None,
                target_event="PHISHING_STORM",
                target_severity=None,
                action_type="quarantine_phishing_domain",
                description="If a phishing storm or mass SMS scam is detected, immediately quarantine the phishing domain at the DNS resolver level and block the associated SMS gateway.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-006",
                name="Executive Account Lockdown",
                condition_type="event_type",
                threshold=None,
                target_event="DEEPFAKE_WIRE_FRAUD",
                target_severity=None,
                action_type="mfa_lockdown",
                description="If a deepfake voice or video manipulation wire transfer attempt is flagged, place executive credentials in restricted mode and hold transaction execution pending manual SOC review.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-007",
                name="Malware C2 Server Isolation",
                condition_type="event_type",
                threshold=None,
                target_event="MALWARE_BEACON",
                target_severity=None,
                action_type="isolate_device",
                description="If local malware traffic or command and control beaconing is detected, isolate the host machine from the internal network.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-008",
                name="Data Exfiltration Prevention",
                condition_type="event_type",
                threshold=None,
                target_event="DATA_EXFILTRATION",
                target_severity=None,
                action_type="block_data_transfer",
                description="If bulk data exfiltration or massive files transfers from confidential network segments are flagged, automatically terminate the active session and revoke API keys.",
                enabled=True,
                auto_execute=True
            )
        ]
        db.bulk_save_objects(default_rules)
        db.commit()
        logger.info("Successfully seeded %d SOAR policies.", len(default_rules))
    except Exception as e:
        logger.error(f"Error seeding SOAR policies: {e}")


def seed_if_empty(db: Session) -> None:
    """Seed database with synthetic events and default SOAR policies."""
    # Always seed policies first if empty
    seed_soar_policies(db)

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
