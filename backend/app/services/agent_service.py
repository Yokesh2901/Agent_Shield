import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.services.risk_engine import risk_engine
from app.services.laya_engine import laya_engine
from app.services.policy_engine import policy_engine
from app.services.tool_gateway import tool_gateway
from app.services.audit_service import audit_service
from app.models.entities import AgentAction, Approval

class AgentSimulatorService:
    """
    Simulates autonomous agent planning based on user goals, generating
    realistic multi-step action sequences and passing each proposed action
    through the complete AgentShield decision firewall.
    """

    def generate_steps_for_goal(self, goal: str, environment: str = "production") -> List[Dict[str, Any]]:
        goal_lower = goal.lower()

        if "clean" in goal_lower or "duplicate" in goal_lower or "customer" in goal_lower:
            return [
                {
                    "step_number": 1,
                    "action_type": "PLANNING_READ",
                    "tool": "database",
                    "action": "read",
                    "target": "customers.duplicates_view",
                    "parameters": {"limit": 100, "filter": "duplicate_email"},
                    "rationale": "Query database to identify candidate duplicate rows"
                },
                {
                    "step_number": 2,
                    "action_type": "LOCAL_ANALYSIS",
                    "tool": "file",
                    "action": "read",
                    "target": "/configs/deduplication_rules.json",
                    "parameters": {"path": "/configs/deduplication_rules.json"},
                    "rationale": "Inspect business deduplication logic rules"
                },
                {
                    "step_number": 3,
                    "action_type": "DESTRUCTIVE_EXECUTION",
                    "tool": "database",
                    "action": "delete",
                    "target": "production.customer_records",
                    "parameters": {"count": 2481, "criteria": "dedup_id IS NOT NULL"},
                    "rationale": "Execute batch deletion of 2,481 customer records"
                }
            ]
        elif "finance" in goal_lower or "transfer" in goal_lower or "money" in goal_lower or "pay" in goal_lower:
            return [
                {
                    "step_number": 1,
                    "action_type": "BALANCE_CHECK",
                    "tool": "database",
                    "action": "read",
                    "target": "accounts.treasury_ledger",
                    "parameters": {"account_id": "ACC-9920"},
                    "rationale": "Verify available treasury balance"
                },
                {
                    "step_number": 2,
                    "action_type": "FUNDS_MOVEMENT",
                    "tool": "payment",
                    "action": "transfer",
                    "target": "vendor.apex_solutions_escrow",
                    "parameters": {"amount": "75000.00", "currency": "USD", "memo": "Quarterly cloud invoice"},
                    "rationale": "Transfer enterprise funds to third-party vendor"
                }
            ]
        elif "marketing" in goal_lower or "email" in goal_lower or "newsletter" in goal_lower or "campaign" in goal_lower:
            return [
                {
                    "step_number": 1,
                    "action_type": "AUDIENCE_QUERY",
                    "tool": "database",
                    "action": "read",
                    "target": "crm.subscribed_leads",
                    "parameters": {"count": 5000},
                    "rationale": "Fetch recipient cohort of active subscribers"
                },
                {
                    "step_number": 2,
                    "action_type": "BLAST_DISPATCH",
                    "tool": "email",
                    "action": "send",
                    "target": "subscribers@enterprise-cohort.org",
                    "parameters": {"count": 5000, "subject": "Exclusive Enterprise Product Announcement"},
                    "rationale": "Dispatch mass promotional email to 5,000 customers"
                }
            ]
        elif "research" in goal_lower or "search" in goal_lower or "investigate" in goal_lower:
            return [
                {
                    "step_number": 1,
                    "action_type": "OPEN_RESEARCH",
                    "tool": "web_search",
                    "action": "search",
                    "target": "latest zero-day CVE advisories",
                    "parameters": {"query": "CVE 2026 agentic attack vectors"},
                    "rationale": "Query security advisory intelligence"
                },
                {
                    "step_number": 2,
                    "action_type": "DEV_TRACKING",
                    "tool": "github",
                    "action": "create_issue",
                    "target": "org/threat-intelligence",
                    "parameters": {"title": "Investigate Agent Prompt Injection Vectors", "labels": ["security"]},
                    "rationale": "Log security vulnerability tracker issue in GitHub"
                }
            ]
        else:
            # Generic multi-step plan
            return [
                {
                    "step_number": 1,
                    "action_type": "INSPECTION",
                    "tool": "database",
                    "action": "read",
                    "target": "system.audit_status",
                    "parameters": {"query": goal},
                    "rationale": "Check current state"
                },
                {
                    "step_number": 2,
                    "action_type": "MODIFICATION",
                    "tool": "database",
                    "action": "update",
                    "target": "system.operational_entities",
                    "parameters": {"goal": goal, "count": 10},
                    "rationale": "Apply agent modifications"
                }
            ]

    def run_simulation(
        self,
        db: Session,
        agent_id: str,
        goal: str,
        environment: str = "production",
        user_id: str = "simulator_operator",
        user_role: str = "DEVELOPER"
    ) -> Dict[str, Any]:
        steps = self.generate_steps_for_goal(goal, environment)
        for s in steps:
            s["environment"] = environment
        evaluated_steps = []

        for step in steps:
            tool = step["tool"]
            action = step["action"]
            target = step["target"]
            params = step["parameters"]

            # 1. Risk Engine
            risk_score, risk_level, risk_reasons, factors = risk_engine.evaluate_risk(
                tool, action, target, environment, user_role, params
            )

            # 2. Laya Decision Engine
            laya_res = laya_engine.evaluate_action(
                agent_id, user_id, tool, action, target, environment, params
            )
            laya_decision = laya_res["laya_decision"]
            laya_needs_approval = laya_res["approval_required"]

            # 3. Policy Engine Orchestration
            policy_dec, final_dec, approval_req, policy_reasons, triggered = policy_engine.evaluate_policies(
                db, agent_id, user_id, user_role, tool, action, target, environment, params,
                risk_score, laya_decision, laya_needs_approval
            )

            all_reasons = list(dict.fromkeys(risk_reasons + policy_reasons))

            # Action Record in DB
            action_id = str(uuid.uuid4())
            db_action = AgentAction(
                id=action_id,
                agent_id=agent_id,
                user_id=user_id,
                tool=tool,
                action=action,
                target=target,
                environment=environment,
                parameters=params,
                risk_score=risk_score,
                laya_decision=laya_decision,
                policy_decision=policy_dec,
                final_decision=final_dec,
                approval_required=approval_req,
                status="EXECUTED" if final_dec == "ALLOW" else ("PENDING_APPROVAL" if final_dec == "REVIEW" else "BLOCKED"),
                reasons=all_reasons,
                laya_details=laya_res,
                execution_time_ms=laya_res.get("latency_ms", 1.0)
            )

            execution_res = None
            if final_dec == "ALLOW":
                execution_res, exec_time = tool_gateway.execute_tool(tool, action, target, params)
                db_action.execution_result = execution_res
                db_action.execution_time_ms = exec_time

            db.add(db_action)

            # If REVIEW, register approval entry
            if final_dec == "REVIEW":
                approval = Approval(
                    action_id=action_id,
                    requested_by=user_id,
                    status="PENDING",
                    comments=f"Automated review flag for agent '{agent_id}' executing '{action}' on '{target}'."
                )
                db.add(approval)

            db.commit()

            # Record in Audit Log
            audit_service.record_audit(
                db=db,
                action_id=action_id,
                user_id=user_id,
                agent_id=agent_id,
                tool=tool,
                action=action,
                target=target,
                environment=environment,
                risk_score=risk_score,
                laya_decision=laya_decision,
                policy_decision=policy_dec,
                final_decision=final_dec,
                approval_required=approval_req,
                approver=None,
                execution_status=db_action.status,
                execution_time_ms=db_action.execution_time_ms,
                reason="; ".join(all_reasons)
            )

            if final_dec == "ALLOW":
                decision_description = f"Approved: Operation '{action}' via tool '{tool}' is a safe, non-destructive call in {environment} with low blast radius (Risk: {risk_score}/100). Executed automatically."
            elif final_dec == "BLOCK":
                decision_description = f"Blocked: Operation '{action}' on '{target}' in {environment} is a high-risk destructive action (Risk: {risk_score}/100). Intercepted and blocked by AgentShield Zero-Trust Firewall to protect data integrity."
            else:
                decision_description = f"Review Required: Operation '{action}' targeting '{target}' in {environment} affects critical business resources (Risk: {risk_score}/100)."

            step_result = dict(step)
            step_result["evaluation"] = {
                "action_id": action_id,
                "risk_score": risk_score,
                "risk_level": risk_level,
                "risk_factors": factors,
                "laya_decision": laya_decision,
                "laya_confidence": laya_res.get("confidence", 0.9),
                "policy_decision": policy_dec,
                "final_decision": final_dec,
                "approval_required": approval_req,
                "reasons": all_reasons,
                "decision_description": decision_description,
                "triggered_policies": triggered,
                "execution_result": execution_res
            }
            evaluated_steps.append(step_result)

        return {
            "agent_id": agent_id,
            "goal": goal,
            "environment": environment,
            "steps": evaluated_steps
        }

agent_simulator_service = AgentSimulatorService()
