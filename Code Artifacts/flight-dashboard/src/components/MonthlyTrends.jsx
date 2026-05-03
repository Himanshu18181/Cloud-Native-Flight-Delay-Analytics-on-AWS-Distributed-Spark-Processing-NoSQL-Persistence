import React from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import './MonthlyTrends.css';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="monthly-tooltip">
      <p className="tooltip-title">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color || p.fill }}>
          {p.name}: {typeof p.value === 'number'
            ? p.dataKey === 'flights' ? p.value.toLocaleString() : `${p.value.toFixed(1)} min`
            : p.value}
        </p>
      ))}
    </div>
  );
};

const MonthlyTrends = ({ monthly }) => {
  if (!monthly?.length) return null;

  const data = [...monthly]
    .sort((a, b) => a.YEAR !== b.YEAR ? a.YEAR - b.YEAR : a.MONTH - b.MONTH)
    .map((m) => ({
      label:    `${MONTH_NAMES[(m.MONTH || 1) - 1]} ${m.YEAR || ''}`,
      'Arrival Delay':    Number(m.arrival_delay    || 0),
      'Departure Delay':  Number(m.departure_delay  || 0),
      'Carrier Delay':    Number(m.carrier_delay     || 0),
      'Weather Delay':    Number(m.weather_delay     || 0),
      flights:            Number(m.flights           || 0),
    }));

  return (
    <div className="chart-container">
      <h3 className="section-title">Monthly Delay &amp; Traffic Trends</h3>
      <p className="section-sub">Delay metrics (lines) vs. flight volume (bars) over time</p>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 5, right: 40, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            yAxisId="delay"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Delay (min)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11, offset: 10 }}
          />
          <YAxis
            yAxisId="volRaw"
            orientation="right"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            label={{ value: 'Flights', angle: 90, position: 'insideRight', fill: 'var(--text-muted)', fontSize: 11, offset: 10 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconSize={10}
            wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)', paddingTop: '12px' }}
          />
          <Bar yAxisId="volRaw" dataKey="flights" name="Flights" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.35)" />
          <Line yAxisId="delay" type="monotone" dataKey="Arrival Delay"   stroke="#FBBF24" strokeWidth={2.5} dot={false} />
          <Line yAxisId="delay" type="monotone" dataKey="Departure Delay" stroke="#FB923C" strokeWidth={2.5} dot={false} />
          <Line yAxisId="delay" type="monotone" dataKey="Carrier Delay"   stroke="#F87171" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
          <Line yAxisId="delay" type="monotone" dataKey="Weather Delay"   stroke="#38BDF8" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyTrends;
