from typing import Dict
from app.tools.base import BaseTool
from app.tools.github_tool import GitHubTool
from app.tools.email_tool import EmailTool
from app.tools.database_tool import DatabaseTool
from app.tools.file_tool import FileTool
from app.tools.web_search_tool import WebSearchTool
from app.tools.payment_tool import PaymentToolSimulator

TOOL_REGISTRY: Dict[str, BaseTool] = {
    "github": GitHubTool(),
    "email": EmailTool(),
    "database": DatabaseTool(),
    "file": FileTool(),
    "web_search": WebSearchTool(),
    "payment": PaymentToolSimulator(),
}

def get_tool(tool_name: str) -> BaseTool:
    return TOOL_REGISTRY.get(tool_name.lower())

__all__ = [
    "BaseTool",
    "GitHubTool",
    "EmailTool",
    "DatabaseTool",
    "FileTool",
    "WebSearchTool",
    "PaymentToolSimulator",
    "TOOL_REGISTRY",
    "get_tool"
]
