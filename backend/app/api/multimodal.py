"""
api/multimodal.py
------------------
Multi-Modal Security Hub API Router.
Handles:
1. Deepfake Video & Image Verification (Fake confidence score + heatmap artifacts)
2. Phishing URL Feature & Domain Risk Analysis
3. Email & SMS Scam Detection (NLP Urgency & Pattern Analyzer)
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import re
import math

from app.detection.deepfake_detector import analyze_image_bytes

router = APIRouter(prefix="/api/multimodal", tags=["Multi-Modal Security Scanners"])

# --- Models ---
class URLScanRequest(BaseModel):
    url: str

class TextScamRequest(BaseModel):
    text: str
    channel: Optional[str] = "SMS"  # SMS | Email | WhatsApp | UPI Note

# --- 1. Phishing URL Inspection ---
def analyze_url_heuristics(url: str) -> dict:
    url_lower = url.lower()
    score = 0
    factors = []

    # IP address instead of domain
    if re.search(r"https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", url_lower):
        score += 35
        factors.append("Raw IP Address used as host domain (+35)")

    # Suspicious keywords
    keywords = ["login", "verify", "secure", "bank", "update", "account", "kyc", "upi", "free", "claim", "reward", "support", "signin", "otp"]
    matched_kw = [kw for kw in keywords if kw in url_lower]
    if matched_kw:
        added = len(matched_kw) * 12
        score += added
        factors.append(f"Suspicious security/finance keywords found ({', '.join(matched_kw)}) (+{added})")

    # Domain length & subdomains
    if len(url) > 65:
        score += 15
        factors.append("Excessive URL length > 65 chars (+15)")

    subdomain_count = url.count(".")
    if subdomain_count > 3:
        score += 20
        factors.append(f"Multiple subdomain levels ({subdomain_count}) (+20)")

    # @ Symbol trick
    if "@" in url:
        score += 25
        factors.append("Contains '@' symbol (Credential redirection trick) (+25)")

    # Hyphen overload
    if url.count("-") > 3:
        score += 15
        factors.append("High hyphen count in hostname (+15)")

    # Suspicious TLD check
    suspicious_tlds = [".xyz", ".top", ".club", ".online", ".site", ".tk", ".ml", ".ga", ".cf", ".gq", ".live"]
    if any(url_lower.endswith(tld) or f"{tld}/" in url_lower for tld in suspicious_tlds):
        score += 25
        factors.append("High-risk TLD extension detected (+25)")

    risk_score = min(100, score)
    if risk_score >= 70:
        verdict = "PHISHING / MALICIOUS"
        level = "HIGH"
    elif risk_score >= 40:
        verdict = "SUSPICIOUS"
        level = "MEDIUM"
    else:
        verdict = "LEGITIMATE / SAFE"
        level = "LOW"

    return {
        "url": url,
        "risk_score": risk_score,
        "verdict": verdict,
        "severity": level,
        "risk_factors": factors,
        "domain_entropy": round(len(set(url_lower)) / max(len(url_lower), 1), 3)
    }

@router.post("/phishing")
def scan_phishing_url(payload: URLScanRequest):
    if not payload.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    return analyze_url_heuristics(payload.url)


# --- 2. SMS & Email Scam Classification (NLP Heuristics) ---
def classify_scam_text(text: str, channel: str) -> dict:
    text_lower = text.lower()
    score = 0
    signals = []

    # High Urgency signals
    urgency_patterns = [
        r"account.*(suspended|blocked|terminated)",
        r"(power|electricity).*(cut|disconnected|night)",
        r"(immediately|urgent|within 24 hours|within 2 hours)",
        r"(kyc|aadhaar|pan).*(expired|update|verify)",
        r"(lottery|winner|reward|prize|cashback).*(claim|won)",
        r"(police|legal|court|cyber cell).*(warrant|action)",
        r"(upi|bank).*(debit|blocked|limit)"
    ]

    for p in urgency_patterns:
        if re.search(p, text_lower):
            score += 25
            signals.append(f"Urgency / Extortion pattern detected: '{re.search(p, text_lower).group(0)}' (+25)")

    # Link presence
    if "http" in text_lower or "bit.ly" in text_lower or ".com" in text_lower or ".in/" in text_lower:
        score += 20
        signals.append("Contains clickable suspicious payload link (+20)")

    # Contact request
    if re.search(r"call\s+now|whatsapp|contact\s+manager|\+91-?\d{10}", text_lower):
        score += 15
        signals.append("Direct call-to-action / phone contact push (+15)")

    risk_score = min(100, score)
    if risk_score >= 65:
        verdict = "MALICIOUS SCAM / PHISHING"
        severity = "HIGH"
    elif risk_score >= 35:
        verdict = "SUSPICIOUS MESSAGE"
        severity = "MEDIUM"
    else:
        verdict = "BENIGN / CLEAN"
        severity = "LOW"

    return {
        "text_sample": text[:150] + ("..." if len(text) > 150 else ""),
        "channel": channel,
        "scam_confidence": risk_score,
        "verdict": verdict,
        "severity": severity,
        "detected_triggers": signals if signals else ["No malicious patterns detected"]
    }

@router.post("/scam")
def scan_scam_message(payload: TextScamRequest):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text payload cannot be empty")
    return classify_scam_text(payload.text, payload.channel)


# --- 3. Deepfake Image Analysis ---
@router.post("/deepfake")
async def analyze_deepfake(file: UploadFile = File(...)):
    """
    Analyzes an uploaded image for synthetic/AI-generated manipulation using
    the Community Forensics ViT model (Park & Owens, Univ. of Michigan,
    arXiv:2411.04125). Video support is not yet implemented - see
    app/detection/deepfake_detector.py.
    """
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if "video" in (file.content_type or ""):
        raise HTTPException(status_code=400, detail="Video analysis not yet supported - upload an image")

    result = analyze_image_bytes(content)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    score = result["fake_probability"]
    deepfake_score = round(score * 100)

    if score >= 0.5:
        verdict = "SYNTHETIC DEEPFAKE DETECTED"
        confidence = "HIGH" if score >= 0.85 else "MEDIUM"
    else:
        verdict = "AUTHENTIC MEDIA"
        confidence = "HIGH" if score <= 0.15 else "MEDIUM"

    anomalies = [
        f"ViT forensics model (trained on 2.7M images across 4,800+ generators) "
        f"assigned a {deepfake_score}% synthetic-manipulation probability to this image."
    ]

    heatmaps = []
    if result["bbox"]:
        b = result["bbox"]
        heatmaps.append({
            "region": "Detected Face",
            "risk": "High" if score >= 0.5 else "Low",
            "x": f"{b['x_pct']:.0f}%",
            "y": f"{b['y_pct']:.0f}%",
            "width": f"{b['w_pct']:.0f}%",
            "height": f"{b['h_pct']:.0f}%",
        })

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "deepfake_probability": deepfake_score,
        "verdict": verdict,
        "confidence_level": confidence,
        "anomalies_detected": anomalies,
        "heatmap_regions": heatmaps,
        "frame_count_analyzed": 1,
        "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
    }
