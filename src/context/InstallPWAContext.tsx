import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Interfaz para el evento beforeinstallprompt nativo
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPWAContextType {
  isInstallable: boolean;
  promptInstall: () => Promise<boolean>;
  isInstalled: boolean;
}

const InstallPWAContext = createContext<InstallPWAContextType>({
  isInstallable: false,
  promptInstall: async () => false,
  isInstalled: false,
});

export const useInstallPWA = () => useContext(InstallPWAContext);

export const InstallPWAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada (Standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el comportamiento por defecto (que el navegador muestre el mini-infobar o sugerencias automáticas)
      e.preventDefault();
      
      // Guardar el evento para dispararlo más tarde
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    // Mostrar el prompt nativo
    await deferredPrompt.prompt();

    // Esperar a ver qué responde el usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    // Una vez usado, no se puede volver a usar el mismo prompt
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  return (
    <InstallPWAContext.Provider value={{ isInstallable, promptInstall, isInstalled }}>
      {children}
    </InstallPWAContext.Provider>
  );
};
