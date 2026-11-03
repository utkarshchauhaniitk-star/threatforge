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
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 my-4">
      <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-400 mb-4">
        <Database className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-400">{description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onLoadDemo && (
          <button
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            {isLoadingDemo ? 'Loading Synthetic Data...' : 'Load Demo Data'}
          </button>
        )}
        {onUpload && (
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm transition"
          >
            <UploadCloud className="w-4 h-4 text-slate-400" />
            Upload Security Logs
          </button>
        )}
      </div>
    </div>
  );
};
