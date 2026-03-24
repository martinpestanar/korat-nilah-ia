import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavBar from './BottomNavBar';
import CopilotButton from '../Copilot/CopilotButton';
import CopilotInterface from '../Copilot/CopilotInterface';
import InstallPWAPrompt from '../UI/InstallPWAPrompt';
import OfflineBanner from '../UI/OfflineBanner';
import IOSNotificationBanner from '../UI/IOSNotificationBanner';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * App Shell Architecture
 * ─────────────────────────────────────────────
 * Mobile (<sm): Header (fijo) + contenido central (scroll solo aquí) + BottomNavBar (fija)
 * Desktop (≥sm): Sidebar izquierdo (fijo) + Header (fijo) + contenido central (scroll)
 *
 * El truco nativo: overflow-hidden en el wrapper raíz + overflow-y-auto solo en <main>.
 * Esto garantiza que SOLO el contenido scrollea, no la UI chrome. Sensación de app nativa.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isEdgeToEdge = location.pathname.includes('/inbox') || location.pathname.includes('/agenda');

  return (
    // Root: ocupa toda la pantalla, sin scroll propio
    // h-[100dvh] = dynamic viewport height: excluye la barra de herramientas de Safari iOS
    <div className="flex h-[100dvh] w-full overflow-hidden bg-light-bg dark:bg-dark-bg transition-colors duration-300">
      <OfflineBanner />

      {/* ── SIDEBAR (solo Desktop ≥ sm) ──────────── */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* ── CONTENIDO PRINCIPAL ─────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col sm:ml-64">

        {/* Header fijo */}
        <Header onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Zona de scroll único — aquí vive el contenido */}
        <main
          className={`flex-1 min-w-0 w-full max-w-[100vw] overflow-y-auto overflow-x-hidden transition-all duration-300 ${
            isEdgeToEdge ? 'p-0' : 'px-0 py-0 sm:p-6 pb-24 sm:pb-6'
          }`}
          style={{
            // safe-area-inset-bottom para iPhone notch (se acumula con pb-24)
            paddingBottom: isEdgeToEdge ? '0px' : 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
          }}
        >
          {children}
        </main>
      </div>

      <CopilotButton />
      <CopilotInterface />

      {/* ── BOTTOM NAV (solo Mobile < sm) ────────── */}
      <BottomNavBar />

      {/* Banner de notificaciones iOS PWA */}
      <IOSNotificationBanner />

      <InstallPWAPrompt />
    </div>
  );
};

export default Layout;
