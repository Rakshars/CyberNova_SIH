"""
tests/test_risk_engine.py
--------------------------
Unit tests for the risk engine.
These verify that rule weights, classification thresholds,
and explainability output are all correct.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.risk.risk_engine import compute_risk_score, classify_risk


def make_event(**kwargs) -> dict:
    base = {
        "failed_login": 0,
        "unusual_country": 0,
        "is_night": 0,
        "unusual_device": 0,
        "ip_recent_failures": 0,
        "is_anomaly": 0,
    }
    base.update(kwargs)
    return base


def test_clean_event_has_zero_risk():
    event = make_event()
    result = compute_risk_score(event)
    assert result["risk_score"] == 0
    assert result["risk_level"] == "Low"
    assert result["risk_reasons"] == []


def test_failed_login_adds_20():
    event = make_event(failed_login=1)
    result = compute_risk_score(event)
    assert result["risk_score"] == 20
    assert result["risk_level"] == "Medium"
    assert any(r["points"] == 20 for r in result["risk_reasons"])


def test_unusual_country_adds_30():
    event = make_event(unusual_country=1)
    result = compute_risk_score(event)
    assert result["risk_score"] == 30
    # Score 30 is in the Medium band (20-39); High starts at 40
    assert result["risk_level"] == "Medium"


def test_brute_force_threshold():
    # 4 failures → no brute force flag
    event = make_event(ip_recent_failures=4)
    result = compute_risk_score(event)
    assert not any("brute" in r["label"].lower() for r in result["risk_reasons"])

    # 5 failures → brute force flag (+25)
    event = make_event(ip_recent_failures=5)
    result = compute_risk_score(event)
    assert any("brute" in r["label"].lower() for r in result["risk_reasons"])
    assert result["risk_score"] == 25


def test_score_capped_at_100():
    # All flags simultaneously would exceed 100 (20+30+15+10+25+25 = 125)
    event = make_event(
        failed_login=1,
        unusual_country=1,
        is_night=1,
        unusual_device=1,
        ip_recent_failures=5,
        is_anomaly=1,
    )
    result = compute_risk_score(event)
    assert result["risk_score"] == 100
    assert result["risk_level"] == "Critical"


def test_classify_risk_thresholds():
    assert classify_risk(0) == "Low"
    assert classify_risk(19) == "Low"
    assert classify_risk(20) == "Medium"
    assert classify_risk(39) == "Medium"
    assert classify_risk(40) == "High"
    assert classify_risk(69) == "High"
    assert classify_risk(70) == "Critical"
    assert classify_risk(100) == "Critical"


def test_ml_anomaly_flag_adds_25():
    event = make_event(is_anomaly=1)
    result = compute_risk_score(event)
    assert result["risk_score"] == 25
    ml_reasons = [r for r in result["risk_reasons"] if r["category"] == "ml"]
    assert len(ml_reasons) == 1


def test_reasons_are_structured():
    event = make_event(failed_login=1, unusual_country=1)
    result = compute_risk_score(event)
    for reason in result["risk_reasons"]:
        assert "label" in reason
        assert "points" in reason
        assert "category" in reason
