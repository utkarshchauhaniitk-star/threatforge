import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex">
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
          let bg = 'bg-slate-900 border-slate-700 text-slate-200';
          let Icon = Info;
          if (toast.type === 'success') {
            bg = 'bg-emerald-950/90 border-emerald-700/80 text-emerald-200';
            Icon = CheckCircle2;
          } else if (toast.type === 'error') {
            bg = 'bg-rose-950/90 border-rose-700/80 text-rose-200';
            Icon = XCircle;
          } else if (toast.type === 'info') {
            bg = 'bg-cyan-950/90 border-cyan-700/80 text-cyan-200';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 ${bg}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">{toast.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
