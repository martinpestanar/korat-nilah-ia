import React, { useState, useEffect } from 'react';
import {
  Crown, Sparkles, Check, Zap, MessageCircle, ShieldCheck,
  ChevronRight, Smartphone, Landmark, CreditCard, Gift, Clock,
  DollarSign, BarChart3, Bot, ArrowUpRight, Flame, HeartHandshake,
  Eye, ShoppingBag, Send, Users, Star, X, CheckCircle2, TrendingUp,
  Percent, Award, ShieldAlert, Sparkle, Tag, Copy, CheckCheck,
  HelpCircle, ExternalLink, SlidersHorizontal, Calendar, Camera, Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { fetchPrecios } from '../services/godmode';

type StoreCategory = 'all' | 'combos' | 'whatsapp' | 'marketing' | 'creative';
type PaymentTab = 'yape' | 'bcp' | 'whatsapp';

interface AddonItem {
  id: string;
  category: 'combos' | 'whatsapp' | 'marketing' | 'creative';
  nombre: string;
  emoji: string;
  badge: string;
  badgeType: 'highlight' | 'popular' | 'saving' | 'physical';
  precioUsd: number;
  precioPen: number;
  precioRegularUsd?: number;
  precioRegularPen?: number;
  tipoCobro: string;
  subtitulo: string;
  dolorQueResuelve: string;
  beneficios: string[];
  comoFunciona: string[];
  ejemploMensaje?: string;
  isCombo?: boolean;
  isPhysical?: boolean;
  featureKey?: string;
}

const DEFAULT_STORE_ITEMS: AddonItem[] = [
  // ─── COMBOS & PLANES ───
  {
    id: 'plan_glow_pro',
    category: 'combos',
    nombre: 'Plan Glow PRO 360° (Todo Incluido)',
    emoji: '⭐',
    badge: 'MÁS ELEGIDO — EL QUE SE PAGA SOLO',
    badgeType: 'highlight',
    precioUsd: 39,
    precioPen: 149,
    precioRegularUsd: 65,
    precioRegularPen: 249,
    tipoCobro: '/mes',
    subtitulo: 'Sistema automático completo para retención, citas y ventas por WhatsApp.',
    dolorQueResuelve: 'Elimina el trabajo manual de agendar, recordar citas y perseguir clientas que no regresan.',
    beneficios: [
      'Recordatorios automáticos 24h y 3h por WhatsApp con confirmación',
      'Rescate inteligente de clientas inactivas (45d/75d/120d)',
      'Avisos automáticos de retoque de pestañas y uñas a los 21 días',
      'Campañas de marketing masivo por WhatsApp para días flojos',
      'Nilah Creative Studio (Flyers y diseños con IA ilimitados)',
      'Club de Puntos y Fidelización digital de clientas VIP',
      'Capacidad de clientas y citas 100% ILIMITADAS',
      'Soporte prioritario directo con el equipo técnico',
    ],
    comoFunciona: [
      'Activamos todas las herramientas en tu cuenta en menos de 10 minutos.',
      'Tu salón envía recordatorios y promociones sin que tengas que tocar el celular.',
      'Aumentas la retención y la facturación de tu negocio desde la primera semana.',
    ],
    ejemploMensaje: '¡Hola Camila! ✨ Te recordamos tu cita de *Lifting de Pestañas* mañana a las 4:00 PM en Bella Studio. ¿Nos confirmas tu asistencia? 👇',
    isCombo: true,
    featureKey: 'glow_pro_all',
  },
  {
    id: 'combo_anti_plantones_rescate',
    category: 'combos',
    nombre: 'Combo Dúo: Anti-Plantones + Rescate',
    emoji: '🚀',
    badge: 'AHORRA S/ 19/MES',
    badgeType: 'saving',
    precio: 79,
    precioRegular: 98,
    tipoCobro: '/mes',
    subtitulo: 'Recordatorios automáticos + reactivación de clientas dormidas.',
    dolorQueResuelve: 'Elimina los plantones en tu salón y trae de vuelta a las clientas que ya no te escriben.',
    beneficios: [
      'Recordatorios automáticos 24h y 3h antes con confirmación directa',
      'Aviso automático a los 21 días para retoque de pestañas/uñas',
      'Campañas de reactivación de clientas que no vienen hace +30 días',
      'Precio especial con 20% de descuento por combo',
    ],
    comoFunciona: [
      'Conectamos las automatizaciones de recordatorio y retención a tu agenda.',
      'El sistema detecta los tiempos y envía los mensajes en el momento exacto.',
      'Recuperas al menos 3 a 6 citas por semana.',
    ],
    ejemploMensaje: '¡Hola Vale! 🌸 Ya pasaron 21 días desde tus pestañas pelo a pelo. ¿Te gustaría agendar tu retoque esta semana con 10% de descuento?',
    isCombo: true,
  },

  // ─── WHATSAPP & AUTOMATIZACIONES ───
  {
    id: 'pack_anti_plantones',
    category: 'whatsapp',
    nombre: 'Recordatorios WhatsApp Anti-Plantones',
    emoji: '⚡',
    badge: 'MÁS POPULAR',
    badgeType: 'popular',
    precio: 49,
    tipoCobro: '/mes',
    subtitulo: 'Recordatorios automáticos 24h y 3h antes con botón de confirmación.',
    dolorQueResuelve: 'Evita perder dinero y tiempo preparando tu cabina para clientas que no llegan ni avisan.',
    beneficios: [
      'Reduce hasta el 90% de inasistencias y olvidos',
      'Mensaje formal con nombre de clienta, hora, fecha y servicio',
      'La clienta confirma con 1 clic y se actualiza en tu calendario',
      'Ahorra más de 2 horas al día de enviar mensajes manuales',
    ],
    comoFunciona: [
      'Agendas una cita normal en tu calendario de Nilah.',
      '24h y 3h antes de la cita, Nilah envía un WhatsApp automático.',
      'La clienta confirma o solicita reagendar.',
    ],
    ejemploMensaje: '¡Hola Sofía! 💅 Te recordamos tu cita de *Uñas Acrílicas* hoy a las 5:00 PM. Por favor responde *SI* para confirmar tu asistencia.',
    featureKey: 'recordatorios',
  },
  {
    id: 'pack_rescate_inactivas',
    category: 'whatsapp',
    nombre: 'Rescate de Clientas & Retoques 21d',
    emoji: '💸',
    badge: 'ALTO RETORNO',
    badgeType: 'highlight',
    precio: 49,
    tipoCobro: '/mes',
    subtitulo: 'Avisa retoques a los 21 días y recupera clientas inactivas (+30d).',
    dolorQueResuelve: 'El 40% de las clientas no regresan porque simplemente olvidan agendar a tiempo.',
    beneficios: [
      'Aviso inteligente a los 15-21 días para cita de mantenimiento',
      'Mensaje de reactivación para clientas inactivas que no van hace 45 días',
      'Fideliza y convierte clientas ocasionales en clientas fijas mensuales',
      'Se paga solo con tan solo 1 cita recuperada al mes',
    ],
    comoFunciona: [
      'El sistema analiza la última visita de cada clienta.',
      'Al cumplir los 21 días o 45 días, envía una invitación cordial.',
      'La clienta agenda su cita en segundos.',
    ],
    ejemploMensaje: '¡Hola Andrea! ✨ Te extrañamos en el salón. Tenemos un regalo de *15% OFF en tu próximo servicio* si agendas esta semana.',
    featureKey: 'rescate',
  },

  // ─── MARKETING & VENTAS ───
  {
    id: 'pack_marketing_masivo',
    category: 'marketing',
    nombre: 'Campañas Masivas de WhatsApp',
    emoji: '📢',
    badge: 'LLENA DÍAS FLOJOS',
    badgeType: 'popular',
    precio: 69,
    tipoCobro: '/mes',
    subtitulo: 'Envía promociones y avisos a toda tu base de clientas en 1 solo clic.',
    dolorQueResuelve: 'Llena tus turnos vacíos de los días de menor movimiento con ofertas relámpago.',
    beneficios: [
      'Envíos masivos personalizados con el nombre de cada clienta',
      'Segmentación de clientas VIP vs Nuevas o Inactivas',
      'Generador de textos persuasivos con IA para promociones',
      'Envíos espaciados inteligentes para proteger tu WhatsApp',
    ],
    comoFunciona: [
      'Redactas la oferta o dejas que la IA cree el texto de la promo.',
      'Seleccionas a qué grupo de clientas enviar.',
      'Presionas enviar y recibes respuestas al instante.',
    ],
    ejemploMensaje: '¡Hola Lucía! 🌸 Promo solo por hoy martes: *Lifting + Tinte de Pestañas con 25% OFF*. Solo 4 cupos disponibles. ¿Te guardamos uno?',
    featureKey: 'marketing',
  },
  {
    id: 'stand_qr_acrilico',
    category: 'marketing',
    nombre: 'Stand QR Acrílico Reseñas Google 5★',
    emoji: '📍',
    badge: 'PRODUCTO FÍSICO',
    badgeType: 'physical',
    precio: 79,
    tipoCobro: ' pago único',
    subtitulo: 'Stand acrílico grabado para tu mostrador/caja con código QR.',
    dolorQueResuelve: 'Consigue que tus clientas felices dejen reseñas de 5 estrellas en Google Maps.',
    beneficios: [
      'Stand acrílico grabado de alta calidad con el logo de tu salón',
      'La clienta escanea y va directo a calificar 5 estrellas en Google',
      'Posiciona tu salón en los primeros lugares de Google Maps en tu zona',
      'Incluye envío a todo el Perú hasta la puerta de tu salón',
    ],
    comoFunciona: [
      'Nos envías el enlace de Google Maps y logo de tu negocio.',
      'Grabamos y fabricamos tu stand acrílico personalizado.',
      'Te lo enviamos listo para usar en tu recepción o mostrador.',
    ],
    isPhysical: true,
  },

  // ─── DISEÑO IA & FIDELIZACIÓN ───
  {
    id: 'nilah_creative_studio',
    category: 'creative',
    nombre: 'Nilah Creative Studio (Flyers con IA)',
    emoji: '✨',
    badge: 'DISEÑO EN SEGUNDOS',
    badgeType: 'highlight',
    precio: 39,
    tipoCobro: '/mes',
    subtitulo: 'Crea flyers y piezas profesionales para Instagram y estados de WhatsApp.',
    dolorQueResuelve: 'Evita gastar cientos de soles en diseñadores para publicar ofertas bonitas.',
    beneficios: [
      'Generador de imágenes estéticas de pestañas, cejas y uñas con IA',
      'Personalizado con tu paleta de colores y logo del salón',
      'Formatos listos para Historias, Reels y Estados',
      'Ahorra tiempo y mantén tus redes siempre activas',
    ],
    comoFunciona: [
      'Escribes qué quieres anunciar (ej: "Promo San Valentín").',
      'La IA genera propuestas de diseño listas para descargar.',
      'Publicas en tus redes en alta resolución.',
    ],
    featureKey: 'nilah_creative',
  },
  {
    id: 'club_fidelizacion_puntos',
    category: 'creative',
    nombre: 'Club de Puntos & Fidelización Digital',
    emoji: '👑',
    badge: 'CLIENTAS LEALES',
    badgeType: 'popular',
    precio: 39,
    tipoCobro: '/mes',
    subtitulo: 'Tarjeta digital de puntos para premiar y retener a tus clientas frecuentes.',
    dolorQueResuelve: 'Asegura que tus clientas no se vayan con la competencia fidelizándolas con premios.',
    beneficios: [
      'Puntos automáticos acumulables por cada servicio realizado',
      'Premios configurables (ej: "A los 100 pts: Exfoliación gratis")',
      'Portal web para que la clienta consulte su saldo de puntos',
      'Ranking de mejores clientas del salón para consentirlas',
    ],
    comoFunciona: [
      'Al completar una cita, el sistema suma los puntos a la clienta.',
      'La clienta recibe el saldo por WhatsApp en su tarjeta VIP.',
      'Canjea su premio en su próxima visita.',
    ],
    featureKey: 'fidelizacion',
  },
  {
    id: 'pack_expansion_clientas',
    category: 'creative',
    nombre: 'Paquete Expansión: +100 Clientas Extra',
    emoji: '👥',
    badge: 'AMPLIAR CUPO',
    badgeType: 'saving',
    precio: 19,
    tipoCobro: '/mes',
    subtitulo: 'Amplía la capacidad de tu base de datos si superas las 100 clientas.',
    dolorQueResuelve: 'Continúa registrando clientas en el Plan Básico sin necesidad de pagar el plan PRO completo.',
    beneficios: [
      '+100 cupos adicionales para fichas de clientas e historial',
      'Conserva tu Plan Glow Básico sin costo fijo alto',
      'Acumulable: puedes sumar varios paquetes según crezcas',
      'Activación inmediata sin interrupciones en tu agenda',
    ],
    comoFunciona: [
      'Pagas la ampliación de cupo.',
      'Se habilitan 100 espacios adicionales en tu base de datos.',
      'Sigues registrando clientas sin límites.',
    ],
  },
];

const CATEGORIES: { id: StoreCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos los Módulos', icon: '✨' },
  { id: 'combos', label: 'Packs & Planes', icon: '🚀' },
  { id: 'whatsapp', label: 'WhatsApp & Recordatorios', icon: '💬' },
  { id: 'marketing', label: 'Marketing & Ventas', icon: '📢' },
  { id: 'creative', label: 'Diseño IA & Fidelización', icon: '👑' },
];

export const StorePage: React.FC = () => {
  const { user, isPro, hasSaaSModule, recursosSaaS } = useAuth();
  const { clients } = useDashboardData();
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory>('all');
  const [storeItems, setStoreItems] = useState<AddonItem[]>(DEFAULT_STORE_ITEMS);
  
  // Modals state
  const [activeDetailsItem, setActiveDetailsItem] = useState<AddonItem | null>(null);
  const [activeCheckoutItem, setActiveCheckoutItem] = useState<AddonItem | null>(null);
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('yape');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const clientCount = clients?.length || 0;
  const maxFreeClients = 100;
  const clientPercent = Math.min(100, Math.round((clientCount / maxFreeClients) * 100));

  const isCurrentPlanPro = isPro || user?.plan === 'Glow Pro' || user?.plan === 'Glow Elite' || user?.plan === 'Copilot';

  // Cargar precios dinámicos desde la base de datos (SuperAdmin)
  useEffect(() => {
    fetchPrecios().then(data => {
      const glowProDb = data.find(p => p.id === 'glow_pro');
      if (glowProDb) {
        setStoreItems(prev => prev.map(item => {
          if (item.id === 'plan_glow_pro') {
            return {
              ...item,
              precioUsd: glowProDb.precio || 39,
              precioPen: glowProDb.precio_pen || 149,
              precioRegularUsd: glowProDb.precio_regular || 65,
              precioRegularPen: glowProDb.precio_regular_pen || 249,
            };
          }
          return item;
        }));
      }
    }).catch(err => console.warn('Error loading dynamic prices in store:', err));
  }, []);

  // Verifica si el usuario ya posee este módulo/feature
  const isItemOwned = (item: AddonItem): boolean => {
    if (item.isPhysical) return false;

    if (isCurrentPlanPro) {
      return true;
    }

    if (item.featureKey === 'recordatorios') {
      return !!recursosSaaS?.automatizaciones?.permitir_recordatorios;
    }
    if (item.featureKey === 'rescate') {
      return !!recursosSaaS?.automatizaciones?.permitir_rescate;
    }
    if (item.featureKey === 'marketing') {
      return hasSaaSModule('marketing');
    }
    if (item.featureKey === 'nilah_creative') {
      return hasSaaSModule('nilah_creative');
    }
    if (item.featureKey === 'fidelizacion') {
      return !!recursosSaaS?.tipo_fidelizacion;
    }

    return false;
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const openWhatsAppCheckout = (item: AddonItem) => {
    const phone = '51926285289';
    const msg = `¡Hola Martín! Quiero activar el paquete *${item.nombre}* ($${item.precioUsd} USD / ~ S/ ${item.precioPen} PEN${item.tipoCobro}) para mi salón *${user?.nombreNegocio || user?.name || ''}*.\n\n¿Me podrías brindar los datos para coordinar la activación? 🚀`;
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const filteredItems = selectedCategory === 'all'
    ? storeItems
    : storeItems.filter((item) => item.category === selectedCategory);

  // ─── SI ES USUARIO PRO: MOSTRAR VISTA VIP COMPLETA "TODO INCLUIDO" ───
  if (isCurrentPlanPro) {
    return (
      <div className="w-full min-w-0 max-w-4xl mx-auto py-10 px-4 text-center font-sans space-y-6 animate-in fade-in duration-300">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-violet-600/15 via-fuchsia-600/5 to-transparent border-2 border-violet-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30 mb-6">
            <Crown size={40} className="text-amber-300 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-300 text-xs font-black uppercase tracking-wider mb-4">
            <Sparkles size={14} className="text-amber-400" />
            <span>Suscripción PRO 360° Activa</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            ¡Tienes la Suite Completa de Nilah! ✨
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto leading-relaxed">
            Tu salón cuenta con el <strong>Plan Glow PRO</strong>. No necesitas comprar paquetes adicionales porque ya tienes todas las automatizaciones de WhatsApp, marketing, inteligencia artificial y cupos de clientas <strong>ilimitados</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-6 text-left">
            {[
              { icon: '⏰', t: 'Recordatorios 24h/3h', d: 'Anti-plantones activo' },
              { icon: '💅', t: 'Retoques & Rescate', d: 'Piloto automático 24/7' },
              { icon: '📢', t: 'Marketing & Flyers', d: 'Envíos y diseños ilimitados' },
            ].map((b, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/5 border border-violet-200/50 dark:border-white/10 flex items-start gap-2.5">
                <span className="text-xl">{b.icon}</span>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{b.t}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{b.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8">
            <a
              href={`https://wa.me/51926285289?text=${encodeURIComponent(`Hola Martín! Soy del salón ${user?.nombreNegocio || ''}, tengo Plan PRO y necesito soporte o una consulta personalizada.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-lg shadow-violet-600/30 transition-all active:scale-95"
            >
              <MessageCircle size={16} /> Contactar Soporte VIP Prioritario
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-8 pb-24 px-3 sm:px-4 animate-in fade-in duration-300 font-sans">

      {/* ─── 1. HERO BANNER INSPIRADO EN LA LANDING DE NILAH ─── */}
      <div className="rounded-[2rem] bg-gradient-to-br from-violet-50/80 via-fuchsia-50/40 to-white dark:from-violet-500/10 dark:via-fuchsia-500/5 dark:to-[#121212] border border-violet-200/80 dark:border-violet-500/20 p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-72 h-72 bg-violet-400/10 dark:bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-fuchsia-400/10 dark:bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 dark:border-violet-500/30 bg-white dark:bg-violet-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300 shadow-xs">
              <Sparkles size={14} className="text-fuchsia-500" />
              <span>Tienda & Módulos Nilah</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              Potencia tu Salón con{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                Herramientas Pro
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {isCurrentPlanPro
                ? '¡Tu salón está en el Plan Glow PRO! Tienes todas las herramientas automáticas de WhatsApp y capacidad ilimitada activas.'
                : 'Activa solo los módulos que necesitas a la carta o da el salto a Glow PRO cuando quieras automatizar al 100%.'}
            </p>
          </div>

          {/* Tarjeta de Estado & Capacidad */}
          <div className="w-full md:w-72 bg-white/90 dark:bg-[#181818]/90 backdrop-blur-md rounded-3xl border border-violet-200/60 dark:border-white/10 p-5 shadow-lg shadow-violet-500/5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Plan Actual:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isCurrentPlanPro
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
              }`}>
                {isCurrentPlanPro ? '⭐ GLOW PRO' : '🌱 GLOW BÁSICO'}
              </span>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Users size={14} className="text-violet-500" /> Capacidad:
                </span>
                <span className="text-gray-900 dark:text-white">
                  {isCurrentPlanPro ? 'Ilimitadas ✨' : `${clientCount} / ${maxFreeClients}`}
                </span>
              </div>

              {!isCurrentPlanPro && (
                <>
                  <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        clientPercent > 80
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-violet-600 to-fuchsia-600'
                      }`}
                      style={{ width: `${clientPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
                    <span>{Math.max(0, maxFreeClients - clientCount)} cupos libres</span>
                    <button
                      onClick={() => {
                        const pack = STORE_ITEMS.find(i => i.id === 'pack_expansion_clientas');
                        if (pack) setActiveCheckoutItem(pack);
                      }}
                      className="text-violet-600 dark:text-violet-400 font-bold hover:underline cursor-pointer"
                    >
                      +100 cupos (S/ 19)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. SUB-PESTAÑAS DE CATEGORÍA (ESTILO TABS NILAH) ─── */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto hide-scrollbar scrollbar-hide py-1 -mx-3 px-3 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white dark:bg-[#141414] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30 hover:text-violet-600'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 3. GRID DE CARDS CON EL DISEÑO DE LA LANDING DE NILAH ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const owned = isItemOwned(item);
          const isGlowProCard = item.id === 'plan_glow_pro';

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`rounded-[2rem] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 relative overflow-visible ${
                owned
                  ? 'bg-emerald-500/[0.03] dark:bg-emerald-500/[0.04] border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-sm'
                  : isGlowProCard
                    ? 'bg-white dark:bg-[#181818] border-2 border-violet-500 shadow-xl shadow-violet-500/10 hover:shadow-violet-500/20'
                    : 'bg-white dark:bg-[#141414] border border-gray-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/30 hover:shadow-xl'
              }`}
            >
              {/* Badge Flotante para Plan Glow PRO */}
              {isGlowProCard && !owned && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md whitespace-nowrap">
                  ⭐ MÁS ELEGIDO — EL QUE SE PAGA SOLO
                </div>
              )}

              <div>
                {/* Header: Icono + Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs border ${
                    owned
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                      : isGlowProCard
                        ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/30'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/5'
                  }`}>
                    {item.emoji}
                  </div>

                  {owned ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <Check size={13} className="text-emerald-500" /> Activo en tu salón
                    </span>
                  ) : !isGlowProCard ? (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      item.badgeType === 'highlight'
                        ? 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-500/30'
                        : item.badgeType === 'popular'
                          ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30'
                          : item.badgeType === 'saving'
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                {/* Título & Subtítulo */}
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white leading-snug mb-1">
                  {item.nombre}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed line-clamp-2">
                  {item.subtitulo}
                </p>

                {/* Dolor que Resuelve (Muro de Valor Nilah) */}
                <div className="p-3 rounded-2xl bg-violet-50/50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/15 mb-4 text-xs text-gray-700 dark:text-gray-300 leading-snug">
                  💡 <strong className="text-violet-700 dark:text-violet-300 font-bold">Para tu salón:</strong> {item.dolorQueResuelve}
                </div>

                {/* Precio (USD Principal + PEN Referencial) */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    {item.precioRegularUsd && !owned ? (
                      <span className="text-xs text-gray-400 line-through font-medium">
                        ${item.precioRegularUsd}
                      </span>
                    ) : null}
                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                      ${item.precioUsd}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{item.tipoCobro}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold border border-violet-500/20">
                      ~ S/ {item.precioPen} PEN
                    </span>
                    <span className="text-[10px] text-gray-400">Referencial</span>
                  </div>
                </div>

                {/* Beneficios */}
                <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300 mb-6">
                  {item.beneficios.slice(0, 3).map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} className="text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botones de Acción */}
              <div className="space-y-2.5 pt-4 border-t border-gray-100 dark:border-white/5">
                {owned ? (
                  <div className="w-full py-3 px-4 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black text-center flex items-center justify-center gap-1.5 border border-emerald-500/20">
                    <CheckCircle2 size={15} />
                    <span>MÓDULO DESBLOQUEADO</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveCheckoutItem(item)}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                  >
                    <Zap size={15} className="fill-white" />
                    <span>ACTIVAR POR S/ {item.precio}</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveDetailsItem(item)}
                  className="w-full py-2.5 px-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Ver cómo funciona & Ejemplo</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ─── 4. MODAL DETALLES & EJEMPLO DE WHATSAPP ─── */}
      <AnimatePresence>
        {activeDetailsItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-[2rem] bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activeDetailsItem.emoji}</span>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                      {activeDetailsItem.nombre}
                    </h3>
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-bold">
                      S/ {activeDetailsItem.precio} {activeDetailsItem.tipoCobro}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveDetailsItem(null)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Cómo Funciona */}
                <div>
                  <h4 className="font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-violet-500" /> ¿Cómo funciona en tu salón?
                  </h4>
                  <div className="space-y-2 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                    {activeDetailsItem.comoFunciona.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="h-5 w-5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ejemplo Real de WhatsApp */}
                {activeDetailsItem.ejemploMensaje && (
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                      <MessageCircle size={14} className="text-emerald-500" /> Mensaje que recibe la clienta por WhatsApp:
                    </h4>
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 text-gray-800 dark:text-emerald-100 leading-relaxed text-xs">
                      {activeDetailsItem.ejemploMensaje}
                    </div>
                  </div>
                )}

                {/* Beneficios Completos */}
                <div>
                  <h4 className="font-extrabold text-gray-900 dark:text-white mb-1.5">
                    Lo que incluye:
                  </h4>
                  <div className="space-y-1.5">
                    {activeDetailsItem.beneficios.map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-violet-500 shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botón hacia Checkout */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/10 flex gap-2">
                <button
                  onClick={() => {
                    const item = activeDetailsItem;
                    setActiveDetailsItem(null);
                    setActiveCheckoutItem(item);
                  }}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Zap size={14} className="fill-white" />
                  <span>Comprar / Activar (${activeDetailsItem.precioUsd} USD)</span>
                </button>
                <button
                  onClick={() => setActiveDetailsItem(null)}
                  className="py-3.5 px-4 rounded-2xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 5. MODAL DE CHECKOUT & PAGO RÁPIDO ─── */}
      <AnimatePresence>
        {activeCheckoutItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-[2rem] bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-black text-violet-600 dark:text-violet-400 tracking-wider">
                    Activar Funcionalidad
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-tight">
                    {activeCheckoutItem.nombre}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveCheckoutItem(null)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Resumen del Monto */}
              <div className="p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-500/10 border border-violet-200/80 dark:border-violet-500/20 mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Total a Pagar:</p>
                  <p className="text-[11px] text-gray-500">Activación en menos de 10 minutos ⚡</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                    ${activeCheckoutItem.precioUsd} USD
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                    ~ S/ {activeCheckoutItem.precioPen} PEN {activeCheckoutItem.tipoCobro}
                  </p>
                </div>
              </div>

              {/* Tabs de Métodos de Pago */}
              <div className="space-y-3 mb-5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  Selecciona método de pago:
                </label>

                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-white/5">
                  <button
                    onClick={() => setPaymentTab('yape')}
                    className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      paymentTab === 'yape'
                        ? 'bg-white dark:bg-[#222] text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    <span>🟣 Yape / Plin</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('bcp')}
                    className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      paymentTab === 'bcp'
                        ? 'bg-white dark:bg-[#222] text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    <span>🔵 BCP Soles</span>
                  </button>
                  <button
                    onClick={() => setPaymentTab('whatsapp')}
                    className={`py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      paymentTab === 'whatsapp'
                        ? 'bg-white dark:bg-[#222] text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    <span>💳 Tarjeta / Otro</span>
                  </button>
                </div>

                {/* Detalle de Cuenta según Tab */}
                {paymentTab === 'yape' && (
                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Número Yape / Plin:</span>
                      <button
                        onClick={() => handleCopy('926285289', 'yape')}
                        className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {copiedText === 'yape' ? <CheckCheck size={13} /> : <Copy size={13} />}
                        <span>{copiedText === 'yape' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono tracking-wider">
                      926 285 289
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Titular: <strong className="text-gray-800 dark:text-gray-200">Martín Pestana</strong>
                    </p>
                  </div>
                )}

                {paymentTab === 'bcp' && (
                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Cuenta BCP Soles:</span>
                      <button
                        onClick={() => handleCopy('370-72845703-0-69', 'bcp')}
                        className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        {copiedText === 'bcp' ? <CheckCheck size={13} /> : <Copy size={13} />}
                        <span>{copiedText === 'bcp' ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-base font-black text-blue-700 dark:text-blue-300 font-mono">
                      370-72845703-0-69
                    </p>
                    <p className="text-[11px] text-gray-500">
                      CCI: <span className="font-mono text-gray-700 dark:text-gray-300">002-37017284570306941</span>
                    </p>
                  </div>
                )}

                {paymentTab === 'whatsapp' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
                    <p className="font-bold text-gray-900 dark:text-white">Pagos con Tarjeta o Internacionales</p>
                    <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
                      Si prefieres pagar con tarjeta de crédito/débito o estás fuera de Perú, te enviaremos un link de pago seguro por WhatsApp.
                    </p>
                  </div>
                )}
              </div>

              {/* Instrucción de Comprobante */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs mb-5 space-y-1">
                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  📸 Paso final para activación:
                </p>
                <p className="text-amber-800 dark:text-amber-300/90 text-[11px] leading-relaxed">
                  Realiza el pago y presiona el botón para <strong>enviar tu captura de comprobante a nuestro WhatsApp de soporte</strong>. Te lo habilitamos en tu salón en menos de 10 minutos.
                </p>
              </div>

              {/* Botón Principal de Enviar Comprobante */}
              <button
                onClick={() => {
                  openWhatsAppCheckout(activeCheckoutItem);
                  setActiveCheckoutItem(null);
                }}
                className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                <MessageCircle size={16} />
                <span>ENVIAR CAPTURA AL WHATSAPP (+51 926 285 289)</span>
                <ArrowUpRight size={14} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StorePage;
