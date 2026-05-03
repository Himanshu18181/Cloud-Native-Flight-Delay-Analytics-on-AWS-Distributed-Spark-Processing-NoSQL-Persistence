import React, { useState } from 'react';
import './AirlineTable.css';

const fmt1  = (v) => (v == null ? '--' : Number(v).toFixed(1));
const fmtPct = (v) => (v == null ? '--' : (Number(v) * 100).toFixed(2) + '%');
const fmtNum = (v) => (v == null ? '--' : Number(v).toLocaleString());

const COLUMNS = [
  { key: 'AIRLINE',        label: 'Airline',       fmt: (v) => v,       width: '14%' },
  { key: 'flights',        label: 'Flights',        fmt: fmtNum,          width: '8%'  },
  { key: 'arrival_delay',  label: 'Arr Delay',      fmt: (v) => `${fmt1(v)} m`, width: '8%'  },
  { key: 'departure_delay',label: 'Dep Delay',      fmt: (v) => `${fmt1(v)} m`, width: '8%'  },
  { key: 'carrier_delay',  label: 'Carrier',        fmt: (v) => `${fmt1(v)} m`, width: '8%'  },
  { key: 'weather_delay',  label: 'Weather',        fmt: (v) => `${fmt1(v)} m`, width: '8%'  },
  { key: 'nas_delay',      label: 'NAS',            fmt: (v) => `${fmt1(v)} m`, width: '7%'  },
  { key: 'security_delay', label: 'Security',       fmt: (v) => `${fmt1(v)} m`, width: '8%'  },
  { key: 'late_delay',     label: 'Late A/C',       fmt: (v) => `${fmt1(v)} m`, width: '8%'  },
  { key: 'cancelled',      label: 'Cancelled',      fmt: fmtPct,          width: '8%'  },
  { key: 'diverted',       label: 'Diverted',       fmt: fmtPct,          width: '8%'  },
];

const delayClass = (key, val) => {
  if (!['arrival_delay','departure_delay','carrier_delay','weather_delay','nas_delay','security_delay','late_delay'].includes(key)) return '';
  const v = Number(val);
  if (v >= 20) return 'cell-high';
  if (v >= 10) return 'cell-med';
  return 'cell-low';
};

const AirlineTable = ({ airlines }) => {
  const [sortKey, setSortKey]   = useState('flights');
  const [sortDir, setSortDir]   = useState('desc');

  if (!airlines?.length) return null;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...airlines].sort((a, b) => {
    const va = a[sortKey] ?? 0;
    const vb = b[sortKey] ?? 0;
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : Number(va) - Number(vb);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="chart-container table-wrap">
      <h3 className="section-title">Full Airline Metrics Table</h3>
      <p className="section-sub">Click column headers to sort &nbsp;·&nbsp; Delay cells color-coded by severity</p>
      <div className="table-scroll">
        <table className="airline-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col.key)}
                  className={sortKey === col.key ? 'sorted' : ''}
                >
                  {col.label}
                  <span className="sort-arrow">
                    {sortKey === col.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ⇅'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={i}>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`${col.key === 'AIRLINE' ? 'airline-name' : ''} ${delayClass(col.key, row[col.key])}`}
                  >
                    {col.fmt(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AirlineTable;
