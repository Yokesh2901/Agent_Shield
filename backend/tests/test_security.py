import pytest

def test_unauthorized_access_to_policies(client):
    # Missing auth header
    resp = client.post(
        "/api/policies",
        json={
            "name": "Malicious policy",
            "tool": "database",
            "action": "delete",
            "effect": "ALLOW"
        }
    )
    # Default without auth or with non-admin fails with 403 or 401
    assert resp.status_code in [401, 403]

def test_invalid_jwt_token(client):
    resp = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.jwt.token.signature"}
    )
    assert resp.status_code == 401

def test_privilege_escalation_viewer_cannot_approve(client, viewer_headers, dev_headers):
    # Create action requiring approval
    eval_resp = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "TestAgent",
            "user_id": "usr_dev",
            "tool": "email",
            "action": "send",
            "target": "all",
            "environment": "production",
            "parameters": {"count": 1000}
        }
    )
    action_id = eval_resp.json()["action_id"]

    # VIEWER tries to approve
    resp = client.post(
        f"/api/approvals/{action_id}/approve",
        headers=viewer_headers,
        json={"comments": "Viewer attempting approval"}
    )
    assert resp.status_code == 403

def test_privilege_escalation_developer_cannot_create_policy(client, dev_headers):
    resp = client.post(
        "/api/policies",
        headers=dev_headers,
        json={
            "name": "Dev backdoor policy",
            "tool": "payment",
            "action": "transfer",
            "effect": "ALLOW",
            "priority": 1
        }
    )
    assert resp.status_code == 403

def test_dangerous_action_bypass_fails(client, dev_headers):
    # Propose financial transfer disguised as normal action
    resp = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "StealthAgent",
            "user_id": "usr_dev",
            "tool": "payment",
            "action": "transfer",
            "target": "external.wallet",
            "environment": "production",
            "parameters": {"amount": "100000"}
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "BLOCK"
    assert data["status"] == "BLOCKED"

def test_policy_override_attempts_thwarted(client, dev_headers):
    # Attempting to delete database in production cannot be overridden to ALLOW
    resp = client.post(
        "/api/evaluate",
        headers=dev_headers,
        json={
            "agent_id": "SneakyAgent",
            "user_id": "usr_dev",
            "tool": "database",
            "action": "delete",
            "target": "production.critical_records",
            "environment": "production",
            "parameters": {"force": True, "skip_checks": True}
        }
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "BLOCK"
