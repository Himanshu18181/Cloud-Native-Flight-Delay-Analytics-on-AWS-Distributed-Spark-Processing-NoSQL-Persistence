import React, { useEffect, useState } from 'react';
import './RefreshControl.css';

/**
 * RefreshControl — header-mounted live status pill that shows the
 * recency of the rendered data and lets the user trigger a manual
 * refresh. Adds a clear executive signal that the dashboard is wired
 * to live aggregates rather than a static export.
 */
const formatRelative = (ts) => {
  if (!ts) return '—';
  const diffMs = Date.now() - ts;
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
};

const RefreshControl = ({ lastUpdated, refreshing, onRefresh, onOpenPalette }) => {
  const [, setTick] = useState(0);

  // Re-render every 30s so the relative timestamp stays accurate.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const ts = lastUpdated ? new Date(lastUpdated) : null;

  return (
    <div className="refresh-control" role="group" aria-label="Data refresh">
      <div className="refresh-status">
        <span className="refresh-dot" data-active={!refreshing} />
        <div className="refresh-status-body">
          <span className="refresh-label">Updated</span>
          <span className="refresh-value">
            {refreshing ? 'syncing…' : formatRelative(lastUpdated)}
          </span>
        </div>
        {ts && !refreshing && (
          <span className="refresh-abs" title={ts.toLocaleString()}>
            {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <button
        className="refresh-btn"
        onClick={onRefresh}
        disabled={refreshing}
        title="Refresh data"
      >
        <span className={`refresh-icon${refreshing ? ' is-spinning' : ''}`} aria-hidden="true">
          ↻
        </span>
        <span className="refresh-btn-text">Refresh</span>
      </button>

      {onOpenPalette && (
        <button
          className="refresh-cmdk"
          onClick={onOpenPalette}
          title="Open command palette"
        >
          <span>Search</span>
          <kbd>⌘K</kbd>
        </button>
      )}
    </div>
  );
};

export default RefreshControl;
