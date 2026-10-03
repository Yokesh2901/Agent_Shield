import React from 'react';
import { Sliders, Cpu, Activity, Shield, ExternalLink, CheckCircle2 } from 'lucide-react';
import { getAuthRole } from '../api/client';

export const SettingsPage: React.FC = () => {
  const currentRole = getAuthRole();

  const rbacMatrix = [
    { role: 'ADMIN', perms: 'All permissions: Create/Edit policies, Approve/Reject actions, View all audits, Manage agents & tools' },
    { role: 'SECURITY_ANALYST', perms: 'Operator permissions: Review audit logs, Inspect action detail traces, Approve/Reject human reviews' },
    { role: 'DEVELOPER', perms: 'Developer permissions: Launch agent simulation runs, Propose actions, View action results' },
    { role: 'VIEWER', perms: 'Auditor permissions: Read-only access to dashboard statistics and audit ledger (Mutating actions blocked)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          System Settings & Platform Architecture
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Governance parameters, Laya decision engine configuration, Prometheus observability, and RBAC matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Laya Engine Configuration Box */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Laya Decision Engine Configuration</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Underlying Model Checkpoint</span>
              <span className="font-mono text-purple-300 font-bold">convaiinnovations/laya (english)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Structured Decision Primitives</span>
              <span className="font-mono text-cyan-300">choice, score (0-100), noul</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Min Confidence Gate</span>
              <span className="font-mono text-emerald-400 font-bold">0.75 (Calibrated)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Inference Mode</span>
              <span className="font-mono text-slate-300">Laya Router Attached Agent</span>
            </div>
          </div>

          <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-lg text-[11px] text-purple-300 leading-relaxed">
            <strong>Architecture Principle:</strong> Laya is used as a fast structured decision engine inside the governance pipeline. It is not treated as the sole security boundary. Deterministic policy rules and RBAC always override model output.
          </div>
        </div>

        {/* Observability & Prometheus */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Observability & Prometheus Metrics</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Prometheus Metrics Endpoint</span>
              <a
                href="/metrics"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
              >
                /metrics <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-[11px] font-mono text-slate-400">
              <div className="text-slate-300 font-bold uppercase text-[10px]">Tracked Metrics:</div>
              <div>• decision_latency_seconds (Histogram)</div>
              <div>• laya_decisions_total (Counter)</div>
              <div>• blocked_actions_total (Counter)</div>
              <div>• review_actions_total (Counter)</div>
              <div>• allowed_actions_total (Counter)</div>
              <div>• tool_execution_total (Counter)</div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Optional LLM Fallback (Ollama)</span>
              <span className="font-mono text-amber-300">http://localhost:11434</span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Authorization Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2.5 text-sm font-bold text-white border-b border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Role-Based Access Control (RBAC) Permissions</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {rbacMatrix.map((item) => (
            <div
              key={item.role}
              className={`p-4 rounded-xl border ${
                currentRole === item.role
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-mono text-white">{item.role}</span>
                {currentRole === item.role && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-900 text-cyan-300">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{item.perms}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
