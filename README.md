# CyberNova Sentinel — Autonomous AI SOC Command

CyberNova Sentinel is an enterprise-grade, AI-powered Autonomous Security Operations Center (SOC) designed to detect, investigate, analyze, and contain modern cybersecurity threats in real-time. By leveraging a high-performance FastAPI backend, a sleek React/Vite frontend, and advanced Machine Learning (including PyTorch Vision Transformers for deepfake media analysis and Isolation Forests for telemetry anomalies), CyberNova provides an instant, interactive threat-mitigation command center.

---

## 🌟 Core Features & Modules

### 1. Unified SOC Command Dashboard
* **Real-Time Security Health & Risk Score:** Dynamic score computed from active critical/high/medium threats (formula-driven, clamped between `0` and `100`).
* **Live Incident Feed:** Instantly updates as telemetry alerts are ingested and automatically correlates alerts into incidents.
* **Explainable AI (XAI) Risk Model:** Breaks down risk scores into clear, human-readable points (e.g., Impossible Travel Speed `+38`, Failed Password Burst `+26`).
* **Telemetry Counters:** Displays real-time counts for active events, anomalies, protected users, and monitored IPs.

### 2. Live Red Team Demo Attack Launcher
An interactive simulator providing 1-click generation of sophisticated synthetic attacks:
* **Brute Force + Travel:** Simulates rapid login failures followed by an impossible geolocation jump.
* **Bharat UPI Fraud:** Simulates high-frequency micro-debits and Virtual Payment Address (VPA) spoofing.
* **SMS Scam Blast:** Launches synthetic bulk phishing storms.
* **Deepfake Wire Fraud:** Simulates high-risk voice or video manipulation attempting executive wire transfers.
* **Interactive Mesh Animation:** Graphically demonstrates connection nodes and blocks malicious links/IPs live.

### 3. Multi-Modal Security Scanner
* **Deepfake Media Verification:** Utilizes the state-of-the-art **Community Forensics ViT Model** (`OwensLab/commfor-model-384`) trained on 2.7M images to predict synthetic manipulations and locate facial manipulation coordinates (with bounding boxes).
* **Phishing URL Inspector:** Evaluates domain entropy, high-risk TLDs (e.g., `.xyz`, `.tk`), raw IP addresses, credential redirection `@` symbols, and hyphen frequency.
* **NLP Text Scam Engine:** Inspects messages (SMS, WhatsApp, UPI notes) for urgency patterns, electric bill extortion scams, and PAN/Aadhaar/KYC update frauds.

### 4. Autonomous SOAR Playbooks (Security Orchestration, Automation, & Response)
* **Instant Containment (Reaction time: ~84ms):** Auto-triggers response actions based on rule thresholds.
* **Configurable Rules:** Enable/disable playbooks like "Critical Threat Auto-Containment", "Credential Brute Force Containment", "UPI & FinTech Anomaly Freeze", and "Incident Escalation to Telegram webhooks".
* **Execution Auditing:** Tracks historical action logs to show what was quarantined, blocked, or frozen.

### 5. AI Sentinel Copilot
* **Natural Language Q&A:** Chat with an AI assistant regarding current incidents, UPI fraud status, or system health.
* **Automated Incident Investigation:** Generates detailed root-cause investigations, MITRE ATT&CK chain steps, and forensic timeline breakdowns for any incident.

---

## 💻 Tech Stack

* **Backend:** Python, FastAPI, SQLAlchemy (ORM), SQLite (database), PyTorch, Torchvision, TIMM (Trained Image Models), OpenCV, Uvicorn.
* **Frontend:** React (Vite), ES6+ Javascript, CSS (Tailwind/Custom UI components), Recharts, Lucide React (iconography).

---

## 🚀 Setup & Installation Instructions

This project is split into a **`/backend`** folder and a **`/frontend`** folder. Follow the instructions below matching your operating system.

### 📋 Prerequisites
* **Python** 3.10+ (must be installed on the machine)
* **Node.js** 18+ and **npm** (must be installed on the machine)

---

### 🐧 Linux (Ubuntu/Debian/Fedora) & 🍏 macOS

#### 1. Setup Backend
Open a terminal window and navigate to the project directory:
```bash
cd backend
# Create Python virtual environment
python3 -m venv venv
# Activate virtual environment
source venv/bin/activate
# Install required packages (includes PyTorch and OpenCV modules)
pip install -r requirements.txt
# Launch the backend server
uvicorn app.main:app --reload --port 8000
```

#### 2. Setup Frontend
Open a **new** terminal window and navigate to the project directory:
```bash
cd frontend
# Install node packages
npm install
# Run frontend dev server
npm run dev
```
Open your browser and navigate to: `http://localhost:5173`

---

### 🪟 Windows (Command Prompt / PowerShell)

#### 1. Setup Backend
Open a command line terminal (CMD or PowerShell) in the backend directory:
```cmd
cd backend

:: For Command Prompt (CMD)
python -m venv venv
call venv\Scripts\activate.bat

:: For PowerShell
python -m venv venv
.\venv\Scripts\Activate.ps1

:: Install packages
pip install -r requirements.txt

:: Start server
uvicorn app.main:app --reload --port 8000
```

#### 2. Setup Frontend
Open a **new** command terminal and run:
```cmd
cd frontend
npm install
npm run dev
```
Open your browser and navigate to: `http://localhost:5173`

---

## 🔍 How to Execute and Test Features

Once both servers are running, navigate to `http://localhost:5173` in your browser.

### 🧪 Feature 1: Triggering Simulated Attacks
1. On the **Dashboard**, click any scenario under the **"LIVE RED TEAM DEMO ATTACK LAUNCHER"** (e.g., click `💥 Brute Force + Travel` or `💳 Bharat UPI Fraud`).
2. An interactive network mesh model will pop up, demonstrating the incoming attack nodes.
3. Observe the SOAR automation blocks running in real-time.
4. Close the modal, and you will see the dashboard stats and the **Live Incident Feed** automatically updated with new incidents.

### 🧪 Feature 2: Managing SOAR Policies
1. Click **"SOAR Playbooks"** in the sidebar.
2. Toggle the switch next to any rule (e.g. *Executive Account Lockdown* or *Data Exfiltration Prevention*) to enable or disable them.
3. Scroll down to see the **Autonomous Containment Log** showing a history of all executed blocks and freezes.

### 🧪 Feature 3: Running Multimodal Scanners
1. Navigate to the **"Multi-Modal Security"** tab in the sidebar.
2. **Phishing URL Scanner:** Paste a domain (e.g. `http://192.168.1.1/login-secure-auth-update-kyc.xyz`) and click **Scan Link** to see the heuristic breakdown.
3. **SMS/Email Scam Detector:** Paste a text message (e.g. `"Electricity power connection will be disconnected tonight at 10 PM. Call manager immediately at +91-9876543210 to update KYC."`) and click **Analyze Message** to check the NLP trigger keywords.
4. **Deepfake Media Scanner:** Click the file selector under **Deepfake Scanner**, upload an image file, and click **Verify Media**. The backend will process the image through the ViT classifier, show the synthetic confidence percentage, and draw a heatmap over the face.

### 🧪 Feature 4: Investigating with AI Sentinel Copilot
1. Click **"AI Sentinel Copilot"** (blue button in the top right header).
2. Type one of the suggested prompts or ask your own question:
   * *"Explain high severity threats"*
   * *"Show UPI fraud summary"*
   * *"What actions did SOAR take?"*
3. To perform root-cause analysis on a specific incident, go to the **Incidents** tab in the sidebar, click on any incident, and scroll down to view the **AI Sentinel Investigator** section for an interactive timeline and threat factor weights.
