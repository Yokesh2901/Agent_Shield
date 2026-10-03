from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.entities import AuditLog
from app.core.logging import logger

class AuditService:
    def record_audit(
        self,
        db: Session,
        action_id: str,
        user_id: str,
        agent_id: str,
        tool: str,
        action: str,
        target: str,
        environment: str,
        risk_score: int,
        laya_decision: str,
        policy_decision: str,
        final_decision: str,
        approval_required: bool,
        approver: Optional[str],
        execution_status: str,
        execution_time_ms: float,
        reason: Optional[str] = None,
        client_ip: Optional[str] = None
    ) -> AuditLog:
        audit_entry = AuditLog(
            action_id=action_id,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            agent_id=agent_id,
            tool=tool,
            action=action,
            target=target,
            environment=environment,
            risk_score=risk_score,
            laya_decision=laya_decision,
            policy_decision=policy_decision,
            final_decision=final_decision,
            approval_required=approval_required,
            approver=approver,
            execution_status=execution_status,
            execution_time_ms=execution_time_ms,
            reason=reason,
            client_ip=client_ip
        )
        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)
        logger.info(
            f"Audit recorded for action {action_id}: [{final_decision}] status={execution_status}",
            extra={"action_id": action_id, "agent_id": agent_id, "decision": final_decision}
        )
        return audit_entry

    def get_audit_logs(
        self,
        db: Session,
        tool: Optional[str] = None,
        decision: Optional[str] = None,
        risk_min: Optional[int] = None,
        risk_max: Optional[int] = None,
        agent_id: Optional[str] = None,
        user_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        query = db.query(AuditLog)

        if tool:
            query = query.filter(AuditLog.tool.ilike(f"%{tool}%"))
        if decision:
            query = query.filter(AuditLog.final_decision.ilike(decision))
        if risk_min is not None:
            query = query.filter(AuditLog.risk_score >= risk_min)
        if risk_max is not None:
            query = query.filter(AuditLog.risk_score <= risk_max)
        if agent_id:
            query = query.filter(AuditLog.agent_id.ilike(f"%{agent_id}%"))
        if user_id:
            query = query.filter(AuditLog.user_id.ilike(f"%{user_id}%"))
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)

        return query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()

    def get_audit_by_id(self, db: Session, audit_id: str) -> Optional[AuditLog]:
        return db.query(AuditLog).filter(AuditLog.id == audit_id).first()

    def get_audit_by_action_id(self, db: Session, action_id: str) -> Optional[AuditLog]:
        return db.query(AuditLog).filter(AuditLog.action_id == action_id).first()

audit_service = AuditService()
