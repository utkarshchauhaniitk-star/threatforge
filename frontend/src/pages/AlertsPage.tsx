import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  FolderPlus,
  CheckCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { api } from '../services/api';
import { Alert, AlertStatus, Severity } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const AlertsPage: React.FC = () => {
  const { refreshKey, showToast, triggerRefresh } = useOutletContext<{
    refreshKey: number;
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
    triggerRefresh: () => void;
  }>();

  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Selected Alert for Details Modal
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Create Investigation Modal
  const [createInvModalOpen, setCreateInvModalOpen] = useState(false);
  const [targetAlertForInv, setTargetAlertForInv] = useState<Alert | null>(null);
  const [invTitle, setInvTitle] = useState('');
  const [invDescription, setInvDescription] = useState('');
  const [invPriority, setInvPriority] = useState<Severity>('High');
  const [invAnalyst, setInvAnalyst] = useState('SOC Tier-1 Analyst');
  const [invInitialNote, setInvInitialNote] = useState('');
  const [isSubmittingInv, setIsSubmittingInv] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts({
        page,
        page_size: pageSize,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setAlerts(res.alerts);
      setTotal(res.total);
    } catch (err: any) {
      showToast(`Failed to load alerts: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [page, severityFilter, statusFilter, search, refreshKey]);

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      const updated = await api.updateAlert(alertId, { status: newStatus });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(updated);
      }
      showToast(`Alert ${alertId} updated to '${newStatus}'`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Failed to update status: ${err.message}`, 'error');
    }
  };

  const handleOpenCreateInvestigation = (alert: Alert) => {
    setTargetAlertForInv(alert);
    setInvTitle(`Investigation: ${alert.title} (${alert.source_ip || 'Internal'})`);
    setInvDescription(
      `Investigate security alert ${alert.id} (${alert.rule_name}). Observed suspicious activity targeting ${
        alert.username || 'system'
      } from IP ${alert.source_ip || 'N/A'}.`
    );
    setInvPriority(alert.severity);
    setInvInitialNote('Initiated case review from Threat Alerts dashboard.');
    setCreateInvModalOpen(true);
  };

  const handleSubmitInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAlertForInv) return;

    try {
      setIsSubmittingInv(true);
      const newInv = await api.createInvestigation({
        title: invTitle,
        description: invDescription,
        priority: invPriority,
        assigned_to: invAnalyst,
        alert_id: targetAlertForInv.id,
        initial_note: invInitialNote,
      });

      showToast(`Case ${newInv.id} opened successfully!`, 'success');
      setCreateInvModalOpen(false);
      triggerRefresh();
      navigate(`/investigations/${newInv.id}`);
    } catch (err: any) {
      showToast(`Failed to create investigation: ${err.message}`, 'error');
    } finally {
      setIsSubmittingInv(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Threat Alerts</h1>
          <p className="text-sm text-slate-400">
            Explainable rule-based security alerts triggered by correlated event patterns.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>{total} Total Alert Conditions Active</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search alert title, IP, user..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="False Positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Alert ID</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Title / Detection Rule</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Target User</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Loading alerts...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No threat alerts found matching criteria.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-cyan-400 font-semibold">{alert.id}</td>
                    <td className="py-3 px-4">
                      <Badge label={alert.severity} variant="severity" size="sm" />
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{alert.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{alert.rule_name}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{alert.source_ip || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300">{alert.username || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(alert.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={alert.status}
                        onChange={(e) => handleStatusChange(alert.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="New">New</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Resolved">Resolved</option>
                        <option value="False Positive">False Positive</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="p-1.5 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                          title="View Detection Evidence"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenCreateInvestigation(alert)}
                          className="p-1.5 rounded text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition"
                          title="Open Case Investigation"
                        >
                          <FolderPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <span>
            Showing {alerts.length} of {total} alerts (Page {page} of {totalPages})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Evidence Details Modal */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={`Alert Evidence: ${selectedAlert?.id || ''}`}
        maxWidth="2xl"
      >
        {selectedAlert && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 block font-mono">SEVERITY / STATUS</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge label={selectedAlert.severity} variant="severity" />
                  <Badge label={selectedAlert.status} variant="status" />
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono">RULE ID</span>
                <span className="text-cyan-400 font-mono text-xs">{selectedAlert.rule_id}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-1">Description</h4>
              <p className="text-xs text-slate-300 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                {selectedAlert.description}
              </p>
            </div>

            {selectedAlert.evidence && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1">Evidence Breakdown</h4>
                <pre className="text-[11px] font-mono p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto max-h-56">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedAlert.evidence), null, 2);
                    } catch {
                      return selectedAlert.evidence;
                    }
                  })()}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => handleOpenCreateInvestigation(selectedAlert)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition"
              >
                <FolderPlus className="w-4 h-4" /> Open Investigation
              </button>
              <button
                type="button"
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Investigation Modal */}
      <Modal
        isOpen={createInvModalOpen}
        onClose={() => setCreateInvModalOpen(false)}
        title="Open Security Investigation"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitInvestigation} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Case Title</label>
            <input
              type="text"
              required
              value={invTitle}
              onChange={(e) => setInvTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={invPriority}
                onChange={(e) => setInvPriority(e.target.value as Severity)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Analyst</label>
              <input
                type="text"
                required
                value={invAnalyst}
                onChange={(e) => setInvAnalyst(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Case Scope & Description</label>
            <textarea
              rows={3}
              required
              value={invDescription}
              onChange={(e) => setInvDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Initial Triage Note</label>
            <input
              type="text"
              value={invInitialNote}
              onChange={(e) => setInvInitialNote(e.target.value)}
              placeholder="e.g., Escalated to Tier-2 SOC for containment"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateInvModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingInv}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 transition"
            >
              {isSubmittingInv ? 'Opening Case...' : 'Create Case'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
