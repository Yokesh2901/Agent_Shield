import json
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger

class LLMFallbackService:
    """
    Optional LLM Fallback (e.g. Ollama or local reasoning model).
    Triggered only when Laya confidence is low or action is ambiguous.
    The deterministic policy engine always overrides LLM reasoning.
    The application continues to work reliably even if no LLM is configured or running.
    """
    async def reason_about_action(
        self,
        tool: str,
        action: str,
        target: str,
        environment: str,
        parameters: Dict[str, Any],
        reasons: list
    ) -> Dict[str, Any]:
        if not settings.ENABLE_LLM_FALLBACK:
            return {
                "used_llm": False,
                "reasoning": "LLM fallback disabled by configuration. Deterministic safety policy applied.",
                "recommendation": "REVIEW"
            }

        prompt = (
            f"You are a security auditor. Evaluate this autonomous agent operation:\n"
            f"Tool: {tool}\nAction: {action}\nTarget: {target}\nEnvironment: {environment}\n"
            f"Parameters: {json.dumps(parameters)}\nCurrent flags: {', '.join(reasons)}\n"
            f"Return JSON with 'recommendation' ('ALLOW', 'REVIEW', 'BLOCK') and 'rationale'."
        )

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "{}")
                    parsed = json.loads(response_text)
                    return {
                        "used_llm": True,
                        "reasoning": parsed.get("rationale", "Ollama evaluated action risk."),
                        "recommendation": parsed.get("recommendation", "REVIEW")
                    }
        except Exception as e:
            logger.info(f"Ollama fallback skipped/unavailable: {e}. Using deterministic safety boundary.")

        return {
            "used_llm": False,
            "reasoning": "Local LLM endpoint unreachable; fell back cleanly to zero-trust safety defaults.",
            "recommendation": "REVIEW"
        }

llm_fallback = LLMFallbackService()
