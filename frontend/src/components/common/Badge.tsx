import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'severity' | 'status' | 'default';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', size = 'sm' }) => {
  const normalized = label?.toLowerCase() || '';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === 'severity' || variant === 'default') {
    if (normalized === 'critical') {
      colorClasses = 'bg-rose-950/60 text-rose-300 border-rose-800/80 shadow-[0_0_10px_rgba(244,63,94,0.15)]';
    } else if (normalized === 'high') {
      colorClasses = 'bg-orange-950/60 text-orange-300 border-orange-800/80';
    } else if (normalized === 'medium') {
      colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-800/80';
    } else if (normalized === 'low') {
      colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
    }
  }

  if (variant === 'status') {
    if (normalized === 'new' || normalized === 'open') {
      colorClasses = 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80';
    } else if (normalized === 'investigating' || normalized === 'in progress') {
      colorClasses = 'bg-purple-950/60 text-purple-300 border-purple-800/80';
    } else if (normalized === 'resolved' || normalized === 'closed') {
      colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';
    } else if (normalized === 'false positive') {
      colorClasses = 'bg-slate-900 text-slate-400 border-slate-700';
    }
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-md border tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      {label}
    </span>
  );
};
