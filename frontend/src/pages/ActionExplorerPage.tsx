import React, { useEffect, useState } from 'react';
import { Search, Filter, RefreshCw, X, ArrowRight, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { ActionItem } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';
import { DecisionFlowDiagram } from '../components/DecisionFlowDiagram';

interface Props {
  selectedActionId?: string | null;
  onClearSelection?: () => void;
}

export const ActionExplorerPage: React.FC<Props> = ({ selectedActionId, onClearSelection }) => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [activeAction, setActiveAction] = useState<ActionItem | null>(null);
  const [toolFilter, setToolFilter] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadActions = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (toolFilter) params.tool = toolFilter;
      if (decisionFilter) params.decision = decisionFilter;
      const data = await api.getActions(params);
      setActions(data);

      if (selectedActionId) {
        const found = data.find((a) => a.id === selectedActionId);
        if (found) setActiveAction(found);
      }
    } catch (err) {
      console.error('Failed to load actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActions();
  }, [toolFilter, decisionFilter]);

  useEffect(() => {
    if (selectedActionId && actions.length > 0) {
      const found = actions.find((a) => a.id === selectedActionId);
      if (found) setActiveAction(found);
    }
  }, [selectedActionId, actions]);

  const filtered = actions.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.agent_id.toLowerCase().includes(q) ||
      a.action.toLowerCase().includes(q) ||
      a.target.toLowerCase().includes(q) ||
      a.tool.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400" />
          Action Explorer & Decision Trace Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Deep-dive into every proposed autonomous agent action, risk factors, Laya confidence score, and deterministic policy evaluations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter by agent, action, or target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Tools</option>
            <option value="database">Database</option>
            <option value="email">Email</option>
            <option value="github">GitHub</option>
            <option value="file">File</option>
            <option value="web_search">Web Search</option>
            <option value="payment">Payment</option>
          </select>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Decisions</option>
            <option value="ALLOW">ALLOW</option>
            <option value="REVIEW">REVIEW</option>
            <option value="BLOCK">BLOCK</option>
          </select>
        </div>

        <button
          onClick={loadActions}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Actions Table */}
        <div className={`${activeAction ? 'lg:col-span-5' : 'lg:col-span-12'} bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden transition-all`}>
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Actions ({filtered.length})</span>
            <span className="text-[11px] lowercase font-normal text-slate-500">click item to inspect</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[680px] overflow-y-auto">
            {filtered.map((act) => {
              const isSelected = activeAction?.id === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => setActiveAction(act)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-950/40 border-l-4 border-cyan-400'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white font-mono">{act.agent_id}</span>
                    <DecisionBadge decision={act.final_decision} size="sm" />
                  </div>
                  <div className="text-xs text-slate-300 font-mono">
                    <span className="text-cyan-400 font-bold">{act.tool}</span>.{act.action}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{act.target}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50 text-[10px] text-slate-500">
                    <RiskBadge score={act.risk_score} showScore={false} />
                    <span>{new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Inspection Drawer */}
        {activeAction && (
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-5 sticky top-20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase">Action ID: {activeAction.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                  <span>{activeAction.agent_id}</span>
                  <span className="text-slate-500">/</span>
                  <span className="font-mono text-cyan-400">{activeAction.action}</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveAction(null);
                  if (onClearSelection) onClearSelection();
                }}
                className="p-1 text-slate-500 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Decision Flow Visualizer */}
            <DecisionFlowDiagram
              agentName={activeAction.agent_id}
              tool={activeAction.tool}
              action={activeAction.action}
              target={activeAction.target}
              riskScore={activeAction.risk_score}
              layaDecision={activeAction.laya_decision}
              layaConfidence={activeAction.laya_details?.confidence}
              policyDecision={activeAction.policy_decision}
              finalDecision={activeAction.final_decision}
              status={activeAction.status}
            />

            {/* Parameters & Environment */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Target Resource</span>
                <div className="font-mono text-cyan-300 font-semibold break-all">{activeAction.target}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Environment</span>
                <div className="font-mono text-amber-300 font-semibold uppercase">{activeAction.environment}</div>
              </div>
            </div>

            {/* Reasons & Policies Triggered */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Policy Evaluation Findings</span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeAction.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Parameters JSON */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2">Invocation Parameters</span>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/60 p-3 rounded border border-slate-800/80 overflow-x-auto">
                {JSON.stringify(activeAction.parameters, null, 2)}
              </pre>
            </div>

            {/* Execution Status / Result */}
            {activeAction.execution_result && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-lg">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">Simulated Tool Execution Result</span>
                <pre className="text-[11px] font-mono text-emerald-300 bg-slate-950/80 p-3 rounded border border-emerald-500/20 overflow-x-auto">
                  {JSON.stringify(activeAction.execution_result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
