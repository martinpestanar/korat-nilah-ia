import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bot, Send, PowerOff, Power, PanelRightClose, PanelRightOpen, Zap, StickyNote, ArrowLeft, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ClienteOpciones, Mensaje } from './InboxView';
import { appointments } from '../../services/api';

interface ChatWindowProps {
  businessId: string;
  activeChat: ClienteOpciones;
  onToggleProfile?: () => void;
  showProfile?: boolean;
  onBack?: () => void; // Mobile back button
}

// Removed plantillas

// Generate avatar gradient from name
const AVATAR_GRADIENTS = ['from-violet-500 to-purple-600','from-pink-500 to-rose-500','from-blue-500 to-indigo-600','from-emerald-500 to-teal-600','from-amber-500 to-orange-500'];
const getGradient = (name: string) => AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const DOODLE_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='none' stroke='%238B5CF6' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.08'%3E%3Cg transform='translate(30, 40) rotate(15)'%3E%3Ccircle cx='8' cy='8' r='5'/%3E%3Ccircle cx='8' cy='24' r='5'/%3E%3Cline x1='12' y1='10' x2='35' y2='25'/%3E%3Cline x1='12' y1='22' x2='35' y2='7'/%3E%3C/g%3E%3Cg transform='translate(180, 50) rotate(-20)'%3E%3Crect x='0' y='0' width='40' height='12' rx='2'/%3E%3Cline x1='6' y1='12' x2='6' y2='20'/%3E%3Cline x1='12' y1='12' x2='12' y2='20'/%3E%3Cline x1='18' y1='12' x2='18' y2='20'/%3E%3Cline x1='24' y1='12' x2='24' y2='20'/%3E%3Cline x1='30' y1='12' x2='30' y2='20'/%3E%3Cline x1='36' y1='12' x2='36' y2='20'/%3E%3C/g%3E%3Cg transform='translate(60, 180) rotate(-10)'%3E%3Cellipse cx='15' cy='15' rx='12' ry='18'/%3E%3Cline x1='15' y1='33' x2='15' y2='45'/%3E%3Ccircle cx='15' cy='15' r='8' stroke-width='0.5'/%3E%3C/g%3E%3Cg transform='translate(200, 200) rotate(35)'%3E%3Cpath d='M0 15 Q 15 0, 30 15 L 35 30 L -5 30 Z'/%3E%3Crect x='8' y='30' width='14' height='20' rx='2'/%3E%3Cline x1='0' y1='10' x2='5' y2='10'/%3E%3Cline x1='30' y1='10' x2='35' y2='10'/%3E%3C/g%3E%3Cpath d='M130 130 L 138 115 L 146 130 L 161 138 L 146 146 L 138 161 L 130 146 L 115 138 Z'/%3E%3Cpath d='M250 100 L 254 90 L 258 100 L 268 104 L 258 108 L 254 118 L 250 108 L 240 104 Z'/%3E%3Cpath d='M80 100 L 83 95 L 86 100 L 91 103 L 86 106 L 83 111 L 80 106 L 75 103 Z'/%3E%3Cpath d='M20 130 Q 35 110, 50 130 T 80 130'/%3E%3Cpath d='M220 30 Q 235 15, 250 30 T 280 30'/%3E%3Ccircle cx='270' cy='160' r='5' stroke-dasharray='3 3'/%3E%3Ccircle cx='110' cy='50' r='6'/%3E%3Ccircle cx='160' cy='260' r='8'/%3E%3Ccircle cx='40' cy='250' r='3' fill='%238B5CF6'/%3E%3Ccircle cx='250' cy='260' r='4' fill='%238B5CF6'/%3E%3Ccircle cx='130' cy='20' r='2' fill='%238B5CF6'/%3E%3C/svg%3E")`;


const ChatWindow: React.FC<ChatWindowProps> = ({ businessId, activeChat, onToggleProfile, showProfile, onBack }) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isBotPaused, setIsBotPaused] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [citaActiva, setCitaActiva] = useState<any>(null);
  const [verificandoPago, setVerificandoPago] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Verificar estado del bot al cambiar de chat
  useEffect(() => {
    const paused = activeChat.bot_pausado && (!activeChat.bot_pausado_hasta || new Date(activeChat.bot_pausado_hasta) > new Date());
    setIsBotPaused(paused);
    setIsInternalNote(false);
    setNewMessage('');

    const fetchCitaActiva = async () => {
      try {
        const { data } = await supabase.from('citas')
          .select('*')
          .eq('cliente_id', activeChat.id)
          .eq('business_id', businessId)
          .gte('fecha', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle();
        setCitaActiva(data || null);
      } catch (e) {}
    };
    fetchCitaActiva();
  }, [activeChat, businessId]);

  // Scroll bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Cargar historial de mensajes
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('business_id', businessId)
        .eq('cliente_id', activeChat.id)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      setMensajes(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Plantillas removed

  useEffect(() => {
    fetchMessages();

    // 1. Polling de seguridad en segundo plano
    const pollInterval = setInterval(() => {
      const silentFetch = async () => {
        try {
          const { data, error } = await supabase
            .from('mensajes')
            .select('*')
            .eq('business_id', businessId)
            .eq('cliente_id', activeChat.id)
            .order('created_at', { ascending: true })
            .limit(200);

          if (!error && data) {
            setMensajes((prev) => {
              if (prev.length !== data.length) return data;
              if (prev.length > 0 && data.length > 0) {
                if (prev[prev.length - 1].id !== data[data.length - 1].id) return data;
              }
              return prev;
            });
          }
        } catch (e) { /* silent */ }
      };
      silentFetch();
    }, 10000);

    // 2. Suscripción Realtime
    const channel = supabase
      .channel(`chat_${activeChat.id}_${businessId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `cliente_id=eq.${activeChat.id}`
      }, (payload) => {
        setMensajes((prev) => {
          const exists = prev.some(m => m.id === payload.new.id ||
            (m.contenido === payload.new.contenido && (new Date().getTime() - new Date(m.created_at).getTime() < 5000)));
          if (exists) return prev;
          return [...prev, payload.new as Mensaje];
        });
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [activeChat.id, businessId]);

  // Toggle Bot
  const toggleBot = async () => {
    setTogglingBot(true);
    try {
      const newStatus = !isBotPaused;
      const { error } = await supabase.rpc('toggle_bot_cliente', {
        p_cliente_id: activeChat.id,
        p_pausado: newStatus,
        p_razon: newStatus ? 'Pausado manualmente desde Inbox' : null
      });
      if (error) throw error;
      setIsBotPaused(newStatus);
    } catch (err) {
      console.error('Error toggling bot:', err);
    } finally {
      setTogglingBot(false);
    }
  };

  // Manejar el input
  const handleTextChange = (value: string) => {
    setNewMessage(value);
  };

  // Enviar Mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      if (isInternalNote) {
        // NOTA INTERNA: solo guardar en BD, NO enviar a WhatsApp
        await supabase.from('mensajes').insert({
          business_id: businessId,
          cliente_id: activeChat.id,
          contenido: content,
          tipo: 'texto',
          tipo_mensaje: 'nota_interna',
          direccion: 'saliente'
        });
        
        // Agregar a la UI de inmediato
        const noteMsg: Mensaje = {
          id: `temp-note-${Date.now()}`,
          business_id: businessId,
          cliente_id: activeChat.id,
          contenido: content,
          tipo: 'texto',
          tipo_mensaje: 'nota_interna',
          direccion: 'saliente',
          created_at: new Date().toISOString()
        };
        setMensajes((prev) => [...prev, noteMsg]);

      } else {
        // MENSAJE NORMAL: Optimistic UI + Webhook n8n
        const optimisticMsg: Mensaje = {
          id: `temp-${Date.now()}`,
          business_id: businessId,
          cliente_id: activeChat.id,
          contenido: content,
          tipo: 'texto',
          tipo_mensaje: 'normal',
          direccion: 'saliente',
          created_at: new Date().toISOString()
        };
        setMensajes((prev) => [...prev, optimisticMsg]);

        const API_URL = import.meta.env.VITE_API_URL || 'https://hooks.koratflow.agency/webhook';
        const response = await fetch(`${API_URL}/inbox-enviar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            business_id: businessId,
            cliente_id: activeChat.id,
            telefono: activeChat.telefono,
            contenido: content
          })
        });

        if (!response.ok) throw new Error('Error enviando vía webhook');
        setIsBotPaused(true);
      }

    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#ECEEF3] dark:bg-[#13111C]">
      {/* HEADER - Premium WhatsApp-Style */}
      <div className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-[#1E1C2D] border-b border-gray-100 dark:border-[#2A2640] shadow-sm">
        {/* Back button - mobile only */}
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors active:scale-90"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        )}

        {/* Avatar */}
        <div
          onClick={onToggleProfile}
          className={`h-10 w-10 rounded-full bg-gradient-to-br ${getGradient(activeChat.nombre || 'Cliente Oculto')} flex items-center justify-center text-white font-bold text-lg shadow-md cursor-pointer shrink-0 active:scale-90 transition-transform`}
        >
          {(activeChat.nombre || 'Cliente Oculto').charAt(0).toUpperCase()}
        </div>

        {/* Name & phone */}
        <div className="flex-1 min-w-0" onClick={onToggleProfile}>
          <h3 className="font-bold text-gray-900 dark:text-white leading-tight truncate text-[15px]">
            {activeChat.nombre || 'Cliente Oculto'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Información Privada</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* BOT TOGGLE */}
          <button
            onClick={toggleBot}
            disabled={togglingBot}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              isBotPaused
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
            }`}
          >
            {togglingBot ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : isBotPaused ? (
              <PowerOff size={12} />
            ) : (
              <Power size={12} />
            )}
            <span className="hidden sm:inline">{isBotPaused ? 'Pausado' : 'Bot IA'}</span>
          </button>

          {/* PROFILE PANEL TOGGLE */}
          {onToggleProfile && (
            <button
              onClick={onToggleProfile}
              className="hidden lg:flex p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              {showProfile ? <PanelRightClose size={18} className="text-gray-500" /> : <PanelRightOpen size={18} className="text-gray-500" />}
            </button>
          )}
        </div>
      </div>

      {/* Payment Verification Banner */}
      {citaActiva?.requiere_deposito && !citaActiva?.deposito_verificado && (
        <div className="bg-yellow-50 dark:bg-yellow-900/40 border-b border-yellow-200 dark:border-yellow-700/50 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm relative z-10 w-full">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                Depósito Pendiente
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400/80">
                Monto esperado: <span className="font-bold">S/ {citaActiva.monto_deposito || 0}</span>
              </p>
            </div>
          </div>
          <button 
            disabled={verificandoPago}
            onClick={async () => {
              setVerificandoPago(true);
              try {
                await appointments.verifyDeposit(citaActiva.id);
                setCitaActiva({...citaActiva, deposito_verificado: true});
                
                // Opcional: Agregar nota interna automática
                await supabase.from('mensajes').insert({
                  business_id: businessId,
                  cliente_id: activeChat.id,
                  contenido: '✅ Comprobante de pago verificado por recepción',
                  tipo: 'texto',
                  tipo_mensaje: 'nota_interna',
                  direccion: 'saliente'
                });
              } catch (e) {
                console.error(e);
              } finally {
                setVerificandoPago(false);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-2 rounded-xl transition-all shadow-[0_2px_4px_rgba(250,204,21,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verificandoPago ? (
              <div className="h-4 w-4 rounded-full border-2 border-yellow-900 border-t-transparent animate-spin" />
            ) : (
              <>
                <CheckCircle2 size={14} />
                Confirmar
              </>
            )}
          </button>
        </div>
      )}

      {/* MESSAGES AREA - WhatsApp chat background */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 bg-repeat"
        style={{
          backgroundImage: DOODLE_PATTERN,
          backgroundSize: '300px 300px'
        }}
      >
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div></div>
        ) : mensajes.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm">No hay mensajes anteriores en este chat.</div>
        ) : (
          mensajes.map((msg, idx) => {
            const isOut = msg.direccion === 'saliente';
            const isNote = msg.tipo_mensaje === 'nota_interna';

            const msgDate = new Date(msg.created_at);
            const prevMsg = idx > 0 ? mensajes[idx - 1] : null;
            const prevDate = prevMsg ? new Date(prevMsg.created_at) : null;
            
            let showDateHeader = false;
            let dateHeaderText = '';
            
            if (!prevDate || msgDate.toDateString() !== prevDate.toDateString()) {
              showDateHeader = true;
              if (isToday(msgDate)) {
                dateHeaderText = 'Hoy';
              } else if (isYesterday(msgDate)) {
                dateHeaderText = 'Ayer';
              } else {
                dateHeaderText = format(msgDate, "d 'de' MMMM", { locale: es });
              }
            }

            return (
              <React.Fragment key={msg.id || idx}>
                {showDateHeader && (
                  <div className="flex justify-center my-3">
                    <span className="bg-white/80 dark:bg-[#1A1825]/80 text-[#54656f] dark:text-gray-400 text-[11px] font-semibold px-3 py-1 rounded-lg shadow-[0_1px_1px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-white/5 uppercase tracking-wide backdrop-blur-sm">
                      {dateHeaderText}
                    </span>
                  </div>
                )}
                {isNote ? (
                  <div className="flex justify-center">
                    <div className="max-w-[80%] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/40 rounded-xl px-3 py-2 text-center">
                      <div className="flex items-center gap-1.5 mb-1 justify-center">
                        <StickyNote size={11} className="text-yellow-600 dark:text-yellow-400" />
                        <span className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">Nota Interna · Solo el Equipo ve esto</span>
                      </div>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 whitespace-pre-wrap leading-relaxed">{msg.contenido}</p>
                      <p className="text-[10px] text-yellow-600/60 mt-1">{format(msgDate, 'HH:mm')}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOut
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white dark:bg-[#1E1C2D] text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-[#2A2640] rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.contenido || <span className="italic opacity-70">Multimedia</span>}</p>
                      <div className={`flex items-center justify-end mt-1 gap-1 ${isOut ? 'text-primary-100/70' : 'text-gray-400'}`}>
                        <span className="text-[10px]">{format(msgDate, 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-white dark:bg-[#1E1C2D] border-t border-gray-200 dark:border-[#2A2640]">
        {!isBotPaused && !isInternalNote && (
          <div className="mb-2 text-xs text-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg py-1.5 flex items-center justify-center gap-2">
            <Bot size={13} /> El bot está respondiendo automáticamente. Puedes pausarlo para intervenir.
          </div>
        )}

        {/* Plantillas popup removed */}

        {/* Botones de modo de escritura */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setIsInternalNote(false)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-all ${
              !isInternalNote
                ? 'bg-primary text-white border-primary'
                : 'text-gray-500 border-gray-200 dark:border-[#2A2640] hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            Mensaje
          </button>
          <button
            onClick={() => setIsInternalNote(true)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium border transition-all flex items-center gap-1.5 ${
              isInternalNote
                ? 'bg-yellow-400 text-yellow-900 border-yellow-400'
                : 'text-gray-500 border-gray-200 dark:border-[#2A2640] hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <StickyNote size={12} /> Nota Interna
          </button>
          <span className="text-[10px] text-gray-400 ml-auto">Escribe un mensaje para enviarlo</span>
        </div>

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            className={`flex-1 resize-none border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 text-gray-900 dark:text-white transition-colors ${
              isInternalNote
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700/50 focus:ring-yellow-300/50 placeholder-yellow-600/60'
                : 'bg-gray-50 dark:bg-[#13111C] border-gray-200 dark:border-[#2A2640] focus:ring-primary/50'
            }`}
            rows={2}
            placeholder={isInternalNote ? "Escribe una nota privada para el equipo..." : "Escribe un mensaje..."}
            value={newMessage}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`h-12 w-12 shrink-0 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
              isInternalNote
                ? 'bg-yellow-400 hover:bg-yellow-500 shadow-yellow-200'
                : 'bg-primary hover:bg-primary-600 shadow-primary/20'
            }`}
          >
            {sending ? <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
