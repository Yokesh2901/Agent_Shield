import sys
import os
from datetime import datetime, timedelta

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal, Base, engine
from app.models.entities import User, Role, Agent, Tool, Policy, AgentAction, Approval, AuditLog
from app.core.security import get_password_hash

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Roles
        print("Seeding roles...")
        roles_data = [
            ("ADMIN", "Full platform administrative authority and policy configuration", ["*"]),
            ("SECURITY_ANALYST", "Security operator: review audit logs and approve/reject actions", ["audit:read", "approvals:write", "actions:read"]),
            ("DEVELOPER", "Developer: create and run simulated agent workloads", ["simulator:run", "evaluate:write", "actions:read"]),
            ("VIEWER", "Read-only auditor with zero modification privileges", ["dashboard:read", "audit:read"])
        ]
        for role_id, desc, perms in roles_data:
            existing_role = db.query(Role).filter(Role.id == role_id).first()
            if not existing_role:
                db.add(Role(id=role_id, name=role_id.replace("_", " ").title(), description=desc, permissions=perms))

        # 2. Seed Users
        print("Seeding users...")
        users_data = [
            ("admin@agentshield.ai", "Sarah Connor (SecOps Chief)", "ADMIN"),
            ("analyst@agentshield.ai", "Alex Vance (Security Analyst)", "SECURITY_ANALYST"),
            ("dev@agentshield.ai", "David Bowman (Lead Agent Engineer)", "DEVELOPER"),
            ("viewer@agentshield.ai", "Rachel Cole (Compliance Auditor)", "VIEWER")
        ]
        default_pwd_hash = get_password_hash("AdminPassword123!")
        created_users = {}
        for email, full_name, role_name in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    email=email,
                    hashed_password=default_pwd_hash,
                    full_name=full_name,
                    role=role_name,
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            created_users[role_name] = user

        # 3. Seed Registered Tools
        print("Seeding tools...")
        tools_data = [
            ("database", "Production & Internal Database Gateway", "storage", "CRITICAL"),
            ("github", "GitHub Code & Issues Gateway", "developer_tools", "MEDIUM"),
            ("email", "Enterprise Communications SMTP Gateway", "communication", "HIGH"),
            ("file", "Host & Virtualized Filesystem Gateway", "filesystem", "HIGH"),
            ("web_search", "External Web Search & Intelligence Sandbox", "research", "LOW"),
            ("payment", "Simulated Financial Transaction Gateway", "finance", "CRITICAL"),
        ]
        for tool_id, name, cat, sens in tools_data:
            if not db.query(Tool).filter(Tool.id == tool_id).first():
                db.add(Tool(id=tool_id, name=name, category=cat, sensitivity_level=sens, is_simulated=True, is_active=True))

        # 4. Seed Registered Agents
        print("Seeding agents...")
        agents_data = [
            ("ResearchAgent", "Performs automated threat intelligence and search queries", "RESEARCHER", "HIGH", ["web_search", "github"]),
            ("SupportAgent", "Automates customer profile inquiries and status reads", "CUSTOMER_SERVICE", "MEDIUM", ["database"]),
            ("MarketingAgent", "Runs promotional campaigns and newsletter notifications", "CAMPAIGN_DISPATCHER", "LOW", ["email", "database"]),
            ("DatabaseCleanupAgent", "Automated cron worker for purging stale records", "MAINTENANCE_WORKER", "LOW", ["database"]),
            ("FinanceAgent", "Automated accounting reconciliation agent", "FINANCIAL_ASSISTANT", "LOW", ["payment", "database"]),
            ("DeveloperAgent", "CI/CD integration agent for repo issue logging", "DEVELOPER_BOT", "HIGH", ["github"])
        ]
        for a_id, desc, a_type, trust, tools in agents_data:
            if not db.query(Agent).filter(Agent.id == a_id).first():
                db.add(Agent(id=a_id, name=a_id, description=desc, agent_type=a_type, trust_level=trust, is_active=True, allowed_tools=tools))

        # 5. Seed Deterministic Policies
        print("Seeding policies...")
        policies_data = [
            ("Block Production Database Deletion for Non-Admins", "database", "delete", "production", "DEVELOPER", {}, "BLOCK", 10),
            ("Block Direct Financial Wire Transfers", "payment", "transfer", None, None, {}, "BLOCK", 1),
            ("Require Human Approval for Mass Marketing Emails", "email", "send", "production", None, {"min_count": 500}, "HUMAN_REVIEW", 20),
            ("Require Approval for Production Database Modifications", "database", "update", "production", None, {}, "HUMAN_REVIEW", 30),
            ("Block Destructive System File Deletions", "file", "delete", "production", None, {}, "BLOCK", 15)
        ]
        for name, tool, action, env, role_req, cond, effect, prio in policies_data:
            if not db.query(Policy).filter(Policy.name == name).first():
                db.add(Policy(
                    name=name,
                    description="Standard AgentShield Zero-Trust Invariant Rule",
                    tool=tool,
                    action=action,
                    environment=env,
                    role=role_req,
                    condition_expression=cond,
                    effect=effect,
                    priority=prio,
                    is_active=True
                ))

        # 6. Seed the 6 Mandatory Demo Scenarios
        print("Seeding demo scenarios...")
        demo_scenarios = [
            # 1. ResearchAgent - Web search (LOW -> ALLOW)
            {
                "agent_id": "ResearchAgent",
                "tool": "web_search",
                "action": "search",
                "target": "CVE-2026-9011 Prompt Injection Advisory",
                "environment": "production",
                "params": {"query": "CVE-2026-9011 mitigations"},
                "risk_score": 14,
                "laya_decision": "ALLOW",
                "policy_decision": "ALLOW",
                "final_decision": "ALLOW",
                "approval_required": False,
                "status": "EXECUTED",
                "reasons": ["Routine operational action within standard bounds", "Read-only research tool sandbox"],
                "exec_result": {"status": "success", "results_count": 2, "simulated": True}
            },
            # 2. SupportAgent - Read customer profile (MEDIUM -> ALLOW)
            {
                "agent_id": "SupportAgent",
                "tool": "database",
                "action": "read",
                "target": "production.customer_profile",
                "environment": "production",
                "params": {"customer_id": "CUST-4412", "limit": 1},
                "risk_score": 38,
                "laya_decision": "ALLOW",
                "policy_decision": "ALLOW",
                "final_decision": "ALLOW",
                "approval_required": False,
                "status": "EXECUTED",
                "reasons": ["Single customer read operation", "Target contains sensitive customer or financial data"],
                "exec_result": {"status": "success", "rows_returned": 1, "simulated": True}
            },
            # 3. MarketingAgent - Send email to 5,000 customers (HIGH -> REVIEW)
            {
                "agent_id": "MarketingAgent",
                "tool": "email",
                "action": "send",
                "target": "production.customer_mailing_list",
                "environment": "production",
                "params": {"count": 5000, "subject": "Quarterly VIP Special Announcement"},
                "risk_score": 76,
                "laya_decision": "REVIEW",
                "policy_decision": "HUMAN_REVIEW",
                "final_decision": "REVIEW",
                "approval_required": True,
                "status": "PENDING_APPROVAL",
                "reasons": ["Mass blast radius (5000 records affected)", "Production environment target", "Triggered policy: Require Human Approval for Mass Marketing Emails"],
                "exec_result": None
            },
            # 4. DatabaseCleanupAgent - Delete production records (CRITICAL -> BLOCK)
            {
                "agent_id": "DatabaseCleanupAgent",
                "tool": "database",
                "action": "delete",
                "target": "production.customer_records",
                "environment": "production",
                "params": {"count": 2481, "criteria": "is_duplicate=true"},
                "risk_score": 93,
                "laya_decision": "BLOCK",
                "policy_decision": "BLOCK",
                "final_decision": "BLOCK",
                "approval_required": False,
                "status": "BLOCKED",
                "reasons": ["Destructive or high-impact action: delete", "Irreversible side effect", "Safety Invariant: Production database record deletion by non-admin is strictly prohibited."],
                "exec_result": None
            },
            # 5. FinanceAgent - Transfer money (CRITICAL -> BLOCK)
            {
                "agent_id": "FinanceAgent",
                "tool": "payment",
                "action": "transfer",
                "target": "acct_escrow_8820",
                "environment": "production",
                "params": {"amount": "50000.00", "currency": "USD"},
                "risk_score": 98,
                "laya_decision": "BLOCK",
                "policy_decision": "BLOCK",
                "final_decision": "BLOCK",
                "approval_required": False,
                "status": "BLOCKED",
                "reasons": ["Highly sensitive tool: payment", "Irreversible side effect", "Safety Invariant: Direct monetary transfers by autonomous agents are blocked."],
                "exec_result": None
            },
            # 6. DeveloperAgent - Create GitHub issue (LOW -> ALLOW)
            {
                "agent_id": "DeveloperAgent",
                "tool": "github",
                "action": "create_issue",
                "target": "org/agent-shield-runtime",
                "environment": "development",
                "params": {"title": "Update docker container security labels", "labels": ["maintenance"]},
                "risk_score": 18,
                "laya_decision": "ALLOW",
                "policy_decision": "ALLOW",
                "final_decision": "ALLOW",
                "approval_required": False,
                "status": "EXECUTED",
                "reasons": ["Routine operational action within standard bounds", "Development environment"],
                "exec_result": {"status": "success", "issue_id": 412, "simulated": True}
            }
        ]

        now = datetime.utcnow()
        for i, s in enumerate(demo_scenarios):
            action_time = now - timedelta(minutes=45 - (i * 7))
            db_action = AgentAction(
                agent_id=s["agent_id"],
                user_id="dev@agentshield.ai",
                tool=s["tool"],
                action=s["action"],
                target=s["target"],
                environment=s["environment"],
                parameters=s["params"],
                risk_score=s["risk_score"],
                laya_decision=s["laya_decision"],
                policy_decision=s["policy_decision"],
                final_decision=s["final_decision"],
                approval_required=s["approval_required"],
                status=s["status"],
                reasons=s["reasons"],
                laya_details={
                    "laya_decision": s["laya_decision"],
                    "confidence": 0.94,
                    "routing": {"model": "english", "repo": "convaiinnovations/laya"},
                    "token_usage": {"total_tokens": 64}
                },
                execution_result=s["exec_result"],
                execution_time_ms=0.85,
                created_at=action_time
            )
            db.add(db_action)
            db.commit()
            db.refresh(db_action)

            # If REVIEW, add Approval queue record
            if s["final_decision"] == "REVIEW":
                approval = Approval(
                    action_id=db_action.id,
                    requested_by="MarketingAgent",
                    status="PENDING",
                    comments=f"Agent requested blast delivery to {s['params'].get('count')} recipients.",
                    created_at=action_time
                )
                db.add(approval)
                db.commit()

            # Record in Audit Log
            audit_log = AuditLog(
                action_id=db_action.id,
                timestamp=action_time,
                user_id="dev@agentshield.ai",
                agent_id=s["agent_id"],
                tool=s["tool"],
                action=s["action"],
                target=s["target"],
                environment=s["environment"],
                risk_score=s["risk_score"],
                laya_decision=s["laya_decision"],
                policy_decision=s["policy_decision"],
                final_decision=s["final_decision"],
                approval_required=s["approval_required"],
                approver=None,
                execution_status=s["status"],
                execution_time_ms=0.85,
                reason="; ".join(s["reasons"]),
                client_ip="127.0.0.1"
            )
            db.add(audit_log)
            db.commit()

        print("Database successfully seeded with roles, users, tools, policies, agents, and demo scenarios.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
