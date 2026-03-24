import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false); // Reset dismissal on reconnect
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && !isDismissed && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between bg-amber-500 text-white px-4 py-2 sm:py-3 shadow-md"
        >
          <div className="flex items-center gap-3">
            <WifiOff size={18} />
            <p className="text-sm font-medium">
              Estás sin conexión. Mostrando información guardada localmente.
            </p>
          </div>
          <button 
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-amber-600 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
