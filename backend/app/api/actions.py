from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user
from app.models.entities import AgentAction, User
from app.schemas.action import ActionDetailResponse, ActionExecuteResponse
from app.services.tool_gateway import tool_gateway
from app.services.audit_service import audit_service
from app.core.metrics import tool_execution_total

router = APIRouter(prefix="/actions", tags=["Actions"])

@router.get("", response_model=List[ActionDetailResponse])
def list_actions(
    tool: Optional[str] = None,
    decision: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(AgentAction)
    if tool:
        query = query.filter(AgentAction.tool == tool)
    if decision:
        query = query.filter(AgentAction.final_decision == decision)
    if status_filter:
        query = query.filter(AgentAction.status == status_filter)
    
    return query.order_by(desc(AgentAction.created_at)).offset(offset).limit(limit).all()

@router.get("/{action_id}", response_model=ActionDetailResponse)
def get_action_detail(action_id: str, db: Session = Depends(get_db)):
    action = db.query(AgentAction).filter(AgentAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action

@router.post("/execute/{action_id}", response_model=ActionExecuteResponse)
def execute_action(
    action_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = db.query(AgentAction).filter(AgentAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    # Enforce decision firewall gate
    if action.final_decision == "BLOCK":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot execute an action blocked by AgentShield policy."
        )

    if action.final_decision == "REVIEW" and action.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action requires human approval before execution. Current status: " + action.status
        )

    if action.status == "EXECUTED":
        return ActionExecuteResponse(
            action_id=action.id,
            status="EXECUTED",
            execution_result=action.execution_result or {},
            message="Action has already been executed."
        )

    # Dispatched to safe Tool Gateway
    result, exec_time = tool_gateway.execute_tool(
        action.tool, action.action, action.target, action.parameters
    )

    action.status = "EXECUTED"
    action.execution_result = result
    action.execution_time_ms = exec_time
    db.commit()

    tool_execution_total.labels(
        tool=action.tool,
        status="success" if result.get("status") == "success" else "error"
    ).inc()

    # Audit execution event
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
        approval_required=action.approval_required,
        approver=current_user.email,
        execution_status="EXECUTED",
        execution_time_ms=exec_time,
        reason="Manual / post-approval dispatch executed"
    )

    return ActionExecuteResponse(
        action_id=action.id,
        status="EXECUTED",
        execution_result=result,
        message=f"Action executed via {action.tool} gateway."
    )
