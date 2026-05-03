import React, { useMemo } from 'react';
import './InsightsPanel.css';

/**
 * Smart Insights — auto-derives narrative highlights from the
 * pre-aggregated dashboard data so the user gets an instant, executive
 * read-out before drilling into individual charts.
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const num = (v) => (v == null || Number.isNaN(Number(v)) ? 0 : Number(v));

const InsightsPanel = ({ airlines = [], airports = [], monthly = [], summary }) => {
  const insights = useMemo(() => {
    const items = [];

    // 1. Most reliable carrier (lowest arrival delay among carriers with > 100k flights)
    const eligibleAirlines = airlines.filter((a) => num(a.flights) > 100000);
    if (eligibleAirlines.length) {
      const best = [...eligibleAirlines].sort(
        (a, b) => num(a.arrival_delay) - num(b.arrival_delay),
      )[0];
      items.push({
        kind: 'positive',
        icon: '★',
        title: 'Top On-Time Carrier',
        headline: best.AIRLINE,
        detail: `Lowest mean arrival delay at ${num(best.arrival_delay).toFixed(1)} min across ${num(best.flights).toLocaleString()} flights.`,
      });
    }

    // 2. Highest-delay carrier
    if (eligibleAirlines.length > 1) {
      const worst = [...eligibleAirlines].sort(
        (a, b) => num(b.arrival_delay) - num(a.arrival_delay),
      )[0];
      items.push({
        kind: 'warning',
        icon: '!',
        title: 'Highest Carrier Delay',
        headline: worst.AIRLINE,
        detail: `Mean arrival delay of ${num(worst.arrival_delay).toFixed(1)} min — review schedule slack.`,
      });
    }

    // 3. Busiest airport
    if (airports.length) {
      const busiest = [...airports].sort(
        (a, b) => num(b.flights) - num(a.flights),
      )[0];
      items.push({
        kind: 'info',
        icon: '◎',
        title: 'Busiest Origin Airport',
        headline: busiest.AIRPORT || busiest.airport || '—',
        detail: `${num(busiest.flights).toLocaleString()} departures with a ${num(busiest.arrival_delay).toFixed(1)} min mean arrival delay.`,
      });
    }

    // 4. Peak seasonal month — collapse across years by calendar month.
    if (monthly.length) {
      const byMonth = {};
      monthly.forEach((m) => {
        const idx = num(m.MONTH);
        if (idx < 1 || idx > 12) return;
        if (!byMonth[idx]) byMonth[idx] = { sum: 0, n: 0 };
        byMonth[idx].sum += num(m.arrival_delay);
        byMonth[idx].n += 1;
      });
      const monthAverages = Object.entries(byMonth).map(([k, v]) => ({
        month: Number(k),
        avg: v.n ? v.sum / v.n : 0,
      }));
      if (monthAverages.length) {
        const peak = monthAverages.sort((a, b) => b.avg - a.avg)[0];
        const networkAvg =
          monthAverages.reduce((s, r) => s + r.avg, 0) / monthAverages.length;
        const delta = networkAvg
          ? ((peak.avg - networkAvg) / networkAvg) * 100
          : 0;
        items.push({
          kind: 'highlight',
          icon: '◆',
          title: 'Peak Delay Season',
          headline: MONTH_NAMES[peak.month - 1],
          detail: `${peak.avg.toFixed(1)} min mean arrival delay (${delta >= 0 ? '+' : ''}${delta.toFixed(0)}% vs annual mean).`,
        });
      }
    }

    // 5. Dominant delay cause from summary
    if (summary) {
      const causes = [
        { label: 'Carrier', val: num(summary.avg_carrier_delay) },
        { label: 'Weather', val: num(summary.avg_weather_delay) },
        { label: 'NAS', val: num(summary.avg_nas_delay) },
        { label: 'Security', val: num(summary.avg_security_delay) },
        { label: 'Late Aircraft', val: num(summary.avg_late_delay) },
      ];
      const total = causes.reduce((s, c) => s + c.val, 0);
      if (total > 0) {
        const top = [...causes].sort((a, b) => b.val - a.val)[0];
        const share = ((top.val / total) * 100).toFixed(0);
        items.push({
          kind: 'info',
          icon: '◧',
          title: 'Dominant Delay Driver',
          headline: top.label,
          detail: `Accounts for ${share}% of total mean delay minutes across the corpus.`,
        });
      }
    }

    // 6. Cancellation health
    if (summary && summary.cancelled_rate != null) {
      const rate = num(summary.cancelled_rate) * 100;
      const grade =
        rate < 1.5 ? 'positive' : rate < 2.5 ? 'info' : 'warning';
      items.push({
        kind: grade,
        icon: '✕',
        title: 'Network Cancellation Rate',
        headline: `${rate.toFixed(2)}%`,
        detail:
          rate < 1.5
            ? 'Within healthy operational tolerance.'
            : rate < 2.5
            ? 'Moderate — monitor seasonal hot spots.'
            : 'Elevated — investigate driver categories.',
      });
    }

    return items;
  }, [airlines, airports, monthly, summary]);

  if (!insights.length) return null;

  return (
    <section className="insights-panel" aria-label="Smart insights">
      <div className="insights-header">
        <span className="insights-eyebrow">Smart Insights</span>
        <h2 className="insights-title">
          Auto-derived highlights from the latest aggregate
        </h2>
        <span className="insights-meta">
          {insights.length} signals · refreshed with data
        </span>
      </div>

      <div className="insights-grid">
        {insights.map((it, i) => (
          <article key={i} className={`insight-card insight-${it.kind}`}>
            <div className="insight-icon" aria-hidden="true">
              {it.icon}
            </div>
            <div className="insight-body">
              <div className="insight-label">{it.title}</div>
              <div className="insight-headline">{it.headline}</div>
              <div className="insight-detail">{it.detail}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default InsightsPanel;
