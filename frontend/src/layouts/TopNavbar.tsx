import React, { useState, useEffect } from 'react';
import { Menu, Play, Zap } from 'lucide-react';
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
          : 'Threat detection scan completed: No new conditions triggered.',
        newAlerts.length > 0 ? 'info' : 'success'
      );
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      onShowToast(`Detection error: ${err.message}`, 'error');
    } finally {
      setIsRunningRules(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-[#090E1A]/90 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer lg:hidden active:scale-95"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Backend live status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy === null
                ? 'bg-slate-500'
                : isBackendHealthy
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
            }`}
          ></span>
          <span className="text-slate-300 font-medium">
            {isBackendHealthy === null
              ? 'Connecting...'
              : isBackendHealthy
              ? 'SOC Core Engine: Online'
              : 'API Offline'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={handleRunDetections}
          disabled={isRunningRules}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-sky-300 border border-sky-500/30 hover:border-sky-400/60 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          title="Scan recent events with all detection rules"
        >
          <Zap className={`w-3.5 h-3.5 ${isRunningRules ? 'animate-spin text-sky-400' : ''}`} />
          <span className="hidden sm:inline">Run Detection</span>
        </button>

        <button
          onClick={handleLoadDemo}
          disabled={isLoadingDemo}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className={`w-3.5 h-3.5 ${isLoadingDemo ? 'animate-spin' : ''}`} />
          <span>{isLoadingDemo ? 'Loading...' : 'Load Demo Data'}</span>
        </button>
      </div>
    </header>
  );
};
