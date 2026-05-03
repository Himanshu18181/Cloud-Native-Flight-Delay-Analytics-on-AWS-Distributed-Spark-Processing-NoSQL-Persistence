import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import './DelayDonut.css';

/* Premium 5-color donut palette — vibrant on dark canvas */
const COLORS = ['#F87171', '#38BDF8', '#FBBF24', '#A78BFA', '#34D399'];

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="donut-tooltip">
      <span style={{ color: d.payload.fill }}>{d.name}</span>
      <span>{d.value?.toFixed(2)} min avg</span>
    </div>
  );
};

const DelayDonut = ({ summary }) => {
  if (!summary) return null;

  const data = [
    { name: 'Carrier',  value: Number(summary.avg_carrier_delay  || 0) },
    { name: 'Weather',  value: Number(summary.avg_weather_delay  || 0) },
    { name: 'NAS',      value: Number(summary.avg_nas_delay      || 0) },
    { name: 'Security', value: Number(summary.avg_security_delay || 0) },
    { name: 'Late A/C', value: Number(summary.avg_late_delay     || 0) },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="chart-container donut-wrap">
      <h3 className="section-title">Delay Cause Distribution</h3>
      <p className="section-sub">Average delay minutes by cause across all flights</p>
      <div className="donut-center-label">
        <span className="donut-total">{total.toFixed(1)}</span>
        <span className="donut-total-unit">min total</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="72%"
            paddingAngle={3}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DelayDonut;
