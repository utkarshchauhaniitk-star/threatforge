import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'purple' | 'slate';
  badge?: string;
}

const variantStyles = {
  cyan: {
    iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
    border: 'border-slate-800/80 hover:border-sky-500/50',
    glow: 'from-sky-500/10 via-slate-900/60 to-slate-950',
  },
  rose: {
    iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    border: 'border-slate-800/80 hover:border-rose-500/50',
    glow: 'from-rose-500/10 via-slate-900/60 to-slate-950',
  },
  amber: {
    iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]',
    border: 'border-slate-800/80 hover:border-amber-500/50',
    glow: 'from-amber-500/10 via-slate-900/60 to-slate-950',
  },
  emerald: {
    iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    border: 'border-slate-800/80 hover:border-emerald-500/50',
    glow: 'from-emerald-500/10 via-slate-900/60 to-slate-950',
  },
  purple: {
    iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]',
    border: 'border-slate-800/80 hover:border-indigo-500/50',
    glow: 'from-indigo-500/10 via-slate-900/60 to-slate-950',
  },
  slate: {
    iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
    border: 'border-slate-800/80 hover:border-slate-600',
    glow: 'from-slate-800/20 via-slate-900/60 to-slate-950',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'cyan',
  badge,
}) => {
  const styles = variantStyles[variant] || variantStyles.cyan;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${styles.glow} p-5 border ${styles.border} transition-all duration-200 hover:-translate-y-0.5 shadow-lg group`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">{title}</p>
          <p className="mt-2 text-3xl font-extrabold font-mono text-slate-100 tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${styles.iconBg} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-3 inline-block">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80 font-medium">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
};
