import React from 'react';
import { Shield, Radio, UserCheck } from 'lucide-react';
import { UserRole } from '../types';
import { getAuthRole, setAuthRole } from '../api/client';

interface Props {
  currentRole: UserRole;
  onRoleChange: (newRole: UserRole) => void;
  pendingReviewsCount: number;
}

export const Navbar: React.FC<Props> = ({ currentRole, onRoleChange, pendingReviewsCount }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white tracking-wide">AGENTSHIELD</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-semibold">
              v1.0.0
            </span>
          </div>
          <p className="text-xs text-slate-400">AI Agent Security & Action Governance Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Live Full Automation Firewall Gateway status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-emerald-300 font-bold">⚡ 100% Full Automation Active</span>
          <span className="text-emerald-700">|</span>
          <span className="text-slate-400 text-[11px]">Zero Human Delay</span>
        </div>

        {/* RBAC Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg p-1">
          <UserCheck className="w-4 h-4 text-cyan-400 ml-2" />
          <span className="text-xs text-slate-400 hidden md:inline">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => {
              const r = e.target.value as UserRole;
              setAuthRole(r);
              onRoleChange(r);
            }}
            className="bg-slate-950 border border-slate-800 text-xs text-cyan-300 rounded px-2.5 py-1 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ADMIN">ADMIN</option>
            <option value="SECURITY_ANALYST">SECURITY_ANALYST</option>
            <option value="DEVELOPER">DEVELOPER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        </div>
      </div>
    </header>
  );
};
