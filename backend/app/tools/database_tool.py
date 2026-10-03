from typing import Dict, Any
from app.tools.base import BaseTool

class DatabaseTool(BaseTool):
    name = "database"
    description = "Safe database client simulator intercepting destructive queries"
    category = "storage"

    def execute(self, action: str, target: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        action_lower = action.lower()
        if action_lower in ["read", "select", "query"]:
            limit = parameters.get("limit", 10)
            return {
                "status": "success",
                "simulated": True,
                "action": "read",
                "target": target,
                "rows_returned": limit,
                "data_sample": [
                    {"id": 101, "customer_code": "CUST-9921", "status": "active"},
                    {"id": 102, "customer_code": "CUST-9922", "status": "active"}
                ]
            }
        elif action_lower in ["delete", "drop", "truncate"]:
            count = parameters.get("count", 1)
            return {
                "status": "success",
                "simulated": True,
                "action": "delete",
                "target": target,
                "records_deleted": count,
                "message": f"SIMULATED: Successfully dropped/deleted {count} record(s) from {target}. No real database data was modified."
            }
        elif action_lower in ["update", "insert"]:
            count = parameters.get("count", 1)
            return {
                "status": "success",
                "simulated": True,
                "action": action,
                "target": target,
                "records_affected": count,
                "message": f"SIMULATED: Updated {count} record(s) in {target}."
            }
        return {
            "status": "success",
            "simulated": True,
            "action": action,
            "target": target,
            "message": f"Database action '{action}' executed in simulation sandbox."
        }
