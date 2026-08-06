"""
risk/risk_engine.py
--------------------
Adapted from src/risk_engine.py in the original prototype.

WHAT CHANGED:
- Now scores a single event dict (not a DataFrame row)
- Returns a structured dict with score, level, and full reason breakdown
- Each reason includes points, label, and category (ml / rule)
- Type hints added

WHAT IS PRESERVED:
- All rule weights are identical to the original
- Classification thresholds are identical (20/40/70)
- The core "explainability first" design: every point is traceable

WHY HYBRID SCORING:
  Rules catch well-defined known patterns (brute force, night login).
  ML catches unknown combinations that don't match any single rule.
  Together they have better coverage than either alone.
"""

from __future__ import annotations
from typing import Any


RULES: list[dict[str, Any]] = [
    {"field": "failed_login",         "threshold": 1,  "operator": "eq",  "points": 20, "label": "Failed login attempt",                          "category": "rule"},
    {"field": "unusual_country",      "threshold": 1,  "operator": "eq",  "points": 30, "label": "Login from unusual country for this user",       "category": "rule"},
    {"field": "is_night",             "threshold": 1,  "operator": "eq",  "points": 15, "label": "Login during off-hours (12AM–4AM)",              "category": "rule"},
    {"field": "unusual_device",       "threshold": 1,  "operator": "eq",  "points": 10, "label": "Login from unfamiliar device",                   "category": "rule"},
    {"field": "ip_recent_failures",   "threshold": 5,  "operator": "gte", "points": 25, "label": "Repeated failures from same IP (possible brute force)", "category": "rule"},
    {"field": "is_anomaly",           "threshold": 1,  "operator": "eq",  "points": 25, "label": "Flagged as anomaly by Isolation Forest",         "category": "ml"},
]

THRESHOLDS = {
    "critical": 70,
    "high": 40,
    "medium": 20,
    "low": 0,
}


def _matches(value: Any, operator: str, threshold: Any) -> bool:
    if operator == "eq":
        return int(value) == int(threshold)
    if operator == "gte":
        return float(value) >= float(threshold)
    if operator == "gt":
        return float(value) > float(threshold)
    return False


def classify_risk(score: int) -> str:
    if score >= THRESHOLDS["critical"]:
        return "Critical"
    elif score >= THRESHOLDS["high"]:
        return "High"
    elif score >= THRESHOLDS["medium"]:
        return "Medium"
    return "Low"


def compute_risk_score(event: dict) -> dict:
    """
    Score a single event dict and return it with risk fields added.

    Added fields:
        risk_score      int  (0-100)
        risk_level      str  (Low | Medium | High | Critical)
        risk_reasons    list of dicts [{label, points, category}]

    Example:
        event = {"failed_login": 1, "unusual_country": 1, "is_anomaly": 0, ...}
        result = compute_risk_score(event)
        # result["risk_score"] = 50
        # result["risk_level"] = "High"
        # result["risk_reasons"] = [
        #     {"label": "Failed login attempt", "points": 20, "category": "rule"},
        #     {"label": "Login from unusual country ...", "points": 30, "category": "rule"},
        # ]
    """
    score = 0
    reasons: list[dict] = []

    for rule in RULES:
        field_val = event.get(rule["field"], 0)
        if _matches(field_val, rule["operator"], rule["threshold"]):
            score += rule["points"]
            reasons.append({
                "label": rule["label"],
                "points": rule["points"],
                "category": rule["category"],
            })

    score = min(score, 100)
    event["risk_score"] = score
    event["risk_level"] = classify_risk(score)
    event["risk_reasons"] = reasons
    return event


def score_dataframe(df) -> "pd.DataFrame":  # type: ignore[name-defined]
    """
    Convenience wrapper to score every row in a DataFrame.
    Returns df with risk_score, risk_level, risk_reasons_text columns added.
    """
    import pandas as pd

    results = [compute_risk_score(row.to_dict()) for _, row in df.iterrows()]
    result_df = pd.DataFrame(results)
    result_df["risk_reasons_text"] = result_df["risk_reasons"].apply(
        lambda r: "; ".join(f"{x['label']} (+{x['points']})" for x in r) if r else "No risk factors"
    )
    return result_df
