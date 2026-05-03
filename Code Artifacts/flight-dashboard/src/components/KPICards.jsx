import React from 'react';
import './KPICards.css';

const KPICard = ({ label, value, unit, accent, icon, sub }) => (
  <div className={`kpi-card kpi-${accent}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-body">
      <div className="kpi-value">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
      <div className="kpi-label">{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  </div>
);

const KPICards = ({ summary }) => {
  if (!summary) return null;

  const fmt = (v, dec = 1) => (v == null ? '--' : Number(v).toFixed(dec));
  const fmtPct = (v) => (v == null ? '--' : (v * 100).toFixed(2));
  const fmtNum = (v) => (v == null ? '--' : Number(v).toLocaleString());

  const cards = [
    {
      label: 'Total Flights',
      value: fmtNum(summary.total_flights),
      unit: null,
      icon: '✈',
      accent: 'blue',
      sub: `${summary.min_year} – ${summary.max_year}`,
    },
    {
      label: 'Avg Arrival Delay',
      value: fmt(summary.avg_arrival_delay),
      unit: 'min',
      icon: '🛬',
      accent: 'amber',
      sub: `vs dep: ${fmt(summary.avg_departure_delay)} min`,
    },
    {
      label: 'Avg Departure Delay',
      value: fmt(summary.avg_departure_delay),
      unit: 'min',
      icon: '🛫',
      accent: 'orange',
      sub: `carrier: ${fmt(summary.avg_carrier_delay)} min`,
    },
    {
      label: 'Cancellation Rate',
      value: fmtPct(summary.cancelled_rate),
      unit: '%',
      icon: '❌',
      accent: 'red',
      sub: `diversion: ${fmtPct(summary.diverted_rate)}%`,
    },
    {
      label: 'Avg Weather Delay',
      value: fmt(summary.avg_weather_delay),
      unit: 'min',
      icon: '🌩',
      accent: 'purple',
      sub: `NAS: ${fmt(summary.avg_nas_delay)} min`,
    },
    {
      label: 'Avg Flight Distance',
      value: fmt(summary.avg_distance, 0),
      unit: 'mi',
      icon: '📏',
      accent: 'green',
      sub: `security: ${fmt(summary.avg_security_delay)} min delay`,
    },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((c, i) => (
        <KPICard key={i} {...c} />
      ))}
    </div>
  );
};

export default KPICards;
