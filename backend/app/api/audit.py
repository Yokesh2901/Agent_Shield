from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.schemas.audit import AuditLogResponse
from app.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Audit System"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    tool: Optional[str] = None,
    decision: Optional[str] = None,
    risk_min: Optional[int] = None,
    risk_max: Optional[int] = None,
    agent_id: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    return audit_service.get_audit_logs(
        db=db,
        tool=tool,
        decision=decision,
        risk_min=risk_min,
        risk_max=risk_max,
        agent_id=agent_id,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )

@router.get("/{audit_id}", response_model=AuditLogResponse)
def get_audit_detail(audit_id: str, db: Session = Depends(get_db)):
    log_entry = audit_service.get_audit_by_id(db, audit_id)
    if not log_entry:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    return log_entry
