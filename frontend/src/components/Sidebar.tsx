import React from 'react';
import {
  LayoutDashboard,
  PlaySquare,
  Clock,
  Search,
  ShieldCheck,
  Bot,
  Wrench,
  FileText,
  Sliders,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'simulator'
  | 'approvals'
  | 'explorer'
  | 'policies'
  | 'agents'
  | 'tools'
  | 'audit'
  | 'settings';

interface Props {
  activePage: PageId;
  onPageSelect: (page: PageId) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<Props> = ({ activePage, onPageSelect, pendingApprovalsCount }) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Overview', icon: LayoutDashboard },
    { id: 'simulator' as PageId, label: 'Test Simulator', icon: PlaySquare, badge: 'Live' },
    { id: 'approvals' as PageId, label: 'Needs Approval', icon: Clock, count: pendingApprovalsCount },
    { id: 'explorer' as PageId, label: 'Action History', icon: Search },
    { id: 'policies' as PageId, label: 'Security Rules', icon: ShieldCheck },
    { id: 'agents' as PageId, label: 'AI Agents', icon: Bot },
    { id: 'tools' as PageId, label: 'Connected Tools', icon: Wrench },
    { id: 'audit' as PageId, label: 'Audit Trail', icon: FileText },
    { id: 'settings' as PageId, label: 'System Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/80 p-4 flex flex-col justify-between shrink-0">
      <nav className="space-y-1">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Platform Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageSelect(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/70 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Helpful explanation card */}
      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs mt-6">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Zero-Trust Shield</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          AI actions are held before execution. Laya reasoning + deterministic rules prevent accidental damage.
        </p>
      </div>
    </aside>
  );
};
