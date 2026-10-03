import React, { useEffect, useState } from 'react';
import { Wrench, Shield, CheckCircle2, Play, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { ToolItem } from '../types';

export const ToolsPage: React.FC = () => {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick interactive tester
  const [selectedTool, setSelectedTool] = useState('database');
  const [testAction, setTestAction] = useState('read');
  const [testTarget, setTestTarget] = useState('customers');
  const [testPayload, setTestPayload] = useState('{"limit": 5}');
  const [testOutput, setTestOutput] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  const loadTools = async () => {
    try {
      setLoading(true);
      const data = await api.getTools();
      setTools(data);
    } catch (err) {
      console.error('Failed to load tools:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  const handleTestExecution = async () => {
    try {
      setEvaluating(true);
      let params = {};
      try {
        params = JSON.parse(testPayload);
      } catch {
        params = { raw: testPayload };
      }

      // First run through AgentShield evaluation firewall
      const evalRes = await api.evaluateAction({
        agent_id: 'InteractiveConsoleTester',
        tool: selectedTool,
        action: testAction,
        target: testTarget,
        environment: 'production',
        parameters: params,
        auto_execute_if_allowed: true,
      });

      setTestOutput(evalRes);
    } catch (err: any) {
      setTestOutput({ error: err.message });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            Registered Tools & Sandboxed Gateways
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tools connected to the platform. Dangerous commands are safely intercepted and simulated with zero destructive impact.
          </p>
        </div>
        <button
          onClick={loadTools}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((t) => {
          const sensColor =
            t.sensitivity_level === 'CRITICAL'
              ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
              : t.sensitivity_level === 'HIGH'
              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              : t.sensitivity_level === 'MEDIUM'
              ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';

          return (
            <div
              key={t.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">{t.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sensColor}`}>
                  {t.sensitivity_level} SENSITIVITY
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{t.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                {t.description || 'Simulated environment gateway'}
              </p>
              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400">{t.category}</span>
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-emerald-500/30 text-emerald-300 font-mono text-[10px]">
                  Safe Sandbox Active
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Tool Firewall Tester */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Interactive Tool Execution & Decision Gateway Console</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target Tool</label>
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="database">database</option>
              <option value="email">email</option>
              <option value="github">github</option>
              <option value="file">file</option>
              <option value="web_search">web_search</option>
              <option value="payment">payment</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Action</label>
            <input
              type="text"
              value={testAction}
              onChange={(e) => setTestAction(e.target.value)}
              placeholder="read / delete / transfer"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Target</label>
            <input
              type="text"
              value={testTarget}
              onChange={(e) => setTestTarget(e.target.value)}
              placeholder="production.users"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestExecution}
              disabled={evaluating}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Intercept & Evaluate
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Parameters (JSON)</label>
          <input
            type="text"
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none"
          />
        </div>

        {/* Live Interception Output */}
        {testOutput && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Gateway Decision Response:</span>
              <span
                className={`font-bold ${
                  testOutput.decision === 'ALLOW'
                    ? 'text-emerald-400'
                    : testOutput.decision === 'BLOCK'
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                [{testOutput.decision}] Risk: {testOutput.risk_score}/100
              </span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto bg-slate-900/80 p-3 rounded border border-slate-800/80">
              {JSON.stringify(testOutput, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
