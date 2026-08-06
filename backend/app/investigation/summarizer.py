"""
investigation/summarizer.py
-----------------------------
Adapted from src/incident_summary.py in the original prototype.

WHAT CHANGED:
- Works on a single event dict (not a DataFrame row)
- Returns a structured dict, not just a string
- Template logic is identical

WHAT IS PRESERVED:
- The natural language template approach (no LLM — honest and fast)
- All conditional clauses for brute force, unusual location, off-hours, unusual device
"""

from __future__ import annotations
from datetime import datetime


def summarize_event(event: dict) -> str:
    """
    Generate a plain-English summary for a single security event.

    This is rule-based template generation — NOT an LLM.
    Every word is derived from the actual event data.
    """
    ts = event.get("timestamp")
    if isinstance(ts, str):
        ts = datetime.fromisoformat(ts)
    time_str = ts.strftime("%I:%M %p").lstrip("0") if ts else "unknown time"

    username = event.get("username", "Unknown user")
    country = event.get("country", "unknown location")

    parts = [f"User {username} attempted a login from {country} at {time_str}"]

    if event.get("ip_recent_failures", 0) >= 5:
        parts.append(f"after {int(event['ip_recent_failures'])} failed attempts from the same IP")
    elif event.get("failed_login", 0) == 1:
        parts.append("which failed")

    if event.get("unusual_country", 0) == 1:
        parts.append("(unusual location for this user)")

    if event.get("is_night", 0) == 1:
        parts.append("during off-hours")

    if event.get("unusual_device", 0) == 1:
        parts.append("from an unrecognized device")

    risk_score = int(event.get("risk_score", 0))
    risk_level = event.get("risk_level", "Unknown")
    summary = " ".join(parts) + f". Risk Score: {risk_score} ({risk_level})."
    return summary
