export type DecisionType = 'ALLOW' | 'REVIEW' | 'BLOCK' | 'HUMAN_REVIEW';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UserRole = 'ADMIN' | 'SECURITY_ANALYST' | 'DEVELOPER' | 'VIEWER';

export interface ActionItem {
  id: string;
  agent_id: string;
  user_id: string;
  tool: string;
  action: string;
  target: string;
  environment: string;
  parameters: Record<string, any>;
  risk_score: number;
  laya_decision: DecisionType;
  policy_decision: string;
  final_decision: DecisionType;
  approval_required: boolean;
  status: string;
  reasons: string[];
  laya_details?: {
    confidence?: number;
    token_usage?: { total_tokens?: number };
    routing?: Record<string, any>;
    raw_answers?: Record<string, any>;
    latency_ms?: number;
  };
  execution_result?: Record<string, any> | null;
  execution_time_ms: number;
  created_at: string;
  updated_at: string;
}

export interface ApprovalItem {
  id: string;
  action_id: string;
  requested_by: string;
  approved_by?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  action?: ActionItem | null;
}

export interface PolicyItem {
  id: string;
  name: string;
  description?: string;
  tool?: string | null;
  action?: string | null;
  environment?: string | null;
  role?: string | null;
  condition_expression: Record<string, any>;
  effect: 'ALLOW' | 'HUMAN_REVIEW' | 'BLOCK';
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  action_id: string;
  timestamp: string;
  user_id: string;
  agent_id: string;
  tool: string;
  action: string;
  target: string;
  environment: string;
  risk_score: number;
  laya_decision: string;
  policy_decision: string;
  final_decision: DecisionType;
  approval_required: boolean;
  approver?: string | null;
  execution_status: string;
  execution_time_ms: number;
  reason?: string | null;
  client_ip?: string | null;
}

export interface DashboardStats {
  total_actions: number;
  allowed: number;
  human_review: number;
  blocked: number;
  critical_actions: number;
  avg_decision_time_ms: number;
  decision_distribution: Record<string, number>;
  risk_distribution: Record<string, number>;
  tool_usage: Array<{ tool: string; count: number }>;
  agent_activity: Array<{ agent_id: string; total: number; blocked: number; allowed: number; review: number }>;
  timeline_series: Array<{ timestamp: string; ALLOW: number; REVIEW: number; BLOCK: number }>;
}

export interface SimulatedStep {
  step_number: number;
  action_type: string;
  tool: string;
  action: string;
  target: string;
  environment: string;
  parameters: Record<string, any>;
  rationale?: string;
  evaluation?: {
    action_id: string;
    risk_score: number;
    risk_level: RiskLevel;
    risk_factors: Record<string, number>;
    laya_decision: DecisionType;
    laya_confidence: number;
    policy_decision: string;
    final_decision: DecisionType;
    approval_required: boolean;
    reasons: string[];
    decision_description?: string;
    triggered_policies: string[];
    execution_result?: Record<string, any> | null;
  };
}

export interface SimulationResult {
  agent_id: string;
  goal: string;
  environment: string;
  steps: SimulatedStep[];
}

export interface ToolItem {
  id: string;
  name: string;
  category: string;
  sensitivity_level: string;
  is_simulated: boolean;
  is_active: boolean;
  description?: string;
}

export interface AgentItem {
  id: string;
  name: string;
  description?: string;
  agent_type: string;
  trust_level: string;
  is_active: boolean;
  allowed_tools: string[];
  created_at: string;
}
