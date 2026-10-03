import time
import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user_optional
from app.models.entities import AgentAction, Approval, User
from app.schemas.action import ActionEvaluateRequest, ActionEvaluateResponse
from app.services.risk_engine import risk_engine
from app.services.laya_engine import laya_engine
from app.services.policy_engine import policy_engine
from app.services.tool_gateway import tool_gateway
from app.services.audit_service import audit_service
from app.core.metrics import (
    decision_latency_seconds,
    laya_decisions_total,
    blocked_actions_total,
    review_actions_total,
    allowed_actions_total,
    tool_execution_total
)

router = APIRouter(tags=["Evaluation"])

@router.post("/evaluate", response_model=ActionEvaluateResponse)
def evaluate_action(
    req: ActionEvaluateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    start_eval = time.perf_counter()
    user_role = current_user.role if current_user else "DEVELOPER"
    user_id = req.user_id or (current_user.id if current_user else "anon_user")

    # 1. Evaluate Risk Engine
    risk_score, risk_level, risk_reasons, factors = risk_engine.evaluate_risk(
        tool=req.tool,
        action=req.action,
        target=req.target,
        environment=req.environment,
        user_role=user_role,
        parameters=req.parameters
    )

    # 2. Evaluate Laya Decision Engine
    laya_result = laya_engine.evaluate_action(
        agent_id=req.agent_id,
        user_id=user_id,
        tool=req.tool,
        action=req.action,
        target=req.target,
        environment=req.environment,
        parameters=req.parameters
    )
    laya_dec = laya_result["laya_decision"]
    laya_approval = laya_result["approval_required"]
    laya_decisions_total.labels(decision=laya_dec).inc()

    # 3. Policy Engine Orchestration (Laya + Deterministic Policies + RBAC)
    policy_dec, final_dec, approval_req, policy_reasons, triggered = policy_engine.evaluate_policies(
        db=db,
        agent_id=req.agent_id,
        user_id=user_id,
        user_role=user_role,
        tool=req.tool,
        action=req.action,
        target=req.target,
        environment=req.environment,
        parameters=req.parameters,
        risk_score=risk_score,
        laya_decision=laya_dec,
        laya_approval_required=laya_approval
    )

    all_reasons = list(dict.fromkeys(risk_reasons + policy_reasons))

    # Metric tracking
    if final_dec == "BLOCK":
        blocked_actions_total.labels(tool=req.tool, reason_category=all_reasons[0] if all_reasons else "policy").inc()
    elif final_dec == "REVIEW":
        review_actions_total.labels(tool=req.tool).inc()
    else:
        allowed_actions_total.labels(tool=req.tool).inc()

    # Determine status & execute if allowed and requested
    action_id = str(uuid.uuid4())
    execution_result = None
    exec_time = 0.0

    if final_dec == "ALLOW":
        status_val = "EXECUTED" if req.auto_execute_if_allowed else "EVALUATED"
        if req.auto_execute_if_allowed:
            execution_result, exec_time = tool_gateway.execute_tool(req.tool, req.action, req.target, req.parameters)
            tool_execution_total.labels(tool=req.tool, status="success" if execution_result.get("status") == "success" else "error").inc()
    elif final_dec == "REVIEW":
        status_val = "PENDING_APPROVAL"
    else:
        status_val = "BLOCKED"

    total_latency_ms = (time.perf_counter() - start_eval) * 1000.0
    decision_latency_seconds.observe(total_latency_ms / 1000.0)

    # Persist Action Record
    db_action = AgentAction(
        id=action_id,
        agent_id=req.agent_id,
        user_id=user_id,
        tool=req.tool,
        action=req.action,
        target=req.target,
        environment=req.environment,
        parameters=req.parameters,
        risk_score=risk_score,
        laya_decision=laya_dec,
        policy_decision=policy_dec,
        final_decision=final_dec,
        approval_required=approval_req,
        status=status_val,
        reasons=all_reasons,
        laya_details=laya_result,
        execution_result=execution_result,
        execution_time_ms=round(exec_time or total_latency_ms, 2)
    )
    db.add(db_action)

    # If Human Review, persist in Approvals queue
    if final_dec == "REVIEW":
        approval = Approval(
            action_id=action_id,
            requested_by=user_id,
            status="PENDING",
            comments=f"Action '{req.action}' on '{req.target}' flagged for operator sign-off."
        )
        db.add(approval)

    db.commit()

    # Record in Audit Log
    client_ip = request.client.host if request.client else "127.0.0.1"
    audit_service.record_audit(
        db=db,
        action_id=action_id,
        user_id=user_id,
        agent_id=req.agent_id,
        tool=req.tool,
        action=req.action,
        target=req.target,
        environment=req.environment,
        risk_score=risk_score,
        laya_decision=laya_dec,
        policy_decision=policy_dec,
        final_decision=final_dec,
        approval_required=approval_req,
        approver=None,
        execution_status=status_val,
        execution_time_ms=round(total_latency_ms, 2),
        reason="; ".join(all_reasons),
        client_ip=client_ip
    )

    return ActionEvaluateResponse(
        action_id=action_id,
        decision=final_dec,
        risk_score=risk_score,
        laya_decision=laya_dec,
        policy_decision=policy_dec,
        approval_required=approval_req,
        reasons=all_reasons,
        laya_details=laya_result,
        execution_result=execution_result,
        status=status_val,
        execution_time_ms=round(total_latency_ms, 2)
    )
