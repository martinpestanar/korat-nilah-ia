import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { format, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Bot,
  Send,
  PanelRightClose,
  PanelRightOpen,
  StickyNote,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Mic,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Check,
  Clock,
  MapPin,
  Calendar,
  Eraser,
  RotateCcw,
  Maximize2,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Zap,
  Copy,
  Reply,
  MoreVertical,
  Plus,
  Trash2,
  CornerDownLeft,
  Eye,
  Edit3,
  ExternalLink
} from 'lucide-react';
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

interface QuickBlock {
  id: string;
  label: string;
  content: string;
}

const STORAGE_BLOCKS_KEY = 'korat_inbox_blocks_v1';
const STORAGE_DRAFTS_KEY = 'korat_inbox_drafts_v1';

const DEFAULT_QUICK_BLOCKS: QuickBlock[] = [
  {
    id: 'saludo',
    label: 'Saludo cálido',
    content: '¡Hola! 😊 Qué gusto saludarte. ¿En qué podemos consentirte hoy? ✨'
  },
  {
    id: 'precios',
    label: 'Precios / Carta',
    content:
      'Aquí te comparto nuestros servicios y tarifas:\n\n• *Servicio 1:* S/ ...\n• *Servicio 2:* S/ ...\n\n¿Cuál te gustaría agendar? 💅'
  },
  {
    id: 'ubicacion',
    label: 'Ubicación',
    content:
      '📍 *Nuestra ubicación:*\nDirección del salón\n🕒 *Horario:* Lunes a Sábado\n\n¡Te esperamos!'
  },
  {
    id: 'pago',
    label: 'Datos de Pago',
    content:
      '💳 *Datos para tu reserva:*\n• *Yape / Plin:* ...\n• *Titular:* ...\n\nPor favor envíanos la captura del comprobante por aquí para confirmar tu cita ✅'
  },
  {
    id: 'cuidados',
    label: 'Cuidados post-cita',
    content:
      '✨ *Cuidados post-cita:*\n1. Evita mojar o exponer al vapor las primeras 24 horas.\n2. No frotes ni manipules la zona tratada.\n3. Cualquier consulta escríbenos por aquí 💖'
  }
];

const loadQuickBlocks = (): QuickBlock[] => {
  try {
    const raw = localStorage.getItem(STORAGE_BLOCKS_KEY);
    if (!raw) return DEFAULT_QUICK_BLOCKS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore storage errors
  }
  return DEFAULT_QUICK_BLOCKS;
};

const loadDrafts = (): Record<string, string> => {
  try {
    const raw = sessionStorage.getItem(STORAGE_DRAFTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // ignore storage errors
  }
  return {};
};

// Generate avatar gradient from name
const AVATAR_GRADIENTS = [
  'from-violet-400 to-purple-500',
  'from-pink-400 to-rose-400',
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-400'
];
const getGradient = (name: string) =>
  AVATAR_GRADIENTS[(name?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

const DOODLE_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='none' stroke='%239E8070' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.13'%3E%3Cg transform='translate(25,30) rotate(25)'%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Cline x1='4' y1='0' x2='22' y2='12'/%3E%3Ccircle cx='0' cy='8' r='4'/%3E%3Cline x1='4' y1='8' x2='22' y2='-4'/%3E%3C/g%3E%3Cpath d='M80,15 C80,15 77,9 72,9 C67,9 64,14 64,18 C64,28 80,37 80,37 C80,37 96,28 96,18 C96,14 93,9 88,9 C83,9 80,15 80,15Z'/%3E%3Cg transform='translate(200,40)'%3E%3Crect x='0' y='0' width='40' height='7' rx='2'/%3E%3Cline x1='5' y1='7' x2='5' y2='17'/%3E%3Cline x1='10' y1='7' x2='10' y2='20'/%3E%3Cline x1='15' y1='7' x2='15' y2='17'/%3E%3Cline x1='20' y1='7' x2='20' y2='20'/%3E%3Cline x1='25' y1='7' x2='25' y2='17'/%3E%3Cline x1='30' y1='7' x2='30' y2='20'/%3E%3Cline x1='35' y1='7' x2='35' y2='17'/%3E%3C/g%3E%3Cg transform='translate(140,110)'%3E%3Ccircle cx='0' cy='-12' r='7'/%3E%3Ccircle cx='11' cy='-6' r='7'/%3E%3Ccircle cx='11' cy='6' r='7'/%3E%3Ccircle cx='0' cy='12' r='7'/%3E%3Ccircle cx='-11' cy='6' r='7'/%3E%3Ccircle cx='-11' cy='-6' r='7'/%3E%3Ccircle cx='0' cy='0' r='5'/%3E%3C/g%3E%3Cpath d='M265,85 L268,76 L271,85 L280,85 L273,91 L276,100 L268,94 L261,100 L264,91 L257,85Z'/%3E%3Cg transform='translate(40,160) rotate(-10)'%3E%3Crect x='4' y='12' width='13' height='18' rx='1'/%3E%3Cpath d='M4,12 L10,2 L17,12Z'/%3E%3Crect x='1' y='28' width='19' height='7' rx='2'/%3E%3C/g%3E%3Cpath d='M235,155 Q255,135 250,150 Q245,165 230,160 Q215,155 220,140 Q225,125 245,125'/%3E%3Cpath d='M80,240 L83,231 L86,240 L95,240 L88,246 L91,255 L83,249 L76,255 L79,246 L72,240Z'/%3E%3Cpath d='M200,210 C200,210 197,204 192,204 C187,204 184,209 184,213 C184,223 200,232 200,232 C200,232 216,223 216,213 C216,209 213,204 208,204 C203,204 200,210 200,210Z'/%3E%3Cg transform='translate(248,242) rotate(-15)'%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Cline x1='4' y1='0' x2='20' y2='11'/%3E%3Ccircle cx='0' cy='8' r='4'/%3E%3Cline x1='4' y1='8' x2='20' y2='-3'/%3E%3C/g%3E%3Cpath d='M10,278 Q25,263 40,278 T70,278'/%3E%3Cpath d='M198,268 Q213,253 228,268 T258,268'/%3E%3Cpath d='M35,85 L38,76 L41,85 L50,85 L43,91 L46,100 L38,94 L31,100 L34,91 L27,85Z'/%3E%3Ccircle cx='128' cy='58' r='3' fill='%239E8070'/%3E%3Ccircle cx='28' cy='118' r='2' fill='%239E8070'/%3E%3Ccircle cx='268' cy='188' r='2.5' fill='%239E8070'/%3E%3Ccircle cx='143' cy='278' r='3' fill='%239E8070'/%3E%3Ccircle cx='175' cy='170' r='2' fill='%239E8070'/%3E%3C/svg%3E")`;

const parseSafeDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

const formatSafeTime = (d: Date | null): string => {
  if (!d) return '--:--';
  return format(d, 'HH:mm');
};

const formatDateHeader = (d: Date | null): string => {
  if (!d) return 'Fecha desconocida';
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return format(d, sameYear ? "d 'de' MMMM" : "d 'de' MMMM yyyy", { locale: es });
};

// Helper para ordenar mensajes cronológicamente y desempatar con cliente (entrante) primero + id
const sortMensajes = (msgs: Mensaje[]) => {
  return [...msgs].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime() || 0;
    const timeB = new Date(b.created_at).getTime() || 0;
    if (timeA !== timeB) return timeA - timeB;
    if (a.direccion === 'entrante' && b.direccion === 'saliente') return -1;
    if (a.direccion === 'saliente' && b.direccion === 'entrante') return 1;
    return String(a.id).localeCompare(String(b.id));
  });
};

// Safe React highlight helper (no dangerouslySetInnerHTML)
const highlightSearchText = (text: string, query?: string, keyPrefix = 'hl'): React.ReactNode => {
  const q = query?.trim();
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={`${keyPrefix}-${i}`}
        className="bg-yellow-300/90 dark:bg-yellow-500/40 text-inherit rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
};

// Safe inline WhatsApp markdown & URL renderer (no dangerouslySetInnerHTML)
const renderInlineWhatsApp = (
  line: string,
  searchQuery?: string,
  keyPrefix = 'ln'
): React.ReactNode[] => {
  // Match URLs, inline code, *bold*, _italic_, ~strike~
  const tokenRegex =
    /(https?:\/\/[^\s<>]+|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const nodes: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let tokenCounter = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      const plain = line.slice(lastIdx, match.index);
      nodes.push(
        <React.Fragment key={`${keyPrefix}-p-${tokenCounter++}`}>
          {highlightSearchText(plain, searchQuery, `${keyPrefix}-hp-${tokenCounter}`)}
        </React.Fragment>
      );
    }

    const token = match[0];
    const key = `${keyPrefix}-t-${tokenCounter++}`;

    if (token.startsWith('http://') || token.startsWith('https://')) {
      const cleanUrl = token.replace(/[.,!?;:)\]]+$/, '');
      const trailing = token.slice(cleanUrl.length);
      nodes.push(
        <React.Fragment key={key}>
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#027EB5] dark:text-[#53BDEB] underline decoration-1 underline-offset-2 hover:opacity-80 break-all"
          >
            {highlightSearchText(cleanUrl, searchQuery, `${key}-url`)}
          </a>
          {trailing && highlightSearchText(trailing, searchQuery, `${key}-tr`)}
        </React.Fragment>
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      const inner = token.slice(1, -1);
      nodes.push(
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-black/[0.07] dark:bg-white/[0.1] font-mono text-[0.88em]"
        >
          {highlightSearchText(inner, searchQuery, `${key}-cd`)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      const inner = token.slice(1, -1);
      nodes.push(
        <strong key={key} className="font-semibold">
          {highlightSearchText(inner, searchQuery, `${key}-b`)}
        </strong>
      );
    } else if (token.startsWith('_') && token.endsWith('_') && token.length > 2) {
      const inner = token.slice(1, -1);
      nodes.push(
        <em key={key} className="italic">
          {highlightSearchText(inner, searchQuery, `${key}-i`)}
        </em>
      );
    } else if (token.startsWith('~') && token.endsWith('~') && token.length > 2) {
      const inner = token.slice(1, -1);
      nodes.push(
        <del key={key} className="line-through opacity-80">
          {highlightSearchText(inner, searchQuery, `${key}-s`)}
        </del>
      );
    } else {
      nodes.push(
        <React.Fragment key={key}>
          {highlightSearchText(token, searchQuery, `${key}-raw`)}
        </React.Fragment>
      );
    }

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < line.length) {
    nodes.push(
      <React.Fragment key={`${keyPrefix}-end`}>
        {highlightSearchText(line.slice(lastIdx), searchQuery, `${keyPrefix}-he`)}
      </React.Fragment>
    );
  }

  return nodes;
};

const renderWhatsAppText = (text: string, searchQuery?: string): React.ReactNode => {
  if (!text) return null;
  // Split multiline ```code blocks``` first
  const codeBlockParts = text.split(/(```[\s\S]*?```)/g);

  return codeBlockParts.map((block, bIdx) => {
    if (block.startsWith('```') && block.endsWith('```') && block.length >= 6) {
      const inner = block.slice(3, -3).replace(/^\n+|\n+$/g, '');
      return (
        <pre
          key={`cb-${bIdx}`}
          className="my-1 px-2.5 py-1.5 rounded-lg bg-black/[0.06] dark:bg-white/[0.08] font-mono text-[0.85em] whitespace-pre-wrap break-words [overflow-wrap:anywhere] overflow-x-auto"
        >
          {highlightSearchText(inner, searchQuery, `cb-${bIdx}`)}
        </pre>
      );
    }

    const lines = block.split('\n');
    return (
      <React.Fragment key={`blk-${bIdx}`}>
        {lines.map((line, lIdx) => {
          const isQuote = line.startsWith('> ');
          const lineContent = isQuote ? line.slice(2) : line;
          const rendered = renderInlineWhatsApp(lineContent, searchQuery, `l-${bIdx}-${lIdx}`);

          if (isQuote) {
            return (
              <div
                key={`q-${bIdx}-${lIdx}`}
                className="my-0.5 pl-2.5 py-0.5 border-l-[3px] border-[#00A884] bg-black/[0.04] dark:bg-white/[0.06] rounded-r-md text-[0.92em] opacity-90"
              >
                {rendered.length > 0 ? rendered : '\u00A0'}
              </div>
            );
          }

          return (
            <React.Fragment key={`tx-${bIdx}-${lIdx}`}>
              {rendered}
              {lIdx < lines.length - 1 && '\n'}
            </React.Fragment>
          );
        })}
      </React.Fragment>
    );
  });
};

// Image thumbnail with error fallback to reference card
const MediaImagePreview: React.FC<{
  url: string;
  onZoom: (url: string) => void;
}> = ({ url, onZoom }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center gap-2.5 p-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 select-none">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <ImageIcon size={17} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
            Foto / Imagen
          </span>
          <span className="text-[11px] text-[#667781] dark:text-[#8696A0]">
            Ver imagen en WhatsApp
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onZoom(url);
      }}
      className="block relative overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 max-w-[260px] focus:outline-none group/img"
      aria-label="Ampliar imagen"
    >
      <img
        src={url}
        alt="Imagen adjunta"
        loading="lazy"
        onError={() => setFailed(true)}
        className="w-full max-w-[260px] max-h-[280px] object-cover rounded-xl transition-transform duration-200 group-hover/img:scale-[1.01]"
      />
    </button>
  );
};

// Audio player with fallback
const MediaAudioPreview: React.FC<{ url: string }> = ({ url }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center gap-2.5 p-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 select-none">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
          <Mic size={17} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[12.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
            Nota de voz
          </span>
          <span className="text-[11px] text-[#667781] dark:text-[#8696A0]">
            Escuchar en WhatsApp
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 py-1 min-w-[210px] max-w-[270px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-8 h-8 rounded-full bg-[#00A884]/15 flex items-center justify-center text-[#00A884] shrink-0">
        <Mic size={15} />
      </div>
      <audio
        controls
        preload="metadata"
        src={url}
        onError={() => setFailed(true)}
        className="w-full h-8 max-w-[225px]"
      />
    </div>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({
  businessId,
  activeChat,
  onToggleProfile,
  showProfile,
  onBack
}) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [clearedMessages, setClearedMessages] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [citaActiva, setCitaActiva] = useState<any>(null);
  const [verificandoPago, setVerificandoPago] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [showQuickBooking, setShowQuickBooking] = useState(false);

  // Composer & Block-writing UI states
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [showExpandedEditor, setShowExpandedEditor] = useState(false);
  const [showModalBlocks, setShowModalBlocks] = useState(false);
  const [expandedTab, setExpandedTab] = useState<'write' | 'preview'>('write');
  const [showBlocksPopover, setShowBlocksPopover] = useState(false);
  const [blockFilter, setBlockFilter] = useState('');
  const [slashTriggerRange, setSlashTriggerRange] = useState<{ start: number; end: number } | null>(
    null
  );
  const [quickBlocks, setQuickBlocks] = useState<QuickBlock[]>(loadQuickBlocks);
  const [editingBlock, setEditingBlock] = useState<QuickBlock | null>(null);
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [blockLabelDraft, setBlockLabelDraft] = useState('');
  const [blockContentDraft, setBlockContentDraft] = useState('');

  // Mobile Enter behavior (newline by default on coarse/mobile, send on desktop fine-pointer)
  const [enterSends, setEnterSends] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return !window.matchMedia('(max-width: 1023px), (pointer: coarse)').matches;
  });

  // In-chat Search & Header More Menu & Bubble Quick Actions
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Scroll & pagination states
  const [loadingMoreMsgs, setLoadingMoreMsgs] = useState(false);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messageNodeMapRef = useRef<Record<string, HTMLDivElement | null>>({});

  const isInitialMount = useRef(true);
  const prevScrollHeightRef = useRef<number>(0);
  const isFetchingOlderRef = useRef<boolean>(false);
  const isNearBottomRef = useRef<boolean>(true);
  const prevMsgCountRef = useRef<number>(0);
  const activeChatIdRef = useRef<string>(activeChat.id);
  const fetchReqIdRef = useRef<number>(0);
  const mensajesIdsRef = useRef<Set<string>>(new Set());
  const draftsRef = useRef<Record<string, string>>(loadDrafts());

  activeChatIdRef.current = activeChat.id;
  mensajesIdsRef.current = new Set(mensajes.map((m) => m.id));

  // Persist quick blocks locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BLOCKS_KEY, JSON.stringify(quickBlocks));
    } catch {
      // ignore storage errors
    }
  }, [quickBlocks]);

  // Update media query listener for Enter behavior when switching pointer/screen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 1023px), (pointer: coarse)');
    const onChange = () => setEnterSends(!mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Helper to persist draft for active chat
  const saveDraftForChat = useCallback((chatId: string, text: string) => {
    if (text) {
      draftsRef.current[chatId] = text;
    } else {
      delete draftsRef.current[chatId];
    }
    try {
      sessionStorage.setItem(STORAGE_DRAFTS_KEY, JSON.stringify(draftsRef.current));
    } catch {
      // ignore storage errors
    }
  }, []);

  // Exponer fetchCitaActiva para recargar el banner después de crear una cita rápida
  const fetchCitaActiva = async () => {
    const targetChatId = activeChat.id;
    try {
      const { data } = await supabase
        .from('Citas')
        .select('*')
        .eq('cliente_id', targetChatId)
        .eq('business_id', businessId)
        .gte('fecha', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (activeChatIdRef.current === targetChatId) {
        setCitaActiva(data || null);
      }
    } catch (e) {}
  };

  // Resetear estados y restaurar borrador al cambiar de chat
  useEffect(() => {
    isInitialMount.current = true;
    isFetchingOlderRef.current = false;
    isNearBottomRef.current = true;
    prevMsgCountRef.current = 0;
    setIsInternalNote(false);
    setClearedMessages(false);
    setCitaActiva(null);
    setSearchOpen(false);
    setSearchQuery('');
    setActiveMatchIdx(0);
    setShowBlocksPopover(false);
    setSlashTriggerRange(null);
    setShowExpandedEditor(false);
    setShowModalBlocks(false);
    setShowMobileMenu(false);
    setSelectedBubbleId(null);
    setShowScrollBottom(false);
    setUnreadWhileScrolled(0);

    const savedDraft = draftsRef.current[activeChat.id] || '';
    setNewMessage(savedDraft);

    fetchCitaActiva();
  }, [activeChat.id, businessId]);

  // Auto-growing textarea height
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 168 : 136;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [newMessage, activeChat.id, adjustTextareaHeight]);

  useEffect(() => {
    window.addEventListener('resize', adjustTextareaHeight);
    return () => window.removeEventListener('resize', adjustTextareaHeight);
  }, [adjustTextareaHeight]);

  // Scroll bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setUnreadWhileScrolled(0);
    setShowScrollBottom(false);
    isNearBottomRef.current = true;
  }, []);

  // VisualViewport keyboard awareness on mobile
  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    if (!vv) return;
    const handleResize = () => {
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
      }
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  // Smart scroll on mensajes updates
  useEffect(() => {
    if (mensajes.length === 0) {
      prevMsgCountRef.current = 0;
      return;
    }

    if (isFetchingOlderRef.current) {
      if (scrollContainerRef.current) {
        const newScrollHeight = scrollContainerRef.current.scrollHeight;
        scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
      }
      isFetchingOlderRef.current = false;
      prevMsgCountRef.current = mensajes.length;
      return;
    }

    if (isInitialMount.current) {
      scrollToBottom('auto');
      prevMsgCountRef.current = mensajes.length;
      setTimeout(() => {
        isInitialMount.current = false;
      }, 120);
      return;
    }

    const addedCount = mensajes.length - prevMsgCountRef.current;
    prevMsgCountRef.current = mensajes.length;

    if (addedCount > 0) {
      if (isNearBottomRef.current) {
        scrollToBottom('smooth');
      } else {
        setUnreadWhileScrolled((c) => c + addedCount);
        setShowScrollBottom(true);
      }
    }
  }, [mensajes, scrollToBottom]);

  // Cargar historial inicial de mensajes (30 más recientes) con stale-request guard
  const fetchMessages = async () => {
    const targetChatId = activeChat.id;
    const reqId = ++fetchReqIdRef.current;
    setLoading(true);
    setHasMoreMsgs(true);
    try {
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('business_id', businessId)
        .eq('cliente_id', targetChatId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      if (activeChatIdRef.current !== targetChatId || fetchReqIdRef.current !== reqId) return;

      const msgsAsc = sortMensajes(data || []);
      setMensajes(msgsAsc);
      if (msgsAsc.length < 30) {
        setHasMoreMsgs(false);
      }

      // Marcar como leídos una vez cargados
      if (data && data.some((m) => m.direccion === 'entrante' && m.estado !== 'leido')) {
        markMessagesAsRead();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (activeChatIdRef.current === targetChatId && fetchReqIdRef.current === reqId) {
        setLoading(false);
      }
    }
  };

  // Cargar mensajes más antiguos al subir el scroll (Infinite scroll hacia arriba)
  const fetchOlderMessages = async () => {
    if (loadingMoreMsgs || !hasMoreMsgs || mensajes.length === 0) return;

    const targetChatId = activeChat.id;
    setLoadingMoreMsgs(true);

    try {
      const oldestDate = mensajes[0].created_at;
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('business_id', businessId)
        .eq('cliente_id', targetChatId)
        .lt('created_at', oldestDate)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      if (activeChatIdRef.current !== targetChatId) {
        isFetchingOlderRef.current = false;
        return;
      }

      if (!data || data.length === 0) {
        setHasMoreMsgs(false);
        isFetchingOlderRef.current = false;
      } else {
        if (data.length < 30) setHasMoreMsgs(false);
        const uniqueOlder = data.filter((m) => !mensajesIdsRef.current.has(m.id));
        if (uniqueOlder.length === 0) {
          isFetchingOlderRef.current = false;
        } else {
          if (scrollContainerRef.current) {
            prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
          }
          isFetchingOlderRef.current = true;
          setMensajes((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const deduped = uniqueOlder.filter((m) => !existingIds.has(m.id));
            if (deduped.length === 0) return prev;
            return sortMensajes([...deduped, ...prev]);
          });
        }
      }
    } catch (err) {
      isFetchingOlderRef.current = false;
      console.error('Error fetching older messages:', err);
    } finally {
      setLoadingMoreMsgs(false);
    }
  };

  const handleMessageScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottom(!nearBottom && mensajes.length > 0 && !clearedMessages);
    if (nearBottom && unreadWhileScrolled > 0) {
      setUnreadWhileScrolled(0);
    }

    if (el.scrollTop < 80 && hasMoreMsgs && !loadingMoreMsgs && !loading) {
      fetchOlderMessages();
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

  useEffect(() => {
    const targetChatId = activeChat.id;
    fetchMessages();

    // 1. Polling de seguridad en segundo plano — trae los últimos 20 msgs y fusiona por ID
    const pollInterval = setInterval(() => {
      const silentFetch = async () => {
        try {
          const { data, error } = await supabase
            .from('mensajes')
            .select('*')
            .eq('business_id', businessId)
            .eq('cliente_id', targetChatId)
            .order('created_at', { ascending: false })
            .limit(20);

          if (activeChatIdRef.current !== targetChatId) return;
          if (!error && data && data.length > 0) {
            const incomingAsc = [...data].reverse();
            setMensajes((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newOnes = incomingAsc.filter((m) => !existingIds.has(m.id));
              if (newOnes.length === 0) return prev;
              // Reconciliar y limpiar mensajes temporales confirmados para evitar duplicados
              const confirmedTexts = new Set(
                incomingAsc.map((m) => `${m.direccion}_${m.contenido}`)
              );
              const filteredPrev = prev.filter(
                (m) =>
                  !(
                    m.id.startsWith('temp-') &&
                    confirmedTexts.has(`${m.direccion}_${m.contenido}`)
                  )
              );
              return sortMensajes([...filteredPrev, ...newOnes]);
            });
          }
        } catch (e) {
          /* silent */
        }
      };
      silentFetch();
    }, 12000);

    // 2. Suscripción Realtime — dedup por ID y reconciliación optimista
    const channel = supabase
      .channel(`chat_${businessId}_${targetChatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensajes',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          if (String(payload.new?.cliente_id) !== String(targetChatId)) return;
          setMensajes((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...(payload.new as Mensaje) } : m))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          // Ignorar mensajes que no pertenecen al chat activo
          if (String(payload.new?.cliente_id) !== String(targetChatId)) return;
          setMensajes((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;

            if (payload.new.direccion === 'entrante') {
              markMessagesAsRead();
            }

            // Si es saliente (incluye nota interna temp-note- o normal temp-), reemplazar el optimista temporal
            if (payload.new.direccion === 'saliente') {
              const tempIdx = prev.findIndex(
                (m) => m.id.startsWith('temp-') && m.contenido === payload.new.contenido
              );
              if (tempIdx >= 0) {
                const updated = [...prev];
                updated[tempIdx] = payload.new as Mensaje;
                return sortMensajes(updated);
              }
            }

            return sortMensajes([...prev, payload.new as Mensaje]);
          });
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [activeChat.id, businessId]);

  // Manejar el input + detección de "/" para bloques rápidos
  const handleTextChange = (value: string, cursorPos?: number) => {
    setNewMessage(value);
    saveDraftForChat(activeChat.id, value);

    const pos = cursorPos ?? value.length;
    const beforeCursor = value.slice(0, pos);
    const slashMatch = beforeCursor.match(/(?:^|\n)\/([^\s\n/]*)$/);
    if (slashMatch) {
      const query = slashMatch[1] || '';
      const slashStart = beforeCursor.lastIndexOf('/');
      setBlockFilter(query);
      setSlashTriggerRange({ start: slashStart, end: pos });
      setShowBlocksPopover(true);
    } else if (slashTriggerRange) {
      setSlashTriggerRange(null);
      setShowBlocksPopover(false);
    }
  };

  // Aplicar formato WhatsApp alrededor de la selección en un textarea dado
  const applyWhatsAppFormat = (
    prefix: string,
    suffix: string,
    targetRef: React.RefObject<HTMLTextAreaElement | null>
  ) => {
    const el = targetRef.current;
    if (!el) {
      const updated = `${newMessage}${prefix}${suffix}`;
      setNewMessage(updated);
      saveDraftForChat(activeChat.id, updated);
      return;
    }

    const start = el.selectionStart ?? newMessage.length;
    const end = el.selectionEnd ?? newMessage.length;
    const selected = newMessage.slice(start, end);
    const updated =
      newMessage.slice(0, start) + prefix + selected + suffix + newMessage.slice(end);

    setNewMessage(updated);
    saveDraftForChat(activeChat.id, updated);

    requestAnimationFrame(() => {
      el.focus();
      if (selected.length > 0) {
        el.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        const cursor = start + prefix.length;
        el.setSelectionRange(cursor, cursor);
      }
    });
  };

  // Insertar bloque rápido localmente en el cursor (NUNCA auto-envía)
  const insertQuickBlock = (
    content: string,
    targetRef: React.RefObject<HTMLTextAreaElement | null> = textareaRef
  ) => {
    const el = targetRef.current;
    let updated = '';
    let nextCursor = 0;

    if (slashTriggerRange) {
      const { start, end } = slashTriggerRange;
      updated = newMessage.slice(0, start) + content + newMessage.slice(end);
      nextCursor = start + content.length;
    } else if (el) {
      const start = el.selectionStart ?? newMessage.length;
      const end = el.selectionEnd ?? newMessage.length;
      const needsSeparator =
        start > 0 && newMessage[start - 1] !== '\n' && !newMessage.slice(0, start).endsWith('\n');
      const insertion = (needsSeparator ? '\n' : '') + content;
      updated = newMessage.slice(0, start) + insertion + newMessage.slice(end);
      nextCursor = start + insertion.length;
    } else {
      updated = newMessage ? `${newMessage}\n${content}` : content;
      nextCursor = updated.length;
    }

    setNewMessage(updated);
    saveDraftForChat(activeChat.id, updated);
    setShowBlocksPopover(false);
    setSlashTriggerRange(null);
    setBlockFilter('');

    requestAnimationFrame(() => {
      const focusEl = targetRef.current;
      if (focusEl) {
        focusEl.focus();
        focusEl.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  // Citar mensaje en el editor local (NUNCA auto-envía)
  const quoteMessageInComposer = (msg: Mensaje) => {
    const raw = (msg.contenido || '').trim();
    const cleanSnippet = raw.replace(/\s+/g, ' ').slice(0, 90);
    const snippet = cleanSnippet + (raw.length > 90 ? '…' : '');
    const prefix = `> "${snippet}"\n`;
    const updated = newMessage ? `${prefix}${newMessage}` : prefix;
    setNewMessage(updated);
    saveDraftForChat(activeChat.id, updated);
    setSelectedBubbleId(null);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = updated.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    });
  };

  const copyMessageText = async (msg: Mensaje) => {
    if (!msg.contenido) return;
    try {
      await navigator.clipboard.writeText(msg.contenido);
      setCopiedMsgId(msg.id);
      setTimeout(() => {
        setCopiedMsgId((curr) => (curr === msg.id ? null : curr));
      }, 1500);
    } catch {
      // ignore clipboard errors
    }
    setSelectedBubbleId(null);
  };

  // Filtered quick blocks
  const filteredBlocks = useMemo(() => {
    const q = blockFilter.trim().toLowerCase();
    if (!q) return quickBlocks;
    return quickBlocks.filter(
      (b) => b.label.toLowerCase().includes(q) || b.content.toLowerCase().includes(q)
    );
  }, [quickBlocks, blockFilter]);

  // Search matches across messages
  const searchMatchIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as string[];
    return mensajes
      .filter((m) => (m.contenido || '').toLowerCase().includes(q))
      .map((m) => m.id);
  }, [mensajes, searchQuery]);

  useEffect(() => {
    if (searchMatchIds.length === 0) {
      setActiveMatchIdx(0);
      return;
    }
    // Jump to latest match by default when typing
    const lastIdx = searchMatchIds.length - 1;
    setActiveMatchIdx(lastIdx);
    const targetId = searchMatchIds[lastIdx];
    messageNodeMapRef.current[targetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [searchMatchIds]);

  const jumpToSearchMatch = (direction: 'prev' | 'next') => {
    if (searchMatchIds.length === 0) return;
    const nextIdx =
      direction === 'prev'
        ? (activeMatchIdx - 1 + searchMatchIds.length) % searchMatchIds.length
        : (activeMatchIdx + 1) % searchMatchIds.length;
    setActiveMatchIdx(nextIdx);
    const targetId = searchMatchIds[nextIdx];
    messageNodeMapRef.current[targetId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Enviar Mensaje (PAYLOADS Y ENDPOINTS INTACTOS PER AGENTS.md REGLA 5)
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    const sentChatId = activeChat.id;
    setNewMessage('');
    saveDraftForChat(sentChatId, '');
    setShowBlocksPopover(false);
    setSlashTriggerRange(null);
    setSending(true);
    isNearBottomRef.current = true;

    try {
      if (isInternalNote) {
        // Agregar a la UI de inmediato antes del await para reconciliación limpia con Realtime
        const tempId = `temp-note-${Date.now()}`;
        const noteMsg: Mensaje = {
          id: tempId,
          business_id: businessId,
          cliente_id: sentChatId,
          contenido: content,
          tipo: 'texto',
          tipo_mensaje: 'nota_interna',
          direccion: 'saliente',
          created_at: new Date().toISOString()
        };
        setMensajes((prev) => [...prev, noteMsg]);

        // NOTA INTERNA: solo guardar en BD, NO enviar a WhatsApp
        await supabase.from('mensajes').insert({
          business_id: businessId,
          cliente_id: activeChat.id,
          contenido: content,
          tipo: 'texto',
          tipo_mensaje: 'nota_interna',
          direccion: 'saliente'
        });
      } else {
        // MENSAJE NORMAL: Optimistic UI + Webhook n8n
        const optimisticMsg: Mensaje = {
          id: `temp-${Date.now()}`,
          business_id: businessId,
          cliente_id: sentChatId,
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
        void response;
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSending(false);
    }
  };

  const activeMatchMsgId = searchMatchIds[activeMatchIdx] || null;
  const displayName =
    activeChat.nombre && activeChat.nombre.toLowerCase() !== 'recepcionista'
      ? activeChat.nombre
      : 'Cliente WhatsApp';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#E9EDEF] dark:bg-[#0B141A] relative">
      {/* HEADER — WhatsApp Solid Surface Style */}
      <div
        className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 bg-[#F0F2F5] dark:bg-[#202C33] shrink-0 border-b border-gray-200/80 dark:border-white/5 shadow-sm relative z-20 min-h-[58px]"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }}
      >
        {/* Back button - mobile only (44px touch target) */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden flex items-center justify-center w-11 h-11 -ml-1 rounded-full active:bg-gray-200 dark:active:bg-gray-700 active:scale-95 transition-all shrink-0"
            aria-label="Volver a la lista de chats"
          >
            <ArrowLeft size={22} className="text-[#54656f] dark:text-[#AEBAC1]" strokeWidth={2.5} />
          </button>
        )}

        {/* Avatar */}
        <div
          onClick={onToggleProfile}
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-br ${getGradient(displayName)} flex items-center justify-center text-white font-bold text-base sm:text-lg cursor-pointer shrink-0 shadow-sm active:scale-95 transition-transform`}
        >
          {displayName.charAt(0).toUpperCase()}
        </div>

        {/* Name, phone & Read-only Bot status */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleProfile}>
          <h3 className="font-semibold text-[#111B21] dark:text-[#E9EDEF] leading-tight truncate text-[15px] sm:text-[16px]">
            {displayName}
          </h3>
          <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
            <span className="text-[12px] sm:text-[13px] text-[#667781] dark:text-[#8696A0] truncate">
              {activeChat.telefono ? `+${activeChat.telefono}` : 'WhatsApp'}
            </span>
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 select-none ${
                activeChat.bot_pausado
                  ? 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}
              title="Estado actual del bot (solo lectura)"
            >
              <Bot size={10} />
              <span className="hidden xs:inline sm:inline">
                {activeChat.bot_pausado ? 'Bot pausado' : 'Bot activo'}
              </span>
            </span>
          </div>
        </div>

        {/* Controls (all w-11 h-11 touch targets) */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 text-[#54656f] dark:text-[#AEBAC1] relative">
          {/* Quick Booking Button - accessible on mobile & desktop */}
          <button
            type="button"
            onClick={() => setShowQuickBooking(true)}
            className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-violet-600 dark:text-violet-400 active:scale-95 transition-all"
            title="Agendar Cita Rápida"
            aria-label="Agendar Cita Rápida"
          >
            <Calendar size={19} />
          </button>

          {/* In-chat Search Toggle */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen((v) => {
                const next = !v;
                if (next) {
                  setTimeout(() => searchInputRef.current?.focus(), 60);
                } else {
                  setSearchQuery('');
                }
                return next;
              });
            }}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-95 ${
              searchOpen
                ? 'bg-[#00A884]/15 text-[#00A884]'
                : 'hover:bg-gray-200 dark:hover:bg-white/10 text-[#54656f] dark:text-[#AEBAC1]'
            }`}
            title="Buscar en el chat"
            aria-label="Buscar en el chat"
          >
            <Search size={19} />
          </button>

          {/* Clear View Button - Desktop/Tablet */}
          <button
            type="button"
            onClick={() => setClearedMessages(!clearedMessages)}
            className={`hidden sm:flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-95 ${
              clearedMessages
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200'
                : 'hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
            title={
              clearedMessages ? 'Restaurar vista de mensajes anteriores' : 'Limpiar vista de mensajes'
            }
            aria-label="Limpiar vista de mensajes"
          >
            {clearedMessages ? <RotateCcw size={18} /> : <Eraser size={18} />}
          </button>

          {/* Mobile Overflow Menu (Limpiar vista on narrow phones) */}
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setShowMobileMenu((v) => !v)}
              className="flex items-center justify-center w-11 h-11 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Más acciones"
            >
              <MoreVertical size={19} />
            </button>
            {showMobileMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMobileMenu(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-52 bg-white dark:bg-[#233138] rounded-xl shadow-xl border border-gray-200/80 dark:border-white/10 py-1.5 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setClearedMessages((v) => !v);
                      setShowMobileMenu(false);
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-[#111B21] dark:text-[#E9EDEF] hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    {clearedMessages ? <RotateCcw size={16} /> : <Eraser size={16} />}
                    <span>{clearedMessages ? 'Restaurar vista' : 'Limpiar vista'}</span>
                  </button>
                  {onToggleProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleProfile();
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-left text-[#111B21] dark:text-[#E9EDEF] hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      <PanelRightOpen size={16} />
                      <span>Ver perfil del cliente</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {onToggleProfile && (
            <button
              type="button"
              onClick={onToggleProfile}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all text-[#54656f] dark:text-[#AEBAC1]"
              aria-label="Alternar panel de perfil"
              title="Perfil del cliente"
            >
              {showProfile ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* IN-CHAT SEARCH BAR */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#202C33] border-b border-gray-200/80 dark:border-white/10 shrink-0 z-10">
          <Search size={16} className="text-[#667781] dark:text-[#8696A0] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                jumpToSearchMatch(e.shiftKey ? 'next' : 'prev');
              } else if (e.key === 'Escape') {
                setSearchOpen(false);
                setSearchQuery('');
              }
            }}
            placeholder="Buscar mensajes en este chat..."
            className="flex-1 bg-transparent text-[14px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] outline-none focus:outline-none min-w-0"
          />
          {searchQuery.trim() && (
            <span className="text-xs text-[#667781] dark:text-[#8696A0] tabular-nums shrink-0">
              {searchMatchIds.length > 0
                ? `${activeMatchIdx + 1}/${searchMatchIds.length}`
                : '0/0'}
            </span>
          )}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              disabled={searchMatchIds.length === 0}
              onClick={() => jumpToSearchMatch('prev')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 text-[#54656f] dark:text-[#AEBAC1]"
              aria-label="Resultado anterior"
            >
              <ChevronUp size={16} />
            </button>
            <button
              type="button"
              disabled={searchMatchIds.length === 0}
              onClick={() => jumpToSearchMatch('next')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40 text-[#54656f] dark:text-[#AEBAC1]"
              aria-label="Siguiente resultado"
            >
              <ChevronDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-[#54656f] dark:text-[#AEBAC1]"
              aria-label="Cerrar búsqueda"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Payment Verification Banner */}
      {citaActiva?.requiere_deposito && !citaActiva?.deposito_verificado && (
        <div className="bg-amber-50/90 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-500/20 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm relative z-10 w-full backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="min-w-0">
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
                setCitaActiva({ ...citaActiva, deposito_verificado: true });
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
            className="flex items-center gap-1.5 text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900 px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
      <div className="flex-1 min-h-0 relative flex flex-col">
        <div
          ref={scrollContainerRef}
          onScroll={handleMessageScroll}
          onClick={() => {
            if (selectedBubbleId) setSelectedBubbleId(null);
          }}
          className="flex-1 overflow-y-auto px-2.5 sm:px-5 py-3 bg-repeat touch-pan-y"
          style={{
            backgroundColor: 'var(--color-chat-bg)',
            backgroundImage: DOODLE_PATTERN,
            backgroundSize: '300px 300px'
          }}
        >
          {loadingMoreMsgs && (
            <div className="flex justify-center py-2">
              <div className="flex items-center gap-2 bg-[#D1D7DB] dark:bg-[#182229] px-3 py-1 rounded-full text-xs text-[#54656f] dark:text-[#8696A0] shadow-sm">
                <div className="h-3.5 w-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Cargando mensajes anteriores...</span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : clearedMessages ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-[#667781] dark:text-[#8696A0] p-6 space-y-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-[#182229] flex items-center justify-center text-gray-500 dark:text-gray-400 shadow-inner">
                <Eraser size={24} />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Vista de chat despejada
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Los mensajes anteriores fueron ocultados de tu pantalla (siguen guardados en la
                  base de datos).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClearedMessages(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 mt-2"
              >
                <RotateCcw size={14} /> Restaurar historial visible
              </button>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="text-center text-[#667781] dark:text-[#8696A0] mt-10 text-sm">
              No hay mensajes anteriores en este chat.
            </div>
          ) : (
            mensajes.map((msg, idx) => {
              const isOut = msg.direccion === 'saliente';
              const isNote = msg.tipo_mensaje === 'nota_interna';
              const msgDate = parseSafeDate(msg.created_at);
              const prevMsg = idx > 0 ? mensajes[idx - 1] : null;
              const prevDate = prevMsg ? parseSafeDate(prevMsg.created_at) : null;

              let showDateHeader = false;
              let dateHeaderText = '';

              if (
                idx === 0 ||
                (msgDate && prevDate && msgDate.toDateString() !== prevDate.toDateString()) ||
                (msgDate && !prevDate)
              ) {
                showDateHeader = true;
                dateHeaderText = formatDateHeader(msgDate);
              }

              // Grouping consecutive bubbles with same direction (ignoring nota_interna, within 5 min)
              const isSameGroup = Boolean(
                !isNote &&
                  prevMsg &&
                  prevMsg.tipo_mensaje !== 'nota_interna' &&
                  prevMsg.direccion === msg.direccion &&
                  msgDate &&
                  prevDate &&
                  msgDate.toDateString() === prevDate.toDateString() &&
                  Math.abs(msgDate.getTime() - prevDate.getTime()) <= 5 * 60 * 1000
              );
              const isFirstInGroup = !isSameGroup;

              const isActiveSearchMatch = activeMatchMsgId === msg.id;
              const isSelectedBubble = selectedBubbleId === msg.id;

              return (
                <React.Fragment key={msg.id || idx}>
                  {showDateHeader && (
                    <div className="sticky top-2 z-10 flex justify-center my-3 pointer-events-none">
                      <span className="bg-[#D1D7DB]/95 dark:bg-[#182229]/95 backdrop-blur-sm text-[#54656f] dark:text-[#8696A0] text-[12px] px-3 py-1 rounded-lg shadow-sm uppercase tracking-tight font-medium">
                        {dateHeaderText}
                      </span>
                    </div>
                  )}

                  {isNote ? (
                    <div
                      ref={(el) => {
                        if (msg.id) messageNodeMapRef.current[msg.id] = el;
                      }}
                      className="flex justify-center my-2.5"
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[78%] min-w-0 bg-amber-50 dark:bg-amber-900/25 border border-amber-200 dark:border-amber-700/40 rounded-xl px-3.5 py-2 text-center shadow-sm ${
                          isActiveSearchMatch ? 'ring-2 ring-amber-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 justify-center">
                          <StickyNote size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                            Nota Interna · Solo el Equipo
                          </span>
                        </div>
                        <p className="text-[13px] text-amber-900 dark:text-amber-200 whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0 leading-relaxed text-left">
                          {renderWhatsAppText(msg.contenido || '', searchQuery)}
                        </p>
                        <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-1 text-right">
                          {formatSafeTime(msgDate)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={(el) => {
                        if (msg.id) messageNodeMapRef.current[msg.id] = el;
                      }}
                      className={`group flex items-end gap-1.5 ${
                        isOut ? 'justify-end' : 'justify-start'
                      } ${isFirstInGroup ? (idx === 0 ? 'mt-1' : 'mt-2.5') : 'mt-0.5'}`}
                    >
                      {/* Quick actions for outgoing (on left side of bubble) */}
                      {isOut && msg.contenido && msg.estado !== 'eliminado' && (
                        <div
                          className={`flex items-center gap-0.5 transition-opacity shrink-0 ${
                            isSelectedBubble
                              ? 'opacity-100'
                              : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              quoteMessageInComposer(msg);
                            }}
                            className="p-1.5 rounded-full bg-white/80 dark:bg-[#202C33]/90 hover:bg-white dark:hover:bg-[#2A3942] text-[#54656f] dark:text-[#AEBAC1] shadow-sm"
                            title="Citar en el editor"
                            aria-label="Citar en el editor"
                          >
                            <Reply size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyMessageText(msg);
                            }}
                            className="p-1.5 rounded-full bg-white/80 dark:bg-[#202C33]/90 hover:bg-white dark:hover:bg-[#2A3942] text-[#54656f] dark:text-[#AEBAC1] shadow-sm"
                            title="Copiar texto"
                            aria-label="Copiar texto"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      )}

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBubbleId((curr) => (curr === msg.id ? null : msg.id));
                        }}
                        className={`relative max-w-[84%] sm:max-w-[74%] min-w-0 px-3 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[14.5px] leading-[1.45] transition-shadow ${
                          isOut
                            ? `bg-bubble-out-bg text-bubble-out-text ${
                                isFirstInGroup
                                  ? 'rounded-2xl rounded-tr-[4px]'
                                  : 'rounded-2xl'
                              }`
                            : `bg-bubble-in-bg text-bubble-in-text ${
                                isFirstInGroup
                                  ? 'rounded-2xl rounded-tl-[4px]'
                                  : 'rounded-2xl'
                              }`
                        } ${isActiveSearchMatch ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
                      >
                        {/* WhatsApp Corner Tail on first bubble of group */}
                        {isFirstInGroup && isOut && (
                          <svg
                            viewBox="0 0 8 13"
                            width="8"
                            height="13"
                            className="absolute -right-[7px] top-0 pointer-events-none"
                            style={{ color: 'var(--color-bubble-out-bg)' }}
                            aria-hidden="true"
                          >
                            <path
                              fill="currentColor"
                              d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"
                            />
                          </svg>
                        )}
                        {isFirstInGroup && !isOut && (
                          <svg
                            viewBox="0 0 8 13"
                            width="8"
                            height="13"
                            className="absolute -left-[7px] top-0 pointer-events-none"
                            style={{ color: 'var(--color-bubble-in-bg)' }}
                            aria-hidden="true"
                          >
                            <path
                              fill="currentColor"
                              d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"
                            />
                          </svg>
                        )}

                        {/* --- MULTIMEDIA & CONTENT RENDERER --- */}
                        {(() => {
                          const rawContent = msg.contenido || '';
                          const cleanContent = rawContent.trim();
                          const isDeleted =
                            msg.estado === 'eliminado' ||
                            rawContent === '[Mensaje eliminado]' ||
                            rawContent === 'Este mensaje fue eliminado' ||
                            rawContent.includes('🚫 Este mensaje fue eliminado');

                          if (isDeleted) {
                            return (
                              <div className="flex items-center gap-1.5 py-0.5 text-gray-500 dark:text-gray-400 italic text-[13px] select-none">
                                <span>🚫</span>
                                <span>Este mensaje fue eliminado</span>
                              </div>
                            );
                          }

                          const url =
                            msg.url_archivo === 'data:image/jpeg;base64,'
                              ? null
                              : msg.url_archivo;
                          const hasHttpOrDataUrl = Boolean(
                            url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))
                          );
                          const isImageUrl = Boolean(
                            url &&
                              ((url.startsWith('data:image/') && url.length > 30) ||
                                /\.(jpeg|jpg|gif|png|webp|bmp|heic|heif)$/i.test(url.split('?')[0]))
                          );
                          const isAudio = Boolean(
                            msg.tipo === 'audio' ||
                              msg.tipo === 'ptt' ||
                              (url && /\.(ogg|opus|mp3|wav|m4a|aac)$/i.test(url.split('?')[0])) ||
                              (url && url.startsWith('data:audio/'))
                          );
                          const isSticker = Boolean(
                            msg.tipo === 'sticker' ||
                              (url && url.includes('sticker')) ||
                              rawContent === '[Sticker]'
                          );
                          const isLocation = Boolean(
                            msg.tipo === 'location' ||
                              rawContent.includes('📍 Ubicación') ||
                              rawContent.startsWith('Ubicación:')
                          );
                          const isDocument = Boolean(
                            msg.tipo === 'documento' ||
                              msg.tipo === 'document' ||
                              (url && /\.(pdf|docx?|xlsx?|txt)$/i.test(url.split('?')[0]))
                          );
                          const isMedia =
                            msg.tipo === 'media' ||
                            msg.tipo === 'imagen' ||
                            msg.tipo === 'image';

                          // 1. Imagen / Foto (preview real si hay URL válida, con fallback)
                          if (isImageUrl || (isMedia && url) || cleanContent === '[Imagen]') {
                            return (
                              <div className="space-y-1.5 py-0.5 min-w-0">
                                {url && (isImageUrl || hasHttpOrDataUrl) ? (
                                  <MediaImagePreview url={url} onZoom={setZoomedImage} />
                                ) : (
                                  <div className="flex items-center gap-2.5 p-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 select-none">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                      <ImageIcon size={17} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[12.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                                        Foto / Imagen
                                      </span>
                                      <span className="text-[11px] text-[#667781] dark:text-[#8696A0]">
                                        Ver imagen en WhatsApp
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {cleanContent && cleanContent !== '[Imagen]' && (
                                  <p className="px-0.5 text-[13.5px] whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">
                                    {renderWhatsAppText(rawContent, searchQuery)}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // 2. Audio / Nota de voz (reproductor inline si hay URL válida)
                          if (isAudio) {
                            return (
                              <div className="space-y-1 py-0.5 min-w-0">
                                {url && hasHttpOrDataUrl ? (
                                  <MediaAudioPreview url={url} />
                                ) : (
                                  <div className="flex items-center gap-2.5 p-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 select-none">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                      <Mic size={17} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[12.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                                        Nota de voz
                                      </span>
                                      <span className="text-[11px] text-[#667781] dark:text-[#8696A0]">
                                        Escuchar en WhatsApp
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {cleanContent && !cleanContent.includes('[Audio]') && (
                                  <p className="px-0.5 text-[13.5px] whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">
                                    {renderWhatsAppText(rawContent, searchQuery)}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // 3. Sticker
                          if (isSticker) {
                            return url && hasHttpOrDataUrl ? (
                              <div className="py-1">
                                <img
                                  src={url}
                                  alt="Sticker"
                                  loading="lazy"
                                  className="w-28 h-28 object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-1.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 select-none py-1">
                                <span className="text-lg">🎨</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[12px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                                    Sticker
                                  </span>
                                  <span className="text-[10.5px] text-[#667781] dark:text-[#8696A0]">
                                    Ver en WhatsApp
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          // 4. Ubicación
                          if (isLocation) {
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5 p-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 select-none">
                                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                                    <MapPin size={17} />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[12.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                                      Ubicación
                                    </span>
                                    <span className="text-[11px] text-[#667781] dark:text-[#8696A0]">
                                      Ver mapa en WhatsApp
                                    </span>
                                  </div>
                                </div>
                                {cleanContent && (
                                  <p className="px-0.5 text-[13px] whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">
                                    {renderWhatsAppText(rawContent, searchQuery)}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // 5. Documento / Archivo
                          if (isDocument) {
                            const docCard = (
                              <div className="flex items-center gap-2.5 p-2 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl border border-black/5 dark:border-white/5 hover:bg-black/[0.07] dark:hover:bg-white/[0.1] transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <FileText size={17} />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-[12.5px] font-semibold text-[#111B21] dark:text-[#E9EDEF] truncate max-w-[190px]">
                                    {cleanContent || 'Documento adjunto'}
                                  </span>
                                  <span className="text-[11px] text-[#667781] dark:text-[#8696A0] flex items-center gap-1">
                                    {url && hasHttpOrDataUrl ? (
                                      <>
                                        <span>Abrir documento</span>
                                        <ExternalLink size={10} />
                                      </>
                                    ) : (
                                      'Ver documento en WhatsApp'
                                    )}
                                  </span>
                                </div>
                              </div>
                            );

                            return url && hasHttpOrDataUrl ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="block"
                              >
                                {docCard}
                              </a>
                            ) : (
                              docCard
                            );
                          }

                          // 6. Fallback seguro si no hay texto
                          if (!cleanContent) {
                            return (
                              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs italic py-0.5 px-1 select-none">
                                <ImageIcon size={13} className="shrink-0" />
                                <span>Archivo adjunto (Ver en WhatsApp)</span>
                              </div>
                            );
                          }

                          return (
                            <div className="px-0.5 whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">
                              {renderWhatsAppText(rawContent, searchQuery)}
                            </div>
                          );
                        })()}

                        {/* Compact Timestamp + Ticks */}
                        <div className="flex items-center justify-end mt-0.5 gap-1 select-none">
                          <span className="text-[10.5px] opacity-65 leading-none">
                            {formatSafeTime(msgDate)}
                          </span>
                          {isOut && (
                            <span className="inline-flex items-center">
                              {msg.estado === 'leido' ? (
                                <CheckCheck
                                  size={14}
                                  className="text-[#53bdeb]"
                                  strokeWidth={2.5}
                                />
                              ) : msg.estado === 'entregado' || msg.estado === 'recibido' ? (
                                <CheckCheck
                                  size={14}
                                  className="text-[#8696A0]"
                                  strokeWidth={2}
                                />
                              ) : msg.estado === 'pendiente' ? (
                                <Clock size={12} className="text-[#8696A0]" />
                              ) : msg.estado === 'error' || msg.estado === 'fallido' ? (
                                <AlertTriangle size={13} className="text-rose-500" />
                              ) : (
                                <Check size={14} className="text-[#8696A0]" strokeWidth={2} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick actions for incoming (on right side of bubble) */}
                      {!isOut && msg.contenido && msg.estado !== 'eliminado' && (
                        <div
                          className={`flex items-center gap-0.5 transition-opacity shrink-0 ${
                            isSelectedBubble
                              ? 'opacity-100'
                              : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              quoteMessageInComposer(msg);
                            }}
                            className="p-1.5 rounded-full bg-white/80 dark:bg-[#202C33]/90 hover:bg-white dark:hover:bg-[#2A3942] text-[#54656f] dark:text-[#AEBAC1] shadow-sm"
                            title="Citar en el editor"
                            aria-label="Citar en el editor"
                          >
                            <Reply size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyMessageText(msg);
                            }}
                            className="p-1.5 rounded-full bg-white/80 dark:bg-[#202C33]/90 hover:bg-white dark:hover:bg-[#2A3942] text-[#54656f] dark:text-[#AEBAC1] shadow-sm"
                            title="Copiar texto"
                            aria-label="Copiar texto"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Scroll-to-Bottom FAB */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-3 right-3 sm:right-5 z-20 h-10 w-10 rounded-full bg-white dark:bg-[#202C33] text-[#54656f] dark:text-[#AEBAC1] shadow-lg border border-gray-200/80 dark:border-white/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            aria-label="Ir al final del chat"
          >
            <ChevronDown size={20} />
            {unreadWhileScrolled > 0 && (
              <span className="absolute -top-1.5 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#00A884] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {unreadWhileScrolled > 99 ? '99+' : unreadWhileScrolled}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Depósito Preventivo Banner (Score < 50) */}
      {(!citaActiva || citaActiva.fecha < new Date().toISOString()) &&
        activeChat.fiabilidad_score !== undefined &&
        activeChat.fiabilidad_score < 50 && (
          <div className="bg-rose-50/90 dark:bg-rose-900/30 border-t border-rose-200/50 dark:border-rose-500/20 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm relative z-10 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6 w-6 rounded-full bg-rose-100 dark:bg-rose-800 flex items-center justify-center shrink-0">
                <AlertTriangle size={13} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                  Baja Fiabilidad Detectada ({Math.round(activeChat.fiabilidad_score)}/100)
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400/80 leading-tight">
                  Se recomienda agendar cobrando depósito previo a este cliente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickBooking(true)}
              className="text-[11px] font-bold bg-white dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 transition-colors shadow-sm whitespace-nowrap shrink-0"
            >
              Agendar con depósito
            </button>
          </div>
        )}

      {/* FOOTER — Block-Writing WhatsApp Composer */}
      <div
        className={`relative px-2.5 sm:px-3 pt-2 shrink-0 flex flex-col gap-1.5 border-t transition-colors ${
          isInternalNote
            ? 'bg-amber-50/95 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-600/40'
            : 'bg-[#F0F2F5] dark:bg-[#202C33] border-gray-200/80 dark:border-white/5'
        }`}
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0.5rem))' }}
      >
        {/* Quick Blocks Popover ("/") */}
        {showBlocksPopover && (
          <div className="absolute bottom-full left-2.5 right-2.5 sm:left-3 sm:right-auto sm:w-96 mb-2 z-30 bg-white dark:bg-[#233138] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-[#182229]">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#00A884]" />
                <span className="text-xs font-bold text-[#111B21] dark:text-[#E9EDEF]">
                  Bloques rápidos {blockFilter ? `(/${blockFilter})` : '(/)'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {!isCreatingBlock && !editingBlock && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingBlock(true);
                      setBlockLabelDraft('');
                      setBlockContentDraft('');
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00A884] hover:bg-[#00A884]/10 px-2 py-1 rounded-lg"
                  >
                    <Plus size={12} /> Nuevo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowBlocksPopover(false);
                    setSlashTriggerRange(null);
                    setIsCreatingBlock(false);
                    setEditingBlock(null);
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-200/70 dark:hover:bg-white/10"
                  aria-label="Cerrar bloques rápidos"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {isCreatingBlock || editingBlock ? (
              <div className="p-3 space-y-2">
                <input
                  type="text"
                  value={blockLabelDraft}
                  onChange={(e) => setBlockLabelDraft(e.target.value)}
                  placeholder="Título del bloque (ej: Horarios)"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2A3942] text-[#111B21] dark:text-[#E9EDEF] outline-none"
                />
                <textarea
                  rows={4}
                  value={blockContentDraft}
                  onChange={(e) => setBlockContentDraft(e.target.value)}
                  placeholder="Escribe el texto del bloque (soporta *negrita*, _cursiva_, saltos de línea)..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2A3942] text-[#111B21] dark:text-[#E9EDEF] outline-none resize-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingBlock(false);
                      setEditingBlock(null);
                    }}
                    className="px-2.5 py-1 text-xs rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!blockLabelDraft.trim() || !blockContentDraft.trim()}
                    onClick={() => {
                      if (editingBlock) {
                        setQuickBlocks((prev) =>
                          prev.map((b) =>
                            b.id === editingBlock.id
                              ? {
                                  ...b,
                                  label: blockLabelDraft.trim(),
                                  content: blockContentDraft
                                }
                              : b
                          )
                        );
                        setEditingBlock(null);
                      } else {
                        const created: QuickBlock = {
                          id: `blk-${Date.now()}`,
                          label: blockLabelDraft.trim(),
                          content: blockContentDraft
                        };
                        setQuickBlocks((prev) => [...prev, created]);
                        setIsCreatingBlock(false);
                      }
                    }}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-[#00A884] text-white disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                {filteredBlocks.length === 0 ? (
                  <p className="p-4 text-xs text-center text-[#667781] dark:text-[#8696A0]">
                    No se encontraron bloques que coincidan.
                  </p>
                ) : (
                  filteredBlocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-start justify-between gap-2 px-3.5 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 group/blk"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          insertQuickBlock(
                            block.content,
                            showExpandedEditor ? modalTextareaRef : textareaRef
                          )
                        }
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-xs font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                          {block.label}
                        </p>
                        <p className="text-[11px] text-[#667781] dark:text-[#8696A0] line-clamp-2 whitespace-pre-wrap mt-0.5">
                          {block.content}
                        </p>
                      </button>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBlock(block);
                            setBlockLabelDraft(block.label);
                            setBlockContentDraft(block.content);
                          }}
                          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
                          aria-label={`Editar ${block.label}`}
                        >
                          <Edit3 size={12} />
                        </button>
                        {quickBlocks.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setQuickBlocks((prev) => prev.filter((b) => b.id !== block.id))
                            }
                            className="p-1 rounded text-gray-400 hover:text-rose-500"
                            aria-label={`Eliminar ${block.label}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Mode Tabs + Formatting Toggle + Enter Hint */}
        <div className="flex items-center justify-between gap-2 px-0.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsInternalNote(false)}
              className={`text-[12px] px-3 py-1 rounded-full font-bold transition-all ${
                !isInternalNote
                  ? 'bg-[#00A884] text-white shadow-sm'
                  : 'text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200 dark:hover:bg-white/5'
              }`}
            >
              Mensaje
            </button>
            <button
              type="button"
              onClick={() => setIsInternalNote(true)}
              className={`text-[12px] px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                isInternalNote
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200 dark:hover:bg-white/5'
              }`}
            >
              <StickyNote size={13} /> Nota Interna
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowFormatBar((v) => !v)}
              className={`text-[11px] px-2 py-1 rounded-lg font-medium transition-colors ${
                showFormatBar
                  ? 'bg-gray-200/90 dark:bg-white/15 text-[#111B21] dark:text-[#E9EDEF]'
                  : 'text-[#667781] dark:text-[#8696A0] hover:bg-gray-200/60 dark:hover:bg-white/10'
              }`}
              title="Mostrar barra de formato WhatsApp"
            >
              *B* _I_ ~S~
            </button>
            <button
              type="button"
              onClick={() => setEnterSends((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg text-[#667781] dark:text-[#8696A0] hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors"
              title="Cambiar comportamiento de la tecla Enter"
            >
              <CornerDownLeft size={11} />
              <span>{enterSends ? 'Enter envía' : 'Enter = salto'}</span>
            </button>
          </div>
        </div>

        {/* Internal Note Guardrail Banner */}
        {isInternalNote && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-[11px] font-medium">
            <StickyNote size={12} className="shrink-0" />
            <span>Modo Nota Interna: solo lo ve tu equipo, no se envía por WhatsApp.</span>
          </div>
        )}

        {/* Unobtrusive WhatsApp Formatting Strip */}
        {showFormatBar && (
          <div className="flex items-center gap-1 px-1 py-0.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => applyWhatsAppFormat('*', '*', textareaRef)}
              className="p-1.5 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
              title="Negrita (*texto*)"
              aria-label="Negrita"
            >
              <Bold size={14} />
            </button>
            <button
              type="button"
              onClick={() => applyWhatsAppFormat('_', '_', textareaRef)}
              className="p-1.5 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
              title="Cursiva (_texto_)"
              aria-label="Cursiva"
            >
              <Italic size={14} />
            </button>
            <button
              type="button"
              onClick={() => applyWhatsAppFormat('~', '~', textareaRef)}
              className="p-1.5 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
              title="Tachado (~texto~)"
              aria-label="Tachado"
            >
              <Strikethrough size={14} />
            </button>
            <button
              type="button"
              onClick={() => applyWhatsAppFormat('```', '```', textareaRef)}
              className="p-1.5 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
              title="Monoespaciado (```texto```)"
              aria-label="Monoespaciado"
            >
              <Code size={14} />
            </button>
            <span className="text-[10.5px] text-[#667781] dark:text-[#8696A0] ml-auto px-1">
              Escribe <code className="font-mono">/</code> para bloques
            </span>
          </div>
        )}

        {/* Composer Form */}
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div
            className={`flex-1 flex items-end gap-1 rounded-2xl px-2.5 sm:px-3 py-1.5 min-h-[44px] transition-all shadow-sm border ${
              isInternalNote
                ? 'bg-white dark:bg-[#2A2518] border-amber-400 ring-2 ring-amber-400/40'
                : 'bg-white dark:bg-[#2A3942] border-gray-200/60 dark:border-white/5'
            }`}
          >
            {/* Quick Blocks Button */}
            <button
              type="button"
              onClick={() => {
                setSlashTriggerRange(null);
                setBlockFilter('');
                setShowBlocksPopover((v) => !v);
              }}
              className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center transition-colors mb-0.5 ${
                showBlocksPopover
                  ? 'bg-[#00A884]/15 text-[#00A884]'
                  : 'text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
              title="Bloques rápidos (/)"
              aria-label="Abrir bloques rápidos"
            >
              <Zap size={17} />
            </button>

            <textarea
              ref={textareaRef}
              className="flex-1 resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[16px] lg:text-[14.5px] text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0] leading-snug py-1.5 overflow-y-auto min-w-0"
              rows={1}
              placeholder={
                isInternalNote
                  ? 'Escribe una nota interna para el equipo...'
                  : 'Escribe un mensaje o / para bloques...'
              }
              value={newMessage}
              onChange={(e) =>
                handleTextChange(e.target.value, e.target.selectionStart ?? undefined)
              }
              onKeyDown={(e) => {
                if (e.key === 'Escape' && showBlocksPopover) {
                  e.preventDefault();
                  setShowBlocksPopover(false);
                  setSlashTriggerRange(null);
                  return;
                }
                if (e.key === 'Enter' && !e.shiftKey && enterSends) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />

            {/* Expand Block Editor Button */}
            <button
              type="button"
              onClick={() => {
                setShowBlocksPopover(false);
                setShowModalBlocks(false);
                setExpandedTab('write');
                setShowExpandedEditor(true);
              }}
              className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-100 dark:hover:bg-white/10 transition-colors mb-0.5"
              title="Abrir Editor por Bloques"
              aria-label="Expandir editor por bloques"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:grayscale ${
              isInternalNote ? 'bg-amber-400 text-amber-950' : 'bg-[#00A884] text-white'
            }`}
            aria-label={isInternalNote ? 'Guardar nota interna' : 'Enviar mensaje'}
          >
            {sending ? (
              <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>

      {/* EXPANDABLE BLOCK EDITOR MODAL ("Editor por Bloques") */}
      {showExpandedEditor && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4"
          onClick={() => setShowExpandedEditor(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full sm:max-w-4xl h-[92dvh] sm:h-[82vh] flex flex-col rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border ${
              isInternalNote
                ? 'bg-amber-50 dark:bg-[#231F16] border-amber-300 dark:border-amber-600/50'
                : 'bg-white dark:bg-[#111B21] border-gray-200 dark:border-white/10'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#F0F2F5] dark:bg-[#202C33] border-b border-gray-200 dark:border-white/10 shrink-0">
              <div className="min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-[#111B21] dark:text-[#E9EDEF] flex items-center gap-2">
                  <span>Editor por Bloques</span>
                  {isInternalNote && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                      Nota Interna
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-[#667781] dark:text-[#8696A0]">
                  Redacta párrafos largos con vista previa exacta de WhatsApp (luego tú decides
                  cuándo enviar)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpandedEditor(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 text-[#54656f] dark:text-[#AEBAC1]"
                aria-label="Cerrar editor por bloques"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Toolbar */}
            <div className="relative flex items-center justify-between gap-2 px-4 py-2 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-[#182229] shrink-0 flex-wrap">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applyWhatsAppFormat('*', '*', modalTextareaRef)}
                  className="p-2 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
                  title="Negrita (*texto*)"
                >
                  <Bold size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => applyWhatsAppFormat('_', '_', modalTextareaRef)}
                  className="p-2 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
                  title="Cursiva (_texto_)"
                >
                  <Italic size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => applyWhatsAppFormat('~', '~', modalTextareaRef)}
                  className="p-2 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
                  title="Tachado (~texto~)"
                >
                  <Strikethrough size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => applyWhatsAppFormat('```', '```', modalTextareaRef)}
                  className="p-2 rounded-lg text-[#54656f] dark:text-[#AEBAC1] hover:bg-gray-200/80 dark:hover:bg-white/10"
                  title="Monoespaciado (```texto```)"
                >
                  <Code size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModalBlocks((v) => !v);
                    setSlashTriggerRange(null);
                  }}
                  className={`ml-1 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    showModalBlocks
                      ? 'bg-[#00A884] text-white'
                      : 'bg-[#00A884]/10 text-[#00A884] hover:bg-[#00A884]/20'
                  }`}
                >
                  <Zap size={13} /> Insertar bloque
                </button>
              </div>

              {showModalBlocks && (
                <div className="absolute left-4 top-full mt-1 z-20 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#233138] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#182229]">
                    <span className="text-xs font-bold text-[#111B21] dark:text-[#E9EDEF]">
                      Insertar bloque rápido
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowModalBlocks(false)}
                      className="p-1 rounded text-gray-500 hover:bg-gray-200/70 dark:hover:bg-white/10"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-white/5">
                    {quickBlocks.map((block) => (
                      <button
                        key={block.id}
                        type="button"
                        onClick={() => {
                          insertQuickBlock(block.content, modalTextareaRef);
                          setShowModalBlocks(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <p className="text-xs font-semibold text-[#111B21] dark:text-[#E9EDEF]">
                          {block.label}
                        </p>
                        <p className="text-[11px] text-[#667781] dark:text-[#8696A0] line-clamp-2 whitespace-pre-wrap mt-0.5">
                          {block.content}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Write/Preview Switcher */}
              <div className="flex md:hidden items-center bg-gray-200/80 dark:bg-white/10 rounded-lg p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setExpandedTab('write')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${
                    expandedTab === 'write'
                      ? 'bg-white dark:bg-[#2A3942] text-[#111B21] dark:text-white shadow-xs'
                      : 'text-[#667781] dark:text-[#8696A0]'
                  }`}
                >
                  <Edit3 size={12} /> Escribir
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedTab('preview')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 ${
                    expandedTab === 'preview'
                      ? 'bg-white dark:bg-[#2A3942] text-[#111B21] dark:text-white shadow-xs'
                      : 'text-[#667781] dark:text-[#8696A0]'
                  }`}
                >
                  <Eye size={12} /> Vista previa
                </button>
              </div>
            </div>

            {/* Modal Body: Split Write + Live WhatsApp Preview */}
            <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-white/10">
              {/* Left: Multiline Block Textarea */}
              <div
                className={`flex flex-col min-h-0 p-4 ${
                  expandedTab === 'preview' ? 'hidden md:flex' : 'flex'
                }`}
              >
                <textarea
                  ref={modalTextareaRef}
                  autoFocus
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    saveDraftForChat(activeChat.id, e.target.value);
                  }}
                  placeholder="Escribe aquí tu mensaje por bloques... Usa Enter libremente para separar párrafos, listas o precios."
                  className="flex-1 w-full resize-none bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-[16px] lg:text-[14.5px] leading-relaxed text-[#111B21] dark:text-[#E9EDEF] placeholder-[#8696A0]"
                />
                <div className="pt-2 text-[11px] text-[#667781] dark:text-[#8696A0] flex items-center justify-between border-t border-gray-100 dark:border-white/5">
                  <span>
                    {newMessage.length} caracteres ·{' '}
                    {newMessage.trim() ? newMessage.trim().split(/\n\s*\n/).length : 0} bloques
                  </span>
                  <span>Enter = nueva línea</span>
                </div>
              </div>

              {/* Right: Live WhatsApp Bubble Preview */}
              <div
                className={`flex flex-col min-h-0 p-4 overflow-y-auto bg-repeat ${
                  expandedTab === 'write' ? 'hidden md:flex' : 'flex'
                }`}
                style={{
                  backgroundColor: 'var(--color-chat-bg)',
                  backgroundImage: DOODLE_PATTERN,
                  backgroundSize: '300px 300px'
                }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#54656f] dark:text-[#8696A0] mb-3 self-center bg-[#D1D7DB]/90 dark:bg-[#182229]/90 px-2.5 py-0.5 rounded-md">
                  Vista previa WhatsApp
                </span>
                {newMessage.trim() ? (
                  <div className="flex justify-end">
                    <div
                      className={`max-w-[90%] min-w-0 px-3.5 py-2 rounded-2xl rounded-tr-[4px] shadow-sm text-[14.5px] leading-[1.45] ${
                        isInternalNote
                          ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-300 text-amber-900 dark:text-amber-200'
                          : 'bg-bubble-out-bg text-bubble-out-text'
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] min-w-0">
                        {renderWhatsAppText(newMessage)}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-65 text-[10.5px]">
                        <span>{format(new Date(), 'HH:mm')}</span>
                        {!isInternalNote && <CheckCheck size={14} className="text-[#53bdeb]" />}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-center text-[#667781] dark:text-[#8696A0] my-auto">
                    Tu vista previa aparecerá aquí mientras escribes...
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#F0F2F5] dark:bg-[#202C33] border-t border-gray-200 dark:border-white/10 shrink-0">
              <span className="text-xs text-[#667781] dark:text-[#8696A0] hidden sm:inline">
                El texto queda en el compositor listo para revisar y enviar manualmente.
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowExpandedEditor(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00A884] hover:bg-[#009676] text-white shadow-sm transition-all active:scale-95"
                >
                  Aplicar al chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={() => setZoomedImage(null)}
            aria-label="Cerrar imagen"
          >
            <X size={24} />
          </button>
          <img
            src={zoomedImage}
            alt="Zoom"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
          />
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
          onSuccess={() => {
            setShowQuickBooking(false);
            fetchCitaActiva(); // recargar para mostrar en amarillo si no está verificado
          }}
        />
      )}
    </div>
  );
};

export default ChatWindow;
