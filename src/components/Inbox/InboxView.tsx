import React, { useState, useEffect } from 'react';
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
}

// Mobile navigation states: 'list' | 'chat' | 'profile'
type MobileView = 'list' | 'chat' | 'profile';

const InboxView: React.FC = () => {
  const { user } = useAuth();
  const [activeChat, setActiveChat] = useState<ClienteOpciones | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');

  const businessId = user?.business_id || localStorage.getItem('korat_business_id') || '';

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

  // Manage bottom nav hiding on mobile via custom event
  useEffect(() => {
    const hideNav = mobileView === 'chat' || mobileView === 'profile';
    window.dispatchEvent(new CustomEvent('inbox-nav-toggle', { detail: hideNav }));
    return () => {
      window.dispatchEvent(new CustomEvent('inbox-nav-toggle', { detail: false }));
    };
  }, [mobileView]);

  // Mobile: when a chat is selected, slide to chat view
  const handleSelectChat = (chat: ClienteOpciones) => {
    setActiveChat(chat);
    setShowProfile(false);
    setMobileView('chat');
  };

  // Mobile: back to list
  const handleBackToList = () => {
    setMobileView('list');
  };

  // Toggle profile - on mobile shows profile view, on desktop shows panel
  const handleToggleProfile = () => {
    if (window.innerWidth < 1024) {
      setMobileView(mobileView === 'profile' ? 'chat' : 'profile');
    } else {
      setShowProfile(v => !v);
    }
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden app-surface">
      
      {/* === DESKTOP: 3-column layout === */}
      {/* === MOBILE: Stack-based navigation === */}

      {/* COLUMN 1: Chat List */}
      <div className={`flex flex-col panel-surface absolute inset-0 z-10 transition-transform duration-300 ease-out ${mobileView === 'list' ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:w-80 lg:shrink-0 lg:h-full`}>
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

        <div className="flex-1 overflow-y-auto min-h-0">
          <ChatList businessId={businessId} activeChat={activeChat} setActiveChat={handleSelectChat} />
        </div>
      </div>

      {/* COLUMN 2: Chat Window */}
      <div className={`flex flex-col flex-1 min-w-0 [background-color:var(--color-chat-bg)] absolute inset-0 z-20 transition-transform duration-300 ease-out ${mobileView === 'chat' ? 'translate-x-0' : mobileView === 'list' ? 'translate-x-full' : '-translate-x-full'} lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:h-full`}>
        {activeChat ? (
          <ChatWindow
            businessId={businessId}
            activeChat={activeChat}
            onToggleProfile={handleToggleProfile}
            showProfile={showProfile || mobileView === 'profile'}
            onBack={handleBackToList}
          />
        ) : (
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
      {/* Desktop: shows as sidebar if showProfile is true + chat is active */}
      {activeChat && showProfile && (
        <div className="hidden lg:flex lg:flex-col lg:w-80 lg:shrink-0 border-l border-gray-200 dark:border-[#2A2640]">
          <ClientProfilePanel
            cliente={activeChat}
            businessId={businessId}
            onClose={() => setShowProfile(false)}
          />
        </div>
      )}

      {/* Mobile: Profile panel slides in from right, full-screen */}
      <div className={`
        lg:hidden absolute inset-0 z-30 bg-white dark:bg-[#1A1825]
        transition-transform duration-300 ease-out
        ${mobileView === 'profile' && activeChat ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {activeChat && (
          <ClientProfilePanel
            cliente={activeChat}
            businessId={businessId}
            onClose={() => setMobileView('chat')}
          />
        )}
      </div>
    </div>
  );
};

export default InboxView;
