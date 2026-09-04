#!/bin/bash
# Synthetic Ransomware & Wiper Telemetry Test Script
# Target: CyberNova Ingestion Endpoint (http://localhost:8000/api/events)
# Sends synthetic security telemetry via curl to test ML anomaly scoring and SOAR playbooks.

API_URL="http://localhost:8000/api/events"

echo "[+] Starting Synthetic Ransomware Telemetry Test..."

# Send high-risk synthetic event payload via HTTP POST
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "[+] Sending synthetic high-risk system telemetry event to API..."
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "arjun",
    "ip_address": "192.168.1.104",
    "country": "Germany",
    "device": "Frankfurt-C2-Agent",
    "browser": "Curl-Telemetry-Client/1.0",
    "login_status": "failed",
    "event_type": "wire",
    "timestamp": "'"$TIMESTAMP"'"
  }' | python3 -m json.tool

echo ""
echo "[+] Synthetic Telemetry Event Submitted Successfully."

