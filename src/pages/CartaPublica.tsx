/**
 * CartaPublica.tsx — Vista Pública Mobile-First Ultra Clean & White
 * Ruta: /carta/:businessId
 * Sin autenticación. Experiencia de app nativa moderna con estética clean, fondo blanco y acentos refinados.
 * Incluye:
 * 1. Modal de búsqueda elegante (SearchModal) con autofocus y chips populares.
 * 2. Vista/Filtro dedicado de OFERTAS del día y del mes.
 * 3. Selector de Cita y Horarios Disponibles sincronizados en tiempo real con la tabla `Citas` del calendario.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Clock, Phone, ShoppingBag, X, ChevronRight,
  Tag, Star, Image as ImageIcon, Zap, Heart, ExternalLink,
  Loader2, AlertCircle, Check, Instagram, Search, Plus, Home, Gift,
  Calendar as CalendarIcon, User, CheckCircle2, ChevronLeft, ArrowRight, Eye,
  Sparkles, Flame, LayoutGrid, List, Sliders, ShieldCheck, Crown
} from 'lucide-react';
import {
  CartaCategoria, CartaServicio, CartaConfig, CartaFOMOBanner,
  CartaPromoMes, CartaOfertaSemana,
  CARTA_PALETAS, CartaLayoutEstilo
} from '../types';
import { cartaPublica } from '../services/api.js';
import { supabase } from '../services/supabase';
import { resolveServiceMediaAndDesc, DEFAULT_PROMO_MES, DEFAULT_OFERTA_SEMANA } from '../services/beautyTemplates';

// ─── Types locales ─────────────────────────────────────────────────
interface CartItem {
  servicio: CartaServicio;
  cantidad: number;
}

interface NegocioCartaInfo {
  plan_suscripcion?: string;
  recursos_saas?: {
    plan?: string;
    modulos?: {
      carta_digital?: {
        activo?: boolean;
        sub_pestanas?: {
          agendamiento_directo?: boolean;
          fomo_countdown?: boolean;
          antes_despues?: boolean;
          branding_pro?: boolean;
        };
      };
    };
  };
}

interface CartaData {
  categorias: (CartaCategoria & { servicios: CartaServicio[] })[];
  sinCategoria: CartaServicio[];
  config: CartaConfig | null;
  negocio?: NegocioCartaInfo | null;
}

interface CitaExistente {
  fecha: string;
  hora_fin: string | null;
  duracion_min: number | null;
  staff_id: number | null;
}

// ─── Helpers ───────────────────────────────────────────────────────
const formatPrecio = (srv: CartaServicio) => {
  if (!srv.precio) return 'Consultar';
  return `${srv.precio_desde ? 'Desde ' : ''}S/. ${Number(srv.precio).toFixed(2)}`;
};

const formatDuracion = (min?: number | null) => {
  if (!min) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const isOfertaVigente = (expira_en?: string) => {
  if (!expira_en) return true;
  return new Date(expira_en) > new Date();
};

const calcCountdown = (expira_en?: string): string => {
  if (!expira_en) return '';
  const diff = new Date(expira_en).getTime() - Date.now();
  if (diff <= 0) return 'Expirada';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d > 0) return `Termina en ${d}d`;
  return `Termina en ${h}h`;
};

// Generador de los siguientes 7 días (para selector de fecha rápido)
const getProximosDias = () => {
  const dias = [];
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    const diaSemana = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : nombresDias[d.getDay()];
    const fechaLabel = `${d.getDate()} ${nombresMeses[d.getMonth()]}`;
    dias.push({ iso, diaSemana, fechaLabel, dayOfWeek: d.getDay() });
  }
  return dias;
};

// ─── Component: MediaCard ──────────────────────────────────────────
const MediaCard: React.FC<{ srv: CartaServicio; className?: string }> = ({ srv, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (srv.media_tipo !== 'video' || !videoRef.current) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) videoRef.current?.play().catch(() => {});
        else videoRef.current?.pause();
      });
    }, { threshold: 0.5 });
    obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, [srv.media_tipo]);

  const resolvedMedia = srv.media_url || resolveServiceMediaAndDesc(srv.nombre, srv.descripcion, srv.media_url).mediaUrl;

  if (!resolvedMedia) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 ${className}`}>
        <ImageIcon size={26} className="opacity-40" />
      </div>
    );
  }

  if (srv.media_tipo === 'video') {
    return (
      <video ref={videoRef} src={resolvedMedia} className={`w-full h-full object-cover ${className}`}
        muted playsInline loop autoPlay />
    );
  }

  return <img src={resolvedMedia} alt={srv.nombre} className={`w-full h-full object-cover ${className}`} loading="lazy" />;
};

// ─── Component: AntesDespuesSlider (✨ Módulo PRO Interactivo) ───────
const AntesDespuesSlider: React.FC<{
  antesUrl: string;
  despuesUrl: string;
  className?: string;
}> = ({ antesUrl, despuesUrl, className = '' }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden touch-none cursor-ew-resize rounded-2xl ${className}`}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={onMouseMove}
      onTouchMove={onTouchMove}
    >
      {/* Imagen Después (Fondo Completo) */}
      <img
        src={despuesUrl}
        alt="Después"
        className="w-full h-full object-cover pointer-events-none"
      />
      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white pointer-events-none">
        DESPUÉS ✨
      </div>

      {/* Imagen Antes (Recortada dinámicamente) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={antesUrl}
          alt="Antes"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%', maxWidth: 'none' }}
        />
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white pointer-events-none">
          ANTES
        </div>
      </div>

      {/* Línea divisoria y manija */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-2xl flex items-center justify-center text-gray-800 border border-gray-200">
          <Sliders size={14} />
        </div>
      </div>
    </div>
  );
};

// ─── Component: ServiceDetailModal (Lookbook / Vista Detallada) ───
const ServiceDetailModal: React.FC<{
  srv: CartaServicio | null;
  onClose: () => void;
  primario: string;
  inCart: boolean;
  onToggleCart: (s: CartaServicio) => void;
  onWhatsApp: (srvNombre: string) => void;
  formatPrecio: (srv: CartaServicio) => string;
  formatDuracion: (min: number) => string;
  canAntesDespues?: boolean;
}> = ({ srv, onClose, primario, inCart, onToggleCart, onWhatsApp, formatPrecio, formatDuracion, canAntesDespues }) => {
  if (!srv) return null;

  const hasAntesDespues = Boolean(
    canAntesDespues &&
    srv.antes_despues?.activo &&
    srv.antes_despues.foto_antes &&
    srv.antes_despues.foto_despues
  );

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle de arrastre para móviles */}
          <div className="w-12 h-1.5 rounded-full bg-white/40 absolute top-3 left-1/2 -translate-x-1/2 z-20" />

          {/* Imagen Grande o Slider Antes/Después si está configurado */}
          <div className="relative w-full h-72 sm:h-80 bg-gray-100 shrink-0">
            {hasAntesDespues ? (
              <AntesDespuesSlider
                antesUrl={srv.antes_despues!.foto_antes!}
                despuesUrl={srv.antes_despues!.foto_despues!}
                className="w-full h-full"
              />
            ) : (
              <MediaCard srv={srv} className="w-full h-full object-cover" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            
            {/* Botón Cerrar */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all z-10">
              <X size={18} />
            </button>

            {/* Badges en la foto */}
            <div className="absolute top-4 left-4 flex gap-1.5 z-10">
              {srv.destacado && (
                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                  ★ MÁS SOLICITADO
                </span>
              )}
              {hasAntesDespues && (
                <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sliders size={10} /> ANTES Y DESPUÉS
                </span>
              )}
            </div>

            {/* Título sobre imagen */}
            <div className="absolute bottom-4 left-5 right-5 text-white pointer-events-none">
              <h3 className="text-xl font-black leading-tight drop-shadow-md">{srv.nombre}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="font-bold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
                  ⏱️ {formatDuracion(srv.duracion_min || 45)}
                </span>
                <span className="font-black text-emerald-300 text-sm">
                  {formatPrecio(srv)}
                </span>
              </div>
            </div>
          </div>

          {/* Cuerpo y Beneficios */}
          <div className="p-5 overflow-y-auto space-y-4">
            {srv.descripcion ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">¿Qué incluye este servicio?</p>
                <p className="text-sm text-gray-700 leading-relaxed font-normal">{srv.descripcion}</p>
              </div>
            ) : null}

            {/* Garantías de Salón de Belleza */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5">
                <span className="text-lg">✨</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Insumos Premium</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Hipoalergénicos y esterilizados</p>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5">
                <span className="text-lg">💎</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Garantía Total</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Look cuidado y personalizado</p>
                </div>
              </div>
            </div>

            {/* Acciones de Reserva */}
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => { onToggleCart(srv); onClose(); }}
                className="w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                style={{ background: inCart ? '#10b981' : primario }}>
                {inCart ? (
                  <><Check size={18} /> Agregado en tu Cita (Quitar)</>
                ) : (
                  <><Plus size={18} /> Agregar a mi Selección</>
                )}
              </button>

              <button
                onClick={() => onWhatsApp(srv.nombre)}
                className="w-full py-2.5 rounded-xl font-bold text-gray-600 hover:text-gray-900 text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-colors">
                <Phone size={13} /> Consultar por WhatsApp
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Component: SearchModal (Elegante tipo Spotlight) ──────────────
const SearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  servicios: CartaServicio[];
  primario: string;
  cart: CartItem[];
  addToCart: (s: CartaServicio) => void;
  removeFromCart: (id: string) => void;
}> = ({ isOpen, onClose, servicios, primario, cart, addToCart, removeFromCart }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const resultados = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return servicios.filter(s =>
      s.nombre.toLowerCase().includes(q) ||
      (s.descripcion && s.descripcion.toLowerCase().includes(q))
    );
  }, [query, servicios]);

  const sugerenciasPopulares = ['Balayage', 'Uñas Gel', 'Manicure', 'Lifting', 'Corte', 'Hidratación'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose} />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-4 inset-x-4 max-w-lg mx-auto z-50 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Input Bar */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Search size={20} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Busca servicios, tratamientos, peinados..."
                className="flex-1 bg-transparent text-gray-900 text-sm font-semibold outline-none placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
              <button onClick={onClose} className="text-xs font-bold px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100">
                Cerrar
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {query.trim() === '' ? (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Búsquedas Populares</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sugerenciasPopulares.map(sug => (
                      <button
                        key={sug}
                        onClick={() => setQuery(sug)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              ) : resultados.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <Search size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No encontramos servicios para "{query}"</p>
                  <p className="text-xs mt-0.5">Prueba con otra palabra clave como manicure o tinte.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400">{resultados.length} resultado{resultados.length > 1 ? 's' : ''}</p>
                  {resultados.map(srv => {
                    const inCart = cart.some(i => i.servicio.id === srv.id);
                    return (
                      <div key={srv.id} className="flex items-center gap-3 p-2.5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all bg-white">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                          <MediaCard srv={srv} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{srv.nombre}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-black" style={{ color: primario }}>{formatPrecio(srv)}</span>
                            {srv.duracion_min && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock size={9} /> {formatDuracion(srv.duracion_min)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => inCart ? removeFromCart(srv.id) : addToCart(srv)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-2xs"
                          style={{
                            background: inCart ? '#10b981' : primario,
                            color: 'white'
                          }}>
                          {inCart ? <Check size={14} /> : <Plus size={16} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────
const CartaPublica: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState<CartaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategoria, setActiveCategoria] = useState<string>('__todos__');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<CartaServicio | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [activeNavTab, setActiveNavTab] = useState<'menu' | 'promos'>('menu');
  const [viewMode, setViewMode] = useState<CartaLayoutEstilo>('pinterest'); // Modo visual por defecto: Pinterest
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({}); // Likes táctiles interactivos
  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Agenda / Cita Online States
  const [agendaMode, setAgendaMode] = useState(false);
  const [diasDisponibles] = useState(getProximosDias());
  const [selectedFecha, setSelectedFecha] = useState<string>(getProximosDias()[0].iso);
  const [selectedHora, setSelectedHora] = useState<string>('');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [citasDelDia, setCitasDelDia] = useState<CitaExistente[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ─── Colores y estilo temático ────────────────────────────────
  const cfg = data?.config;
  const paleta = cfg?.paleta || 'rose';
  const primario = cfg?.color_primario || CARTA_PALETAS[paleta as keyof typeof CARTA_PALETAS]?.primario || '#f43f5e';

  // ─── Permisos PRO del Negocio (Habilitados desde SuperAdmin o Plan Pro) ──
  const planNegocio = (data?.negocio?.plan_suscripcion || '').toLowerCase();
  const modCartaDigital = data?.negocio?.recursos_saas?.modulos?.carta_digital;
  const isPlanPro = planNegocio.includes('pro') || planNegocio.includes('elite') || planNegocio.includes('copilot');

  // Si el SuperAdmin le habilitó individualmente la sub-pestaña o si tiene plan Pro
  const canDirectBooking = isPlanPro || modCartaDigital?.sub_pestanas?.agendamiento_directo === true;
  const canFomoCountdown = isPlanPro || modCartaDigital?.sub_pestanas?.fomo_countdown === true;
  const canAntesDespues = isPlanPro || modCartaDigital?.sub_pestanas?.antes_despues === true;
  const isWhiteLabel = isPlanPro || modCartaDigital?.sub_pestanas?.branding_pro === true;

  // Estado para el reloj de cuenta regresiva FOMO en vivo
  const [fomoTimeLeft, setFomoTimeLeft] = useState<{ hours: string; minutes: string; seconds: string } | null>(null);

  useEffect(() => {
    const expira = cfg?.fomo_banner?.expira_en;
    if (!cfg?.fomo_banner?.activo || !expira) {
      setFomoTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = new Date(expira).getTime() - new Date().getTime();
      if (diff <= 0) {
        setFomoTimeLeft(null);
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setFomoTimeLeft({
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0'),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [cfg?.fomo_banner?.activo, cfg?.fomo_banner?.expira_en]);

  // ─── Carga de datos de la Carta ─────────────────────────────────
  useEffect(() => {
    if (!businessId) return;
    cartaPublica.load(businessId)
      .then(d => {
        const cData = d as CartaData;
        setData(cData);
        if (cData?.config?.layout_estilo) {
          setViewMode(cData.config.layout_estilo);
        }
        setLoading(false);
      })
      .catch(() => { setError('No pudimos cargar la carta. Por favor intenta de nuevo.'); setLoading(false); });
  }, [businessId]);

  // ─── Consulta de Citas en tiempo real para disponibilidad ────────
  useEffect(() => {
    async function fetchDisponibilidad() {
      if (!businessId || !selectedFecha) return;
      setLoadingSlots(true);
      try {
        const startOfDayIso = `${selectedFecha}T00:00:00.000Z`;
        const endOfDayIso = `${selectedFecha}T23:59:59.999Z`;

        const { data: citas, error } = await supabase
          .from('Citas')
          .select('fecha, hora_fin, duracion_min, staff_id')
          .eq('business_id', businessId)
          .gte('fecha', startOfDayIso)
          .lte('fecha', endOfDayIso)
          .not('estado', 'in', '("Cancelado","Cancelada","No Show")');

        if (error) {
          console.warn('Error fetching citas for availability:', error);
          setCitasDelDia([]);
        } else {
          setCitasDelDia((citas as CitaExistente[]) || []);
        }
      } catch (err) {
        console.error('Error in availability lookup:', err);
        setCitasDelDia([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    if (showCart && agendaMode) {
      fetchDisponibilidad();
    }
  }, [businessId, selectedFecha, showCart, agendaMode]);

  // ─── Carrito ──────────────────────────────────────────────────
  const addToCart = (srv: CartaServicio) => {
    setCart(prev => {
      const exists = prev.find(i => i.servicio.id === srv.id);
      if (exists) return prev;
      return [...prev, { servicio: srv, cantidad: 1 }];
    });
    setAddedId(srv.id);
    setTimeout(() => setAddedId(null), 1000);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.servicio.id !== id));

  const totalPrecio = cart.reduce((acc, i) => acc + (i.servicio.precio || 0), 0);
  const totalDuracion = cart.reduce((acc, i) => acc + (i.servicio.duracion_min || 30), 0);

  // ─── Cálculo dinámico de Horarios Disponibles ───────────────────
  const horariosDisponibles = useMemo(() => {
    if (!selectedFecha) return [];
    
    // Rango horario del salón: por defecto 9:00 AM a 8:00 PM (20:00)
    const horaApertura = 9;
    const horaCierre = 20;
    const duracionServicios = totalDuracion || 30; // duración total de lo elegido en el carrito

    const slots: { hora: string; libre: boolean }[] = [];
    const baseDate = new Date(`${selectedFecha}T00:00:00`);
    const now = new Date();

    let currentSlot = new Date(baseDate);
    currentSlot.setHours(horaApertura, 0, 0, 0);

    const finJornada = new Date(baseDate);
    finJornada.setHours(horaCierre, 0, 0, 0);

    while (currentSlot < finJornada) {
      const slotEnd = new Date(currentSlot.getTime() + duracionServicios * 60000);
      
      // Si el slot excede el cierre, cortar
      if (slotEnd > finJornada) break;

      const hh = String(currentSlot.getHours()).padStart(2, '0');
      const mm = String(currentSlot.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      // 1. Si la fecha es hoy y la hora ya pasó, no está libre
      const isPast = currentSlot < now;

      // 2. Verificar traslape con citas existentes en la base de datos
      let isOccupied = false;
      for (const cita of citasDelDia) {
        const cStart = new Date(cita.fecha);
        const cEnd = cita.hora_fin
          ? new Date(cita.hora_fin)
          : new Date(cStart.getTime() + (cita.duracion_min || 30) * 60000);

        // Traslape si (currentSlot < cEnd) && (slotEnd > cStart)
        if (currentSlot < cEnd && slotEnd > cStart) {
          isOccupied = true;
          break;
        }
      }

      slots.push({
        hora: timeStr,
        libre: !isPast && !isOccupied
      });

      // Avanzar en bloques de 30 min
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }

    return slots;
  }, [selectedFecha, totalDuracion, citasDelDia]);

  // ─── Búsqueda automática de clienta recurrente por WhatsApp ───────────
  const [codigoPais, setCodigoPais] = useState('51'); // Por defecto Perú (+51)
  const [buscandoClienta, setBuscandoClienta] = useState(false);
  const [clientaEncontrada, setClientaEncontrada] = useState<boolean>(false);
  const [clienteIdRegistrado, setClienteIdRegistrado] = useState<number | null>(null);

  const handleTelefonoChange = async (tel: string, cod: string = codigoPais) => {
    setClienteTelefono(tel);
    let cleanNumber = tel.replace(/\D/g, '');
    
    // Si el usuario ya escribió el código 51 al inicio de tel, normalizarlo
    if (cleanNumber.startsWith(cod) && cleanNumber.length > 9) {
      cleanNumber = cleanNumber.slice(cod.length);
    }
    
    // Teléfono completo con código de país (ej: 51981482289)
    const fullPhone = `${cod}${cleanNumber}`;
    
    // Si tiene al menos 8 o 9 dígitos el número local
    if (cleanNumber.length >= 8 && businessId) {
      setBuscandoClienta(true);
      try {
        // Buscar si ya existe en Clientes por número completo o terminación local
        const { data: cliente, error } = await supabase
          .from('Clientes')
          .select('id, nombre, telefono')
          .eq('business_id', businessId)
          .or(`telefono.eq.${fullPhone},telefono.eq.${cleanNumber},telefono.ilike.%${cleanNumber.slice(-8)}`)
          .maybeSingle();

        if (!error && cliente) {
          if (!clienteNombre.trim() || clientaEncontrada) {
            setClienteNombre(cliente.nombre || '');
          }
          setClienteIdRegistrado(cliente.id);
          setClientaEncontrada(true);
        } else {
          setClientaEncontrada(false);
          setClienteIdRegistrado(null);
        }
      } catch (err) {
        console.warn('Error buscando clienta por teléfono:', err);
      } finally {
        setBuscandoClienta(false);
      }
    } else {
      setClientaEncontrada(false);
      setClienteIdRegistrado(null);
    }
  };

  // ─── Agendar Cita en Supabase y WhatsApp ─────────────────────────
  const handleConfirmarCita = async () => {
    if (!clienteNombre.trim()) {
      alert('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!selectedHora) {
      alert('Por favor, selecciona un horario disponible.');
      return;
    }

    setBookingSaving(true);
    try {
      let cleanDigits = clienteTelefono.replace(/\D/g, '');
      if (cleanDigits.startsWith(codigoPais) && cleanDigits.length > 9) {
        cleanDigits = cleanDigits.slice(codigoPais.length);
      }
      const fullPhone = `${codigoPais}${cleanDigits}`;
      let finalClienteId: number | null = clienteIdRegistrado;

      // 1. Si ingresó teléfono y no teníamos su ID aún, buscar o crear/actualizar en Clientes
      if (cleanDigits.length >= 8 && businessId) {
        try {
          const { data: existingClient } = await supabase
            .from('Clientes')
            .select('id, nombre')
            .eq('business_id', businessId)
            .or(`telefono.eq.${fullPhone},telefono.eq.${cleanDigits},telefono.ilike.%${cleanDigits.slice(-8)}`)
            .maybeSingle();

          if (existingClient) {
            finalClienteId = existingClient.id;
            // Actualizar el nombre si lo cambió o enriqueció
            if (clienteNombre.trim() && clienteNombre.trim() !== existingClient.nombre) {
              await supabase
                .from('Clientes')
                .update({ nombre: clienteNombre.trim() })
                .eq('id', existingClient.id);
            }
          } else {
            // Crear nueva clienta sin duplicar con formato internacional
            const { data: newClient, error: clientInsertErr } = await supabase
              .from('Clientes')
              .insert([{
                business_id: businessId,
                nombre: clienteNombre.trim(),
                telefono: fullPhone,
                fecha_registro: new Date().toISOString(),
                Estado: 'Activo',
                categoria: 'Nuevo',
                total_visitas: 0,
                puntos_acumulados: 0
              }])
              .select('id')
              .single();

            if (!clientInsertErr && newClient) {
              finalClienteId = newClient.id;
            }
          }
        } catch (clientErr) {
          console.warn('Error gestionando registro en Clientes (continuando con Cita):', clientErr);
        }
      }

      // 2. Insertar en la tabla Citas del calendario real
      const serviciosNombres = cart.map(i => i.servicio.nombre).join(', ');
      const startDateTime = new Date(`${selectedFecha}T${selectedHora}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (totalDuracion || 30) * 60000);

      await supabase.from('Citas').insert([{
        business_id: businessId,
        cliente_id: finalClienteId,
        nombre: clienteNombre.trim(),
        servicio: serviciosNombres,
        fecha: startDateTime.toISOString(),
        hora_fin: endDateTime.toISOString(),
        duracion_min: totalDuracion || 30,
        precio: totalPrecio,
        estado: 'Pendiente',
        origen_cita: 'Carta Digital'
      }]);

      setBookingSuccess(true);

      // Guardar en memoria del navegador para futuras visitas sin tener que escribirlo de nuevo
      try {
        if (fullPhone && businessId) {
          localStorage.setItem(`nilah_client_phone_${businessId}`, fullPhone);
          if (clienteNombre.trim()) {
            localStorage.setItem(`nilah_client_name_${businessId}`, clienteNombre.trim());
          }
        }
      } catch (e) {}
      
      // 3. Abrir mensaje de WhatsApp preformateado
      const phone = cfg?.telefono_whatsapp?.replace(/\D/g, '') || '';
      const msg = `¡Hola ${cfg?.nombre_salon || 'Brilla Studio'}! 🌸\nAcabo de solicitar mi cita desde su Carta Digital:\n\n📅 Fecha: ${selectedFecha} a las ${selectedHora}\n💅 Servicios: ${serviciosNombres}\n⏱️ Duración: ${formatDuracion(totalDuracion)}\n💰 Total Estimado: S/. ${totalPrecio.toFixed(2)}\n👤 Nombre: ${clienteNombre.trim()}${fullPhone ? `\n📞 Teléfono: +${fullPhone}` : ''}`;
      
      if (phone) {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      }
    } catch (e) {
      console.error('Error agendando cita:', e);
      alert('Hubo un inconveniente al registrar. Te redirigiremos a WhatsApp.');
    } finally {
      setBookingSaving(false);
    }
  };

  // ─── WhatsApp link directo (sin agendamiento online) ─────────────
  const buildWhatsAppLink = useCallback((extra?: string) => {
    const phone = cfg?.telefono_whatsapp?.replace(/\D/g, '') || '';
    const serviciosNombres = cart.map(i => i.servicio.nombre).join(' + ');
    const msg = extra
      ? `¡Hola! Me interesa la promo: ${extra} 💬`
      : `¡Hola ${cfg?.nombre_salon || 'Brilla Studio'}! ✨ Me gustaría reservar cita para: ${serviciosNombres || 'un servicio'} · Total aprox: S/. ${totalPrecio.toFixed(2)}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }, [cart, cfg?.telefono_whatsapp, cfg?.nombre_salon, totalPrecio]);

  // ─── Scroll a categoría ───────────────────────────────────────
  const scrollToCategoria = (catId: string) => {
    setActiveCategoria(catId);
    if (catId === '__todos__') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current[catId];
    if (el) {
      const offset = 140;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const todasCategorias = useMemo(() => {
    if (!data) return [];
    
    // Enriquecer cada servicio con plantillas inteligentes si no tiene foto o descripción
    const enrichServicio = (srv: CartaServicio, catNombre?: string): CartaServicio => {
      const resolved = resolveServiceMediaAndDesc(srv.nombre, srv.descripcion, srv.media_url, catNombre);
      return {
        ...srv,
        media_url: resolved.mediaUrl,
        descripcion: resolved.descripcion,
      };
    };

    const categoriasEnriquecidas = data.categorias.map(cat => ({
      ...cat,
      servicios: (cat.servicios || []).map(srv => enrichServicio(srv, cat.nombre)),
    }));

    const sinCategoriaEnriquecida = (data.sinCategoria || []).map(srv => enrichServicio(srv, 'General'));

    return [
      ...categoriasEnriquecidas,
      ...(sinCategoriaEnriquecida.length > 0 ? [{ id: '__sin_cat__', nombre: 'Otros', emoji: '✨', servicios: sinCategoriaEnriquecida } as any] : [])
    ];
  }, [data]);

  const todosLosServicios = useMemo(() => {
    return todasCategorias.flatMap(c => c.servicios || []);
  }, [todasCategorias]);

  const serviciosDestacados = useMemo(() => {
    return todosLosServicios.filter(s => s.destacado);
  }, [todosLosServicios]);

  // ─── Loading / Error ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 bg-white">
          <Loader2 size={26} className="animate-spin" style={{ color: primario }} />
        </div>
        <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">Cargando Menú...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-black text-gray-900">{error || 'Carta no encontrada'}</h2>
        <p className="text-xs text-gray-500 max-w-xs">Verifica el link o comunícate con el salón directamente.</p>
      </div>
    );
  }

  // Promo del Mes: Si el salón no la tiene activa o está vacía, usar plantilla predefinida activa
  const effectivePromoMes: CartaPromoMes = (cfg?.promo_mes?.titulo && cfg.promo_mes.titulo.trim() !== '')
    ? cfg.promo_mes
    : DEFAULT_PROMO_MES;

  // Oferta / Combo de la Semana: Si el salón no la tiene activa o está vacía, usar plantilla predefinida activa
  const effectiveOfertaSemana: CartaOfertaSemana = (cfg?.oferta_semana?.titulo && cfg.oferta_semana.titulo.trim() !== '')
    ? cfg.oferta_semana
    : DEFAULT_OFERTA_SEMANA;

  const ofertaActiva = effectiveOfertaSemana.activa && isOfertaVigente(effectiveOfertaSemana.expira_en);

  return (
    <div className="min-h-screen bg-[#faf9f6] text-gray-900 font-sans pb-32 antialiased selection:bg-rose-100 max-w-lg mx-auto shadow-2xl shadow-black/5 relative">
      
      {/* ── 1. HEADER MINIMALISTA BLANCO ─────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo cuadrado redondeado */}
          {cfg?.logo_url ? (
            <img src={cfg.logo_url} alt="Logo" className="w-11 h-11 rounded-2xl object-cover border border-gray-100 shadow-xs shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-base font-black text-white shrink-0 shadow-xs"
              style={{ background: primario }}>
              {(cfg?.nombre_salon || 'B')[0].toUpperCase()}
            </div>
          )}

          {/* Nombre y subtítulo */}
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-tight text-gray-900 truncate leading-tight">
              {cfg?.nombre_salon || 'Brilla Studio'}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-black tracking-wider uppercase text-emerald-600 flex items-center gap-1">
                SALÓN & SPA • PERÚ ✨
              </span>
            </div>
          </div>
        </div>

        {/* Botones de acción en header */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-600 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-2xs"
            title="Buscar servicios">
            <Search size={17} />
          </button>
          {cfg?.instagram_url && (
            <a href={cfg.instagram_url} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-600 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-2xs"
              title="Instagram">
              <Instagram size={17} />
            </a>
          )}
          {cfg?.maps_url && (
            <a href={cfg.maps_url} target="_blank" rel="noopener noreferrer"
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-600 hover:text-gray-900 transition-all active:scale-95 bg-white shadow-2xs"
              title="Ubicación en Google Maps">
              <MapPin size={17} />
            </a>
          )}
          <button
            onClick={() => setShowCart(true)}
            className="relative w-10 h-10 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-800 transition-all active:scale-95 bg-white shadow-2xs">
            <ShoppingBag size={18} />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[11px] font-bold text-white flex items-center justify-center shadow-xs"
                style={{ background: primario }}>
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── 2. BANNER FLASH FOMO CON CUENTA REGRESIVA DINÁMICA (SOLO PRO) ────── */}
      {canFomoCountdown && cfg?.fomo_banner?.activo && (
        <section className="pt-2 px-4">
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-3.5 bg-gradient-to-r from-neutral-900 via-rose-950 to-neutral-900 text-white shadow-md border border-rose-500/30 flex items-center justify-between gap-3 relative overflow-hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl animate-pulse shrink-0">
                {cfg.fomo_banner.badge_emoji || '⚡'}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-md shadow-xs">
                    {cfg.fomo_banner.descuento_tag || 'OFERTA FLASH'}
                  </span>
                  <p className="text-xs font-black truncate">{cfg.fomo_banner.titulo}</p>
                </div>
                {cfg.fomo_banner.subtitulo && (
                  <p className="text-[11px] text-white/75 truncate mt-0.5">{cfg.fomo_banner.subtitulo}</p>
                )}
              </div>
            </div>

            {/* Contador regresivo en vivo o botón */}
            <div className="shrink-0 flex items-center gap-2">
              {fomoTimeLeft ? (
                <div className="bg-black/60 border border-rose-500/40 px-2.5 py-1.5 rounded-xl font-mono text-xs font-black text-rose-300 flex items-center gap-1 shadow-inner">
                  <Clock size={12} className="animate-spin" />
                  <span>{fomoTimeLeft.hours}:{fomoTimeLeft.minutes}:{fomoTimeLeft.seconds}</span>
                </div>
              ) : cfg.telefono_whatsapp ? (
                <a
                  href={buildWhatsAppLink(cfg.fomo_banner.titulo)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-gray-900 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs active:scale-95 transition-transform shrink-0"
                >
                  Aprovechar
                </a>
              ) : null}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── VISTA PRINCIPAL: MENÚ O VISTA OFERTAS ────────────────────── */}
      {activeNavTab === 'promos' ? (
        /* ════════════════════════════════════════════════════════════
           VISTA EXCLUSIVA DE OFERTAS & PROMOS
        ════════════════════════════════════════════════════════════ */
        <div className="px-4 pt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                Especiales del Salón
              </span>
              <h2 className="text-xl font-black text-gray-900 mt-1">Ofertas & Promociones</h2>
              <p className="text-xs text-gray-500 mt-0.5">Aprovecha los descuentos exclusivos y combos de temporada.</p>
            </div>
          </div>

          {/* Promo del Mes si existe o por defecto */}
          {effectivePromoMes.activa && (
            <div className="rounded-3xl p-5 bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-sm space-y-2 relative overflow-hidden">
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
                {effectivePromoMes.badge_emoji || '🌸'} {effectivePromoMes.badge_texto || 'Promo del Mes'}
              </span>
              <h3 className="text-lg font-black tracking-tight">{effectivePromoMes.titulo}</h3>
              {effectivePromoMes.descripcion && (
                <p className="text-xs text-white/80 leading-relaxed">{effectivePromoMes.descripcion}</p>
              )}
            </div>
          )}

          {/* Combo Hero si existe o por defecto */}
          {ofertaActiva && (
            <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-800 to-teal-950 text-white shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase bg-black/30 px-2 py-0.5 rounded-full">🔥 COMBO DE LA SEMANA</span>
                <span className="text-[10px] font-black uppercase bg-rose-500 px-2 py-0.5 rounded-full">
                  {calcCountdown(effectiveOfertaSemana.expira_en) || 'HOY'}
                </span>
              </div>
              <h3 className="text-lg font-black">{effectiveOfertaSemana.titulo}</h3>
              {effectiveOfertaSemana.descripcion && <p className="text-xs text-white/80">{effectiveOfertaSemana.descripcion}</p>}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black">S/. {Number(effectiveOfertaSemana.precio_oferta || 129).toFixed(2)}</span>
                  {effectiveOfertaSemana.precio_original && (
                    <span className="text-xs text-white/60 line-through">S/. {Number(effectiveOfertaSemana.precio_original).toFixed(2)}</span>
                  )}
                </div>
                <a href={buildWhatsAppLink(effectiveOfertaSemana.titulo)} target="_blank" rel="noopener noreferrer"
                  className="bg-white text-emerald-900 px-4 py-2 rounded-xl text-xs font-bold shadow-md">
                  Pedir por WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* Listado de Servicios en Oferta / Destacados */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">Servicios Destacados en Promoción</h3>
            {serviciosDestacados.length === 0 ? (
              <div className="p-8 text-center text-gray-400 border border-gray-100 rounded-3xl">
                <Gift size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No hay promociones activas hoy.</p>
              </div>
            ) : (
              serviciosDestacados.map(srv => {
                const inCart = cart.some(i => i.servicio.id === srv.id);
                return (
                  <div key={srv.id} className="rounded-3xl border border-gray-100 bg-white p-3.5 shadow-2xs flex items-center gap-3.5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 border border-gray-50 shrink-0 relative">
                      <MediaCard srv={srv} />
                      <span className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                        PROMO
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{srv.nombre}</h4>
                      {srv.descripcion && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{srv.descripcion}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-black text-rose-600">{formatPrecio(srv)}</span>
                        {srv.duracion_min && (
                          <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-0.5">
                            <Clock size={10} /> {formatDuracion(srv.duracion_min)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => inCart ? removeFromCart(srv.id) : addToCart(srv)}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 shadow-xs"
                      style={{ background: inCart ? '#10b981' : primario, color: 'white' }}>
                      {inCart ? <Check size={18} /> : <Plus size={20} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════
           VISTA COMPLETA DEL MENÚ
        ════════════════════════════════════════════════════════════ */
        <>
          {/* ── 3. CATEGORÍAS EN PÍLDORAS ELEGANTES (HORIZONTAL PILLS CON GLOW) ── */}
          <div ref={tabsRef} className="sticky top-[69px] z-20 bg-white/95 backdrop-blur-md py-3 px-4 border-b border-gray-100 shadow-2xs">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => scrollToCategoria('__todos__')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  activeCategoria === '__todos__'
                    ? 'text-white shadow-md shadow-black/10'
                    : 'bg-gray-50 text-gray-700 border border-gray-100/80 hover:bg-gray-100'
                }`}
                style={{ background: activeCategoria === '__todos__' ? primario : undefined }}>
                <span className="text-sm">✨</span> Todo el Catálogo
              </button>
              {todasCategorias.map(cat => {
                const isSelected = activeCategoria === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategoria(cat.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                      isSelected
                        ? 'text-white shadow-md shadow-black/10'
                        : 'bg-gray-50 text-gray-700 border border-gray-100/80 hover:bg-gray-100'
                    }`}
                    style={{ background: isSelected ? primario : undefined }}>
                    <span className="text-sm">{cat.emoji || '✨'}</span> {cat.nombre}
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-gray-200/70 text-gray-600'}`}>
                      {cat.servicios?.length || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 space-y-6 pt-4">
            {/* ── 4. BANNER HERO CAROUSEL: OFERTAS & PROMOS DESTACADAS ── */}
            {(effectivePromoMes.activa || ofertaActiva) && (
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1">
                  
                  {/* Slide: Promo del Mes */}
                  {effectivePromoMes.activa && (
                    <motion.section initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="min-w-full snap-center rounded-[28px] p-5 shadow-sm relative overflow-hidden text-white border border-purple-400/20"
                      style={{ background: `linear-gradient(135deg, #4c1d95 0%, #312e81 60%, #1e1b4b 100%)` }}>
                      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-pink-500/20 blur-xl pointer-events-none" />
                      <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white/95">
                              {effectivePromoMes.badge_emoji || '🌸'} {effectivePromoMes.badge_texto || 'PROMO DEL MES'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-400/30 text-purple-200 px-2 py-0.5 rounded-full">
                              DESTACADO
                            </span>
                          </div>
                          <h3 className="text-lg font-black tracking-tight leading-tight">{effectivePromoMes.titulo}</h3>
                          {effectivePromoMes.descripcion && (
                            <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">{effectivePromoMes.descripcion}</p>
                          )}
                        </div>

                        {cfg?.telefono_whatsapp && (
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[11px] text-purple-200 font-semibold">Desliza para ver más ➔</span>
                            <a href={buildWhatsAppLink(effectivePromoMes.titulo)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-white text-purple-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all">
                              <ShoppingBag size={14} /> Consultar
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )}

                  {/* Slide: Combo Especial de la Semana */}
                  {ofertaActiva && (
                    <motion.section initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="min-w-full snap-center rounded-[28px] p-5 shadow-sm relative overflow-hidden text-white border border-emerald-400/20"
                      style={{ background: `linear-gradient(135deg, #134e4a 0%, #065f46 60%, #064e3b 100%)` }}>
                      <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full text-white/90">
                              🔥 COMBO ESPECIAL
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 px-2 py-0.5 rounded-full text-white">
                              {calcCountdown(effectiveOfertaSemana.expira_en) || 'HOY'}
                            </span>
                          </div>
                          <h3 className="text-lg font-black tracking-tight leading-tight">{effectiveOfertaSemana.titulo}</h3>
                          {effectiveOfertaSemana.descripcion && (
                            <p className="text-xs text-white/80 mt-1 line-clamp-2 leading-relaxed">{effectiveOfertaSemana.descripcion}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black">S/. {Number(effectiveOfertaSemana.precio_oferta || 129).toFixed(2)}</span>
                            {effectiveOfertaSemana.precio_original && (
                              <span className="text-xs text-white/60 line-through">S/. {Number(effectiveOfertaSemana.precio_original).toFixed(2)}</span>
                            )}
                          </div>
                          {cfg?.telefono_whatsapp && (
                            <a href={buildWhatsAppLink(effectiveOfertaSemana.titulo)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 bg-white text-emerald-900 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all">
                              <ShoppingBag size={14} /> Pedir Combo
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.section>
                  )}

                </div>
                {/* Indicador de Deslizamiento si hay más de 1 promo activa */}
                {effectivePromoMes.activa && ofertaActiva && (
                  <div className="flex justify-center gap-1.5 pt-2">
                    <div className="w-4 h-1.5 rounded-full bg-purple-500/70" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>
                )}
              </div>
            )}

            {/* ── 5. OFERTAS DEL DÍA (CARRUSEL HORIZONTAL) ── */}
            {serviciosDestacados.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <span>🔥</span> OFERTAS DEL DÍA
                  </h2>
                  <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full">
                    Solo por Hoy
                  </span>
                </div>

                <div className="flex gap-3.5 overflow-x-auto no-scrollbar pb-2 pt-1">
                  {serviciosDestacados.map(srv => {
                    const inCart = cart.some(i => i.servicio.id === srv.id);
                    return (
                      <div key={srv.id}
                        className="w-[185px] shrink-0 rounded-3xl border border-gray-100 bg-white p-3 shadow-xs flex flex-col justify-between transition-all hover:border-gray-200">
                        <div className="space-y-2">
                          <div className="w-full h-28 rounded-2xl overflow-hidden relative bg-gray-50 border border-gray-50">
                            <MediaCard srv={srv} />
                            <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                              PROMO HOY!
                            </span>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 line-clamp-1 leading-snug">{srv.nombre}</h4>
                            <div className="flex items-baseline gap-1.5 mt-1">
                              <span className="text-xs font-black text-rose-600">{formatPrecio(srv)}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => inCart ? removeFromCart(srv.id) : addToCart(srv)}
                          className="mt-3 w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                          style={{
                            background: inCart ? '#10b981' : primario,
                            color: 'white'
                          }}>
                          {inCart ? <><Check size={13} /> Agregado</> : <><Plus size={14} /> Agregar</>}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── 6. LISTADO DEL MENÚ (LOOKBOOK GRID / LIST VIEW TOGGLE) ── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Sparkles size={14} style={{ color: primario }} />
                    CATÁLOGO DE EXPERIENCIAS
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium">Toca cualquier servicio para ver detalles y fotos reales</p>
                </div>

                {/* Selector rápido de visualización (4 Estilos Boutique) */}
                <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-2xl shrink-0 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'pinterest' as CartaLayoutEstilo, icon: <LayoutGrid size={13} />, label: 'Grid' },
                    { id: 'editorial' as CartaLayoutEstilo, icon: <Sparkles size={13} />, label: 'Vogue' },
                    { id: 'stories' as CartaLayoutEstilo, icon: <Flame size={13} />, label: 'Story' },
                    { id: 'minimal' as CartaLayoutEstilo, icon: <List size={13} />, label: 'Lista' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setViewMode(tab.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                        viewMode === tab.id
                          ? 'bg-white shadow-xs text-gray-900 scale-100'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {todasCategorias.map(cat => {
                const serviciosVisibles = cat.servicios;
                if (!serviciosVisibles || serviciosVisibles.length === 0) return null;

                return (
                  <div key={cat.id} ref={el => { sectionRefs.current[cat.id] = el; }} className="space-y-3.5">
                    {/* Header de Categoría con Acabado Editorial */}
                    <div className="flex items-center justify-between pt-2 pb-1 border-b border-gray-100/80">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 rounded-xl bg-white shadow-2xs border border-gray-100">{cat.emoji || '✨'}</span>
                        <div>
                          <h3 className="text-sm font-black text-gray-900 tracking-tight">{cat.nombre}</h3>
                          <span className="text-[10px] text-gray-400 font-medium">{serviciosVisibles.length} servicios disponibles</span>
                        </div>
                      </div>
                    </div>

                    {/* ════════════════════════════════════════════════════════════
                        LAYOUT 1: PINTEREST MOODBOARD (GRID ASIMÉTRICO 2 COLS)
                    ════════════════════════════════════════════════════════════ */}
                    {viewMode === 'pinterest' && (
                      <div className="grid grid-cols-2 gap-3">
                        {serviciosVisibles.map((srv, idx) => {
                          const inCart = cart.some(i => i.servicio.id === srv.id);
                          const isLiked = likedIds[srv.id];
                          const justAdded = addedId === srv.id;
                          const isHeroLook = (idx + 1) % 5 === 0;

                          if (isHeroLook) {
                            return (
                              <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                                className="col-span-2 rounded-[28px] overflow-hidden bg-white border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-all relative group">
                                <div className="h-44 w-full relative bg-gray-100 overflow-hidden">
                                  <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  <div className="absolute top-3 left-3">
                                    <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                                      <Flame size={10} /> LOOK TENDENCIA
                                    </span>
                                  </div>
                                  <button onClick={(e) => toggleLike(srv.id, e)}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-75 transition-transform">
                                    <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                                  </button>
                                  <div className="absolute bottom-3 left-3 right-3 text-white flex items-end justify-between">
                                    <div>
                                      <h4 className="text-sm font-black drop-shadow-sm">{srv.nombre}</h4>
                                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                                        <span className="font-black text-white">{formatPrecio(srv)}</span>
                                        {srv.duracion_min && <span className="text-[10px] text-white/80">· {formatDuracion(srv.duracion_min)}</span>}
                                      </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); inCart ? removeFromCart(srv.id) : addToCart(srv); }}
                                      className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-md active:scale-90 transition-all text-white"
                                      style={{ background: inCart ? '#10b981' : primario }}>
                                      {inCart ? <><Check size={13} /> Listo</> : <><Plus size={14} /> Agregar</>}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                              className="rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-2xs flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all group relative">
                              <div className="h-32 w-full relative bg-gray-50 overflow-hidden">
                                <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-300" />
                                {srv.destacado && (
                                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs">TOP</span>
                                )}
                                <button onClick={(e) => toggleLike(srv.id, e)}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center shadow-xs active:scale-75 transition-transform">
                                  <Heart size={12} className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-600'} />
                                </button>
                              </div>
                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700">{srv.nombre}</h4>
                                  <div className="mt-1 flex items-baseline gap-1.5">
                                    <span className="text-xs font-black" style={{ color: primario }}>{formatPrecio(srv)}</span>
                                    {srv.duracion_min && <span className="text-[10px] text-gray-400 font-medium">{formatDuracion(srv.duracion_min)}</span>}
                                  </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); inCart ? removeFromCart(srv.id) : addToCart(srv); }}
                                  className="mt-2.5 w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                                  style={{ background: inCart ? '#10b981' : 'var(--color-surface, #f4f4f5)', color: inCart ? 'white' : '#18181b' }}>
                                  {justAdded ? <Check size={13} /> : inCart ? <><Check size={12} /> Elegido</> : <><Plus size={13} /> Añadir</>}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════
                        LAYOUT 2: VOGUE EDITORIAL LUXURY (CASCADA ANCHO COMPLETO)
                    ════════════════════════════════════════════════════════════ */}
                    {viewMode === 'editorial' && (
                      <div className="space-y-4">
                        {serviciosVisibles.map(srv => {
                          const inCart = cart.some(i => i.servicio.id === srv.id);
                          const isLiked = likedIds[srv.id];

                          return (
                            <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                              className="rounded-[32px] overflow-hidden bg-white border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-all group">
                              <div className="h-48 w-full relative bg-gray-100 overflow-hidden">
                                <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                <div className="absolute top-3 left-3 flex gap-2">
                                  <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-white/20">
                                    EXCLUSIVO
                                  </span>
                                  {srv.destacado && (
                                    <span className="bg-amber-400 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                                      TOP SELECTION
                                    </span>
                                  )}
                                </div>
                                <button onClick={(e) => toggleLike(srv.id, e)}
                                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-75 transition-transform">
                                  <Heart size={14} className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                                </button>
                                <div className="absolute bottom-3 left-4 right-4 text-white">
                                  <h4 className="text-base font-black tracking-tight">{srv.nombre}</h4>
                                  {srv.descripcion && (
                                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5 font-light">{srv.descripcion}</p>
                                  )}
                                </div>
                              </div>
                              <div className="p-3.5 flex items-center justify-between bg-white">
                                <div>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Inversión & Tiempo</span>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-base font-black" style={{ color: primario }}>{formatPrecio(srv)}</span>
                                    {srv.duracion_min && (
                                      <span className="text-xs text-gray-400 font-medium">· {formatDuracion(srv.duracion_min)}</span>
                                    )}
                                  </div>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); inCart ? removeFromCart(srv.id) : addToCart(srv); }}
                                  className="px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-white"
                                  style={{ background: inCart ? '#10b981' : primario }}>
                                  {inCart ? <><Check size={14} /> Seleccionado</> : <><Plus size={15} /> Reservar Look</>}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════
                        LAYOUT 3: BOUTIQUE STORY FEED (FOTO 100% INMERSIVA 3:4)
                    ════════════════════════════════════════════════════════════ */}
                    {viewMode === 'stories' && (
                      <div className="grid grid-cols-2 gap-3">
                        {serviciosVisibles.map(srv => {
                          const inCart = cart.some(i => i.servicio.id === srv.id);
                          const isLiked = likedIds[srv.id];

                          return (
                            <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                              className="h-64 rounded-[28px] overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all group shadow-md border border-gray-100">
                              <MediaCard srv={srv} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
                              
                              <button onClick={(e) => toggleLike(srv.id, e)}
                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-75 transition-transform z-10">
                                <Heart size={13} className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                              </button>

                              {srv.destacado && (
                                <span className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                                  HOT 🔥
                                </span>
                              )}

                              <div className="absolute bottom-3 left-3 right-3 text-white">
                                <h4 className="text-xs font-black line-clamp-2 leading-tight drop-shadow-sm">{srv.nombre}</h4>
                                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/20">
                                  <span className="text-xs font-black text-emerald-300">{formatPrecio(srv)}</span>
                                  <button onClick={(e) => { e.stopPropagation(); inCart ? removeFromCart(srv.id) : addToCart(srv); }}
                                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform shadow-xs"
                                    style={{ background: inCart ? '#10b981' : primario }}>
                                    {inCart ? <Check size={14} /> : <Plus size={15} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ════════════════════════════════════════════════════════════
                        LAYOUT 4: EXPRESS CLEAN MINIMAL (LISTA RÁPIDA DE RESERVA)
                    ════════════════════════════════════════════════════════════ */}
                    {viewMode === 'minimal' && (
                      <div className="space-y-2">
                        {serviciosVisibles.map(srv => {
                          const inCart = cart.some(i => i.servicio.id === srv.id);
                          const justAdded = addedId === srv.id;

                          return (
                            <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                              className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-2xs flex items-center gap-3 transition-all hover:border-gray-200 active:scale-[0.99] cursor-pointer group">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative">
                                <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-300" />
                              </div>
                              <div className="flex-1 min-w-0 pr-1">
                                <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">{srv.nombre}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs font-black" style={{ color: primario }}>{formatPrecio(srv)}</span>
                                  {srv.duracion_min && (
                                    <span className="text-[10px] text-gray-400">· {formatDuracion(srv.duracion_min)}</span>
                                  )}
                                </div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); inCart ? removeFromCart(srv.id) : addToCart(srv); }}
                                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 shadow-xs"
                                style={{ background: inCart ? '#10b981' : primario, color: 'white' }}>
                                {justAdded ? <Check size={15} /> : inCart ? <Check size={15} /> : <Plus size={16} />}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* ── FOOTER BRANDING (Visible solo en cuentas Free, Oculto en PRO) ── */}
            {!isWhiteLabel && (
              <div className="py-8 text-center border-t border-gray-100/60 mt-4 mb-2">
                <p className="text-[11px] font-bold text-gray-400 tracking-wide flex items-center justify-center gap-1.5">
                  Creado con <span className="text-rose-400">♥</span> por
                  <span className="font-black text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-[10px] tracking-wider uppercase">
                    KORAT FLOW
                  </span>
                </p>
                <p className="text-[10px] text-gray-400/80 mt-1">Carta digital interactiva & agendamiento para salones</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 7. MODAL LOOKBOOK / DETALLE DEL SERVICIO (CON SLIDER ANTES Y DESPUÉS PRO) ── */}
      <ServiceDetailModal
        srv={selectedServiceDetail}
        onClose={() => setSelectedServiceDetail(null)}
        primario={primario}
        inCart={Boolean(selectedServiceDetail && cart.some(i => i.servicio.id === selectedServiceDetail.id))}
        onToggleCart={(s) => {
          const inC = cart.some(i => i.servicio.id === s.id);
          inC ? removeFromCart(s.id) : addToCart(s);
        }}
        onWhatsApp={(srvNom) => {
          if (cfg?.telefono_whatsapp) {
            window.open(buildWhatsAppLink(srvNom), '_blank');
          }
        }}
        formatPrecio={formatPrecio}
        formatDuracion={formatDuracion}
        canAntesDespues={canAntesDespues}
      />

      {/* ── 8. MODAL DE BÚSQUEDA SPOTLIGHT ────────────────────────── */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        servicios={todosLosServicios}
        primario={primario}
        cart={cart}
        addToCart={addToCart}
        removeFromCart={removeFromCart}
      />

      {/* ── 9. CARRITO Y AGENDAMIENTO ONLINE EN VIVO ──────────────── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs" onClick={() => setShowCart(false)} />
            
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] p-5 pb-8 bg-white shadow-2xl border-t border-gray-100 max-h-[92vh] flex flex-col">
              
              <div className="w-12 h-1.5 rounded-full bg-gray-200 mx-auto mb-4" />
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  {agendaMode && (
                    <button onClick={() => setAgendaMode(false)} className="p-1 rounded-lg text-gray-500 hover:bg-gray-100">
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  <div>
                    <h3 className="text-base font-black text-gray-900">
                      {bookingSuccess ? '¡Cita Reservada!' : agendaMode ? 'Elige tu Horario Online' : 'Tu Selección'}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {bookingSuccess
                        ? 'Registrada exitosamente en el salón'
                        : `${cart.length} ${cart.length === 1 ? 'servicio' : 'servicios'} agregados · ${formatDuracion(totalDuracion)}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowCart(false); setBookingSuccess(false); setAgendaMode(false); }}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <X size={16} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Tu carrito está vacío</p>
                  <p className="text-xs mt-0.5">Agrega servicios para cotizar y agendar tu cita.</p>
                </div>
              ) : bookingSuccess ? (
                /* Pantalla de Confirmación de Cita */
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-gray-900">¡Tu cita quedó agendada!</h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                      Te esperamos el <span className="font-bold text-gray-800">{selectedFecha}</span> a las <span className="font-bold text-gray-800">{selectedHora}</span>.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left text-xs space-y-1.5 max-w-xs mx-auto">
                    <p className="text-gray-400 font-bold uppercase text-[10px]">Detalle</p>
                    <p className="font-bold text-gray-800">{cart.map(i => i.servicio.nombre).join(' + ')}</p>
                    <p className="text-emerald-700 font-black">Total: S/. {totalPrecio.toFixed(2)}</p>
                  </div>
                  <button onClick={() => { setShowCart(false); setCart([]); setBookingSuccess(false); setAgendaMode(false); }}
                    className="w-full max-w-xs py-3.5 rounded-2xl font-black text-white text-sm mx-auto shadow-md"
                    style={{ background: primario }}>
                    Listo, entendido ✨
                  </button>
                </div>
              ) : agendaMode ? (
                /* ── MODO AGENDAMIENTO CON HORARIOS EN VIVO ── */
                <div className="flex-1 overflow-y-auto py-3 space-y-4">
                  
                  {/* Selector de Fecha (Píldoras) */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <CalendarIcon size={14} style={{ color: primario }} /> Selecciona el día
                    </label>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {diasDisponibles.map(dia => {
                        const isSel = selectedFecha === dia.iso;
                        return (
                          <button
                            key={dia.iso}
                            onClick={() => { setSelectedFecha(dia.iso); setSelectedHora(''); }}
                            className={`flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded-2xl border transition-all active:scale-95 ${
                              isSel ? 'border-transparent text-white shadow-xs' : 'border-gray-100 bg-gray-50 text-gray-700 hover:bg-gray-100'
                            }`}
                            style={{ background: isSel ? primario : undefined }}>
                            <span className="text-[10px] uppercase font-bold tracking-wider">{dia.diaSemana}</span>
                            <span className="text-xs font-black mt-0.5">{dia.fechaLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horarios Disponibles Sincronizados */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <Clock size={14} style={{ color: primario }} /> Horarios Disponibles
                      </label>
                      <span className="text-[10px] text-gray-400 font-semibold">
                        {loadingSlots ? 'Consultando agenda...' : `Duración: ${formatDuracion(totalDuracion)}`}
                      </span>
                    </div>

                    {loadingSlots ? (
                      <div className="py-8 flex justify-center items-center gap-2 text-xs text-gray-400">
                        <Loader2 size={16} className="animate-spin" /> Verificando disponibilidad en vivo...
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                        {horariosDisponibles.map(slot => {
                          const isSelected = selectedHora === slot.hora;
                          return (
                            <button
                              key={slot.hora}
                              disabled={!slot.libre}
                              onClick={() => setSelectedHora(slot.hora)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                                !slot.libre
                                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                                  : isSelected
                                    ? 'text-white shadow-xs scale-98'
                                    : 'bg-white border border-gray-200 text-gray-800 hover:border-gray-400'
                              }`}
                              style={{ background: isSelected && slot.libre ? primario : undefined }}>
                              {slot.hora}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Datos de la clienta (Pase con Celular) */}
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Phone size={13} style={{ color: primario }} /> Tu Celular / WhatsApp *
                        </label>
                        {buscandoClienta && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" /> Verificando...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Selector / Badge de Código de País (Perú +51 por defecto) */}
                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 text-xs font-bold text-gray-700 shrink-0 select-none">
                          <span className="text-base leading-none">🇵🇪</span>
                          <span>+51</span>
                        </div>

                        {/* Input de Número Local */}
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            placeholder="987 654 321"
                            value={clienteTelefono}
                            onChange={e => handleTelefonoChange(e.target.value)}
                            className={`w-full bg-gray-50 border rounded-2xl px-4 py-3 text-sm font-semibold outline-none transition-all ${
                              clientaEncontrada 
                                ? 'border-emerald-300 bg-emerald-50/20 text-gray-900 ring-2 ring-emerald-500/10' 
                                : 'border-gray-200 focus:border-rose-400 text-gray-900'
                            }`}
                          />
                          {clientaEncontrada && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 pl-1">
                        Formato con código internacional: <span className="font-semibold text-gray-600">+51</span> {clienteTelefono || '981482289'}
                      </p>
                    </div>

                    {/* Estado: Clienta Recurrente (Bienvenida personalizada) */}
                    {clientaEncontrada ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-black text-xs">
                          <span>✨</span> ¡Hola de nuevo, {clienteNombre.split(' ')[0]}!
                        </div>
                        <p className="text-[11px] text-emerald-700 leading-snug">
                          Te reconocimos en el sistema. Ya no necesitas volver a escribir todos tus datos.
                        </p>
                      </div>
                    ) : (
                      /* Estado: Clienta Nueva (Pide su Nombre) */
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <User size={13} style={{ color: primario }} /> ¿Cuál es tu nombre? *
                        </label>
                        <input
                          type="text"
                          placeholder="Tu nombre y apellido"
                          value={clienteNombre}
                          onChange={e => setClienteNombre(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:border-rose-400 text-gray-900 transition-colors"
                        />
                        <p className="text-[10px] text-gray-400 pl-1">
                          Te guardaremos en el sistema para que tus próximas citas sean con 1 solo toque.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Botón de Confirmación */}
                  <button
                    onClick={handleConfirmarCita}
                    disabled={bookingSaving || !selectedHora || !clienteNombre.trim()}
                    className="w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all disabled:opacity-50"
                    style={{ background: '#25D366' }}>
                    {bookingSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                    Confirmar y Agendar por WhatsApp
                  </button>
                </div>
              ) : (
                /* ── MODO RESUMEN DEL CARRITO ── */
                <>
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-50 py-3 space-y-2">
                    {cart.map(item => (
                      <div key={item.servicio.id} className="flex items-center justify-between pt-2">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-sm font-bold text-gray-900 truncate">{item.servicio.nombre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs font-black" style={{ color: primario }}>{formatPrecio(item.servicio)}</p>
                            {item.servicio.duracion_min && (
                              <span className="text-[10px] text-gray-400">· {formatDuracion(item.servicio.duracion_min)}</span>
                            )}
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.servicio.id)} className="text-gray-300 hover:text-rose-500 p-1">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-gray-400 block">Total Estimado</span>
                        <span className="text-xs font-semibold text-gray-500">{formatDuracion(totalDuracion)}</span>
                      </div>
                      <span className="text-2xl font-black text-gray-900">
                        {totalPrecio > 0 ? `S/. ${totalPrecio.toFixed(2)}` : 'A consultar'}
                      </span>
                    </div>

                    {/* ✨ Plan PRO: Agendar Cita Sincronizada con Horarios en Vivo */}
                    {canDirectBooking ? (
                      <>
                        <button
                          onClick={() => setAgendaMode(true)}
                          className="w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                          style={{ background: primario }}>
                          <CalendarIcon size={17} /> Elegir Horario y Agendar Cita Online
                        </button>

                        <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl font-bold text-gray-600 hover:text-gray-900 text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-colors">
                          <Phone size={13} /> O consultar directamente por WhatsApp
                        </a>
                      </>
                    ) : (
                      /* 🟢 Plan Free: Enviar Selección y Consulta directa por WhatsApp */
                      <a
                        href={buildWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                        style={{ background: '#25D366' }}>
                        <Phone size={17} /> Reservar / Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 9B. FLOATING ACTION CHECKOUT BAR (ESTILO UBER / FRESHA) ── */}
      <AnimatePresence>
        {cart.length > 0 && !showCart && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-[68px] left-3 right-3 z-30 max-w-lg mx-auto"
          >
            <div
              onClick={() => {
                setShowCart(true);
                if (canDirectBooking) setAgendaMode(true);
              }}
              className="p-3 rounded-2xl shadow-xl flex items-center justify-between text-white cursor-pointer active:scale-[0.98] transition-transform border border-white/20 backdrop-blur-md"
              style={{ background: `linear-gradient(135deg, ${primario} 0%, #111827 100%)` }}
            >
              <div className="flex items-center gap-3 pl-1">
                <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center font-black text-sm shadow-xs border border-white/20">
                  {cart.length}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black leading-tight">
                      {cart.length === 1 ? '1 servicio seleccionado' : `${cart.length} servicios en tu cita`}
                    </p>
                    {totalPrecio >= 100 && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-black px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                        <Sparkles size={9} /> SESIÓN VIP
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/85 font-medium mt-0.5">
                    Total: <strong className="text-white font-black">S/. {totalPrecio.toFixed(2)}</strong> · {formatDuracion(totalDuracion)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white text-gray-900 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md">
                <span>{canDirectBooking ? 'Elegir Horario' : 'Ver Selección'}</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 10. BOTTOM NAVIGATION BAR ESTILO APP NATIVA ───────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 px-6 py-2.5 flex items-center justify-around">
        <button
          onClick={() => { setActiveNavTab('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-black tracking-wider uppercase transition-colors ${
            activeNavTab === 'menu' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}>
          <Home size={20} />
          MENÚ
        </button>

        <button
          onClick={() => setShowSearchModal(true)}
          className="flex flex-col items-center gap-1 text-[10px] font-black tracking-wider uppercase transition-colors text-gray-400 hover:text-gray-600">
          <Search size={20} />
          BUSCAR
        </button>

        <button
          onClick={() => { setActiveNavTab('promos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 text-[10px] font-black tracking-wider uppercase transition-colors ${
            activeNavTab === 'promos' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}>
          <Gift size={20} />
          OFERTAS
        </button>

        <button
          onClick={() => { setShowCart(true); setAgendaMode(false); }}
          className={`relative flex flex-col items-center gap-1 text-[10px] font-black tracking-wider uppercase transition-colors ${
            cart.length > 0 ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}>
          <ShoppingBag size={20} />
          {cart.length > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {cart.length}
            </span>
          )}
          CARRITO
        </button>
      </nav>

      {/* Global CSS for hide scrollbar */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
};

export default CartaPublica;

