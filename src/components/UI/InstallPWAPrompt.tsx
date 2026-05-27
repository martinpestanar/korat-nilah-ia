import React, { useState, useEffect } from 'react';
import { Download, X, Zap, Apple, Share } from 'lucide-react';
import { useInstallPWA } from '../../context/InstallPWAContext';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPWAPrompt: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
  }, []);

  useEffect(() => {
    // Only show if NOT installed
    if (isInstalled) return;

    // Must be either installable (Android/Chrome) OR iOS (which can't be registered automatically but can be manually added)
    if (!isInstallable && !isIOS) return;

    // Check if user dismissed it recently
    const dismissed = localStorage.getItem('nilah_pwa_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      // Don't show again for 7 days
      return;
    }

    // Only show inside the private app modules
    if (location.pathname.startsWith('/nilah/app')) {
      // Wait 3 seconds inside the app before showing
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowPrompt(false);
    }
  }, [isInstallable, isInstalled, isIOS, location.pathname]);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('nilah_pwa_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          className="fixed bottom-4 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-5 z-[100] overflow-hidden"
        >
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 shadow-lg">
              {isIOS ? <Apple className="text-white" size={24} /> : <Download className="text-white" size={24} />}
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1">
                Instala Nilah App
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Agrega Nilah a tu pantalla de inicio para notificaciones y acceso ultra rápido.
              </p>
              
              {isIOS ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 px-3 py-2.5 text-xs text-violet-700 dark:text-violet-400 font-medium">
                    <Share size={14} className="shrink-0 animate-bounce" />
                    <span>Toca el botón <strong>Compartir</strong> en la barra de Safari</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-violet-500/10 px-3 py-2.5 text-xs text-violet-700 dark:text-violet-400 font-medium">
                    <Zap size={14} className="shrink-0" />
                    <span>Selecciona <strong>"Añadir a pantalla de inicio"</strong></span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap size={16} />
                    Instalar App
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-sm font-bold transition-colors"
                  >
                    Después
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWAPrompt;
