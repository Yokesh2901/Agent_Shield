from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class PolicyCreate(BaseModel):
    name: str = Field(..., example="Block Production Database Deletion")
    description: Optional[str] = None
    tool: Optional[str] = None
    action: Optional[str] = None
    environment: Optional[str] = None
    role: Optional[str] = None
    condition_expression: Dict[str, Any] = Field(default_factory=dict)
    effect: str = Field(..., example="BLOCK")  # ALLOW, HUMAN_REVIEW, BLOCK
    priority: int = Field(default=100)
    is_active: bool = Field(default=True)

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tool: Optional[str] = None
    action: Optional[str] = None
    environment: Optional[str] = None
    role: Optional[str] = None
    condition_expression: Optional[Dict[str, Any]] = None
    effect: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None

class PolicyResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    tool: Optional[str]
    action: Optional[str]
    environment: Optional[str]
    role: Optional[str]
    condition_expression: Dict[str, Any]
    effect: str
    priority: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
