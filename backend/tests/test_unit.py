import pytest
from app.services.risk_engine import risk_engine
from app.services.laya_engine import laya_engine
from app.services.policy_engine import policy_engine
from app.services.audit_service import audit_service
from app.models.entities import Policy

def test_risk_engine_low_risk():
    score, level, reasons, factors = risk_engine.evaluate_risk(
        tool="web_search",
        action="search",
        target="documentation",
        environment="development",
        user_role="DEVELOPER",
        parameters={"query": "python fastapi"}
    )
    assert score < 30
    assert level == "LOW"
    assert "Routine operational action" in reasons[0]

def test_risk_engine_critical_database_delete():
    score, level, reasons, factors = risk_engine.evaluate_risk(
        tool="database",
        action="delete",
        target="production.customer_records",
        environment="production",
        user_role="DEVELOPER",
        parameters={"count": 5000}
    )
    assert score >= 85
    assert level == "CRITICAL"
    assert any("Destructive" in r for r in reasons)
    assert any("Mass blast radius" in r for r in reasons)

def test_risk_engine_blast_radius():
    score_small, _, _, _ = risk_engine.evaluate_risk(
        "database", "update", "users", "staging", "DEVELOPER", {"count": 1}
    )
    score_large, _, _, _ = risk_engine.evaluate_risk(
        "database", "update", "users", "staging", "DEVELOPER", {"count": 10000}
    )
    assert score_large > score_small

def test_risk_engine_reversibility():
    score_read, _, _, _ = risk_engine.evaluate_risk(
        "database", "read", "users", "staging", "DEVELOPER", {}
    )
    score_del, _, _, _ = risk_engine.evaluate_risk(
        "database", "delete", "users", "staging", "DEVELOPER", {}
    )
    assert score_del > score_read

def test_laya_engine_choice_allow():
    res = laya_engine.evaluate_action(
        agent_id="ResearchAgent",
        user_id="usr_01",
        tool="web_search",
        action="search",
        target="docs",
        environment="development",
        parameters={}
    )
    assert res["laya_decision"] == "ALLOW"
    assert res["approval_required"] is False
    assert res["confidence"] >= 0.80

def test_laya_engine_choice_block():
    res = laya_engine.evaluate_action(
        agent_id="FinanceAgent",
        user_id="usr_01",
        tool="payment",
        action="transfer",
        target="bank_account",
        environment="production",
        parameters={"amount": 50000}
    )
    assert res["laya_decision"] == "BLOCK"
    assert res["approval_required"] is True
    assert res["laya_risk_score"] > 80

def test_laya_engine_noul_approval():
    res = laya_engine.evaluate_action(
        agent_id="MarketingAgent",
        user_id="usr_01",
        tool="email",
        action="send",
        target="customers",
        environment="production",
        parameters={"count": 500}
    )
    assert res["approval_required"] is True
    assert "require_human_approval" in res["raw_answers"]

def test_laya_engine_score_bounds():
    res = laya_engine.evaluate_action(
        agent_id="Agent",
        user_id="usr",
        tool="database",
        action="read",
        target="table",
        environment="dev",
        parameters={}
    )
    assert 0 <= res["laya_risk_score"] <= 100

def test_policy_engine_production_block(db):
    pol_dec, final_dec, need_approval, reasons, trig = policy_engine.evaluate_policies(
        db=db,
        agent_id="db_bot",
        user_id="usr_dev",
        user_role="DEVELOPER",
        tool="database",
        action="delete",
        target="prod.users",
        environment="production",
        parameters={"count": 10},
        risk_score=90,
        laya_decision="ALLOW",  # Even if Laya said ALLOW, policy must BLOCK
        laya_approval_required=False
    )
    assert pol_dec == "BLOCK"
    assert final_dec == "BLOCK"
    assert need_approval is False

def test_policy_engine_custom_db_policy(db):
    # Add a custom policy requiring review for github PRs
    pol = Policy(
        name="Require Review For PR Merging",
        tool="github",
        action="merge",
        effect="HUMAN_REVIEW",
        priority=5,
        is_active=True
    )
    db.add(pol)
    db.commit()

    pol_dec, final_dec, need_approval, reasons, trig = policy_engine.evaluate_policies(
        db=db,
        agent_id="git_bot",
        user_id="usr_dev",
        user_role="DEVELOPER",
        tool="github",
        action="merge",
        target="repo/main",
        environment="production",
        parameters={},
        risk_score=40,
        laya_decision="ALLOW",
        laya_approval_required=False
    )
    assert pol_dec == "HUMAN_REVIEW"
    assert final_dec == "REVIEW"
    assert need_approval is True

def test_policy_engine_viewer_mutating_block(db):
    pol_dec, final_dec, need_approval, reasons, trig = policy_engine.evaluate_policies(
        db=db,
        agent_id="agent1",
        user_id="usr_viewer",
        user_role="VIEWER",
        tool="database",
        action="update",
        target="users",
        environment="development",
        parameters={},
        risk_score=20,
        laya_decision="ALLOW",
        laya_approval_required=False
    )
    assert final_dec == "BLOCK"
    assert any("RBAC Violation" in r for r in reasons)

def test_audit_service_logging_and_filtering(db):
    audit_service.record_audit(
        db=db,
        action_id="act_test_01",
        user_id="usr_dev",
        agent_id="AgentTest",
        tool="database",
        action="read",
        target="analytics",
        environment="production",
        risk_score=25,
        laya_decision="ALLOW",
        policy_decision="ALLOW",
        final_decision="ALLOW",
        approval_required=False,
        approver=None,
        execution_status="EXECUTED",
        execution_time_ms=1.2,
        reason="Test audit entry"
    )

    logs = audit_service.get_audit_logs(db, tool="database", decision="ALLOW")
    assert len(logs) >= 1
    assert logs[0].action_id == "act_test_01"
