import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<{ toast: ToastApi } | undefined>(undefined);

const DURATION = 3500;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
  error: <AlertCircle size={18} className="text-red-500 shrink-0" />,
  info: <Info size={18} className="text-violet-500 shrink-0" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => dismiss(id), DURATION);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: {
        success: (m: string) => push('success', m),
        error: (m: string) => push('error', m),
        info: (m: string) => push('info', m),
      },
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed z-[9999] pointer-events-none flex flex-col gap-2 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bottom-[calc(var(--safe-bottom,0px)+1rem)] sm:left-auto sm:translate-x-0 sm:right-4 sm:top-4 sm:bottom-auto sm:w-auto sm:min-w-[300px]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              role={t.type === 'error' ? 'alert' : 'status'}
              className="pointer-events-auto flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-white dark:bg-dark-800 border border-[rgba(22,21,26,0.08)] dark:border-white/10 shadow-[0_4px_16px_rgba(22,21,26,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] text-[13px] font-medium text-[#16151A] dark:text-gray-100"
            >
              {ICONS[t.type]}
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx.toast;
};
