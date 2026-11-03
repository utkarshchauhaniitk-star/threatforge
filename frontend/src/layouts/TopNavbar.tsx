import React, { useState, useEffect } from 'react';
import { Menu, Play, RefreshCw, Zap, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface TopNavbarProps {
  onToggleMobileMenu: () => void;
  onRefreshData?: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleMobileMenu,
  onRefreshData,
  onShowToast,
}) => {
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isRunningRules, setIsRunningRules] = useState(false);

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setIsBackendHealthy(res.status === 'healthy');
    } catch {
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      const res = await api.loadDemoData(false);
      onShowToast(res.message, 'success');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowToast(`Failed to load demo data: ${err.message}`, 'error');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleRunDetections = async () => {
    try {
      setIsRunningRules(true);
      const newAlerts = await api.runDetections();
      onShowToast(
        newAlerts.length > 0
          ? `Threat detection engine triggered ${newAlerts.length} new alert(s)!`
          : 'Threat detection completed: No new alert conditions triggered.',
        newAlerts.length > 0 ? 'info' : 'success'
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowToast(`Failed to run detections: ${err.message}`, 'error');
    } finally {
      setIsRunningRules(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-900 lg:hidden"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Backend status indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy === null
                ? 'bg-slate-500'
                : isBackendHealthy
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          ></span>
          <span className="text-slate-300">
            {isBackendHealthy === null
              ? 'Connecting...'
              : isBackendHealthy
              ? 'Backend API Live'
              : 'API Offline'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleRunDetections}
          disabled={isRunningRules}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 transition disabled:opacity-50"
          title="Scan recent events with all detection rules"
        >
          <Zap className={`w-3.5 h-3.5 ${isRunningRules ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Run Detection</span>
        </button>

        <button
          onClick={handleLoadDemo}
          disabled={isLoadingDemo}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          <span>{isLoadingDemo ? 'Loading...' : 'Load Demo Data'}</span>
        </button>
      </div>
    </header>
  );
};
