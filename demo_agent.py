"""
=============================================================================
AgentShield Real-World Integration Demo
=============================================================================
This script demonstrates how an AI agent (built in Python/LangChain/CrewAI)
uses AgentShield as a security firewall before calling real tools.
"""

import sys
import time
import requests

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

AGENTSHIELD_URL = "http://127.0.0.1:8000"

def banner():
    print("\n" + "=" * 65)
    print(" [SHIELD] AGENTSHIELD LIVE INTEGRATION DEMO")
    print("=" * 65)
    print(" Connecting to AgentShield Gateway at:", AGENTSHIELD_URL)
    print("=" * 65 + "\n")

def simulate_agent_action(step_num: int, agent_name: str, tool: str, action: str, target: str, env: str, params: dict):
    print(f"\n--- [STEP {step_num}] AI AGENT PROPOSES ACTION ---")
    print(f" Agent     : {agent_name}")
    print(f" Tool      : {tool}")
    print(f" Action    : {action.upper()} on '{target}'")
    print(f" Env       : {env}")
    print(f" Payload   : {params}")
    print(" [>] Intercepting with AgentShield Gateway...")
    time.sleep(0.5)

    # 1. SEND ACTION TO AGENTSHIELD GATEWAY BEFORE RUNNING
    try:
        response = requests.post(f"{AGENTSHIELD_URL}/api/evaluate", json={
            "agent_id": agent_name,
            "user_id": "live_demo_developer",
            "tool": tool,
            "action": action,
            "target": target,
            "environment": env,
            "parameters": params,
            "auto_execute_if_allowed": True
        }, timeout=5)
    except Exception as e:
        print(f" [ERROR] Connection Error: Is AgentShield backend running on port 8000? {e}")
        return

    if response.status_code != 200:
        print(f" [ERROR] Evaluation failed: {response.text}")
        return

    data = response.json()
    decision = data.get("decision")
    risk_score = data.get("risk_score")
    reasons = data.get("reasons", [])

    # 2. EVALUATE DECISION RETURNED BY AGENTSHIELD
    print(f"\n [DECISION] AGENTSHIELD FIREWALL RESPONSE:")
    print(f"    Decision   : [{'ALLOWED (SAFE)' if decision == 'ALLOW' else 'BLOCKED (STOPPED)'}]")
    print(f"    Risk Score : {risk_score}/100")
    if reasons:
        print(f"    Reasons    : {' | '.join(reasons)}")

    # 3. SAFE EXECUTION DECISION
    if decision == "ALLOW":
        print(f"\n [EXECUTION] SAFE TO EXECUTE: Tool executed automatically by AgentShield Gateway.")
        print(f"    Result     : {data.get('execution_result')}")
    else:
        print(f"\n [BLOCKED] EXECUTION PREVENTED: Tool execution blocked! Zero damage to production data.")

    print("-" * 65)

def main():
    banner()

    # ACTION 1: Safe read operation (Harmless query)
    simulate_agent_action(
        step_num=1,
        agent_name="CustomerSupportBot",
        tool="database",
        action="read",
        target="users.profile_view",
        env="production",
        params={"query": "SELECT name FROM users WHERE id=42"}
    )
    time.sleep(1.0)

    # ACTION 2: Catastrophic deletion attempt (Dangerous hallucination)
    simulate_agent_action(
        step_num=2,
        agent_name="DataCleanupAgent",
        tool="database",
        action="delete",
        target="production.customer_records",
        env="production",
        params={"affected_records": 2481, "drop_table": True}
    )
    time.sleep(1.0)

    # ACTION 3: Unauthorized wire transfer (Critical security violation)
    simulate_agent_action(
        step_num=3,
        agent_name="FinanceEscrowAgent",
        tool="payment",
        action="transfer",
        target="external_wire_escrow_0x992",
        env="production",
        params={"amount": 75000, "currency": "USD"}
    )

    print("\n" + "=" * 65)
    print(" [COMPLETE] DEMO COMPLETED!")
    print(" Now open your browser at: http://localhost:5173")
    print(" Click 'Action History' or 'Overview' to see these 3 live actions logged!")
    print("=" * 65 + "\n")

if __name__ == "__main__":
    main()
