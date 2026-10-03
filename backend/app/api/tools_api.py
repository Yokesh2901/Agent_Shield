from typing import Dict, Any, List
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.entities import Tool, Agent
from app.tools import get_tool

router = APIRouter(tags=["Tools & Simulators"])

@router.get("/api/tools")
def list_registered_tools(db: Session = Depends(get_db)):
    return db.query(Tool).filter(Tool.is_active == True).all()

@router.get("/api/agents")
def list_registered_agents(db: Session = Depends(get_db)):
    return db.query(Agent).filter(Agent.is_active == True).all()

# Direct simulated tool test endpoints (protected simulation sandboxes)
@router.post("/tools/github/search")
def tool_github_search(payload: Dict[str, Any] = Body(default_factory=dict)):
    tool = get_tool("github")
    return tool.execute("search", payload.get("repo", "agent-shield"), payload)

@router.post("/tools/email/send")
def tool_email_send(payload: Dict[str, Any] = Body(default_factory=dict)):
    tool = get_tool("email")
    return tool.execute("send", payload.get("recipient", "customers@domain.com"), payload)

@router.post("/tools/database/read")
def tool_database_read(payload: Dict[str, Any] = Body(default_factory=dict)):
    tool = get_tool("database")
    return tool.execute("read", payload.get("table", "customers"), payload)

@router.post("/tools/database/delete")
def tool_database_delete(payload: Dict[str, Any] = Body(default_factory=dict)):
    tool = get_tool("database")
    return tool.execute("delete", payload.get("table", "customers"), payload)

@router.post("/tools/files/delete")
def tool_files_delete(payload: Dict[str, Any] = Body(default_factory=dict)):
    tool = get_tool("file")
    return tool.execute("delete", payload.get("path", "/data/records.csv"), payload)

@router.post("/tools/payment/transfer")
def tool_payment_transfer(payload: Dict[str, Any] = Body(default_factory=dict)):
    tool = get_tool("payment")
    return tool.execute("transfer", payload.get("recipient", "vendor_account"), payload)
