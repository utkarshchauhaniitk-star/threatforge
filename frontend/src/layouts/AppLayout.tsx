import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar isOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopNavbar
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onRefreshData={handleRefresh}
          onShowToast={showToast}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ refreshKey, showToast, triggerRefresh: handleRefresh }} />
        </main>
      </div>

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((toast) => {
          let bg = 'bg-[#0E1526] border-slate-700 text-slate-200';
          let Icon = Info;
          if (toast.type === 'success') {
            bg = 'bg-emerald-950/95 border-emerald-600/80 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-950/95 border-rose-600/80 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
            Icon = XCircle;
          } else if (toast.type === 'info') {
            bg = 'bg-sky-950/95 border-sky-600/80 text-sky-100 shadow-[0_0_15px_rgba(56,189,248,0.2)]';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 ${bg}`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
