import React from 'react';
import { Database, UploadCloud, PlayCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  onLoadDemo?: () => void;
  onUpload?: () => void;
  isLoadingDemo?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  onLoadDemo,
  onUpload,
  isLoadingDemo = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-dashed border-slate-800 my-6 shadow-xl">
      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-sky-400 mb-4 shadow-[0_0_20px_rgba(56,189,248,0.15)]">
        <Database className="w-8 h-8 animate-pulse" />
      </div>
      <h3 className="text-lg font-bold text-slate-100 font-mono tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">{description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onLoadDemo && (
          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-xs transition-all duration-150 shadow-lg shadow-blue-500/25 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlayCircle className={`w-4 h-4 ${isLoadingDemo ? 'animate-spin' : ''}`} />
            {isLoadingDemo ? 'Populating Telemetry...' : 'Load Demo Data'}
          </button>
        )}
        {onUpload && (
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-md"
          >
            <UploadCloud className="w-4 h-4 text-sky-400" />
            Upload Security Logs
          </button>
        )}
      </div>
    </div>
  );
};
