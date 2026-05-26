import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800' },
  error:   { icon: XCircle,      color: 'text-red-500',     bg: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-800' },
  warning: { icon: AlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/50 dark:border-amber-800' },
  info:    { icon: Info,          color: 'text-cyan-500',   bg: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950/50 dark:border-cyan-800' },
};

function Toast({ id, type = 'info', title, message, onDismiss }) {
  const { icon: Icon, color, bg } = TOAST_ICONS[type] || TOAST_ICONS.info;

  return (
    <div
      className={`flex items-start gap-3 w-80 p-4 rounded-xl border shadow-lg animate-slide-in ${bg}`}
      role="alert"
    >
      <Icon size={20} className={`flex-shrink-0 mt-0.5 ${color}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-bold text-slate-950 dark:text-slate-100">{title}</p>}
        {message && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{message}</p>}
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  // Convenience helpers
  toast.success = (title, message, opts) => toast({ type: 'success', title, message, ...opts });
  toast.error   = (title, message, opts) => toast({ type: 'error',   title, message, ...opts });
  toast.warning = (title, message, opts) => toast({ type: 'warning', title, message, ...opts });
  toast.info    = (title, message, opts) => toast({ type: 'info',    title, message, ...opts });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Stack */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
