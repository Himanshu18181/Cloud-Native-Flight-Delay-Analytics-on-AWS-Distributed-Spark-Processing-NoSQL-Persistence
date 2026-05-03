import React, { useEffect, useMemo, useRef, useState } from 'react';
import './CommandPalette.css';

/**
 * CommandPalette — keyboard-first quick navigation (⌘K / Ctrl+K).
 * Premium SaaS pattern that lets analysts jump to any section,
 * trigger pipeline actions, or run downloads without scrolling.
 */
const CommandPalette = ({ open, onClose, commands = [] }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      [c.label, c.section, c.hint]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(q)),
    );
  }, [commands, query]);

  useEffect(() => { setActive(0); }, [query]);

  if (!open) return null;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) {
        cmd.run();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group by section for a tidier visual.
  const grouped = filtered.reduce((acc, c) => {
    const k = c.section || 'Actions';
    (acc[k] = acc[k] || []).push(c);
    return acc;
  }, {});

  let runningIndex = -1;

  return (
    <div className="cmdk-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div
        className="cmdk-panel"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="cmdk-input-row">
          <span className="cmdk-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Search sections, actions, downloads…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="cmdk-kbd">ESC</kbd>
        </div>

        <div className="cmdk-results">
          {filtered.length === 0 && (
            <div className="cmdk-empty">No matches for “{query}”.</div>
          )}
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section} className="cmdk-group">
              <div className="cmdk-group-label">{section}</div>
              {items.map((cmd) => {
                runningIndex += 1;
                const isActive = runningIndex === active;
                return (
                  <button
                    key={cmd.id}
                    className={`cmdk-item${isActive ? ' is-active' : ''}`}
                    onMouseEnter={() => setActive(runningIndex)}
                    onClick={() => { cmd.run(); onClose(); }}
                  >
                    <span className="cmdk-item-icon" aria-hidden="true">
                      {cmd.icon || '›'}
                    </span>
                    <span className="cmdk-item-label">{cmd.label}</span>
                    {cmd.hint && (
                      <span className="cmdk-item-hint">{cmd.hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="cmdk-footer">
          <span><kbd className="cmdk-kbd">↑</kbd><kbd className="cmdk-kbd">↓</kbd> navigate</span>
          <span><kbd className="cmdk-kbd">↵</kbd> select</span>
          <span><kbd className="cmdk-kbd">⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
