from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.api.deps import get_db, RequireRole
from app.models.entities import Policy, User
from app.schemas.policy import PolicyCreate, PolicyUpdate, PolicyResponse

router = APIRouter(prefix="/policies", tags=["Policies"])

admin_only = RequireRole(["ADMIN"])

@router.get("", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    return db.query(Policy).order_by(Policy.priority.asc()).all()

@router.post("", response_model=PolicyResponse)
def create_policy(
    policy_in: PolicyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    policy = Policy(
        name=policy_in.name,
        description=policy_in.description,
        tool=policy_in.tool,
        action=policy_in.action,
        environment=policy_in.environment,
        role=policy_in.role,
        condition_expression=policy_in.condition_expression,
        effect=policy_in.effect.upper(),
        priority=policy_in.priority,
        is_active=policy_in.is_active
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy

@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(
    policy_id: str,
    policy_in: PolicyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    if policy_in.name is not None:
        policy.name = policy_in.name
    if policy_in.description is not None:
        policy.description = policy_in.description
    if policy_in.tool is not None:
        policy.tool = policy_in.tool
    if policy_in.action is not None:
        policy.action = policy_in.action
    if policy_in.environment is not None:
        policy.environment = policy_in.environment
    if policy_in.role is not None:
        policy.role = policy_in.role
    if policy_in.condition_expression is not None:
        policy.condition_expression = policy_in.condition_expression
    if policy_in.effect is not None:
        policy.effect = policy_in.effect.upper()
    if policy_in.priority is not None:
        policy.priority = policy_in.priority
    if policy_in.is_active is not None:
        policy.is_active = policy_in.is_active

    db.commit()
    db.refresh(policy)
    return policy

@router.delete("/{policy_id}")
def delete_policy(
    policy_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_only)
):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    db.delete(policy)
    db.commit()
    return {"status": "success", "message": f"Policy {policy_id} deleted"}
