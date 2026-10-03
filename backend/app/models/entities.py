import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="DEVELOPER")  # ADMIN, SECURITY_ANALYST, DEVELOPER, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(50), primary_key=True)  # ADMIN, SECURITY_ANALYST, etc.
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    permissions = Column(JSON, default=list)  # ["evaluate", "approve", "view_audit", ...]

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(100), primary_key=True)  # e.g. "agent_001", "ResearchAgent"
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    agent_type = Column(String(100), default="AUTONOMOUS_WORKER")
    trust_level = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH
    is_active = Column(Boolean, default=True)
    allowed_tools = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class Tool(Base):
    __tablename__ = "tools"

    id = Column(String(100), primary_key=True)  # e.g. "database", "github", "email", "payment"
    name = Column(String(255), nullable=False)
    category = Column(String(100), default="system")
    sensitivity_level = Column(String(50), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    is_simulated = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tool = Column(String(100), nullable=True)        # null matches any tool
    action = Column(String(100), nullable=True)      # null matches any action
    environment = Column(String(50), nullable=True)  # null matches any env
    role = Column(String(50), nullable=True)         # null matches any user role
    condition_expression = Column(JSON, default=dict) # custom attribute matching rules
    effect = Column(String(50), nullable=False)      # ALLOW, HUMAN_REVIEW, BLOCK
    priority = Column(Integer, default=100)          # lower number = higher priority
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentAction(Base):
    __tablename__ = "agent_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_id = Column(String(100), nullable=False, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    tool = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    target = Column(String(255), nullable=False)
    environment = Column(String(50), nullable=False, default="production")
    parameters = Column(JSON, default=dict)
    
    # Decisions & Risk
    risk_score = Column(Integer, nullable=False, default=0)
    laya_decision = Column(String(50), nullable=False)    # ALLOW, REVIEW, BLOCK
    policy_decision = Column(String(50), nullable=False)  # ALLOW, HUMAN_REVIEW, BLOCK
    final_decision = Column(String(50), nullable=False)   # ALLOW, REVIEW, BLOCK
    approval_required = Column(Boolean, default=False)
    
    # State tracking
    status = Column(String(50), default="PENDING_EVALUATION")  # EVALUATED, PENDING_APPROVAL, APPROVED, REJECTED, EXECUTED, BLOCKED, FAILED
    reasons = Column(JSON, default=list)
    laya_details = Column(JSON, default=dict)
    execution_result = Column(JSON, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action_id = Column(String(36), ForeignKey("agent_actions.id"), nullable=False, index=True)
    requested_by = Column(String(100), nullable=False)
    approved_by = Column(String(100), nullable=True)
    status = Column(String(50), default="PENDING")  # PENDING, APPROVED, REJECTED
    comments = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    action = relationship("AgentAction")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action_id = Column(String(36), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_id = Column(String(100), nullable=False, index=True)
    agent_id = Column(String(100), nullable=False, index=True)
    tool = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    target = Column(String(255), nullable=False)
    environment = Column(String(50), nullable=False)
    risk_score = Column(Integer, nullable=False)
    laya_decision = Column(String(50), nullable=False)
    policy_decision = Column(String(50), nullable=False)
    final_decision = Column(String(50), nullable=False)
    approval_required = Column(Boolean, default=False)
    approver = Column(String(100), nullable=True)
    execution_status = Column(String(50), nullable=False)
    execution_time_ms = Column(Float, default=0.0)
    reason = Column(Text, nullable=True)
    client_ip = Column(String(50), nullable=True)
