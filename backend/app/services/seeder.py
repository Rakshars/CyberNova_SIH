"""
services/seeder.py
-------------------
Seeds the database with synthetic data on first startup.

Run order:
1. Check if DB has any events
2. If empty: generate 30 days of synthetic events
3. Run batch pipeline (feature engineering → ML → risk scoring → DB insert)

This replaces manually running generate_logs.py and pipeline.py.
The server seeds itself automatically.
"""

from __future__ import annotations
import logging
from sqlalchemy.orm import Session
from app.models.security_event import SecurityEvent
from app.simulation.log_generator import generate_dataset
from app.services.pipeline_service import run_batch_pipeline

logger = logging.getLogger(__name__)


def seed_soar_policies(db: Session) -> None:
    """Seed default SOAR policies if the table is empty."""
    from app.models.soar_policy import SOARPolicy
    try:
        count = db.query(SOARPolicy).count()
        if count > 0:
            logger.info("SOAR policies table already seeded.")
            return

        logger.info("Seeding default SOAR policies...")
        default_rules = [
            SOARPolicy(
                id="policy-001",
                name="Critical Threat Auto-Containment",
                condition_type="risk_threshold",
                threshold=80,
                target_event=None,
                target_severity=None,
                action_type="block_user_and_ip",
                description="If threat risk score >= 80, automatically block the target IP address and suspend the user's active session across the network to isolate the threat.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-002",
                name="Credential Brute Force Containment",
                condition_type="event_type",
                threshold=None,
                target_event="FAILED_LOGIN_BURST",
                target_severity=None,
                action_type="rate_limit_ip",
                description="If rapid failed login attempts (burst) are detected, apply adaptive IP-based rate-limiting, prompt for Captcha, and force MFA.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-003",
                name="UPI & FinTech Anomaly Freeze",
                condition_type="event_type",
                threshold=None,
                target_event="UPI_ANOMALY",
                target_severity=None,
                action_type="freeze_upi_vpa",
                description="If unusual high-frequency micro-debits or virtual payment address (VPA) spoofing is detected, temporarily freeze transaction channels and flag the target accounts.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-004",
                name="Incident Escalation to Telegram",
                condition_type="severity",
                threshold=None,
                target_event=None,
                target_severity="HIGH",
                action_type="notify_soc_telegram",
                description="If the incident severity is CRITICAL or HIGH, immediately forward the full diagnostic payload and alert details to the security operations center's Telegram channel.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-005",
                name="Phishing Scam Domain Quarantine",
                condition_type="event_type",
                threshold=None,
                target_event="PHISHING_STORM",
                target_severity=None,
                action_type="quarantine_phishing_domain",
                description="If a phishing storm or mass SMS scam is detected, immediately quarantine the phishing domain at the DNS resolver level and block the associated SMS gateway.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-006",
                name="Executive Account Lockdown",
                condition_type="event_type",
                threshold=None,
                target_event="DEEPFAKE_WIRE_FRAUD",
                target_severity=None,
                action_type="mfa_lockdown",
                description="If a deepfake voice or video manipulation wire transfer attempt is flagged, place executive credentials in restricted mode and hold transaction execution pending manual SOC review.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-007",
                name="Malware C2 Server Isolation",
                condition_type="event_type",
                threshold=None,
                target_event="MALWARE_BEACON",
                target_severity=None,
                action_type="isolate_device",
                description="If local malware traffic or command and control beaconing is detected, isolate the host machine from the internal network.",
                enabled=True,
                auto_execute=True
            ),
            SOARPolicy(
                id="policy-008",
                name="Data Exfiltration Prevention",
                condition_type="event_type",
                threshold=None,
                target_event="DATA_EXFILTRATION",
                target_severity=None,
                action_type="block_data_transfer",
                description="If bulk data exfiltration or massive files transfers from confidential network segments are flagged, automatically terminate the active session and revoke API keys.",
                enabled=True,
                auto_execute=True
            )
        ]
        db.bulk_save_objects(default_rules)
        db.commit()
        logger.info("Successfully seeded %d SOAR policies.", len(default_rules))
    except Exception as e:
        logger.error(f"Error seeding SOAR policies: {e}")


def seed_knowledge_base(db: Session) -> None:
    """Seed default Categories, Articles, Tags, References, and MITRE techniques if empty."""
    from app.models.knowledge import Category, Tag, MitreTechnique, Reference, Article
    try:
        # Check if Category exists
        if db.query(Category).count() > 0:
            logger.info("Knowledge Base already seeded.")
            return

        logger.info("Seeding Cyber Knowledge Base Categories...")
        # 1. Categories
        categories_data = [
            {"name": "Attacks & Threats", "slug": "attacks-threats", "description": "Common cyber attack vectors, methodologies, and security threat campaigns.", "icon": "attacks-threats"},
            {"name": "Malware", "slug": "malware", "description": "Malicious software variants, functional structures, and payload mechanisms.", "icon": "malware"},
            {"name": "Vulnerabilities", "slug": "vulnerabilities", "description": "Security weaknesses, system exposures, and coding flaws (CVE & CWE metrics).", "icon": "vulnerabilities"},
            {"name": "Defense & Security", "slug": "defense-security", "description": "Defense architectures, detection tools, response mechanisms, and policy guards.", "icon": "defense-security"},
            {"name": "Networking", "slug": "networking", "description": "Network protocols, secure communications, routing, and endpoint interfaces.", "icon": "networking"},
            {"name": "MITRE ATT&CK", "slug": "mitre-attack", "description": "Tactical techniques and procedures mapping attacker behaviors globally.", "icon": "mitre-attack"}
        ]
        
        categories_map = {}
        for cat in categories_data:
            c = Category(name=cat["name"], slug=cat["slug"], description=cat["description"], icon=cat["icon"])
            db.add(c)
            categories_map[cat["name"]] = c
        db.commit()

        logger.info("Seeding Cyber Knowledge Base Articles...")
        # 2. Articles (we list the 15 articles)
        articles_data = [
            # Ransomware
            {
                "title": "Ransomware",
                "slug": "ransomware",
                "summary": "A form of malware designed to encrypt system storage and databases, demanding a ransom payment in exchange for the decryption key.",
                "category": "Attacks & Threats",
                "difficulty": "Intermediate",
                "mitreId": "T1486",
                "lastUpdated": "2026-08-15",
                "overview": "Ransomware is one of the most destructive attack mechanisms in modern cybersecurity. It targets critical infrastructure, enterprise databases, and standard workstations to encrypt files and render systems unusable. Attackers then demand cryptocurrency payments in exchange for decryption tools. Modern ransomware campaigns also employ 'double extortion', where sensitive data is exfiltrated prior to encryption, threatening public leaks if the ransom is not paid.",
                "howItWorks": "Typically, ransomware enters a system through phishing emails, vulnerable remote desktop ports (RDP), or drive-by downloads. Once inside, it establishes persistence, communicates with command-and-control (C2) servers to download public encryption keys, terminates security tools, and begins encrypting mapped files using hybrid algorithms (such as AES-256 for files and RSA-2048 for key encapsulation).",
                "attackFlow": [
                    "Initial Access (e.g., Phishing or RDP exploit)",
                    "Execution (e.g., Trojan dropper executes on machine)",
                    "Privilege Escalation (e.g., Exploiting local kernel bugs for Admin rights)",
                    "Lateral Movement (e.g., Spreading across Active Directory networks)",
                    "Data Encryption (e.g., Encrypting local/network shares using AES)",
                    "Impact (e.g., System lockout and ransom note delivery)"
                ],
                "detection": "Detection relies on monitoring file entropy rates, massive file rename events (e.g., changing extensions to .locked), deletion of volume shadow copies (VSS), and unusual network traffic to known C2 server endpoints. EDR agents look for system processes invoking 'vssadmin.exe delete shadows'.",
                "prevention": "Implement multi-factor authentication (MFA) across all remote access points, enforce strict offline/immutable backups, deploy endpoint detection software (EDR), restrict user privileges to prevent arbitrary script execution, and conduct periodic phishing simulation training.",
                "tags": ["Malware", "Encryption", "Extortion", "MITRE T1486"],
                "mitreTechniques": [
                    {"id": "T1486", "name": "Data Encrypted for Impact", "tactic": "Impact", "description": "Adversaries may encrypt data on target systems or on large scale to disrupt operations."}
                ],
                "references": [
                    "MITRE ATT&CK Technique T1486: Data Encrypted for Impact",
                    "CISA Joint Guide on Ransomware Prevention",
                    "NIST SP 800-83 Rev. 1: Guide to Malware Incident Prevention and Handling"
                ],
                "relatedTopics": ["malware", "phishing", "lateral-movement", "data-exfiltration"]
            },
            # Phishing
            {
                "title": "Phishing",
                "slug": "phishing",
                "summary": "A social engineering technique where attackers impersonate trustworthy entities via email, SMS, or voice call to steal credentials or deploy malware.",
                "category": "Attacks & Threats",
                "difficulty": "Beginner",
                "mitreId": "T1566",
                "lastUpdated": "2026-08-10",
                "overview": "Phishing remains the primary entry point for over 80% of security breaches. By leveraging human psychology—such as urgency, fear, or greed—attackers trick users into clicking malicious hyperlinks, opening weaponized email attachments, or entering credentials into cloned landing pages.",
                "howItWorks": "Phishing attacks come in multiple forms, including spear phishing (targeting specific roles like HR or Finance), whaling (targeting executives), and smishing (SMS-based). Attackers spoof email domains or exploit weak SPF/DKIM/DMARC records to bypass basic email filters, directing victims to credential-harvesting servers.",
                "attackFlow": [
                    "Target Research (e.g., Gathering employee details on LinkedIn)",
                    "Spoofed Infrastructure Setup (e.g., Purchasing lookalike domains)",
                    "Email Delivery (e.g., Campaign dispatched to corporate accounts)",
                    "User Action (e.g., Victim clicks link and enters AD credentials)",
                    "Credential Harvesting (e.g., Hacker captures plain-text login tokens)",
                    "Account Takeover (e.g., Accessing cloud directories and resources)"
                ],
                "detection": "Look for unusual email gateway logins, email headers originating from unauthorized servers, external email banners on messages claiming to be internal, and outbound user traffic to newly registered web domains.",
                "prevention": "Configure strict SPF, DKIM, and DMARC policies. Deploy automated email security gateways (SEG) with link rewriting, enforce hardware security keys (FIDO2) for multi-factor authentication, and educate employees on identifying phishing indicators.",
                "tags": ["Social Engineering", "Email", "Credentials", "MITRE T1566"],
                "mitreTechniques": [
                    {"id": "T1566", "name": "Phishing", "tactic": "Initial Access", "description": "Adversaries may send phishing messages to gain access to devices or harvest user accounts."}
                ],
                "references": [
                    "MITRE ATT&CK Technique T1566: Phishing",
                    "APWG (Anti-Phishing Working Group) Reports",
                    "NIST SP 800-177: Trustworthy Email Guide"
                ],
                "relatedTopics": ["ransomware", "credential-stuffing", "powershell"]
            },
            # Credential Stuffing
            {
                "title": "Credential Stuffing",
                "slug": "credential-stuffing",
                "summary": "An automated attack where lists of leaked username/password pairs are injected into login forms to gain unauthorized access.",
                "category": "Attacks & Threats",
                "difficulty": "Beginner",
                "mitreId": "T1110.004",
                "lastUpdated": "2026-07-28",
                "overview": "Credential stuffing relies on the prevalent habit of password reuse across multiple platforms. Using specialized botnets and software tools, attackers take large databases of previously leaked credentials (from third-party breaches) and systematically test them on login portals of banks, e-commerce, and corporate apps.",
                "howItWorks": "Attackers load accounts into tools like Sentry MBA or customized Python scripts that spoof browser user-agents. These bots route requests through proxy networks to evade IP rate limiting, parsing responses for successful login indicators (such as redirect codes or welcome page strings).",
                "attackFlow": [
                    "Acquisition (e.g., Downloading credential lists from dark web forums)",
                    "Botnet Configuration (e.g., Loading target login endpoints and proxy lists)",
                    "Authentication Spraying (e.g., Automated high-speed login attempts)",
                    "Hit Identification (e.g., Flagging credentials that successfully authenticated)",
                    "Access Sale or Abuse (e.g., Harvesting data or selling validated accounts)"
                ],
                "detection": "Look for high spikes in login failures, multiple login attempts originating from hundreds of distinct IP addresses in a short duration, and accounts logging in from vastly different geographical locations within minutes.",
                "prevention": "Enforce Multi-Factor Authentication (MFA), utilize CAPTCHA systems on login paths, integrate HaveIBeenPwned API to block compromised passwords at signup, and monitor traffic via Web Application Firewalls (WAF) to detect automated bot patterns.",
                "tags": ["Authentication", "Credentials", "Brute Force", "MITRE T1110.004"],
                "mitreTechniques": [
                    {"id": "T1110.004", "name": "Credential Stuffing", "tactic": "Credential Access", "description": "Adversaries may use credential stuffing lists to access multiple corporate interfaces."}
                ],
                "references": [
                    "MITRE ATT&CK Sub-technique T1110.004: Credential Stuffing",
                    "OWASP Automated Threat Category OAT-008",
                    "CISA Credentials Security Guidelines"
                ],
                "relatedTopics": ["phishing", "privilege-escalation", "zero-trust"]
            },
            # Port Scanning
            {
                "title": "Port Scanning",
                "slug": "port-scanning",
                "summary": "A reconnaissance method used to probe target servers for open network ports and active service versions to map out exploitable points.",
                "category": "Networking",
                "difficulty": "Beginner",
                "mitreId": "T1046",
                "lastUpdated": "2026-08-01",
                "overview": "Port scanning is the digital equivalent of testing a building's doors and windows to see which are unlocked. Attackers use port scanners to identify active services (like SSH on port 22, HTTP on port 80, or SMB on port 445), their software versions, and operating system types to plan downstream exploits.",
                "howItWorks": "Scanners transmit raw packets (such as TCP SYN, ACK, or FIN) to target IPs. By evaluating returned packets (e.g., receiving a SYN-ACK indicates an open port, while a RST indicates it is closed), scanners build a comprehensive map of target systems.",
                "attackFlow": [
                    "Target Identification (e.g., Resolving target network ranges and IP targets)",
                    "Scan Initiation (e.g., Dispatched TCP SYN scan using Nmap)",
                    "Service Identification (e.g., Probing open ports for service banners)",
                    "OS Fingerprinting (e.g., Evaluating TCP window size responses)",
                    "Vulnerability Mapping (e.g., Checking service versions against CVE databases)"
                ],
                "detection": "WAFs and Intrusion Detection Systems (IDS) easily flag port scanning due to a single IP address initiating sequential connection attempts across hundreds of ports in a brief span. Modern scanners like Nmap use stealth scanning (SYN scanning) or slow pacing (polite scans) to try and bypass alerts.",
                "prevention": "Implement strict network firewalls to restrict unused ports, disable unnecessary services on endpoints, block ping (ICMP) scans where applicable, and implement Intrusion Prevention Systems (IPS) that auto-block scanning IPs.",
                "tags": ["Reconnaissance", "Discovery", "Nmap", "MITRE T1046"],
                "mitreTechniques": [
                    {"id": "T1046", "name": "Network Service Scanning", "tactic": "Discovery", "description": "Adversaries may scan network services to build active maps of target nodes."}
                ],
                "references": [
                    "MITRE ATT&CK Technique T1046: Network Service Scanning",
                    "Nmap Official Book: Network Scanning",
                    "CWE-200: Exposure of Sensitive Information through Service Banner"
                ],
                "relatedTopics": ["networking", "sql-injection", "lateral-movement"]
            },
            # Lateral Movement
            {
                "title": "Lateral Movement",
                "slug": "lateral-movement",
                "summary": "Techniques used by adversaries to spread their reach through a corporate network after securing initial access on a single device.",
                "category": "Attacks & Threats",
                "difficulty": "Advanced",
                "mitreId": "TA0008",
                "lastUpdated": "2026-08-20",
                "overview": "Once attackers infiltrate an endpoint, they rarely land on the high-value systems they want. Lateral movement is the crucial phase of pivoting from the compromised host to adjacent workstations, servers, and domain controllers, searching for administrative credentials and sensitive databases.",
                "howItWorks": "Attackers harvest active credentials from memory using utilities like Mimikatz or access tickets in Active Directory. They then use legitimate management protocols (such as WMI, PowerShell Remoting, SSH, or Remote Desktop) to execute remote tasks, making their footprint blend in with normal administrative workflow.",
                "attackFlow": [
                    "Credential Harvesting (e.g., Scraping memory via LSASS dumping)",
                    "Internal Scouting (e.g., Querying Active Directory domains for high-value groups)",
                    "Target Selection (e.g., Identifying SQL servers and database backups)",
                    "Exploitation or Authentication (e.g., Using stolen credentials via WinRM/SSH)",
                    "Execution (e.g., Spawning C2 agents on the new network node)"
                ],
                "detection": "Monitor lateral remote access logs, particularly WinRM connections, unusual RDP sessions between endpoints, Pass-the-Hash (PtH) patterns, and spikes in Kerberos service ticket requests (Kerberoasting).",
                "prevention": "Implement network segmentation (blocking endpoint-to-endpoint traffic), disable SMBv1, enforce the principle of least privilege, use administrative workstations (Privileged Access Workstations), and deploy Local Administrator Password Solution (LAPS).",
                "tags": ["Internal Network", "Active Directory", "Pivoting", "MITRE TA0008"],
                "mitreTechniques": [
                    {"id": "T1021.002", "name": "SMB/Windows Admin Shares", "tactic": "Lateral Movement", "description": "Adversaries may use Windows Shares to move laterally."}
                ],
                "references": [
                    "MITRE ATT&CK Tactic TA0008: Lateral Movement",
                    "Microsoft Active Directory Security Best Practices",
                    "NSA Top 10 Cybersecurity Mitigation Strategies"
                ],
                "relatedTopics": ["powershell", "privilege-escalation", "command-and-control"]
            },
            # Command and Control
            {
                "title": "Command and Control",
                "slug": "command-and-control",
                "summary": "Adversary tactics to establish a communication channel between infected network endpoints and attacker-controlled external servers.",
                "category": "MITRE ATT&CK",
                "difficulty": "Advanced",
                "mitreId": "TA0011",
                "lastUpdated": "2026-08-18",
                "overview": "Command and Control (C2) is the brain of a cyber attack. After executing malware, attackers require a reliable channel to send execution commands, transmit script modifications, and receive exfiltrated network files. C2 channels are designed to mimic legitimate web traffic (such as HTTPS or DNS queries) to avoid inspection by firewalls.",
                "howItWorks": "Malware periodically sends lightweight check-in packets ('beacons') to a list of IP addresses or dynamically generated domains (via Domain Generation Algorithms - DGA). Modern C2 architectures utilize legitimate cloud services (like Slack, Google Drive, or GitHub) as relays, blending in with daily enterprise operations.",
                "attackFlow": [
                    "Malware Infection (e.g., Executable dropper runs on local device)",
                    "C2 Host Discovery (e.g., Resolving domains dynamically via DGA)",
                    "Beaconing (e.g., Regular HTTPS POST requests containing system state)",
                    "Command Queueing (e.g., Operator pushes keylogging task to queue)",
                    "Execution & Return (e.g., Malware collects logs and sends back via POST)"
                ],
                "detection": "Identify C2 networks by analyzing regular periodic traffic patterns (beacons with jitter), checking unusual DNS queries (e.g., massive volumes of TXT record lookups representing DNS tunneling), and monitoring connections to recently registered web domains.",
                "prevention": "Enforce strict egress firewall rules, implement SSL decryption on proxy systems to inspect HTTPS payloads, restrict DNS resolution to trusted internal gateways, and utilize threat intelligence feeds to block known C2 infrastructure.",
                "tags": ["C2", "Beaconing", "Exfiltration", "MITRE TA0011"],
                "mitreTechniques": [
                    {"id": "T1071.001", "name": "Web Protocols", "tactic": "Command and Control", "description": "Adversaries may use HTTP/HTTPS for covert C2 communications."}
                ],
                "references": [
                    "MITRE ATT&CK Tactic TA0011: Command and Control",
                    "SANS Institute: C2 Frameworks Detection and Threat Hunting",
                    "Cybersecurity Framework (NIST CSF): Protect and Detect Guides"
                ],
                "relatedTopics": ["lateral-movement", "data-exfiltration", "powershell"]
            },
            # PowerShell
            {
                "title": "PowerShell Exploitation",
                "slug": "powershell",
                "summary": "The abuse of native Windows command-line and scripting frameworks to download payloads, execute code in memory, and bypass endpoint security controls.",
                "category": "Malware",
                "difficulty": "Intermediate",
                "mitreId": "T1059.001",
                "lastUpdated": "2026-07-20",
                "overview": "PowerShell is a powerful built-in administrative shell in Windows environments. Threat actors frequently abuse it in 'Living off the Land' (LotL) attacks, allowing them to download and run malicious scripts directly in RAM without writing files to disk (fileless malware), thus evading basic file system scanners.",
                "howItWorks": "Attackers run PowerShell with command-line switches like `-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command`. They call DLL functions using Reflection, dump LSASS memory, or use base64-encoded command arguments (`-EncodedCommand`) to mask the actual scripts.",
                "attackFlow": [
                    "Delivery (e.g., Weaponized Office document with Macro launch code)",
                    "Process Spawn (e.g., Excel spawns hidden powershell.exe)",
                    "Argument Obfuscation (e.g., Decrypting base64 payload string in memory)",
                    "Remote Download (e.g., Fetching Cobalt Strike stager from web server)",
                    "In-Memory Execution (e.g., Injecting shellcode into explorer.exe via API calls)"
                ],
                "detection": "Configure PowerShell script block logging (Event ID 4104) and transcription logging. Monitor process execution trees (e.g., Office application spawning PowerShell is highly suspicious) and monitor for execution bypass arguments.",
                "prevention": "Enforce PowerShell Constrained Language Mode (CLM), configure AppLocker or WDAC to limit script execution to trusted paths, block script access to ordinary standard users, and deploy Anti-Malware Scan Interface (AMSI) integrations.",
                "tags": ["Scripting", "Execution", "LOLBAS", "MITRE T1059.001"],
                "mitreTechniques": [
                    {"id": "T1059.001", "name": "PowerShell", "tactic": "Execution", "description": "Adversaries may use PowerShell to execute arbitrary command scripts."}
                ],
                "references": [
                    "MITRE ATT&CK Technique T1059.001: PowerShell",
                    "Microsoft: Securing PowerShell in the Enterprise",
                    "OWASP Fileless Attacks Analysis"
                ],
                "relatedTopics": ["malware", "privilege-escalation", "lateral-movement"]
            },
            # Privilege Escalation
            {
                "title": "Privilege Escalation",
                "slug": "privilege-escalation",
                "summary": "The process by which attackers exploit system bugs, configurations, or credentials to elevate their permissions from a basic user to system administrator.",
                "category": "Attacks & Threats",
                "difficulty": "Intermediate",
                "mitreId": "TA0004",
                "lastUpdated": "2026-08-11",
                "overview": "Attackers usually gain initial footholds via low-privileged user profiles. To execute advanced tasks—like turning off antivirus, installing backdoors, or installing network taps—they must elevate privileges to local Administrator or SYSTEM (on Windows) or root (on Linux).",
                "howItWorks": "Privilege escalation splits into vertical (increasing authority levels) and horizontal (accessing neighboring users). Attackers exploit local vulnerabilities (like kernel bugs), abuse misconfigured service paths (unquoted service paths), hijack DLL search orders, or look for credentials in cleartext configuration files.",
                "attackFlow": [
                    "Local Recon (e.g., Checking OS version and installed patch numbers)",
                    "Flaw Discovery (e.g., Spotting a service executing with SYSTEM rights and write access)",
                    "Exploitation (e.g., Writing lookalike executable to service directory path)",
                    "Service Trigger (e.g., Restarting service or forcing system reboot)",
                    "Shell Spawn (e.g., Local shell executes with full local Administrator privileges)"
                ],
                "detection": "Audit process execution logs for unusual parent-child relationships (e.g., a low-level service launching cmd.exe), check changes in system configuration files, monitor registry modifications on startup keys, and flag privilege adjustments.",
                "prevention": "Install security updates promptly to patch local kernel exploits. Restrict access to administrative groups, enforce proper file permissions on service executables, disable service restart rights for standard users, and restrict UAC prompts.",
                "tags": ["Permissions", "Exploitation", "Root", "MITRE TA0004"],
                "mitreTechniques": [
                    {"id": "T1068", "name": "Exploitation for Privilege Escalation", "tactic": "Privilege Escalation", "description": "Adversaries may exploit local software vulnerabilities to escalate privileges."}
                ],
                "references": [
                    "MITRE ATT&CK Tactic TA0004: Privilege Escalation",
                    "OWASP Privilege Escalation Prevention Cheat Sheet",
                    "CWE-269: Improper Privilege Management"
                ],
                "relatedTopics": ["powershell", "lateral-movement", "zero-trust"]
            },
            # Data Exfiltration
            {
                "title": "Data Exfiltration",
                "slug": "data-exfiltration",
                "summary": "The unauthorized transfer of sensitive corporate or personal data from target systems to external attacker-controlled endpoints.",
                "category": "Defense & Security",
                "difficulty": "Intermediate",
                "mitreId": "TA0010",
                "lastUpdated": "2026-08-22",
                "overview": "Data exfiltration is the final goal of cyber espionage and double-extortion ransomware schemes. Attackers identify sensitive intellectual property, source code, or personal records, aggregate it into compressed containers, and send it outside the company boundary.",
                "howItWorks": "Adversaries use multiple protocols to exfiltrate data, including standard file transfers (SFTP/FTP), cloud services (MEGA, AWS S3), web uploads (HTTPS POST), or covert paths (such as hiding data inside DNS query payloads or ICMP packets).",
                "attackFlow": [
                    "Data Discovery (e.g., Scanning corporate filesystems for keywords like 'password' or 'SSN')",
                    "Aggregation (e.g., Compressing files into a single password-protected .zip archive)",
                    "Egress Setup (e.g., Establishing connections to cloud storage nodes)",
                    "Data Transmission (e.g., Encrypted transfer via HTTPS or SFTP)",
                    "Confirmation (e.g., Validating archive integrity on receiving system)"
                ],
                "detection": "Monitor large outbound data transfers, detect connections to unauthorized cloud storage providers, look for anomalies in off-hours outbound bandwidth, and analyze spikes in DNS query volumes (indicating DNS exfiltration).",
                "prevention": "Deploy Data Loss Prevention (DLP) agents to block sensitive file writes to USBs or cloud uploads. Enforce TLS interception to scan outgoing HTTPS payloads, block outbound connections on non-standard ports, and monitor endpoint activity.",
                "tags": ["Data Loss", "Network Egress", "Data Leakage", "MITRE TA0010"],
                "mitreTechniques": [
                    {"id": "T1048", "name": "Exfiltration Over Alternative Protocol", "tactic": "Exfiltration", "description": "Adversaries may steal files over other network channels like DNS or FTP."}
                ],
                "references": [
                    "MITRE ATT&CK Tactic TA0010: Exfiltration",
                    "NIST SP 800-53: Security and Privacy Controls (System Information Integrity)",
                    "SANS Guide to Preventing Data Leakage"
                ],
                "relatedTopics": ["command-and-control", "networking", "siem"]
            },
            # Malware
            {
                "title": "Malware Fundamentals",
                "slug": "malware",
                "summary": "An umbrella term for any software intentionally designed to cause disruption, leak information, or gain unauthorized access to computer systems.",
                "category": "Malware",
                "difficulty": "Beginner",
                "mitreId": "T1204",
                "lastUpdated": "2026-08-05",
                "overview": "Malware (malicious software) encompasses various categories, each designed for specific malicious purposes. Unlike early viruses that were designed for disruption, modern malware is created for financial profit, corporate espionage, and state-sponsored sabotage.",
                "howItWorks": "Malware classes include Trojans (disguised as legitimate software), Worms (self-replicating over network paths), RATs (Remote Access Trojans giving attackers mouse and shell controls), and Rootkits (hiding deep inside operating system kernels).",
                "attackFlow": [
                    "Infection Vector (e.g., User opens a macro-enabled invoice sheet)",
                    "Staging (e.g., Script drops small base64 loader file)",
                    "Establish Persistence (e.g., Adding malware path to registry run keys)",
                    "Defense Evasion (e.g., Injecting code into native SVCHost process)",
                    "Payload Execution (e.g., Launching keylogger and capturing keyboard entries)"
                ],
                "detection": "Antivirus and EDR tools use static signatures (file hashes), heuristic analysis (looking for code behaviors), and sandbox execution to flag files containing suspicious APIs (such as VirtualAllocEx or WriteProcessMemory).",
                "prevention": "Deploy Endpoint Detection and Response (EDR) software, restrict program installation capabilities for standard users, implement network firewalls, and maintain system updates to patch vulnerabilities exploited by malware to propagate.",
                "tags": ["Trojan", "Spyware", "Worm", "Rootkit", "MITRE T1204"],
                "mitreTechniques": [
                    {"id": "T1204", "name": "User Execution", "tactic": "Execution", "description": "Adversaries may use user actions like opening attachments to execute scripts."}
                ],
                "references": [
                    "MITRE ATT&CK Technique T1204: User Execution",
                    "SANS Malware Analysis Course Resources",
                    "CVE-2017-0144: EternalBlue Exploit (Worm propagation)"
                ],
                "relatedTopics": ["ransomware", "powershell", "edr"]
            },
            # SQL Injection
            {
                "title": "SQL Injection",
                "slug": "sql-injection",
                "summary": "A vulnerability where an attacker manipulates SQL queries by injecting malicious input, allowing unauthorized database reads and modifications.",
                "category": "Vulnerabilities",
                "difficulty": "Beginner",
                "mitreId": "T1190",
                "lastUpdated": "2026-08-02",
                "overview": "SQL Injection (SQLi) is a critical database vulnerability. It occurs when a web application takes user input and directly concatenates it into a structured SQL command without validation. Attackers exploit this to bypass login screens, expose confidential user records, modify databases, or execute system commands on the host OS.",
                "howItWorks": "If an input box takes `' OR '1'='1`, the database command parses this condition as always true, returning all records in the table. Blind SQLi uses time delays (`pg_sleep` or `sleep`) to infer table values based on server response latency.",
                "attackFlow": [
                    "Vulnerability Discovery (e.g., Inputting `'` in search boxes and observing SQL error responses)",
                    "Query Modification (e.g., Injecting UNION commands to read schemas)",
                    "Database Extraction (e.g., Accessing tables containing user accounts and password hashes)",
                    "Administrative Privilege Bypass (e.g., Injecting true statements into authentication fields)",
                    "Remote Code Execution (e.g., Exploiting database commands like xp_cmdshell to run OS scripts)"
                ],
                "detection": "Web Application Firewalls (WAF) inspect incoming HTTP requests for database keywords like `UNION SELECT`, `OR 1=1`, or specific characters like `--` or `;`. Database auditing tools flag unusual querying speeds or unexpected table joins.",
                "prevention": "Utilize parameterized queries (prepared statements) for all database calls, implement Object Relational Mapping (ORM) frameworks, sanitize and validate all user inputs, and run database engines with least-privilege service profiles.",
                "tags": ["Web Vulnerabilities", "OWASP Top 10", "Database", "CWE-89"],
                "mitreTechniques": [
                    {"id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access", "description": "Adversaries may exploit SQL injections to bypass network boundaries."}
                ],
                "references": [
                    "CWE-89: Improper Neutralization of Special Elements used in an SQL Command",
                    "OWASP Top 10: Injection Flaws",
                    "MITRE ATT&CK Technique T1190: Exploit Public-Facing Application"
                ],
                "relatedTopics": ["vulnerabilities", "cross-site-scripting", "port-scanning"]
            },
            # Cross-Site Scripting
            {
                "title": "Cross-Site Scripting",
                "slug": "cross-site-scripting",
                "summary": "A vulnerability where an attacker injects malicious client-side scripts into web applications to run in the browsers of victim users.",
                "category": "Vulnerabilities",
                "difficulty": "Beginner",
                "mitreId": "T1189",
                "lastUpdated": "2026-07-30",
                "overview": "Cross-Site Scripting (XSS) targets web application users rather than the application server. Attackers inject malicious JavaScript payloads. When a victim's browser renders the page, the script executes, enabling session hijacking (session cookie theft), keylogging, or website defacing.",
                "howItWorks": "XSS has three main forms: Reflected XSS (payload resides in URL query parameters), Stored XSS (payload is saved on the server database, executing for everyone opening the page), and DOM-based XSS (payload is evaluated inside the client-side JavaScript engine).",
                "attackFlow": [
                    "Infiltration (e.g., Submitting comment containing `<script>stealCookie()</script>` to forum)",
                    "Storage (e.g., Web application saves the comment in database)",
                    "Delivery (e.g., Unsuspecting victim opens the forum page)",
                    "Execution (e.g., Victim's browser executes script as part of page load)",
                    "Exfiltration (e.g., Script sends victim's session tokens to attacker's server)"
                ],
                "detection": "WAF filters detect characters like `<script>`, `onload=`, or `onerror=` inside incoming URLs and form fields. Endpoint security scans check outbound cookies for the `HttpOnly` attribute.",
                "prevention": "Perform contextual output encoding of all user inputs before printing them on the page. Implement strict Content Security Policies (CSP) to limit allowed script locations, and set the `HttpOnly` flag on sensitive cookies.",
                "tags": ["Web Vulnerabilities", "OWASP Top 10", "XSS", "CWE-79"],
                "mitreTechniques": [
                    {"id": "T1189", "name": "Drive-by Compromise", "tactic": "Initial Access", "description": "Adversaries may inject malicious script files that run dynamically on visitors' browsers."}
                ],
                "references": [
                    "CWE-79: Improper Neutralization of Input During Web Page Generation",
                    "OWASP XSS Prevention Cheat Sheet",
                    "MITRE ATT&CK Technique T1189: Drive-by Compromise"
                ],
                "relatedTopics": ["vulnerabilities", "sql-injection", "phishing"]
            },
            # SIEM
            {
                "title": "SIEM Systems",
                "slug": "siem",
                "summary": "Security Information and Event Management systems aggregate and analyze security log events across corporate digital infrastructures.",
                "category": "Defense & Security",
                "difficulty": "Beginner",
                "mitreId": "—",
                "lastUpdated": "2026-08-14",
                "overview": "A Security Information and Event Management (SIEM) system is the central nervous system of a Security Operations Center (SOC). It collects log records from firewalls, endpoints, routers, domain controllers, and databases, correlating them to isolate complex attacker behaviors.",
                "howItWorks": "SIEM agents compile logs from remote hosts and normalize them into a uniform structure (e.g., identifying source IP, target IP, username, and event ID). The correlation engine applies rule sets (e.g., 'Trigger alert if user logs in from IP A and then from IP B within 10 minutes') to generate alerts.",
                "attackFlow": [
                    "Log Generation (e.g., Active Directory registers a failed login Event ID 4625)",
                    "Log Collection (e.g., Log agent forwards AD log to SIEM gateway)",
                    "Normalization (e.g., Parsing log into standard JSON schema fields)",
                    "Correlation Analysis (e.g., SIEM triggers rule for 20 failed logins under 1 minute)",
                    "Alert Generation (e.g., SOC analyst receives alert dashboard notification)"
                ],
                "detection": "SIEM relies on configuring quality endpoint telemetry log forwarders (like Sysmon or Winlogbeat) and maintaining updated correlation rules mapped against common MITRE ATT&CK techniques.",
                "prevention": "Regularly tune SIEM alert parameters to minimize alarm fatigue. Ensure log servers are running on isolated subnets, encrypt log data in transit, and enforce strict log retention policies to comply with regulatory standards.",
                "tags": ["Log Aggregation", "Analytics", "Security Operations", "SOC"],
                "mitreTechniques": [],
                "references": [
                    "Gartner SIEM Magic Quadrant Guides",
                    "Splunk Enterprise Security / Elastic Security Documentation",
                    "ISO 27001 Log Management Requirements"
                ],
                "relatedTopics": ["edr", "zero-trust", "data-exfiltration"]
            },
            # EDR
            {
                "title": "Endpoint Detection and Response",
                "slug": "edr",
                "summary": "Security agents deployed on user devices to monitor system processes, file edits, and network connections to block threats.",
                "category": "Defense & Security",
                "difficulty": "Intermediate",
                "mitreId": "—",
                "lastUpdated": "2026-08-10",
                "overview": "Endpoint Detection and Response (EDR) represents the evolution of traditional Antivirus software. While classic AV compares files against signature databases, EDR continually monitors process trees, memory injection, registry edits, and network ports to detect zero-day exploits.",
                "howItWorks": "EDR agents run at the OS kernel level, feeding process telemetry to a cloud platform. If a user spawns a shell that dumps LSASS memory, the EDR engine flags it, alerts the security team, and can automatically isolate the host network adapter.",
                "attackFlow": [
                    "Agent Monitoring (e.g., Agent tracks all process creations on workstation)",
                    "Anomalous Action (e.g., Word document spawns powershell.exe script)",
                    "Telemetry Analysis (e.g., EDR cloud evaluates script behaviors and flags threat)",
                    "Automated Mitigation (e.g., EDR isolates host network interface from subnet)",
                    "Investigation (e.g., SOC analyst reviews process history to trace incident root)"
                ],
                "detection": "EDR specializes in behavioral detection: tracking process parentage (e.g., Apache spawning cmd.exe), detecting unexpected DLL loads, and monitoring memory spaces for signs of cobalt strike beacons.",
                "prevention": "Ensure EDR coverage is deployed across 100% of network assets. Enable active blocking mode rather than alert-only mode, and regularly review endpoint exclusion rules to verify attackers cannot disable sensors.",
                "tags": ["Endpoint Security", "Telemetry", "Threat Hunting", "Active Response"],
                "mitreTechniques": [],
                "references": [
                    "MITRE Engenuity ATT&CK Evaluations (Enterprise Endpoint)",
                    "CrowdStrike Falcon / Microsoft Defender for Endpoint Guides",
                    "SANS Endpoint Detection Architecture Reference"
                ],
                "relatedTopics": ["siem", "malware", "powershell"]
            },
            # Zero Trust
            {
                "title": "Zero Trust Architecture",
                "slug": "zero-trust",
                "summary": "A security framework founded on the core principle of 'never trust, always verify', requiring authentication for all digital resource requests.",
                "category": "Defense & Security",
                "difficulty": "Intermediate",
                "mitreId": "—",
                "lastUpdated": "2026-08-24",
                "overview": "Zero Trust architecture departs from traditional network security that relies on perimeter firewalls. In a Zero Trust environment, no user or device is trusted by default simply because they are inside the corporate network. Every access request is dynamically authenticated, authorized, and encrypted.",
                "howItWorks": "Zero Trust relies on three principles: Verify explicitly (using user identity, location, device health, and service context), use least privileged access (limiting user permissions via Just-In-Time access), and assume breach (segmenting networks to prevent lateral movement).",
                "attackFlow": [
                    "Access Request (e.g., Employee attempts to open corporate finance portal)",
                    "Identity Check (e.g., System requests MFA authentication)",
                    "Device State Check (e.g., Checking if host EDR agent is active and fully updated)",
                    "Authorization Decision (e.g., Evaluating policy rules and granting temporary access)",
                    "Continuous Audit (e.g., Monitor user actions, terminates session on IP change)"
                ],
                "detection": "Implement monitoring around access policy deviations, detect logins from unauthorized devices, and alert on sudden requests for high volumes of distinct network resources.",
                "prevention": "Implement single sign-on (SSO) with risk-based MFA, segment networks into micro-perimeters, replace traditional corporate VPNs with Zero Trust Network Access (ZTNA) gateways, and continuously verify device postures.",
                "tags": ["Architecture", "Identity", "Least Privilege", "Network Segmentation"],
                "mitreTechniques": [],
                "references": [
                    "NIST SP 800-207: Zero Trust Architecture",
                    "CISA Zero Trust Maturity Model Version 2.0",
                    "Microsoft Zero Trust Implementation Resources"
                ],
                "relatedTopics": ["credential-stuffing", "lateral-movement", "siem"]
            }
        ]

        logger.info("Processing and inserting articles...")
        for art in articles_data:
            cat = categories_map[art["category"]]
            a = Article(
                title=art["title"],
                slug=art["slug"],
                summary=art["summary"],
                category_id=cat.id,
                difficulty=art["difficulty"],
                mitre_id=art["mitreId"],
                last_updated=art["lastUpdated"],
                content_overview=art["overview"],
                content_how_it_works=art["howItWorks"],
                content_detection=art["detection"],
                content_prevention=art["prevention"],
                attack_flow=art["attackFlow"],
                related_topics=art["relatedTopics"]
            )
            
            # Tags
            for tag_name in art["tags"]:
                t_slug = tag_name.lower().replace(" ", "-").replace("&", "and")
                tag = db.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name, slug=t_slug)
                    db.add(tag)
                    db.commit()
                a.tags.append(tag)
                
            # MITRE Techniques
            for tech in art["mitreTechniques"]:
                mt = db.query(MitreTechnique).filter(MitreTechnique.technique_id == tech["id"]).first()
                if not mt:
                    mt = MitreTechnique(
                        technique_id=tech["id"],
                        name=tech["name"],
                        tactic=tech["tactic"],
                        description=tech["description"]
                    )
                    db.add(mt)
                    db.commit()
                a.mitre_techniques.append(mt)

            # References
            for ref_title in art["references"]:
                r = Reference(title=ref_title)
                a.references.append(r)
                
            db.add(a)
        db.commit()
        logger.info("Cyber Knowledge Base successfully seeded.")
    except Exception as e:
        logger.error(f"Error seeding Cyber Knowledge Base: {e}")
        db.rollback()


def seed_if_empty(db: Session) -> None:
    """Seed database with synthetic events and default SOAR policies."""
    # Always seed policies first if empty
    seed_soar_policies(db)
    seed_knowledge_base(db)

    count = db.query(SecurityEvent).count()
    if count > 0:
        logger.info("Database already has %d events. Skipping seed.", count)
        return

    logger.info("Database is empty. Generating synthetic data...")
    events = generate_dataset(
        num_days=30,
        normal_per_day=40,
        suspicious_per_day=3,
        brute_force_events=5,
        seed=42,
    )
    logger.info("Generated %d synthetic events. Running pipeline...", len(events))
    result = run_batch_pipeline(events, db)
    logger.info(
        "Seed complete. total=%d anomalies=%d high_risk=%d",
        result["total"],
        result["anomalies"],
        result["high_risk"],
    )
