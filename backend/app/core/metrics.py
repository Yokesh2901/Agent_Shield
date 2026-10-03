from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

# Metrics Definitions
decision_latency_seconds = Histogram(
    "decision_latency_seconds",
    "Time spent evaluating agent action across Laya and Policy engine",
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)

laya_decisions_total = Counter(
    "laya_decisions_total",
    "Total count of decisions emitted by Laya engine",
    ["decision"]  # ALLOW, REVIEW, BLOCK
)

blocked_actions_total = Counter(
    "blocked_actions_total",
    "Total actions blocked by AgentShield firewall",
    ["tool", "reason_category"]
)

review_actions_total = Counter(
    "review_actions_total",
    "Total actions held for human review",
    ["tool"]
)

allowed_actions_total = Counter(
    "allowed_actions_total",
    "Total actions safely allowed for execution",
    ["tool"]
)

tool_execution_total = Counter(
    "tool_execution_total",
    "Total executions dispatched to tool gateway",
    ["tool", "status"]
)

def metrics_response() -> Response:
    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)
