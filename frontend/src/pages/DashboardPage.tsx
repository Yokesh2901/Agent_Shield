import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Flame,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Bot,
  Zap,
  CheckCircle2,
  Lock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../api/client';
import { DashboardStats, ActionItem } from '../types';
import { DecisionBadge } from '../components/DecisionBadge';
import { RiskBadge } from '../components/RiskBadge';

const DECISION_COLORS = {
  ALLOW: '#10b981',
  REVIEW: '#f59e0b',
  BLOCK: '#f43f5e',
};

const RISK_COLORS = {
  LOW: '#10b981',
  MEDIUM: '#06b6d4',
  HIGH: '#f59e0b',
  CRITICAL: '#f43f5e',
};

interface Props {
  onSelectAction: (actionId: string) => void;
  onNavigate?: (page: string) => void;
}

export const DashboardPage: React.FC<Props> = ({ onSelectAction, onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActions, setRecentActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([api.getDashboardStats(), api.getActions({ limit: 8 } as any)]);
      setStats(s);
      setRecentActions(a);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Actions Screened',
      subtext: 'Total AI tool calls checked',
      value: stats?.total_actions || 0,
      icon: Layers,
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40 border-cyan-500/20'
    },
    {
      label: 'Auto-Allowed',
      subtext: 'Safe operations executed',
      value: stats?.allowed || 0,
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-500/20'
    },
    {
      label: 'Needs Your Review',
      subtext: 'High-risk actions paused',
      value: stats?.human_review || 0,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-500/20'
    },
    {
      label: 'Blocked Violations',
      subtext: 'Dangerous calls rejected',
      value: stats?.blocked || 0,
      icon: ShieldAlert,
      color: 'text-rose-400',
      bg: 'bg-rose-950/40 border-rose-500/20'
    },
    {
      label: 'Critical Risk',
      subtext: 'Mass impact operations',
      value: stats?.critical_actions || 0,
      icon: Flame,
      color: 'text-red-400',
      bg: 'bg-red-950/40 border-red-500/20'
    },
    {
      label: 'Decision Speed',
      subtext: 'Average firewall latency',
      value: `${stats?.avg_decision_time_ms || 0} ms`,
      icon: Clock,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-500/20'
    },
  ];

  const pieData = stats
    ? [
        { name: 'ALLOW', value: stats.decision_distribution.ALLOW || 0 },
        { name: 'REVIEW', value: stats.decision_distribution.REVIEW || 0 },
        { name: 'BLOCK', value: stats.decision_distribution.BLOCK || 0 },
      ]
    : [];

  const riskBarData = stats
    ? [
        { name: 'LOW', count: stats.risk_distribution.LOW || 0 },
        { name: 'MEDIUM', count: stats.risk_distribution.MEDIUM || 0 },
        { name: 'HIGH', count: stats.risk_distribution.HIGH || 0 },
        { name: 'CRITICAL', count: stats.risk_distribution.CRITICAL || 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Friendly Guide & Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Agent Security & Action Governance
              </h2>
            </div>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              AgentShield acts as a <strong>decision firewall between autonomous AI agents and real-world tools</strong> (Databases, Payments, Email, GitHub). Safe tasks run automatically; dangerous actions are paused for human verification.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('simulator')}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-950 cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  Test Simulator
                </button>
                <button
                  onClick={() => onNavigate('approvals')}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-amber-950 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Approval Queue ({stats?.human_review || 0})
                </button>
              </>
            )}
            <button
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-850 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl border backdrop-blur-md ${card.bg}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white font-mono">{card.value}</div>
              <div className="text-[10px] text-slate-400 mt-1">{card.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Area Chart */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Action Governance Timeline</h3>
              <p className="text-xs text-slate-400">Decisions evaluated across chronological intervals</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Allowed
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Review
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Blocked
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.timeline_series || []}>
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="ALLOW" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="REVIEW" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                <Area type="monotone" dataKey="BLOCK" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Decision Ratio Donut */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5">Firewall Decisions</h3>
            <p className="text-xs text-slate-400 mb-4">Laya AI + Security policy distribution</p>
          </div>
          <div className="h-44 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={(DECISION_COLORS as any)[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400">Total Checked</span>
              <span className="text-xl font-bold font-mono text-white">{stats?.total_actions || 0}</span>
            </div>
          </div>
          <div className="flex justify-around text-xs pt-2 border-t border-slate-800/80">
            <div className="text-center">
              <div className="text-emerald-400 font-bold">{stats?.decision_distribution.ALLOW || 0}</div>
              <div className="text-[10px] text-slate-400">Allowed</div>
            </div>
            <div className="text-center">
              <div className="text-amber-400 font-bold">{stats?.decision_distribution.REVIEW || 0}</div>
              <div className="text-[10px] text-slate-400">Review</div>
            </div>
            <div className="text-center">
              <div className="text-rose-400 font-bold">{stats?.decision_distribution.BLOCK || 0}</div>
              <div className="text-[10px] text-slate-400">Blocked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Intercepted Activity Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Live Intercepted Agent Activity</h3>
            <p className="text-xs text-slate-400">Real-time decisions as agents request tool executions</p>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('explorer')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Tool</th>
                <th className="py-2.5 px-3">Action & Target</th>
                <th className="py-2.5 px-3">Environment</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {recentActions.map((act) => (
                <tr key={act.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3 px-3 font-mono font-medium text-cyan-300">{act.agent_id}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 capitalize font-mono text-[11px]">
                      {act.tool}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{act.action}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{act.target}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-[11px] uppercase text-slate-300 font-mono">{act.environment}</span>
                  </td>
                  <td className="py-3 px-3">
                    <RiskBadge score={act.risk_score} />
                  </td>
                  <td className="py-3 px-3">
                    <DecisionBadge decision={act.final_decision} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectAction(act.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-white transition font-medium text-xs"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
