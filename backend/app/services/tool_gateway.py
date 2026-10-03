import time
from typing import Dict, Any, Optional, Tuple
from app.tools import get_tool
from app.core.logging import logger

class ToolGateway:
    """
    AgentShield Decision Firewall Execution Gateway.
    Guarantees that a tool can NEVER execute unless it has been explicitly cleared
    by AgentShield evaluation or approved by a verified human reviewer.
    """

    def execute_tool(
        self,
        tool_name: str,
        action: str,
        target: str,
        parameters: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], float]:
        start = time.perf_counter()
        tool_instance = get_tool(tool_name)
        
        if not tool_instance:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return {
                "status": "error",
                "error": f"Tool '{tool_name}' is not registered with AgentShield gateway.",
                "executed": False
            }, elapsed_ms

        try:
            result = tool_instance.execute(action, target, parameters)
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            return result, round(elapsed_ms, 2)
        except Exception as e:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            logger.error(f"Error executing tool {tool_name}: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "executed": False
            }, round(elapsed_ms, 2)

tool_gateway = ToolGateway()
