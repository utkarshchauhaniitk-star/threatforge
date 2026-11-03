import {
  HealthStatus,
  DashboardStats,
  SecurityEvent,
  Alert,
  Investigation,
  InvestigationNote,
  DetectionRule,
  IncidentReport,
  ImportResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errorJson = await res.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (errorJson.detail?.message) {
        errorDetail = errorJson.detail.message;
        if (Array.isArray(errorJson.detail.errors)) {
          errorDetail += `: ${errorJson.detail.errors.join(', ')}`;
        }
      } else if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      // Use status text fallback
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  // Health
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<HealthStatus>(res);
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return handleResponse<DashboardStats>(res);
  },

  // Security Events
  async getEvents(params: {
    page?: number;
    page_size?: number;
    search?: string;
    event_type?: string;
    severity?: string;
    status?: string;
    source_ip?: string;
    username?: string;
  }): Promise<{ total: number; page: number; page_size: number; events: SecurityEvent[] }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.event_type) searchParams.append('event_type', params.event_type);
    if (params.severity) searchParams.append('severity', params.severity);
    if (params.status) searchParams.append('status', params.status);
    if (params.source_ip) searchParams.append('source_ip', params.source_ip);
    if (params.username) searchParams.append('username', params.username);

    const res = await fetch(`${API_BASE}/events?${searchParams.toString()}`);
    return handleResponse(res);
  },

  async getEventById(id: string): Promise<SecurityEvent> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    return handleResponse<SecurityEvent>(res);
  },

  async uploadLogFile(file: File, autoDetect: boolean = true): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/events/upload?auto_detect=${autoDetect}`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<ImportResult>(res);
  },

  // Threat Alerts
  async getAlerts(params: {
    page?: number;
    page_size?: number;
    severity?: string;
    status?: string;
    search?: string;
  }): Promise<{ total: number; page: number; page_size: number; alerts: Alert[] }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.page_size) searchParams.append('page_size', params.page_size.toString());
    if (params.severity) searchParams.append('severity', params.severity);
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);

    const res = await fetch(`${API_BASE}/alerts?${searchParams.toString()}`);
    return handleResponse(res);
  },

  async getAlertById(id: string): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${id}`);
    return handleResponse<Alert>(res);
  },

  async updateAlert(id: string, updateData: { status?: string; note?: string }): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    return handleResponse<Alert>(res);
  },

  // Incident Investigations
  async getInvestigations(params?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<Investigation[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);
    if (params?.search) searchParams.append('search', params.search);

    const res = await fetch(`${API_BASE}/investigations?${searchParams.toString()}`);
    return handleResponse<Investigation[]>(res);
  },

  async getInvestigationById(id: string): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${id}`);
    return handleResponse<Investigation>(res);
  },

  async createInvestigation(payload: {
    title: string;
    description: string;
    priority?: string;
    assigned_to?: string;
    alert_id?: string;
    initial_note?: string;
  }): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Investigation>(res);
  },

  async updateInvestigation(
    id: string,
    payload: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assigned_to?: string;
      findings?: string;
    }
  ): Promise<Investigation> {
    const res = await fetch(`${API_BASE}/investigations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Investigation>(res);
  },

  async addInvestigationNote(
    id: string,
    payload: { author?: string; content: string }
  ): Promise<InvestigationNote> {
    const res = await fetch(`${API_BASE}/investigations/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<InvestigationNote>(res);
  },

  // Incident Reports
  async generateReport(payload: {
    title?: string;
    investigation_id?: string;
    time_range_hours?: number;
    include_events?: boolean;
    include_notes?: boolean;
  }): Promise<IncidentReport> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<IncidentReport>(res);
  },

  getReportDownloadUrl(format: 'csv' | 'json', investigationId?: string): string {
    const params = new URLSearchParams();
    if (investigationId) params.append('investigation_id', investigationId);
    return `${API_BASE}/reports/export/${format}?${params.toString()}`;
  },

  // Detection Rules
  async getRules(): Promise<DetectionRule[]> {
    const res = await fetch(`${API_BASE}/rules`);
    return handleResponse<DetectionRule[]>(res);
  },

  async updateRule(id: string, payload: { is_enabled?: boolean; parameters?: string }): Promise<DetectionRule> {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<DetectionRule>(res);
  },

  // Demo Telemetry & Engine
  async loadDemoData(force: boolean = false): Promise<{ status: string; events_loaded: number; alerts_generated: number; message: string }> {
    const res = await fetch(`${API_BASE}/demo/load?force=${force}`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async resetDemoData(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async runDetections(): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/detections/run`, {
      method: 'POST',
    });
    return handleResponse<Alert[]>(res);
  },
};
