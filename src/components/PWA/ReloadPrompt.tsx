import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

const CHECK_INTERVAL_MS = 2 * 60 * 1000; // Chequear cada 2 minutos en segundo plano

const ReloadPrompt: React.FC = () => {
  const location = useLocation();
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        registrationRef.current = r;
        // Chequeo inmediato al registrar
        r.update().catch(() => {});
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  // 1. Polling periódico cada 2 minutos mientras la app esté abierta
  useEffect(() => {
    const timer = setInterval(() => {
      if (registrationRef.current) {
        registrationRef.current.update().catch(() => {});
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  // 2. Al volver a la app o desbloquear el móvil (evento visibilitychange / window focus)
  useEffect(() => {
    const handleCheckUpdate = () => {
      if (document.visibilityState === 'visible' && registrationRef.current) {
        registrationRef.current.update().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleCheckUpdate);
    window.addEventListener('focus', handleCheckUpdate);

    return () => {
      document.removeEventListener('visibilitychange', handleCheckUpdate);
      window.removeEventListener('focus', handleCheckUpdate);
    };
  }, []);

  // 3. Al cambiar de página/ruta dentro de la app (react-router)
  useEffect(() => {
    if (registrationRef.current) {
      registrationRef.current.update().catch(() => {});
    }
  }, [location.pathname]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
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
