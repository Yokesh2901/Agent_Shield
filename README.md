# AgentShield

> **"AI Agent Security & Action Governance Platform"**  
> *A policy-aware decision firewall that evaluates every proposed autonomous agent action before tool execution.*

---

## 1. Problem Statement

Autonomous AI agents (such as agents powered by AutoGPT, LangChain, CrewAI, MCP, or custom LLM frameworks) increasingly have access to high-impact tools: relational databases, SMTP email servers, GitHub repositories, local and network filesystems, external APIs, and payment systems.

A hallucinated, compromised, prompt-injected, or rogue agent action can cause catastrophic real-world damage—such as dropping production tables, mass-spamming customers with confidential memos, or executing unauthorized financial transfers.

**AgentShield** acts as an **in-line decision firewall** between AI agents and external tools, intercepting proposed actions *prior* to physical execution and arbitrating via a multi-layered security pipeline.

---

## 2. Core Architecture

```
User / Autonomous Goal
       ↓
    AI Agent
       ↓
AgentShield Gateway (Pre-Execution Interceptor)
       ↓
┌──────────────────────────────────────────────┐
│ 1. Transparent Risk Scoring Engine (0-100)   │
│ 2. Laya Decision Engine (Choice, Score, Noul)│
│ 3. Deterministic Security Policies & RBAC    │
└──────────────────────────────────────────────┘
       ↓
┌──────────────┬──────────────────┬────────────┐
│    ALLOW     │   HUMAN REVIEW   │   BLOCK    │
└──────────────┴──────────────────┴────────────┘
       ↓                 ↓              ↓
  Tool Sandbox    Approval Queue   Halt Action
       ↓                 ↓
       └─────────────────┴─────────────────────┐
                                               ↓
                                   Immutable Audit Ledger & Prometheus
```

### Why Laya?

AgentShield integrates the official [`laya`](https://pypi.org/project/laya/) Python package (`laya.Router`). Laya provides fast, structured, typed decision primitives over model forward passes:
1. **`choice`**: Categorizes action risk intent into structured outputs (`ALLOW`, `REVIEW`, `BLOCK`).
2. **`score`**: Calibrated risk level scoring from 0 to 100.
3. **`noul`**: High-confidence binary decision query: *"Does this action require human approval?"*

> **Critical Security Architecture Principle:**  
> **Laya is used as a fast structured decision engine inside the governance pipeline. It is NOT treated as the sole security boundary.**  
> Deterministic security policies, Zero-Trust invariants, and Role-Based Access Control (RBAC) always possess unconditional override authority over model recommendations.

---

## 3. Key Features

- **Pre-Execution Action Firewall**: Every tool call is intercepted and held in memory until cleared by policies and models.
- **Transparent Risk Scoring Engine**: Calculates risk from 0-100 considering tool sensitivity, action destructiveness, target environment (production vs. development), blast radius (affected record count), data sensitivity (PII/financial), and reversibility.
- **Interactive Policy Builder UI**: Create dynamic rules in natural syntax (`IF environment = production AND action = delete THEN effect = BLOCK`) stored in PostgreSQL.
- **Human-in-the-Loop (HITL) Approval Queue**: Operators review and sign off on high-impact actions with comments, immediately creating audit events.
- **Safe Tool Simulators**: 6 sandboxed tools (`DatabaseTool`, `GitHubTool`, `EmailTool`, `FileTool`, `WebSearchTool`, `PaymentToolSimulator`) that prevent destructive real-world side effects.
- **Agent Simulator**: Enter any goal (e.g., *"Clean duplicate customer records"* or *"Transfer vendor funds"*) to visualize the complete 5-stage decision flow.
- **Full Observability**: Real-time Prometheus metrics (`decision_latency_seconds`, `laya_decisions_total`, `blocked_actions_total`, `review_actions_total`, `allowed_actions_total`, `tool_execution_total`).
- **Enterprise RBAC**: Role gates for `ADMIN`, `SECURITY_ANALYST`, `DEVELOPER`, and `VIEWER`.
- **Tamper-Evident Audit Ledger**: Search, filter by date/tool/risk/decision, inspect JSON traces, and export CSVs.

---

## 4. Tech Stack

- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy ORM, Alembic, Laya (0.3.26+), PyJWT, bcrypt, Prometheus Client.
- **Database**: PostgreSQL (with automatic SQLite fallback for local test flexibility).
- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Vite, Recharts, Lucide Icons.
- **DevOps**: Docker, Docker Compose, Prometheus.

---

## 5. Quickstart & Installation

### Windows Development (PowerShell)

1. **Clone and enter directory:**
   ```powershell
   cd d:\Agent_Shield
   ```

2. **Run automatic startup script:**
   ```powershell
   .\start-dev.ps1
   ```
   *This script verifies Python and Node.js runtimes, installs dependencies, runs database seeds and migrations, starts the FastAPI backend at `http://127.0.0.1:8000`, and launches the Vite frontend at `http://localhost:5173`.*

### Manual Step-by-Step Setup

#### Backend Setup:
```powershell
# Create & activate virtual environment (optional)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations and seed default policies and demo data
python backend/seed.py

# Launch FastAPI server
uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

#### Frontend Setup:
```powershell
cd frontend
npm install
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 6. Docker Deployment

To spin up the entire production stack (PostgreSQL + FastAPI + Nginx/React + Prometheus):

```bash
docker-compose up --build
```

- **AgentShield Web Dashboard**: `http://localhost:5173`
- **FastAPI OpenAPI Documentation**: `http://localhost:8000/docs`
- **Prometheus Metrics**: `http://localhost:9090`

---

## 7. Environment Variables

Create a `.env` file in the project root:

```env
PROJECT_NAME="AgentShield"
ENVIRONMENT="development"
DATABASE_URL="sqlite:///./agentshield.db"
# Or PostgreSQL:
# DATABASE_URL="postgresql://agentshield:agentshield_secret_password@localhost:5432/agentshield_db"

SECRET_KEY="agentshield_super_secret_jwt_key_production_grade_32bytes_min"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

LAYA_MODEL_NAME="english"
LAYA_MIN_CONFIDENCE=0.75
LAYA_TIMEOUT_SECONDS=3.0

ENABLE_LLM_FALLBACK=false
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama3.2"
```

---

## 8. Demo Scenarios Seeded in Platform

The database includes 6 real-world scenarios:

| # | Agent | Tool | Action | Risk Level | Laya | Deterministic Policy | Final Decision |
|---|---|---|---|---|---|---|---|
| 1 | `ResearchAgent` | `web_search` | Search CVE vulnerability feeds | **LOW (14)** | ALLOW | Baseline Clear | **ALLOW** |
| 2 | `SupportAgent` | `database` | Read single customer profile | **MEDIUM (38)** | ALLOW | Baseline Clear | **ALLOW** |
| 3 | `MarketingAgent` | `email` | Blast email to 5,000 customers | **HIGH (76)** | REVIEW | Mass Email Approval Rule | **REVIEW (Approval Required)** |
| 4 | `DatabaseCleanupAgent` | `database` | Delete 2,481 customer records | **CRITICAL (93)** | BLOCK | Prod Deletion Prohibited | **BLOCK** |
| 5 | `FinanceAgent` | `payment` | Transfer $50,000 to escrow | **CRITICAL (98)** | BLOCK | Financial Transfer Block | **BLOCK** |
| 6 | `DeveloperAgent` | `github` | Create issue in security repo | **LOW (18)** | ALLOW | Baseline Clear | **ALLOW** |

---

## 9. API Reference

### 1. Intercept & Evaluate Action
`POST /api/evaluate`

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

**Response:**
```json
{
  "action_id": "9fdf2ebe-3008-41d0-b959-346b6e5174e7",
  "decision": "BLOCK",
  "risk_score": 93,
  "laya_decision": "BLOCK",
  "policy_decision": "BLOCK",
  "approval_required": false,
  "reasons": [
    "Destructive or high-impact action: delete",
    "Production environment target",
    "Mass blast radius (2481 records affected)",
    "Irreversible side effect",
    "Safety Invariant: Production database record deletion by non-admin is strictly prohibited."
  ],
  "status": "BLOCKED",
  "execution_time_ms": 1.45
}
```

### 2. Human Review Sign-Off
- `POST /api/approvals/{action_id}/approve`: Approves and automatically triggers safe execution.
- `POST /api/approvals/{action_id}/reject`: Rejects the requested action with audit trail.

### 3. Policy Management
- `GET /api/policies`: Retrieve active rules.
- `POST /api/policies`: Create a new custom rule (Admin only).

---

## 10. Automated Testing

AgentShield features an automated test suite spanning unit tests, integration tests, and security tests:

```powershell
python -m pytest backend/tests -v
```

**Results:**
- **Unit Tests**: Risk engine weights, Laya choice/score/noul primitives, policy overrides, audit service.
- **Integration Tests**: Evaluation lifecycle, approval and rejection flows, simulation pipelines, dashboard metrics.
- **Security Tests**: RBAC privilege escalation prevention, JWT rejection, dangerous action bypass prevention, policy override attempts.
- **Total**: 26 passed tests with 100% success rate.

---

## 11. Security Architecture & Threat Model

1. **Zero-Trust Tool Isolation**: Tools only execute after passing through the AgentShield gateway. Direct agent tool invocation is prohibited.
2. **Deterministic Overrides**: Models are susceptible to prompt injection or hallucination. Deterministic security invariants guarantee that sensitive actions (e.g. database drops or wire transfers) cannot be authorized by model confidence alone.
3. **Role-Based Controls**:
   - `ADMIN`: Full configuration and approval rights.
   - `SECURITY_ANALYST`: Inspect audit traces and approve/reject pending reviews.
   - `DEVELOPER`: Launch agent simulation runs and propose actions.
   - `VIEWER`: Read-only access to dashboard statistics; mutating actions are blocked.

---

## License

MIT License. Designed and engineered for production AI safety.
