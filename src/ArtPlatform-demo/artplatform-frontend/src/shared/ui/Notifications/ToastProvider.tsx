import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
};

type ToastContextValue = {
  notify: (params: { title: string; message?: string; type?: ToastType }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, message, type = 'info' }: { title: string; message?: string; type?: ToastType }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      window.setTimeout(() => {
        removeToast(id);
      }, 3500);
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (title, message) => notify({ title, message, type: 'success' }),
      error: (title, message) => notify({ title, message, type: 'error' }),
      info: (title, message) => notify({ title, message, type: 'info' }),
    }),
    [notify]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'grid',
          gap: 10,
          width: 'min(92vw, 520px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const bg =
            toast.type === 'success'
              ? 'rgba(16, 185, 129, 0.98)'
              : toast.type === 'error'
                ? 'rgba(239, 68, 68, 0.98)'
                : 'rgba(17, 24, 39, 0.98)';

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                borderRadius: 16,
                padding: '14px 16px',
                color: 'white',
                background: bg,
                boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: toast.message ? 4 : 0 }}>{toast.title}</div>
              {toast.message ? <div style={{ opacity: 0.92, fontSize: 14 }}>{toast.message}</div> : null}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}