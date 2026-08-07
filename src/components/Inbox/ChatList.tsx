import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClienteOpciones, Mensaje } from './InboxView';
import { Bot, Clock, CheckCheck, MessageSquareDashed, Search, Filter, CalendarDays, ChevronDown, Zap, Tag } from 'lucide-react';
import { appointments } from '../../services/api';

interface ChatListProps {
  businessId: string;
  activeChat: ClienteOpciones | null;
  setActiveChat: (chat: ClienteOpciones) => void;
}

interface Tag {
  id: string;
  cliente_id: string;
  business_id: string;
  etiqueta: string;
  color: string;
}

interface ChatSummary {
  cliente: ClienteOpciones;
  ultimoMensaje: Mensaje;
  unread: number;
  ultimaCita?: any;
  tags: Tag[];
}

// Generate a consistent avatar color based on name
const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-pink-500 to-rose-500',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
];

const getAvatarGradient = (name: string) => {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
};

const ChatList: React.FC<ChatListProps> = ({ businessId, activeChat, setActiveChat }) => {


  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const fetchChats = async () => {
    try {
      if (chats.length === 0) {
        setLoading(true);
      }

      // PASO 1: Obtener TODOS los clientes del negocio
      const { data: clientesData, error: clientesError } = await supabase
        .from('Clientes')
        .select('id, nombre, telefono, bot_pausado, bot_pausado_hasta, puntos_acumulados, nivel_riesgo')
        .eq('business_id', businessId)
        .order('id');

      if (clientesError) throw clientesError;
      if (!clientesData || clientesData.length === 0) {
        setChats([]);
        return;
      }

      const allClientIds = clientesData.map((c: any) => c.id);

      // PASO 2: Obtener el ultimo mensaje de TODOS los clientes de una sola vez
      // Usamos un limite alto porque solo guardamos 1 msg por cliente despues del groupBy
      const BATCH_SIZE = 500;
      const lastMsgMap = new Map<string, any>();

      for (let i = 0; i < allClientIds.length; i += BATCH_SIZE) {
        const batch = allClientIds.slice(i, i + BATCH_SIZE);
        const { data: msgsData, error: msgsError } = await supabase
          .from('mensajes')
          .select('id, cliente_id, business_id, contenido, tipo, tipo_mensaje, direccion, estado, created_at, campana_origen, url_archivo')
          .eq('business_id', businessId)
          .in('cliente_id', batch)
          .order('created_at', { ascending: false })
          .limit(BATCH_SIZE * 20); // amplio margen para capturar al menos 1 por cliente

        if (!msgsError && msgsData) {
          msgsData.forEach((msg: any) => {
            const key = String(msg.cliente_id);
            if (!lastMsgMap.has(key)) {
              lastMsgMap.set(key, msg);
            }
          });
        }
      }

      // PASO 3: Armar la lista de chats — solo clientes que tienen al menos 1 mensaje
      const chatsArray: ChatSummary[] = [];
      clientesData.forEach((cliente: any) => {
        const lastMsg = lastMsgMap.get(String(cliente.id));
        if (!lastMsg) return; // sin mensajes, no aparece en el inbox

        const isUnread = lastMsg.direccion === 'entrante'
          && lastMsg.estado !== 'leido'
          && String(lastMsg.cliente_id) !== String(activeChat?.id);

        chatsArray.push({
          cliente: cliente as ClienteOpciones,
          ultimoMensaje: lastMsg as Mensaje,
          unread: isUnread ? 1 : 0,
          tags: [],
        });
      });

      // Ordenar por fecha del ultimo mensaje (mas reciente primero)
      chatsArray.sort((a, b) =>
        new Date(b.ultimoMensaje.created_at).getTime() - new Date(a.ultimoMensaje.created_at).getTime()
      );

      // PASO 4: Obtener conteo real de mensajes no leidos por cliente
      const unreadCounts = new Map<string, number>();
      {
        const { data: unreadData } = await supabase
          .from('mensajes')
          .select('cliente_id')
          .eq('business_id', businessId)
          .eq('direccion', 'entrante')
          .neq('estado', 'leido');

        if (unreadData) {
          unreadData.forEach((msg: any) => {
            const key = String(msg.cliente_id);
            unreadCounts.set(key, (unreadCounts.get(key) || 0) + 1);
          });
        }
      }

      chatsArray.forEach(chat => {
        const clientKey = String(chat.cliente.id);
        if (String(chat.cliente.id) === String(activeChat?.id)) {
          chat.unread = 0;
        } else {
          chat.unread = unreadCounts.get(clientKey) || 0;
        }
      });

      // PASO 5: Citas recientes
      const clientIds = chatsArray.map(c => c.cliente.id).filter(Boolean);
      if (clientIds.length > 0) {
        const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: citasData, error: citasError } = await supabase
          .from('Citas')
          .select('id, cliente_id, estado, fecha')
          .in('cliente_id', clientIds)
          .gte('fecha', startDate)
          .order('fecha', { ascending: false });

        if (!citasError && citasData) {
          chatsArray.forEach(chat => {
            const clientCitas = citasData.filter(c => String(c.cliente_id) === String(chat.cliente.id));
            if (clientCitas.length > 0) {
              chat.ultimaCita = clientCitas[0];
            }
          });
        }
      }

      // PASO 6: Tags
      const { data: tagsData } = await supabase
        .from('chat_tags')
        .select('*')
        .eq('business_id', businessId);

      if (tagsData && tagsData.length > 0) {
        const tagsMap = new Map<string, Tag[]>();
        tagsData.forEach(t => {
          const cid = String(t.cliente_id);
          const arr = tagsMap.get(cid) || [];
          arr.push(t);
          tagsMap.set(cid, arr);
        });
        chatsArray.forEach(chat => {
          chat.tags = tagsMap.get(String(chat.cliente.id)) || [];
        });
      }

      setChats(chatsArray);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    // Silent polling fallback (15s) — reutiliza fetchChats que ya usa la estrategia correcta
    const pollInterval = setInterval(() => {
      fetchChats();
    }, 15000);

    // Realtime subscription
    const channel = supabase
      .channel(`chat_list_changes_${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes', filter: `business_id=eq.${businessId}` },
        (payload) => {
          console.log('Realtime change in mensajes:', payload.eventType);
          fetchChats();
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_tags', filter: `business_id=eq.${businessId}` },
        () => fetchChats()
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      setTimeout(async () => {
        try {
          if (channel) {
            await supabase.removeChannel(channel);
          }
        } catch (err) {
          // Silent catch to avoid "WebSocket is closed" noise during unmount
        }
      }, 100);
    };
  }, [businessId]);

  // Limpiar contador unread localmente cuando se selecciona un chat
  useEffect(() => {
    if (activeChat && chats.length > 0) {
      const activeSummary = chats.find(c => c.cliente.id === activeChat.id);
      if (activeSummary && activeSummary.unread > 0) {
        setChats(prev => prev.map(c =>
          c.cliente.id === activeChat.id ? { ...c, unread: 0 } : c
        ));
      }
    }
  }, [activeChat?.id]);

  if (loading && chats.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4" />
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Derived state: Filtering & Search
  const filteredChats = chats.filter((chat) => {
    const isBotPaused = chat.cliente.bot_pausado && (!chat.cliente.bot_pausado_hasta || new Date(chat.cliente.bot_pausado_hasta) > new Date());

    // Filtro tipo (Atencion vs Todos vs Tag)
    if (filterType === 'atencion' && !isBotPaused) return false;
    if (filterType.startsWith('tag:')) {
      const tagLabel = filterType.replace('tag:', '');
      const hasTag = chat.tags.some(t => t.etiqueta === tagLabel);
      if (!hasTag) return false;
    }

    // Unread filter
    if (showUnreadOnly && chat.unread === 0) return false;

    // Buscador por nombre (ignorando telefono por privacidad en la vista, aunque se podría buscar internamente si se desea, pero preferimos por nombre solo)
    const normalizedName = (chat.cliente.nombre || 'Cliente').toLowerCase();
    if (searchTerm && !normalizedName.includes(searchTerm.toLowerCase())) return false;

    return true;
  });

  // Extract unique tags for dynamic tabs
  const uniqueTags = Array.from(
    new Set(chats.flatMap(c => c.tags.map(t => t.etiqueta)))
  ).map(label => {
    const t = chats.flatMap(c => c.tags).find(t => t.etiqueta === label);
    return { etiqueta: label, color: t?.color || '#6366f1' };
  });

  const handleUpdateCitaStatus = async (chat: ChatSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chat.ultimaCita || updatingCitaId === chat.ultimaCita.id) return;

    const estados = ['Pendiente', 'Completada', 'Cancelada', 'No-Show'];
    const idx = estados.indexOf(chat.ultimaCita.estado);
    const nextEstado = estados[(idx + 1) % estados.length];

    setUpdatingCitaId(chat.ultimaCita.id);
    try {
      await appointments.updateStatus(chat.ultimaCita.id, nextEstado);
      // Optimistic Update
      setChats(prev => prev.map(c =>
        c.cliente.id === chat.cliente.id
          ? { ...c, ultimaCita: { ...c.ultimaCita, estado: nextEstado } }
          : c
      ));
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingCitaId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111B21]">
      {/* HEADER — WhatsApp Sidebar Header */}
      <div className="px-3 py-3 bg-[#F0F2F5] dark:bg-[#202C33] shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-white/5">
        <div className="h-10 w-10 min-w-[40px] rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
          <Bot size={20} className="text-[#54656f] dark:text-[#AEBAC1]" />
        </div>
        <div className="flex items-center gap-5 text-[#54656f] dark:text-[#AEBAC1]">
          <MessageSquareDashed
            size={20}
            className="cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Nuevo Chat (Limpiar Filtros)"
            onClick={() => {
              setSearchTerm('');
              setFilterType('todos');
              setShowUnreadOnly(false);
              searchInputRef.current?.focus();
            }}
          />
          <Filter
            size={20}
            className={`cursor-pointer transition-colors ${showUnreadOnly ? 'text-[#00A884] scale-110' : 'hover:text-gray-900 dark:hover:text-white'}`}
            title="Ver no leídos"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          />
        </div>
      </div>

      {/* SEARCH BAR — WhatsApp style */}
      <div className="px-3 py-2 bg-white dark:bg-[#111B21] shrink-0 border-b border-gray-100/50 dark:border-white/5">
        <div className="relative flex items-center bg-[#F0F2F5] dark:bg-[#202C33] rounded-lg px-2 group">
          <Search size={16} className="text-[#8696A0] ml-1 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full bg-transparent border-none focus:ring-0 text-[14px] text-gray-900 dark:text-[#E9EDEF] placeholder-[#8696A0] py-1.5 pl-2"
            placeholder="Busca un chat o inicia uno nuevo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FOLDERS / TABS */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#111B21] shrink-0 overflow-x-auto hide-scrollbar border-b border-gray-100/50 dark:border-white/5">
        <button
          onClick={() => setFilterType('todos')}
          className={`px-3 py-1 text-[13px] font-medium rounded-full transition-all shrink-0 ${filterType === 'todos' ? 'bg-[#00A884] text-white' : 'bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656f] dark:text-[#8696A0] hover:bg-gray-200 dark:hover:bg-white/10'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterType('atencion')}
          className={`px-3 py-1 text-[13px] font-medium rounded-full transition-all flex items-center gap-1.5 shrink-0 ${filterType === 'atencion' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656f] dark:text-[#8696A0] hover:bg-gray-200 dark:hover:bg-white/10'}`}
        >
          <Clock size={13} /> Atención
        </button>

        {/* Dynamic Tag Folders */}
        {uniqueTags.map(tag => {
          const isSelected = filterType === `tag:${tag.etiqueta}`;
          return (
            <button
              key={tag.etiqueta}
              onClick={() => setFilterType(isSelected ? 'todos' : `tag:${tag.etiqueta}`)}
              className={`px-3 py-1 text-[13px] font-medium rounded-full transition-all flex items-center gap-1.5 shrink-0`}
              style={isSelected ? { backgroundColor: tag.color, color: 'white' } : { backgroundColor: '#F0F2F5', color: '#54656f' }}
            >
              <Tag size={12} style={isSelected ? { color: 'white' } : { color: tag.color }} /> {tag.etiqueta}
            </button>
          );
        })}
      </div>

      {/* CHATS LIST */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111B21] pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] lg:pb-0">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-[#8696A0] px-4">
            <Search size={32} className="mb-2 opacity-20 shadow-sm" />
            <p className="text-sm">Sin chats que coincidan con la búsqueda.</p>
          </div>
        ) : (
          <>
            {filteredChats.map((chat) => {
              const isActive = activeChat?.id === chat.cliente.id;
              const isBotPaused = chat.cliente.bot_pausado && (!chat.cliente.bot_pausado_hasta || new Date(chat.cliente.bot_pausado_hasta) > new Date());
              const displayName = chat.cliente.nombre || 'Cliente';
              const initials = displayName.charAt(0).toUpperCase();
              const gradient = getAvatarGradient(displayName);
              const isOutgoing = chat.ultimoMensaje.direccion === 'saliente';

              // Format time
              const lastMsgDate = new Date(chat.ultimoMensaje.created_at);
              const timeStr = formatDistanceToNow(lastMsgDate, { addSuffix: false, locale: es })
                .replace('alrededor de ', '')
                .replace('hace ', '')
                .replace('minutos', 'min')
                .replace('minuto', 'min')
                .replace('horas', 'h')
                .replace('hora', 'h')
                .replace('días', 'd')
                .replace('día', 'd');

              return (
                <div
                  key={chat.cliente.id}
                  onClick={() => setActiveChat(chat.cliente)}
                  className={`flex items-center gap-3 px-3 cursor-pointer transition-colors relative ${isActive ? 'bg-[#F0F2F5] dark:bg-[#2A3942]' : 'bg-white dark:bg-[#111B21] hover:bg-[#F5F6F6] dark:hover:bg-[#202C33]'}`}
                >
                  {/* Avatar with Status Badge */}
                  <div className="relative py-3">
                    <div className={`h-12 w-12 min-w-[48px] rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                      {initials}
                    </div>
                    {/* Status indicator badge (WhatsApp style dot) */}
                    <div className={`absolute bottom-3 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#111B21] ${isBotPaused ? 'bg-amber-400' : 'bg-[#00A884]'}`} title={isBotPaused ? 'Intervención Humana' : 'IA Activa'}></div>
                  </div>

                  {/* Info and Preview */}
                  <div className={`flex-1 min-w-0 h-full py-3 flex flex-col justify-center gap-1 border-b border-gray-100 dark:border-white/5 ${isActive ? 'border-transparent' : ''}`}>
                    <div className="flex justify-between items-center pr-2">
                      <h3 className="text-[16px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate leading-tight flex items-center gap-2">
                        {displayName}
                        {/* Render Tags next to the name */}
                        {chat.tags && chat.tags.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            {chat.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag.id}
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold text-white shadow-sm"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.etiqueta}
                              </span>
                            ))}
                            {chat.tags.length > 2 && (
                              <span className="text-[9px] text-gray-500 font-bold">+{chat.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </h3>
                      <span className={`text-[12px] whitespace-nowrap ml-2 ${isActive ? 'text-[#00A884] dark:text-[#00A884] font-medium' : 'text-[#667781] dark:text-[#8696A0]'}`}>
                        {timeStr}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {isOutgoing && <CheckCheck size={16} className="text-[#53bdeb] shrink-0" />}
                        <p className="text-[14px] text-[#667781] dark:text-[#8696A0] truncate leading-tight">
                          {chat.ultimoMensaje.tipo_mensaje === 'nota_interna' ? '📝 ' : ''}
                          {chat.ultimoMensaje.contenido || (chat.ultimoMensaje.tipo === 'media' ? '📷 Imagen' : 'Archivo')}
                        </p>
                      </div>

                      {/* Unread / Badges */}
                      <div className="flex items-center gap-1 shrink-0">
                        {chat.unread > 0 && (
                          <div className="bg-[#00A884] text-white text-[11px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm">
                            {chat.unread}
                          </div>
                        )}

                        {/* Appointment badge if any */}
                        {chat.ultimaCita && (
                          <div
                            onClick={(e) => handleUpdateCitaStatus(chat, e)}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all active:scale-90 shadow-sm ${chat.ultimaCita.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                chat.ultimaCita.estado === 'Completada' ? 'bg-[#00A884]/10 text-[#00A884]' : 'bg-gray-100 text-gray-400'
                              }`}
                          >
                            <CalendarDays size={10} className="inline mr-1" />
                            {chat.ultimaCita.estado.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;
