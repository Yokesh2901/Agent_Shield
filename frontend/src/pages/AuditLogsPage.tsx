import React, { useEffect, useState } from 'react';
import { FileText, Search, RefreshCw, Download, Filter, Eye, X } from 'lucide-react';
import { api } from '../api/client';
import { AuditLogItem } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolFilter, setToolFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (toolFilter) params.tool = toolFilter;
      if (decisionFilter) params.decision = decisionFilter;
      if (agentFilter) params.agent_id = agentFilter;
      const data = await api.getAuditLogs(params);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [toolFilter, decisionFilter, agentFilter]);

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Agent', 'Tool', 'Action', 'Target', 'RiskScore', 'LayaDecision', 'FinalDecision', 'Status', 'Reason'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.agent_id,
      l.tool,
      l.action,
      `"${l.target.replace(/"/g, '""')}"`,
      l.risk_score,
      l.laya_decision,
      l.final_decision,
      l.execution_status,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agentshield_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Immutable Security Audit Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident record of all agent requests, risk scores, Laya classifications, and final execution statuses.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <Download className="w-4 h-4" />
          Export Audit Log (CSV)
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter Agent ID..."
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Tools</option>
            <option value="database">Database</option>
            <option value="email">Email</option>
            <option value="github">GitHub</option>
            <option value="file">File</option>
            <option value="payment">Payment</option>
            <option value="web_search">Web Search</option>
          </select>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="REVIEW">REVIEW</option>
            <option value="BLOCK">BLOCK</option>
          </select>
        </div>

        <button
          onClick={loadLogs}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Tool</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Laya</th>
                <th className="py-3 px-4">Final Decision</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-white font-semibold">{log.agent_id}</td>
                  <td className="py-3 px-4 font-mono text-cyan-400">{log.tool}</td>
                  <td className="py-3 px-4 text-slate-300">{log.action}</td>
                  <td className="py-3 px-4 text-slate-400 truncate max-w-[180px] font-mono">{log.target}</td>
                  <td className="py-3 px-4">
                    <RiskBadge score={log.risk_score} showScore={false} />
                  </td>
                  <td className="py-3 px-4 font-mono text-purple-300">{log.laya_decision}</td>
                  <td className="py-3 px-4">
                    <DecisionBadge decision={log.final_decision} size="sm" />
                  </td>
                  <td className="py-3 px-4 uppercase text-[10px] font-mono text-slate-400">
                    {log.execution_status}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setActiveLog(log)}
                      className="p-1 text-slate-500 hover:text-cyan-400 rounded hover:bg-slate-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Modal */}
      {activeLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Immutable Audit Record</h3>
                <span className="text-xs font-mono text-slate-500">Log Entry ID: {activeLog.id}</span>
              </div>
              <button onClick={() => setActiveLog(null)} className="p-1 text-slate-400 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Agent & User</span>
                <div className="font-mono text-cyan-300 font-semibold">{activeLog.agent_id}</div>
                <div className="text-slate-400 mt-0.5">Invoked by: {activeLog.user_id}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Execution Gate</span>
                <div className="font-mono text-white font-semibold">Status: {activeLog.execution_status}</div>
                <div className="text-slate-400 mt-0.5">Latency: {activeLog.execution_time_ms} ms</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Evaluation Rationale</span>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{activeLog.reason || 'None specified'}</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Raw Record Payload</span>
              <pre className="text-[11px] font-mono text-slate-400 overflow-x-auto max-h-40">
                {JSON.stringify(activeLog, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveLog(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
