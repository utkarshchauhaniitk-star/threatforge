import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import {
  Printer,
  CheckCircle,
  FileCode,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { IncidentReport, Investigation } from '../types';
import { Badge } from '../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultInvId = searchParams.get('investigation_id') || '';

  const { showToast } = useOutletContext<{
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  }>();

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInvId, setSelectedInvId] = useState<string>(defaultInvId);
  const [reportTitle, setReportTitle] = useState('ThreatForge Incident Summary Report');
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load investigations list for dropdown
    api.getInvestigations().then(setInvestigations).catch(() => {});
  }, []);

  const handleGenerateReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const data = await api.generateReport({
        title: reportTitle,
        investigation_id: selectedInvId || undefined,
        time_range_hours: 48,
        include_events: true,
        include_notes: true,
      });
      setReport(data);
      showToast('Incident report compiled successfully!', 'success');
    } catch (err: any) {
      showToast(`Failed to generate report: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateReport();
  }, [selectedInvId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white font-mono">Incident Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate, preview, and export incident investigation summaries for security audits.
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2.5">
            <a
              href={api.getReportDownloadUrl('csv', selectedInvId || undefined)}
              download
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer active:scale-95 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </a>
            <a
              href={api.getReportDownloadUrl('json', selectedInvId || undefined)}
              download
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer active:scale-95 shadow-sm"
            >
              <FileCode className="w-4 h-4 text-sky-400" />
              <span>Export JSON</span>
            </a>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-blue-500/25 transition cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Generator Configuration Panel */}
      <form onSubmit={handleGenerateReport} className="p-4 rounded-2xl bg-[#0B111E] border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-xl">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Target Investigation</label>
          <select
            value={selectedInvId}
            onChange={(e) => setSelectedInvId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
          >
            <option value="">All Recent Alerts & Incidents</option>
            {investigations.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.id} - {inv.title.slice(0, 35)}...
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Report Title</label>
          <input
            type="text"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-500/40 transition cursor-pointer active:scale-[0.98] shadow-md shadow-blue-600/20 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Compile Report
          </button>
        </div>
      </form>

      {/* Report Preview Document */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 font-mono text-sm">
          Compiling report telemetry and forensic evidence...
        </div>
      ) : report ? (
        <div className="rounded-2xl bg-[#0B111E] border border-slate-800/80 p-6 sm:p-10 space-y-8 shadow-2xl print:bg-white print:text-black print:border-none print:p-0">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-700/80 text-sky-300 font-mono text-[11px] uppercase tracking-wider font-bold">
                  Incident Response Summary
                </span>
                <span className="text-slate-400 font-mono text-xs">{report.report_id}</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white font-mono">{report.title}</h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Generated: {new Date(report.generated_at).toUTCString()}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-sky-400">ThreatForge Telemetry</span>
              <p className="text-[11px] text-slate-400">Security Operations Center</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">1. Executive Summary</h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 font-sans">
              {report.summary}
            </p>
          </div>

          {/* Investigation Details (if present) */}
          {report.investigation && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                2. Active Investigation Profile
              </h3>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-300">{report.investigation.id}</span>
                    <span className="font-bold text-slate-200">{report.investigation.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={report.investigation.status} variant="status" />
                    <Badge label={report.investigation.priority} variant="severity" />
                  </div>
                </div>
                <p className="text-slate-300 font-sans">{report.investigation.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-400 pt-1">
                  <span>Assigned: {report.investigation.assigned_to}</span>
                  <span>Opened: {report.investigation.created_at?.slice(0, 10)}</span>
                  <span>Notes: {report.investigation.notes?.length || 0} logged</span>
                </div>
              </div>
            </div>
          )}

          {/* Root-Cause Findings */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">3. Root-Cause Findings</h3>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed font-sans">
              {report.findings || 'No formal analyst findings recorded yet.'}
            </div>
          </div>

          {/* Detection Rules Triggered */}
          {report.detection_rules_triggered.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                4. Triggered Detection Logic (MITRE ATT&CK)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.detection_rules_triggered.map((rule) => (
                  <div key={rule.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{rule.name}</span>
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-950/80 text-sky-300 border border-blue-800 font-semibold">
                        {rule.mitre_attack_id || 'MITRE'}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs font-sans leading-relaxed">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Associated */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              5. Correlated Threat Alerts ({report.alerts.length})
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Alert ID</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Rule Name</th>
                    <th className="py-2.5 px-3">Source IP</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/50">
                  {report.alerts.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 px-3 text-sky-300 font-bold">{a.id}</td>
                      <td className="py-2 px-3">
                        <Badge label={a.severity} variant="severity" size="sm" />
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-200 font-medium">{a.title}</td>
                      <td className="py-2 px-3 text-slate-300">{a.source_ip || 'N/A'}</td>
                      <td className="py-2 px-3 text-slate-400">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">6. Remediation Guidance</h3>
            <ul className="space-y-2 text-xs text-slate-300 font-sans">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations and Disclaimer */}
          <div className="pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-mono">
              <span className="text-slate-300 font-bold block mb-1">AUDIT DISCLAIMER:</span>
              {report.limitations}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
