import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, HelpCircle, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    triggerHaptic(options.type === 'danger' ? 'warning' : 'light');
    return new Promise((resolve) => {
      setDialog({
        isOpen: true,
        options: {
          title: options.title || '¿Estás seguro?',
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          type: options.type || 'danger',
          ...options,
        },
        resolve,
      });
    });
  }, []);

  const handleClose = (value: boolean) => {
    if (value) {
      triggerHaptic(dialog?.options.type === 'danger' ? 'medium' : 'success');
    } else {
      triggerHaptic('light');
    }
    dialog?.resolve(value);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {dialog?.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleClose(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Sheet / Modal */}
            <motion.div
              initial={{ y: '100%', opacity: 0.8 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="relative w-full max-w-md bg-white dark:bg-dark-850 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-border-light dark:border-border-dark flex flex-col z-10 safe-pb"
            >
              {/* Drag Handle indicator for mobile */}
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-dark-600 rounded-full mx-auto mb-4 sm:hidden" />

              <div className="flex items-start gap-3.5 mb-4">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    dialog.options.type === 'danger'
                      ? 'bg-red-500/10 text-red-500 dark:bg-red-500/20'
                      : dialog.options.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20'
                      : 'bg-primary-500/10 text-primary-500 dark:bg-primary-500/20'
                  }`}
                >
                  {dialog.options.type === 'danger' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : dialog.options.type === 'warning' ? (
                    <HelpCircle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {dialog.options.title}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {dialog.options.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-750 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action buttons (Ergonomic for thumbs) */}
              <div className="mt-3 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-dark-750 hover:bg-gray-200 dark:hover:bg-dark-700 active:scale-98 transition-all text-center touch-target"
                >
                  {dialog.options.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => handleClose(true)}
                  className={`w-full sm:w-auto px-5 py-3 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white shadow-xs active:scale-98 transition-all text-center touch-target ${
                    dialog.options.type === 'danger'
                      ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                      : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
                  }`}
                >
                  {dialog.options.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
};
