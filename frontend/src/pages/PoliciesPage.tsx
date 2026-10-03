import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Trash2, CheckCircle2, ShieldAlert, AlertTriangle, ArrowRight, Save } from 'lucide-react';
import { api, getAuthRole } from '../api/client';
import { PolicyItem } from '../types';

export const PoliciesPage: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tool, setTool] = useState('');
  const [action, setAction] = useState('');
  const [environment, setEnvironment] = useState('');
  const [role, setRole] = useState('');
  const [effect, setEffect] = useState<'BLOCK' | 'HUMAN_REVIEW' | 'ALLOW'>('BLOCK');
  const [minCount, setMinCount] = useState<number | ''>('');
  const [priority, setPriority] = useState<number>(10);

  const currentRole = getAuthRole();
  const isAdmin = currentRole === 'ADMIN';

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert(`Forbidden: Only ADMIN can create or modify policies. Current role: ${currentRole}`);
      return;
    }
    if (!name.trim()) {
      alert('Policy name is required');
      return;
    }

    try {
      const condition: Record<string, any> = {};
      if (minCount !== '') condition.min_count = Number(minCount);

      await api.createPolicy({
        name,
        description: description || 'Custom zero-trust rule defined in Policy Builder',
        tool: tool || null,
        action: action || null,
        environment: environment || null,
        role: role || null,
        condition_expression: condition,
        effect,
        priority,
        is_active: true,
      });

      // Reset
      setName('');
      setDescription('');
      setTool('');
      setAction('');
      setEnvironment('');
      setRole('');
      setMinCount('');
      setShowBuilder(false);
      await loadPolicies();
    } catch (err: any) {
      alert(err.message || 'Failed to create policy');
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!isAdmin) {
      alert(`Forbidden: Only ADMIN can delete policies. Current role: ${currentRole}`);
      return;
    }
    if (confirm('Are you sure you want to delete this security policy?')) {
      try {
        await api.deletePolicy(id);
        await loadPolicies();
      } catch (err: any) {
        alert(err.message || 'Failed to delete policy');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Security Policy Builder & Rules Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Define deterministic security invariants that always override agent or model decisions. Stored in PostgreSQL.
          </p>
        </div>

        <button
          onClick={() => setShowBuilder(!showBuilder)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-900"
        >
          <Plus className="w-4 h-4" />
          {showBuilder ? 'Close Builder' : 'New Security Policy'}
        </button>
      </div>

      {/* Interactive Policy Builder Panel */}
      {showBuilder && (
        <form onSubmit={handleCreatePolicy} className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Policy Condition Builder (IF ... THEN ...)
              </h3>
              <p className="text-[11px] text-slate-400">Rule engine evaluates priority order (lower number = higher priority)</p>
            </div>
            <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/40">
              Target Storage: PostgreSQL
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Policy Rule Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Block Production Database Drop For Non-Admins"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Audit Rationale</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Rationale recorded in audit log upon trigger"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* IF Conditions */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
              1. IF Matching Criteria (Leave blank to match ANY)
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Tool</label>
                <select
                  value={tool}
                  onChange={(e) => setTool(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="">Any Tool (*)</option>
                  <option value="database">database</option>
                  <option value="email">email</option>
                  <option value="github">github</option>
                  <option value="file">file</option>
                  <option value="payment">payment</option>
                  <option value="web_search">web_search</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Action</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="">Any Action (*)</option>
                  <option value="delete">delete</option>
                  <option value="drop">drop</option>
                  <option value="update">update</option>
                  <option value="transfer">transfer</option>
                  <option value="send">send</option>
                  <option value="read">read</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Environment</label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="">Any Environment (*)</option>
                  <option value="production">production</option>
                  <option value="staging">staging</option>
                  <option value="development">development</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                >
                  <option value="">Any Role (*)</option>
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="VIEWER">VIEWER</option>
                  <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Min Blast Radius (Affected records &gt;=)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={minCount}
                  onChange={(e) => setMinCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Rule Priority (Lower = higher precedence)</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* THEN Effect */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
              2. THEN Enforced Outcome
            </span>
            <div className="grid grid-cols-3 gap-3">
              {(['BLOCK', 'HUMAN_REVIEW', 'ALLOW'] as const).map((eff) => (
                <button
                  key={eff}
                  type="button"
                  onClick={() => setEffect(eff)}
                  className={`p-3 rounded-lg border text-center transition font-bold text-xs ${
                    effect === eff
                      ? eff === 'BLOCK'
                        ? 'bg-rose-950 text-rose-300 border-rose-500 shadow-md ring-1 ring-rose-500/40'
                        : eff === 'HUMAN_REVIEW'
                        ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {eff === 'HUMAN_REVIEW' ? 'HUMAN REVIEW' : eff}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBuilder(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-900"
            >
              <Save className="w-4 h-4" />
              Save Policy to Engine
            </button>
          </div>
        </form>
      )}

      {/* Active Policies Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Active Deterministic Policies ({policies.length})</h3>
          <span className="text-[11px] text-slate-400 font-mono">Enforced across all agent requests</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Condition (Tool / Action / Env)</th>
                <th className="py-3 px-4">Condition Filters</th>
                <th className="py-3 px-4">Effect</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {policies.map((pol) => (
                <tr key={pol.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-cyan-400 font-bold">#{pol.priority}</td>
                  <td className="py-3 px-4">
                    <div className="text-white font-semibold">{pol.name}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[240px]">{pol.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    <span className="text-cyan-400">{pol.tool || '*'}</span> :{' '}
                    <span className="text-slate-200">{pol.action || '*'}</span> @{' '}
                    <span className="text-amber-400">{pol.environment || '*'}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {pol.condition_expression && Object.keys(pol.condition_expression).length > 0
                      ? JSON.stringify(pol.condition_expression)
                      : 'None'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        pol.effect === 'BLOCK'
                          ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                          : pol.effect === 'HUMAN_REVIEW'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {pol.effect}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeletePolicy(pol.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                      title="Delete Policy"
                    >
                      <Trash2 className="w-4 h-4" />
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
