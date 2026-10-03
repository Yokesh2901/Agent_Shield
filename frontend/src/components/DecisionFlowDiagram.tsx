import React from 'react';
import { Bot, Gauge, Cpu, ShieldAlert, CheckCircle2, ArrowRight, Zap, AlertCircle } from 'lucide-react';
import { DecisionBadge } from './DecisionBadge';
import { RiskBadge } from './RiskBadge';

interface Props {
  agentName: string;
  tool: string;
  action: string;
  target: string;
  riskScore: number;
  layaDecision: string;
  layaConfidence?: number;
  policyDecision: string;
  finalDecision: string;
  status: string;
}

export const DecisionFlowDiagram: React.FC<Props> = ({
  agentName,
  tool,
  action,
  target,
  riskScore,
  layaDecision,
  layaConfidence,
  policyDecision,
  finalDecision,
  status
}) => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl overflow-x-auto">
      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center justify-between">
        <span>Decision Firewall Pipeline</span>
        <span className="text-[11px] text-cyan-400 font-mono">Intercepted Before Tool Execution</span>
      </div>

      <div className="flex items-center justify-between min-w-[760px] gap-2">
        {/* Step 1: Agent Proposal */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center relative group hover:border-cyan-500/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto mb-2">
            <Bot className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate">{agentName}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{action}</div>
          <div className="text-[10px] text-slate-500 truncate mt-1">on {target}</div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

        {/* Step 2: Risk Scoring */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center hover:border-amber-500/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-amber-950 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Gauge className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-slate-200">Risk Engine</div>
          <div className="mt-1.5 flex justify-center">
            <RiskBadge score={riskScore} />
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Transparent weights</div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

        {/* Step 3: Laya Engine */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center hover:border-purple-500/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto mb-2">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-slate-200">Laya Engine</div>
          <div className="text-[11px] text-purple-300 font-mono font-medium mt-1">
            {layaDecision}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {layaConfidence ? `${Math.round(layaConfidence * 100)}% conf` : '3 primitives'}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

        {/* Step 4: Deterministic Policy Engine */}
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-center hover:border-blue-500/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-slate-200">Policy & RBAC</div>
          <div className="text-[11px] text-blue-300 font-mono font-medium mt-1">
            {policyDecision}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Zero-trust rule override</div>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

        {/* Step 5: Final Decision & Execution Gate */}
        <div className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg p-3 text-center shadow-lg ring-1 ring-cyan-500/20">
          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto mb-2">
            {finalDecision === 'ALLOW' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : finalDecision === 'BLOCK' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <Zap className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="text-xs font-semibold text-slate-200 mb-1">Final Decision</div>
          <div className="flex justify-center">
            <DecisionBadge decision={finalDecision} size="sm" />
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5 uppercase font-mono">{status}</div>
        </div>
      </div>
    </div>
  );
};
