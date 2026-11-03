import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Clock,
  User,
  MessageSquare,
  FileCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { Investigation, Severity, InvestigationStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const InvestigationsPage: React.FC = () => {
  const { refreshKey, showToast, triggerRefresh } = useOutletContext<{
    refreshKey: number;
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
    triggerRefresh: () => void;
  }>();

  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Severity>('High');
  const [assignedTo, setAssignedTo] = useState('SOC Tier-2 Lead');
  const [initialNote, setInitialNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvestigations = async () => {
    try {
      setLoading(true);
      const data = await api.getInvestigations({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: search.trim() || undefined,
      });
      setInvestigations(data);
    } catch (err: any) {
      showToast(`Failed to load investigations: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, [statusFilter, priorityFilter, search, refreshKey]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newInv = await api.createInvestigation({
        title,
        description,
        priority,
        assigned_to: assignedTo,
        initial_note: initialNote,
      });
      showToast(`Investigation ${newInv.id} created successfully!`, 'success');
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setInitialNote('');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Creation error: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Incident Investigations</h1>
          <p className="text-sm text-slate-400">
            Case management workflow for threat triage, forensic notes, and root-cause findings.
          </p>
        </div>
        <div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            New Investigation
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search cases, findings, assigned..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Investigation List Cards */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 font-mono text-sm">
          Loading investigations...
        </div>
      ) : investigations.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800">
          <FolderKanban className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-slate-200">No active cases found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Create an investigation from a threat alert or click 'New Investigation'.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {investigations.map((inv) => (
            <div
              key={inv.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-semibold text-cyan-400">{inv.id}</span>
                  <Badge label={inv.priority} variant="severity" size="sm" />
                  <Badge label={inv.status} variant="status" size="sm" />
                </div>
                <h3 className="text-sm font-bold text-slate-100 truncate">{inv.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{inv.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {inv.assigned_to}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(inv.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    {inv.notes?.length || 0} Notes
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={`/investigations/${inv.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  <span>Open Case Workspace</span>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Investigation"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Investigation: Suspicious SSH credential spray"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Severity)}
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
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description / Scope</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe suspected threat activity and scope of review..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Initial Note</label>
            <input
              type="text"
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="Initial triage findings or instructions..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-40 transition"
            >
              {submitting ? 'Creating...' : 'Create Case'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
