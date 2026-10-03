from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class ActionEvaluateRequest(BaseModel):
    agent_id: str = Field(..., example="agent_001")
    user_id: Optional[str] = Field(default="system_operator", example="user_001")
    tool: str = Field(..., example="database")
    action: str = Field(..., example="delete")
    target: str = Field(..., example="production.customer_records")
    environment: str = Field(default="production", example="production")
    parameters: Dict[str, Any] = Field(default_factory=dict)
    auto_execute_if_allowed: Optional[bool] = False

class ActionEvaluateResponse(BaseModel):
    action_id: str
    decision: str  # ALLOW, REVIEW, BLOCK
    risk_score: int
    laya_decision: str
    policy_decision: str
    approval_required: bool
    reasons: List[str]
    laya_details: Optional[Dict[str, Any]] = None
    execution_result: Optional[Dict[str, Any]] = None
    status: str
    execution_time_ms: float

class ActionDetailResponse(BaseModel):
    id: str
    agent_id: str
    user_id: str
    tool: str
    action: str
    target: str
    environment: str
    parameters: Dict[str, Any]
    risk_score: int
    laya_decision: str
    policy_decision: str
    final_decision: str
    approval_required: bool
    status: str
    reasons: List[str]
    laya_details: Dict[str, Any]
    execution_result: Optional[Dict[str, Any]]
    execution_time_ms: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ActionExecuteResponse(BaseModel):
    action_id: str
    status: str
    execution_result: Dict[str, Any]
    message: str
