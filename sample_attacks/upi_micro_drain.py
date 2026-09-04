#!/usr/bin/env python3
"""
Synthetic UPI Micro-Debit Telemetry Test Script
------------------------------------------------
Target: CyberNova Ingestion Endpoint (http://localhost:8000/api/events)
Sends high-velocity UPI telemetry events to trigger fraud detection rules.
"""

import time
import json
import urllib.request

API_URL = "http://localhost:8000/api/events"

def send_upi_event(username, ip_address, status):
    payload = {
        "username": username,
        "ip_address": ip_address,
        "country": "Russia",
        "device": "Python / Requests",
        "browser": "FinTech-API-Client",
        "login_status": status,
        "event_type": "upi",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(API_URL, data=data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as res:
            body = json.loads(res.read().decode('utf-8'))
            print(f"[+] UPI Telemetry Sent | Status: {status} | Risk Score: {body.get('risk_score')}")
    except Exception as e:
        print(f"[-] Ingestion Error: {e}")

def main():
    print("[+] Executing Synthetic UPI Micro-Debit Burst Telemetry Test...")
    for i in range(1, 4):
        print(f"[+] Sending rapid micro-debit transaction #{i}...")
        send_upi_event("vikram", "45.33.32.156", "failed")
        time.sleep(0.5)

if __name__ == "__main__":
    main()

