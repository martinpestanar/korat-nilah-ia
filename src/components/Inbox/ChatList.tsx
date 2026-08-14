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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const listContainerRef = React.useRef<HTMLDivElement>(null);
  
  // Track seen client IDs to avoid duplicate chat entries across pages
  const seenClientIdsRef = React.useRef<Set<string>>(new Set());
  const fetchedMsgOffsetRef = React.useRef<number>(0);

  const fetchChats = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true);
        fetchedMsgOffsetRef.current = 0;
        seenClientIdsRef.current.clear();
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      // Traer mensajes recientes uniendo con Clientes (en lotes de 60 mensajes para extraer ~15-20 chats únicos)
      const BATCH_MSG_LIMIT = 60;
      const { data: msgsData, error: msgsError } = await supabase
        .from('mensajes')
        .select('id, cliente_id, business_id, contenido, tipo, tipo_mensaje, direccion, estado, created_at, campana_origen, url_archivo, Clientes!inner(id, nombre, telefono, bot_pausado, bot_pausado_hasta, puntos_acumulados, nivel_riesgo)')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .range(fetchedMsgOffsetRef.current, fetchedMsgOffsetRef.current + BATCH_MSG_LIMIT - 1);

      if (msgsError) throw msgsError;

      if (!msgsData || msgsData.length === 0) {
        setHasMore(false);
        if (isInitial) setChats([]);
        return;
      }

      fetchedMsgOffsetRef.current += msgsData.length;
      if (msgsData.length < BATCH_MSG_LIMIT) {
        setHasMore(false);
      }

      // Filtrar y agrupar por cliente manteniendo el mensaje más reciente
      const clientChatMap = new Map<string, ChatSummary>();

      msgsData.forEach((msg: any) => {
        const clientIdStr = String(msg.cliente_id);
        if (msg.Clientes) {
          const isUnread = msg.direccion === 'entrante'
            && msg.estado !== 'leido'
            && clientIdStr !== String(activeChat?.id);

          const summaryCandidate: ChatSummary = {
            cliente: msg.Clientes as ClienteOpciones,
            ultimoMensaje: {
              id: msg.id,
              business_id: msg.business_id,
              cliente_id: msg.cliente_id,
              contenido: msg.contenido,
              tipo: msg.tipo,
              tipo_mensaje: msg.tipo_mensaje,
              direccion: msg.direccion,
              created_at: msg.created_at,
              campana_origen: msg.campana_origen,
              url_archivo: msg.url_archivo,
            },
            unread: isUnread ? 1 : 0,
            tags: [],
          };

          if (!clientChatMap.has(clientIdStr) && !seenClientIdsRef.current.has(clientIdStr)) {
            clientChatMap.set(clientIdStr, summaryCandidate);
          }
        }
      });

      const newChatsArray: ChatSummary[] = Array.from(clientChatMap.values());
      const newClientIds: (string | number)[] = [];

      newChatsArray.forEach(chat => {
        const cidStr = String(chat.cliente.id);
        seenClientIdsRef.current.add(cidStr);
        newClientIds.push(chat.cliente.id);
      });

      // Si no sacamos clientes nuevos en este lote pero hay más mensajes en BD, pedir el siguiente lote
      if (newChatsArray.length === 0 && msgsData.length === BATCH_MSG_LIMIT) {
        fetchChats(false);
        return;
      }

      // Obtener tags para los nuevos clientes
      if (newClientIds.length > 0) {
        const { data: tagsData } = await supabase
          .from('chat_tags')
          .select('*')
          .eq('business_id', businessId)
          .in('cliente_id', newClientIds);

        if (tagsData && tagsData.length > 0) {
          const tagsMap = new Map<string, Tag[]>();
          tagsData.forEach(t => {
            const cid = String(t.cliente_id);
            const arr = tagsMap.get(cid) || [];
            arr.push(t);
            tagsMap.set(cid, arr);
          });
          newChatsArray.forEach(chat => {
            chat.tags = tagsMap.get(String(chat.cliente.id)) || [];
          });
        }
      }

      if (isInitial) {
        newChatsArray.sort((a, b) => new Date(b.ultimoMensaje.created_at).getTime() - new Date(a.ultimoMensaje.created_at).getTime());
        setChats(newChatsArray);
      } else {
        setChats(prev => {
          const map = new Map<string, ChatSummary>();
          [...prev, ...newChatsArray].forEach(c => {
            const cid = String(c.cliente.id);
            if (!map.has(cid) || new Date(c.ultimoMensaje.created_at) > new Date(map.get(cid)!.ultimoMensaje.created_at)) {
              map.set(cid, c);
            }
          });
          const merged = Array.from(map.values());
          return merged.sort((a, b) => new Date(b.ultimoMensaje.created_at).getTime() - new Date(a.ultimoMensaje.created_at).getTime());
        });
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchChats(true);

    // Silent polling fallback (20s)
    const pollInterval = setInterval(() => {
      // Polling ligero solo de los 10 mensajes más recientes para actualizar la parte superior
      const pollTop = async () => {
        try {
          const { data } = await supabase
            .from('mensajes')
            .select('id, cliente_id, business_id, contenido, tipo, tipo_mensaje, direccion, estado, created_at, Clientes!inner(id, nombre, telefono, bot_pausado, bot_pausado_hasta, puntos_acumulados, nivel_riesgo)')
            .eq('business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(10);
          
          if (data && data.length > 0) {
            setChats(prev => {
              const updated = [...prev];
              let changed = false;

              data.forEach((msg: any) => {
                const clientIdStr = String(msg.cliente_id);
                const idx = updated.findIndex(c => String(c.cliente.id) === clientIdStr);
                const isUnread = msg.direccion === 'entrante' && msg.estado !== 'leido' && clientIdStr !== String(activeChat?.id);

                const freshSummary: ChatSummary = {
                  cliente: msg.Clientes as ClienteOpciones,
                  ultimoMensaje: msg,
                  unread: isUnread ? 1 : 0,
                  tags: idx >= 0 ? updated[idx].tags : [],
                };

                if (idx >= 0) {
                  if (updated[idx].ultimoMensaje.id !== msg.id) {
                    updated[idx] = freshSummary;
                    changed = true;
                  }
                } else {
                  updated.push(freshSummary);
                  seenClientIdsRef.current.add(clientIdStr);
                  changed = true;
                }
              });

              if (changed) {
                updated.sort((a, b) => new Date(b.ultimoMensaje.created_at).getTime() - new Date(a.ultimoMensaje.created_at).getTime());
              }

              return changed ? updated : prev;
            });
          }
        } catch (e) {}
      };
      pollTop();
    }, 20000);

    // Realtime subscription
    const channel = supabase
      .channel(`chat_list_changes_${businessId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes', filter: `business_id=eq.${businessId}` },
        () => {
          // Al recibir nuevo mensaje por realtime, actualizar la lista sin duplicar refs
          fetchedMsgOffsetRef.current = 0;
          seenClientIdsRef.current.clear();
          fetchChats(true);
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_tags', filter: `business_id=eq.${businessId}` },
        () => {
          fetchedMsgOffsetRef.current = 0;
          seenClientIdsRef.current.clear();
          fetchChats(true);
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      setTimeout(async () => {
        try {
          if (channel) {
            await supabase.removeChannel(channel);
          }
        } catch (err) {}
      }, 100);
    };
  }, [businessId]);

  // Manejador de scroll para Infinite Scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 150 && hasMore && !loadingMore && !loading) {
      fetchChats(false);
    }
  };

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
      <div 
        ref={listContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white dark:bg-[#111B21] pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] lg:pb-0"
      >
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

            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;
