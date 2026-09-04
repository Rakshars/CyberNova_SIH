#!/usr/bin/env python3
"""
Synthetic Credential Spray Telemetry Test Script
------------------------------------------------
Target: CyberNova Ingestion Endpoint (http://localhost:8000/api/events)
Sends synthetic security telemetry events to validate ML scoring and SOAR detection.
"""

import time
import json
import urllib.request

API_URL = "http://localhost:8000/api/events"

def send_telemetry_event(username, ip_address, country, device, status, event_type="auth"):
    payload = {
        "username": username,
        "ip_address": ip_address,
        "country": country,
        "device": device,
        "browser": "Python-Telemetry-Client/1.0",
        "login_status": status,
        "event_type": event_type,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            res_json = json.loads(res_body)
            print(f"[+] Event Ingested | ID: {res_json.get('id')} | Risk Score: {res_json.get('risk_score')} | Anomaly: {res_json.get('is_anomaly')}")
    except Exception as e:
        print(f"[-] Ingestion Failed: {e}")

def main():
    print("[+] Starting Synthetic Credential Burst Telemetry Test...")
    
    # 1. Normal baseline event
    print("[1] Ingesting baseline login event...")
    send_telemetry_event("meera", "103.45.67.89", "India", "Chrome / Windows 11", "success")
    time.sleep(1)

    # 2. High-risk anomalous spray event from foreign IP
    print("[2] Ingesting anomalous credential spray attempt...")
    send_telemetry_event("meera", "185.220.194.14", "North Korea", "Tor Exit Node", "failed")
    
    print("[+] Telemetry Test Sequence Complete.")

if __name__ == "__main__":
    main()

