import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Sliders,
  Database,
  Trash2,
  PlayCircle,
  RefreshCw,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { api } from '../services/api';
import { DetectionRule, HealthStatus } from '../types';
import { Badge } from '../components/common/Badge';

export const SettingsPage: React.FC = () => {
  const { showToast, triggerRefresh } = useOutletContext<{
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
    triggerRefresh: () => void;
  }>();

  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, healthData] = await Promise.all([api.getRules(), api.getHealth()]);
      setRules(rulesData);
      setHealth(healthData);
    } catch (err: any) {
      showToast(`Failed to load settings data: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    try {
      const updated = await api.updateRule(ruleId, { is_enabled: !currentEnabled });
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
      showToast(`Rule '${ruleId}' ${!currentEnabled ? 'enabled' : 'disabled'}.`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Rule update error: ${err.message}`, 'error');
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to clear all telemetry and alerts from the database?')) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await api.resetDemoData();
      showToast(res.message, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Reset error: ${err.message}`, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleForceReload = async () => {
    try {
      setIsReloading(true);
      const res = await api.loadDemoData(true);
      showToast(res.message, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Reload error: ${err.message}`, 'error');
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">Detection Rules & Configuration</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage threat engine correlation policies, inspect telemetry health, and manage demo datasets.
        </p>
      </div>

      {/* Detection Rules Config Table */}
      <div className="p-5 rounded-2xl bg-[#0B111E] border border-slate-800/80 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
              <Sliders className="w-4 h-4 text-sky-400" /> Active Detection Policies
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Explainable rules mapped to MITRE ATT&CK techniques with configurable thresholds.
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono cursor-pointer active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Rule Name / ID</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">MITRE ATT&CK</th>
                <th className="py-3 px-4">Detection Logic</th>
                <th className="py-3 px-4 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    Loading detection rules...
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          rule.is_enabled ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                        }`}
                      ></span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-200">{rule.name}</div>
                      <div className="text-[11px] text-sky-400 font-mono font-semibold">{rule.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={rule.severity} variant="severity" size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-300">
                      {rule.mitre_attack_id ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/80 text-sky-300 font-semibold">
                          {rule.mitre_attack_id}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-xs max-w-md leading-relaxed">
                      {rule.logic_description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.is_enabled)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer active:scale-95 shadow-sm ${
                          rule.is_enabled
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/80 hover:bg-emerald-900/80 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                        }`}
                      >
                        {rule.is_enabled ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: System Health & Demo Dataset Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System & API Diagnostics */}
        <div className="p-5 rounded-2xl bg-[#0B111E] border border-slate-800/80 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
            <Cpu className="w-4 h-4 text-sky-400" /> Platform Infrastructure
          </h3>
          <p className="text-xs text-slate-400">
            Health diagnostics and active database driver connectivity status.
          </p>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API Gateway Status:</span>
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 shadow-[0_0_6px_rgba(16,185,129,0.8)]" /> {health?.status || 'Active'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database Driver:</span>
              <span className="text-slate-200 font-semibold">{health?.database || 'Connected'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Environment:</span>
              <span className="text-sky-300 uppercase font-bold">{health?.environment || 'development'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Platform Version:</span>
              <span className="text-slate-300">{health?.version || '1.0.0'}</span>
            </div>
          </div>
        </div>

        {/* Demo Telemetry Controls */}
        <div className="p-5 rounded-2xl bg-[#0B111E] border border-slate-800/80 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
            <Database className="w-4 h-4 text-sky-400" /> Dataset Management
          </h3>
          <p className="text-xs text-slate-400">
            Load or reset realistic synthetic security scenarios for recruiter demonstrations and interviews.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleForceReload}
              disabled={isReloading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs transition-all duration-150 shadow-lg shadow-blue-500/25 cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PlayCircle className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
              {isReloading ? 'Reloading...' : 'Reload Synthetic Dataset (Fresh Seed)'}
            </button>

            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-950 hover:bg-rose-950/50 text-rose-300 border border-rose-900/60 font-semibold text-xs transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              {isResetting ? 'Resetting...' : 'Reset & Clear All Telemetry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
