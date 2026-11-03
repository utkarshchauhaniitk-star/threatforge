import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  FolderKanban,
  Radio,
  ExternalLink,
  Flame,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const { refreshKey, showToast, triggerRefresh } = useOutletContext<{
    refreshKey: number;
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
    triggerRefresh: () => void;
  }>();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to ThreatForge API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      const res = await api.loadDemoData(false);
      showToast(res.message, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-900 rounded-xl border border-slate-800"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-900 rounded-xl border border-slate-800"></div>
          <div className="h-72 bg-slate-900 rounded-xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-950/20 border border-rose-900 text-center">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-rose-300">API Connection Failed</h3>
        <p className="mt-1 text-sm text-slate-400">{error}</p>
        <button
          onClick={loadStats}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!stats || stats.total_events === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">SOC Operations Center</h1>
          <p className="text-sm text-slate-400">Threat telemetry overview and active attack surfaces.</p>
        </div>
        <EmptyState
          title="Telemetry Database Empty"
          description="ThreatForge has not ingested any security events yet. Load realistic synthetic demonstration data to explore threat detection, rule execution, and incident reports."
          onLoadDemo={handleLoadDemo}
          isLoadingDemo={loadingDemo}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            SOC Operations Center
          </h1>
          <p className="text-sm text-slate-400">
            Real-time security monitoring, alert correlation, and active investigations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={stats.total_events.toLocaleString()}
          subtitle="Normalized telemetry"
          icon={Radio}
          variant="cyan"
        />
        <StatCard
          title="Threat Alerts"
          value={stats.total_alerts}
          subtitle={`${stats.critical_alerts} critical, ${stats.high_alerts} high`}
          icon={ShieldAlert}
          variant="rose"
        />
        <StatCard
          title="Critical Alerts"
          value={stats.critical_alerts}
          subtitle="Requires immediate review"
          icon={Flame}
          variant="rose"
        />
        <StatCard
          title="Active Cases"
          value={stats.active_investigations}
          subtitle={`${stats.total_investigations} total cases`}
          icon={FolderKanban}
          variant="purple"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Volume Over Time */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Security Telemetry Over Time</h3>
              <p className="text-xs text-slate-400">Total events vs. authentication/network failures</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
              Live Stream
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.events_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px' }}
                  labelStyle={{ color: '#F1F5F9', fontWeight: 600, fontSize: '11px' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Total Events"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="failures"
                  name="Failures/Denials"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFail)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Severity Distribution */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-200">Alert Severity Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution across detection tiers</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            {stats.total_alerts > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.severity_distribution.filter((s) => s.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {stats.severity_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1E293B', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No active alerts</p>
            )}
          </div>

          {/* Severity Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {stats.severity_distribution.map((item) => (
              <div key={item.severity} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.severity}
                </span>
                <span className="font-mono font-medium text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Telemetry Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suspicious Source IPs */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Top Suspicious Source IPs</h3>
              <p className="text-xs text-slate-400">Highest volume of failures & triggered alerts</p>
            </div>
            <Link to="/events" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="pb-2.5">Source IP</th>
                  <th className="pb-2.5">Total</th>
                  <th className="pb-2.5">Failures</th>
                  <th className="pb-2.5 text-right">Alerts Triggered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stats.top_source_ips.map((ip) => (
                  <tr key={ip.ip} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 text-cyan-300 font-semibold">{ip.ip}</td>
                    <td className="py-2.5 text-slate-300">{ip.total_events}</td>
                    <td className="py-2.5 text-rose-400 font-medium">{ip.failed_events}</td>
                    <td className="py-2.5 text-right">
                      {ip.alerts_triggered > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/80">
                          {ip.alerts_triggered} Alert{ip.alerts_triggered > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Incidents & Threat Alerts */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Recent Threat Alerts</h3>
              <p className="text-xs text-slate-400">Latest detections matching security rules</p>
            </div>
            <Link to="/alerts" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              Alerts View <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recent_alerts.length > 0 ? (
              stats.recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <Badge label={alert.severity || 'Medium'} variant="severity" size="sm" />
                      <span className="text-xs font-semibold text-slate-200 truncate">{alert.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>IP: {alert.source_ip || 'N/A'}</span>
                      {alert.username && <span>Target: {alert.username}</span>}
                    </div>
                  </div>
                  <Link
                    to="/alerts"
                    className="p-1 text-slate-400 hover:text-cyan-400 transition"
                    title="Investigate Alert"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">No alerts triggered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
