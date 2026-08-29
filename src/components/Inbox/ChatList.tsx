import React, { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../services/supabase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ClienteOpciones, Mensaje } from "./InboxView";
import { Bot, Clock, CheckCheck, MessageSquareDashed, Search, Filter, CalendarDays, Tag } from "lucide-react";
import { appointments } from "../../services/api";

interface ChatListProps {
  businessId: string;
  activeChat: ClienteOpciones | null;
  setActiveChat: (chat: ClienteOpciones) => void;
}

interface TagItem {
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
  tags: TagItem[];
}

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-500",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-green-600",
];

const getAvatarGradient = (name: string) => {
  const idx = (name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
};

// Deduplication by real DB client_id. Always keeps the entry with the most recent message.
function deduplicateByClientId(chats: ChatSummary[]): ChatSummary[] {
  const map = new Map<string, ChatSummary>();
  for (const chat of chats) {
    const key = String(chat.cliente.id);
    const existing = map.get(key);
    if (!existing || new Date(chat.ultimoMensaje.created_at) > new Date(existing.ultimoMensaje.created_at)) {
      map.set(key, chat);
    }
  }
  return Array.from(map.values());
}

function sortByLatest(chats: ChatSummary[]): ChatSummary[] {
  return [...chats].sort(
    (a, b) => new Date(b.ultimoMensaje.created_at).getTime() - new Date(a.ultimoMensaje.created_at).getTime()
  );
}

const PAGE_SIZE = 20;

const ChatList: React.FC<ChatListProps> = ({ businessId, activeChat, setActiveChat }) => {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [updatingCitaId, setUpdatingCitaId] = useState<number | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchChats = useCallback(async (isInitial: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (isInitial) {
        setLoading(true);
        cursorRef.current = null;
      } else {
        setLoadingMore(true);
      }

      const BATCH = PAGE_SIZE * 8;
      let query = supabase
        .from("mensajes")
        .select("id, cliente_id, business_id, contenido, tipo, tipo_mensaje, direccion, estado, created_at, campana_origen, url_archivo, Clientes!inner(id, nombre, telefono, bot_pausado, bot_pausado_hasta, puntos_acumulados, nivel_riesgo)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(BATCH);

      if (!isInitial && cursorRef.current) {
        query = query.lt("created_at", cursorRef.current);
      }

      const { data: msgsData, error } = await query;
      if (error) throw error;

      if (!msgsData || msgsData.length === 0) {
        setHasMore(false);
        if (isInitial) setChats([]);
        return;
      }

      // Group by client_id — first message per client is the most recent (DESC order)
      const seenIds = new Set<string>();
      const newChatsRaw: ChatSummary[] = [];

      for (const msg of msgsData) {
        if (!msg.Clientes) continue;
        const cid = String(msg.cliente_id);
        if (seenIds.has(cid)) continue;
        seenIds.add(cid);

        const isUnread =
          msg.direccion === "entrante" &&
          msg.estado !== "leido" &&
          cid !== String(activeChat?.id);

        newChatsRaw.push({
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
        });

        if (newChatsRaw.length >= PAGE_SIZE) break;
      }

      if (msgsData.length > 0) {
        cursorRef.current = msgsData[msgsData.length - 1].created_at;
      }
      if (msgsData.length < BATCH) {
        setHasMore(false);
      }

      // Load tags
      const clientIds = newChatsRaw.map(c => c.cliente.id);
      if (clientIds.length > 0) {
        const { data: tagsData } = await supabase
          .from("chat_tags")
          .select("*")
          .eq("business_id", businessId)
          .in("cliente_id", clientIds);

        if (tagsData && tagsData.length > 0) {
          const tagsMap = new Map<string, TagItem[]>();
          tagsData.forEach((t: any) => {
            const cid = String(t.cliente_id);
            tagsMap.set(cid, [...(tagsMap.get(cid) || []), t]);
          });
          newChatsRaw.forEach(chat => {
            chat.tags = tagsMap.get(String(chat.cliente.id)) || [];
          });
        }
      }

      if (isInitial) {
        setChats(sortByLatest(newChatsRaw));
      } else {
        setChats(prev => {
          const merged = deduplicateByClientId([...prev, ...newChatsRaw]);
          return sortByLatest(merged);
        });
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [businessId, activeChat?.id]);

  useEffect(() => {
    fetchChats(true);

    const pollInterval = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("mensajes")
          .select("id, cliente_id, business_id, contenido, tipo, tipo_mensaje, direccion, estado, created_at, campana_origen, url_archivo, Clientes!inner(id, nombre, telefono, bot_pausado, bot_pausado_hasta, puntos_acumulados, nivel_riesgo)")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })
          .limit(30);

        if (!data || data.length === 0) return;

        const pollMap = new Map<string, any>();
        for (const msg of data) {
          if (!msg.Clientes) continue;
          const cid = String(msg.cliente_id);
          if (!pollMap.has(cid)) pollMap.set(cid, msg);
        }

        setChats(prev => {
          let changed = false;
          const updated = [...prev];

          pollMap.forEach((msg, cid) => {
            const idx = updated.findIndex(c => String(c.cliente.id) === cid);
            const isUnread =
              msg.direccion === "entrante" &&
              msg.estado !== "leido" &&
              cid !== String(activeChat?.id);

            const freshSummary: ChatSummary = {
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
              tags: idx >= 0 ? updated[idx].tags : [],
            };

            if (idx >= 0) {
              if (msg.id !== updated[idx].ultimoMensaje.id) {
                updated[idx] = freshSummary;
                changed = true;
              }
            } else {
              updated.push(freshSummary);
              changed = true;
            }
          });

          if (!changed) return prev;
          return sortByLatest(deduplicateByClientId(updated));
        });
      } catch (_) {}
    }, 15000);

    const channel = supabase
      .channel(`chat_list_${businessId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mensajes", filter: `business_id=eq.${businessId}` },
        async (payload: any) => {
          try {
            const msgId = payload.new?.id;
            if (!msgId) return;
            const { data: msgFull } = await supabase
              .from("mensajes")
              .select("id, cliente_id, business_id, contenido, tipo, tipo_mensaje, direccion, estado, created_at, campana_origen, url_archivo, Clientes!inner(id, nombre, telefono, bot_pausado, bot_pausado_hasta, puntos_acumulados, nivel_riesgo)")
              .eq("id", msgId)
              .maybeSingle();

            if (!msgFull || !msgFull.Clientes) return;

            const cid = String(msgFull.cliente_id);
            const isUnread =
              msgFull.direccion === "entrante" &&
              msgFull.estado !== "leido" &&
              cid !== String(activeChat?.id);

            const freshSummary: ChatSummary = {
              cliente: msgFull.Clientes as ClienteOpciones,
              ultimoMensaje: {
                id: msgFull.id,
                business_id: msgFull.business_id,
                cliente_id: msgFull.cliente_id,
                contenido: msgFull.contenido,
                tipo: msgFull.tipo,
                tipo_mensaje: msgFull.tipo_mensaje,
                direccion: msgFull.direccion,
                created_at: msgFull.created_at,
                campana_origen: msgFull.campana_origen,
                url_archivo: msgFull.url_archivo,
              },
              unread: isUnread ? 1 : 0,
              tags: [],
            };

            setChats(prev => {
              const idx = prev.findIndex(c => String(c.cliente.id) === cid);
              let updated: ChatSummary[];
              if (idx >= 0) {
                const existingDate = new Date(prev[idx].ultimoMensaje.created_at).getTime();
                const newDate = new Date(msgFull.created_at).getTime();
                if (newDate <= existingDate && prev[idx].ultimoMensaje.id === msgFull.id) return prev;
                updated = [...prev];
                updated[idx] = { ...freshSummary, tags: prev[idx].tags };
              } else {
                updated = [...prev, freshSummary];
              }
              return sortByLatest(deduplicateByClientId(updated));
            });
          } catch (_) {}
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_tags", filter: `business_id=eq.${businessId}` },
        () => fetchChats(true)
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      setTimeout(() => {
        supabase.removeChannel(channel).catch(() => {});
      }, 100);
    };
  }, [businessId, fetchChats]);

  useEffect(() => {
    if (!activeChat) return;
    setChats(prev =>
      prev.map(c => (String(c.cliente.id) === String(activeChat.id) ? { ...c, unread: 0 } : c))
    );
  }, [activeChat?.id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore && !loading) {
      fetchChats(false);
    }
  };

  const handleUpdateCitaStatus = async (chat: ChatSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chat.ultimaCita || updatingCitaId === chat.ultimaCita.id) return;
    const estados = ["Pendiente", "Completada", "Cancelada", "No-Show"];
    const idx = estados.indexOf(chat.ultimaCita.estado);
    const nextEstado = estados[(idx + 1) % estados.length];
    setUpdatingCitaId(chat.ultimaCita.id);
    try {
      await appointments.updateStatus(chat.ultimaCita.id, nextEstado);
      setChats(prev =>
        prev.map(c =>
          c.cliente.id === chat.cliente.id
            ? { ...c, ultimaCita: { ...c.ultimaCita, estado: nextEstado } }
            : c
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingCitaId(null);
    }
  };

  if (loading && chats.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3, 4, 5].map(i => (
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

  const filteredChats = chats.filter(chat => {
    const isBotPaused =
      chat.cliente.bot_pausado &&
      (!chat.cliente.bot_pausado_hasta || new Date(chat.cliente.bot_pausado_hasta) > new Date());
    if (filterType === "atencion" && !isBotPaused) return false;
    if (filterType.startsWith("tag:")) {
      const tagLabel = filterType.replace("tag:", "");
      if (!chat.tags.some(t => t.etiqueta === tagLabel)) return false;
    }
    if (showUnreadOnly && chat.unread === 0) return false;
    const normalizedName = (chat.cliente.nombre || "Cliente").toLowerCase();
    if (searchTerm && !normalizedName.includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const uniqueTags = Array.from(new Set(chats.flatMap(c => c.tags.map(t => t.etiqueta)))).map(label => {
    const t = chats.flatMap(c => c.tags).find(t => t.etiqueta === label);
    return { etiqueta: label, color: t?.color || "#6366f1" };
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111B21]">
      {/* Barra de búsqueda con filtros integrados */}
      <div className="px-3 py-2.5 bg-white dark:bg-[#111B21] shrink-0 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
        <div className="relative flex-1 flex items-center bg-[#F0F2F5] dark:bg-[#202C33] rounded-xl px-3 min-h-[42px] group">
          <Search size={17} className="text-[#8696A0] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            className="w-full bg-transparent border-none focus:ring-0 text-[14px] text-gray-900 dark:text-[#E9EDEF] placeholder-[#8696A0] py-2 pl-2 outline-none"
            placeholder="Busca un chat o inicia uno nuevo"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                searchInputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Borrar búsqueda"
              aria-label="Borrar búsqueda"
            >
              <MessageSquareDashed size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 shrink-0 ${
            showUnreadOnly
              ? "bg-[#00A884] text-white shadow-sm"
              : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
          title={showUnreadOnly ? "Mostrando solo no leídos" : "Ver no leídos"}
          aria-label="Filtrar mensajes no leídos"
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Píldoras de filtro */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#111B21] shrink-0 overflow-x-auto hide-scrollbar scrollbar-hide border-b border-gray-100/50 dark:border-white/5 min-h-[44px]">
        <button
          onClick={() => {
            setFilterType("todos");
            setShowUnreadOnly(false);
          }}
          className={`px-3 py-1.5 text-[12px] font-bold rounded-full transition-all shrink-0 active:scale-95 flex items-center justify-center ${
            filterType === "todos" && !showUnreadOnly
              ? "bg-[#00A884] text-white shadow-sm"
              : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656f] dark:text-[#8696A0] hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterType(filterType === "atencion" ? "todos" : "atencion")}
          className={`px-3 py-1.5 text-[12px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
            filterType === "atencion"
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-[#F0F2F5] dark:bg-[#202C33] text-[#54656f] dark:text-[#8696A0] hover:bg-gray-200 dark:hover:bg-white/10"
          }`}
        >
          <Clock size={13} /> Atención
        </button>
        {uniqueTags.map(tag => {
          const isSelected = filterType === `tag:${tag.etiqueta}`;
          return (
            <button
              key={tag.etiqueta}
              onClick={() => setFilterType(isSelected ? "todos" : `tag:${tag.etiqueta}`)}
              className="px-3 py-1.5 text-[12px] font-bold rounded-full transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              style={
                isSelected
                  ? { backgroundColor: tag.color, color: "white" }
                  : { backgroundColor: "#F0F2F5", color: "#54656f" }
              }
            >
              <Tag size={12} style={isSelected ? { color: "white" } : { color: tag.color }} /> {tag.etiqueta}
            </button>
          );
        })}
      </div>

      <div
        ref={listContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-white dark:bg-[#111B21] pb-36 sm:pb-6"
      >
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-[#8696A0] px-4">
            <Search size={32} className="mb-2 opacity-20 shadow-sm" />
            <p className="text-sm">Sin chats que coincidan con la busqueda.</p>
          </div>
        ) : (
          <>
            {filteredChats.map(chat => {
              const isActive = String(activeChat?.id) === String(chat.cliente.id);
              const isBotPaused =
                chat.cliente.bot_pausado &&
                (!chat.cliente.bot_pausado_hasta || new Date(chat.cliente.bot_pausado_hasta) > new Date());
              const displayName = chat.cliente.nombre || "Cliente";
              const initials = displayName.charAt(0).toUpperCase();
              const gradient = getAvatarGradient(displayName);
              const isOutgoing = chat.ultimoMensaje.direccion === "saliente";
              const lastMsgDate = new Date(chat.ultimoMensaje.created_at);
              const timeStr = formatDistanceToNow(lastMsgDate, { addSuffix: false, locale: es })
                .replace("alrededor de ", "")
                .replace("hace ", "")
                .replace("minutos", "min")
                .replace("minuto", "min")
                .replace("horas", "h")
                .replace("hora", "h")
                .replace("dias", "d")
                .replace("dia", "d");

              const previewText =
                chat.ultimoMensaje.tipo_mensaje === "nota_interna"
                  ? `Nota: ${chat.ultimoMensaje.contenido || "Nota interna"}`
                  : chat.ultimoMensaje.contenido ||
                    (chat.ultimoMensaje.tipo === "media" || chat.ultimoMensaje.tipo === "imagen" || chat.ultimoMensaje.tipo === "image"
                      ? "Imagen"
                      : chat.ultimoMensaje.tipo === "audio"
                      ? "Audio"
                      : "Archivo");

              return (
                <div
                  key={String(chat.cliente.id)}
                  onClick={() => setActiveChat(chat.cliente)}
                  className={`flex items-center gap-3 px-3 cursor-pointer transition-colors relative ${isActive ? "bg-[#F0F2F5] dark:bg-[#2A3942]" : "bg-white dark:bg-[#111B21] hover:bg-[#F5F6F6] dark:hover:bg-[#202C33]"}`}
                >
                  <div className="relative py-3">
                    <div className={`h-12 w-12 min-w-[48px] rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                      {initials}
                    </div>
                    <div
                      className={`absolute bottom-3 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#111B21] ${isBotPaused ? "bg-amber-400" : "bg-[#00A884]"}`}
                      title={isBotPaused ? "Intervencion Humana" : "IA Activa"}
                    />
                  </div>

                  <div className={`flex-1 min-w-0 h-full py-3 flex flex-col justify-center gap-1 border-b border-gray-100 dark:border-white/5 ${isActive ? "border-transparent" : ""}`}>
                    <div className="flex justify-between items-center pr-2">
                      <h3 className="text-[16px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate leading-tight flex items-center gap-2">
                        {displayName}
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
                      <span className={`text-[12px] whitespace-nowrap ml-2 ${isActive ? "text-[#00A884] font-medium" : "text-[#667781] dark:text-[#8696A0]"}`}>
                        {timeStr}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {isOutgoing && <CheckCheck size={16} className="text-[#53bdeb] shrink-0" />}
                        <p className="text-[14px] text-[#667781] dark:text-[#8696A0] truncate leading-tight">
                          {previewText}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {chat.unread > 0 && (
                          <div className="bg-[#00A884] text-white text-[11px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center shadow-sm">
                            {chat.unread}
                          </div>
                        )}
                        {chat.ultimaCita && (
                          <div
                            onClick={e => handleUpdateCitaStatus(chat, e)}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-all active:scale-90 shadow-sm ${
                              chat.ultimaCita.estado === "Pendiente"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                                : chat.ultimaCita.estado === "Completada"
                                ? "bg-[#00A884]/10 text-[#00A884]"
                                : "bg-gray-100 text-gray-400"
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

            {!hasMore && chats.length > 0 && (
              <div className="text-center py-4 text-xs text-[#8696A0]">
                Todos los chats cargados
              </div>
            )}

            {/* Espaciador de seguridad para el BottomNavBar móvil */}
            <div className="h-20 lg:hidden" aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatList;
