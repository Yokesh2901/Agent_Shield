from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.entities import Policy
from app.core.logging import logger

class PolicyEngine:
    """
    Deterministic Security Policy Engine & Orchestration Layer.
    Combines:
    - Deterministic database-driven policies
    - Hardcoded baseline security invariants (e.g. zero-trust production safeguards)
    - Role-Based Access Control (RBAC) constraints
    - Risk engine scores
    - Laya decision input
    """

    DEFAULT_BASELINE_RULES = [
        {
            "name": "Production Database Deletion Protection",
            "tool": "database",
            "action": "delete",
            "environment": "production",
            "role": None,  # Applies to non-admins
            "effect": "BLOCK",
            "condition": lambda p, u_role: u_role != "ADMIN",
            "reason": "Production database record deletion by non-admin is strictly prohibited."
        },
        {
            "name": "Financial Transfer Block Policy",
            "tool": "payment",
            "action": "transfer",
            "environment": None,
            "role": None,
            "effect": "BLOCK",
            "condition": lambda p, u_role: True,
            "reason": "Direct monetary transfers by autonomous agents are blocked."
        },
        {
            "name": "Production Mass Email Approval Requirement",
            "tool": "email",
            "action": "send",
            "environment": "production",
            "role": None,
            "effect": "HUMAN_REVIEW",
            "condition": lambda p, u_role: int(p.get("count", 1)) >= 100,
            "reason": "Mass marketing email to customer lists requires human operator review."
        },
        {
            "name": "Production Modification Human Review",
            "tool": "database",
            "action": "update",
            "environment": "production",
            "role": None,
            "effect": "HUMAN_REVIEW",
            "condition": lambda p, u_role: True,
            "reason": "Production data modification requires approval."
        }
    ]

    def evaluate_policies(
        self,
        db: Session,
        agent_id: str,
        user_id: str,
        user_role: str,
        tool: str,
        action: str,
        target: str,
        environment: str,
        parameters: Dict[str, Any],
        risk_score: int,
        laya_decision: str,
        laya_approval_required: bool,
        full_automation: bool = False
    ) -> Tuple[str, str, bool, List[str], List[str]]:
        """
        Orchestrates final decision.
        Returns:
            policy_decision: ALLOW | HUMAN_REVIEW | BLOCK
            final_decision: ALLOW | REVIEW | BLOCK
            approval_required: bool
            reasons: List[str]
            triggered_policies: List[str]
        """
        reasons: List[str] = []
        triggered_policies: List[str] = []
        policy_decision = "ALLOW"

        # 1. RBAC Guardrails
        if user_role == "VIEWER" and action.lower() not in ["read", "search", "list", "view", "get"]:
            reasons.append("RBAC Violation: VIEWER role cannot execute mutating operations.")
            return "BLOCK", "BLOCK", False, reasons, ["RBAC_VIEWER_READ_ONLY"]

        # 2. Check Database Custom Policies
        db_policies = (
            db.query(Policy)
            .filter(Policy.is_active == True)
            .order_by(Policy.priority.asc())
            .all()
        )

        for pol in db_policies:
            tool_match = (pol.tool is None) or (pol.tool.lower() == tool.lower())
            action_match = (pol.action is None) or (pol.action.lower() == action.lower())
            env_match = (pol.environment is None) or (pol.environment.lower() == environment.lower())
            role_match = (pol.role is None) or (pol.role.upper() == user_role.upper())

            if tool_match and action_match and env_match and role_match:
                # Custom condition expressions evaluation
                cond = pol.condition_expression or {}
                cond_passed = True
                if "min_count" in cond:
                    cnt = parameters.get("count") or parameters.get("affected_records") or 1
                    try:
                        if int(cnt) < int(cond["min_count"]):
                            cond_passed = False
                    except Exception:
                        pass
                
                if "min_risk" in cond:
                    if risk_score < int(cond["min_risk"]):
                        cond_passed = False

                if cond_passed:
                    triggered_policies.append(pol.name)
                    if pol.effect == "BLOCK":
                        policy_decision = "BLOCK"
                        reasons.append(f"Triggered policy: {pol.name} ({pol.description or 'Execution blocked'})")
                        break
                    elif pol.effect == "HUMAN_REVIEW" and policy_decision != "BLOCK":
                        policy_decision = "HUMAN_REVIEW"
                        reasons.append(f"Triggered policy: {pol.name} ({pol.description or 'Human review required'})")

        # 3. Check Baseline Built-in Safety Invariants
        if policy_decision != "BLOCK":
            for rule in self.DEFAULT_BASELINE_RULES:
                t_match = (rule["tool"] is None) or (rule["tool"].lower() == tool.lower())
                a_match = (rule["action"] is None) or (rule["action"].lower() == action.lower())
                e_match = (rule["environment"] is None) or (rule["environment"].lower() == environment.lower())

                if t_match and a_match and e_match:
                    try:
                        if rule["condition"](parameters, user_role):
                            triggered_policies.append(rule["name"])
                            if rule["effect"] == "BLOCK":
                                policy_decision = "BLOCK"
                                reasons.append(f"Safety Invariant: {rule['reason']}")
                                break
                            elif rule["effect"] == "HUMAN_REVIEW" and policy_decision != "BLOCK":
                                policy_decision = "HUMAN_REVIEW"
                                reasons.append(f"Safety Invariant: {rule['reason']}")
                    except Exception as e:
                        logger.warning(f"Error evaluating rule {rule['name']}: {e}")

        # 4. Orchestrate Final Decision
        # Laya is a structured decision component, NOT the sole security boundary.
        # Priority:
        # 1. Deterministic BLOCK -> Final: BLOCK
        # 2. Risk Score CRITICAL (>= 85) -> Final: BLOCK
        # 3. Deterministic HUMAN_REVIEW -> Final: REVIEW
        # 4. Laya BLOCK -> Final: BLOCK
        # 5. Laya REVIEW or Risk Score HIGH (>= 60) or laya_approval_required -> Final: REVIEW
        # 6. Otherwise -> Final: ALLOW
        
        final_decision: str
        approval_required: bool

        if policy_decision == "BLOCK":
            final_decision = "BLOCK"
            approval_required = False
        elif risk_score >= 85 and laya_decision == "BLOCK":
            final_decision = "BLOCK"
            approval_required = False
            reasons.append("High risk score with model block recommendation")
        elif policy_decision == "HUMAN_REVIEW":
            if full_automation:
                final_decision = "BLOCK" if risk_score >= 50 else "ALLOW"
                approval_required = False
                reasons.append(f"⚡ Full Automation Active: Action automatically {'BLOCKED' if final_decision == 'BLOCK' else 'ALLOWED'} without human intervention.")
            else:
                final_decision = "REVIEW"
                approval_required = True
        elif laya_decision == "BLOCK":
            final_decision = "BLOCK"
            approval_required = False
            reasons.append("Model recommended BLOCK based on safety reasoning")
        elif laya_decision == "REVIEW" or laya_approval_required or risk_score >= 60:
            if full_automation:
                final_decision = "BLOCK" if risk_score >= 50 else "ALLOW"
                approval_required = False
                reasons.append(f"⚡ Full Automation Active: Risk evaluated ({risk_score}/100) and automatically {'BLOCKED' if final_decision == 'BLOCK' else 'ALLOWED'} with zero human delay.")
            else:
                final_decision = "REVIEW"
                approval_required = True
                if laya_decision == "REVIEW":
                    reasons.append("Laya decision engine flagged action for review")
                if risk_score >= 60:
                    reasons.append(f"Elevated risk score ({risk_score}/100)")
        else:
            final_decision = "ALLOW"
            approval_required = False
            if not reasons:
                reasons.append("Action cleared all deterministic policies, RBAC, and Laya evaluations")

        return policy_decision, final_decision, approval_required, reasons, triggered_policies

policy_engine = PolicyEngine()
