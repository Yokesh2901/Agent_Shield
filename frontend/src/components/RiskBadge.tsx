import React from 'react';
import { RiskLevel } from '../types';

interface Props {
  score: number;
  level?: RiskLevel | string;
  showScore?: boolean;
}

export const RiskBadge: React.FC<Props> = ({ score, level, showScore = true }) => {
  let computedLevel: RiskLevel = 'LOW';
  if (score >= 85) computedLevel = 'CRITICAL';
  else if (score >= 60) computedLevel = 'HIGH';
  else if (score >= 30) computedLevel = 'MEDIUM';

  const finalLevel = (level || computedLevel).toUpperCase();

  const colorStyles: Record<string, string> = {
    LOW: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    MEDIUM: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    HIGH: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    CRITICAL: 'bg-rose-950/60 text-rose-300 border-rose-500/40 animate-pulse',
  };

  const badgeClass = colorStyles[finalLevel] || colorStyles.LOW;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{finalLevel}</span>
      {showScore && <span className="opacity-75 font-mono text-[11px]">({score}/100)</span>}
    </span>
  );
};
