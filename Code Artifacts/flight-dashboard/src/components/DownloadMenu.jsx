import React, { useEffect, useRef, useState } from 'react';
import { downloadCSV } from '../utils/csv';
import './DownloadMenu.css';

const DownloadMenu = ({ datasets }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handle = (name, rows) => {
    downloadCSV(`${name}.csv`, rows);
    setOpen(false);
  };

  const all = [
    { key: 'airlines', label: 'Airlines', rows: datasets.airlines },
    { key: 'airports', label: 'Airports', rows: datasets.airports },
    { key: 'monthly', label: 'Monthly trends', rows: datasets.monthly },
    { key: 'summary', label: 'Summary', rows: datasets.summary ? [datasets.summary] : [] },
  ].filter((d) => d.rows && d.rows.length);

  return (
    <div className="download-menu" ref={ref}>
      <button className="download-btn" onClick={() => setOpen((o) => !o)}>
        Download CSV ▾
      </button>
      {open && (
        <div className="download-list">
          {all.map((d) => (
            <button key={d.key} onClick={() => handle(`flight_${d.key}`, d.rows)}>
              {d.label} ({d.rows.length})
            </button>
          ))}
          <button
            onClick={() => {
              all.forEach((d) => downloadCSV(`flight_${d.key}.csv`, d.rows));
              setOpen(false);
            }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)', fontWeight: 600 }}
          >
            Download all
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadMenu;
