import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClienteOpciones, Mensaje } from './InboxView';
import { Bot, Clock, CheckCheck, MessageSquareDashed, Search, Filter, CalendarDays, ChevronDown } from 'lucide-react';
import { appointments } from '../../services/api';

interface ChatListProps {
  businessId: string;
  activeChat: ClienteOpciones | null;
  setActiveChat: (chat: ClienteOpciones) => void;
}

interface ChatSummary {
  cliente: ClienteOpciones;
  ultimoMensaje: Mensaje;
  unread: number;
  ultimaCita?: any;
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
  const [filterType, setFilterType] = useState<'todos' | 'atencion'>('todos');
  const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('mensajes')
        .select(`
          *,
          Clientes (
            id,
            nombre,
            telefono,
            bot_pausado,
            bot_pausado_hasta
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!data) return;

      const grouped = new Map<string, ChatSummary>();
      data.forEach((msg: any) => {
        const clienteData = msg.Clientes;
        if (!clienteData) return;
        if (!grouped.has(msg.cliente_id)) {
          grouped.set(msg.cliente_id, {
            cliente: clienteData as ClienteOpciones,
            ultimoMensaje: msg as Mensaje,
            unread: 0
          });
        }
      });

      const chatsArray = Array.from(grouped.values());

      // Fetch latest appointment for all these clients (to show status on chat card)
      const clientIds = chatsArray.map(c => c.cliente.id).filter(Boolean);
      if (clientIds.length > 0) {
        // Obtenemos solo citas futuras o recientes para estado activo
        const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const { data: citasData, error: citasError } = await supabase
          .from('citas')
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

      setChats(chatsArray);
    } catch (err) {
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    // Silent polling fallback (15s)
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('mensajes')
          .select(`*, Clientes (id, nombre, telefono, bot_pausado, bot_pausado_hasta)`)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(200);

        if (!error && data) {
          const grouped = new Map<string, ChatSummary>();
          data.forEach((msg: any) => {
            const clienteData = msg.Clientes;
            if (!clienteData) return;
            if (!grouped.has(msg.cliente_id)) {
              grouped.set(msg.cliente_id, { cliente: clienteData as ClienteOpciones, ultimoMensaje: msg as Mensaje, unread: 0 });
            }
          });
          const newChats = Array.from(grouped.values());
          
          // Re-fetch citas for the top updated chats to maintain reactive UI (simple approach: use existing if not changed)
          setChats(prev => {
            const merged = newChats.map(newChat => {
              const prevChat = prev.find(p => p.cliente.id === newChat.cliente.id);
              return { ...newChat, ultimaCita: prevChat?.ultimaCita };
            });
            if (prev.length !== merged.length) return merged;
            if (prev.length > 0 && merged.length > 0 && prev[0].ultimoMensaje.id !== merged[0].ultimoMensaje.id) return merged;
            return prev;
          });
        }
      } catch (_) { /* silent */ }
    }, 15000);

    // Realtime subscription
    const channel = supabase
      .channel(`chat_list_changes_${businessId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `business_id=eq.${businessId}` },
        () => fetchChats()
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  if (loading) {
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
    
    // Filtro tipo (Atencion vs Todos)
    if (filterType === 'atencion' && !isBotPaused) return false;

    // Buscador por nombre (ignorando telefono por privacidad en la vista, aunque se podría buscar internamente si se desea, pero preferimos por nombre solo)
    const normalizedName = (chat.cliente.nombre || 'Cliente').toLowerCase();
    if (searchTerm && !normalizedName.includes(searchTerm.toLowerCase())) return false;

    return true;
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
    <div className="flex flex-col h-full bg-white dark:bg-[#1A1825]">
      
      {/* SECCIÓN SEARCH Y FILTROS */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2A2640] shrink-0 sticky top-0 z-10 bg-white dark:bg-[#1A1825]">
        <div className="flex items-center gap-2 mb-3">
          <button 
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all ${filterType === 'todos' ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('atencion')}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-all flex items-center gap-1.5 ${filterType === 'atencion' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}
          >
            <Clock size={12} />
            Atención
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-gray-50 dark:bg-[#13111C] border border-gray-200 dark:border-[#2A2640] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
            placeholder="Buscar cliente por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="flex flex-col py-2">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-6 text-center mt-4">
              <div className="h-14 w-14 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-3">
                <Search className="h-7 w-7 text-violet-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin resultados</p>
              <p className="text-xs text-gray-400 mt-1">Intenta con otra búsqueda o filtro</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = activeChat?.id === chat.cliente.id;
              const isBotPaused = chat.cliente.bot_pausado &&
                (!chat.cliente.bot_pausado_hasta || new Date(chat.cliente.bot_pausado_hasta) > new Date());
              const displayName = chat.cliente.nombre || 'Cliente Oculto'; // Privacy: hide phone
              const initials = displayName.charAt(0).toUpperCase();
              const gradient = getAvatarGradient(displayName);
              const timeAgo = formatDistanceToNow(new Date(chat.ultimoMensaje.created_at), { addSuffix: false, locale: es });
              const isOutgoing = chat.ultimoMensaje.direccion === 'saliente';

              const hasCita = !!chat.ultimaCita;
              const getBadgeColor = (estado: string) => {
                switch(estado) {
                  case 'Pendiente': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50';
                  case 'Completada': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50';
                  case 'Cancelada': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50';
                  case 'No-Show': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50';
                  default: return 'bg-violet-100 text-violet-700 border border-violet-200';
                }
              };

        return (
          <button
            key={chat.cliente.id}
            onClick={() => setActiveChat(chat.cliente)}
            className={`
              relative flex items-center gap-3 px-4 py-3.5 mx-2 my-0.5 rounded-2xl
              transition-all duration-200 text-left
              active:scale-[0.98] tap-highlight-transparent
              ${isActive
                ? 'bg-violet-50 dark:bg-violet-900/20 shadow-sm'
                : 'hover:bg-gray-50 dark:hover:bg-white/5'
              }
            `}
          >
            {/* Active Indicator */}
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-violet-500" />
            )}

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {initials}
              </div>
              {/* Bot status badge */}
              <div
                className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white dark:border-[#1A1825] flex items-center justify-center
                  ${isBotPaused ? 'bg-amber-400' : 'bg-emerald-400'}`}
              >
                {isBotPaused
                  ? <Clock size={8} className="text-white" />
                  : <Bot size={8} className="text-white" />
                }
              </div>
            </div>

            {/* Chat info */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <h3 className={`text-sm font-semibold truncate flex-[0.7] ${isActive ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
                  {displayName}
                </h3>
                <div className="flex items-center gap-1.5 flex-[0.3] justify-end shrink-0 min-w-0">
                  {hasCita && (
                    <button 
                      onClick={(e) => handleUpdateCitaStatus(chat, e)}
                      disabled={updatingCitaId === chat.ultimaCita.id}
                      className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 truncate transition-all hover:brightness-95 active:scale-95 ${getBadgeColor(chat.ultimaCita.estado)} ${updatingCitaId === chat.ultimaCita.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <CalendarDays size={9} />
                      <span className="truncate">{updatingCitaId === chat.ultimaCita.id ? '...' : chat.ultimaCita.estado}</span>
                    </button>
                  )}
                  <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-1">{timeAgo}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isOutgoing && <CheckCheck size={13} className="text-violet-500 shrink-0" />}
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-relaxed">
                  {chat.ultimoMensaje.tipo_mensaje === 'nota_interna'
                    ? '📝 Nota interna'
                    : chat.ultimoMensaje.tipo === 'image' || chat.ultimoMensaje.tipo === 'imagen'
                      ? '📷 Imagen'
                      : chat.ultimoMensaje.contenido || '📎 Multimedia'}
                </p>
              </div>
            </div>

            {/* Bot status badge right */}
            <div className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isBotPaused
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {isBotPaused ? 'Humano' : 'IA'}
            </div>
          </button>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
