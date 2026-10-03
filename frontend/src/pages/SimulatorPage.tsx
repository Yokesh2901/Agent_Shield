import React, { useState } from 'react';
import {
  Bot,
  Play,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  Database,
  CreditCard,
  Mail,
  FileCode,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '../api/client';
import { SimulationResult } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';

interface Props {
  onNavigateToApprovals?: () => void;
}

export const SimulatorPage: React.FC<Props> = ({ onNavigateToApprovals }) => {
  const [goal, setGoal] = useState('Clean duplicate customer records in production database');
  const [agentId, setAgentId] = useState('DataCleanupAgent');
  const [environment, setEnvironment] = useState('production');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const presets = [
    {
      id: 'db',
      icon: Database,
      agent: 'DataCleanupAgent',
      title: 'Database Mass Deletion',
      goal: 'Clean duplicate customer records in production database',
      env: 'production',
      tag: 'Destructive Operation',
      tagColor: 'text-rose-400 bg-rose-950/60 border-rose-500/30',
      expectedOutcome: '🔴 Auto-Blocked (Zero-Trust Shield)',
      desc: 'Simulates an agent attempting to purge 2,481 records. AgentShield autonomously blocks the delete action with zero human waiting.',
    },
    {
      id: 'finance',
      icon: CreditCard,
      agent: 'FinanceAgent',
      title: 'Direct Wire Transfer',
      goal: 'Execute wire transfer of $75,000 for vendor escrow settlement',
      env: 'production',
      tag: 'Critical Payment',
      tagColor: 'text-rose-400 bg-rose-950/60 border-rose-500/30',
      expectedOutcome: '🔴 Auto-Blocked by Security Policy',
      desc: 'Simulates an unverified fund transfer. AgentShield blocks the payment tool instantly.',
    },
    {
      id: 'marketing',
      icon: Mail,
      agent: 'MarketingAgent',
      title: 'Bulk Email Campaign Blast',
      goal: 'Dispatch promotional marketing campaign blast to 5,000 leads',
      env: 'production',
      tag: 'Mass Communication',
      tagColor: 'text-rose-400 bg-rose-950/60 border-rose-500/30',
      expectedOutcome: '🔴 Auto-Blocked (Mass Spam Guard)',
      desc: 'Simulates an agent mass emailing customers. Autonomously shielded to prevent accidental spam.',
    },
    {
      id: 'research',
      icon: FileCode,
      agent: 'ResearchAgent',
      title: 'Safe Web & GitHub Research',
      goal: 'Investigate recent zero-day security advisories and log tracking issue',
      env: 'development',
      tag: 'Safe Workload',
      tagColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
      expectedOutcome: '🟢 Allowed Automatically',
      desc: 'Simulates everyday research. Harmless read-only tasks execute immediately with zero delays.',
    },
  ];

  const handleRun = async () => {
    if (!goal.trim()) return;
    try {
      setLoading(true);
      const res = await api.runSimulator(agentId, goal, environment);
      setResult(res);
    } catch (err) {
      console.error('Simulation run failed:', err);
      alert('Failed to run simulation. Please verify backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Explanation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Bot className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Agent Firewall Simulator
            </h2>
          </div>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            See in real-time how <strong>AgentShield intercepts AI actions before they can harm your systems</strong>. Pick a scenario below and watch the decision pipeline in action.
          </p>
        </div>

        {/* 3-Step Visual Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center text-xs shrink-0">
              1
            </div>
            <div>
              <div className="text-xs font-bold text-white">AI Agent Plans</div>
              <div className="text-[11px] text-slate-400">Agent creates multi-step tool calls</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center text-xs shrink-0">
              2
            </div>
            <div>
              <div className="text-xs font-bold text-white">AgentShield Intercepts</div>
              <div className="text-[11px] text-slate-400">Laya AI + Policies calculate risk</div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
              3
            </div>
            <div>
              <div className="text-xs font-bold text-white">Safe Execution / Review</div>
              <div className="text-[11px] text-slate-400">Safe: Auto-allowed • Risky: Held for you</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Scenario Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Step 1: Choose a Test Scenario
          </h3>
          <span className="text-xs text-slate-400">Click any card to load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {presets.map((p) => {
            const Icon = p.icon;
            const isSelected = goal === p.goal;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setAgentId(p.agent);
                  setGoal(p.goal);
                  setEnvironment(p.env);
                }}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/50 to-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${p.tagColor}`}>
                      {p.tag}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight">{p.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{p.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] font-medium text-slate-300">
                    Expected: <span className="font-bold">{p.expectedOutcome}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Simulator Action Input Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Step 2: Customize Prompt & Run Firewall
          </h3>
          <span className="text-xs text-cyan-400 font-mono">Agent: {agentId}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Environment Target</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="production">🛡️ Production (Zero-Trust Shield Active)</option>
              <option value="staging">Staging (Pre-release)</option>
              <option value="development">Development (Testing sandbox)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-slate-300 block mb-1">AI Agent's Goal / Prompt</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What action is the AI agent trying to perform?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={handleRun}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-cyan-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                Run Live Simulation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Execution Output */}
      {result && (
        <div className="space-y-4 pt-2">
          {/* Result Overview Header */}
          <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Simulation Finished • {result.steps.length} Actions Evaluated
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                Goal: "{result.goal}"
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ⚡ 100% Fully Automated • 0 Human Delay
              </span>
            </div>
          </div>

          {/* Step by Step Breakdown */}
          <div className="space-y-3">
            {result.steps.map((step) => {
              const dec = step.evaluation?.final_decision || step.evaluation?.laya_decision || 'ALLOW';
              const isAllowed = dec === 'ALLOW';
              const isBlocked = dec === 'BLOCK';

              return (
                <div
                  key={step.step_number}
                  className={`border rounded-2xl p-5 shadow-lg transition-all ${
                    isAllowed
                      ? 'bg-slate-900/70 border-emerald-950/80 hover:border-emerald-800/40'
                      : 'bg-slate-900/90 border-rose-500/40 shadow-rose-950/20 ring-1 ring-rose-500/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Step Number Circle */}
                      <div
                        className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                          isAllowed
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {step.step_number}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white capitalize">
                            Action: {step.action} on{' '}
                            <code className="text-cyan-300 font-mono text-xs">{step.target}</code>
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                            Tool: {step.tool}
                          </span>
                        </div>

                        {/* Plain English explanation */}
                        <p className="text-xs text-slate-300 mt-1">
                          {isAllowed && '🟢 Safe operation. Executed automatically with zero human delay.'}
                          {isBlocked && '🔴 Dangerous operation! Automatically BLOCKED by AgentShield Zero-Trust Firewall.'}
                        </p>
                      </div>
                    </div>

                    {/* Decision & Risk Badge */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <RiskBadge score={step.evaluation?.risk_score || 0} />
                      <DecisionBadge decision={dec} size="md" />
                    </div>
                  </div>

                  {/* Detailed Decision Rationale & Description Box */}
                  <div className={`mt-4 p-4 rounded-xl border text-xs leading-relaxed ${
                    isAllowed
                      ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/25 border-rose-500/30 text-rose-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold mb-1.5 text-xs">
                      {isAllowed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="text-emerald-300">Why was this Approved & Executed?</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-rose-300">Why was this Blocked & Rejected?</span>
                        </>
                      )}
                    </div>

                    <p className="text-slate-200 text-xs leading-relaxed">
                      {step.evaluation?.decision_description || (
                        isAllowed
                          ? `Approved because '${step.action}' via '${step.tool}' is a safe, non-destructive call in ${step.environment} with low blast radius (Risk: ${step.evaluation?.risk_score || 0}/100). Executed automatically.`
                          : `Blocked because attempting '${step.action}' on '${step.target}' in ${step.environment} is a high-risk destructive action (Risk: ${step.evaluation?.risk_score || 0}/100). Intercepted and blocked by AgentShield to prevent data damage.`
                      )}
                    </p>

                    {/* Triggered Policies and Risk Factors */}
                    {step.evaluation?.reasons && step.evaluation.reasons.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="text-slate-400 font-semibold">Security Factors:</span>
                        {step.evaluation.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-slate-950 border border-slate-800/80 text-slate-300 font-medium"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
