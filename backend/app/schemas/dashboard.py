from typing import List, Dict, Any
from pydantic import BaseModel

class DashboardStatsResponse(BaseModel):
    total_actions: int
    allowed: int
    human_review: int
    blocked: int
    critical_actions: int
    avg_decision_time_ms: float
    decision_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]
    tool_usage: List[Dict[str, Any]]
    agent_activity: List[Dict[str, Any]]
    timeline_series: List[Dict[str, Any]]
