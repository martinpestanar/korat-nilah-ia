import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ClientProfilePanel from './ClientProfilePanel';

export interface Mensaje {
  id: string;
  business_id: string;
  cliente_id: string;
  contenido: string;
  tipo: string; // 'texto' | 'media' | 'audio' | 'documento'
  tipo_mensaje?: string; // 'normal' | 'nota_interna' | 'sistema'
  direccion: 'entrante' | 'saliente';
  created_at: string;
  campana_origen?: string;
  url_archivo?: string; // URL del archivo multimedia (imagen, audio, documento)
  estado?: string; // 'pendiente' | 'enviado' | 'entregado' | 'leido' | 'recibido' | 'error' | 'eliminado'
}

export interface ClienteOpciones {
  id: string;
  nombre: string;
  telefono: string;
  bot_pausado: boolean;
  bot_pausado_hasta: string | null;
  LTV?: string;
  fiabilidad_score?: number;
  nivel_riesgo?: string;
  puntos_acumulados?: number;
  ultima_visita?: string;
  ultimo_servicio?: string;
  cumpleanos?: string;
  alergias?: string;
  audiencia_segmento?: string;
  whatsapp_lid?: string | null;
  push_name?: string | null;
  notas?: string | null;
}

// Mobile navigation states: 'list' | 'chat' | 'profile'
type MobileView = 'list' | 'chat' | 'profile';

const InboxView: React.FC = () => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<ClienteOpciones | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [updatedClient, setUpdatedClient] = useState<ClienteOpciones | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false
  );
  const [isXlViewport, setIsXlViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1280px)').matches : true
  );

  const activeChatRef = useRef<ClienteOpciones | null>(activeChat);
  activeChatRef.current = activeChat;

  const businessId = user?.business_id || localStorage.getItem('korat_business_id') || '';

  // Track responsive breakpoints (<1024px mobile stack, >=1280px inline profile dock)
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 1023px)');
    const xlQuery = window.matchMedia('(min-width: 1280px)');

    const onMobileChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    const onXlChange = (e: MediaQueryListEvent) => setIsXlViewport(e.matches);

    setIsMobileViewport(mobileQuery.matches);
    setIsXlViewport(xlQuery.matches);

    mobileQuery.addEventListener('change', onMobileChange);
    xlQuery.addEventListener('change', onXlChange);
    return () => {
      mobileQuery.removeEventListener('change', onMobileChange);
      xlQuery.removeEventListener('change', onXlChange);
    };
  }, []);

  // Manage bottom nav hiding on mobile via custom event (kept before any early return)
  useEffect(() => {
    const hideNav =
      Boolean(user && businessId) &&
      isMobileViewport &&
      (mobileView === 'chat' || mobileView === 'profile');
    window.dispatchEvent(new CustomEvent('inbox-nav-toggle', { detail: hideNav }));
    return () => {
      window.dispatchEvent(new CustomEvent('inbox-nav-toggle', { detail: false }));
    };
  }, [user, businessId, isMobileViewport, mobileView]);

  // Browser history support for mobile stack transitions (list -> chat -> profile)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (!window.matchMedia('(max-width: 1023px)').matches) return;
      const stateView = event.state?.inboxView as MobileView | undefined;
      if (stateView === 'profile' && activeChatRef.current) {
        setMobileView('profile');
      } else if (stateView === 'chat' && activeChatRef.current) {
        setMobileView('chat');
      } else {
        setMobileView('list');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!user || !businessId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Cargando Inbox...</p>
        </div>
      </div>
    );
  }

  // Mobile: when a chat is selected, slide to chat view and push history entry
  const handleSelectChat = (chat: ClienteOpciones) => {
    setActiveChat(chat);
    setShowProfile(false);
    if (isMobileViewport) {
      if (mobileView === 'list' && window.history.state?.inboxView !== 'chat') {
        window.history.pushState({ ...(window.history.state || {}), inboxView: 'chat' }, '');
      }
      setMobileView('chat');
    }
  };

  // Mobile: back to list via history when pushed, or directly
  const handleBackToList = () => {
    if (isMobileViewport && window.history.state?.inboxView === 'chat') {
      window.history.back();
    } else {
      setMobileView('list');
    }
  };

  // Mobile: close profile back to chat via history when pushed, or directly
  const handleCloseMobileProfile = () => {
    if (isMobileViewport && window.history.state?.inboxView === 'profile') {
      window.history.back();
    } else {
      setMobileView('chat');
    }
  };

  // Toggle profile - on mobile shows profile view, on lg shows drawer, on xl shows docked panel
  const handleToggleProfile = () => {
    if (isMobileViewport) {
      if (mobileView === 'profile') {
        handleCloseMobileProfile();
      } else {
        if (window.history.state?.inboxView !== 'profile') {
          window.history.pushState({ ...(window.history.state || {}), inboxView: 'profile' }, '');
        }
        setMobileView('profile');
      }
    } else {
      setShowProfile(v => !v);
    }
  };

  // Sync in-memory client edits across ClientProfilePanel, activeChat, and ChatList
  const handleClientUpdated = (updated: ClienteOpciones) => {
    setUpdatedClient(updated);
    setActiveChat(prev => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
  };

  return (
    <div className="relative flex flex-1 h-full w-full overflow-hidden bg-white dark:bg-[#111B21]">

      {/* === DESKTOP: 3-column layout (xl) / 2-column + drawer (lg) === */}
      {/* === MOBILE: Stack-based navigation === */}

      {/* COLUMN 1: Chat List */}
      <div
        aria-hidden={isMobileViewport && mobileView !== 'list'}
        className={`flex flex-col panel-surface absolute inset-0 z-10 transition-transform duration-300 ease-out ${
          mobileView === 'list'
            ? 'translate-x-0'
            : '-translate-x-full pointer-events-none lg:pointer-events-auto'
        } lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:w-80 xl:w-[340px] lg:shrink-0 lg:h-full`}
      >
        {/* LIST HEADER */}
        <div className="hidden lg:flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-transparent">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Inbox</h2>
            <p className="text-xs text-violet-500 font-medium mt-0.5">Bandeja de Entrada Pro</p>
          </div>
          {/* Decorative gradient dot */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <ChatList
            businessId={businessId}
            activeChat={activeChat}
            setActiveChat={handleSelectChat}
            updatedClient={updatedClient}
          />
        </div>
      </div>

      {/* COLUMN 2: Chat Window */}
      <div
        aria-hidden={isMobileViewport && mobileView !== 'chat'}
        className={`flex flex-col flex-1 min-w-0 [background-color:var(--color-chat-bg)] absolute inset-0 z-20 transition-transform duration-300 ease-out ${
          mobileView === 'chat'
            ? 'translate-x-0'
            : mobileView === 'list'
              ? 'translate-x-full pointer-events-none lg:pointer-events-auto'
              : '-translate-x-full pointer-events-none lg:pointer-events-auto'
        } lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:h-full`}
      >
        {activeChat && (!isMobileViewport || mobileView !== 'list') ? (
          <ChatWindow
            businessId={businessId}
            activeChat={activeChat}
            onToggleProfile={handleToggleProfile}
            showProfile={showProfile || mobileView === 'profile'}
            onBack={handleBackToList}
          />
        ) : activeChat ? null : (
          /* Empty state - only shown on desktop */
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="text-center px-8 py-12">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/30 dark:to-pink-900/30 mb-5 shadow-inner">
                <svg className="h-10 w-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">Tu Inbox Pro está listo</h3>
              <p className="text-sm text-gray-500 dark:text-gray-500 max-w-[220px] mx-auto leading-relaxed">
                Selecciona una conversación de la izquierda para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>

      {/* COLUMN 3: Client Profile Panel */}
      {/* Desktop xl (>=1280px): docked inline */}
      {!isMobileViewport && isXlViewport && activeChat && showProfile && (
        <div className="hidden xl:flex xl:flex-col xl:w-80 xl:shrink-0 border-l border-gray-200 dark:border-[#2A2640] h-full min-h-0">
          <ClientProfilePanel
            cliente={activeChat}
            businessId={businessId}
            onClose={() => setShowProfile(false)}
            onClientUpdated={handleClientUpdated}
          />
        </div>
      )}

      {/* Tablet/Laptop lg (1024-1279px): slide-over drawer inside InboxView */}
      {!isMobileViewport && !isXlViewport && activeChat && showProfile && (
        <div className="hidden lg:block xl:hidden absolute inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setShowProfile(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 w-80 max-w-full bg-white dark:bg-[#1A1825] border-l border-gray-200 dark:border-[#2A2640] shadow-2xl flex flex-col">
            <ClientProfilePanel
              cliente={activeChat}
              businessId={businessId}
              onClose={() => setShowProfile(false)}
              onClientUpdated={handleClientUpdated}
            />
          </div>
        </div>
      )}

      {/* Mobile (<1024px): Profile panel slides in from right, full-screen */}
      <div
        aria-hidden={!isMobileViewport || mobileView !== 'profile'}
        className={`
          lg:hidden absolute inset-0 z-30 bg-white dark:bg-[#1A1825]
          transition-transform duration-300 ease-out
          ${isMobileViewport && mobileView === 'profile' && activeChat ? 'translate-x-0' : 'translate-x-full pointer-events-none'}
        `}
      >
        {isMobileViewport && activeChat && mobileView !== 'list' && (
          <ClientProfilePanel
            cliente={activeChat}
            businessId={businessId}
            onClose={handleCloseMobileProfile}
            onClientUpdated={handleClientUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default InboxView;
