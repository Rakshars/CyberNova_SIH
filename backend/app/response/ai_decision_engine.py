"""
response/ai_decision_engine.py
-------------------------------
Gemini-backed second opinion for the SOAR engine.

The rule engine (policy_engine.py) remains the source of truth for WHICH
policy matches an incident, and is exactly what still fires — with its own
static auto_execute flag — the instant this layer is unavailable. This
module only adds judgment on TOP of a matched policy: should it actually
auto-execute, get escalated to a human analyst, or be suppressed as a
likely false positive, plus a plain-English reason an analyst can read.

Fails closed: any missing key, API error, timeout, or malformed response
returns None, and the caller must fall back to the policy's own
auto_execute flag instead of blocking on or trusting a broken AI call.
"""

from __future__ import annotations
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.services.gemini_client import generate_structured


class SOARDecision(BaseModel):
    decision: str = Field(description="One of: auto_execute, escalate, suppress")
    confidence: float = Field(description="Confidence in this decision, 0.0 to 1.0")
    reasoning: str = Field(
        description="One to two sentence justification citing the specific incident facts given"
    )


def decide_action(incident: dict[str, Any], policy: dict[str, Any]) -> Optional[SOARDecision]:
    """
    Ask Gemini how a matched SOAR policy should be handled for this incident.

    `incident` is the same dict evaluate_incident() receives (risk_score,
    event_type, severity, target_user/ip_address, risk_reasons, ...).
    `policy` needs name/action_type/description from the matched policy.
    """
    prompt = f"""You are a SOC (Security Operations Center) triage assistant. A SOAR policy has matched an incoming security incident and is about to fire an automated containment action. Decide whether it should proceed automatically (auto_execute), be escalated to a human analyst for review (escalate), or be suppressed as a likely false positive (suppress).

Incident facts:
- Event type: {incident.get('event_type', 'unknown')}
- Risk score: {incident.get('risk_score', 0)}/100
- Severity: {incident.get('severity', 'unknown')}
- Target user: {incident.get('target_user', 'unknown')}
- Target IP: {incident.get('ip_address', 'unknown')}
- Risk reasons: {incident.get('risk_reasons', [])}

Matched policy: "{policy.get('name')}"
Proposed action: {policy.get('action_type')} — {policy.get('description')}

Respond with your decision, a confidence score, and reasoning that cites the specific facts above. Bias toward auto_execute when risk_score is high and the reasons clearly support the policy's intent; escalate when the picture is ambiguous or the action is highly disruptive (e.g. locking an executive account, isolating a device) but not overwhelmingly justified; suppress only when the facts actively contradict the policy's premise."""

    return generate_structured(prompt, SOARDecision)
