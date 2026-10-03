# AgentShield 🛡️

> **A policy-aware security gateway for autonomous AI agents.**
>
> AgentShield evaluates proposed agent tool actions **before execution**, combining risk scoring, deterministic security policies, RBAC, human approval, and Laya-powered decisions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=111)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

---

## Overview

AI agents can now interact with databases, email systems, GitHub repositories, filesystems, APIs, and other high-impact tools. A hallucinated, compromised, prompt-injected, or unauthorized action can therefore create real-world damage.

**AgentShield adds a security decision layer between the agent and its tools.**

```text
User / Goal
    ↓
AI Agent
    ↓
AgentShield Gateway
    ├── Risk Scoring
    ├── Laya Decision Engine
    ├── Deterministic Policies
    └── RBAC / Security Invariants
    ↓
┌─────────┬────────┬─────────┐
│  ALLOW  │ REVIEW │  BLOCK  │
└────┬────┴───┬────┴────┬────┘
     ↓        ↓         ↓
Tool Sandbox  HITL   Action Halt
     └────────┴─────────┐
                        ↓
              Audit Ledger + Metrics
```

> **Core principle: AI can recommend. Security policy decides.**

---

## Key Features

- 🔐 **Pre-Execution Action Firewall** — intercepts tool calls before execution.
- 📊 **Risk Scoring (0–100)** — considers tool sensitivity, destructiveness, environment, blast radius, data sensitivity, and reversibility.
- 🧠 **Laya Integration** — structured `choice`, `score`, and `noul` decision primitives.
- 🧩 **Deterministic Policy Engine** — security rules can override model recommendations.
- 👤 **Human-in-the-Loop Approval** — high-impact actions can require explicit operator approval.
- 🛡️ **RBAC** — `ADMIN`, `SECURITY_ANALYST`, `DEVELOPER`, and `VIEWER` roles.
- 🧪 **Safe Tool Simulators** — database, GitHub, email, file, web-search, and payment simulations.
- 📈 **Prometheus Observability** — decision, latency, approval, blocking, and execution metrics.
- 🧾 **Audit Ledger** — searchable decision traces with JSON inspection and CSV export.
- 🤖 **Agent Simulator** — visualize complete action-governance flows using realistic scenarios.

---

## Why Laya?

AgentShield integrates the official [`laya`](https://pypi.org/project/laya/) Python package.

Laya provides structured model-assisted decisions through:

| Primitive | Purpose |
|---|---|
| `choice` | Classify an action as `ALLOW`, `REVIEW`, or `BLOCK` |
| `score` | Estimate action risk from 0–100 |
| `noul` | Evaluate whether human approval is required |

**Security note:** Laya is not treated as the sole security boundary. Deterministic policies, RBAC, and security invariants retain unconditional override authority.

---

## Example: Blocking a Dangerous Action

An agent proposes deleting thousands of production records:

```json
{
  "agent_id": "DataCleanupAgent",
  "tool": "database",
  "action": "delete",
  "target": "production.customer_records",
  "environment": "production",
  "parameters": { "count": 2481 }
}
```

AgentShield evaluates the action and can return:

```json
{
  "decision": "BLOCK",
  "risk_score": 93,
  "laya_decision": "BLOCK",
  "policy_decision": "BLOCK",
  "status": "BLOCKED",
  "reasons": [
    "Destructive action",
    "Production environment",
    "Large blast radius",
    "Irreversible side effect"
  ]
}
```

The proposed action is stopped before it reaches the tool execution layer.

---

## Demo Scenarios

| Scenario | Tool | Risk | Decision |
|---|---|---:|---|
| Search vulnerability feeds | Web Search | 14 | ✅ ALLOW |
| Read customer profile | Database | 38 | ✅ ALLOW |
| Email 5,000 customers | Email | 76 | 🟡 REVIEW |
| Delete 2,481 production records | Database | 93 | 🔴 BLOCK |
| Transfer $50,000 | Payment | 98 | 🔴 BLOCK |
| Create security repository issue | GitHub | 18 | ✅ ALLOW |

---

## Tech Stack

**Backend:** Python 3.11, FastAPI, Pydantic v2, SQLAlchemy, Alembic, Laya, PyJWT, bcrypt, Prometheus Client

**Database:** PostgreSQL with SQLite fallback for local development/testing

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons

**Infrastructure:** Docker, Docker Compose, Prometheus

---

## Getting Started

### Windows — Quick Start

```powershell
cd D:\Agent_Shield
.\start-dev.ps1
```

The startup script prepares dependencies, initializes demo data, and starts the backend and frontend.

| Service | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| FastAPI Docs | http://127.0.0.1:8000/docs |
| Prometheus | http://localhost:9090 |

### Manual Setup

**Backend:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python backend/seed.py
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**

```powershell
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up --build
```

---

## Configuration

Create a `.env` file in the project root:

```env
PROJECT_NAME="AgentShield"
ENVIRONMENT="development"
DATABASE_URL="sqlite:///./agentshield.db"

SECRET_KEY="change-this-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

LAYA_MODEL_NAME="english"
LAYA_MIN_CONFIDENCE=0.75
LAYA_TIMEOUT_SECONDS=3.0

ENABLE_LLM_FALLBACK=false
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
```

**Never use the example secret in a real deployment.**

---

## API

### Evaluate an Action

```http
POST /api/evaluate
```

```json
{
  "agent_id": "DataCleanupAgent",
  "tool": "database",
  "action": "delete",
  "target": "production.customer_records",
  "environment": "production",
  "parameters": { "count": 2481 }
}
```

### Human Approval

```http
POST /api/approvals/{action_id}/approve
POST /api/approvals/{action_id}/reject
```

### Policy Management

```http
GET  /api/policies
POST /api/policies
```

---

## Security Model

AgentShield follows a defense-in-depth approach:

1. **Zero-Trust Tool Access** — agents should not receive unrestricted access to high-impact tools.
2. **Deterministic Overrides** — critical security invariants can override model output.
3. **Least-Privilege RBAC** — permissions are scoped by role.
4. **Human Approval** — sensitive operations can require explicit authorization.
5. **Auditability** — security decisions are recorded for investigation and review.

---

## Testing

Run the backend test suite:

```powershell
python -m pytest backend/tests -v
```

Coverage includes risk scoring, Laya decisions, policy evaluation, approval workflows, audit services, authentication, RBAC, and dangerous-action bypass prevention.

---

## Project Structure

```text
Agent_Shield/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── seed.py
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.*
├── docker-compose.yml
├── start-dev.ps1
└── README.md
```

---

## Roadmap

- Policy packs for common agent frameworks
- More tool connectors and adapters
- Fine-grained permissions per tool/resource
- Stronger action provenance and trace correlation
- Expanded security evaluation benchmarks
- Production deployment hardening
- Additional agent-framework integrations

---

## Contributing

Contributions, issues, ideas, and security feedback are welcome.

```bash
git checkout -b feature/your-change
git add .
git commit -m "feat: describe your change"
git push origin feature/your-change
```

Then open a pull request.

---

## License

MIT License.

## Author

**Yokesh S.**

Built as an exploration of **AI agent security, policy enforcement, human-in-the-loop governance, and safe tool execution**.
