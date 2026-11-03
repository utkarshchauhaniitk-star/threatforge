import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'severity' | 'status' | 'default';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'sm' }) => {
  const normalized = label?.toLowerCase() || '';

  let colorClasses = 'bg-slate-900/80 text-slate-300 border-slate-700/80';
  let dotColor = 'bg-slate-400';

  if (variant === 'severity' || variant === 'default') {
    if (normalized === 'critical') {
      colorClasses = 'bg-rose-950/70 text-rose-300 border-rose-700/60 shadow-[0_0_8px_rgba(244,63,94,0.2)]';
      dotColor = 'bg-rose-400 animate-pulse';
    } else if (normalized === 'high') {
      colorClasses = 'bg-amber-950/70 text-amber-300 border-amber-700/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]';
      dotColor = 'bg-amber-400';
    } else if (normalized === 'medium') {
      colorClasses = 'bg-blue-950/70 text-blue-300 border-blue-700/60 shadow-[0_0_8px_rgba(59,130,246,0.15)]';
      dotColor = 'bg-blue-400';
    } else if (normalized === 'low') {
      colorClasses = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
      dotColor = 'bg-emerald-400';
    }
  }

  if (variant === 'status') {
    if (normalized === 'new' || normalized === 'open') {
      colorClasses = 'bg-sky-950/70 text-sky-300 border-sky-700/60 shadow-[0_0_8px_rgba(56,189,248,0.15)]';
      dotColor = 'bg-sky-400 animate-pulse';
    } else if (normalized === 'investigating' || normalized === 'in progress') {
      colorClasses = 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60 shadow-[0_0_8px_rgba(99,102,241,0.15)]';
      dotColor = 'bg-indigo-400';
    } else if (normalized === 'resolved' || normalized === 'closed') {
      colorClasses = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
      dotColor = 'bg-emerald-400';
    } else if (normalized === 'false positive') {
      colorClasses = 'bg-slate-900/80 text-slate-400 border-slate-700/60';
      dotColor = 'bg-slate-500';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-md border tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{label}</span>
    </span>
  );
};
