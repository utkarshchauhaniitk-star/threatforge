# ThreatForge — Security Monitoring & Threat Detection Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-threatforge.vercel.app-10B981?style=flat&logo=vercel)](https://threatforge.vercel.app)
[![CI Pipeline](https://github.com/utkarshchauhaniitk-star/threatforge/actions/workflows/ci.yml/badge.svg)](https://github.com/utkarshchauhaniitk-star/threatforge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.111-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.7-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Language-Python_3.12-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Pytest_%2B_Vitest_Passing-10B981?style=flat&logo=pytest&logoColor=white)](https://docs.pytest.org/)

---

## 1. Project Title & Overview
**ThreatForge** is a full-stack security monitoring, threat detection, and incident response platform designed to simulate modern Security Operations Center (SOC) workflows. It ingests multi-source security telemetry, normalizes heterogeneous log structures into a unified schema, executes explainable rule-based threat correlation mapped to the **MITRE ATT&CK® Framework**, coordinates forensic investigation workflows, and compiles audit-ready incident reports.

- **Developer**: Utkarsh Singh Chauhan (Cybersecurity Student)
- **Live Interface**: [threatforge.vercel.app](https://threatforge.vercel.app)
- **Repository**: [github.com/utkarshchauhaniitk-star/threatforge](https://github.com/utkarshchauhaniitk-star/threatforge)

---

## 2. Professional Project Introduction
In modern security operations, analysts must cut through high volumes of raw log noise to identify genuine adversary activity. ThreatForge provides an accessible, fully interactive defensive security platform where logs are ingested safely, evaluated against documented adversary techniques, and triaged using structured case management workflows. It demonstrates how defensive detection logic, data normalization, and analyst workflows operate end-to-end.

> **Educational & Portfolio Notice**: ThreatForge is built to demonstrate practical security monitoring workflows, detection engineering, and full-stack development. It uses synthetic telemetry and authorized log sets for demonstrations. It is not intended to replace multi-cluster, enterprise-scale SIEM solutions.

---

## 3. Problem Statement
Security teams face immense telemetry volume from identity providers, endpoint detection agents, and network firewalls. Extracting actionable signal from raw noise requires:
1. **Schema Normalization**: Unifying diverse field naming schemes (`src_ip` vs `client_ip`, epoch vs ISO-8601 timestamps).
2. **Explainable Detection Logic**: Avoiding black-box alerts by tying detections directly to documented adversary behaviors (MITRE ATT&CK).
3. **Structured Investigation Lifecycles**: Escalating raw alerts into collaborative cases with timestamped forensic notes, root-cause findings, and status tracking.
4. **Audit Reporting**: Exporting clean, machine-readable summaries for compliance and post-incident review.

---

## 4. Project Objectives
- Ingest heterogeneous log files (JSON and CSV) without crashing on malformed records.
- Standardize multi-source telemetry into a normalized database schema.
- Implement deterministic sliding-window correlation rules mapped to the MITRE ATT&CK matrix.
- Provide a responsive SOC dashboard displaying threat severity metrics, event trends, and top suspicious origins.
- Support a complete case investigation lifecycle with analyst forensic notes and audit report generation.
- Enforce secure coding practices: parameterized queries, strict schema validation, and zero hardcoded secrets.

---

## 5. Features Actually Implemented
- **SOC Operations Center Dashboard**: Real-time KPI counters (Events, Alerts, Open Cases), Recharts event volume timeline, severity distribution charts, and suspicious source IP rankings.
- **Log Ingestion & Normalizer Engine**: Upload interface for structured JSON and CSV files. Automatic field mapping for variations of IP addresses, usernames, and event outcomes. Rejection of malformed entries with detailed error breakdowns.
- **Rule-Based Threat Correlation Engine**:
  1. `RULE-BRUTEFORCE` (**T1110.001**): Detects $\ge 5$ sequential failed authentications within a 15-minute sliding window.
  2. `RULE-SUSP-LOGIN` (**T1078**): Flags credential breakthroughs (success after repeated failures) and targeting of dormant guest/service accounts.
  3. `RULE-SPRAY` (**T1110.003**): Flags single source IPs probing $\ge 3$ distinct accounts with invalid credentials within a 30-minute window.
  4. `RULE-PRIV-ACTION` (**T1078.001**): Catches unauthorized sudo invocations, root escalation failures, and administrative policy modifications.
  5. `RULE-TRAFFIC-BURST` (**T1046**): Identifies $\ge 10$ firewall denials within a 10-minute window indicative of port scanning.
- **Case Investigation Lifecycle**: Single-click escalation from any alert into an active investigation case. Tracks status (`Open` $\to$ `In Progress` $\to$ `Closed`), analyst notes with timestamps, and root-cause findings.
- **Executive Audit Reporting**: Compiles incident summaries, correlated alerts, forensic log samples, and analyst findings into exportable JSON, CSV, and printable PDF views.
- **Demo Telemetry Generator**: Idempotent single-click synthetic log seeding for instant evaluation.

---

## 6. Technology Stack Actually Used
### Backend
- **Framework**: FastAPI 0.111 (Python 3.12)
- **Validation & Settings**: Pydantic v2 & Pydantic-Settings
- **Database & ORM**: SQLAlchemy 2.0 (SQLite for local development, PostgreSQL for production)
- **Log Parsing**: Standard library `csv`, `json`, and `io` with streaming upload safeguards
- **Server**: Uvicorn ASGI Server
- **Testing**: Pytest 8.2 + HTTPX + in-memory SQLite with StaticPool

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS (dark obsidian cybersecurity palette)
- **Visualizations**: Recharts (Area charts, Donut charts)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + JSDOM

---

## 7. Project Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 Raw Security Telemetry Logs                 │
│              (JSON / CSV / Firewalls / Auth)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Upload via REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FastAPI Log Normalizer Engine               │
│  - Field Alias Mapping     - Schema Validation              │
│  - Type Coercion           - Error Isolation & Rejection    │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
    ┌──────────────────────┐       ┌──────────────────────┐
    │  SQLite / PostgreSQL │       │  Threat Detection    │
    │  Normalized Events   │◀──────│  Correlation Engine  │
    └──────────────────────┘       │  (MITRE ATT&CK)      │
               │                   └───────────┬──────────┘
               │                               │ Generates
               ▼                               ▼
    ┌──────────────────────┐       ┌──────────────────────┐
    │  Incident Cases &    │◀──────│    Threat Alerts     │
    │  Analyst Notes       │       │    (Triage Queue)    │
    └──────────┬───────────┘       └──────────────────────┘
               │
               ▼
    ┌─────────────────────────────────────────────────────────┐
    │       Incident Audit Reports (JSON / CSV / Print)       │
    └─────────────────────────────────────────────────────────┘
```

---

## 8. Repository Structure
```
threatforge/
├── .env.example               # Environment variables template
├── .gitignore                  # Git ignore rules (secrets, venv, node_modules)
├── LICENSE                     # MIT License
├── README.md                   # Project documentation
├── render.yaml                 # 1-click cloud deployment blueprint
├── backend/
│   ├── requirements.txt        # Python backend dependencies
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint & router mounts
│   │   ├── api/                # REST API routers (events, alerts, cases, reports)
│   │   ├── core/               # Configuration settings & CORS
│   │   ├── database/           # Database engine & session maker
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic data schemas
│   │   └── services/           # Detection engine, log parser, demo seeder
│   └── tests/                  # Pytest automated test suites (15 tests)
├── frontend/
│   ├── package.json            # Node.js dependencies & scripts
│   ├── vite.config.ts          # Vite build & proxy configuration
│   ├── tailwind.config.js      # Cybersecurity theme configuration
│   ├── src/
│   │   ├── App.tsx             # Route definitions & navigation
│   │   ├── pages/              # Dashboard, Events, Alerts, Cases, Reports, Settings
│   │   ├── components/         # StatCards, charts, modals, tables
│   │   └── services/           # API client services
│   └── tests/                  # Vitest component test suites (6 tests)
├── docs/                       # Architecture, deployment, and detection rule guides
│   ├── architecture.md
│   ├── deployment.md
│   ├── detection-rules.md
│   └── screenshots/            # Actual application interface screenshots
└── sample-logs/                # RFC-compliant synthetic telemetry sample files
    ├── authentication.json
    ├── sample-security-events.json
    └── network-firewall.csv
```

---

## 9. Installation Instructions

### Prerequisites
- **Python**: Version 3.10+ (tested on Python 3.12.9)
- **Node.js**: Version 18+ (tested on Node v24.12.0 with npm 11.6.2)
- macOS, Linux, or Windows (WSL recommended)

### Clone the Repository
```bash
git clone https://github.com/utkarshchauhaniitk-star/threatforge.git
cd threatforge
```

---

## 10. Environment Configuration
Copy the template configuration file:
```bash
cp .env.example .env
```
Default `.env` settings:
```ini
ENVIRONMENT=development
DATABASE_URL=sqlite:///./threatforge.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
HOST=0.0.0.0
PORT=8000
MAX_UPLOAD_SIZE_MB=10
```

---

## 11. How to Run the Backend
```bash
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Backend will run at: `http://localhost:8000`
- Interactive OpenAPI / Swagger docs: `http://localhost:8000/docs`

---

## 12. How to Run the Frontend
In a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
- Frontend will run at: `http://localhost:5173`

---

## 13. How to Use the Application
1. **Explore the Dashboard**: Navigate to `http://localhost:5173`. If starting fresh, click **Load Demo Data** in the top navigation bar to populate sample security events and alerts.
2. **Ingest Custom Logs**: Go to **Security Events** and click **Upload Logs**. Select any valid JSON or CSV log file from `sample-logs/`.
3. **Review Alerts**: Open the **Alerts** tab to inspect triggered detections, severity ratings, MITRE ATT&CK technique IDs, and contributing event counts.
4. **Investigate an Incident**: Click **Investigate** on any high or critical alert to create a new case. Add forensic notes, update the status (`Open` $\to$ `In Progress`), and document root-cause findings.
5. **Generate an Audit Report**: Navigate to **Reports**, select the investigation case, review the compiled executive summary and evidence trail, and export the findings as JSON or CSV.

---

## 14. Screenshots

### SOC Operations Center Dashboard
> Real-time security telemetry, active threat alerts, Recharts event volume timeline, and top suspicious IP rankings.
![SOC Operations Center](docs/screenshots/dashboard.png)

---

### Security Events & Telemetry Ingestion
> Normalized log telemetry with full-text search, multi-factor filters, and CSV/JSON upload modal.
![Security Events](docs/screenshots/events.png)

---

### Threat Alerts & Correlated Evidence
> MITRE ATT&CK correlated detections with sliding-window indicator details, status dropdowns, and case escalation.
![Threat Alerts](docs/screenshots/alerts.png)

---

### Incident Investigation Workspace
> Case details, status workflow, root-cause findings editor, and real-time analyst notes chronology.
![Incident Investigation Workspace](docs/screenshots/investigations.png)

---

### Incident Audit Report
> Executive summary, triggered detection rules, correlated alerts, forensic samples, and one-click JSON/CSV downloads.
![Incident Audit Report](docs/screenshots/reports.png)

---

### Detection Policies & Platform Diagnostics
> Policy management table with MITRE mapping, rule parameter adjustments, and platform health telemetry.
![Detection Policies](docs/screenshots/settings.png)

---

## 15. Testing Instructions

### Run Backend Tests (Pytest)
```bash
cd backend
source .venv/bin/activate
pytest -v tests/
```
**Test Results**: **15 passed** in 0.20s across 5 test suites:
- `test_health_and_stats.py`: Health check and dashboard metrics verification.
- `test_events_and_upload.py`: JSON/CSV parsing, malformed file rejection, and empty payload guards.
- `test_detection_engine.py`: Verification of all 5 MITRE correlation rules (Brute Force, Password Spray, Privileged Activity, Connection Burst, Suspicious Login).
- `test_alerts_investigations_reports.py`: Alert lifecycle, investigation notes, and report compilation.
- `test_e2e_workflow.py`: Complete end-to-end telemetry ingestion to incident report lifecycle.

### Run Frontend Tests (Vitest)
```bash
cd frontend
npm test
```
**Test Results**: **6 passed** in 0.70s across component and page rendering test suites.

### Build Production Assets
```bash
cd frontend
npm run build
```
**Build Result**: Built in 1.39s cleanly with zero errors.

---

## 16. Security Considerations
- **No Active Probing**: ThreatForge strictly ingests logs passively; it does not perform external port scanning, network probing, or vulnerability exploitation.
- **RFC-Compliant Test Data**: All sample datasets utilize documentation-reserved IP addresses (RFC 5737: `198.51.100.0/24`, `203.0.113.0/24`, `192.0.2.0/24`) and fictional identifiers.
- **SQL Injection Prevention**: All database queries are strictly parameterized via SQLAlchemy 2.0 ORM; raw query concatenation is disallowed.
- **Safe File Parsing**: Uploaded logs are processed as structured data streams in memory; uploaded files cannot be executed as server-side scripts.
- **Credential Hygiene**: No API keys, passwords, or production secrets are committed to version control. The repository includes `.env.example` with sanitized placeholders.

---

## 17. Known Limitations
- **Educational Scope**: Designed to model realistic detection engineering and triage workflows; not intended to replace high-throughput, distributed enterprise SIEM clusters (e.g. Splunk, Sentinel).
- **Single-Node Sliding Window**: Correlation queries run against a local relational database rather than distributed stream processing frameworks (e.g., Apache Flink or Kafka).
- **Deterministic Detection**: Detections rely on deterministic, rule-based correlation logic; machine learning anomaly detection is not included.

---

## 18. Future Improvements
- [ ] **Sigma Rule Import**: Support parsing and evaluating open-source Sigma detection rules directly.
- [ ] **Threat Intelligence Enrichment**: Automated lookup of source IPs against public reputation feeds (AbuseIPDB, VirusTotal).
- [ ] **Alert Webhook Notifications**: Webhook dispatch for alert notifications to Discord, Slack, or ticketing systems.
- [ ] **Role-Based Access Control (RBAC)**: Support for multi-user authentication with distinct roles (Tier-1 Analyst, SOC Lead, Incident Responder).
- [ ] **STIX/TAXII Export**: Standardized threat intelligence sharing formats for incident reports.

---

## 19. License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.
