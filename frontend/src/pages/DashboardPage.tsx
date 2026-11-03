import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  FolderKanban,
  Radio,
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

const CHART_SEVERITY_COLORS: Record<string, string> = {
  Critical: '#F43F5E',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Low: '#10B981',
};

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
            <div key={i} className="h-32 bg-[#0E1526] rounded-xl border border-slate-800"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-[#0E1526] rounded-xl border border-slate-800"></div>
          <div className="h-72 bg-[#0E1526] rounded-xl border border-slate-800"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-900/60 text-center shadow-xl">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3 animate-bounce" />
        <h3 className="text-base font-bold text-rose-300 font-mono">API Connection Offline</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">{error}</p>
        <button
          onClick={loadStats}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer active:scale-95 transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  if (!stats || stats.total_events === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-sky-400 animate-pulse" />
            SOC Operations Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">Live threat telemetry overview and active attack surfaces.</p>
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
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-sky-400 animate-pulse" />
            SOC Operations Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time security monitoring, alert correlation, and active investigations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-semibold rounded-lg bg-[#0E1526] hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-500 cursor-pointer active:scale-95 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={stats.total_events.toLocaleString()}
          subtitle="Normalized telemetry records"
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
          subtitle="Requires immediate triage"
          icon={Flame}
          variant="rose"
        />
        <StatCard
          title="Active Cases"
          value={stats.active_investigations}
          subtitle={`${stats.total_investigations} total logged cases`}
          icon={FolderKanban}
          variant="purple"
        />
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Volume Over Time */}
        <div className="lg:col-span-2 rounded-2xl bg-[#0B111E] border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">Security Telemetry Ingestion Over Time</h3>
              <p className="text-xs text-slate-400">Total volume vs. authentication & firewall failures</p>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-950/80 text-sky-400 border border-blue-800/80 font-semibold">
              Live Stream
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.events_over_time} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070A0F', borderColor: '#1E293B', borderRadius: '10px' }}
                  labelStyle={{ color: '#F8FAFC', fontWeight: 600, fontSize: '11px', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Area
                  type="monotone"
                  dataKey="events"
                  name="Total Events"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="failures"
                  name="Failures/Denials"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFail)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Severity Distribution */}
        <div className="rounded-2xl bg-[#0B111E] border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-100 font-mono">Alert Severity Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution across detection risk tiers</p>
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
                    {stats.severity_distribution.map((entry) => (
                      <Cell
                        key={`cell-${entry.severity}`}
                        fill={CHART_SEVERITY_COLORS[entry.severity] || entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#070A0F', borderColor: '#1E293B', borderRadius: '10px' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500 font-mono">No active alerts</p>
            )}
          </div>

          {/* Severity Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
            {stats.severity_distribution.map((item) => (
              <div key={item.severity} className="flex items-center justify-between p-1 rounded bg-slate-900/40">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: CHART_SEVERITY_COLORS[item.severity] || item.color }}
                  ></span>
                  {item.severity}
                </span>
                <span className="font-bold text-slate-200">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-Column Telemetry Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Suspicious Source IPs */}
        <div className="rounded-2xl bg-[#0B111E] border border-slate-800/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">Top Suspicious Source IPs</h3>
              <p className="text-xs text-slate-400">Highest volume of failures & triggered alerts</p>
            </div>
            <Link
              to="/events"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
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
                    <td className="py-2.5 text-sky-300 font-bold">{ip.ip}</td>
                    <td className="py-2.5 text-slate-300">{ip.total_events}</td>
                    <td className="py-2.5 text-rose-400 font-semibold">{ip.failed_events}</td>
                    <td className="py-2.5 text-right">
                      {ip.alerts_triggered > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-800/80 font-bold text-[11px]">
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

        {/* Recent Threat Alerts */}
        <div className="rounded-2xl bg-[#0B111E] border border-slate-800/80 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">Recent Threat Alerts</h3>
              <p className="text-xs text-slate-400">Latest detections matching security rules</p>
            </div>
            <Link
              to="/alerts"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              Alerts View <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recent_alerts.length > 0 ? (
              stats.recent_alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <Badge label={alert.severity || 'Medium'} variant="severity" size="sm" />
                      <span className="text-xs font-bold text-slate-200 truncate">{alert.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>IP: {alert.source_ip || 'N/A'}</span>
                      {alert.username && <span>Target: {alert.username}</span>}
                    </div>
                  </div>
                  <Link
                    to="/alerts"
                    className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Investigate Alert"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center font-mono">No alerts triggered yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
