import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts';
import './CancellationRates.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="cancel-tooltip">
      <p className="tooltip-title">{label}</p>
      <p style={{ color: '#f59e0b' }}>Cancellation: {payload[0]?.value?.toFixed(2)}%</p>
      <p style={{ color: '#94a3b8' }}>Flights: {payload[0]?.payload?.flights?.toLocaleString()}</p>
    </div>
  );
};

const CancellationRates = ({ airlines }) => {
  if (!airlines?.length) return null;

  const data = [...airlines]
    .map((a) => ({
      name:      a.AIRLINE,
      cancel:    Number(a.cancelled || 0) * 100,
      flights:   Number(a.flights   || 0),
    }))
    .sort((a, b) => b.cancel - a.cancel)
    .slice(0, 15);

  const maxCancel = Math.max(...data.map((d) => d.cancel));

  return (
    <div className="chart-container">
      <h3 className="section-title">Cancellation Rates by Airline</h3>
      <p className="section-sub">Percentage of cancelled flights per carrier</p>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
          barCategoryGap="25%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            tickFormatter={(v) => `${v.toFixed(1)}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="cancel" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => {
              const intensity = entry.cancel / maxCancel;
              // High cancel → coral #F87171 (248,113,113)  Low → electric blue #38BDF8 (56,189,248)
              const r = Math.round(248 * intensity + 56  * (1 - intensity));
              const g = Math.round(113 * intensity + 189 * (1 - intensity));
              const b = Math.round(113 * intensity + 248 * (1 - intensity));
              return <Cell key={i} fill={`rgb(${r},${g},${b})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CancellationRates;
