import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import {
  FolderKanban,
  ArrowLeft,
  MessageSquare,
  Send,
  Save,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { Investigation, InvestigationStatus, Severity } from '../types';
import { Badge } from '../components/common/Badge';

export const InvestigationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, triggerRefresh } = useOutletContext<{
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
    triggerRefresh: () => void;
  }>();

  const [inv, setInv] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [status, setStatus] = useState<InvestigationStatus>('Open');
  const [priority, setPriority] = useState<Severity>('High');
  const [findings, setFindings] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New Note
  const [newNoteAuthor, setNewNoteAuthor] = useState('SOC Analyst');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const fetchInvestigation = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getInvestigationById(id);
      setInv(data);
      setStatus(data.status);
      setPriority(data.priority);
      setFindings(data.findings || '');
    } catch (err: any) {
      showToast(`Failed to load investigation: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigation();
  }, [id]);

  const handleSaveInvestigation = async () => {
    if (!id) return;
    try {
      setIsSaving(true);
      const updated = await api.updateInvestigation(id, {
        status,
        priority,
        findings,
      });
      setInv(updated);
      showToast('Investigation details & findings updated successfully!', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Update error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newNoteContent.trim()) return;

    try {
      setIsSubmittingNote(true);
      const note = await api.addInvestigationNote(id, {
        author: newNoteAuthor.trim() || 'Analyst',
        content: newNoteContent.trim(),
      });
      setInv((prev) => (prev ? { ...prev, notes: [...prev.notes, note] } : null));
      setNewNoteContent('');
      showToast('Analyst note appended to case timeline.', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Note error: ${err.message}`, 'error');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500 font-mono text-sm">Loading case telemetry...</div>;
  }

  if (!inv) {
    return (
      <div className="p-8 text-center bg-[#0B111E] rounded-2xl border border-slate-800 shadow-xl">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-200 font-mono">Investigation Not Found</h3>
        <p className="text-xs text-slate-400 mt-1">The requested case ID does not exist.</p>
        <Link to="/investigations" className="mt-4 inline-block text-xs text-sky-400 hover:underline font-semibold cursor-pointer">
          Return to investigations list
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/investigations')}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition cursor-pointer active:scale-95"
            aria-label="Back to investigations"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-400">{inv.id}</span>
              <Badge label={inv.status} variant="status" />
              <Badge label={inv.priority} variant="severity" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">{inv.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/reports?investigation_id=${inv.id}`}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 transition cursor-pointer active:scale-[0.98] shadow-sm"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Generate Incident Report</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Left Column Details & Findings, Right Column Notes & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata Card */}
          <div className="p-5 rounded-2xl bg-[#0B111E] border border-slate-800/80 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 font-mono">
              <FolderKanban className="w-4 h-4 text-sky-400" /> Case Details & Scope
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              {inv.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">ASSIGNED ANALYST</span>
                <span className="text-slate-200 font-sans font-semibold">{inv.assigned_to}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">OPENED AT</span>
                <span className="text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">LAST UPDATED</span>
                <span className="text-slate-400">{new Date(inv.updated_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">TOTAL NOTES</span>
                <span className="text-sky-400 font-bold">{inv.notes.length} entries</span>
              </div>
            </div>
          </div>

          {/* Status & Priority Controls */}
          <div className="p-5 rounded-2xl bg-[#0B111E] border border-slate-800/80 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 font-mono">Investigation Status & Triage</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Investigation Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as InvestigationStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed (Resolved)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority Classification</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Severity)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Findings Editor */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Root-Cause Findings & Mitigation Actions
              </label>
              <textarea
                rows={4}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Record forensic conclusions, verified indicators of compromise (IOCs), and containment measures taken..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSaveInvestigation}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-blue-500/20 active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving Changes...' : 'Save Findings & Status'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Case Timeline & Notes Thread */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0B111E] border border-slate-800/80 flex flex-col h-full max-h-[750px] shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4 font-mono">
              <MessageSquare className="w-4 h-4 text-sky-400" /> Analyst Notes & Chronology
            </h3>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {inv.notes.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center font-mono">
                  No notes recorded yet. Add your triage notes below.
                </p>
              ) : (
                inv.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span className="font-bold text-sky-300 font-sans">{note.author}</span>
                      <span>{new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-sans">{note.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="mt-4 pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newNoteAuthor}
                  onChange={(e) => setNewNoteAuthor(e.target.value)}
                  placeholder="Author"
                  className="w-1/3 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
                <input
                  type="text"
                  required
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add investigation update..."
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !newNoteContent.trim()}
                  className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm active:scale-95"
                  title="Send Note"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
