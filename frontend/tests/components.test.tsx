import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Badge } from '../src/components/common/Badge';
import { StatCard } from '../src/components/common/StatCard';
import { EmptyState } from '../src/components/common/EmptyState';
import { Sidebar } from '../src/layouts/Sidebar';
import { Shield } from 'lucide-react';

describe('Common UI Components', () => {
  it('renders severity badges correctly', () => {
    const { rerender } = render(<Badge label="Critical" variant="severity" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();

    rerender(<Badge label="Low" variant="severity" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('renders status badges correctly', () => {
    render(<Badge label="Investigating" variant="status" />);
    expect(screen.getByText('Investigating')).toBeInTheDocument();
  });

  it('renders StatCard with title, value, and subtitle', () => {
    render(
      <StatCard
        title="Total Events"
        value={1520}
        subtitle="Ingested logs"
        icon={Shield}
        variant="cyan"
      />
    );
    expect(screen.getByText('Total Events')).toBeInTheDocument();
    expect(screen.getByText('1520')).toBeInTheDocument();
    expect(screen.getByText('Ingested logs')).toBeInTheDocument();
  });

  it('renders EmptyState with action buttons', () => {
    let demoClicked = false;
    render(
      <EmptyState
        title="No Telemetry Found"
        description="Database is empty. Please load data."
        onLoadDemo={() => {
          demoClicked = true;
        }}
      />
    );
    expect(screen.getByText('No Telemetry Found')).toBeInTheDocument();
    const btn = screen.getByText('Load Demo Data');
    btn.click();
    expect(demoClicked).toBe(true);
  });

  it('renders Sidebar navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar isOpen={true} onCloseMobile={() => {}} />
      </BrowserRouter>
    );
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Security Events')).toBeInTheDocument();
    expect(screen.getByText('Threat Alerts')).toBeInTheDocument();
    expect(screen.getByText('Investigations')).toBeInTheDocument();
    expect(screen.getByText('Incident Reports')).toBeInTheDocument();
    expect(screen.getByText('Rules & Config')).toBeInTheDocument();
  });
});
