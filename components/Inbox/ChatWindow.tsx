import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bot, Send, PowerOff, Power, PanelRightClose, PanelRightOpen, StickyNote, ArrowLeft, Phone, AlertTriangle, CheckCircle2, Image as ImageIcon, FileText, Mic, X, ZoomIn, Search, ChevronDown, CheckCheck, Calendar } from 'lucide-react';
import { ClienteOpciones, Mensaje } from './InboxView';
import { appointments } from '../../services/api';
import QuickBookingModal from './QuickBookingModal';
interface ChatWindowProps {
  businessId: string;
  activeChat: ClienteOpciones;
  onToggleProfile?: () => void;
  showProfile?: boolean;
  onBack?: () => void; // Mobile back button
}

// Removed plantillas

// Generate avatar gradient from name
const AVATAR_GRADIENTS = ['from-violet-400 to-purple-500','from-pink-400 to-rose-400','from-blue-400 to-indigo-500','from-emerald-400 to-teal-500','from-amber-400 to-orange-400'];
const getGradient = (name: string) => AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const DOODLE_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='none' stroke='%239E8070' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.13'%3E%3Cg transform='translate(25,30) rotate(25)'%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Cline x1='4' y1='0' x2='22' y2='12'/%3E%3Ccircle cx='0' cy='8' r='4'/%3E%3Cline x1='4' y1='8' x2='22' y2='-4'/%3E%3C/g%3E%3Cpath d='M80,15 C80,15 77,9 72,9 C67,9 64,14 64,18 C64,28 80,37 80,37 C80,37 96,28 96,18 C96,14 93,9 88,9 C83,9 80,15 80,15Z'/%3E%3Cg transform='translate(200,40)'%3E%3Crect x='0' y='0' width='40' height='7' rx='2'/%3E%3Cline x1='5' y1='7' x2='5' y2='17'/%3E%3Cline x1='10' y1='7' x2='10' y2='20'/%3E%3Cline x1='15' y1='7' x2='15' y2='17'/%3E%3Cline x1='20' y1='7' x2='20' y2='20'/%3E%3Cline x1='25' y1='7' x2='25' y2='17'/%3E%3Cline x1='30' y1='7' x2='30' y2='20'/%3E%3Cline x1='35' y1='7' x2='35' y2='17'/%3E%3C/g%3E%3Cg transform='translate(140,110)'%3E%3Ccircle cx='0' cy='-12' r='7'/%3E%3Ccircle cx='11' cy='-6' r='7'/%3E%3Ccircle cx='11' cy='6' r='7'/%3E%3Ccircle cx='0' cy='12' r='7'/%3E%3Ccircle cx='-11' cy='6' r='7'/%3E%3Ccircle cx='-11' cy='-6' r='7'/%3E%3Ccircle cx='0' cy='0' r='5'/%3E%3C/g%3E%3Cpath d='M265,85 L268,76 L271,85 L280,85 L273,91 L276,100 L268,94 L261,100 L264,91 L257,85Z'/%3E%3Cg transform='translate(40,160) rotate(-10)'%3E%3Crect x='4' y='12' width='13' height='18' rx='1'/%3E%3Cpath d='M4,12 L10,2 L17,12Z'/%3E%3Crect x='1' y='28' width='19' height='7' rx='2'/%3E%3C/g%3E%3Cpath d='M235,155 Q255,135 250,150 Q245,165 230,160 Q215,155 220,140 Q225,125 245,125'/%3E%3Cpath d='M80,240 L83,231 L86,240 L95,240 L88,246 L91,255 L83,249 L76,255 L79,246 L72,240Z'/%3E%3Cpath d='M200,210 C200,210 197,204 192,204 C187,204 184,209 184,213 C184,223 200,232 200,232 C200,232 216,223 216,213 C216,209 213,204 208,204 C203,204 200,210 200,210Z'/%3E%3Cg transform='translate(248,242) rotate(-15)'%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Cline x1='4' y1='0' x2='20' y2='11'/%3E%3Ccircle cx='0' cy='8' r='4'/%3E%3Cline x1='4' y1='8' x2='20' y2='-3'/%3E%3C/g%3E%3Cpath d='M10,278 Q25,263 40,278 T70,278'/%3E%3Cpath d='M198,268 Q213,253 228,268 T258,268'/%3E%3Cpath d='M35,85 L38,76 L41,85 L50,85 L43,91 L46,100 L38,94 L31,100 L34,91 L27,85Z'/%3E%3Ccircle cx='128' cy='58' r='3' fill='%239E8070'/%3E%3Ccircle cx='28' cy='118' r='2' fill='%239E8070'/%3E%3Ccircle cx='268' cy='188' r='2.5' fill='%239E8070'/%3E%3Ccircle cx='143' cy='278' r='3' fill='%239E8070'/%3E%3Ccircle cx='175' cy='170' r='2' fill='%239E8070'/%3E%3C/svg%3E")`;



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
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showQuickBooking, setShowQuickBooking] = useState(false);

  // Exponer fetchCitaActiva para recargar el banner después de crear una cita rápida
  const fetchCitaActiva = async () => {
    try {
      const { data } = await supabase.from('Citas')
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialMount = useRef(true);

  // Verificar estado del bot al cambiar de chat
  useEffect(() => {
    isInitialMount.current = true;
    const paused = activeChat.bot_pausado && (!activeChat.bot_pausado_hasta || new Date(activeChat.bot_pausado_hasta) > new Date());
    setIsBotPaused(paused);
    setIsInternalNote(false);
    setNewMessage('');

    fetchCitaActiva();
  }, [activeChat, businessId]);

  // Scroll bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (mensajes.length === 0) return;
    
    if (isInitialMount.current) {
      scrollToBottom('auto');
      setTimeout(() => {
        isInitialMount.current = false;
      }, 100);
    } else {
      scrollToBottom('smooth');
    }
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
      
      // Marcar como leídos una vez cargados
      if (data && data.some(m => m.direccion === 'entrante' && m.estado !== 'leido')) {
        markMessagesAsRead();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };
  // Marcar mensajes como leídos
  const markMessagesAsRead = async () => {
    try {
      const { error } = await supabase
        .from('mensajes')
        .update({ estado: 'leido' })
        .eq('business_id', businessId)
        .eq('cliente_id', activeChat.id)
        .eq('direccion', 'entrante')
        .neq('estado', 'leido');
      
      if (error) throw error;
    } catch (err) {
      console.error('Error marking messages as read:', err);
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
          
          // Si el mensaje es entrante, marcarlo como leído inmediatamente
          if (payload.new.direccion === 'entrante') {
            markMessagesAsRead();
          }
          
          return [...prev, payload.new as Mensaje];
        });
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 500);
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
    <div className="flex flex-col h-full bg-[#E9EDEF] dark:bg-[#0B141A]">
      {/* HEADER — WhatsApp Solid Surface Style */}
      <div className="flex items-center gap-3 px-4 py-2 bg-[#F0F2F5] dark:bg-[#202C33] shrink-0 border-l border-gray-200 dark:border-white/5 shadow-sm relative z-20">
        {/* Back button - mobile only */}
        {onBack && (
          <button onClick={onBack} className="lg:hidden flex items-center justify-center mr-1">
            <ArrowLeft size={20} className="text-[#54656f] dark:text-[#AEBAC1]" />
          </button>
        )}

        {/* Avatar */}
        <div
          onClick={onToggleProfile}
          className={`h-10 w-10 rounded-full bg-gradient-to-br ${getGradient(activeChat.nombre || 'Cliente')} flex items-center justify-center text-white font-bold text-lg cursor-pointer shrink-0`}
        >
          {(activeChat.nombre || 'Cliente').charAt(0).toUpperCase()}
        </div>

        {/* Name & phone */}
        <div className="flex-1 min-w-0" onClick={onToggleProfile}>
          <h3 className="font-semibold text-[#111B21] dark:text-[#E9EDEF] leading-tight truncate text-[16px]">
            {activeChat.nombre || 'Cliente'}
          </h3>
          <p className="text-[13px] text-[#667781] dark:text-[#8696A0] truncate">
            {isBotPaused ? 'Intervención humana' : 'Bot activo'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 shrink-0 text-[#54656f] dark:text-[#AEBAC1]">
          {/* Quick Booking Button */}
          <button 
             onClick={() => setShowQuickBooking(true)}
             className="hidden sm:flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-violet-600 dark:text-violet-400 transition-colors"
             title="Agendar Cita Rápida"
          >
             <Calendar size={18} />
          </button>

          <Search size={20} className="hidden sm:block cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors" />
          
          {/* BOT TOGGLE */}
          <button
            onClick={toggleBot}
            disabled={togglingBot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-all active:scale-95 ${
              isBotPaused
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-[#00A884]/10 text-[#00A884] dark:bg-[#00A884]/20'
            }`}
          >
            {togglingBot ? (
              <div className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : isBotPaused ? (
              <PowerOff size={13} />
            ) : (
              <Bot size={13} />
            )}
            <span className="hidden md:inline">{isBotPaused ? 'Pausado' : 'Asistente IA'}</span>
          </button>

          {onToggleProfile && (
            <div onClick={onToggleProfile} className="cursor-pointer">
              {showProfile ? <PanelRightClose size={20} /> : <ChevronDown size={20} />}
            </div>
          )}
        </div>
      </div>

      {/* Payment Verification Banner */}
      {citaActiva?.requiere_deposito && !citaActiva?.deposito_verificado && (
        <div className="bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-500/20 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm relative z-10 w-full backdrop-blur-md">
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
            className="flex items-center gap-1.5 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
          backgroundColor: 'var(--color-chat-bg)',
          backgroundImage: DOODLE_PATTERN,
          backgroundSize: '300px 300px'
        }}
      >
        {loading ? (
          <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div></div>
        ) : mensajes.length === 0 ? (
          <div className="text-center text-[#667781] dark:text-[#8696A0] mt-10 text-sm">No hay mensajes anteriores en este chat.</div>
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
              if (isToday(msgDate)) dateHeaderText = 'Hoy';
              else if (isYesterday(msgDate)) dateHeaderText = 'Ayer';
              else dateHeaderText = format(msgDate, "d 'de' MMMM", { locale: es });
            }

            return (
              <React.Fragment key={msg.id || idx}>
                {showDateHeader && (
                  <div className="flex justify-center my-4">
                    <span className="bg-[#D1D7DB] dark:bg-[#182229] text-[#54656f] dark:text-[#8696A0] text-[12.5px] px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-tight font-medium">
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
                  <div className={`group flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[14.5px] leading-[1.45] ${
                      isOut
                      ? 'bg-bubble-out-bg text-bubble-out-text rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4px]'
                      : 'bg-bubble-in-bg text-bubble-in-text rounded-tl-[4px] rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                    }`}>
                      {/* --- MULTIMEDIA RENDERER --- */}
                      {(() => {
                        const url = msg.url_archivo === 'data:image/jpeg;base64,' ? null : msg.url_archivo;
                        const isImageUrl = url && (
                          (url.startsWith('data:image/') && url.length > 30) || 
                          /\.(jpeg|jpg|gif|png|webp|bmp|heic|heif)$/i.test(url.split('?')[0])
                        );
                        const isMedia = msg.tipo === 'media' || msg.tipo === 'imagen' || msg.tipo === 'image';

                        if (isImageUrl || (isMedia && url)) {
                          return (
                            <div className="space-y-1.5">
                              <div className="relative group cursor-pointer overflow-hidden rounded-lg" onClick={() => setZoomedImage(url!)}>
                                <img src={url!} alt="Chat" className="max-w-full max-h-60 object-cover rounded-lg block" />
                              </div>
                              {msg.contenido && <p className="px-1">{msg.contenido}</p>}
                            </div>
                          );
                        }
                        return <p className="px-1 whitespace-pre-wrap">{msg.contenido}</p>;
                      })()}
                      <div className="flex items-center justify-end mt-0.5 gap-1 select-none">
                        <span className="text-[11px] opacity-70">
                          {format(msgDate, 'HH:mm')}
                        </span>
                        {isOut && <CheckCheck size={14} className="text-[#53bdeb] ml-0.5" strokeWidth={2.5} />}
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

      {/* Depósito Preventivo Banner (Score < 50) */}
      {(!citaActiva || citaActiva.fecha < new Date().toISOString()) && activeChat.fiabilidad_score !== undefined && activeChat.fiabilidad_score < 50 && (
         <div className="bg-rose-50/90 dark:bg-rose-900/30 border-t border-rose-200/50 dark:border-rose-500/20 px-3 py-2.5 flex items-center justify-between shrink-0 shadow-sm relative z-10 w-full">
            <div className="flex items-center gap-2">
               <div className="h-6 w-6 rounded-full bg-rose-100 dark:bg-rose-800 flex items-center justify-center shrink-0">
                  <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
               </div>
               <div>
                  <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                     Baja Fiabilidad Detectada ({Math.round(activeChat.fiabilidad_score)}/100)
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400/80 leading-tight">
                     Se recomienda agendar cobrando depósito previo a este cliente.
                  </p>
               </div>
            </div>
            <button 
               onClick={() => setShowQuickBooking(true)}
               className="text-[11px] font-bold bg-white dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors shadow-sm whitespace-nowrap ml-2"
            >
               Agendar con depósito
            </button>
         </div>
      )}

      {/* FOOTER — WhatsApp Input Area */}
      <div className="bg-[#F0F2F5] dark:bg-[#202C33] px-3 py-2.5 shrink-0 flex flex-col gap-2 border-l border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-2 px-1">
          <button onClick={() => setIsInternalNote(false)} className={`text-[12px] px-3 py-1 rounded-full font-bold transition-all ${!isInternalNote ? 'bg-[#00A884] text-white shadow-sm' : 'text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200 dark:hover:bg-white/5'}`}>
            Mensaje
          </button>
          <button onClick={() => setIsInternalNote(true)} className={`text-[12px] px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 ${isInternalNote ? 'bg-yellow-400 text-yellow-900 shadow-sm' : 'text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200 dark:hover:bg-white/5'}`}>
              <StickyNote size={13} /> Nota Interna
            </button>
        </div>

        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-white dark:bg-[#2A3942] rounded-lg px-4 py-2 min-h-[45px] transition-all shadow-sm">
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none bg-transparent border-none focus:ring-0 text-[15px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] leading-normal h-[24px]"
              rows={1}
              placeholder={isInternalNote ? "Nota interna para el salón..." : "Escribe un mensaje..."}
              value={newMessage}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`h-[45px] w-[45px] shrink-0 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale ${
              isInternalNote ? 'bg-yellow-400 text-yellow-900' : 'bg-[#00A884] text-white'
            }`}
          >
            {sending ? <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Send size={20} />}
          </button>
        </form>
      </div>

      {/* IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors" onClick={() => setZoomedImage(null)}>
            <X size={24} />
          </button>
          <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
        </div>
      )}

      {/* QUICK BOOKING MODAL */}
      {showQuickBooking && (
        <QuickBookingModal 
           businessId={businessId}
           clienteId={activeChat.id}
           clienteNombre={activeChat.nombre}
           fiabilidadScore={activeChat.fiabilidad_score}
           onClose={() => setShowQuickBooking(false)}
           onSuccess={(result) => {
              setShowQuickBooking(false);
              fetchCitaActiva(); // recargar para mostrar en amarillo si no está verificado
           }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
