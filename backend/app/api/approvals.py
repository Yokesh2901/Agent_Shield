from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user, get_current_user_optional, RequireRole
from app.models.entities import Approval, AgentAction, User
from app.schemas.approval import ApprovalActionRequest, ApprovalResponse
from app.services.audit_service import audit_service
from app.services.tool_gateway import tool_gateway

router = APIRouter(prefix="/approvals", tags=["Human Approvals"])

# RBAC: Only ADMIN and SECURITY_ANALYST can review actions
can_review = RequireRole(["ADMIN", "SECURITY_ANALYST"])

@router.get("", response_model=List[ApprovalResponse])
def list_approvals(
    status_filter: Optional[str] = "PENDING",
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Approval).options(joinedload(Approval.action))
    if status_filter:
        query = query.filter(Approval.status == status_filter)
    return query.order_by(desc(Approval.created_at)).limit(limit).all()

@router.post("/{action_id}/approve", response_model=ApprovalResponse)
def approve_action(
    action_id: str,
    req: ApprovalActionRequest = ApprovalActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(can_review)
):
    approval = db.query(Approval).filter(Approval.action_id == action_id).first()
    action = db.query(AgentAction).filter(AgentAction.id == action_id).first()

    if not action:
        raise HTTPException(status_code=404, detail="Target action not found")

    if not approval:
        # Create approval record if not already existing
        approval = Approval(
            action_id=action_id,
            requested_by=action.user_id,
            status="PENDING"
        )
        db.add(approval)

    approval.status = "APPROVED"
    approval.approved_by = current_user.email
    approval.comments = req.comments or f"Approved by operator {current_user.email}"
    approval.reviewed_at = datetime.utcnow()

    # Automatically execute tool safely now that human approved
    exec_result, exec_time = tool_gateway.execute_tool(
        action.tool, action.action, action.target, action.parameters
    )

    action.status = "APPROVED"
    action.execution_result = exec_result
    action.execution_time_ms = exec_time
    db.commit()
    db.refresh(approval)

    # Record in Audit Log
    audit_service.record_audit(
        db=db,
        action_id=action.id,
        user_id=action.user_id,
        agent_id=action.agent_id,
        tool=action.tool,
        action=action.action,
        target=action.target,
        environment=action.environment,
        risk_score=action.risk_score,
        laya_decision=action.laya_decision,
        policy_decision=action.policy_decision,
        final_decision=action.final_decision,
        approval_required=True,
        approver=current_user.email,
        execution_status="APPROVED_AND_EXECUTED",
        execution_time_ms=exec_time,
        reason=f"Human Approved: {approval.comments}"
    )

    return approval

@router.post("/{action_id}/reject", response_model=ApprovalResponse)
def reject_action(
    action_id: str,
    req: ApprovalActionRequest = ApprovalActionRequest(),
    db: Session = Depends(get_db),
    current_user: User = Depends(can_review)
):
    approval = db.query(Approval).filter(Approval.action_id == action_id).first()
    action = db.query(AgentAction).filter(AgentAction.id == action_id).first()

    if not action:
        raise HTTPException(status_code=404, detail="Target action not found")

    if not approval:
        approval = Approval(
            action_id=action_id,
            requested_by=action.user_id,
            status="PENDING"
        )
        db.add(approval)

    approval.status = "REJECTED"
    approval.approved_by = current_user.email
    approval.comments = req.comments or f"Rejected by operator {current_user.email}"
    approval.reviewed_at = datetime.utcnow()

    action.status = "REJECTED"
    db.commit()
    db.refresh(approval)

    # Record in Audit Log
    audit_service.record_audit(
        db=db,
        action_id=action.id,
        user_id=action.user_id,
        agent_id=action.agent_id,
        tool=action.tool,
        action=action.action,
        target=action.target,
        environment=action.environment,
        risk_score=action.risk_score,
        laya_decision=action.laya_decision,
        policy_decision=action.policy_decision,
        final_decision=action.final_decision,
        approval_required=True,
        approver=current_user.email,
        execution_status="REJECTED",
        execution_time_ms=0.0,
        reason=f"Human Rejected: {approval.comments}"
    )

    return approval

@router.post("/auto-resolve-all")
def auto_resolve_all_approvals(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Autonomous Security Guard: Automatically resolves all pending review items.
    Dangerous actions are auto-blocked; safe actions are auto-approved. Zero human intervention needed.
    """
    pending = db.query(Approval).options(joinedload(Approval.action)).filter(Approval.status == "PENDING").all()
    resolved_count = 0
    auto_blocked = 0
    auto_approved = 0

    for appr in pending:
        act = appr.action
        is_risky = (act.risk_score >= 50) if act else True

        if is_risky:
            appr.status = "REJECTED"
            appr.approved_by = "AutonomousSecurityBot"
            appr.comments = "⚡ Auto-Blocked by Autonomous Zero-Trust Shield (High Risk / Destructive)"
            appr.reviewed_at = datetime.utcnow()
            if act:
                act.status = "REJECTED"
            auto_blocked += 1
        else:
            appr.status = "APPROVED"
            appr.approved_by = "AutonomousSecurityBot"
            appr.comments = "⚡ Auto-Approved by Autonomous Sandbox (Within Safe Tolerance)"
            appr.reviewed_at = datetime.utcnow()
            if act:
                act.status = "APPROVED"
                exec_result, exec_time = tool_gateway.execute_tool(act.tool, act.action, act.target, act.parameters)
                act.execution_status = "EXECUTED"
            auto_approved += 1

        resolved_count += 1

    db.commit()
    return {
        "status": "success",
        "total_resolved": resolved_count,
        "auto_blocked": auto_blocked,
        "auto_approved": auto_approved,
        "mode": "FULL_AUTOMATION"
    }
