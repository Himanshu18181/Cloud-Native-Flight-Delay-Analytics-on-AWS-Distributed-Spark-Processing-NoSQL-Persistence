import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import './DelayBreakdown.css';

/* Premium 5-category palette — each visually distinct on dark background */
const DELAY_COLORS = {
  carrier_delay:  '#F87171',   /* coral red    */
  weather_delay:  '#38BDF8',   /* electric blue */
  nas_delay:      '#FBBF24',   /* golden amber  */
  security_delay: '#A78BFA',   /* soft violet   */
  late_delay:     '#34D399',   /* emerald green */
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="custom-tooltip">
      <p className="tooltip-title">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {p.value?.toFixed(1)} min
        </p>
      ))}
      <p className="tooltip-total">Total: {total.toFixed(1)} min</p>
    </div>
  );
};

const DelayBreakdown = ({ airlines }) => {
  if (!airlines?.length) return null;

  const data = [...airlines]
    .sort((a, b) => b.flights - a.flights)
    .slice(0, 12)
    .map((a) => ({
      name: a.AIRLINE,
      'Carrier':  Number(a.carrier_delay  || 0),
      'Weather':  Number(a.weather_delay  || 0),
      'NAS':      Number(a.nas_delay      || 0),
      'Security': Number(a.security_delay || 0),
      'Late AC':  Number(a.late_delay     || 0),
    }));

  return (
    <div className="chart-container">
      <h3 className="section-title">Delay Breakdown by Airline</h3>
      <p className="section-sub">Average minutes by delay cause — top 12 airlines by flight volume</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
            label={{ value: 'Avg Delay (min)', position: 'insideBottom', offset: -2, fill: 'var(--text-muted)', fontSize: 11 }}
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
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)', paddingTop: '8px' }}
          />
          <Bar dataKey="Carrier"  stackId="a" fill={DELAY_COLORS.carrier_delay}  radius={[0,0,0,0]} />
          <Bar dataKey="Weather"  stackId="a" fill={DELAY_COLORS.weather_delay}  />
          <Bar dataKey="NAS"      stackId="a" fill={DELAY_COLORS.nas_delay}      />
          <Bar dataKey="Security" stackId="a" fill={DELAY_COLORS.security_delay} />
          <Bar dataKey="Late AC"  stackId="a" fill={DELAY_COLORS.late_delay}     radius={[0,4,4,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DelayBreakdown;
