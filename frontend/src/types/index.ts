export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type AlertStatus = 'New' | 'Investigating' | 'Resolved' | 'False Positive';
export type InvestigationStatus = 'Open' | 'In Progress' | 'Closed';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  source_ip: string;
  destination_ip?: string | null;
  username?: string | null;
  action: string;
  status: string;
  severity: string;
  description: string;
  source?: string | null;
  raw_event_data?: string | null;
  created_at?: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  rule_id: string;
  rule_name: string;
  source_ip?: string | null;
  username?: string | null;
  event_count: number;
  evidence?: string | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  severity: string;
  logic_description: string;
  is_enabled: boolean;
  parameters?: string | null;
  mitre_attack_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvestigationNote {
  id: string;
  investigation_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface Investigation {
  id: string;
  title: string;
  description: string;
  status: InvestigationStatus;
  priority: Severity;
  assigned_to: string;
  related_alert_ids?: string | null;
  related_event_ids?: string | null;
  findings?: string | null;
  created_at: string;
  updated_at: string;
  notes: InvestigationNote[];
}

export interface SeverityCount {
  severity: string;
  count: number;
  color: string;
}

export interface TimeBucketCount {
  timestamp: string;
  events: number;
  failures: number;
}

export interface TopIpStat {
  ip: string;
  total_events: number;
  failed_events: number;
  alerts_triggered: number;
}

export interface DashboardStats {
  total_events: number;
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  total_investigations: number;
  active_investigations: number;
  severity_distribution: {
    severity: string;
    count: number;
    color: string;
  }[];
  events_over_time: TimeBucketCount[];
  top_source_ips: TopIpStat[];
  recent_events: Partial<SecurityEvent>[];
  recent_alerts: Partial<Alert>[];
  recent_investigations: Partial<Investigation>[];
}

export interface IncidentReport {
  report_id: string;
  generated_at: string;
  title: string;
  summary: string;
  investigation?: Record<string, any> | null;
  alerts: Record<string, any>[];
  events_sample: Record<string, any>[];
  detection_rules_triggered: Record<string, any>[];
  findings?: string | null;
  recommendations: string[];
  limitations: string;
}

export interface ImportResult {
  import_id: string;
  filename: string;
  file_type: string;
  total_records: number;
  imported_records: number;
  failed_records: number;
  alerts_generated: number;
  errors: string[];
  success: boolean;
  message: string;
}

export interface HealthStatus {
  status: string;
  database: string;
  environment: string;
  version: string;
  timestamp: string;
}
