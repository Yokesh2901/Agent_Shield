import {
  ActionItem,
  ApprovalItem,
  PolicyItem,
  AuditLogItem,
  DashboardStats,
  SimulationResult,
  ToolItem,
  AgentItem,
  UserRole
} from '../types';

const BASE_URL = '';

let currentRole: UserRole = (localStorage.getItem('agentshield_role') as UserRole) || 'ADMIN';
let authToken: string | null = localStorage.getItem('agentshield_token') || null;

const ROLE_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  ADMIN: { email: 'admin@agentshield.ai', pass: 'AdminPassword123!' },
  SECURITY_ANALYST: { email: 'analyst@agentshield.ai', pass: 'AnalystPassword123!' },
  DEVELOPER: { email: 'dev@agentshield.ai', pass: 'DevPassword123!' },
  VIEWER: { email: 'viewer@agentshield.ai', pass: 'ViewerPassword123!' },
};

export const setAuthRole = (role: UserRole) => {
  currentRole = role;
  localStorage.setItem('agentshield_role', role);
  // Also refresh auth token for that role in background
  ensureAuthToken(role);
};

export const getAuthRole = (): UserRole => {
  return (localStorage.getItem('agentshield_role') as UserRole) || currentRole;
};

export const ensureAuthToken = async (role?: UserRole): Promise<string | null> => {
  const targetRole = role || getAuthRole();
  const creds = ROLE_CREDENTIALS[targetRole] || ROLE_CREDENTIALS.ADMIN;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: creds.email, password: creds.pass }),
    });
    if (res.ok) {
      const data = await res.json();
      authToken = data.access_token;
      if (authToken) {
        localStorage.setItem('agentshield_token', authToken);
      }
      return authToken;
    }
  } catch (err) {
    console.warn('Auto login failed:', err);
  }
  return authToken;
};

// Auto-run on startup
if (typeof window !== 'undefined') {
  ensureAuthToken();
}

export const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = authToken || localStorage.getItem('agentshield_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// API Methods
export const api = {
  ensureAuthToken,

  // Authentication
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    authToken = data.access_token;
    localStorage.setItem('agentshield_token', data.access_token);
    if (data.role) setAuthRole(data.role as UserRole);
    return data;
  },

  // Dashboard Stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${BASE_URL}/api/dashboard/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to load dashboard statistics');
    return res.json();
  },

  // Actions
  getActions: async (params?: { tool?: string; decision?: string; status?: string }): Promise<ActionItem[]> => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${BASE_URL}/api/actions?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch actions');
    return res.json();
  },

  getActionDetail: async (id: string): Promise<ActionItem> => {
    const res = await fetch(`${BASE_URL}/api/actions/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch action detail');
    return res.json();
  },

  evaluateAction: async (payload: {
    agent_id: string;
    tool: string;
    action: string;
    target: string;
    environment: string;
    parameters: Record<string, any>;
    auto_execute_if_allowed?: boolean;
  }) => {
    const res = await fetch(`${BASE_URL}/api/evaluate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ...payload, user_id: `${getAuthRole().toLowerCase()}_operator` }),
    });
    if (!res.ok) throw new Error('Failed to evaluate action');
    return res.json();
  },

  executeAction: async (actionId: string) => {
    const res = await fetch(`${BASE_URL}/api/actions/execute/${actionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Execution failed');
    }
    return res.json();
  },

  // Approvals Queue
  getApprovals: async (status: string = 'PENDING'): Promise<ApprovalItem[]> => {
    const res = await fetch(`${BASE_URL}/api/approvals?status_filter=${status}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch approvals');
    return res.json();
  },

  approveAction: async (actionId: string, comments?: string): Promise<ApprovalItem> => {
    const res = await fetch(`${BASE_URL}/api/approvals/${actionId}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comments }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to approve action');
    }
    return res.json();
  },

  rejectAction: async (actionId: string, comments?: string): Promise<ApprovalItem> => {
    const res = await fetch(`${BASE_URL}/api/approvals/${actionId}/reject`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ comments }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to reject action');
    }
    return res.json();
  },

  autoResolveAll: async () => {
    const res = await fetch(`${BASE_URL}/api/approvals/auto-resolve-all`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Auto-resolution failed');
    }
    return res.json();
  },

  // Simulator
  runSimulator: async (agent_id: string, goal: string, environment: string = 'production'): Promise<SimulationResult> => {
    const res = await fetch(`${BASE_URL}/api/simulator/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ agent_id, goal, environment }),
    });
    if (!res.ok) throw new Error('Simulator execution failed');
    return res.json();
  },

  // Policies
  getPolicies: async (): Promise<PolicyItem[]> => {
    const res = await fetch(`${BASE_URL}/api/policies`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  createPolicy: async (policy: Partial<PolicyItem>): Promise<PolicyItem> => {
    const res = await fetch(`${BASE_URL}/api/policies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(policy),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create policy');
    }
    return res.json();
  },

  deletePolicy: async (policyId: string) => {
    const res = await fetch(`${BASE_URL}/api/policies/${policyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete policy');
    return res.json();
  },

  // Audit Logs
  getAuditLogs: async (params?: Record<string, string>): Promise<AuditLogItem[]> => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/api/audit?${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getAuditDetail: async (id: string): Promise<AuditLogItem> => {
    const res = await fetch(`${BASE_URL}/api/audit/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit log detail');
    return res.json();
  },

  // Tools & Agents
  getTools: async (): Promise<ToolItem[]> => {
    const res = await fetch(`${BASE_URL}/api/tools`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tools');
    return res.json();
  },

  getAgents: async (): Promise<AgentItem[]> => {
    const res = await fetch(`${BASE_URL}/api/agents`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch agents');
    return res.json();
  },
};
