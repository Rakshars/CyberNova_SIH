"""
simulation/log_generator.py
-----------------------------
Adapted from src/generate_logs.py in the original prototype.

WHAT CHANGED:
- generate_dataset() returns a list of dicts (no CSV writing here — DB does that)
- Added event_type field to every event for the new common event schema
- Seed is optional parameter (default 42 for reproducibility)
- Type hints added

WHAT IS PRESERVED:
- All scenario logic: normal login, suspicious login, brute-force burst
- USER_BASELINE per-user pattern
- All timing, IP generation, country/device selection logic
"""

from __future__ import annotations
import random
from datetime import datetime, timedelta
from typing import Any


USERNAMES = ["rahul", "asha", "vikram", "meera", "john", "sara", "amit", "neha"]
NORMAL_COUNTRIES = ["India", "USA", "UK"]
SUSPICIOUS_COUNTRIES = ["Russia", "Nigeria", "North Korea", "Brazil"]
DEVICES = ["Windows-Laptop", "MacBook", "iPhone", "Android-Phone", "Linux-Desktop"]
BROWSERS = ["Chrome", "Firefox", "Safari", "Edge"]


def _build_baselines(seed: int = 42) -> dict[str, dict]:
    rng = random.Random(seed)
    return {
        user: {
            "country": rng.choice(NORMAL_COUNTRIES),
            "device": rng.choice(DEVICES),
            "browser": rng.choice(BROWSERS),
        }
        for user in USERNAMES
    }


def _random_ip(rng: random.Random) -> str:
    return ".".join(str(rng.randint(1, 255)) for _ in range(4))


def _normal_timestamp(base_date: datetime, rng: random.Random) -> datetime:
    return base_date.replace(hour=rng.randint(8, 20), minute=rng.randint(0, 59), second=rng.randint(0, 59))


def _odd_timestamp(base_date: datetime, rng: random.Random) -> datetime:
    return base_date.replace(hour=rng.choice([0, 1, 2, 3, 4]), minute=rng.randint(0, 59), second=rng.randint(0, 59))


def generate_normal_login(base_date: datetime, baselines: dict, rng: random.Random) -> dict[str, Any]:
    user = rng.choice(USERNAMES)
    baseline = baselines[user]
    return {
        "event_type": "auth",
        "timestamp": _normal_timestamp(base_date, rng).strftime("%Y-%m-%d %H:%M:%S"),
        "username": user,
        "ip_address": _random_ip(rng),
        "country": baseline["country"],
        "login_status": "Success" if rng.random() > 0.05 else "Failed",
        "device": baseline["device"],
        "browser": baseline["browser"],
    }


def generate_suspicious_login(base_date: datetime, baselines: dict, rng: random.Random) -> dict[str, Any]:
    user = rng.choice(USERNAMES)
    pattern = rng.choice(["odd_hour", "foreign_country", "new_device"])
    ts = _odd_timestamp(base_date, rng) if pattern == "odd_hour" else _normal_timestamp(base_date, rng)
    country = rng.choice(SUSPICIOUS_COUNTRIES) if pattern == "foreign_country" else baselines[user]["country"]
    device = rng.choice(DEVICES) if pattern == "new_device" else baselines[user]["device"]
    return {
        "event_type": "auth",
        "timestamp": ts.strftime("%Y-%m-%d %H:%M:%S"),
        "username": user,
        "ip_address": _random_ip(rng),
        "country": country,
        "login_status": "Failed" if rng.random() > 0.3 else "Success",
        "device": device,
        "browser": rng.choice(BROWSERS),
    }


def generate_brute_force_burst(
    base_date: datetime,
    baselines: dict,
    rng: random.Random,
    target_user: str | None = None,
) -> list[dict[str, Any]]:
    """Generate a rapid sequence of failed logins from one IP (brute-force scenario)."""
    user = target_user or rng.choice(USERNAMES)
    attacker_ip = _random_ip(rng)
    country = rng.choice(SUSPICIOUS_COUNTRIES)
    start_time = _odd_timestamp(base_date, rng)
    num_attempts = rng.randint(6, 12)
    events = []
    for i in range(num_attempts):
        event_time = start_time + timedelta(seconds=i * 5)
        success = (i == num_attempts - 1) and rng.random() > 0.5
        events.append({
            "event_type": "auth",
            "timestamp": event_time.strftime("%Y-%m-%d %H:%M:%S"),
            "username": user,
            "ip_address": attacker_ip,
            "country": country,
            "login_status": "Success" if success else "Failed",
            "device": rng.choice(DEVICES),
            "browser": rng.choice(BROWSERS),
        })
    return events


def generate_dataset(
    num_days: int = 30,
    normal_per_day: int = 40,
    suspicious_per_day: int = 3,
    brute_force_events: int = 5,
    seed: int = 42,
    reference_date: datetime | None = None,
) -> list[dict[str, Any]]:
    """
    Generate a full synthetic event dataset.

    Returns a list of event dicts sorted chronologically.
    Nothing is written to disk — the caller decides what to do with the data.
    """
    rng = random.Random(seed)
    baselines = _build_baselines(seed)
    today = reference_date or datetime(2026, 8, 1)
    all_logs: list[dict] = []

    for day_offset in range(num_days):
        base = today - timedelta(days=day_offset)
        for _ in range(normal_per_day):
            all_logs.append(generate_normal_login(base, baselines, rng))
        for _ in range(suspicious_per_day):
            all_logs.append(generate_suspicious_login(base, baselines, rng))

    for _ in range(brute_force_events):
        random_day = today - timedelta(days=rng.randint(0, num_days - 1))
        all_logs.extend(generate_brute_force_burst(random_day, baselines, rng))

    all_logs.sort(key=lambda x: x["timestamp"])
    return all_logs
