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
  CartaPromoMes, CartaOfertaSemana, CartaPromoDia,
  CARTA_PALETAS, CartaLayoutEstilo
} from '../types';
import { cartaPublica } from '../services/api.js';
import { supabase } from '../services/supabase';
import { resolveServiceMediaAndDesc, DEFAULT_PROMO_MES, DEFAULT_OFERTA_SEMANA } from '../services/beautyTemplates';
import { AddToHomeScreen } from '../components/Carta/AddToHomeScreen';
import halloweenBg from '../assets/themes/halloween_glam_bg.jpg';
import christmasBg from '../assets/themes/christmas_luxe_bg.jpg';

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
      </div>

      {/* Línea divisoria y manija */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-xl pointer-events-none z-20"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-2xl flex items-center justify-center text-gray-800 border border-gray-200">
          <Sliders size={14} />
        </div>
      </div>

      {/* Indicador interactivo superior centrado sin solapamientos */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white border border-white/20 pointer-events-none flex items-center gap-2 shadow-xl z-20">
        <span className="text-gray-300">ANTES</span>
        <span className="text-amber-400 font-black text-xs">↔️</span>
        <span className="text-gray-300">DESPUÉS</span>
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

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const allMediaImages = [
    srv.media_url,
    ...(srv.galeria || [])
  ].filter(Boolean) as string[];

  const currentMediaUrl = allMediaImages[activeMediaIndex] || srv.media_url;

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

          {/* Imagen Grande o Slider Antes/Después si está configurado (Optimizado a proporción 3:4) */}
          <div className="relative w-full aspect-[3/4] max-h-[52vh] sm:max-h-[380px] bg-gray-100 shrink-0 overflow-hidden">
            {hasAntesDespues ? (
              <AntesDespuesSlider
                antesUrl={srv.antes_despues!.foto_antes!}
                despuesUrl={srv.antes_despues!.foto_despues!}
                className="w-full h-full"
              />
            ) : currentMediaUrl ? (
              srv.media_tipo === 'video' && activeMediaIndex === 0 ? (
                <MediaCard srv={srv} className="w-full h-full object-cover" />
              ) : (
                <img src={currentMediaUrl} alt={srv.nombre} className="w-full h-full object-cover transition-all duration-300" />
              )
            ) : (
              <MediaCard srv={srv} className="w-full h-full object-cover" />
            )}
            
            {/* Galería de miniaturas flotantes si tiene más de 1 foto */}
            {allMediaImages.length > 1 && !hasAntesDespues && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full z-10">
                {allMediaImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`h-2 rounded-full transition-all ${activeMediaIndex === idx ? 'w-5 bg-white' : 'w-2 bg-white/40'}`}
                  />
                ))}
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            
            {/* Botón Cerrar */}
            <button onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-all z-10">
              <X size={18} />
            </button>

            {/* Badges en la foto */}
            {srv.destacado && (
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md">
                  ★ MÁS SOLICITADO
                </span>
              </div>
            )}

            {/* Título sobre imagen */}
            <div className="absolute bottom-4 left-5 right-5 text-white pointer-events-none">
              <h3 className="text-xl font-black leading-tight drop-shadow-md">{srv.nombre}</h3>
              <div className="flex items-center gap-2 mt-1 text-xs flex-wrap">
                <span className="font-bold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
                  ⏱️ {formatDuracion(srv.duracion_min || 45)}
                </span>
                <span className="font-black text-emerald-300 text-sm">
                  {formatPrecio(srv)}
                </span>
                {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
                  <span className="line-through text-white/70 text-xs font-semibold">
                    S/ {Number(srv.precio_original).toFixed(2)}
                  </span>
                )}
                {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
                  <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-md shadow-xs">
                    {Math.round(((srv.precio_original - srv.precio) / srv.precio_original) * 100)}% OFF
                  </span>
                )}
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

            {/* Galería de fotos del Lookbook */}
            {allMediaImages.length > 1 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Resultados y Trabajos Reales</p>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {allMediaImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        activeMediaIndex === idx ? 'border-rose-500 scale-105 shadow-md' : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

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
  const [showFomoModal, setShowFomoModal] = useState(false);
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
  const [codigoPais, setCodigoPais] = useState('51'); // Por defecto Perú (+51)
  const [buscandoClienta, setBuscandoClienta] = useState(false);
  const [clientaEncontrada, setClientaEncontrada] = useState<boolean>(false);
  const [clienteIdRegistrado, setClienteIdRegistrado] = useState<number | null>(null);
  const [editandoPerfilVip, setEditandoPerfilVip] = useState(false);
  const [citasDelDia, setCitasDelDia] = useState<CitaExistente[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookedCitaDetails, setBookedCitaDetails] = useState<{
    id?: number | string;
    servicios: string;
    fecha: string;
    hora: string;
    duracion: string;
    precio: number;
    cliente: string;
    telefono: string;
    waLink: string;
  } | null>(null);

  // Estado para sorpresa interactiva al tocar la calabaza animada (Halloween)
  const [showPumpkinMessage, setShowPumpkinMessage] = useState(false);

  const tabsRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // ─── Colores y estilo temático ────────────────────────────────
  const cfg = data?.config;
  const paleta = cfg?.paleta || 'rose';
  
  // Modo estacional festivo (Halloween Glam / Navidad Luxe)
  const temaEstacional = cfg?.tema_estacional || 'normal';
  const isHalloween = temaEstacional === 'halloween';
  const isNavidad = temaEstacional === 'navidad';
  const showAnimaciones = (cfg?.efectos_animados ?? true) && (isHalloween || isNavidad);

  // Colores dinámicos adaptados según temporada si está activa
  const primario = isHalloween
    ? '#c2410c' // Naranja calabaza profundo (elegante, no caricaturesco)
    : isNavidad
    ? '#b45309' // Oro ámbar cálido
    : cfg?.color_primario || CARTA_PALETAS[paleta as keyof typeof CARTA_PALETAS]?.primario || '#f43f5e';

  // Acento secundario para badges / highlights temáticos (reservado para cards de promo)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _acento = isHalloween
    ? '#7c3aed' // Violeta oscuro sutil
    : isNavidad
    ? '#b91c1c' // Rojo navideño
    : primario;

  // ─── Permisos PRO del Negocio (Habilitados desde SuperAdmin, Plan Pro o Configuración Activa) ──
  const planNegocio = (data?.negocio?.plan_suscripcion || '').toLowerCase();
  const planSaas = (data?.negocio?.recursos_saas?.plan || data?.negocio?.recursos_saas?.plan_base || '').toLowerCase();
  const modCartaDigital = data?.negocio?.recursos_saas?.modulos?.carta_digital;
  const isPlanPro = planNegocio.includes('pro') || planNegocio.includes('elite') || planNegocio.includes('copilot') ||
                    planSaas.includes('pro') || planSaas.includes('elite') || planSaas.includes('copilot');

  // Si el SuperAdmin le habilitó individualmente la sub-pestaña, si tiene plan Pro, o si viene configurado directamente en carta_config
  const canDirectBooking = isPlanPro || modCartaDigital?.sub_pestanas?.agendamiento_directo === true || (modCartaDigital?.sub_pestanas?.agendamiento_directo !== false);
  const canFomoCountdown = isPlanPro || modCartaDigital?.sub_pestanas?.fomo_countdown === true || Boolean(cfg?.fomo_banner?.activo);
  const canAntesDespues = isPlanPro || modCartaDigital?.sub_pestanas?.antes_despues === true || true;
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

  // ─── Carga de datos de la Carta y reconocimiento del cliente ───
  useEffect(() => {
    if (!businessId) return;

    // Recuperar datos previos de la clienta (desde URL si viene de WhatsApp o desde LocalStorage)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlPhone = searchParams.get('phone') || searchParams.get('tel') || searchParams.get('whatsapp');
      const urlName = searchParams.get('name') || searchParams.get('nombre');

      const savedPhone = urlPhone || localStorage.getItem(`nilah_client_phone_${businessId}`);
      const savedName = urlName || localStorage.getItem(`nilah_client_name_${businessId}`);

      if (savedPhone) {
        let cleanNumber = savedPhone.replace(/\D/g, '');
        if (cleanNumber.startsWith('51') && cleanNumber.length > 9) {
          cleanNumber = cleanNumber.slice(2);
        }
        setClienteTelefono(cleanNumber);
        setClientaEncontrada(true);
      }
      if (savedName) {
        setClienteNombre(savedName);
      }
    } catch (e) {}

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

      const { data: newCitaData, error: citaInsertErr } = await supabase
        .from('Citas')
        .insert([{
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
        }])
        .select('id')
        .single();

      if (citaInsertErr) {
        console.warn('Advertencia insertando cita:', citaInsertErr);
      }

      // Guardar en memoria del navegador para futuras visitas sin tener que escribirlo de nuevo
      try {
        if (fullPhone && businessId) {
          localStorage.setItem(`nilah_client_phone_${businessId}`, fullPhone);
          if (clienteNombre.trim()) {
            localStorage.setItem(`nilah_client_name_${businessId}`, clienteNombre.trim());
          }
        }
      } catch (e) {}

      // Formatear texto de WhatsApp natural y cercano (Opción 3)
      const phone = cfg?.telefono_whatsapp?.replace(/\D/g, '') || '';
      const duracionFmt = formatDuracion(totalDuracion) || '30 min';
      const msg = `Hola, acabo de reservar mi espacio:

📅 Fecha: ${selectedFecha} a las ${selectedHora}
💅 Servicios: ${serviciosNombres}
⏱️ Duración: ${duracionFmt}
💰 Total: S/. ${totalPrecio.toFixed(2)}
👤 Nombre: ${clienteNombre.trim()}

¡Ya tengo mi horario listo, nos vemos! ✨`;

      const generatedWaLink = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : '';

      setBookedCitaDetails({
        id: newCitaData?.id,
        servicios: serviciosNombres,
        fecha: selectedFecha,
        hora: selectedHora,
        duracion: duracionFmt,
        precio: totalPrecio,
        cliente: clienteNombre.trim(),
        telefono: fullPhone,
        waLink: generatedWaLink
      });

      setBookingSuccess(true);

      // 3. Abrir mensaje de WhatsApp preformateado
      if (generatedWaLink) {
        window.open(generatedWaLink, '_blank');
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
      ? `Hola, me interesa la promo: ${extra}`
      : `Hola, me gustaría reservar cita para: ${serviciosNombres || 'un servicio'} · Total aprox: S/. ${totalPrecio.toFixed(2)}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }, [cart, cfg?.telefono_whatsapp, totalPrecio]);

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

    const listaBase = [
      ...categoriasEnriquecidas,
      ...(sinCategoriaEnriquecida.length > 0 ? [{ id: '__sin_cat__', nombre: 'Otros', emoji: '✨', servicios: sinCategoriaEnriquecida } as any] : [])
    ];

    return listaBase;
  }, [data]);

  const todosLosServicios = useMemo(() => {
    return todasCategorias.flatMap(c => c.servicios || []);
  }, [todasCategorias]);

  const serviciosDestacados = useMemo(() => {
    const rawDestacados = todosLosServicios.filter(s => s.destacado);
    // Si no está guardado aún en DB, aplicar por defecto rotación automática ON y máximo 3 visibles
    const ofConfig = cfg?.ofertas_dia_config;
    const isAutoRotar = ofConfig ? (ofConfig.rotacion_automatica ?? true) : true;
    const cantidadVisibles = ofConfig?.cantidad_visibles || 3;

    // Si la rotación automática está encendida y hay servicios en el pool
    if (isAutoRotar && rawDestacados.length > 0) {
      const cantidad = Math.max(1, Math.min(rawDestacados.length, cantidadVisibles));
      if (rawDestacados.length <= cantidad) {
        return rawDestacados;
      }

      // Algoritmo Determinístico basado en la fecha del cliente (YYYY-MM-DD)
      const now = new Date();
      // Día del año (1 a 366)
      const startOfYear = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      // Desplazamiento rotativo del día
      const startIndex = dayOfYear % rawDestacados.length;
      const rotated: CartaServicio[] = [];
      for (let i = 0; i < cantidad; i++) {
        rotated.push(rawDestacados[(startIndex + i) % rawDestacados.length]);
      }
      return rotated;
    }

    return rawDestacados;
  }, [todosLosServicios, cfg?.ofertas_dia_config]);

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

  // Promo del Mes: Si el salón la configuró, usarla. De lo contrario, usar demo solo si no está explícitamente desactivada
  const rawPromoMes = cfg?.promo_mes;
  const isPromoMesVigente = rawPromoMes?.activa && isOfertaVigente(rawPromoMes.expira_en);
  const effectivePromoMes: CartaPromoMes = rawPromoMes?.titulo
    ? { ...rawPromoMes, activa: Boolean(isPromoMesVigente) }
    : DEFAULT_PROMO_MES;

  // Oferta / Combo de la Semana: Si el salón la configuró, respetar su estado y expiración
  const rawOfertaSemana = cfg?.oferta_semana;
  const isOfertaSemanaVigente = rawOfertaSemana?.activa && isOfertaVigente(rawOfertaSemana.expira_en);
  const effectiveOfertaSemana: CartaOfertaSemana = rawOfertaSemana?.titulo
    ? { ...rawOfertaSemana, activa: Boolean(isOfertaSemanaVigente) }
    : DEFAULT_OFERTA_SEMANA;

  const promoMesActiva = effectivePromoMes.activa && isOfertaVigente(effectivePromoMes.expira_en);
  const ofertaActiva = effectiveOfertaSemana.activa && isOfertaVigente(effectiveOfertaSemana.expira_en);

  // ── SVG Doodle Pattern (Halloween + Cute Skulls + Pumpkins + Belleza) — tile 240x240 —
  const halloweenDoodleSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' opacity='0.9'>
    <!-- 1. Calavera Cute #1 (Top-Left) -->
    <g stroke='%237c3aed' stroke-width='1.5' fill='none'>
      <!-- Cabeza redondita kawaii -->
      <path d='M25,28 C15,28 12,38 12,46 C12,54 18,57 21,57 L21,63 C21,65 29,65 29,63 L29,57 C32,57 38,54 38,46 C38,38 35,28 25,28 Z'/>
      <!-- Dientitos tiernos -->
      <line x1='25' y1='58' x2='25' y2='63'/>
      <!-- Ojos tiernos (grandes redondos) -->
      <circle cx='20' cy='43' r='3.2' fill='%237c3aed'/>
      <circle cx='30' cy='43' r='3.2' fill='%237c3aed'/>
      <!-- Nariz corazón invertido cute -->
      <path d='M25,48 L23.5,51 L26.5,51 Z' fill='%237c3aed'/>
      <!-- Mini moño o brillito de belleza en cabeza -->
      <circle cx='34' cy='32' r='2' fill='%23c2410c' stroke='none'/>
    </g>

    <!-- 2. Calabaza Cute #1 (Top-Center) -->
    <g stroke='%23c2410c' stroke-width='1.5' fill='none'>
      <ellipse cx='120' cy='35' rx='14' ry='12'/>
      <path d='M113,27 Q120,35 113,43' stroke-width='1.1'/>
      <path d='M127,27 Q120,35 127,43' stroke-width='1.1'/>
      <!-- Tronquito y hojita con curva elegante -->
      <path d='M120,23 C120,18 123,16 126,17' stroke='%23604020' stroke-width='2' stroke-linecap='round'/>
      <circle cx='127' cy='18' r='1.5' fill='%2315803d' stroke='none'/>
      <!-- Ojitos kawaii sonrientes ^ ^ -->
      <path d='M115,34 Q117,31 119,34' stroke='%23c2410c' stroke-width='1.4' stroke-linecap='round'/>
      <path d='M121,34 Q123,31 125,34' stroke='%23c2410c' stroke-width='1.4' stroke-linecap='round'/>
      <path d='M118,39 Q120,41 122,39' stroke='%23c2410c' stroke-width='1.3' stroke-linecap='round'/>
    </g>

    <!-- 3. Luna creciente mística con estrellas (Top-Right) -->
    <path d='M205,18 A16,16 0 1,1 184,34 A12,12 0 1,0 205,18 Z' fill='%237c3aed'/>
    <path d='M220,32 L221.5,37 L226.5,38.5 L221.5,40 L220,45 L218.5,40 L213.5,38.5 L218.5,37 Z' fill='%23c2410c'/>

    <!-- 4. Tijeras de estilista con murciélago sutil (Mid-Right) -->
    <circle cx='215' cy='105' r='7' fill='none' stroke='%237c3aed' stroke-width='1.8'/>
    <circle cx='202' cy='117' r='7' fill='none' stroke='%237c3aed' stroke-width='1.8'/>
    <line x1='210' y1='111' x2='205' y2='111' stroke='%237c3aed' stroke-width='2.2' stroke-linecap='round'/>
    <line x1='210' y1='105' x2='185' y2='85' stroke='%237c3aed' stroke-width='1.8' stroke-linecap='round'/>
    <line x1='202' y1='117' x2='182' y2='132' stroke='%237c3aed' stroke-width='1.8' stroke-linecap='round'/>

    <!-- 5. Fantasmita Cute / Spooky chic (Mid-Center) -->
    <g fill='none' stroke='%237c3aed' stroke-width='1.4'>
      <path d='M120,95 C112,95 110,105 110,115 C110,123 113,121 115,124 C117,127 119,122 121,124 C123,126 126,122 128,124 C130,122 130,115 130,115 C130,105 128,95 120,95 Z'/>
      <!-- Ojos y rubor -->
      <circle cx='116' cy='105' r='1.8' fill='%237c3aed'/>
      <circle cx='124' cy='105' r='1.8' fill='%237c3aed'/>
      <ellipse cx='114' cy='109' rx='1.8' ry='1' fill='%23f97316' opacity='0.7' stroke='none'/>
      <ellipse cx='126' cy='109' rx='1.8' ry='1' fill='%23f97316' opacity='0.7' stroke='none'/>
    </g>

    <!-- 6. Labial Glam & Corazón (Mid-Left) -->
    <rect x='28' y='110' width='8' height='15' rx='2' fill='none' stroke='%23c2410c' stroke-width='1.6'/>
    <path d='M28,110 Q32,103 36,110' fill='%23c2410c'/>
    <path d='M50,112 C50,108 45,105 42,108 C39,112 42,117 50,123 C58,117 61,112 58,108 C55,105 50,108 50,112 Z' fill='%23c2410c'/>

    <!-- 7. Tela de araña elegante (Bottom-Left) -->
    <line x1='0' y1='228' x2='44' y2='184' stroke='%237c3aed' stroke-width='1.2' stroke-linecap='round'/>
    <line x1='0' y1='210' x2='30' y2='180' stroke='%237c3aed' stroke-width='1.2' stroke-linecap='round'/>
    <line x1='0' y1='240' x2='60' y2='180' stroke='%237c3aed' stroke-width='1.2' stroke-linecap='round'/>
    <path d='M15,208 A26,26 0 0,1 42,180' fill='none' stroke='%237c3aed' stroke-width='1.2'/>
    <path d='M8,218 A40,40 0 0,1 48,178' fill='none' stroke='%237c3aed' stroke-width='1' opacity='0.7'/>

    <!-- 8. Calavera Cute #2 (Bottom-Center Right) -->
    <g stroke='%23c2410c' stroke-width='1.5' fill='none'>
      <path d='M175,178 C167,178 164,186 164,192 C164,198 169,200 171,200 L171,205 C171,207 179,207 179,205 L179,200 C181,200 186,198 186,192 C186,186 183,178 175,178 Z'/>
      <line x1='175' y1='201' x2='175' y2='205'/>
      <!-- Ojitos de corazón cute <3 <3 -->
      <path d='M170,187 C169,185 167,185 166.5,187 C166,189 168,191 170,192.5 C172,191 174,189 173.5,187 C173,185 171,185 170,187 Z' fill='%23c2410c' stroke='none'/>
      <path d='M180,187 C179,185 177,185 176.5,187 C176,189 178,191 180,192.5 C182,191 184,189 183.5,187 C183,185 181,185 180,187 Z' fill='%23c2410c' stroke='none'/>
    </g>

    <!-- 9. Calabaza Sonriente Clásica (Bottom-Center Left) -->
    <g stroke='%23c2410c' stroke-width='1.6' fill='none'>
      <ellipse cx='105' cy='198' rx='15' ry='12'/>
      <path d='M97,190 Q105,198 97,206' stroke-width='1.1'/>
      <path d='M113,190 Q105,198 113,206' stroke-width='1.1'/>
      <path d='M105,186 L105,180' stroke='%23604020' stroke-width='2.2' stroke-linecap='round'/>
      <!-- Ojitos triangulares amigables -->
      <polygon points='99,194 96,198 102,198' fill='%23c2410c' stroke='none'/>
      <polygon points='111,194 108,198 114,198' fill='%23c2410c' stroke='none'/>
      <!-- Sonrisa zig-zag de calabaza -->
      <path d='M99,203 L102,201 L105,203 L108,201 L111,203' stroke='%23c2410c' stroke-width='1.4' fill='none' stroke-linecap='round'/>
    </g>

    <!-- 10. Esmalte de uñas Chic (Bottom-Right) -->
    <rect x='210' y='180' width='13' height='22' rx='3' fill='none' stroke='%237c3aed' stroke-width='1.8'/>
    <rect x='213' y='173' width='7' height='9' rx='2' fill='none' stroke='%237c3aed' stroke-width='1.4'/>
    <line x1='210' y1='189' x2='223' y2='189' stroke='%237c3aed' stroke-width='1.4'/>

    <!-- 11. Murciélago silueta cute (Mid-Left Superior) -->
    <path d='M70,68 C74,62 82,64 85,71 C82,72 79,74 77.5,78 C76,74 73,72 70,71 Z' fill='%232d1a4e'/>
    <path d='M85,71 C88,64 96,62 100,68 C97,71 94,74 92.5,78 C91,74 88,72 85,71 Z' fill='%232d1a4e'/>

    <!-- 12. Puntos y destellos de textura estética -->
    <circle cx='68' cy='22' r='2.8' fill='%23c2410c'/>
    <circle cx='160' cy='48' r='2.2' fill='%237c3aed'/>
    <circle cx='180' cy='135' r='2' fill='%23c2410c'/>
    <circle cx='55' cy='156' r='2.5' fill='%237c3aed'/>
    <circle cx='85' cy='140' r='1.8' fill='%23c2410c'/>
    <circle cx='145' cy='150' r='2' fill='%237c3aed'/>
    <circle cx='70' cy='215' r='2.2' fill='%23c2410c'/>
    <circle cx='140' cy='220' r='2' fill='%237c3aed'/>
    <circle cx='230' cy='145' r='1.8' fill='%23c2410c'/>
  </svg>`;

  const doodleBgUrl = `url("data:image/svg+xml,${encodeURIComponent(halloweenDoodleSvg)}")`;

  return (
    <div className={`min-h-screen font-sans pb-32 antialiased selection:bg-rose-100 max-w-lg mx-auto shadow-2xl shadow-black/5 relative ${
      isHalloween
        ? 'bg-[#fdf8f4] text-gray-900'
        : isNavidad
        ? 'bg-[#fdfbf6] text-gray-900'
        : 'bg-[#faf9f6] text-gray-900'
    }`}>


      {/* ── DOODLE PATTERN BG (Halloween — WhatsApp-style repeat con calaveras cute + calabazas) ── */}
      {isHalloween && (
        <div
          className="halloween-doodle-layer"
          style={{
            backgroundImage: doodleBgUrl,
            backgroundSize: '240px 240px',
            opacity: 0.08,
          }}
        />
      )}

      {/* ── BANDA DECORATIVA ESTACIONAL (Borde superior temático) ── */}
      {isHalloween && (
        <div
          className="fixed top-0 left-0 right-0 h-[3px] z-50 max-w-lg mx-auto"
          style={{ background: 'linear-gradient(90deg, #7c3aed, #c2410c 30%, #d97706 50%, #c2410c 70%, #7c3aed)' }}
        />
      )}
      {isNavidad && (
        <div
          className="fixed top-0 left-0 right-0 h-[3px] z-50 max-w-lg mx-auto"
          style={{ background: 'linear-gradient(90deg, #b91c1c, #b45309, #15803d, #b45309, #b91c1c)' }}
        />
      )}

      {/* ── EFECTOS FLOTANTES — Navidad + Halloween reducido ──────── */}
      {showAnimaciones && (
        <div className="fixed inset-0 pointer-events-none z-[47] overflow-hidden">

          {/* ── Navidad: copos ❄ + estrellas ⭐ + adornos 🎄 ── */}
          {isNavidad && (
            <>
              {[...Array(12)].map((_, i) => (
                <div
                  key={`snow-${i}`}
                  className="seasonal-snowflake"
                  style={{
                    left: `${(i * 8 + 2) % 94}%`,
                    ['--dur' as string]: `${6 + (i % 5) * 1.8}s`,
                    animationDelay: `${(i % 6) * 1.1}s`,
                    fontSize: `${12 + (i % 4) * 5}px`,
                  }}
                >
                  ❄️
                </div>
              ))}
              {[...Array(7)].map((_, i) => (
                <div
                  key={`star-${i}`}
                  className="seasonal-star"
                  style={{
                    left: `${(i * 13 + 5) % 90}%`,
                    top: `${12 + (i % 4) * 22}%`,
                    ['--dur' as string]: `${2.5 + (i % 3) * 1.2}s`,
                    animationDelay: `${i * 0.8}s`,
                    fontSize: `${10 + (i % 3) * 7}px`,
                  }}
                >
                  {i % 3 === 0 ? '⭐' : i % 3 === 1 ? '✨' : '🌟'}
                </div>
              ))}
              {[...Array(4)].map((_, i) => (
                <div
                  key={`orn-${i}`}
                  className="seasonal-ornament"
                  style={{
                    left: `${15 + i * 22}%`,
                    top: `${2 + (i % 2) * 3}%`,
                    ['--dur' as string]: `${3.5 + i * 0.8}s`,
                    animationDelay: `${i * 1.2}s`,
                    fontSize: `${16 + (i % 2) * 8}px`,
                  }}
                >
                  {i % 2 === 0 ? '🎄' : '🎁'}
                </div>
              ))}
            </>
          )}

          {/* ── Halloween: solo 2 murciélagos sutiles
               (el doodle pattern enriquecido + araña desde el botón son los protagonistas) ── */}
          {isHalloween && (
            <>
              {[...Array(2)].map((_, i) => (
                <div
                  key={`bat-${i}`}
                  className="seasonal-bat"
                  style={{
                    top: `${14 + i * 20}%`,
                    ['--dur' as string]: `${12 + i * 4}s`,
                    animationDelay: `${i * 6}s`,
                    fontSize: `${16 + i * 6}px`,
                  }}
                >
                  🦇
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── 🎃 CARA DE CALABAZA ASOMÁNDOSE DESDE EL BORDE DERECHO DE LA PANTALLA ── */}
      {isHalloween && showAnimaciones && (
        <div className="halloween-pumpkin-screen-peeker">
          <div
            onClick={() => setShowPumpkinMessage(prev => !prev)}
            title="¡Buu! 🎃 Tócame"
            className="relative group"
          >
            {/* Globo de mensaje divertido si le hacen tap */}
            <AnimatePresence>
              {showPumpkinMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.7, x: -20 }}
                  className="absolute left-[85%] top-1/2 -translate-y-1/2 ml-2 bg-gradient-to-r from-orange-600 to-purple-800 text-white px-3 py-1.5 rounded-2xl shadow-2xl border border-orange-300/40 text-[11px] font-black whitespace-nowrap z-50 flex items-center gap-1.5 backdrop-blur-md"
                >
                  <span>¡Te vi! ¿Lista para brillar?</span> 🎃✨
                </motion.div>
              )}
            </AnimatePresence>

            {/* SVG Cara de Calabaza Asomándose desde el borde izquierdo */}
            <svg
              width="58"
              height="68"
              viewBox="0 0 60 70"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg transition-transform duration-300 group-hover:scale-110 -scale-x-100"
            >
              <defs>
                <linearGradient id="peekPumpkinGrad" x1="0" y1="0" x2="60" y2="70" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#fb923c" />
                  <stop offset="45%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
                <linearGradient id="peekStemGrad" x1="0" y1="0" x2="0" y2="15" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#14532d" />
                </linearGradient>
              </defs>

              {/* Tallo y zarcillo con inclinación pícara hacia la izquierda */}
              <path
                d="M26,18 C24,10 20,8 16,9 C18,13 21,17 23,19 Z"
                fill="url(#peekStemGrad)"
                stroke="#0f3d1e"
                strokeWidth="1"
              />
              <path
                d="M20,13 C16,11 13,14 14,17 C16,16 18,15 20,13 Z"
                fill="#4ade80"
              />

              {/* Cabeza de calabaza voluptuosa en ángulo de asomo */}
              {/* Lóbulo exterior izquierdo */}
              <ellipse cx="16" cy="40" rx="14" ry="19" fill="url(#peekPumpkinGrad)" stroke="#9a3412" strokeWidth="1.2" />
              {/* Lóbulo medio */}
              <ellipse cx="28" cy="40" rx="15" ry="21" fill="url(#peekPumpkinGrad)" stroke="#9a3412" strokeWidth="1.2" />
              {/* Lóbulo interior (cercano al borde derecho) */}
              <ellipse cx="42" cy="40" rx="14" ry="19" fill="url(#peekPumpkinGrad)" stroke="#9a3412" strokeWidth="1.2" />

              {/* Líneas de costilla/dimensión */}
              <path d="M21,21 Q14,40 21,59" stroke="#7c2d12" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
              <path d="M35,20 Q40,40 35,59" stroke="#7c2d12" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

              {/* Ojo izquierdo (el que más se asoma): pícaro, triangular con pupilita luminosa */}
              <polygon points="18,32 11,39 24,39" fill="#2d1a4e" />
              <circle cx="17" cy="36" r="2" fill="#fef08a" />
              <circle cx="18" cy="35" r="0.7" fill="#ffffff" />

              {/* Ojo derecho (ligeramente inclinado) */}
              <polygon points="34,31 28,38 39,38" fill="#2d1a4e" />
              <circle cx="33" cy="35" r="1.8" fill="#fef08a" />
              <circle cx="34" cy="34" r="0.6" fill="#ffffff" />

              {/* Naricita simpática */}
              <polygon points="25,41 22,44 28,44" fill="#2d1a4e" />

              {/* Sonrisa de calabaza (boca dentada abierta curiosa) */}
              <path
                d="M13,47 L16,51 L19,47 L23,52 L27,47 L31,51 L35,46"
                fill="none"
                stroke="#2d1a4e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Dientito superior alegre */}
              <rect x="21" y="47" width="3.5" height="2.5" fill="#fef08a" rx="0.5" />

              {/* Rubor rosado en mejillas tiernas */}
              <ellipse cx="10" cy="43" rx="4" ry="2.2" fill="#ec4899" opacity="0.55" />
              <ellipse cx="38" cy="42" rx="4" ry="2.2" fill="#ec4899" opacity="0.55" />

              {/* Manito/garrita cute agarrando el borde derecho imaginario */}
              <path
                d="M48,34 C44,34 42,37 42,40 C42,43 45,46 48,46 Z"
                fill="#ea580c"
                stroke="#9a3412"
                strokeWidth="1"
              />
              <circle cx="43" cy="38" r="1.5" fill="#f97316" />
              <circle cx="43" cy="42" r="1.5" fill="#f97316" />
            </svg>
          </div>
        </div>
      )}

      {/* ── GUARDAR EN PANTALLA (App Silenciosa) ─────────────────── */}
      <AddToHomeScreen
        businessId={businessId}
        salonNombre={cfg?.nombre_salon || 'Brilla Studio'}
        colorPrimario={primario}
      />

      {/* ── 1. HEADER MINIMALISTA O TEMÁTICO ─────────────────────────── */}
      <header className={`sticky top-0 z-30 px-4 py-3.5 border-b backdrop-blur-md flex items-center justify-between gap-3 ${
        isHalloween
          ? 'bg-white/96 border-orange-200/80 text-gray-900'
          : isNavidad
          ? 'bg-white/96 border-amber-200/80 text-gray-900'
          : 'bg-white/95 border-gray-100 text-gray-900'
      }`}>
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
            <h1 className="text-base font-black tracking-tight text-gray-900 truncate leading-tight flex items-center gap-1.5">
              {cfg?.nombre_salon || 'Brilla Studio'}
              {isHalloween && <span className="text-sm">🎃</span>}
              {isNavidad   && <span className="text-sm">❄️</span>}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isHalloween ? (
                <span className="text-[10px] font-black tracking-wider uppercase flex items-center gap-1"
                  style={{ color: '#c2410c' }}>
                  HALLOWEEN EDITION 🕷️
                </span>
              ) : isNavidad ? (
                <span className="text-[10px] font-black tracking-wider uppercase flex items-center gap-1"
                  style={{ color: '#b45309' }}>
                  NAVIDAD LUXE ✨
                </span>
              ) : (
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-600 flex items-center gap-1">
                  SALÓN & SPA • PERÚ ✨
                </span>
              )}
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

          {/* BOTÓN DEL CARRITO CON LA ARAÑA DESCENDIENDO DIRECTAMENTE DESDE ÉL */}
          <div className="relative">
            <button
              onClick={() => setShowCart(true)}
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center border border-gray-100 text-gray-800 transition-all active:scale-95 bg-white shadow-2xs"
              title="Ver mi carrito de servicios">
              <ShoppingBag size={18} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[11px] font-bold text-white flex items-center justify-center shadow-xs"
                  style={{ background: primario }}>
                  {cart.length}
                </span>
              )}
            </button>

            {/* ARAÑA QUE NACE ORGÁNICAMENTE DESDE EL BOTÓN DEL CARRITO */}
            {isHalloween && showAnimaciones && (
              <>
                {/* Hilo de seda saliendo del borde inferior del botón */}
                <div className="halloween-spider-thread-btn" />
                {/* Araña SVG columpiándose al final del hilo */}
                <div className="halloween-spider-drop-btn">
                  <svg
                    width="34" height="42"
                    viewBox="0 0 44 52"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    {/* Patas izquierdas — 4 pares con curvas naturales */}
                    <path d="M15,18 C9,13 3,11 0,5"   stroke="#2d1a4e" strokeWidth="2"   strokeLinecap="round"/>
                    <path d="M14,23 C7,20 2,20 0,15"  stroke="#2d1a4e" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M13,29 C6,30 2,35 0,42"  stroke="#2d1a4e" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M14,33 C8,37 5,43 5,50"  stroke="#2d1a4e" strokeWidth="1.8" strokeLinecap="round"/>
                    {/* Patas derechas */}
                    <path d="M29,18 C35,13 41,11 44,5"  stroke="#2d1a4e" strokeWidth="2"   strokeLinecap="round"/>
                    <path d="M30,23 C37,20 42,20 44,15" stroke="#2d1a4e" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M31,29 C38,30 42,35 44,42" stroke="#2d1a4e" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M30,33 C36,37 39,43 39,50" stroke="#2d1a4e" strokeWidth="1.8" strokeLinecap="round"/>
                    {/* Cabeza */}
                    <circle cx="22" cy="14" r="8" fill="#2d1a4e"/>
                    {/* Ojos — naranja amber */}
                    <circle cx="18.5" cy="13" r="2" fill="#f97316"/>
                    <circle cx="25.5" cy="13" r="2" fill="#f97316"/>
                    {/* Brillo en ojos */}
                    <circle cx="19.2" cy="12.3" r="0.7" fill="white" opacity="0.9"/>
                    <circle cx="26.2" cy="12.3" r="0.7" fill="white" opacity="0.9"/>
                    {/* Abdómen */}
                    <ellipse cx="22" cy="36" rx="12" ry="14" fill="#2d1a4e"/>
                    {/* Shimmer violeta en abdómen */}
                    <ellipse cx="17" cy="30" rx="4" ry="2.5" fill="#7c3aed" opacity="0.35"/>
                    {/* Pattern en abdómen (telaaraña sutil) */}
                    <path d="M16,36 Q22,30 28,36" fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0.4"/>
                    <path d="M15,40 Q22,48 29,40" fill="none" stroke="#7c3aed" strokeWidth="0.8" opacity="0.3"/>
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 1.5. SALUDO PERSONALIZADO VIP (CLIENTA RECONOCIDA) ────── */}
      {clienteNombre && (
        <div className="w-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border-b border-amber-300/30 px-4 py-2 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
              👑
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black text-gray-900 truncate">
                ¡Hola de nuevo, <span className="text-rose-600">{clienteNombre.split(' ')[0]}</span>! ✨
              </p>
              <p className="text-[10px] text-gray-500 font-medium truncate">
                Tu sesión se agendará directo con tu perfil VIP
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditandoPerfilVip(true);
              setShowCart(true);
              setAgendaMode(true);
            }}
            className="text-[10px] font-black text-rose-600 hover:text-rose-700 bg-white/90 border border-rose-200 px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
            Mi Perfil
          </button>
        </div>
      )}

      {/* ── 2. BANNER FLASH FOMO INTEGRADO A ANCHO COMPLETO (SOLO PRO) ────── */}
      {canFomoCountdown && cfg?.fomo_banner?.activo && (
        <section className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowFomoModal(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-neutral-950 via-purple-950 to-rose-950 text-white border-b border-rose-500/30 flex flex-col gap-2 cursor-pointer group active:opacity-95 transition-all shadow-inner relative overflow-hidden"
          >
            {/* Glow de fondo animado */}
            <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-rose-500/20 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="text-xl animate-pulse shrink-0">
                  {cfg.fomo_banner.badge_emoji || '⚡'}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.2 rounded-md shadow-xs shrink-0">
                      {cfg.fomo_banner.descuento_tag || 'OFERTA FLASH 24H'}
                    </span>
                  </div>
                  <p className="text-xs font-black leading-snug text-white/95 line-clamp-2 drop-shadow-2xs">
                    {cfg.fomo_banner.titulo}
                  </p>
                </div>
              </div>

              {/* Píldora de Acción + Contador regresivo en vivo */}
              <div className="shrink-0 flex items-center gap-1.5">
                {fomoTimeLeft ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1 shadow-xs">
                      Ver Oferta ➔
                    </span>
                    <div className="bg-black/80 border border-rose-500/50 px-2 py-0.5 rounded-full font-mono text-[10px] font-black text-amber-300 flex items-center gap-1 shadow-xs">
                      <Clock size={10} className="animate-spin text-rose-400" />
                      <span>{fomoTimeLeft.hours}:{fomoTimeLeft.minutes}:{fomoTimeLeft.seconds}</span>
                    </div>
                  </div>
                ) : (
                  <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                    Reclamar ⚡
                  </span>
                )}
              </div>
            </div>

            {/* Barra Visual de Cupos en Vivo (Urgencia Máxima) */}
            {(() => {
              const totales = cfg.fomo_banner.cupos_totales || 5;
              const ocupados = cfg.fomo_banner.cupos_ocupados ?? 3;
              const restantes = Math.max(0, totales - ocupados);
              const pct = Math.min(100, Math.max(15, Math.round((ocupados / totales) * 100)));

              return (
                <div className="bg-black/50 backdrop-blur-md rounded-xl px-2.5 py-1.5 border border-white/10 flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-300 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span>🔥 Solo {restantes} cupos disponibles para hoy</span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                    <div className="h-2 w-full bg-black/80 rounded-full overflow-hidden p-0.5 border border-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 font-bold shrink-0">{ocupados}/{totales}</span>
                  </div>
                </div>
              );
            })()}
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
          {promoMesActiva && (
            <div className="rounded-3xl p-5 bg-gradient-to-br from-purple-900 to-indigo-950 text-white shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
                  {effectivePromoMes.badge_emoji || '🌸'} {effectivePromoMes.badge_texto || 'PROMO DEL MES'}
                </span>
                {effectivePromoMes.expira_en && (
                  <span className="text-[10px] font-black uppercase bg-purple-400/40 text-purple-100 px-2.5 py-0.5 rounded-full">
                    ⏳ {calcCountdown(effectivePromoMes.expira_en)}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black tracking-tight">{effectivePromoMes.titulo}</h3>
              {effectivePromoMes.descripcion && (
                <p className="text-xs text-white/80 leading-relaxed">{effectivePromoMes.descripcion}</p>
              )}
            </div>
          )}

          {/* Combo Hero si existe o por defecto */}
          {ofertaActiva && (
            <div className="rounded-3xl p-5 bg-gradient-to-br from-emerald-800 to-teal-950 text-white shadow-sm space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase bg-black/30 px-2.5 py-1 rounded-full">
                  🔥 OFERTA DE LA SEMANA
                </span>
                {effectiveOfertaSemana.expira_en ? (
                  <span className="text-[10px] font-black uppercase bg-rose-500 px-2.5 py-0.5 rounded-full text-white shadow-xs">
                    ⏳ {calcCountdown(effectiveOfertaSemana.expira_en)}
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase bg-emerald-500/40 px-2 py-0.5 rounded-full text-emerald-200">
                    LIMITADA
                  </span>
                )}
                {effectiveOfertaSemana.cupos_activos && (
                  <span className="text-[10px] font-black uppercase bg-amber-400 text-teal-950 px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 animate-pulse">
                    ⚡ {Math.max(0, (effectiveOfertaSemana.cupos_totales || 5) - (effectiveOfertaSemana.cupos_ocupados || 0)) > 0
                      ? `Solo quedan ${Math.max(0, (effectiveOfertaSemana.cupos_totales || 5) - (effectiveOfertaSemana.cupos_ocupados || 0))} cupos`
                      : '¡Últimos cupos disponibles!'}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black">{effectiveOfertaSemana.titulo}</h3>
              {effectiveOfertaSemana.descripcion && <p className="text-xs text-white/80">{effectiveOfertaSemana.descripcion}</p>}

              {/* Barra de progreso de cupos semanales con psicología de urgencia */}
              {effectiveOfertaSemana.cupos_activos && (
                <div className="p-3 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-200">
                    <span className="flex items-center gap-1">
                      <span>🎟️</span> Cupos reservados esta semana:
                    </span>
                    <span className="text-white font-black">
                      {effectiveOfertaSemana.cupos_ocupados || 0} de {effectiveOfertaSemana.cupos_totales || 5} reservados
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden p-0.5 border border-amber-400/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(10, Math.round(((effectiveOfertaSemana.cupos_ocupados || 0) / Math.max(1, (effectiveOfertaSemana.cupos_totales || 5))) * 100)))}%`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-emerald-200 font-semibold text-right">
                    ¡Quedan {Math.max(0, (effectiveOfertaSemana.cupos_totales || 5) - (effectiveOfertaSemana.cupos_ocupados || 0))} lugares antes de agotar stock!
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black">S/. {Number(effectiveOfertaSemana.precio_oferta || 129).toFixed(2)}</span>
                  {effectiveOfertaSemana.precio_original && (
                    <span className="text-xs text-white/60 line-through">S/. {Number(effectiveOfertaSemana.precio_original).toFixed(2)}</span>
                  )}
                </div>
                <a href={buildWhatsAppLink(effectiveOfertaSemana.titulo)} target="_blank" rel="noopener noreferrer"
                  className="bg-white text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-emerald-50 active:scale-95 transition-all">
                  Pedir por WhatsApp
                </a>
              </div>
            </div>
          )}

          {/* ── 🌟 RITUALES SEMANALES: PROMOS POR DÍA DE LA SEMANA ── */}
          {(() => {
            const promosDias = (cfg?.promos_dias || []).filter(p => p.activo);
            if (promosDias.length === 0) return null;

            const hoyDayIdx = new Date().getDay(); // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
            const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

            // Ordenar: primero los de hoy, luego los próximos días
            const sortedPromos = [...promosDias].sort((a, b) => {
              const diffA = (a.dia_semana - hoyDayIdx + 7) % 7;
              const diffB = (b.dia_semana - hoyDayIdx + 7) % 7;
              return diffA - diffB;
            });

            return (
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base p-1.5 rounded-xl bg-rose-50 text-rose-600 shadow-2xs">🗓️</span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                        Rituales & Días Temáticos
                      </h3>
                      <p className="text-[10px] text-gray-400">Promos fijas de la semana · Reserva con anticipación</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-full">
                    Ahorro VIP
                  </span>
                </div>

                <div className="space-y-3">
                  {sortedPromos.map(pd => {
                    const isHoy = pd.dia_semana === hoyDayIdx;
                    const diffDays = (pd.dia_semana - hoyDayIdx + 7) % 7;
                    const targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + (diffDays === 0 ? 0 : diffDays));
                    const targetDateIso = targetDate.toISOString().split('T')[0];
                    const targetLabel = isHoy ? '¡Hoy Activo!' : diffDays === 1 ? 'Mañana' : `Este ${diasNombres[pd.dia_semana]}`;

                    // Psicología de Cupos para el día
                    const cuposTot = pd.cupos_totales || 5;
                    const cuposOcup = pd.cupos_ocupados ?? 2;
                    const cuposRest = Math.max(0, cuposTot - cuposOcup);
                    const pct = Math.min(100, Math.round((cuposOcup / cuposTot) * 100));

                    // Acción para reservar directamente ese día
                    const handleSelectPromoDia = () => {
                      setSelectedFecha(targetDateIso);
                      setSelectedHora('');
                      // Si no hay nada en carrito, agregamos una referencia simulada o el primer servicio disponible
                      if (cart.length === 0 && todasCategorias.length > 0) {
                        const firstServ = todasCategorias[0]?.servicios?.[0];
                        if (firstServ) {
                          setCart([{ servicio: { ...firstServ, nombre: pd.titulo, precio: pd.precio_promo || pd.precio_regular || firstServ.precio }, cantidad: 1 }]);
                        }
                      }
                      setShowCart(true);
                      setAgendaMode(true);
                    };

                    return (
                      <div
                        key={pd.id}
                        className={`rounded-3xl p-4.5 border transition-all relative overflow-hidden shadow-xs ${
                          isHoy
                            ? isHalloween
                              ? 'bg-gradient-to-br from-purple-900 via-indigo-950 to-neutral-950 text-white border-purple-400/50 shadow-purple-950/40 shadow-md'
                              : isNavidad
                              ? 'bg-gradient-to-br from-rose-900 via-amber-950 to-neutral-950 text-white border-amber-400/50 shadow-amber-950/40 shadow-md'
                              : 'bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 text-white border-rose-400/40 shadow-rose-500/20 shadow-md'
                            : isHalloween
                            ? 'bg-[#181124] border-purple-900/40 text-purple-100 hover:border-purple-400/40'
                            : isNavidad
                            ? 'bg-[#1f0e13] border-amber-900/40 text-amber-100 hover:border-amber-400/40'
                            : 'bg-white dark:bg-neutral-900 border-gray-100 text-gray-900 hover:border-rose-200'
                        }`}
                      >
                        {/* Glow sutil si es hoy */}
                        {isHoy && (
                          <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-xl pointer-events-none ${
                            isHalloween ? 'bg-purple-500/30' : isNavidad ? 'bg-amber-400/30' : 'bg-white/20'
                          }`} />
                        )}

                        <div className="relative z-10 space-y-3">
                          {/* Badges superiores */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs ${
                                isHoy
                                  ? 'bg-white text-rose-600 font-extrabold animate-pulse'
                                  : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                              }`}>
                                {isHoy ? '🔥' : '📅'} {targetLabel}
                              </span>

                              {pd.badge_emoji && (
                                <span className={`text-xs px-2 py-0.5 rounded-lg ${isHoy ? 'bg-white/20' : 'bg-gray-100'}`}>
                                  {pd.badge_emoji}
                                </span>
                              )}
                            </div>

                            {/* Descuento Porcentual */}
                            {pd.precio_regular && pd.precio_promo && pd.precio_regular > pd.precio_promo && (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isHoy ? 'bg-amber-400 text-black' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                -{Math.round(((pd.precio_regular - pd.precio_promo) / pd.precio_regular) * 100)}% OFF
                              </span>
                            )}
                          </div>

                          {/* Título y Servicios */}
                          <div>
                            <h4 className={`text-base font-black tracking-tight leading-snug ${isHoy ? 'text-white' : 'text-gray-900'}`}>
                              {pd.titulo}
                            </h4>
                            {pd.servicios_nombres && (
                              <p className={`text-xs font-bold mt-0.5 ${isHoy ? 'text-white/90' : 'text-rose-600'}`}>
                                💅 {pd.servicios_nombres}
                              </p>
                            )}
                            {pd.descripcion && (
                              <p className={`text-xs mt-1 leading-relaxed ${isHoy ? 'text-white/80' : 'text-gray-500'}`}>
                                {pd.descripcion}
                              </p>
                            )}
                          </div>

                          {/* Barra de Cupos con Gatillo de Dopamina */}
                          {pd.cupos_activos && (
                            <div className={`p-2.5 rounded-2xl border space-y-1.5 ${
                              isHoy
                                ? 'bg-black/25 border-white/10'
                                : 'bg-amber-50/50 border-amber-200/60'
                            }`}>
                              <div className="flex items-center justify-between text-[10px] font-black">
                                <span className={`flex items-center gap-1 ${isHoy ? 'text-amber-200' : 'text-amber-900'}`}>
                                  <Flame size={12} className={isHoy ? 'text-amber-300' : 'text-rose-500'} />
                                  {cuposRest === 1
                                    ? '¡ÚLTIMO LUGAR DISPONIBLE!'
                                    : `Solo quedan ${cuposRest} de ${cuposTot} cupos`}
                                </span>
                                <span className={isHoy ? 'text-white font-mono' : 'text-gray-500 font-mono'}>
                                  {cuposOcup}/{cuposTot} ({pct}%)
                                </span>
                              </div>
                              <div className={`h-1.5 w-full rounded-full overflow-hidden ${isHoy ? 'bg-black/40' : 'bg-amber-200/40'}`}>
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-400 to-red-500 transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Footer con Precios y Botón de Reserva con salto directo */}
                          <div className={`flex items-center justify-between pt-2 border-t ${
                            isHoy ? 'border-white/15' : 'border-gray-100'
                          }`}>
                            <div>
                              <span className={`text-[9px] uppercase font-bold block ${isHoy ? 'text-white/70' : 'text-gray-400'}`}>
                                Precio Exclusivo
                              </span>
                              <div className="flex items-baseline gap-1.5">
                                <span className={`text-lg font-black ${isHoy ? 'text-white' : 'text-rose-600'}`}>
                                  S/. {Number(pd.precio_promo || pd.precio_regular || 0).toFixed(2)}
                                </span>
                                {pd.precio_regular && pd.precio_promo && pd.precio_regular > pd.precio_promo && (
                                  <span className={`text-xs line-through ${isHoy ? 'text-white/60' : 'text-gray-400'}`}>
                                    S/. {Number(pd.precio_regular).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={handleSelectPromoDia}
                              className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
                                isHoy
                                  ? 'bg-white text-rose-700 hover:bg-rose-50'
                                  : 'bg-rose-600 text-white hover:bg-rose-700'
                              }`}
                            >
                              <CalendarIcon size={13} />
                              {isHoy ? 'Agendar Hoy' : `Reservar para el ${diasNombres[pd.dia_semana].slice(0, 3)}`}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })()}

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
          <div ref={tabsRef} className={`sticky top-[69px] z-20 py-3 px-4 border-b backdrop-blur-md shadow-2xs ${
            isHalloween
              ? 'bg-[#150d1e]/95 border-purple-900/40'
              : isNavidad
              ? 'bg-[#1c0c10]/95 border-amber-900/40'
              : 'bg-white/95 border-gray-100'
          }`}>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => scrollToCategoria('__todos__')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 transition-all active:scale-95 ${
                  activeCategoria === '__todos__'
                    ? 'text-white shadow-md shadow-black/10'
                    : isHalloween
                    ? 'bg-purple-950/40 text-purple-200 border border-purple-900/50 hover:bg-purple-900/50'
                    : isNavidad
                    ? 'bg-amber-950/40 text-amber-200 border border-amber-900/50 hover:bg-amber-900/50'
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
            {/* ── 4. BANNER HERO CAROUSEL: OFERTAS & PROMOS DESTACADAS (PEEKING CARDS) ── */}
            {(promoMesActiva || ofertaActiva) && (
              <div className="relative -mx-4 px-4">
                <div className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 px-1">
                  
                  {/* Slide 1: Combo de la Semana (Tarjeta Elegante Ultra-Premium) */}
                  {ofertaActiva && (
                    <motion.section initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className={`min-w-[90%] sm:min-w-[92%] snap-start rounded-[32px] p-5 shadow-2xl relative overflow-hidden text-white border flex flex-col justify-between ${
                        isHalloween
                          ? 'border-purple-400/50 shadow-purple-950/60'
                          : isNavidad
                          ? 'border-amber-300/50 shadow-amber-950/60'
                          : 'border-emerald-400/30 shadow-emerald-950/30'
                      }`}
                      style={{
                        background: isHalloween
                          ? `linear-gradient(135deg, rgba(15, 10, 25, 0.97) 0%, rgba(58, 20, 95, 0.97) 100%), url(${halloweenBg}) center/cover`
                          : isNavidad
                          ? `linear-gradient(135deg, rgba(20, 8, 12, 0.97) 0%, rgba(110, 20, 35, 0.97) 100%), url(${christmasBg}) center/cover`
                          : `linear-gradient(135deg, #022c22 0%, #065f46 50%, #047857 100%)`
                      }}>
                      {/* Efectos de Iluminación y Shimmer Superior */}
                      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />

                      <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                        <div>
                          {/* Fila superior de Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-full text-emerald-200 border border-emerald-400/30 shadow-sm flex items-center gap-1 whitespace-nowrap">
                              <Sparkles size={11} className="text-amber-400 shrink-0" />
                              {isHalloween ? '🎃 OFERTA HALLOWEEN' : isNavidad ? '🎄 OFERTA NAVIDEÑA' : '🔥 COMBO DE LA SEMANA'}
                            </span>

                            {/* Badge Ahorro Destacado */}
                            {effectiveOfertaSemana.precio_original && effectiveOfertaSemana.precio_oferta && (
                              <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md whitespace-nowrap shrink-0 border border-amber-300">
                                ⚡ -{Math.round(((effectiveOfertaSemana.precio_original - effectiveOfertaSemana.precio_oferta) / effectiveOfertaSemana.precio_original) * 100)}% OFF
                              </span>
                            )}
                          </div>

                          {/* Título Principal */}
                          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug text-white drop-shadow-sm line-clamp-2">
                            {effectiveOfertaSemana.titulo}
                          </h3>

                          {/* Descripción / Desglose de Incluidos en Pills de Alto Impacto */}
                          {effectiveOfertaSemana.descripcion && (
                            <div className="mt-2 text-xs text-emerald-100/90 leading-relaxed font-medium">
                              {effectiveOfertaSemana.descripcion.includes('+') ? (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {effectiveOfertaSemana.descripcion.split('+').map((item, idx) => (
                                    <span key={idx} className="bg-white/10 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold text-emerald-100 flex items-center gap-1">
                                      ✨ {item.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="line-clamp-2 text-white/85 font-normal">{effectiveOfertaSemana.descripcion}</p>
                              )}
                            </div>
                          )}

                          {/* Medidor visual de escasez (FOMO) */}
                          {effectiveOfertaSemana.cupos_activos && (
                            <div className="mt-2.5 bg-black/40 backdrop-blur-md rounded-2xl p-2 border border-white/15">
                              <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-300 mb-1">
                                <span className="flex items-center gap-1">🔥 Quedan pocos cupos esta semana:</span>
                                <span className="text-white font-black bg-rose-600 px-1.5 py-0.2 rounded-md">
                                  {Math.max(0, (effectiveOfertaSemana.cupos_totales || 5) - (effectiveOfertaSemana.cupos_ocupados || 0))} de {effectiveOfertaSemana.cupos_totales || 5} libres
                                </span>
                              </div>
                              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 shadow-sm transition-all duration-700"
                                  style={{
                                    width: `${Math.min(100, Math.max(15, Math.round(((effectiveOfertaSemana.cupos_ocupados || 0) / Math.max(1, (effectiveOfertaSemana.cupos_totales || 5))) * 100)))}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Fila Inferior: Bloque de Precios Armónico & Botón con Resplandor */}
                        <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/15 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-emerald-200/80 leading-none">Precio Especial:</span>
                            <div className="flex items-baseline gap-1.5 whitespace-nowrap mt-0.5">
                              <span className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-xs">
                                S/ {Number(effectiveOfertaSemana.precio_oferta || 129).toFixed(2)}
                              </span>
                              {effectiveOfertaSemana.precio_original && (
                                <span className="text-xs text-white/50 line-through font-semibold">
                                  S/ {Number(effectiveOfertaSemana.precio_original).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>

                          {cfg?.telefono_whatsapp && (
                            <a href={buildWhatsAppLink(effectiveOfertaSemana.titulo)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-400 to-yellow-500 text-slate-950 px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-amber-400/20 active:scale-95 transition-all whitespace-nowrap shrink-0 hover:brightness-105 border border-amber-300">
                              <Sparkles size={13} className="shrink-0 text-slate-900" /> Reclamar Oferta
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.section>
                  )}

                  {/* Slide 2: Promo del Mes (Tarjeta Ultra-Luxe Violeta) */}
                  {promoMesActiva && (
                    <motion.section initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className={`min-w-[90%] sm:min-w-[92%] snap-start rounded-[32px] p-5 shadow-2xl relative overflow-hidden text-white border flex flex-col justify-between ${
                        isHalloween
                          ? 'border-purple-400/50 shadow-purple-900/40'
                          : isNavidad
                          ? 'border-amber-300/50 shadow-amber-950/40'
                          : 'border-purple-400/35 shadow-purple-950/30'
                      }`}
                      style={{
                        background: isHalloween
                          ? `linear-gradient(135deg, rgba(30, 15, 45, 0.97) 0%, rgba(88, 28, 135, 0.97) 100%), url(${halloweenBg}) center/cover`
                          : isNavidad
                          ? `linear-gradient(135deg, rgba(40, 15, 20, 0.97) 0%, rgba(180, 25, 60, 0.97) 100%), url(${christmasBg}) center/cover`
                          : `linear-gradient(135deg, #3b0764 0%, #4c1d95 60%, #1e1b4b 100%)`
                      }}>
                      {/* Efectos de Iluminación de Fondo */}
                      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-purple-400/25 blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-pink-500/15 blur-2xl pointer-events-none" />

                      <div className="relative z-10 flex flex-col justify-between h-full gap-3">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-purple-950/80 backdrop-blur-md px-3 py-1 rounded-full text-purple-200 border border-purple-400/30 shadow-sm flex items-center gap-1 whitespace-nowrap">
                              <span>{effectivePromoMes.badge_emoji || '👑'}</span>
                              {isHalloween ? '🌙 EDICIÓN HALLOWEEN' : isNavidad ? '✨ EDICIÓN DICIEMBRE' : `${effectivePromoMes.badge_texto || 'PROMO EXCLUSIVA DEL MES'}`}
                            </span>
                            {effectivePromoMes.expira_en && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-900/80 text-purple-200 px-2.5 py-1 rounded-full border border-purple-300/30 whitespace-nowrap">
                                ⏳ {calcCountdown(effectivePromoMes.expira_en)}
                              </span>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-black tracking-tight leading-snug text-white drop-shadow-sm line-clamp-2">
                            {effectivePromoMes.titulo}
                          </h3>

                          {/* Desglose o Párrafo */}
                          {effectivePromoMes.descripcion && (
                            <div className="mt-2 text-xs text-purple-100/90 leading-relaxed font-medium">
                              {effectivePromoMes.descripcion.includes('+') ? (
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {effectivePromoMes.descripcion.split('+').map((item, idx) => (
                                    <span key={idx} className="bg-white/10 backdrop-blur-md border border-white/15 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold text-purple-100 flex items-center gap-1">
                                      💎 {item.trim()}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="line-clamp-2 text-white/85 font-normal">{effectivePromoMes.descripcion}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {cfg?.telefono_whatsapp && (
                          <div className="pt-3 flex items-center justify-between border-t border-white/15 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-purple-200 uppercase font-bold tracking-wider">
                                ✨ Edición Limitada
                              </span>
                              <span className="text-xs text-purple-300/90 font-extrabold">
                                Cupos VIP Reservados
                              </span>
                            </div>

                            <a href={buildWhatsAppLink(effectivePromoMes.titulo)} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white px-4 py-2.5 rounded-2xl font-black text-xs shadow-lg shadow-purple-500/25 active:scale-95 transition-all whitespace-nowrap shrink-0 hover:brightness-110 border border-purple-300/30">
                              <Sparkles size={13} className="text-amber-300 shrink-0" /> Reservar Promo
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.section>
                  )}

                </div>

                {/* Indicador de Deslizamiento si hay más de 1 promo activa */}
                {promoMesActiva && ofertaActiva && (
                  <div className="flex justify-center gap-1.5 pt-1">
                    <div className="w-4 h-1.5 rounded-full bg-emerald-600/70" />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  </div>
                )}
              </div>
            )}

            {/* ── 5. OFERTAS / ESPECIALES DEL DÍA (CARRUSEL DOPAMINÉRGICO MOBILE-FIRST) ── */}
            {serviciosDestacados.length > 0 && (cfg?.ofertas_dia_config?.activo ?? true) && (
              <section className="space-y-2.5 pt-1">
                {/* Header dinámico personalizable con micro-badge animado */}
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 text-sm shadow-2xs">
                      🔥
                    </span>
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-1.5 leading-none">
                        {cfg?.ofertas_dia_config?.titulo || 'ANTOJOS & ESPECIALES DE HOY'}
                      </h2>
                      <span className="text-[10px] text-gray-400 font-medium leading-none">
                        {cfg?.ofertas_dia_config?.subtitulo || 'Desliza para descubrir más ofertas'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-orange-500 to-rose-500 px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                    <Sparkles size={10} className="animate-spin" />
                    {cfg?.ofertas_dia_config?.badge_superior || 'Solo por Hoy'}
                  </span>
                </div>

                {/* Carrusel Horizontal Táctil Mobile-First con Snap y Peek de la siguiente card */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 pt-1 -mx-4 px-4 snap-x snap-mandatory">
                  {serviciosDestacados.map(srv => {
                    const inCart = cart.some(i => i.servicio.id === srv.id);
                    const justAdded = addedId === srv.id;
                    // Asignación de rol limpio enfocado en Valor, Descuento y Regalos (Sin saturar de cupos)
                    const defaultBadges = ['🔥 MÁS PEDIDO', '🎁 PACK CON REGALO', '✨ EDICIÓN LIMITADA', '💎 GLOW PACK'];
                    const defaultGifts = [
                      'Incluye masaje capilar o aceitito de cutículas 🎁',
                      'Incluye cepillito de pestañas + sérum 🎁',
                      'Exfoliación hidratante de cortesía 🎁'
                    ];

                    const displayBadge = srv.badge_promo || defaultBadges[srv.orden % defaultBadges.length] || 'PROMO HOY!';
                    const displayBono = srv.bono_regalo || (displayBadge.includes('REGALO') || srv.orden % 2 === 0 ? defaultGifts[srv.orden % defaultGifts.length] : null);
                    const originalPrice = srv.precio_original || (srv.precio ? Math.round(srv.precio * 1.35) : null);
                    const finalPrice = srv.precio || 65;

                    const ahorroMonto = originalPrice && finalPrice && originalPrice > finalPrice
                      ? originalPrice - finalPrice
                      : 0;
                    const ahorroPct = originalPrice && finalPrice && originalPrice > finalPrice
                      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
                      : 0;

                    // Estilos temáticos inteligentes (UX/UI Neuro-Design por Categoría)
                    const srvText = (srv.nombre + ' ' + (srv.descripcion || '') + ' ' + (srv.categoria || '')).toLowerCase();

                    // 1. Badge Superior Flotante: Gradiente por Servicio
                    let badgeGradient = 'from-rose-600 via-pink-600 to-orange-500 text-white shadow-rose-500/20'; // Más Pedido / Promo Genérica
                    if (srvText.includes('pestaña') || srvText.includes('ceja') || srvText.includes('lash') || srvText.includes('brow') || displayBadge.includes('GLOW')) {
                      badgeGradient = 'from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black shadow-amber-500/20'; // ✨ Dorado metálico (Pestañas / Glow)
                    } else if (srvText.includes('facial') || srvText.includes('piel') || srvText.includes('skin') || srvText.includes('limpieza') || srvText.includes('hidra')) {
                      badgeGradient = 'from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-cyan-500/20'; // 💧 Aquamarine / Turquesa (Faciales / Piel)
                    } else if (srvText.includes('cabello') || srvText.includes('balayage') || srvText.includes('capilar') || srvText.includes('corte') || displayBadge.includes('LIMITADA')) {
                      badgeGradient = 'from-violet-600 via-purple-600 to-indigo-600 text-white shadow-purple-500/20'; // 👑 Electric Violet (Cabello / Edición Limitada)
                    } else if (displayBadge.includes('REGALO') || displayBadge.includes('PACK')) {
                      badgeGradient = 'from-emerald-600 via-teal-600 to-green-600 text-white shadow-emerald-500/20'; // 🎁 Esmeralda Profundo (Packs Regalo)
                    }

                    // 2. Caja de Regalo / Bono Incluido (Color Armónico por Categoría)
                    let bonoBoxStyle = 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300';
                    if (srvText.includes('pestaña') || srvText.includes('ceja') || srvText.includes('lash')) {
                      bonoBoxStyle = 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-300'; // Champagne / Dorado suave
                    } else if (srvText.includes('facial') || srvText.includes('limpieza') || srvText.includes('piel')) {
                      bonoBoxStyle = 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-300/80 dark:border-cyan-800/40 text-cyan-900 dark:text-cyan-300'; // Aquamarine / Celeste fresco
                    } else if (srvText.includes('cabello') || srvText.includes('capilar') || srvText.includes('balayage')) {
                      bonoBoxStyle = 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-300/80 dark:border-purple-800/40 text-purple-900 dark:text-purple-300'; // Violeta sedoso
                    }

                    return (
                      <motion.div
                        key={srv.id}
                        whileTap={{ scale: 0.98 }}
                        className="w-[235px] sm:w-[245px] shrink-0 snap-start rounded-[28px] border border-orange-200/80 dark:border-orange-500/30 bg-gradient-to-b from-white via-white to-orange-50/25 dark:from-neutral-900 dark:via-neutral-900 dark:to-orange-950/20 p-3 shadow-md hover:shadow-lg flex flex-col justify-between transition-all relative overflow-hidden group"
                        style={{
                          boxShadow: '0 8px 24px -6px rgba(249, 115, 22, 0.12)'
                        }}
                      >
                        {/* Shimmer / Glow en esquina superior */}
                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-orange-400/20 to-rose-400/0 blur-xl pointer-events-none" />

                        <div className="space-y-2.5">
                          {/* Contenedor de Imagen con Relación 4:3 Táctil */}
                          <div
                            onClick={() => setSelectedServiceDetail(srv)}
                            className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative bg-gray-100 dark:bg-neutral-800 cursor-pointer shadow-inner border border-black/5"
                          >
                            <MediaCard srv={srv} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

                            {/* Badge Flotante Superior Izquierdo Diferenciado */}
                            <span className={`absolute top-2 left-2 bg-gradient-to-r ${badgeGradient} text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-md flex items-center gap-0.5`}>
                              {displayBadge}
                            </span>

                            {/* Badge Flotante Superior Derecho: % OFF o Ahorro */}
                            {ahorroPct > 0 && (
                              <span className="absolute top-2 right-2 bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg shadow-md">
                                -{ahorroPct}%
                              </span>
                            )}
                          </div>

                          {/* Info & Título del Servicio */}
                          <div className="space-y-1">
                            <h4
                              onClick={() => setSelectedServiceDetail(srv)}
                              className="text-xs font-black text-gray-900 dark:text-white line-clamp-1 leading-snug cursor-pointer hover:text-orange-600 transition-colors"
                            >
                              {srv.nombre}
                            </h4>

                            {/* Bono de Regalo / Add-on Dopaminérgico — Texto completo multilínea sin cortar */}
                            {displayBono ? (
                              <div className={`${bonoBoxStyle} border rounded-xl p-1.5 flex items-start gap-1.5 text-[10px] font-extrabold shadow-2xs leading-tight transition-colors`}>
                                <span className="text-xs shrink-0 mt-0.5">🎁</span>
                                <span className="line-clamp-2 leading-tight">{displayBono}</span>
                              </div>
                            ) : srv.descripcion ? (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                                {srv.descripcion}
                              </p>
                            ) : null}

                            {/* Precios con Anclaje y Ahorro en S/ */}
                            <div className="flex items-baseline gap-2 pt-0.5 flex-wrap">
                              <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                                S/. {Number(finalPrice).toFixed(2)}
                              </span>
                              {originalPrice && originalPrice > finalPrice && (
                                <span className="text-[11px] line-through text-gray-400 font-semibold">
                                  S/ {Number(originalPrice).toFixed(2)}
                                </span>
                              )}
                              {ahorroMonto > 0 && (
                                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                                  Ahorras S/{ahorroMonto.toFixed(0)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Botón de Acción Táctil Mobile-First con Efecto de Destello */}
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={() => inCart ? removeFromCart(srv.id) : addToCart(srv)}
                          className="mt-3 w-full py-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:shadow-none"
                          style={{
                            background: inCart
                              ? '#10b981'
                              : `linear-gradient(135deg, ${primario} 0%, #ea580c 100%)`,
                            color: 'white',
                          }}
                        >
                          {justAdded ? (
                            <><Check size={14} className="stroke-[3]" /> ¡Listo!</>
                          ) : inCart ? (
                            <><Check size={14} className="stroke-[3]" /> En Carrito</>
                          ) : (
                            <><Plus size={15} className="stroke-[3]" /> Agregar Gustito ✨</>
                          )}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── 6. LISTADO DEL MENÚ (LOOKBOOK ESTILO CONFIGURADO POR EL SALÓN) ── */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Sparkles size={14} style={{ color: primario }} />
                    CATÁLOGO DE EXPERIENCIAS
                  </h2>
                  <p className="text-[11px] text-gray-400 font-medium">Toca cualquier servicio para ver detalles, duración y fotos reales</p>
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
                          const hasAntesDespues = Boolean(canAntesDespues && srv.antes_despues?.activo && srv.antes_despues.foto_antes && srv.antes_despues.foto_despues);

                          if (isHeroLook) {
                            return (
                              <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                                className="col-span-2 rounded-[28px] overflow-hidden bg-white border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-all relative group">
                                <div className="h-44 w-full relative bg-gray-100 overflow-hidden">
                                  <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                                    {hasAntesDespues && (
                                      <span className="antes-despues-badge-glow bg-gradient-to-r from-purple-600 to-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                        <Sliders size={10} /> ↔️ ANTES & DESPUÉS
                                      </span>
                                    )}
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
                              <div className="aspect-[3/4] w-full relative bg-gray-50 overflow-hidden">
                                <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-300" />
                                {srv.destacado && (
                                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-xs z-10">TOP</span>
                                )}
                                <button onClick={(e) => toggleLike(srv.id, e)}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center shadow-xs active:scale-75 transition-transform z-10">
                                  <Heart size={12} className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-gray-600'} />
                                </button>
                                {hasAntesDespues && (
                                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md rounded-xl py-1 px-2.5 text-[9px] text-white font-black uppercase tracking-wider flex items-center justify-between pointer-events-none border border-white/10 shadow-xs z-10">
                                    <span className="flex items-center gap-1"><Sliders size={10} className="text-amber-300" /> ANTES & DESPUÉS</span>
                                    <span className="text-[8px] text-amber-300 font-bold">↔️ Toca</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-gray-700">{srv.nombre}</h4>
                                  <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-xs font-black" style={{ color: primario }}>{formatPrecio(srv)}</span>
                                    {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
                                      <span className="text-[10px] line-through text-gray-400 font-semibold">
                                        S/ {Number(srv.precio_original).toFixed(2)}
                                      </span>
                                    )}
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
                          const hasAntesDespues = Boolean(canAntesDespues && srv.antes_despues?.activo && srv.antes_despues.foto_antes && srv.antes_despues.foto_despues);

                          return (
                            <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                              className="rounded-[32px] overflow-hidden bg-white border border-gray-100 shadow-sm cursor-pointer active:scale-[0.99] transition-all group">
                              <div className="aspect-[4/3] sm:aspect-[16/10] w-full relative bg-gray-100 overflow-hidden">
                                <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                                <div className="absolute top-3 left-3 flex gap-2 items-center flex-wrap z-10">
                                  {hasAntesDespues ? (
                                    <span className="bg-purple-700/90 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20 backdrop-blur-md">
                                      <Sliders size={10} /> ↔️ ANTES & DESPUÉS
                                    </span>
                                  ) : srv.destacado ? (
                                    <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                                      TOP SELECTION
                                    </span>
                                  ) : null}
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
                                  <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-base font-black" style={{ color: primario }}>{formatPrecio(srv)}</span>
                                    {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
                                      <span className="text-xs line-through text-gray-400 font-semibold">
                                        S/ {Number(srv.precio_original).toFixed(2)}
                                      </span>
                                    )}
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
                          const hasAntesDespues = Boolean(canAntesDespues && srv.antes_despues?.activo && srv.antes_despues.foto_antes && srv.antes_despues.foto_despues);

                          return (
                            <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                              className="aspect-[3/4] w-full rounded-[28px] overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all group shadow-md border border-gray-100">
                              <MediaCard srv={srv} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
                              
                              <button onClick={(e) => toggleLike(srv.id, e)}
                                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-75 transition-transform z-10">
                                <Heart size={13} className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-white'} />
                              </button>

                              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
                                {hasAntesDespues ? (
                                  <span className="bg-black/60 backdrop-blur-md text-amber-300 text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                                    <Sliders size={8} /> ↔️ SLIDER
                                  </span>
                                ) : srv.destacado ? (
                                  <span className="bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                                    HOT 🔥
                                  </span>
                                ) : null}
                              </div>

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
                          const hasAntesDespues = Boolean(canAntesDespues && srv.antes_despues?.activo && srv.antes_despues.foto_antes && srv.antes_despues.foto_despues);

                          return (
                            <div key={srv.id} onClick={() => setSelectedServiceDetail(srv)}
                              className="rounded-2xl border border-gray-100 bg-white p-2.5 shadow-2xs flex items-center gap-3 transition-all hover:border-gray-200 active:scale-[0.99] cursor-pointer group">
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0 relative">
                                <MediaCard srv={srv} className="group-hover:scale-105 transition-transform duration-300" />
                                {hasAntesDespues && (
                                  <span className="absolute bottom-0 inset-x-0 bg-purple-700/90 text-white text-[7px] font-black uppercase text-center py-0.5 tracking-tighter">
                                    ↔️ SLIDER
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-xs font-bold text-gray-900 truncate leading-snug">{srv.nombre}</h4>
                                  {hasAntesDespues && (
                                    <span className="antes-despues-badge-glow bg-gradient-to-r from-purple-600 to-rose-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-md">
                                      ✨ Antes/Después
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs font-black" style={{ color: primario }}>{formatPrecio(srv)}</span>
                                  {srv.precio_original && srv.precio && srv.precio_original > srv.precio && (
                                    <span className="text-[10px] line-through text-gray-400 font-semibold">
                                      S/ {Number(srv.precio_original).toFixed(2)}
                                    </span>
                                  )}
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
                <p className="text-[10px] text-gray-400/80 mt-1">Vitrina digital interactiva & agendamiento para salones</p>
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

      {/* ── 7B. MODAL DETALLE DE OFERTA FLASH FOMO ────────────────── */}
      <AnimatePresence>
        {showFomoModal && cfg?.fomo_banner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFomoModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-sm rounded-[32px] overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-900 to-black text-white shadow-2xl border border-rose-500/40 p-6 space-y-5"
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setShowFomoModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>

              {/* Encabezado con Ícono & Badge */}
              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-500 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-rose-500/30">
                  {cfg.fomo_banner.badge_emoji || '⚡'}
                </div>
                <div>
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-3 py-1 rounded-full shadow-sm">
                    {cfg.fomo_banner.descuento_tag || 'OFERTA FLASH'}
                  </span>
                  <h3 className="text-lg font-black text-white mt-2 leading-snug">
                    {cfg.fomo_banner.titulo}
                  </h3>
                </div>
              </div>

              {/* Subtítulo / Descripción completa */}
              {cfg.fomo_banner.subtitulo && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-xs text-rose-200 font-medium leading-relaxed">
                    {cfg.fomo_banner.subtitulo}
                  </p>
                </div>
              )}

              {/* Reloj Cuenta Regresiva Destacado */}
              {fomoTimeLeft && (
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Clock size={12} className="text-rose-400" /> Esta promoción finaliza en:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-black/80 border border-rose-500/30 rounded-2xl px-3 py-2 text-center min-w-[56px]">
                      <span className="text-lg font-black text-white font-mono">{fomoTimeLeft.hours}</span>
                      <span className="block text-[9px] text-gray-400 uppercase font-semibold">Horas</span>
                    </div>
                    <span className="text-rose-400 font-black text-lg">:</span>
                    <div className="bg-black/80 border border-rose-500/30 rounded-2xl px-3 py-2 text-center min-w-[56px]">
                      <span className="text-lg font-black text-white font-mono">{fomoTimeLeft.minutes}</span>
                      <span className="block text-[9px] text-gray-400 uppercase font-semibold">Min</span>
                    </div>
                    <span className="text-rose-400 font-black text-lg">:</span>
                    <div className="bg-black/80 border border-rose-500/30 rounded-2xl px-3 py-2 text-center min-w-[56px]">
                      <span className="text-lg font-black text-rose-400 font-mono animate-pulse">{fomoTimeLeft.seconds}</span>
                      <span className="block text-[9px] text-gray-400 uppercase font-semibold">Seg</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Psicología de Escasez: Cupos Limitados del Día */}
              {cfg.fomo_banner.cupos_activos && (
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <span className="animate-bounce">⚡</span> ¡Cupos volando hoy!
                    </span>
                    <span className="bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                      {Math.max(0, (cfg.fomo_banner.cupos_totales || 5) - (cfg.fomo_banner.cupos_ocupados || 0))} disponibles
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(12, Math.round(((cfg.fomo_banner.cupos_ocupados || 0) / Math.max(1, (cfg.fomo_banner.cupos_totales || 5))) * 100)))}%`
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-amber-200/90 text-center font-medium">
                    Van <strong>{cfg.fomo_banner.cupos_ocupados || 0} de {cfg.fomo_banner.cupos_totales || 5} cupos</strong> reclamados. Reserva el tuyo antes de que se agote.
                  </p>
                </div>
              )}

              {/* Botones de acción */}
              <div className="space-y-2 pt-1">
                {cfg.telefono_whatsapp && (
                  <a
                    href={buildWhatsAppLink(
                      cfg.fomo_banner.cupos_activos
                        ? `${cfg.fomo_banner.titulo} (Deseo asegurar 1 de los ${Math.max(0, (cfg.fomo_banner.cupos_totales || 5) - (cfg.fomo_banner.cupos_ocupados || 0))} cupos de hoy)`
                        : cfg.fomo_banner.titulo
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl font-black text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-98"
                    style={{ background: `linear-gradient(135deg, ${primario} 0%, #e11d48 100%)` }}
                  >
                    <Phone size={15} /> Reservar Promo por WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setShowFomoModal(false)}
                  className="w-full py-2.5 rounded-xl font-bold text-gray-400 hover:text-white text-xs transition-colors"
                >
                  Seguir viendo la carta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      {bookingSuccess ? '¡Cita Reservada!' : agendaMode ? 'Elige tu Horario Online' : 'Mi Sesión de Belleza'}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {bookingSuccess
                        ? 'Registrada exitosamente en el salón'
                        : `${cart.length} ${cart.length === 1 ? 'servicio elegido' : 'servicios elegidos'} · ${formatDuracion(totalDuracion)}`}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setShowCart(false); setBookingSuccess(false); setAgendaMode(false); }}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                  <X size={16} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={28} />
                  </div>
                  <p className="text-sm font-bold text-gray-800">Aún no has armado tu sesión</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Explora la vitrina y selecciona los servicios que deseas disfrutar en tu próxima visita.</p>
                </div>
              ) : bookingSuccess ? (
                /* Pantalla de Confirmación de Cita con Ticket Digital VIP */
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={36} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200/60 inline-block mb-1.5">
                      ✓ Registrada en Agenda
                    </span>
                    <h4 className="text-lg font-black text-gray-900">¡Tu cita quedó agendada!</h4>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
                      Te esperamos el <strong className="text-gray-900">{bookedCitaDetails?.fecha || selectedFecha}</strong> a las <strong className="text-gray-900">{bookedCitaDetails?.hora || selectedHora}</strong>.
                    </p>
                  </div>

                  {/* Ticket Digital Resumen */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/70 border border-gray-200/70 text-left text-xs space-y-2.5 max-w-xs mx-auto shadow-xs">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                      <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Ticket de Reserva</span>
                      {bookedCitaDetails?.id && (
                        <span className="text-[10px] font-mono font-black text-gray-700 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                          #{bookedCitaDetails.id}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium">Servicios</p>
                      <p className="font-bold text-gray-800 leading-snug">{bookedCitaDetails?.servicios || cart.map(i => i.servicio.nombre).join(' + ')}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">Duración</p>
                        <p className="font-bold text-gray-700">{bookedCitaDetails?.duracion || formatDuracion(totalDuracion)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-medium">Total Estimado</p>
                        <p className="text-emerald-700 font-black text-sm">S/. {(bookedCitaDetails?.precio ?? totalPrecio).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones: Abrir WhatsApp o Finalizar */}
                  <div className="space-y-2 max-w-xs mx-auto pt-2">
                    {bookedCitaDetails?.waLink && (
                      <a
                        href={bookedCitaDetails.waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-2xl font-black text-white text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
                        style={{ background: '#25D366' }}>
                        <Phone size={15} /> Notificar al Salón por WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => { setShowCart(false); setCart([]); setBookingSuccess(false); setAgendaMode(false); setBookedCitaDetails(null); }}
                      className="w-full py-2.5 rounded-2xl font-bold text-gray-600 hover:text-gray-900 text-xs border border-gray-200 transition-colors">
                      Entendido, cerrar ✨
                    </button>
                  </div>
                </div>
              ) : agendaMode ? (
                /* ── MODO AGENDAMIENTO CON HORARIOS EN VIVO (ULTRA-LUXE & DOPAMÍNICO) ── */
                <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-0.5">
                  
                  {/* Selector de Fecha (Píldoras de Alta Estética con Estado Ocupacional) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <CalendarIcon size={14} style={{ color: primario }} /> 1. Elige tu Día
                      </label>
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200/60">
                        ⚡ Cupos Limitados
                      </span>
                    </div>

                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 pt-0.5">
                      {diasDisponibles.map((dia, idx) => {
                        const isSel = selectedFecha === dia.iso;
                        return (
                          <motion.button
                            key={dia.iso}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setSelectedFecha(dia.iso); setSelectedHora(''); }}
                            className={`flex flex-col items-center justify-center min-w-[74px] py-2.5 px-3 rounded-2xl border transition-all relative select-none ${
                              isSel
                                ? 'border-transparent text-white shadow-md'
                                : 'border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 hover:border-gray-300'
                            }`}
                            style={{
                              background: isSel
                                ? `linear-gradient(135deg, ${primario} 0%, #db2777 100%)`
                                : undefined,
                              boxShadow: isSel ? '0 4px 14px 0 rgba(244, 63, 94, 0.35)' : undefined
                            }}>
                            <span className={`text-[9px] uppercase font-black tracking-widest ${isSel ? 'text-white/90' : 'text-gray-400'}`}>
                              {dia.diaSemana}
                            </span>
                            <span className="text-xs font-black mt-0.5 leading-tight">{dia.fechaLabel}</span>
                            {idx === 0 && (
                              <span className={`text-[8px] font-black uppercase tracking-tight mt-1 px-1.5 py-0.2 rounded-full ${
                                isSel ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              }`}>
                                Hoy
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horarios Disponibles Sincronizados con Estado Ocupado / Libre de Lujo */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                        <Clock size={14} style={{ color: primario }} /> 2. Horario de tu Cita
                      </label>
                      <span className="text-[10px] text-gray-500 font-bold bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                        {loadingSlots ? 'Consultando agenda...' : `Duración: ${formatDuracion(totalDuracion)}`}
                      </span>
                    </div>

                    {loadingSlots ? (
                      <div className="py-10 flex flex-col justify-center items-center gap-2 text-xs text-gray-400">
                        <Loader2 size={20} className="animate-spin text-rose-500" />
                        <span className="font-bold">Verificando agenda en tiempo real...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar pt-0.5">
                        {horariosDisponibles.map(slot => {
                          const isSelected = selectedHora === slot.hora;
                          return (
                            <motion.button
                              key={slot.hora}
                              whileTap={slot.libre ? { scale: 0.95 } : undefined}
                              disabled={!slot.libre}
                              onClick={() => setSelectedHora(slot.hora)}
                              className={`py-2.5 px-1 rounded-2xl text-xs font-black transition-all relative flex flex-col items-center justify-center ${
                                !slot.libre
                                  ? 'bg-gray-100/80 dark:bg-neutral-800/60 text-gray-300 dark:text-neutral-600 border border-transparent cursor-not-allowed select-none'
                                  : isSelected
                                    ? 'text-white shadow-lg border-transparent scale-[1.02]'
                                    : 'bg-white dark:bg-neutral-900 border border-gray-200/90 dark:border-neutral-800 text-gray-800 dark:text-white hover:border-rose-300 hover:shadow-xs'
                              }`}
                              style={{
                                background: isSelected && slot.libre
                                  ? `linear-gradient(135deg, ${primario} 0%, #e11d48 100%)`
                                  : undefined,
                                boxShadow: isSelected ? '0 4px 14px 0 rgba(244, 63, 94, 0.35)' : undefined
                              }}>
                              <span>{slot.hora}</span>
                              {!slot.libre ? (
                                <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400 dark:text-neutral-500 mt-0.5">
                                  Ocupado
                                </span>
                              ) : isSelected ? (
                                <span className="text-[8px] font-black uppercase tracking-tighter text-white/90 mt-0.5">
                                  Elegido ✓
                                </span>
                              ) : null}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Datos de la clienta (Reconocimiento VIP o Datos Nuevos) */}
                  <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
                    {/* CASO A: Clienta Ya Identificada (Modo Credencial VIP de 1 Toque) */}
                    {clientaEncontrada && clienteNombre && !editandoPerfilVip ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-purple-500/10 border border-amber-300/40 relative overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                              👑
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.2 rounded-md">
                                  Clienta Frecuente VIP
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-gray-900 truncate">
                                Reservando como {clienteNombre}
                              </h4>
                              <p className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                                <span>🇵🇪 +{codigoPais} {clienteTelefono}</span>
                                <span className="text-emerald-600 font-black">✓ Verificado</span>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setEditandoPerfilVip(true)}
                            className="text-[10px] font-black text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-2.5 py-1.5 rounded-xl shadow-2xs shrink-0 active:scale-95 transition-all">
                            Cambiar
                          </button>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-amber-200/40 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            ⚡ Agendamiento instantáneo con 1 solo clic
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* CASO B: Formulario de Celular & Nombre (Nueva Clienta o Edición) */
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                              <Phone size={13} style={{ color: primario }} /> 3. ¿A qué WhatsApp enviamos tus recordatorios? *
                            </label>
                            {buscandoClienta && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                                <Loader2 size={10} className="animate-spin" /> Verificando...
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Selector / Badge de Código de País (Perú +51 por defecto) */}
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl px-3.5 py-3 text-xs font-black text-gray-700 dark:text-gray-200 shrink-0 select-none shadow-2xs">
                              <span className="text-base leading-none">🇵🇪</span>
                              <span>+{codigoPais}</span>
                            </div>

                            {/* Input de Número Local */}
                            <div className="relative flex-1">
                              <input
                                type="tel"
                                placeholder="987 654 321"
                                value={clienteTelefono}
                                onChange={e => handleTelefonoChange(e.target.value)}
                                className={`w-full bg-gray-50 dark:bg-neutral-800 border rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all ${
                                  clientaEncontrada 
                                    ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/20 text-gray-900 dark:text-white ring-2 ring-emerald-500/10' 
                                    : 'border-gray-200 dark:border-neutral-700 focus:border-rose-400 text-gray-900 dark:text-white'
                                }`}
                              />
                              {clientaEncontrada && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                  <Check size={14} />
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 pl-1 font-medium">
                            Te avisamos 2 horas antes de tu cita para que no pierdas tu cupo.
                          </p>
                        </div>

                        {/* Input de Nombre */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-black text-gray-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                            <User size={13} style={{ color: primario }} /> ¿Cuál es tu nombre? *
                          </label>
                          <input
                            type="text"
                            placeholder="Tu nombre y apellido"
                            value={clienteNombre}
                            onChange={e => setClienteNombre(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-rose-400 text-gray-900 dark:text-white transition-colors"
                          />
                        </div>

                        {editandoPerfilVip && (
                          <button
                            type="button"
                            onClick={() => setEditandoPerfilVip(false)}
                            className="text-[11px] font-bold text-gray-500 hover:text-gray-800 underline block pt-0.5">
                            ← Volver a vista rápida de perfil
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botón de Confirmación Dopamínico */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirmarCita}
                    disabled={bookingSaving || !selectedHora || !clienteNombre.trim()}
                    className="w-full py-4 rounded-2xl font-black text-white text-sm flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all disabled:opacity-50 mt-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:brightness-105 border border-emerald-400/30">
                    {bookingSaving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    {selectedHora ? `Confirmar para las ${selectedHora} ➔` : 'Selecciona un horario'}
                  </motion.button>
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
                          <CalendarIcon size={17} /> Elegir Horario y Agendar Cita
                        </button>

                        <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer"
                          className="w-full py-2.5 rounded-xl font-bold text-gray-600 hover:text-gray-900 text-xs flex items-center justify-center gap-1.5 border border-gray-200 transition-colors">
                          <Phone size={13} /> O consultar por WhatsApp
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
                        <Phone size={17} /> Reservar Sesión por WhatsApp
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
            className="fixed bottom-[64px] left-3 right-3 z-30 max-w-lg mx-auto"
          >
            <div
              onClick={() => {
                setShowCart(true);
                if (canDirectBooking) setAgendaMode(true);
              }}
              className="p-3 rounded-2xl shadow-xl flex items-center justify-between text-white cursor-pointer active:scale-[0.98] transition-transform border border-white/20 backdrop-blur-md"
              style={{ background: `linear-gradient(135deg, ${primario} 0%, #111827 100%)` }}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-white/20">
                  {cart.length}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-black leading-tight truncate">
                      {cart.length === 1 ? '1 servicio seleccionado' : `${cart.length} servicios para tu look`}
                    </p>
                    {totalPrecio >= 100 && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-black px-1.5 py-0.2 rounded-md shrink-0 flex items-center gap-0.5">
                        <Sparkles size={9} /> VIP
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-white/85 font-medium mt-0.5 truncate">
                    Total: <strong className="text-white font-black">S/. {totalPrecio.toFixed(2)}</strong> · {formatDuracion(totalDuracion)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white text-gray-900 font-bold text-xs px-3 py-2 rounded-xl shadow-md shrink-0">
                <span>{canDirectBooking ? 'Agendar' : 'Ver Sesión'}</span>
                <ChevronRight size={13} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 10. BOTTOM NAVIGATION BAR ESTILO APP NATIVA ───────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => { setActiveNavTab('menu'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black tracking-wider uppercase transition-colors ${
            activeNavTab === 'menu' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}>
          <Home size={18} />
          VITRINA
        </button>

        <button
          onClick={() => setShowSearchModal(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-black tracking-wider uppercase transition-colors text-gray-400 hover:text-gray-600">
          <Search size={18} />
          BUSCAR
        </button>

        <button
          onClick={() => { setActiveNavTab('promos'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-black tracking-wider uppercase transition-colors ${
            activeNavTab === 'promos' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}>
          <Gift size={18} />
          PROMOS
        </button>

        <button
          onClick={() => { setShowCart(true); setAgendaMode(false); }}
          className={`relative flex flex-col items-center gap-0.5 text-[10px] font-black tracking-wider uppercase transition-colors ${
            cart.length > 0 ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}>
          <Sparkles size={18} />
          {cart.length > 0 && (
            <span className="absolute -top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
              {cart.length}
            </span>
          )}
          MI SESIÓN
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

