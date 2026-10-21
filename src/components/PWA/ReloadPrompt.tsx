import React, { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Loader2 } from 'lucide-react';

const ReloadPrompt: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Chequeo periódico cada 5 minutos de forma segura (sin hooks externos ni router context)
        setInterval(() => {
          r.update().catch(() => {});
        }, 5 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration warning:', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);

      // Limpiamos los flags de reintento de chunks obsoletos en sessionStorage
      try {
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('retry-lazy-refreshed:')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch {}

      // Escuchamos el cambio de controlador para recargar cuando el SW nuevo tome el mando
      if ('serviceWorker' in navigator) {
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      }

      // Ordenamos activar el nuevo SW
      await updateServiceWorker(true);

      // Fallback seguro: si el navegador no disparó controllerchange en 1.5s, forzar recarga
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error al actualizar Service Worker:', err);
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-0 right-0 z-[9999] mx-auto w-[90%] max-w-sm"
        >
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/85 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
                  <RefreshCw size={20} className={needRefresh || isUpdating ? "animate-spin-slow" : ""} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {needRefresh ? '¡Nueva versión disponible!' : 'App lista para usar offline'}
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {needRefresh 
                      ? 'Actualiza para aplicar las últimas mejoras en tu salón.' 
                      : 'La aplicación está disponible en tu dispositivo.'}
                  </p>
                </div>
              </div>
              <button
                onClick={close}
                disabled={isUpdating}
                className="rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <X size={16} />
              </button>
            </div>

            {needRefresh && (
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 active:scale-95 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-violet-600/25 disabled:opacity-75 cursor-pointer"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Actualizando aplicación...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    <span>Actualizar ahora</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReloadPrompt;
