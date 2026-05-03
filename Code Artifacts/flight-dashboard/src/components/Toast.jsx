import React, { createContext, useCallback, useContext, useState } from 'react';
import './Toast.css';

/**
 * Lightweight toast system. Premium dashboards use these to confirm
 * imperative actions (refresh succeeded, CSV downloaded, pipeline
 * dispatched) without modal interruption.
 */
const ToastContext = createContext({ push: () => {} });

let nextId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++nextId;
      const item = {
        id,
        kind: toast.kind || 'info',
        title: toast.title || '',
        message: toast.message || '',
        duration: toast.duration ?? 4000,
      };
      setToasts((t) => [...t, item]);
      if (item.duration > 0) {
        setTimeout(() => dismiss(id), item.duration);
      }
      return id;
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <div className="toast-stack" role="region" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="toast-bar" aria-hidden="true" />
            <div className="toast-body">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastProvider;
