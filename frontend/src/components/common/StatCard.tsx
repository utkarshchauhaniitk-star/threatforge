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
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    border: 'border-slate-800 hover:border-cyan-500/30',
    glow: 'from-cyan-500/5',
  },
  rose: {
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    border: 'border-slate-800 hover:border-rose-500/30',
    glow: 'from-rose-500/5',
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    border: 'border-slate-800 hover:border-amber-500/30',
    glow: 'from-amber-500/5',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    border: 'border-slate-800 hover:border-emerald-500/30',
    glow: 'from-emerald-500/5',
  },
  purple: {
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    border: 'border-slate-800 hover:border-purple-500/30',
    glow: 'from-purple-500/5',
  },
  slate: {
    iconBg: 'bg-slate-800 text-slate-300 border-slate-700',
    border: 'border-slate-800 hover:border-slate-700',
    glow: 'from-slate-700/5',
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
  const styles = variantStyles[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-b ${styles.glow} to-slate-900/90 bg-slate-900/60 p-5 border ${styles.border} transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold font-mono text-slate-100 tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg border ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-3 inline-block">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
};
