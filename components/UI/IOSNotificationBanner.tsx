import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * IOSNotificationBanner
 * ─────────────────────────────────────────────────────────────
 * Maneja el flujo de activación de notificaciones PWA en iOS.
 *
 * iOS 16.4+ soporta push notifications solo cuando la app está
 * instalada como PWA (modo standalone). A diferencia de Android,
 * iOS no muestra un prompt automático — el usuario debe conceder
 * permiso explícitamente desde dentro de la app.
 *
 * Flujo:
 * 1. Detectar: iOS + standalone + Notification API disponible
 * 2. Si permiso = 'default' → mostrar banner para solicitar
 * 3. Si permiso = 'granted'  → mostrar confirmación verde (5s) la primera vez
 * 4. Si permiso = 'denied'   → mostrar instrucciones para ir a Ajustes
 * ─────────────────────────────────────────────────────────────
 */

const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent);
const isStandalone = () =>
  // Instalada como PWA
  (navigator as any).standalone === true ||
  window.matchMedia('(display-mode: standalone)').matches;

const IOSNotificationBanner: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'ask' | 'granted' | 'denied'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Solo en iOS instalado como PWA
    if (!isIOS() || !isStandalone()) return;

    // Notificaciones no disponibles en este browser
    if (!('Notification' in window)) return;

    const perm = Notification.permission;

    if (perm === 'granted') {
      // Mostrar confirmación solo si no la hemos mostrado antes
      const shownConfirm = localStorage.getItem('nilah_notif_confirm_shown');
      if (!shownConfirm) {
        setStatus('granted');
        localStorage.setItem('nilah_notif_confirm_shown', '1');
        // Auto-ocultar después de 5s
        setTimeout(() => setStatus('idle'), 5000);
      }
    } else if (perm === 'default') {
      // Revisar si ya descartó recientemente (24h)
      const dismissed = localStorage.getItem('nilah_notif_banner_dismissed');
      if (dismissed && Date.now() - parseInt(dismissed) < 24 * 60 * 60 * 1000) return;
      // Mostrar solicitud después de 3s para no saturar al usuario al abrir
      const timer = setTimeout(() => setStatus('ask'), 3000);
      return () => clearTimeout(timer);
    } else {
      // denied — mostrar instrucciones
      const shownDenied = localStorage.getItem('nilah_notif_denied_shown');
      if (!shownDenied) {
        setStatus('denied');
        localStorage.setItem('nilah_notif_denied_shown', '1');
      }
    }
  }, []);

  const handleRequest = async () => {
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        localStorage.setItem('nilah_notif_confirm_shown', '1');
        setStatus('granted');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        localStorage.setItem('nilah_notif_denied_shown', '1');
        setStatus('denied');
      }
    } catch {
      setStatus('idle');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('nilah_notif_banner_dismissed', Date.now().toString());
    setDismissed(true);
    setStatus('idle');
  };

  if (dismissed || status === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div
        key={status}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="fixed left-3 right-3 z-[200] sm:hidden"
        style={{
          // Aparece justo encima del BottomNavBar (aprox. 68px + safe area)
          bottom: 'calc(68px + env(safe-area-inset-bottom, 0px) + 10px)',
        }}
      >
        {/* === SOLICITAR PERMISO === */}
        {status === 'ask' && (
          <div className="bg-white dark:bg-[#1a1a22] rounded-2xl shadow-2xl border border-gray-200/60 dark:border-white/10 p-4 overflow-hidden relative"
            style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
            {/* Decoración fondo */}
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-violet-500/15 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg">
                <Bell className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight mb-0.5">
                  Activa las notificaciones
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                  Recibe alertas de nuevas citas, confirmaciones y mensajes de tus clientas en tiempo real.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRequest}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-violet-500/25"
                  >
                    <Bell size={14} />
                    Activar ahora
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
                  >
                    Después
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === CONFIRMACIÓN: YA ACTIVAS === */}
        {status === 'granted' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 p-4 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                ¡Notificaciones activadas! 🎉
              </p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 leading-tight">
                Recibirás alertas de citas y mensajes directamente en tu iPhone.
              </p>
            </div>
            <button onClick={() => setStatus('idle')} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 shrink-0">
              <X size={18} />
            </button>
          </div>
        )}

        {/* === DENEGADAS: INSTRUCCIONES === */}
        {status === 'denied' && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-500/30 p-4 relative shadow-lg">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-amber-400 hover:text-amber-600 transition-colors"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3 pr-6">
              <BellOff className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">
                  Notificaciones bloqueadas
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
                  Para activarlas ve a:{' '}
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Ajustes → Nilah IA → Notificaciones → Permitir
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default IOSNotificationBanner;
