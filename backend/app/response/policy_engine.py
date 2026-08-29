"""
response/policy_engine.py
-------------------------
SOAR Policy & Autonomous Decision Engine.
Evaluates threat parameters (risk score, event type, attack frequency)
and determines automatic mitigation playbook actions (Block IP, Disable User, 2FA Trigger, Escalate).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import logging
from sqlalchemy.orm import Session
from app.models.soar_policy import SOARPolicy
from app.models.response_action import ResponseAction

logger = logging.getLogger(__name__)

# Preset default SOAR policies (used as fallback or for reference)
DEFAULT_POLICIES = [
    {
        "id": "policy-001",
        "name": "Critical Threat Auto-Containment",
        "condition_type": "risk_threshold",
        "threshold": 80,
        "action_type": "block_user_and_ip",
        "description": "If threat risk score >= 80, automatically block the target IP address and suspend the user's active session across the network to isolate the threat.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-002",
        "name": "Credential Brute Force Containment",
        "condition_type": "event_type",
        "target_event": "FAILED_LOGIN_BURST",
        "action_type": "rate_limit_ip",
        "description": "If rapid failed login attempts (burst) are detected, apply adaptive IP-based rate-limiting, prompt for Captcha, and force MFA.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-003",
        "name": "UPI & FinTech Anomaly Freeze",
        "condition_type": "event_type",
        "target_event": "UPI_ANOMALY",
        "action_type": "freeze_upi_vpa",
        "description": "If unusual high-frequency micro-debits or virtual payment address (VPA) spoofing is detected, temporarily freeze transaction channels and flag the target accounts.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-004",
        "name": "Incident Escalation to Telegram",
        "condition_type": "severity",
        "target_severity": "HIGH",
        "action_type": "notify_soc_telegram",
        "description": "If the incident severity is CRITICAL or HIGH, immediately forward the full diagnostic payload and alert details to the security operations center's Telegram channel.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-005",
        "name": "Phishing Scam Domain Quarantine",
        "condition_type": "event_type",
        "target_event": "PHISHING_STORM",
        "action_type": "quarantine_phishing_domain",
        "description": "If a phishing storm or mass SMS scam is detected, immediately quarantine the phishing domain at the DNS resolver level and block the associated SMS gateway.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-006",
        "name": "Executive Account Lockdown",
        "condition_type": "event_type",
        "target_event": "DEEPFAKE_WIRE_FRAUD",
        "action_type": "mfa_lockdown",
        "description": "If a deepfake voice or video manipulation wire transfer attempt is flagged, place executive credentials in restricted mode and hold transaction execution pending manual SOC review.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-007",
        "name": "Malware C2 Server Isolation",
        "condition_type": "event_type",
        "target_event": "MALWARE_BEACON",
        "action_type": "isolate_device",
        "description": "If local malware traffic or command and control beaconing is detected, isolate the host machine from the internal network.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-008",
        "name": "Data Exfiltration Prevention",
        "condition_type": "event_type",
        "target_event": "DATA_EXFILTRATION",
        "action_type": "block_data_transfer",
        "description": "If bulk data exfiltration or massive files transfers from confidential network segments are flagged, automatically terminate the active session and revoke API keys.",
        "enabled": True,
        "auto_execute": True
    }
]

class SOARPolicyEngine:
    def __init__(self):
        # Keeps in-memory temporary execution logs for non-DB fallback simulations
        self.temp_execution_logs: List[Dict[str, Any]] = []

    def get_policies(self, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """
        Returns list of SOAR Playbook policies from DB if available, fallback to preset default policies.
        """
        if db is not None:
            try:
                db_pols = db.query(SOARPolicy).all()
                if db_pols:
                    return [
                        {
                            "id": p.id,
                            "name": p.name,
                            "condition_type": p.condition_type,
                            "threshold": p.threshold,
                            "target_event": p.target_event,
                            "target_severity": p.target_severity,
                            "action_type": p.action_type,
                            "description": p.description,
                            "enabled": p.enabled,
                            "auto_execute": p.auto_execute
                        }
                        for p in db_pols
                    ]
            except Exception as e:
                logger.error(f"Error fetching SOAR policies from DB: {e}")
        
        return DEFAULT_POLICIES

    def add_policy(self, db: Session, name: str, condition_type: str, threshold: Optional[int], action_type: str, description: str) -> Dict[str, Any]:
        """
        Creates a new autonomous SOAR policy rule in the database.
        """
        # Determine target_event or target_severity default values based on action/condition
        target_event = None
        target_severity = None
        if condition_type == "event_type":
            if action_type == "rate_limit_ip":
                target_event = "FAILED_LOGIN_BURST"
            elif action_type == "freeze_upi_vpa":
                target_event = "UPI_ANOMALY"
            elif action_type == "quarantine_phishing_domain":
                target_event = "PHISHING_STORM"
            elif action_type == "mfa_lockdown":
                target_event = "DEEPFAKE_WIRE_FRAUD"
            elif action_type == "isolate_device":
                target_event = "MALWARE_BEACON"
            elif action_type == "block_data_transfer":
                target_event = "DATA_EXFILTRATION"
            else:
                target_event = "SECURITY_ANOMALY"
        elif condition_type == "severity":
            target_severity = "CRITICAL" if "critical" in description.lower() or "critical" in name.lower() else "HIGH"

        policy = SOARPolicy(
            id=f"policy-{str(uuid.uuid4())[:6]}",
            name=name,
            condition_type=condition_type,
            threshold=threshold,
            target_event=target_event,
            target_severity=target_severity,
            action_type=action_type,
            description=description,
            enabled=True,
            auto_execute=True
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
        
        return {
            "id": policy.id,
            "name": policy.name,
            "condition_type": policy.condition_type,
            "threshold": policy.threshold,
            "target_event": policy.target_event,
            "target_severity": policy.target_severity,
            "action_type": policy.action_type,
            "description": policy.description,
            "enabled": policy.enabled,
            "auto_execute": policy.auto_execute
        }

    def toggle_policy(self, db: Session, policy_id: str, enabled: bool) -> Optional[Dict[str, Any]]:
        """
        Toggles policy enabled/disabled state in the database.
        """
        policy = db.query(SOARPolicy).filter(SOARPolicy.id == policy_id).first()
        if not policy:
            return None
        policy.enabled = enabled
        db.commit()
        db.refresh(policy)
        return {
            "id": policy.id,
            "name": policy.name,
            "condition_type": policy.condition_type,
            "threshold": policy.threshold,
            "action_type": policy.action_type,
            "description": policy.description,
            "enabled": policy.enabled,
            "auto_execute": policy.auto_execute
        }

    def delete_policy(self, db: Session, policy_id: str) -> bool:
        """
        Deletes a SOAR policy rule from the database.
        """
        policy = db.query(SOARPolicy).filter(SOARPolicy.id == policy_id).first()
        if not policy:
            return False
        db.delete(policy)
        db.commit()
        return True

    def get_execution_logs(self, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        """
        Returns execution logs. Fetches ResponseAction objects from DB if available, fallback to temp logs.
        """
        if db is not None:
            try:
                actions = db.query(ResponseAction).order_by(ResponseAction.executed_at.desc()).all()
                return [
                    {
                        "id": act.id,
                        "timestamp": act.executed_at.isoformat() + "Z",
                        "policy_name": act.policy_name or "Custom Remediation Policy",
                        "target": act.target or "System Asset",
                        "action_type": act.action_type,
                        "status": act.status,
                        "reason": act.reason
                    }
                    for act in actions
                ]
            except Exception as e:
                logger.error(f"Error fetching response actions from DB: {e}")
        
        return self.temp_execution_logs

    def evaluate_incident(self, incident: Dict[str, Any], db: Optional[Session] = None, incident_id: Optional[str] = None, commit: bool = True) -> List[Dict[str, Any]]:
        """
        Evaluates an incident against enabled policies and returns triggered actions.
        Saves actions into ResponseAction table if db is provided and commit is True.
        """
        triggered_actions = []
        risk_score = incident.get("risk_score", 0)
        event_type = incident.get("event_type", "")
        severity = incident.get("severity", "LOW").upper()

        # Load policies
        policies = []
        if db is not None:
            try:
                policies = db.query(SOARPolicy).all()
            except Exception as e:
                logger.error(f"Error loading policies from DB: {e}")
        
        if not policies:
            # Fallback to local preset policies
            policies = []
            for p in DEFAULT_POLICIES:
                policies.append(SOARPolicy(
                    id=p["id"],
                    name=p["name"],
                    condition_type=p["condition_type"],
                    threshold=p.get("threshold"),
                    target_event=p.get("target_event"),
                    target_severity=p.get("target_severity"),
                    action_type=p["action_type"],
                    description=p["description"],
                    enabled=p["enabled"],
                    auto_execute=p["auto_execute"]
                ))

        matched_policies = []
        for p in policies:
            if not p.enabled:
                continue

            should_trigger = False
            cond = p.condition_type

            if cond == "risk_threshold" and risk_score >= (p.threshold or 80):
                should_trigger = True
            elif cond == "event_type" and p.target_event and p.target_event in event_type:
                should_trigger = True
            elif cond == "severity" and p.target_severity:
                severity_ranks = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
                p_rank = severity_ranks.get(p.target_severity.upper(), 0)
                i_rank = severity_ranks.get(severity.upper(), 0)
                if i_rank >= p_rank and p_rank > 0:
                    should_trigger = True

            if should_trigger:
                matched_policies.append(p)

        # AI second opinion: evaluate matched policies concurrently in parallel
        from concurrent.futures import ThreadPoolExecutor, as_completed
        def run_ai_triage(p):
            try:
                from app.response.ai_decision_engine import decide_action
                return p.id, decide_action(
                    incident,
                    {"name": p.name, "action_type": p.action_type, "description": p.description},
                )
            except Exception as ex:
                logger.error(f"AI decision layer error for policy {p.name}: {ex}")
                return p.id, None

        ai_decisions = {}
        if matched_policies:
            with ThreadPoolExecutor(max_workers=min(len(matched_policies), 4)) as executor:
                future_map = {executor.submit(run_ai_triage, p): p for p in matched_policies}
                for future in as_completed(future_map):
                    try:
                        pid, dec = future.result(timeout=3.5)
                        ai_decisions[pid] = dec
                    except Exception as ex:
                        logger.error(f"AI triage execution timed out or failed: {ex}")

        for p in matched_policies:
            action_id = str(uuid.uuid4())
            target_val = incident.get("target_user") or incident.get("ip_address") or "System Asset"
            status_val = "executed" if p.auto_execute else "pending"
            reason_val = f"Triggered by policy '{p.name}': Risk Score {risk_score}, Event '{event_type}'"
            now_str = datetime.utcnow().isoformat() + "Z"

            ai_decision = ai_decisions.get(p.id)
            if ai_decision is not None:
                if ai_decision.decision == "suppress":
                    status_val = "suppressed"
                elif ai_decision.decision == "escalate":
                    status_val = "pending"
                else:
                    status_val = "executed" if p.auto_execute else "pending"
                reason_val = (
                    f"{reason_val}. AI triage (confidence {ai_decision.confidence:.0%}): {ai_decision.reasoning}"
                )

            action = {
                "id": action_id,
                "policy_id": p.id,
                "policy_name": p.name,
                "action_type": p.action_type,
                "target": target_val,
                "status": status_val,
                "triggered_by": "Autonomous SOAR Engine",
                "reason": reason_val,
                "timestamp": now_str
            }
            triggered_actions.append(action)

            # Persist to DB if requested and session is provided
            if db is not None and commit:
                try:
                    # Ensure we have an incident DB record to link to
                    db_inc_id = incident_id or incident.get("id")
                    if db_inc_id:
                        # Verify if the incident exists in the DB before inserting
                        from app.models.incident import Incident as DBIncident
                        inc_exists = db.query(DBIncident).filter(DBIncident.id == db_inc_id).first() is not None
                        
                        if inc_exists:
                            db_action = ResponseAction(
                                id=action_id,
                                incident_id=db_inc_id,
                                action_type=p.action_type,
                                target=target_val,
                                status=status_val,
                                triggered_by="Autonomous SOAR Engine",
                                reason=reason_val,
                                policy_name=p.name,
                                executed_at=datetime.utcnow()
                            )
                            db.add(db_action)
                            db.flush()
                            logger.info(f"Persisted ResponseAction '{p.action_type}' for incident {db_inc_id} to DB.")
                        else:
                            logger.warning(f"Could not save ResponseAction to DB: incident '{db_inc_id}' not found in DB.")
                    else:
                        logger.warning("Could not save ResponseAction to DB: incident_id is missing.")
                except Exception as ex:
                    logger.error(f"Error saving ResponseAction in evaluate_incident: {ex}")
            else:
                # In-memory logging fallback for simulation/test-trigger runs
                self.temp_execution_logs.insert(0, action)

        return triggered_actions

policy_engine = SOARPolicyEngine()
