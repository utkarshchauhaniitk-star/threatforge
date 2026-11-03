import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SettingsPage } from '../src/pages/SettingsPage';
import { api } from '../src/services/api';

vi.mock('../src/services/api', () => ({
  api: {
    getHealth: vi.fn().mockResolvedValue({
      status: 'healthy',
      database: 'connected',
      environment: 'development',
      version: '1.0.0',
      timestamp: '2026-11-03T12:00:00Z',
    }),
    getRules: vi.fn().mockResolvedValue([
      {
        id: 'RULE-BRUTEFORCE',
        name: 'Possible Brute Force Attack',
        description: 'Detects repeated failed logins',
        severity: 'High',
        logic_description: 'Triggers on 5+ failures',
        is_enabled: true,
        mitre_attack_id: 'T1110.001',
      },
    ]),
    getDashboardStats: vi.fn().mockResolvedValue({
      total_events: 10,
      total_alerts: 2,
      critical_alerts: 1,
      high_alerts: 1,
      medium_alerts: 0,
      low_alerts: 0,
      total_investigations: 1,
      active_investigations: 1,
      severity_distribution: [],
      events_over_time: [],
      top_source_ips: [],
      recent_events: [],
      recent_alerts: [],
      recent_investigations: [],
    }),
    updateRule: vi.fn().mockResolvedValue({
      id: 'RULE-BRUTEFORCE',
      name: 'Possible Brute Force Attack',
      description: 'Detects repeated failed logins',
      severity: 'High',
      logic_description: 'Triggers on 5+ failures',
      is_enabled: false,
      mitre_attack_id: 'T1110.001',
    }),
    resetDemoData: vi.fn().mockResolvedValue({ status: 'success', message: 'Cleared' }),
    loadDemoData: vi.fn().mockResolvedValue({ status: 'success', message: 'Loaded' }),
  },
}));

// Provide mocked outlet context
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      refreshKey: 0,
      showToast: vi.fn(),
      triggerRefresh: vi.fn(),
    }),
  };
});

describe('Settings Page & Detection Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders detection rules and system health diagnostics', async () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SettingsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Detection Rules & Configuration')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Possible Brute Force Attack')).toBeInTheDocument();
      expect(screen.getByText('RULE-BRUTEFORCE')).toBeInTheDocument();
      expect(screen.getByText('T1110.001')).toBeInTheDocument();
      expect(screen.getByText('API Gateway Status:')).toBeInTheDocument();
    });
  });
});
