import React, { useEffect, useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Database,
  CreditCard,
  Mail,
  FileCode,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { api, getAuthRole } from '../api/client';
import { ApprovalItem, ActionItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentsInput, setCommentsInput] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const currentRole = getAuthRole();
  const canReview = currentRole === 'ADMIN' || currentRole === 'SECURITY_ANALYST';

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const data = await api.getApprovals(statusFilter);
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    setCurrentPage(1);
  }, [statusFilter]);

  const handleApprove = async (actionId: string) => {
    if (!canReview) {
      alert(`Access restricted: Your role (${currentRole}) cannot approve actions. Switch to ADMIN or SECURITY_ANALYST in the top right.`);
      return;
    }
    try {
      setProcessingId(actionId);
      const comment = commentsInput[actionId] || 'Approved by security operator';
      await api.approveAction(actionId, comment);
      await loadApprovals();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (actionId: string) => {
    if (!canReview) {
      alert(`Access restricted: Your role (${currentRole}) cannot reject actions. Switch to ADMIN or SECURITY_ANALYST in the top right.`);
      return;
    }
    try {
      setProcessingId(actionId);
      const comment = commentsInput[actionId] || 'Rejected by security policy check';
      await api.rejectAction(actionId, comment);
      await loadApprovals();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setProcessingId(null);
    }
  };

  // Helper for tool icon and badge
  const getToolMeta = (tool?: string) => {
    switch (tool?.toLowerCase()) {
      case 'database':
        return {
          icon: Database,
          label: 'Database Operation',
          color: 'text-amber-400 bg-amber-950/60 border-amber-500/30'
        };
      case 'payment':
        return {
          icon: CreditCard,
          label: 'Financial Transfer',
          color: 'text-rose-400 bg-rose-950/60 border-rose-500/30'
        };
      case 'email':
        return {
          icon: Mail,
          label: 'Bulk Email',
          color: 'text-blue-400 bg-blue-950/60 border-blue-500/30'
        };
      case 'github':
        return {
          icon: FileCode,
          label: 'Repository Change',
          color: 'text-purple-400 bg-purple-950/60 border-purple-500/30'
        };
      default:
        return {
          icon: ShieldAlert,
          label: 'System Tool',
          color: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
        };
    }
  };

  // Human readable title
  const getActionTitle = (appr: ApprovalItem) => {
    const act = appr.action;
    if (!act) return `Action #${appr.action_id.slice(0, 8)} requested by ${appr.requested_by}`;

    const agent = act.agent_id;
    const actionName = act.action;
    const target = act.target;

    if (act.tool === 'database') {
      return `${agent} wants to ${actionName.toUpperCase()} records on '${target}'`;
    }
    if (act.tool === 'payment') {
      const amount = act.parameters?.amount ? `$${Number(act.parameters.amount).toLocaleString()}` : 'funds';
      return `${agent} wants to transfer ${amount} to '${target}'`;
    }
    if (act.tool === 'email') {
      return `${agent} wants to dispatch mass email to '${target}'`;
    }
    return `${agent} wants to perform '${actionName}' on '${target}'`;
  };

  // Filter items
  const filteredApprovals = useMemo(() => {
    return approvals.filter((item) => {
      const act = item.action;
      const toolMatch =
        categoryFilter === 'all' ||
        (categoryFilter === 'database' && act?.tool === 'database') ||
        (categoryFilter === 'payment' && act?.tool === 'payment') ||
        (categoryFilter === 'email' && act?.tool === 'email');

      if (!toolMatch) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = getActionTitle(item).toLowerCase();
      const agent = act?.agent_id?.toLowerCase() || '';
      const target = act?.target?.toLowerCase() || '';
      const reason = act?.reasons?.join(' ')?.toLowerCase() || '';

      return title.includes(q) || agent.includes(q) || target.includes(q) || reason.includes(q);
    });
  }, [approvals, categoryFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredApprovals.length / itemsPerPage) || 1;
  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredApprovals.slice(start, start + itemsPerPage);
  }, [filteredApprovals, currentPage]);

  // Counts
  const counts = useMemo(() => {
    const dbCount = approvals.filter((a) => a.action?.tool === 'database').length;
    const payCount = approvals.filter((a) => a.action?.tool === 'payment').length;
    const mailCount = approvals.filter((a) => a.action?.tool === 'email').length;
    const criticalCount = approvals.filter((a) => (a.action?.risk_score || 0) >= 80).length;
    return { dbCount, payCount, mailCount, criticalCount };
  }, [approvals]);

  return (
    <div className="space-y-6">
      {/* Friendly Guide Header */}
      {/* Full Automation Active Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                ⚡ 100% Full Automation Shield Active
              </h2>
            </div>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              <strong>Zero Human Review Required.</strong> AgentShield autonomously evaluates and protects all AI tool calls in real time. Safe actions execute instantly, and destructive actions are blocked by zero-trust policies with no manual waiting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {approvals.length > 0 && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    await api.ensureAuthToken();
                    await api.autoResolveAll();
                    await loadApprovals();
                  } catch (e: any) {
                    alert(e.message || 'Auto-resolution failed');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <span>⚡ Auto-Resolve All with AI Guard</span>
              </button>
            )}

            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Mode:</span>
              <span className="font-semibold text-emerald-300">Autonomous</span>
            </div>
          </div>
        </div>

        {/* Quick Category Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl">
            <div className="text-[11px] text-slate-400 font-medium">Pending Manual Queue</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{approvals.length}</div>
          </div>
          <div className="bg-slate-950/60 border border-rose-900/30 p-3 rounded-xl">
            <div className="text-[11px] text-rose-400 font-medium">Auto-Shielded Critical</div>
            <div className="text-2xl font-bold text-rose-300 mt-0.5">{counts.criticalCount}</div>
          </div>
          <div className="bg-slate-950/60 border border-amber-900/30 p-3 rounded-xl">
            <div className="text-[11px] text-amber-400 font-medium">Database Safeguards</div>
            <div className="text-2xl font-bold text-amber-300 mt-0.5">{counts.dbCount}</div>
          </div>
          <div className="bg-slate-950/60 border border-blue-900/30 p-3 rounded-xl">
            <div className="text-[11px] text-blue-400 font-medium">Auto-Cleared Safe</div>
            <div className="text-2xl font-bold text-blue-300 mt-0.5">{counts.mailCount}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Status Tabs, Category Filter & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        {/* Status selection */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
          {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                statusFilter === tab
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'PENDING' ? 'Pending Review' : tab === 'APPROVED' ? 'Approved' : 'Blocked & Rejected'}
            </button>
          ))}
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'database', label: '🗄️ Database' },
              { id: 'payment', label: '💳 Money' },
              { id: 'email', label: '📧 Email' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  categoryFilter === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={loadApprovals}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Approvals List */}
      {paginatedApprovals.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-70" />
          <h3 className="text-base font-bold text-white">No {statusFilter.toLowerCase()} actions found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No actions matched your search. Try clearing filters.'
              : 'All actions have been resolved or are operating safely within policy boundaries.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedApprovals.map((appr) => {
            const act = appr.action;
            const isProcessing = processingId === appr.action_id;
            const isExpanded = expandedId === appr.id;
            const toolMeta = getToolMeta(act?.tool);
            const ToolIcon = toolMeta.icon;

            return (
              <div
                key={appr.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg transition-all"
              >
                {/* Main Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Icon + Clean Title + Meta */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className={`p-3 rounded-xl border shrink-0 ${toolMeta.color}`}>
                      <ToolIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      {/* Human-friendly Title */}
                      <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight">
                        {getActionTitle(appr)}
                      </h3>

                      {/* Chips */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                          Agent: <strong className="font-mono text-cyan-300">{act?.agent_id || appr.requested_by}</strong>
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300 uppercase">
                          {act?.environment || 'production'}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(appr.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Risk Badge & Decision Buttons */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                    {act && <RiskBadge score={act.risk_score} />}

                    {appr.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessing || !canReview}
                          onClick={() => handleApprove(appr.action_id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/60 disabled:opacity-40"
                          title="Allow this action to execute"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Allow Action
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing || !canReview}
                          onClick={() => handleReject(appr.action_id)}
                          className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-950/60 disabled:opacity-40"
                          title="Block this action"
                        >
                          <XCircle className="w-4 h-4" />
                          Block & Reject
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                        Status: <strong className={appr.status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}>{appr.status}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plain-Language Decision Rationale & Description Banner */}
                <div className={`mt-3.5 p-3.5 rounded-xl border text-xs leading-relaxed ${
                  appr.status === 'APPROVED'
                    ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200'
                    : appr.status === 'REJECTED'
                    ? 'bg-rose-950/25 border-rose-500/30 text-rose-200'
                    : 'bg-amber-950/25 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {appr.status === 'APPROVED' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-emerald-300">Approval Description & Rationale</span>
                      </>
                    ) : appr.status === 'REJECTED' ? (
                      <>
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="text-rose-300">Rejection Description & Rationale</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-amber-300">Review Rationale</span>
                      </>
                    )}
                  </div>

                  <p className="text-slate-300 text-xs">
                    {appr.comments || (
                      appr.status === 'APPROVED'
                        ? `Approved because this operation conforms to security policies and operates within acceptable risk tolerance (${act?.risk_score || 0}/100 risk score).`
                        : appr.status === 'REJECTED'
                        ? `Rejected and blocked because attempting '${act?.action}' on '${act?.target}' in ${act?.environment} exceeds safety limits (${act?.risk_score || 0}/100 risk score). Intercepted to safeguard data integrity.`
                        : `Paused for review because operation affects ${act?.environment} environment.`
                    )}
                  </p>

                  {act?.reasons && act.reasons.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400 font-semibold">Underlying Factors:</span>
                      {act.reasons.map((r, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expand / Collapse Details Toggle */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : appr.id)}
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition"
                  >
                    <span>{isExpanded ? 'Hide Technical Details' : 'View Technical Details (JSON & Laya)'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {appr.status === 'PENDING' && (
                    <input
                      type="text"
                      placeholder="Optional comment before approving..."
                      value={commentsInput[appr.action_id] || ''}
                      onChange={(e) => setCommentsInput({ ...commentsInput, [appr.action_id]: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-600 w-64 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  )}
                </div>

                {/* Collapsible Technical Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/70 p-3 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Laya Decision & Policy Engine
                      </span>
                      <div className="font-mono text-slate-300 space-y-0.5 text-[11px]">
                        <div>Laya Recommendation: <span className="text-purple-400 font-bold">{act?.laya_decision || 'REVIEW'}</span></div>
                        <div>Policy Enforcement: <span className="text-blue-400 font-bold">{act?.policy_decision || 'HUMAN_REVIEW'}</span></div>
                        <div>Target Resource: <span className="text-slate-300">{act?.target}</span></div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                        Tool Parameters Payload
                      </span>
                      <pre className="text-[10px] font-mono text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 overflow-x-auto max-h-24">
                        {JSON.stringify(act?.parameters || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-xl text-xs text-slate-400">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredApprovals.length)} of {filteredApprovals.length} actions
          </div>
          <div className="flex items-center gap-1.5">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 text-white font-semibold">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
