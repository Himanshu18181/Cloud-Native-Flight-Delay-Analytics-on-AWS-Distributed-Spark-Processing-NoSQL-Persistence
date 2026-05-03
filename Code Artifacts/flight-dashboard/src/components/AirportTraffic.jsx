import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts';
import './AirportTraffic.css';

/* Premium blue-to-indigo stepped gradient for ranked bars */
const CHART_BLUES = [
  '#38BDF8','#0EA5E9','#22D3EE','#0284C7','#2563EB',
  '#818CF8','#6366F1','#60A5FA','#06B6D4','#0891B2',
  '#38BDF8','#0EA5E9','#22D3EE','#2563EB','#818CF8',
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="airport-tooltip">
      <p className="tooltip-title">✈ {label}</p>
      <p style={{ color: '#38BDF8' }}>Flights: {Number(payload[0]?.value || 0).toLocaleString()}</p>
      <p style={{ color: '#FBBF24' }}>Avg Arr Delay: {Number(payload[0]?.payload?.arrival_delay || 0).toFixed(1)} min</p>
      <p style={{ color: '#F87171' }}>Cancelled: {(Number(payload[0]?.payload?.cancelled || 0) * 100).toFixed(2)}%</p>
    </div>
  );
};

const AirportTraffic = ({ airports }) => {
  if (!airports?.length) return null;

  const data = [...airports]
    .sort((a, b) => b.flights - a.flights)
    .slice(0, 15)
    .map((a) => ({
      name:          a.ORIGIN_AIRPORT,
      flights:       Number(a.flights       || 0),
      arrival_delay: Number(a.arrival_delay || 0),
      cancelled:     Number(a.cancelled     || 0),
    }));

  return (
    <div className="chart-container">
      <h3 className="section-title">Top Airports by Flight Volume</h3>
      <p className="section-sub">Busiest origin airports — hover for delay details</p>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
          barCategoryGap="22%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="flights" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_BLUES[i % CHART_BLUES.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AirportTraffic;
