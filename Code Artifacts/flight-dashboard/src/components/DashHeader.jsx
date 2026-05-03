import React from 'react';
import RefreshControl from './RefreshControl';
import './DashHeader.css';

const DashHeader = ({ summary, lastUpdated, refreshing, onRefresh, onOpenPalette }) => {
  const fmt = (v, dec = 1) => (v == null ? '--' : Number(v).toFixed(dec));

  return (
    <header className="dash-header">
      <div className="dash-header-brand">
        <span className="brand-icon" aria-hidden="true">A</span>
        <span className="brand-name">AeroDelay Analytics</span>
        <span className="brand-sub">Cloud-Native Flight Delay Intelligence</span>
      </div>

      <div className="dash-header-stats">
        <div className="header-stat">
          <span className="header-stat-label">Total Flights</span>
          <span className="header-stat-value blue">
            {summary ? Number(summary.total_flights).toLocaleString() : '--'}
          </span>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">Avg Arrival Delay</span>
          <span className="header-stat-value amber">
            {fmt(summary?.avg_arrival_delay)} min
          </span>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">Cancellation Rate</span>
          <span className="header-stat-value red">
            {summary ? (summary.cancelled_rate * 100).toFixed(2) : '--'}%
          </span>
        </div>
        <div className="header-stat">
          <span className="header-stat-label">Data Period</span>
          <span className="header-stat-value green">
            {summary ? `${summary.min_year} – ${summary.max_year}` : '--'}
          </span>
        </div>
      </div>

      <RefreshControl
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onOpenPalette={onOpenPalette}
      />
    </header>
  );
};

export default DashHeader;
