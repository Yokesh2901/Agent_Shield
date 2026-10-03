from typing import Dict, Any, List
from collections import defaultdict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db
from app.models.entities import AgentAction
from app.schemas.dashboard import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    actions = db.query(AgentAction).all()
    
    total_actions = len(actions)
    allowed = sum(1 for a in actions if a.final_decision == "ALLOW")
    human_review = sum(1 for a in actions if a.final_decision == "REVIEW")
    blocked = sum(1 for a in actions if a.final_decision == "BLOCK")
    critical_actions = sum(1 for a in actions if a.risk_score >= 85)
    
    avg_decision_time = (
        sum(a.execution_time_ms for a in actions) / total_actions
        if total_actions > 0 else 0.0
    )

    # Decision distribution
    decision_dist = {
        "ALLOW": allowed,
        "REVIEW": human_review,
        "BLOCK": blocked
    }

    # Risk distribution
    risk_dist = {
        "LOW": sum(1 for a in actions if a.risk_score < 30),
        "MEDIUM": sum(1 for a in actions if 30 <= a.risk_score < 60),
        "HIGH": sum(1 for a in actions if 60 <= a.risk_score < 85),
        "CRITICAL": sum(1 for a in actions if a.risk_score >= 85),
    }

    # Tool usage
    tool_counts = defaultdict(int)
    for a in actions:
        tool_counts[a.tool] += 1
    tool_usage = [{"tool": k, "count": v} for k, v in tool_counts.items()]
    tool_usage.sort(key=lambda x: x["count"], reverse=True)

    # Agent activity
    agent_counts = defaultdict(lambda: {"total": 0, "blocked": 0, "allowed": 0, "review": 0})
    for a in actions:
        agent_counts[a.agent_id]["total"] += 1
        if a.final_decision == "BLOCK":
            agent_counts[a.agent_id]["blocked"] += 1
        elif a.final_decision == "REVIEW":
            agent_counts[a.agent_id]["review"] += 1
        else:
            agent_counts[a.agent_id]["allowed"] += 1

    agent_activity = [
        {
            "agent_id": k,
            "total": v["total"],
            "blocked": v["blocked"],
            "allowed": v["allowed"],
            "review": v["review"]
        }
        for k, v in agent_counts.items()
    ]
    agent_activity.sort(key=lambda x: x["total"], reverse=True)

    # Timeline series
    time_series_map = defaultdict(lambda: {"timestamp": "", "ALLOW": 0, "REVIEW": 0, "BLOCK": 0})
    for a in actions:
        # Group by hour / date string
        time_key = a.created_at.strftime("%H:%M") if a.created_at else "00:00"
        time_series_map[time_key]["timestamp"] = time_key
        time_series_map[time_key][a.final_decision] = time_series_map[time_key].get(a.final_decision, 0) + 1

    timeline_series = list(time_series_map.values())
    if not timeline_series:
        timeline_series = [
            {"timestamp": "00:00", "ALLOW": 0, "REVIEW": 0, "BLOCK": 0}
        ]

    return DashboardStatsResponse(
        total_actions=total_actions,
        allowed=allowed,
        human_review=human_review,
        blocked=blocked,
        critical_actions=critical_actions,
        avg_decision_time_ms=round(avg_decision_time, 2),
        decision_distribution=decision_dist,
        risk_distribution=risk_dist,
        tool_usage=tool_usage,
        agent_activity=agent_activity,
        timeline_series=timeline_series
    )
