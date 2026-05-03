import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import ETLPipeline from './components/ETLPipeline';
import DashHeader from './components/DashHeader';
import KPICards from './components/KPICards';
import DelayBreakdown from './components/DelayBreakdown';
import AirlineTable from './components/AirlineTable';
import AirportTraffic from './components/AirportTraffic';
import DelayDonut from './components/DelayDonut';
import MonthlyTrends from './components/MonthlyTrends';
import CancellationRates from './components/CancellationRates';
import AirportDelayMatrix from './components/AirportDelayMatrix';
import DelayScatter from './components/DelayScatter';
import Loading from './components/Loading';
import DownloadMenu from './components/DownloadMenu';
import InsightsPanel from './components/InsightsPanel';
import CommandPalette from './components/CommandPalette';
import SectionNav from './components/SectionNav';
import useDashboardData from './hooks/useDashboardData';
import { useToast } from './components/Toast';

const SECTIONS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'insights',  label: 'Smart Insights' },
  { id: 'airlines',  label: 'Airline Performance' },
  { id: 'causes',    label: 'Delay Cause Analysis' },
  { id: 'airports',  label: 'Airport Intelligence' },
  { id: 'scatter',   label: 'Departure vs Arrival' },
  { id: 'table',     label: 'Full Airline Table' },
];

function App() {
  const {
    rawData, loading, refreshing, lastUpdated,
    page, setPage, loadData, refresh,
  } = useDashboardData();

  const toast = useToast();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleRefresh = useCallback(async () => {
    const result = await refresh();
    if (result?.ok) {
      toast.push({
        kind: 'success',
        title: 'Data refreshed',
        message: 'Latest aggregates loaded from DynamoDB.',
      });
    } else {
      toast.push({
        kind: 'warning',
        title: 'Refresh incomplete',
        message: 'Falling back to ETL pipeline view.',
      });
    }
  }, [refresh, toast]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const commands = useMemo(() => {
    const navCmds = SECTIONS.map((s) => ({
      id: `nav-${s.id}`,
      section: 'Navigate',
      label: `Go to ${s.label}`,
      icon: '›',
      run: () => scrollTo(s.id),
    }));

    const actionCmds = [
      {
        id: 'refresh',
        section: 'Actions',
        label: 'Refresh dashboard data',
        hint: '⌘R',
        icon: '↻',
        run: handleRefresh,
      },
      {
        id: 'open-etl',
        section: 'Actions',
        label: 'Open ETL pipeline console',
        icon: '⚙',
        run: () => setPage('etl'),
      },
      {
        id: 'top',
        section: 'Actions',
        label: 'Scroll to top',
        icon: '↑',
        run: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      },
    ];

    return [...navCmds, ...actionCmds];
  }, [handleRefresh, scrollTo, setPage]);

  if (page === 'etl') {
    return <ETLPipeline onNavigateDashboard={loadData} />;
  }

  if (page === 'loading' || loading || !rawData) return <Loading />;

  const { airlines, airports, monthly, summary } = rawData;

  return (
    <div className="app">
      <DashHeader
        summary={summary}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <main className="dashboard-main">
        <div className="dashboard-nav">
          <button className="nav-etl-btn" onClick={() => setPage('etl')}>
            ⚙️ ETL Pipeline
          </button>
          <DownloadMenu datasets={{ airlines, airports, monthly, summary }} />
        </div>

        <section id="overview">
          <KPICards summary={summary} />
        </section>

        <section id="insights">
          <InsightsPanel
            airlines={airlines}
            airports={airports}
            monthly={monthly}
            summary={summary}
          />
        </section>

        <section id="airlines">
          <p className="section-title">✈ Airline Performance</p>
          <div className="grid-2-1">
            <DelayBreakdown airlines={airlines} />
            <CancellationRates airlines={airlines} />
          </div>
        </section>

        <section id="causes">
          <p className="section-title">⏱ Delay Cause Analysis</p>
          <div className="grid-1-2">
            <DelayDonut summary={summary} />
            <MonthlyTrends monthly={monthly} />
          </div>
        </section>

        <section id="airports">
          <p className="section-title">🏢 Airport Intelligence</p>
          <div className="grid-2">
            <AirportTraffic airports={airports} />
            <AirportDelayMatrix airports={airports} />
          </div>
        </section>

        <section id="scatter">
          <p className="section-title">📍 Departure vs Arrival Delay by Airport</p>
          <DelayScatter airports={airports} />
        </section>

        <section id="table">
          <p className="section-title">📋 Airline Metrics — Full Table</p>
          <AirlineTable airlines={airlines} />
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button className="back-btn" onClick={() => setPage('etl')}>
            ⚙️ ETL Pipeline
          </button>
        </div>
      </main>

      <SectionNav sections={SECTIONS} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
}

export default App;
