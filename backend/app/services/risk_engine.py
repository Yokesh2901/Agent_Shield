from typing import Dict, Any, List, Tuple

class RiskEngine:
    """
    AgentShield Transparent Risk Scoring Engine.
    
    Evaluates:
    - Tool sensitivity
    - Action type
    - Environment
    - User role
    - Data sensitivity
    - Affected resources (blast radius)
    - Reversibility
    - External side effects
    - Authentication status
    """

    TOOL_WEIGHTS = {
        "web_search": 10,
        "github": 25,
        "file": 35,
        "email": 55,
        "database": 65,
        "payment": 95,
    }

    ACTION_WEIGHTS = {
        "search": 10,
        "read": 15,
        "list": 15,
        "create_issue": 20,
        "create": 35,
        "update": 55,
        "send": 65,
        "delete": 85,
        "drop": 98,
        "transfer": 95,
        "refund": 70,
    }

    ENV_WEIGHTS = {
        "development": 10,
        "dev": 10,
        "testing": 15,
        "staging": 35,
        "production": 85,
        "prod": 85,
    }

    REVERSIBILITY_WEIGHTS = {
        "reversible": 10,
        "partially_reversible": 50,
        "irreversible": 90,
    }

    def evaluate_risk(
        self,
        tool: str,
        action: str,
        target: str,
        environment: str,
        user_role: str,
        parameters: Dict[str, Any]
    ) -> Tuple[int, str, List[str], Dict[str, Any]]:
        tool_lower = tool.lower()
        action_lower = action.lower()
        env_lower = environment.lower()
        target_lower = target.lower()

        reasons = []
        factors = {}

        # 1. Tool Sensitivity Base
        tool_score = self.TOOL_WEIGHTS.get(tool_lower, 40)
        factors["tool_sensitivity"] = tool_score
        if tool_score >= 80:
            reasons.append(f"Highly sensitive tool: {tool}")

        # 2. Action Destructiveness
        action_score = self.ACTION_WEIGHTS.get(action_lower, 40)
        factors["action_destructiveness"] = action_score
        if action_score >= 80:
            reasons.append(f"Destructive or high-impact action: {action}")

        # 3. Environment Factor
        env_score = self.ENV_WEIGHTS.get(env_lower, 50)
        factors["environment"] = env_score
        if env_score >= 75:
            reasons.append("Production environment target")

        # 4. Target & Data Sensitivity
        data_sensitivity_score = 20
        if any(w in target_lower for w in ["customer", "user", "payment", "credential", "secret", "financial", "pii", "auth"]):
            data_sensitivity_score = 80
            reasons.append("Target contains sensitive customer or financial data")
        elif "internal" in target_lower or "config" in target_lower:
            data_sensitivity_score = 50
        factors["data_sensitivity"] = data_sensitivity_score

        # 5. Blast Radius (Affected resources)
        count = parameters.get("count") or parameters.get("limit") or parameters.get("affected_records") or 1
        try:
            count = int(count)
        except (ValueError, TypeError):
            count = 1

        blast_radius_score = 15
        if count >= 1000:
            blast_radius_score = 90
            reasons.append(f"Mass blast radius ({count} records affected)")
        elif count >= 100:
            blast_radius_score = 60
            reasons.append(f"Elevated blast radius ({count} records affected)")
        factors["blast_radius"] = blast_radius_score

        # 6. Reversibility
        if any(w in action_lower for w in ["delete", "drop", "purge", "transfer"]):
            rev_score = 90
            reasons.append("Irreversible side effect")
        elif any(w in action_lower for w in ["update", "modify", "send"]):
            rev_score = 55
        else:
            rev_score = 10
        factors["reversibility"] = rev_score

        # 7. Role Modifier
        role_modifier = 0
        if user_role == "ADMIN":
            role_modifier = -15
        elif user_role == "VIEWER":
            role_modifier = 25
            reasons.append("Viewer role attempting privileged action")
        elif user_role == "DEVELOPER" and env_lower == "production":
            role_modifier = 15
            reasons.append("Developer attempting production modification")

        # Weighted calculation
        raw_score = (
            (tool_score * 0.25) +
            (action_score * 0.25) +
            (env_score * 0.20) +
            (data_sensitivity_score * 0.15) +
            (blast_radius_score * 0.10) +
            (rev_score * 0.05) +
            role_modifier
        )

        final_score = max(0, min(100, int(round(raw_score))))

        # Determine Risk Level
        if final_score < 30:
            risk_level = "LOW"
        elif final_score < 60:
            risk_level = "MEDIUM"
        elif final_score < 85:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"

        if not reasons:
            reasons.append("Routine operational action within standard bounds")

        return final_score, risk_level, reasons, factors

risk_engine = RiskEngine()
