import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { DecisionType } from '../types';

interface Props {
  decision: DecisionType | string;
  size?: 'sm' | 'md' | 'lg';
}

export const DecisionBadge: React.FC<Props> = ({ decision, size = 'md' }) => {
  const d = (decision || '').toUpperCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3.5 py-1.5 text-sm font-bold',
  }[size];

  if (d === 'ALLOW') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 ${sizeClasses}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ALLOW
      </span>
    );
  }

  if (d === 'REVIEW' || d === 'HUMAN_REVIEW' || d === 'PENDING_APPROVAL') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 ${sizeClasses}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        {d === 'HUMAN_REVIEW' ? 'HUMAN REVIEW' : 'REVIEW'}
      </span>
    );
  }

  if (d === 'BLOCK' || d === 'BLOCKED') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 ${sizeClasses}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        BLOCK
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 ${sizeClasses}`}>
      <Clock className="w-3.5 h-3.5" />
      {d || 'UNKNOWN'}
    </span>
  );
};
