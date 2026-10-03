from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AgentGoalRequest(BaseModel):
    agent_id: str = Field(default="DataCleanupAgent", example="DataCleanupAgent")
    goal: str = Field(..., example="Clean duplicate customer records in production database")
    environment: str = Field(default="production", example="production")

class SimulatedActionStep(BaseModel):
    step_number: int
    action_type: str
    tool: str
    action: str
    target: str
    environment: str
    parameters: Dict[str, Any]
    evaluation: Optional[Dict[str, Any]] = None

class AgentSimulationResponse(BaseModel):
    agent_id: str
    goal: str
    environment: str
    steps: List[SimulatedActionStep]
