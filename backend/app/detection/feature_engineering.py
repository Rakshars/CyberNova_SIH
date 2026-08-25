"""
detection/feature_engineering.py
----------------------------------
Adapted from src/feature_engineering.py in the original prototype.

WHAT CHANGED:
- Now works on a single event dict (for real-time scoring) AND a DataFrame (for batch)
- User behavioral baselines can be passed in explicitly (not recomputed every call)
- Type hints added throughout
- __main__ block removed (pipeline_service.py handles orchestration now)

WHAT IS PRESERVED:
- All feature logic is identical: is_night, unusual_country, unusual_device,
  ip_recent_failures (rolling 5-min window)
- Per-user baseline computation (mode of country/device)
"""

from __future__ import annotations
import pandas as pd
import numpy as np
from typing import Optional


FEATURE_COLUMNS = [
    "hour",
    "day_of_week",
    "is_night",
    "failed_login",
    "unusual_country",
    "unusual_device",
    "ip_recent_failures",
]


def compute_user_baselines(df: pd.DataFrame) -> dict[str, dict]:
    """
    Compute per-user behavioral baselines from a DataFrame of events.

    Returns a dict: {username: {baseline_country, baseline_device}}

    These baselines can be saved and reused across requests so they don't
    need to be recomputed on every event.
    """
    baselines: dict[str, dict] = {}
    for username, group in df.groupby("username"):
        baselines[str(username)] = {
            "baseline_country": group["country"].mode()[0] if not group["country"].empty else None,
            "baseline_device": group["device"].mode()[0] if not group["device"].empty else None,
        }
    return baselines


def engineer_features_batch(
    df: pd.DataFrame,
    baselines: Optional[dict[str, dict]] = None,
) -> pd.DataFrame:
    """
    Add engineered features to a DataFrame of events.

    If baselines is None, they are computed from the DataFrame itself
    (original prototype behavior — fine for batch runs).

    If baselines is provided (pre-computed), uses those instead,
    which is required for real-time single-event scoring.
    """
    df = df.copy()

    # ---- Time-based features ----
    df["hour"] = pd.to_datetime(df["timestamp"]).dt.hour
    df["day_of_week"] = pd.to_datetime(df["timestamp"]).dt.dayofweek
    df["is_night"] = df["hour"].apply(lambda h: 1 if 0 <= h <= 4 else 0)

    # ---- Login outcome ----
    df["failed_login"] = (df["login_status"] == "Failed").astype(int)

    # ---- Per-user baseline ----
    if baselines is None:
        baselines = compute_user_baselines(df)

    df["baseline_country"] = df["username"].map(
        lambda u: baselines.get(u, {}).get("baseline_country")
    )
    df["baseline_device"] = df["username"].map(
        lambda u: baselines.get(u, {}).get("baseline_device")
    )

    df["unusual_country"] = (df["country"] != df["baseline_country"]).astype(int)
    df["unusual_device"] = (df["device"] != df["baseline_device"]).astype(int)

    # ---- Burst detection (O(n) per IP group using rolling window) ----
    df = df.sort_values("timestamp")
    df["ip_recent_failures"] = 0

    for ip, group in df.groupby("ip_address"):
        idx = group.index
        times = group["timestamp"].values
        fails = group["failed_login"].values
        counts: list[int] = []
        for i in range(len(times)):
            window_start = times[i] - np.timedelta64(5, "m")
            count = int(((times[: i + 1] >= window_start) & (fails[: i + 1] == 1)).sum())
            counts.append(count)
        df.loc[idx, "ip_recent_failures"] = counts

    df = df.sort_index()
    return df


def engineer_single_event(
    event: dict,
    baselines: dict[str, dict],
    recent_failure_count: int = 0,
) -> dict:
    """
    Compute features for a single event dict in real-time.

    Arguments:
        event:                Raw event dict (timestamp, username, ip_address, etc.)
        baselines:            Pre-computed per-user baseline dict
        recent_failure_count: Number of recent failures from this IP (looked up before calling)

    Returns:
        event dict with feature fields added
    """
    ts = pd.to_datetime(event["timestamp"])
    hour = ts.hour
    user = event.get("username", "")
    baseline = baselines.get(user, {})

    event["hour"] = hour
    event["day_of_week"] = ts.dayofweek
    event["is_night"] = 1 if 0 <= hour <= 4 else 0
    event["failed_login"] = 1 if event.get("login_status") == "Failed" else 0
    baseline_country = baseline.get("baseline_country")
    baseline_device  = baseline.get("baseline_device")
    # Only flag as unusual if a known baseline exists to compare against.
    # New users with no history should not be penalised.
    event["unusual_country"] = 1 if (baseline_country is not None and event.get("country") != baseline_country) else 0
    event["unusual_device"]  = 1 if (baseline_device  is not None and event.get("device")  != baseline_device)  else 0
    event["ip_recent_failures"] = recent_failure_count

    return event
