import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import './AirportDelayMatrix.css';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="matrix-tooltip">
      <p className="tooltip-title">✈ {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {p.value?.toFixed(1)} min
        </p>
      ))}
    </div>
  );
};

const AirportDelayMatrix = ({ airports }) => {
  if (!airports?.length) return null;

  const data = [...airports]
    .sort((a, b) => b.flights - a.flights)
    .slice(0, 10)
    .map((a) => ({
      name:            a.ORIGIN_AIRPORT,
      'Arrival Delay':   Number(a.arrival_delay   || 0),
      'Departure Delay': Number(a.departure_delay  || 0),
      'Carrier Delay':   Number(a.carrier_delay    || 0),
      'Weather Delay':   Number(a.weather_delay    || 0),
      'NAS Delay':       Number(a.nas_delay        || 0),
    }));

  return (
    <div className="chart-container">
      <h3 className="section-title">Airport Delay Matrix</h3>
      <p className="section-sub">Grouped delay comparison — top 10 airports by volume</p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: 'Avg Delay (min)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
          <Bar dataKey="Arrival Delay"   fill="#FBBF24" radius={[3,3,0,0]} />
          <Bar dataKey="Departure Delay" fill="#FB923C" radius={[3,3,0,0]} />
          <Bar dataKey="Carrier Delay"   fill="#F87171" radius={[3,3,0,0]} />
          <Bar dataKey="Weather Delay"   fill="#38BDF8" radius={[3,3,0,0]} />
          <Bar dataKey="NAS Delay"       fill="#A78BFA" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AirportDelayMatrix;
