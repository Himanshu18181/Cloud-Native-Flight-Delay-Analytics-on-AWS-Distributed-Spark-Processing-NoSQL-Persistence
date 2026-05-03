import React from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Label,
} from 'recharts';
import './DelayScatter.css';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="scatter-tooltip">
      <p className="tooltip-title">✈ {d?.airport}</p>
      <p style={{ color: '#FB923C' }}>Dep Delay: {d?.x?.toFixed(1)} min</p>
      <p style={{ color: '#FBBF24' }}>Arr Delay: {d?.y?.toFixed(1)} min</p>
      <p style={{ color: '#8BA4C2' }}>Flights: {d?.flights?.toLocaleString()}</p>
      <p style={{ color: '#34D399' }}>Cancelled: {(d?.cancelled * 100)?.toFixed(2)}%</p>
    </div>
  );
};

const DelayScatter = ({ airports }) => {
  if (!airports?.length) return null;

  const data = airports.map((a) => ({
    x:         Number(a.departure_delay || 0),
    y:         Number(a.arrival_delay   || 0),
    z:         Number(a.flights         || 0),
    airport:   a.ORIGIN_AIRPORT,
    flights:   Number(a.flights         || 0),
    cancelled: Number(a.cancelled       || 0),
  }));

  return (
    <div className="chart-container">
      <h3 className="section-title">Departure vs. Arrival Delay (by Airport)</h3>
      <p className="section-sub">
        Bubble size = flight volume &nbsp;·&nbsp; Points above the diagonal have higher arrival delays
      </p>
      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            type="number"
            dataKey="x"
            name="Departure Delay"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          >
            <Label value="Avg Departure Delay (min)" offset={-10} position="insideBottom" fill="var(--text-muted)" fontSize={11} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            name="Arrival Delay"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          >
            <Label value="Avg Arrival Delay (min)" angle={-90} position="insideLeft" fill="var(--text-muted)" fontSize={11} />
          </YAxis>
          <ZAxis type="number" dataKey="z" range={[40, 800]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--border)' }} />
          <ReferenceLine yAxisId={0} y={0} stroke="rgba(255,255,255,0.1)" />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.1)" />
          <Scatter
            name="Airports"
            data={data}
            fill="#38BDF8"
            fillOpacity={0.70}
            stroke="rgba(56,189,248,0.35)"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DelayScatter;
