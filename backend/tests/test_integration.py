import pytest

def test_evaluate_api_safe_action(client, dev_headers):
    response = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "ResearchAgent",
            "user_id": "usr_dev",
            "tool": "web_search",
            "action": "search",
            "target": "docs",
            "environment": "development",
            "parameters": {"query": "security"},
            "auto_execute_if_allowed": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "ALLOW"
    assert data["status"] == "EXECUTED"
    assert data["execution_result"] is not None

def test_evaluate_api_review_action(client, dev_headers):
    response = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "MarketingAgent",
            "user_id": "usr_dev",
            "tool": "email",
            "action": "send",
            "target": "customers",
            "environment": "production",
            "parameters": {"count": 1000}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "REVIEW"
    assert data["approval_required"] is True
    assert data["status"] == "PENDING_APPROVAL"

def test_evaluate_api_block_action(client, dev_headers):
    response = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "FinanceAgent",
            "user_id": "usr_dev",
            "tool": "payment",
            "action": "transfer",
            "target": "unknown_account",
            "environment": "production",
            "parameters": {"amount": "10000"}
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["decision"] == "BLOCK"
    assert data["status"] == "BLOCKED"

def test_approval_workflow_approve_and_execute(client, dev_headers, analyst_headers):
    # 1. Propose an action requiring review
    eval_resp = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "MaintenanceAgent",
            "user_id": "usr_dev",
            "tool": "database",
            "action": "update",
            "target": "prod.user_settings",
            "environment": "production",
            "parameters": {"count": 5}
        }
    )
    action_id = eval_resp.json()["action_id"]

    # 2. Analyst approves action
    appr_resp = client.post(
        f"/api/approvals/{action_id}/approve",
        headers=analyst_headers,
        json={"comments": "Verified and approved by SecOps"}
    )
    assert appr_resp.status_code == 200
    assert appr_resp.json()["status"] == "APPROVED"

    # 3. Check action detail
    detail = client.get(f"/api/actions/{action_id}", headers=dev_headers).json()
    assert detail["status"] == "APPROVED"

def test_approval_workflow_reject(client, dev_headers, analyst_headers):
    eval_resp = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "MarketingAgent",
            "user_id": "usr_dev",
            "tool": "email",
            "action": "send",
            "target": "all_users",
            "environment": "production",
            "parameters": {"count": 500}
        }
    )
    action_id = eval_resp.json()["action_id"]

    # Reject
    rej_resp = client.post(
        f"/api/approvals/{action_id}/reject",
        headers=analyst_headers,
        json={"comments": "Spam risk too high"}
    )
    assert rej_resp.status_code == 200
    assert rej_resp.json()["status"] == "REJECTED"

def test_execute_action_blocked_forbidden(client, dev_headers):
    eval_resp = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "BadAgent",
            "user_id": "usr_dev",
            "tool": "database",
            "action": "delete",
            "target": "prod.users",
            "environment": "production",
            "parameters": {"count": 100}
        }
    )
    action_id = eval_resp.json()["action_id"]
    
    # Attempting to execute a blocked action must return 403 Forbidden
    exec_resp = client.post(f"/api/actions/execute/{action_id}", headers=dev_headers)
    assert exec_resp.status_code == 403

def test_simulator_workflow(client, dev_headers):
    sim_resp = client.post(
        "/api/simulator/run",
        headers=dev_headers,
        json={
            "agent_id": "DataCleanupAgent",
            "goal": "Clean duplicate customer records in production database",
            "environment": "production"
        }
    )
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert len(sim_data["steps"]) >= 3
    # Step 1: read (ALLOW or REVIEW based on production blast radius)
    assert sim_data["steps"][0]["evaluation"]["final_decision"] in ["ALLOW", "REVIEW"]
    # Step 3: delete in production (BLOCK)
    assert sim_data["steps"][2]["evaluation"]["final_decision"] == "BLOCK"

def test_dashboard_stats_endpoint(client, dev_headers):
    resp = client.get("/api/dashboard/stats", headers=dev_headers)
    assert resp.status_code == 200
    stats = resp.json()
    assert "total_actions" in stats
    assert "decision_distribution" in stats
