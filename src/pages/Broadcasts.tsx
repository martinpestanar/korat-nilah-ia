/**
 * Broadcasts - Módulo Mobile-First de Envíos Masivos
 * Diseñado estilo Nativo App Móvil con filtro de audiencias combinadas,
 * segmentos CRM inteligentes basados en comportamiento real y copys con variables dinámicas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Filter, Users, MessageSquare, Plus, Edit3, Trash2,
  CheckCircle2, AlertCircle, Zap, RefreshCw,
  Smartphone, Check, Crown, Heart, Star, TrendingDown, UserX, UserCheck,
  Gift, Clock, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { broadcasts as broadcastsApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { CopyPromocional, BroadcastAudienceClient } from '../types/broadcastTypes';

// ── Servicios Presets (por tipo de servicio en el salón)
const SERVICIOS_PRESETS = [
  { id: 'todos', label: 'Todos los servicios', icon: '✨', color: 'from-violet-500 to-purple-600' },
  { id: 'unas',     label: 'Uñas / Manicura',   icon: '💅', color: 'from-pink-500 to-rose-600' },
  { id: 'pestanas', label: 'Pestañas / Cejas',   icon: '👁️', color: 'from-purple-500 to-violet-600' },
  { id: 'cabello',  label: 'Cabello',             icon: '💇', color: 'from-amber-500 to-orange-600' },
  { id: 'facial',   label: 'Facial / Piel',       icon: '💆', color: 'from-emerald-500 to-teal-600' },
  { id: 'pedicura', label: 'Pedicura / Pies',     icon: '🦶', color: 'from-blue-500 to-cyan-600' },
];

// ... (resto de SERVICIOS_PRESETS y SEGMENTOS_CRM se mantiene)


// ── Segmentos CRM Inteligentes (basados en comportamiento real)
const SEGMENTOS_CRM = [
  {
    id: 'todas',
    label: 'Toda la Base',
    sublabel: 'Todas las clientas disponibles',
    icon: Users,
    emoji: '🌟',
    color: 'violet',
    activeBgDark: 'bg-violet-950/40 border-violet-500/60 shadow-violet-900/20',
    activeBgLight: 'bg-violet-50 border-violet-500/60 shadow-violet-100',
    accentTextDark: 'text-violet-400',
    accentTextLight: 'text-violet-700',
    badgeDark: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
    badgeLight: 'bg-violet-100 border-violet-300 text-violet-800',
    strategy: 'Máximo alcance para campañas de temporada o anuncios generales',
    diasIntegrados: false,
  },
  {
    id: 'en_riesgo',
    label: 'En Riesgo 🚨',
    sublabel: '2+ visitas • 31-60 días sin venir',
    icon: AlertTriangle,
    emoji: '⚠️',
    color: 'amber',
    activeBgDark: 'bg-amber-950/40 border-amber-500/60 shadow-amber-900/20',
    activeBgLight: 'bg-amber-50 border-amber-500/60 shadow-amber-100',
    accentTextDark: 'text-amber-400',
    accentTextLight: 'text-amber-800',
    badgeDark: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    badgeLight: 'bg-amber-100 border-amber-300 text-amber-900',
    strategy: 'Las que conocen el salón pero están a punto de abandonar. Rescatar con oferta urgente.',
    cta: '¡Actúa YA! Cada día que pasa las pierdes.',
    diasIntegrados: true,
    rangoDiasLabel: '31 a 60 días sin venir'
  },
  {
    id: 'dormidas',
    label: 'Dormidas / Perdidas 😴',
    sublabel: '1+ visitas • +60 días sin volver',
    icon: UserX,
    emoji: '💔',
    color: 'rose',
    activeBgDark: 'bg-rose-950/40 border-rose-500/60 shadow-rose-900/20',
    activeBgLight: 'bg-rose-50 border-rose-500/60 shadow-rose-100',
    accentTextDark: 'text-rose-400',
    accentTextLight: 'text-rose-800',
    badgeDark: 'bg-rose-500/20 border-rose-500/30 text-rose-300',
    badgeLight: 'bg-rose-100 border-rose-300 text-rose-900',
    strategy: 'Clientas que ya vinieron pero desaparecieron. Necesitan una razón poderosa para volver.',
    cta: 'Campaña de rescate con descuento o regalo.',
    diasIntegrados: true,
    rangoDiasLabel: 'Más de 60 días sin venir'
  },
  {
    id: 'frecuentes',
    label: 'Frecuentes ⭐',
    sublabel: '3-9 visitas registradas',
    icon: Star,
    emoji: '⭐',
    color: 'blue',
    activeBgDark: 'bg-blue-950/40 border-blue-500/60 shadow-blue-900/20',
    activeBgLight: 'bg-blue-50 border-blue-500/60 shadow-blue-100',
    accentTextDark: 'text-blue-400',
    accentTextLight: 'text-blue-800',
    badgeDark: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    badgeLight: 'bg-blue-100 border-blue-300 text-blue-900',
    strategy: 'Clientas recurrentes fiables. Premiarlas con beneficios para convertirlas en VIP.',
    diasIntegrados: false,
  },
  {
    id: 'vip',
    label: 'VIP / Leales 👑',
    sublabel: '5+ visitas • activas últimos 60 días',
    icon: Crown,
    emoji: '👑',
    color: 'yellow',
    activeBgDark: 'bg-yellow-950/40 border-yellow-500/60 shadow-yellow-900/20',
    activeBgLight: 'bg-yellow-50 border-yellow-500/60 shadow-yellow-100',
    accentTextDark: 'text-yellow-400',
    accentTextLight: 'text-yellow-800',
    badgeDark: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    badgeLight: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    strategy: 'Las embajadoras del salón. Dales acceso exclusivo, noticias de nuevos servicios y beneficios premium.',
    cta: 'Acceso anticipado a nuevos servicios o descuento exclusivo.',
    diasIntegrados: true,
    rangoDiasLabel: 'Activas (últimos 60 días)'
  },
  {
    id: 'nuevas',
    label: 'Nuevas / 1ra Vez 🌱',
    sublabel: '1-2 visitas registradas',
    icon: UserCheck,
    emoji: '🌱',
    color: 'emerald',
    activeBgDark: 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-900/20',
    activeBgLight: 'bg-emerald-50 border-emerald-500/60 shadow-emerald-100',
    accentTextDark: 'text-emerald-400',
    accentTextLight: 'text-emerald-800',
    badgeDark: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    badgeLight: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    strategy: 'Clientas que acaban de conocerte. Momento clave para enamorarlas y convertirlas en regulares.',
    cta: 'Bienvenida especial y descuento en 2da visita.',
    diasIntegrados: false,
  },
  {
    id: 'recientes',
    label: 'Activas Recientes 💚',
    sublabel: 'Visitaron en los últimos 30 días',
    icon: Heart,
    emoji: '💚',
    color: 'green',
    activeBgDark: 'bg-green-950/40 border-green-500/60 shadow-green-900/20',
    activeBgLight: 'bg-green-50 border-green-500/60 shadow-green-100',
    accentTextDark: 'text-green-400',
    accentTextLight: 'text-green-800',
    badgeDark: 'bg-green-500/20 border-green-500/30 text-green-300',
    badgeLight: 'bg-green-100 border-green-300 text-green-900',
    strategy: 'Las más receptivas. Perfecto para lanzar nuevos servicios o programas de referidos.',
    diasIntegrados: true,
    rangoDiasLabel: 'Últimos 30 días'
  },
  {
    id: 'potenciales',
    label: 'Potenciales / Sin Cita',
    sublabel: '0 citas • Solo registradas en BD',
    icon: Clock,
    emoji: '⏳',
    color: 'slate',
    activeBgDark: 'bg-slate-800/60 border-slate-500/60 shadow-slate-900/20',
    activeBgLight: 'bg-slate-100 border-slate-400 shadow-slate-200',
    accentTextDark: 'text-slate-300',
    accentTextLight: 'text-slate-800',
    badgeDark: 'bg-slate-500/20 border-slate-500/30 text-slate-300',
    badgeLight: 'bg-slate-200 border-slate-300 text-slate-900',
    strategy: 'Contactos que entraron a la BD pero nunca agendaron. Primera conversión.',
    cta: 'Promo especial de primera cita / introducción al salón.',
    diasIntegrados: true,
    rangoDiasLabel: 'Sin citas agendadas'
  },
  {
    id: 'alto_valor',
    label: 'Alto Valor 💎',
    sublabel: '4+ visitas en historial',
    icon: Gift,
    emoji: '💎',
    color: 'indigo',
    activeBgDark: 'bg-indigo-950/40 border-indigo-500/60 shadow-indigo-900/20',
    activeBgLight: 'bg-indigo-50 border-indigo-500/60 shadow-indigo-100',
    accentTextDark: 'text-indigo-400',
    accentTextLight: 'text-indigo-800',
    badgeDark: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
    badgeLight: 'bg-indigo-100 border-indigo-300 text-indigo-900',
    strategy: 'Las de mayor LTV. Prioritario mantenerlas. Ofrece programa de lealtad o beneficios acumulativos.',
    diasIntegrados: false,
  },
  {
    id: 'cumpleanos',
    label: 'Cumpleañeras 🎂',
    sublabel: 'Con fecha de cumpleaños registrada',
    icon: Gift,
    emoji: '🎂',
    color: 'pink',
    activeBgDark: 'bg-pink-950/40 border-pink-500/60 shadow-pink-900/20',
    activeBgLight: 'bg-pink-50 border-pink-500/60 shadow-pink-100',
    accentTextDark: 'text-pink-400',
    accentTextLight: 'text-pink-800',
    badgeDark: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
    badgeLight: 'bg-pink-100 border-pink-300 text-pink-900',
    strategy: 'Felicitarlas en su mes / semana especial con un detalle es la táctica de mayor conversión.',
    cta: 'Regalo de cumpleaños: servicio gratis o descuento especial.',
    diasIntegrados: false,
  },
];


const DEFAULT_COPYS: Partial<CopyPromocional>[] = [
  {
    id: 'default-1',
    titulo: '🚨 Rescate - Te Extrañamos',
    contenido: '¡Hola {nombre}! 💅 Hace {dias_sin_visita} días que no te vemos en el salón y te extrañamos. Esta semana tenemos una sorpresa especial para ti: {promocion} en tu próximo {ultimo_servicio}. ¿Agendamos el {dia_preferido}? 🌟',
    tipo_promocion: 'porcentaje',
    valor_promocion: '20% OFF',
    regalo_sugerido: 'Exfoliación de Manos Spa'
  },
  {
    id: 'default-2',
    titulo: '🎁 Oferta VIP + Regalo',
    contenido: '¡Hola {nombre}! Eres una de nuestras clientas especiales 👑 y queremos consentirte. Agenda tu cita este {dia_preferido} y llévate de regalo {regalo} + {promocion} exclusivo solo para ti. ¡Cupos limitados! ✨',
    tipo_promocion: 'regalo',
    valor_promocion: '15% OFF',
    regalo_sugerido: 'Tratamiento Argán Premium'
  },
  {
    id: 'default-3',
    titulo: '🌱 Bienvenida 2da Visita',
    contenido: '¡Hola {nombre}! Fue un placer tenerte en el salón la última vez 😊 Para tu próxima visita de {ultimo_servicio}, tenemos un regalo especial para ti: {promocion}. ¡Reserva este {dia_preferido}!',
    tipo_promocion: 'porcentaje',
    valor_promocion: '10% OFF',
    regalo_sugerido: 'Muestra de Producto'
  }
];

export const Broadcasts: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const businessId = localStorage.getItem('korat_business_id') || '';

  // Tabs: 'builder' (Audiencia & Envío) | 'copys' (Biblioteca CRUD)
  const [activeTab, setActiveTab] = useState<'builder' | 'copys'>('builder');


  // ── Filtros de Audiencia
  const [selectedServicio, setSelectedServicio] = useState('todos');
  const [diasSinVisita, setDiasSinVisita] = useState(0);
  const [selectedSegmento, setSelectedSegmento] = useState('todas');
  const [soloOptin, setSoloOptin] = useState(true);
  const [showSegmentoDetail, setShowSegmentoDetail] = useState<string | null>(null);

  // ── Audiencia calculada
  const [audienceList, setAudienceList] = useState<BroadcastAudienceClient[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(false);

  // ── Cap de envíos
  const [sendCap, setSendCap] = useState<number>(20);

  // ── Biblioteca Copys CRUD
  const [copys, setCopys] = useState<CopyPromocional[]>([]);
  const [loadingCopys, setLoadingCopys] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<CopyPromocional | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<Partial<CopyPromocional>>({
    titulo: '',
    contenido: '¡Hola {nombre}! ✨',
    tipo_promocion: 'porcentaje',
    valor_promocion: '15% OFF',
    regalo_sugerido: ''
  });

  // ── Estado de Envío
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [lastSentCount, setLastSentCount] = useState(0);

  // Cargar Copys
  const fetchCopys = async () => {
    try {
      setLoadingCopys(true);
      const data = await broadcastsApi.getCopys();
      if (data && data.length > 0) {
        setCopys(data);
        setSelectedCopy(data[0]);
      } else {
        setCopys(DEFAULT_COPYS as CopyPromocional[]);
        setSelectedCopy(DEFAULT_COPYS[0] as CopyPromocional);
      }
    } catch (e) {
      setCopys(DEFAULT_COPYS as CopyPromocional[]);
      setSelectedCopy(DEFAULT_COPYS[0] as CopyPromocional);
    } finally {
      setLoadingCopys(false);
    }
  };

  useEffect(() => { fetchCopys(); }, []);

  // Cargar Audiencia con RPC
  const loadAudience = async () => {
    // Reset inmediato antes del fetch para que el slider nunca quede bloqueado
    setAudienceList([]);
    setSendCap(0);
    try {
      setLoadingAudience(true);
      const data = await broadcastsApi.getAudience({
        servicioKeyword: selectedServicio === 'todos' ? '' : selectedServicio,
        diasSinVisita,
        segmento: selectedSegmento,
        soloOptin,
        limit: 300
      });
      setAudienceList(data || []);
      if (data && data.length > 0) {
        setSendCap(Math.min(30, data.length));
      } else {
        setSendCap(0);
      }
    } catch (e) {
      console.error('Error cargando audiencia:', e);
      setAudienceList([]);
      setSendCap(0);
    } finally {
      setLoadingAudience(false);
    }
  };

  useEffect(() => { loadAudience(); }, [selectedServicio, diasSinVisita, selectedSegmento, soloOptin]);

  // Audiencia final: primero filtra clientes en cooldown activo (2da valla de seguridad),
  // luego recorta al cap seleccionado por el usuario.
  const finalRecipients = useMemo(
    () => audienceList.filter(c => !c.cooldown_activo).slice(0, sendCap),
    [audienceList, sendCap]
  );

  // Helper para extraer solo el primer nombre del cliente
  const getFirstName = (fullName: string) => {
    if (!fullName) return 'Cliente';
    const clean = fullName.trim().split(' ')[0];
    return clean || 'Cliente';
  };

  // Helper para formatear días de forma natural para plantillas de WhatsApp
  const formatDaysText = (days: number) => {
    if (!days || days >= 900) return 'un tiempo';
    return `${days}`;
  };

  // Vista previa del mensaje personalizado
  const previewMessage = useMemo(() => {
    if (!selectedCopy) return 'Selecciona un copy de tu biblioteca para ver la vista previa...';
    const sample = finalRecipients[0] || {
      nombre: 'Sofía Rodríguez',
      dia_preferido: 'Viernes',
      ultimo_servicio: 'Sistema Rubber Base',
      dias_sin_visita: diasSinVisita || 30,
      regalo_sugerido: 'Exfoliación de Manos Spa'
    };
    let text = selectedCopy.contenido;
    text = text.replace(/{nombre}/g, getFirstName(sample.nombre));
    text = text.replace(/{dia_preferido}/g, sample.dia_preferido || 'esta semana');
    text = text.replace(/{ultimo_servicio}/g, sample.ultimo_servicio || 'servicio');
    text = text.replace(/{dias_sin_visita}/g, formatDaysText(sample.dias_sin_visita));
    text = text.replace(/{promocion}/g, selectedCopy.valor_promocion || 'un descuento especial');
    text = text.replace(/{regalo}/g, selectedCopy.regalo_sugerido || sample.regalo_sugerido || 'regalo sorpresa');
    return text;
  }, [selectedCopy, finalRecipients, diasSinVisita]);


  // Insertar variable en el editor
  const insertVariable = (varName: string) => {
    setEditingCopy(prev => ({
      ...prev,
      contenido: (prev.contenido || '') + `{${varName}}`
    }));
  };

  // Guardar Copy
  const handleSaveCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCopy.titulo || !editingCopy.contenido) return;
    try {
      const saved = await broadcastsApi.saveCopy(editingCopy);
      setIsEditorOpen(false);
      await fetchCopys();
      if (saved) setSelectedCopy(saved);
    } catch {
      const localCopy: CopyPromocional = {
        id: editingCopy.id || `local-${Date.now()}`,
        business_id: businessId,
        titulo: editingCopy.titulo || 'Nueva Promo',
        contenido: editingCopy.contenido || '',
        tipo_promocion: editingCopy.tipo_promocion || 'porcentaje',
        valor_promocion: editingCopy.valor_promocion || '15% OFF',
        regalo_sugerido: editingCopy.regalo_sugerido || ''
      };
      setCopys(prev => [localCopy, ...prev.filter(c => c.id !== localCopy.id)]);
      setSelectedCopy(localCopy);
      setIsEditorOpen(false);
    }
  };

  // Eliminar Copy
  const handleDeleteCopy = async (id: string) => {
    if (!confirm('¿Eliminar este copy de tu biblioteca?')) return;
    try { await broadcastsApi.deleteCopy(id); } catch {}
    setCopys(prev => prev.filter(c => c.id !== id));
    if (selectedCopy?.id === id) setSelectedCopy(copys.find(c => c.id !== id) || null);
  };

  // Disparar a n8n
  const handleSendBroadcast = async () => {
    if (!selectedCopy || finalRecipients.length === 0) return;
    setIsSending(true);
    setSendSuccess(false);

    const recipientsPayload = finalRecipients.map(c => {
      let mensaje = selectedCopy.contenido;
      mensaje = mensaje.replace(/{nombre}/g, getFirstName(c.nombre));
      mensaje = mensaje.replace(/{dia_preferido}/g, c.dia_preferido || 'esta semana');
      mensaje = mensaje.replace(/{ultimo_servicio}/g, c.ultimo_servicio || 'servicio');
      mensaje = mensaje.replace(/{dias_sin_visita}/g, formatDaysText(c.dias_sin_visita));
      mensaje = mensaje.replace(/{promocion}/g, selectedCopy.valor_promocion || 'descuento especial');
      mensaje = mensaje.replace(/{regalo}/g, selectedCopy.regalo_sugerido || c.regalo_sugerido || 'regalo');
      return { id: c.id, nombre: c.nombre, primer_nombre: getFirstName(c.nombre), telefono: c.telefono, dia_preferido: c.dia_preferido, ultimo_servicio: c.ultimo_servicio, dias_sin_visita: c.dias_sin_visita, mensaje_personalizado: mensaje };
    });



    try {
      await broadcastsApi.sendBulkBroadcast({
        business_id: businessId,
        titulo_campana: selectedCopy.titulo,
        copy_id: selectedCopy.id,
        mensaje_template: selectedCopy.contenido,
        total_audiencia_encontrada: audienceList.length,
        total_seleccionados: finalRecipients.length,
        tipo_promocion: selectedCopy.tipo_promocion,
        valor_promocion: selectedCopy.valor_promocion,
        regalo: selectedCopy.regalo_sugerido,
        recipients: recipientsPayload
      });
      setLastSentCount(finalRecipients.length);
      setSendSuccess(true);
    } finally {
      setIsSending(false);
    }
  };

  const segmentoActivo = SEGMENTOS_CRM.find(s => s.id === selectedSegmento);
  const servicioActivo = SERVICIOS_PRESETS.find(s => s.id === selectedServicio);

  return (
    <div className={`min-h-screen pb-28 font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#07090e] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>

      {/* ── Header ── */}
      <div className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors duration-300 px-4 py-3 ${
        isDark 
          ? 'bg-[#0b0d18]/95 border-white/8' 
          : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className={`text-[15px] font-extrabold tracking-tight leading-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Envíos Masivos</h1>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Segmentación inteligente • WhatsApp</p>
            </div>
          </div>
          <button
            onClick={loadAudience}
            disabled={loadingAudience}
            className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
              isDark 
                ? 'bg-white/5 border-white/8 text-slate-300' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${loadingAudience ? 'animate-spin text-pink-500' : ''}`} />
          </button>
        </div>

        {/* Tabs Segmented Control */}
        <div className={`grid grid-cols-2 gap-1 mt-3 p-1 rounded-xl border max-w-lg mx-auto ${
          isDark ? 'bg-black/40 border-white/5' : 'bg-slate-200/70 border-slate-300/50'
        }`}>
          {(['builder', 'copys'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-md'
                  : isDark ? 'text-slate-400' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'builder' ? <><Zap className="h-3.5 w-3.5" />Audiencia & Envío</> : <><MessageSquare className="h-3.5 w-3.5" />Copys ({copys.length})</>}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════ TAB 1: BUILDER ══════════════════ */}
      {activeTab === 'builder' && (
        <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">

          {/* ── Bloque 1: Segmento CRM Inteligente ── */}
          <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className={`px-4 pt-4 pb-3 border-b ${
              isDark ? 'border-white/5' : 'border-slate-100'
            }`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-widest text-violet-500 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  1. Segmento CRM
                </p>
                <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Basado en comportamiento real</span>
              </div>
            </div>

            <div className="p-3 grid grid-cols-2 gap-2">
              {SEGMENTOS_CRM.map(seg => {
                const isActive = selectedSegmento === seg.id;
                const activeBg = isDark ? seg.activeBgDark : seg.activeBgLight;
                const accentText = isDark ? seg.accentTextDark : seg.accentTextLight;
                const badgeStyle = isDark ? seg.badgeDark : seg.badgeLight;

                return (
                  <button
                    key={seg.id}
                    onClick={() => setSelectedSegmento(seg.id)}
                    className={`relative p-3 rounded-xl border text-left transition-all active:scale-[0.97] ${
                      isActive
                        ? `${activeBg} shadow-md`
                        : isDark 
                          ? 'bg-white/3 border-white/5 hover:bg-white/8' 
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <span className="text-lg leading-none">{seg.emoji}</span>
                      {isActive && <CheckCircle2 className={`h-4 w-4 ${accentText}`} />}
                    </div>
                    {/* Título: Siempre contraste máximo con el fondo de la card */}
                    <p className={`text-xs font-bold leading-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {seg.label}
                    </p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {seg.sublabel}
                    </p>

                    {isActive && seg.strategy && (
                      <div className={`mt-2 text-[10px] p-1.5 rounded-lg border leading-tight ${badgeStyle}`}>
                        💡 {seg.strategy.slice(0, 65)}...
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

          </div>


          {/* ── Bloque 2: Servicio específico ── */}
          <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className={`px-4 pt-4 pb-3 border-b ${
              isDark ? 'border-white/5' : 'border-slate-100'
            }`}>
              <p className="text-xs font-extrabold uppercase tracking-widest text-pink-500 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                2. Filtrar por Servicio
              </p>
            </div>
            <div className="p-3 grid grid-cols-3 gap-2">
              {SERVICIOS_PRESETS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedServicio(s.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 ${
                    selectedServicio === s.id
                      ? 'bg-pink-500/20 border-pink-500/50 shadow-sm'
                      : isDark 
                        ? 'bg-white/3 border-white/5' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xl mb-1">{s.icon}</div>
                  <p className={`text-[10px] font-semibold leading-tight ${
                    selectedServicio === s.id 
                      ? 'text-pink-500 font-bold' 
                      : isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {s.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Bloque 3: Días sin visita + Opt-in ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              3. Inactividad (Opcional)
            </p>

            {segmentoActivo?.diasIntegrados ? (
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
              }`}>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Rango de días propio del segmento</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>El segmento <span className="font-semibold text-amber-600">"{segmentoActivo.label}"</span> ya incluye su filtro de días ({segmentoActivo.rangoDiasLabel}).</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-600 rounded-lg shrink-0 ml-2">
                  Auto
                </span>
              </div>
            ) : (
              <div className={`p-3.5 rounded-xl border ${
                isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Sin venir desde hace:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                    diasSinVisita === 0
                      ? isDark ? 'bg-slate-500/20 text-slate-400 border-slate-500/20' : 'bg-slate-200 text-slate-600 border-slate-300'
                      : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  }`}>
                    {diasSinVisita === 0 ? 'Sin filtro' : `+${diasSinVisita} días`}
                  </span>
                </div>
                <input
                  type="range" min="0" max="120" step="7" value={diasSinVisita}
                  onChange={e => setDiasSinVisita(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-300 dark:bg-white/10 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Sin filtro</span><span>30d</span><span>60d</span><span>90d</span><span>120d</span>
                </div>
              </div>
            )}

            <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
              isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Solo con Marketing Opt-in</p>
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Recomendado para cumplir buenas prácticas</p>
              </div>
              <div
                onClick={() => setSoloOptin(v => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${soloOptin ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${soloOptin ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>

            {/* Badge de Protección Anti-Spam / Cooldown */}
            <div className={`p-3 rounded-xl flex items-center gap-2.5 border ${
              isDark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-50 border-violet-200'
            }`}>
              <div className="h-7 w-7 rounded-lg bg-violet-500/20 text-violet-500 font-bold flex items-center justify-center text-xs shrink-0">
                🛡️
              </div>
              <div className="flex-1">
                <p className={`text-[11px] font-bold ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>Protección Anti-Spam Activa (7 Días)</p>
                <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Las clientas que recibieron un mensaje promocional en los últimos 7 días son excluidas automáticamente para no saturarlas.
                </p>
              </div>
            </div>
          </div>

          {/* ── Resultado de Audiencia & Cap ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-widest text-pink-500 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                4. Audiencia Encontrada
              </p>
              {loadingAudience ? (
                <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <RefreshCw className="h-3 w-3 animate-spin text-pink-500" /> Calculando...
                </span>
              ) : (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                  audienceList.length === 0
                    ? isDark ? 'bg-slate-500/20 text-slate-400 border-slate-500/20' : 'bg-slate-100 text-slate-500 border-slate-200'
                    : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                }`}>
                  {audienceList.length} clientes
                </span>
              )}
            </div>

            {!loadingAudience && audienceList.length === 0 ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-300">Sin resultados con estos filtros</p>
                <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">Prueba cambiando el segmento o reduciendo los días de inactividad</p>
              </div>
            ) : !loadingAudience && audienceList.length > 0 ? (
              <div className="space-y-3">
                {/* Slider de cupo */}
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>¿A cuántas enviar?</span>
                    <span className="text-xs font-extrabold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                      {sendCap} de {audienceList.length}
                    </span>
                  </div>
                  <input
                    type="range" min="1" max={Math.max(1, audienceList.length)} value={Math.min(sendCap, audienceList.length)}
                    onChange={e => setSendCap(Number(e.target.value))}
                    className="w-full accent-pink-500 h-1.5 bg-slate-300 dark:bg-white/10 rounded-lg cursor-pointer"
                  />
                  <p className={`text-[10px] mt-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    💡 Ideal empezar con un grupo pequeño para medir respuesta
                  </p>
                </div>

                {/* Lista preview de las primeras */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {finalRecipients.slice(0, 5).map((c, i) => (
                    <div key={c.id || i} className={`px-3 py-2 rounded-lg flex items-center justify-between ${
                      isDark ? 'bg-white/4' : 'bg-slate-100'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-pink-500/20 text-pink-500 font-extrabold flex items-center justify-center text-[10px] shrink-0">
                          {c.nombre?.charAt(0) || 'C'}
                        </div>
                        <span className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.nombre}</span>
                      </div>
                      <span className={`text-[10px] shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {c.dias_sin_visita >= 999 ? 'Sin visita' : `hace ${c.dias_sin_visita}d`}
                      </span>
                    </div>
                  ))}
                  {finalRecipients.length > 5 && (
                    <p className={`text-[10px] text-center pt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      + {finalRecipients.length - 5} más en la lista...
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Copy Seleccionado ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-widest text-violet-500 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                5. Mensaje Promocional
              </p>
              <button onClick={() => setActiveTab('copys')} className="text-[11px] text-pink-500 hover:underline font-semibold">
                Ver biblioteca →
              </button>
            </div>

            {/* Selección de copys */}
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {copys.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCopy(c)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                    selectedCopy?.id === c.id
                      ? 'bg-violet-500/15 border-violet-500/50 shadow-sm'
                      : isDark 
                        ? 'bg-white/3 border-white/5' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold flex items-center gap-1.5 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {selectedCopy?.id === c.id && <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                      {c.titulo}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-600 dark:text-violet-300 shrink-0 ml-2">
                      {c.valor_promocion}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-snug line-clamp-2 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>{c.contenido}</p>
                </div>
              ))}
            </div>


            {/* Vista previa WhatsApp */}
            {selectedCopy && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vista previa WhatsApp:</span>
                </div>
                <div className="bg-[#0b141a] p-3 rounded-2xl border border-emerald-500/20">
                  <div className="bg-[#005c4b] text-slate-100 p-3 rounded-xl text-xs leading-relaxed shadow-md whitespace-pre-wrap">
                    {previewMessage}
                  </div>
                  <div className="text-[9px] text-slate-600 text-right mt-1 pr-1">
                    Pre-visualización • Variable del 1er cliente seleccionado
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Feedback de Éxito ── */}
          <AnimatePresence>
            {sendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-center space-y-2"
              >
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white">¡Enviados con Éxito!</h3>
                <p className="text-xs text-slate-300">
                  <strong className="text-emerald-400">{lastSentCount} mensajes</strong> despachados a n8n → Evolution API
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Botón de Disparo ── */}
          <button
            onClick={handleSendBroadcast}
            disabled={isSending || finalRecipients.length === 0 || !selectedCopy}
            className={`w-full py-4 rounded-2xl font-extrabold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-2xl transition-all active:scale-[0.98] ${
              isSending || finalRecipients.length === 0 || !selectedCopy
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 text-white shadow-pink-500/25 hover:brightness-110'
            }`}
          >
            {isSending
              ? <><RefreshCw className="h-5 w-5 animate-spin" />Despachando mensajes...</>
              : finalRecipients.length === 0
                ? <><AlertCircle className="h-5 w-5" />Sin audiencia seleccionada</>
                : <><Send className="h-5 w-5" />Enviar Promo a {finalRecipients.length} Clientes</>
            }
          </button>
        </div>
      )}

      {/* ══════════════════ TAB 2: BIBLIOTECA COPYS ══════════════════ */}
      {activeTab === 'copys' && (
        <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Biblioteca de Copys</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mensajes con variables dinámicas personalizadas</p>
            </div>
            <button
              onClick={() => {
                setEditingCopy({ titulo: '', contenido: '¡Hola {nombre}! ✨', tipo_promocion: 'porcentaje', valor_promocion: '15% OFF', regalo_sugerido: '' });
                setIsEditorOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-pink-500/20 text-pink-500 border border-pink-500/30 text-xs font-bold flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="h-4 w-4" />Nuevo
            </button>
          </div>

          {/* Chips de variables disponibles */}
          <div className={`p-3 rounded-2xl border ${
            isDark ? 'bg-[#0f1422] border-white/8' : 'bg-white border-slate-200'
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Variables disponibles para tus copys:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'nombre', desc: 'Nombre de la clienta' },
                { key: 'dia_preferido', desc: 'Su día favorito de visita' },
                { key: 'ultimo_servicio', desc: 'Último servicio realizado' },
                { key: 'dias_sin_visita', desc: 'Días que lleva sin venir' },
                { key: 'promocion', desc: 'Valor de descuento/cupón' },
                { key: 'regalo', desc: 'Regalo sugerido' },
              ].map(v => (
                <div key={v.key} className="group relative">
                  <span className="px-2 py-1 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30 text-[10px] font-mono cursor-default">
                    {`{${v.key}}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards de Copys */}
          <div className="space-y-3">
            {copys.map(c => (
              <div key={c.id} className={`border rounded-2xl p-4 space-y-2 shadow-xl transition-colors duration-300 ${
                isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.titulo}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-pink-500/20 text-pink-600 dark:text-pink-300">
                        {c.valor_promocion}
                      </span>
                      {c.regalo_sugerido && (
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>🎁 {c.regalo_sugerido}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <button
                      onClick={() => { setEditingCopy(c); setIsEditorOpen(true); }}
                      className={`p-1.5 rounded-lg ${isDark ? 'bg-white/5 text-slate-300 hover:bg-white/10' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCopy(c.id!)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl border text-xs leading-relaxed whitespace-pre-wrap ${
                  isDark ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  {c.contenido}
                </div>
                <button
                  onClick={() => { setSelectedCopy(c); setActiveTab('builder'); }}
                  className="w-full py-1.5 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 text-[11px] font-bold hover:bg-violet-500/20 transition-colors"
                >
                  Usar este copy en Envío →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL EDITOR COPY ── */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className={`border-t sm:border rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto ${
                isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className={`flex justify-between items-center border-b pb-3 ${
                isDark ? 'border-white/5' : 'border-slate-100'
              }`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  {editingCopy.id ? 'Editar Copy' : 'Crear Nuevo Copy'}
                </h3>
                <button onClick={() => setIsEditorOpen(false)} className={`text-xs px-2 py-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleSaveCopy} className="space-y-3.5">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Título (para tu biblioteca):</label>
                  <input
                    type="text" required placeholder="Ej. Rescate Uñas Mes de Agosto"
                    value={editingCopy.titulo || ''}
                    onChange={e => setEditingCopy({ ...editingCopy, titulo: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#161c2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Descuento / Cupón:</label>
                    <input
                      type="text" placeholder="Ej. 20% OFF o $15 USD"
                      value={editingCopy.valor_promocion || ''}
                      onChange={e => setEditingCopy({ ...editingCopy, valor_promocion: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500 ${
                        isDark ? 'bg-[#161c2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Regalo Especial:</label>
                    <input
                      type="text" placeholder="Ej. Ampolla Argán"
                      value={editingCopy.regalo_sugerido || ''}
                      onChange={e => setEditingCopy({ ...editingCopy, regalo_sugerido: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500 ${
                        isDark ? 'bg-[#161c2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Variables de inserción táctil */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Toca para insertar variable:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['nombre', 'dia_preferido', 'ultimo_servicio', 'dias_sin_visita', 'promocion', 'regalo'].map(v => (
                      <button
                        key={v} type="button" onClick={() => insertVariable(v)}
                        className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/30 text-[10px] font-mono hover:bg-violet-500/30 active:scale-95 transition-all"
                      >
                        +{`{${v}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Mensaje:</label>
                  <textarea
                    rows={5} required
                    value={editingCopy.contenido || ''}
                    onChange={e => setEditingCopy({ ...editingCopy, contenido: e.target.value })}
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-pink-500 resize-none ${
                      isDark ? 'bg-[#161c2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setIsEditorOpen(false)}
                    className={`w-1/3 py-2.5 rounded-xl border text-xs font-bold ${
                      isDark ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >Cancelar</button>
                  <button type="submit"
                    className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-xs shadow-lg shadow-pink-500/20 hover:brightness-110 active:scale-[0.98] transition-all"
                  >Guardar Copy</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Broadcasts;
