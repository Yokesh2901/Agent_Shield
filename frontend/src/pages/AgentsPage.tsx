import React, { useEffect, useState } from 'react';
import { Bot, Shield, CheckCircle2, AlertTriangle, Play, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { AgentItem } from '../types';

interface Props {
  onRunSimulationWithAgent?: (agentId: string) => void;
}

export const AgentsPage: React.FC<Props> = ({ onRunSimulationWithAgent }) => {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.getAgents();
      setAgents(data);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            Registered AI Agents & Trust Profiles
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Agents monitored and intercepted by AgentShield decision firewall before tool execution.
          </p>
        </div>
        <button
          onClick={loadAgents}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agents.map((agent) => {
          const trustColor =
            agent.trust_level === 'HIGH'
              ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
              : agent.trust_level === 'MEDIUM'
              ? 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30'
              : 'text-amber-400 bg-amber-950/60 border-amber-500/30';

          return (
            <div
              key={agent.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${trustColor}`}>
                    {agent.trust_level} TRUST
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                <span className="text-[10px] font-mono text-cyan-400 block mb-2">{agent.agent_type}</span>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                  {agent.description || 'Autonomous agent monitored by AgentShield'}
                </p>

                {/* Allowed Tools */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">
                    Permitted Tool Integrations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.allowed_tools && agent.allowed_tools.length > 0 ? (
                      agent.allowed_tools.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No tools bound</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active & Monitored
                </span>
                {onRunSimulationWithAgent && (
                  <button
                    onClick={() => onRunSimulationWithAgent(agent.id)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Simulate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
