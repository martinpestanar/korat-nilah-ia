import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

const ReloadPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          className="fixed bottom-20 left-1/2 z-[9999] w-[90%] max-w-sm -translate-x-1/2"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/80 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <RefreshCw size={20} className={needRefresh ? "animate-spin-slow" : ""} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {needRefresh ? '¡Nueva versión disponible!' : 'App lista para usar offline'}
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {needRefresh 
                      ? 'Actualiza para disfrutar de las últimas mejoras y correcciones.' 
                      : 'La aplicación se ha guardado en tu dispositivo.'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                className="rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-transform active:scale-95 shadow-lg shadow-primary/20"
              >
                <RefreshCw size={16} />
                Actualizar ahora
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReloadPrompt;
