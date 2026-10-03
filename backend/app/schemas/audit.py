from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: str
    action_id: str
    timestamp: datetime
    user_id: str
    agent_id: str
    tool: str
    action: str
    target: str
    environment: str
    risk_score: int
    laya_decision: str
    policy_decision: str
    final_decision: str
    approval_required: bool
    approver: Optional[str]
    execution_status: str
    execution_time_ms: float
    reason: Optional[str]
    client_ip: Optional[str]

    class Config:
        from_attributes = True

class AuditFilterParams(BaseModel):
    tool: Optional[str] = None
    decision: Optional[str] = None
    risk_min: Optional[int] = None
    risk_max: Optional[int] = None
    agent_id: Optional[str] = None
    user_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
