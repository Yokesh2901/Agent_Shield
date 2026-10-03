from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.action import ActionDetailResponse

class ApprovalActionRequest(BaseModel):
    comments: Optional[str] = Field(None, example="Approved following change request CR-9402")

class ApprovalResponse(BaseModel):
    id: str
    action_id: str
    requested_by: str
    approved_by: Optional[str]
    status: str
    comments: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    action: Optional[ActionDetailResponse] = None

    class Config:
        from_attributes = True
