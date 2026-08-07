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

# Preset default SOAR policies
DEFAULT_POLICIES = [
    {
        "id": "policy-001",
        "name": "Critical Threat Auto-Containment",
        "condition_type": "risk_threshold",
        "threshold": 80,
        "action_type": "block_user_and_ip",
        "description": "If threat risk score >= 80, automatically block the target IP and suspend user session across network.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-002",
        "name": "Credential Brute Force Containment",
        "condition_type": "event_type",
        "target_event": "FAILED_LOGIN_BURST",
        "action_type": "rate_limit_ip",
        "description": "If rapid failed login burst is detected, apply adaptive IP rate-limiting and require MFA.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-003",
        "name": "UPI & FinTech Anomaly Freeze",
        "condition_type": "event_type",
        "target_event": "UPI_ANOMALY",
        "action_type": "freeze_upi_vpa",
        "description": "If unusual high-frequency micro-debits or VPA spoofing detected, place temporary hold on transaction channel.",
        "enabled": True,
        "auto_execute": True
    },
    {
        "id": "policy-004",
        "name": "Repeated Incident Escalation",
        "condition_type": "severity",
        "target_severity": "HIGH",
        "action_type": "notify_soc_telegram",
        "description": "If incident severity is HIGH or CRITICAL, send instant alert payload to SOC Webhook / Telegram.",
        "enabled": True,
        "auto_execute": True
    }
]

class SOARPolicyEngine:
    def __init__(self):
        self.policies = list(DEFAULT_POLICIES)
        self.execution_logs: List[Dict[str, Any]] = []

    def get_policies(self) -> List[Dict[str, Any]]:
        return self.policies

    def add_policy(self, name: str, condition_type: str, threshold: Optional[int], action_type: str, description: str) -> Dict[str, Any]:
        policy = {
            "id": f"policy-{str(uuid.uuid4())[:6]}",
            "name": name,
            "condition_type": condition_type,
            "threshold": threshold,
            "action_type": action_type,
            "description": description,
            "enabled": True,
            "auto_execute": True
        }
        self.policies.append(policy)
        return policy

    def toggle_policy(self, policy_id: str, enabled: bool) -> Optional[Dict[str, Any]]:
        for p in self.policies:
            if p["id"] == policy_id:
                p["enabled"] = enabled
                return p
        return None

    def evaluate_incident(self, incident: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Evaluates an incident against enabled policies and returns triggered actions.
        """
        triggered_actions = []
        risk_score = incident.get("risk_score", 0)
        event_type = incident.get("event_type", "")
        severity = incident.get("severity", "LOW")

        for p in self.policies:
            if not p.get("enabled"):
                continue

            should_trigger = False
            cond = p.get("condition_type")

            if cond == "risk_threshold" and risk_score >= p.get("threshold", 100):
                should_trigger = True
            elif cond == "event_type" and p.get("target_event") in event_type:
                should_trigger = True
            elif cond == "severity" and p.get("target_severity") == severity:
                should_trigger = True

            if should_trigger:
                action = {
                    "id": str(uuid.uuid4()),
                    "policy_id": p["id"],
                    "policy_name": p["name"],
                    "action_type": p["action_type"],
                    "target": incident.get("target_user") or incident.get("ip_address") or "System Asset",
                    "status": "executed" if p.get("auto_execute") else "pending",
                    "triggered_by": "Autonomous SOAR Engine",
                    "reason": f"Triggered by policy '{p['name']}': Risk Score {risk_score}, Event '{event_type}'",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                triggered_actions.append(action)
                self.execution_logs.insert(0, action)

        return triggered_actions

policy_engine = SOARPolicyEngine()
