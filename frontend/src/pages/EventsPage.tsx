import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  UploadCloud,
  Search,
  Filter,
  Eye,
  AlertCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Code2,
} from 'lucide-react';
import { api } from '../services/api';
import { SecurityEvent, ImportResult } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const EventsPage: React.FC = () => {
  const { refreshKey, showToast, triggerRefresh } = useOutletContext<{
    refreshKey: number;
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
    triggerRefresh: () => void;
  }>();

  // Events list & pagination
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        event_type: eventTypeFilter || undefined,
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
      });
      setEvents(res.events);
      setTotal(res.total);
    } catch (err: any) {
      showToast(`Failed to load security events: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, search, eventTypeFilter, severityFilter, statusFilter, refreshKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadError(null);
      setUploadResult(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const result = await api.uploadLogFile(uploadFile, true);
      setUploadResult(result);
      showToast(result.message, result.success ? 'success' : 'error');
      triggerRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Log upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Security Events</h1>
          <p className="text-sm text-slate-400">
            Normalized log telemetry ingested from endpoints, identity providers, and firewalls.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setUploadFile(null);
              setUploadResult(null);
              setUploadError(null);
              setUploadModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-md shadow-cyan-500/20"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Logs
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search IP, username, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Event Type Filter */}
        <div>
          <select
            value={eventTypeFilter}
            onChange={(e) => {
              setEventTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Event Types</option>
            <option value="authentication">Authentication</option>
            <option value="authorization">Authorization</option>
            <option value="network">Network</option>
            <option value="system">System</option>
          </select>
        </div>

        {/* Severity Filter */}
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
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Status Filter */}
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
            <option value="failure">Failure</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="attempt">Attempt</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Loading security events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No security events matched the current filter criteria.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={ev.severity} variant="severity" size="sm" />
                    </td>
                    <td className="py-3 px-4 text-cyan-300 uppercase text-[11px]">{ev.event_type}</td>
                    <td className="py-3 px-4 text-slate-200">{ev.source_ip}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{ev.username || '—'}</td>
                    <td className="py-3 px-4 text-slate-400">{ev.action}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          ev.status === 'failure' || ev.status === 'denied'
                            ? 'bg-rose-950/50 text-rose-300 border border-rose-900/60'
                            : 'bg-emerald-950/50 text-emerald-300 border border-emerald-900/60'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate" title={ev.description}>
                      {ev.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                        title="View Event Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
            Showing {events.length} of {total} records (Page {page} of {totalPages})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-200">{page}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Log Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Security Logs (.json or .csv)"
        maxWidth="lg"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">
            Upload security event logs in JSON or CSV format. ThreatForge validates schema structure,
            normalizes IP/User/Action parameters, and executes detection rules.
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 text-center cursor-pointer transition bg-slate-950/50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            {uploadFile ? (
              <div>
                <p className="text-sm font-semibold text-slate-200">{uploadFile.name}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  {(uploadFile.size / 1024).toFixed(1)} KB • Click to change file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-300">Click to select log file</p>
                <p className="text-xs text-slate-500 mt-1">Supports JSON array or CSV format (max 10MB)</p>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadResult && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>{uploadResult.message}</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 font-mono">
                Imported: {uploadResult.imported_records} | Failed: {uploadResult.failed_records} | Alerts Generated: {uploadResult.alerts_generated}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!uploadFile || isUploading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 transition"
            >
              {isUploading ? 'Ingesting...' : 'Ingest Logs'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Event Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={`Event Telemetry: ${selectedEvent?.id || ''}`}
        maxWidth="2xl"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">EVENT TYPE</span>
                <span className="text-cyan-300 uppercase">{selectedEvent.event_type}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SEVERITY</span>
                <Badge label={selectedEvent.severity} variant="severity" size="sm" />
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">STATUS</span>
                <span className="text-slate-200">{selectedEvent.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SOURCE IP</span>
                <span className="text-slate-200">{selectedEvent.source_ip}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">DESTINATION IP</span>
                <span className="text-slate-200">{selectedEvent.destination_ip || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">USERNAME</span>
                <span className="text-slate-200">{selectedEvent.username || 'N/A'}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-1">Description</h4>
              <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                {selectedEvent.description}
              </p>
            </div>

            {selectedEvent.raw_event_data && (
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Raw Ingested Payload
                </h4>
                <pre className="text-[11px] font-mono p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto max-h-48">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedEvent.raw_event_data), null, 2);
                    } catch {
                      return selectedEvent.raw_event_data;
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
