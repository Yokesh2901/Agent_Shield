from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user_optional
from app.models.entities import User
from app.schemas.simulator import AgentGoalRequest, AgentSimulationResponse
from app.services.agent_service import agent_simulator_service

router = APIRouter(prefix="/simulator", tags=["Agent Simulator"])

@router.post("/run", response_model=AgentSimulationResponse)
def run_agent_simulation(
    req: AgentGoalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    user_id = current_user.id if current_user else "simulator_operator"
    user_role = current_user.role if current_user else "DEVELOPER"
    
    result = agent_simulator_service.run_simulation(
        db=db,
        agent_id=req.agent_id,
        goal=req.goal,
        environment=req.environment,
        user_id=user_id,
        user_role=user_role
    )
    return result
