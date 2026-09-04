/**
 * Marketing & Envíos Masivos — Growth Center Unificado
 * Diseñado estilo Nativo App Móvil 100% Mobile-First.
 * 
 * Marketplace de Audiencias PRO:
 * - Hero Card interactiva de Audiencia Activa con botón para explorar catálogo completo en Bottom Sheet Modal.
 * - Carrusel horizontal (Swipeable) con filtros de categoría rápidos:
 *   🔥 Rescate & Pérdida | 👑 Lealtad & VIP | 📢 Prospectos & Ads | 🎂 Eventos & Venta Cruzada
 * - Modal / Drawer Marketplace completo con buscador en tiempo real, categorías y metadata de conversión.
 * - Formatos Texto / Multimedia, Cooldown de 15 días, Anti-baneo estricto y analítica ROI.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Filter, Users, MessageSquare, Plus, Edit3, Trash2,
  CheckCircle2, AlertCircle, Zap, RefreshCw, Smartphone, Check, Crown,
  Heart, Star, TrendingDown, TrendingUp, UserX, UserCheck, Gift, Clock,
  AlertTriangle, Image, Upload, X, ShieldAlert, Megaphone, Bot, BellRing,
  Scissors, DollarSign, Target, Percent, CheckCheck, Info, ArrowUpRight,
  Search, Layers, Sparkle, Flame, Compass, ChevronRight, SlidersHorizontal,
  Calendar, CalendarClock, CalendarCheck, Timer
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { broadcasts as broadcastsApi } from '../services/api';
import { supabase } from '../services/supabase';
import { CopyPromocional, BroadcastAudienceClient } from '../types/broadcastTypes';
import { CountryCode, SUPPORTED_COUNTRIES, KeyDate } from '../types/campaignBuilderTypes';
import { KEY_DATES_BY_COUNTRY } from '../services/campaignMockData';

// ── Categorías del Marketplace de Audiencias
export type AudienceCategory = 'todas' | 'lealtad' | 'servicios' | 'cruzadas' | 'prospectos';

export interface AudienceDefinition {
  id: string;
  category: AudienceCategory;
  categoryLabel: string;
  label: string;
  sublabel: string;
  badgeTag: string;
  /** Clase Tailwind sólida de alta legibilidad: bg-color-600 text-white */
  badgeSolidClass: string;
  icon: any;
  emoji: string;
  color: string;
  gradient: string;
  activeBgDark: string;
  activeBgLight: string;
  accentTextDark: string;
  accentTextLight: string;
  strategy: string;
  cta: string;
  diasIntegrados: boolean;
  rangoDiasLabel?: string;
  esLeads?: boolean;
  urgency: 'critica' | 'alta' | 'media' | 'baja';
  roiPotential: '⭐⭐⭐⭐⭐' | '⭐⭐⭐⭐' | '⭐⭐⭐';
}

// ── Catálogo Maestro de Audiencias (Marketplace)
// badgeSolidClass: fondo sólido + texto blanco → máximo contraste y legibilidad
const AUDIENCE_CATALOG: AudienceDefinition[] = [

  // ── CATEGORÍA: LEALTAD & VALOR
  {
    id: 'vip',
    category: 'lealtad',
    categoryLabel: 'Lealtad',
    label: 'VIP / Leales',
    sublabel: '5+ visitas • activas últimos 60 días',
    badgeTag: 'Mayor LTV',
    badgeSolidClass: 'bg-yellow-600 text-white',
    icon: Crown,
    emoji: '👑',
    color: 'yellow',
    gradient: 'from-amber-400 to-yellow-600',
    activeBgDark: 'bg-yellow-950/50 border-yellow-500/70 shadow-yellow-900/30',
    activeBgLight: 'bg-yellow-50 border-yellow-500/70 shadow-yellow-100',
    accentTextDark: 'text-yellow-400',
    accentTextLight: 'text-yellow-800',
    strategy: 'Las embajadoras del salón. Dales acceso prioritario, noticias y beneficios exclusivos.',
    cta: 'Acceso anticipado a promociones o beneficio de cortesía.',
    diasIntegrados: true,
    rangoDiasLabel: 'Activas (últimos 60 días)',
    urgency: 'baja',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'alto_valor',
    category: 'lealtad',
    categoryLabel: 'Lealtad',
    label: 'Alto Valor Histórico',
    sublabel: '4+ visitas en historial',
    badgeTag: 'Top Clientes',
    badgeSolidClass: 'bg-indigo-600 text-white',
    icon: Gift,
    emoji: '💎',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    activeBgDark: 'bg-indigo-950/50 border-indigo-500/70 shadow-indigo-900/30',
    activeBgLight: 'bg-indigo-50 border-indigo-500/70 shadow-indigo-100',
    accentTextDark: 'text-indigo-400',
    accentTextLight: 'text-indigo-800',
    strategy: 'Las clientas con mayor ticket acumulado. Mantener relación cercana y consentirlas.',
    cta: 'Regalo especial en su próxima visita o acceso a servicios VIP.',
    diasIntegrados: false,
    urgency: 'baja',
    roiPotential: '⭐⭐⭐⭐',
  },
  {
    id: 'frecuentes',
    category: 'lealtad',
    categoryLabel: 'Lealtad',
    label: 'Frecuentes Regulares',
    sublabel: '3 a 9 visitas registradas',
    badgeTag: 'Recurrentes',
    badgeSolidClass: 'bg-blue-600 text-white',
    icon: Star,
    emoji: '⭐',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    activeBgDark: 'bg-blue-950/50 border-blue-500/70 shadow-blue-900/30',
    activeBgLight: 'bg-blue-50 border-blue-500/70 shadow-blue-100',
    accentTextDark: 'text-blue-400',
    accentTextLight: 'text-blue-800',
    strategy: 'Clientas recurrentes fijas. Premiar su fidelidad para transformarlas en VIP definitivas.',
    cta: 'Descuento escalonado o beneficio acumulativo.',
    diasIntegrados: false,
    urgency: 'baja',
    roiPotential: '⭐⭐⭐⭐',
  },
  {
    id: 'recientes',
    category: 'lealtad',
    categoryLabel: 'Lealtad',
    label: 'Activas Recientes',
    sublabel: 'Visitaron en los últimos 30 días',
    badgeTag: 'Enamoradas',
    badgeSolidClass: 'bg-emerald-600 text-white',
    icon: Heart,
    emoji: '💚',
    color: 'green',
    gradient: 'from-emerald-500 to-teal-600',
    activeBgDark: 'bg-green-950/50 border-green-500/70 shadow-green-900/30',
    activeBgLight: 'bg-green-50 border-green-500/70 shadow-green-100',
    accentTextDark: 'text-green-400',
    accentTextLight: 'text-green-800',
    strategy: 'Las más activas y receptivas. Momento idóneo para venta cruzada de otros servicios.',
    cta: 'Lanzamiento de novedades o programa de referidos.',
    diasIntegrados: true,
    rangoDiasLabel: 'Últimos 30 días',
    urgency: 'baja',
    roiPotential: '⭐⭐⭐⭐',
  },

  // ── CATEGORÍA: POR SERVICIO ESPECIALIZADO
  {
    id: 'servicio_unas',
    category: 'servicios',
    categoryLabel: 'Por Servicio',
    label: 'Uñas & Manicura Lovers',
    sublabel: 'Acrílicas, Kapping, Gel, Rubber Base',
    badgeTag: 'Especialistas Manos',
    badgeSolidClass: 'bg-pink-600 text-white',
    icon: Scissors,
    emoji: '💅',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    activeBgDark: 'bg-pink-950/50 border-pink-500/70 shadow-pink-900/30',
    activeBgLight: 'bg-pink-50 border-pink-500/70 shadow-pink-100',
    accentTextDark: 'text-pink-400',
    accentTextLight: 'text-pink-800',
    strategy: 'Clientas fanáticas de las uñas. Recordar retoque a los 21 días e introducir nuevos tonos y nail art.',
    cta: 'Beneficio en retoque + exfoliación de manos spa.',
    diasIntegrados: false,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'servicio_pestanas',
    category: 'servicios',
    categoryLabel: 'Por Servicio',
    label: 'Mirada & Lash Lovers',
    sublabel: 'Extensiones, Lifting, Cejas HD',
    badgeTag: 'Mirada Perfecta',
    badgeSolidClass: 'bg-violet-600 text-white',
    icon: Target,
    emoji: '👁️',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    activeBgDark: 'bg-violet-950/50 border-violet-500/70 shadow-violet-900/30',
    activeBgLight: 'bg-violet-50 border-violet-500/70 shadow-violet-100',
    accentTextDark: 'text-violet-400',
    accentTextLight: 'text-violet-800',
    strategy: 'Fanáticas del cuidado de su mirada. Activar el mantenimiento antes de que pierdan el volumen.',
    cta: 'Kit de cuidado lash de cortesía o descuento en mantenimiento.',
    diasIntegrados: false,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'servicio_cabello',
    category: 'servicios',
    categoryLabel: 'Por Servicio',
    label: 'Melena & Capilar VIP',
    sublabel: 'Color, Balayage, Alisados, Corte',
    badgeTag: 'Hair Care',
    badgeSolidClass: 'bg-amber-700 text-white',
    icon: Sparkles,
    emoji: '💇',
    color: 'amber',
    gradient: 'from-amber-600 to-yellow-600',
    activeBgDark: 'bg-amber-950/50 border-amber-500/70 shadow-amber-900/30',
    activeBgLight: 'bg-amber-50 border-amber-500/70 shadow-amber-100',
    accentTextDark: 'text-amber-400',
    accentTextLight: 'text-amber-800',
    strategy: 'Clientas con alto ticket por sesión capilar. Mantener brillo y sellado de color entre citas.',
    cta: 'Tratamiento reconstructor o ampolla de argán sin costo.',
    diasIntegrados: false,
    urgency: 'baja',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'servicio_facial',
    category: 'servicios',
    categoryLabel: 'Por Servicio',
    label: 'Skincare & Faciales',
    sublabel: 'Limpieza Profunda, Hidratación, Glow',
    badgeTag: 'Piel Radiante',
    badgeSolidClass: 'bg-teal-600 text-white',
    icon: Heart,
    emoji: '💆',
    color: 'teal',
    gradient: 'from-teal-500 to-emerald-600',
    activeBgDark: 'bg-teal-950/50 border-teal-500/70 shadow-teal-900/30',
    activeBgLight: 'bg-teal-50 border-teal-500/70 shadow-teal-100',
    accentTextDark: 'text-teal-400',
    accentTextLight: 'text-teal-800',
    strategy: 'Clientas orientadas al bienestar dérmico. Estimular la renovación celular mensual.',
    cta: 'Mascarilla de alta hidratación o velo de colágeno incluido.',
    diasIntegrados: false,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐',
  },
  {
    id: 'servicio_pedicura',
    category: 'servicios',
    categoryLabel: 'Por Servicio',
    label: 'Pedicura & Pies Spa',
    sublabel: 'Spa de Pies, Esmaltado Permanente',
    badgeTag: 'Pies Perfectos',
    badgeSolidClass: 'bg-blue-600 text-white',
    icon: Sparkle,
    emoji: '🦶',
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    activeBgDark: 'bg-blue-950/50 border-blue-500/70 shadow-blue-900/30',
    activeBgLight: 'bg-blue-50 border-blue-500/70 shadow-blue-100',
    accentTextDark: 'text-blue-400',
    accentTextLight: 'text-blue-800',
    strategy: 'Clientas que valoran el relax total. Frecuencia mensual ideal para descanso podal.',
    cta: 'Exfoliación con sales minerales y masaje relajante.',
    diasIntegrados: false,
    urgency: 'baja',
    roiPotential: '⭐⭐⭐⭐',
  },

  // ── CATEGORÍA: SERVICIOS CRUZADOS (CROSS-SELLING)
  {
    id: 'cross_unas_pestanas',
    category: 'cruzadas',
    categoryLabel: 'Venta Cruzada',
    label: 'Combo Uñas + Pestañas',
    sublabel: 'Hacen Uñas pero nunca Pestañas (o viceversa)',
    badgeTag: 'Combo #1 Salón',
    badgeSolidClass: 'bg-fuchsia-600 text-white',
    icon: Zap,
    emoji: '💅👁️',
    color: 'fuchsia',
    gradient: 'from-fuchsia-500 to-pink-600',
    activeBgDark: 'bg-fuchsia-950/50 border-fuchsia-500/70 shadow-fuchsia-900/30',
    activeBgLight: 'bg-fuchsia-50 border-fuchsia-500/70 shadow-fuchsia-100',
    accentTextDark: 'text-fuchsia-400',
    accentTextLight: 'text-fuchsia-800',
    strategy: 'El cruce más rentable del sector belleza. Si ya confían en sus manos, cruzarlas a la mirada duplica su valor de por vida.',
    cta: 'Prueba Pestañas/Lifting con 20% OFF por ser clienta de Uñas.',
    diasIntegrados: false,
    urgency: 'alta',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'cross_cabello_facial',
    category: 'cruzadas',
    categoryLabel: 'Venta Cruzada',
    label: 'Combo Cabello + Facial',
    sublabel: 'Clientas de Color/Corte hacia Cuidado Facial',
    badgeTag: 'Belleza Total',
    badgeSolidClass: 'bg-rose-700 text-white',
    icon: Sparkles,
    emoji: '💇💆',
    color: 'rose',
    gradient: 'from-rose-600 to-pink-700',
    activeBgDark: 'bg-rose-950/50 border-rose-500/70 shadow-rose-900/30',
    activeBgLight: 'bg-rose-50 border-rose-500/70 shadow-rose-100',
    accentTextDark: 'text-rose-400',
    accentTextLight: 'text-rose-800',
    strategy: 'Aprovechar la cita de cabello para realizar un cuidado facial exprés mientras actúa el tratamiento.',
    cta: 'Facial exprés con 25% OFF durante su servicio de cabello.',
    diasIntegrados: false,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'cross_mani_pedi',
    category: 'cruzadas',
    categoryLabel: 'Venta Cruzada',
    label: 'Dúo Manos & Pies Spa',
    sublabel: 'Hacen Manicura pero nunca Pedicura',
    badgeTag: 'Manos + Pies',
    badgeSolidClass: 'bg-cyan-700 text-white',
    icon: Layers,
    emoji: '💅🦶',
    color: 'cyan',
    gradient: 'from-cyan-600 to-blue-600',
    activeBgDark: 'bg-cyan-950/50 border-cyan-500/70 shadow-cyan-900/30',
    activeBgLight: 'bg-cyan-50 border-cyan-500/70 shadow-cyan-100',
    accentTextDark: 'text-cyan-400',
    accentTextLight: 'text-cyan-800',
    strategy: 'Aumentar el ticket por cita invitándola a completar su sesión de manos con un spa de pies simultáneo.',
    cta: 'Añade Pedicura Spa a tu cita de uñas con beneficio de cortesía.',
    diasIntegrados: false,
    urgency: 'alta',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'cross_pestanas_cejas',
    category: 'cruzadas',
    categoryLabel: 'Venta Cruzada',
    label: 'Mirada 360°: Pestañas + Cejas',
    sublabel: 'Pestañas hacia Laminado o Perfilado de Cejas',
    badgeTag: 'Mirada 360°',
    badgeSolidClass: 'bg-indigo-700 text-white',
    icon: Target,
    emoji: '👁️✨',
    color: 'indigo',
    gradient: 'from-indigo-600 to-violet-600',
    activeBgDark: 'bg-indigo-950/50 border-indigo-500/70 shadow-indigo-900/30',
    activeBgLight: 'bg-indigo-50 border-indigo-500/70 shadow-indigo-100',
    accentTextDark: 'text-indigo-400',
    accentTextLight: 'text-indigo-800',
    strategy: 'Perfeccionar el marco del rostro unificando cejas con pestañas en la misma visita.',
    cta: 'Laminado o Perfilado de Cejas con cortesía en tu cita de pestañas.',
    diasIntegrados: false,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐⭐',
  },

  // ── CATEGORÍA: PROSPECTOS & NUEVAS
  {
    id: 'leads',
    category: 'prospectos',
    categoryLabel: 'Prospectos',
    label: 'Leads / Ads Fantasmas',
    sublabel: 'Consultaron por anuncio y no respondieron',
    badgeTag: 'Conversión Ads',
    badgeSolidClass: 'bg-orange-600 text-white',
    icon: Megaphone,
    emoji: '📣',
    color: 'orange',
    gradient: 'from-orange-500 to-amber-600',
    activeBgDark: 'bg-orange-950/50 border-orange-500/70 shadow-orange-900/30',
    activeBgLight: 'bg-orange-50 border-orange-500/70 shadow-orange-100',
    accentTextDark: 'text-orange-400',
    accentTextLight: 'text-orange-800',
    strategy: 'Leads captados por Meta Ads que quedaron mudos. Primer re-enganche cálido sin presión.',
    cta: 'Ofrecer responder dudas y facilitar el agendamiento.',
    diasIntegrados: false,
    esLeads: true,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐',
  },
  {
    id: 'nuevas',
    category: 'prospectos',
    categoryLabel: 'Prospectos',
    label: 'Nuevas / 1ra Vez',
    sublabel: '1 a 2 visitas registradas',
    badgeTag: 'Fidelización',
    badgeSolidClass: 'bg-emerald-600 text-white',
    icon: UserCheck,
    emoji: '🌱',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    activeBgDark: 'bg-emerald-950/50 border-emerald-500/70 shadow-emerald-900/30',
    activeBgLight: 'bg-emerald-50 border-emerald-500/70 shadow-emerald-100',
    accentTextDark: 'text-emerald-400',
    accentTextLight: 'text-emerald-800',
    strategy: 'Clientas que recién te conocen. Momento clave para enamorarlas y asegurar su 2da visita.',
    cta: 'Bienvenida especial y beneficio en su próxima cita.',
    diasIntegrados: false,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐',
  },
  {
    id: 'potenciales',
    category: 'prospectos',
    categoryLabel: 'Prospectos',
    label: 'Potenciales Sin Cita',
    sublabel: 'Registradas en BD pero sin visitas',
    badgeTag: '1ra Conversión',
    badgeSolidClass: 'bg-slate-700 text-white',
    icon: Clock,
    emoji: '⏳',
    color: 'slate',
    gradient: 'from-slate-600 to-slate-800',
    activeBgDark: 'bg-slate-900/60 border-slate-500/70 shadow-slate-900/30',
    activeBgLight: 'bg-slate-100 border-slate-400 shadow-slate-200',
    accentTextDark: 'text-slate-300',
    accentTextLight: 'text-slate-800',
    strategy: 'Contactos que entraron al sistema pero nunca llegaron al local. Primera conversión.',
    cta: 'Promo especial de bienvenida para su primera cita.',
    diasIntegrados: true,
    rangoDiasLabel: 'Sin citas agendadas',
    urgency: 'media',
    roiPotential: '⭐⭐⭐',
  },

  // ── CATEGORÍA: EVENTOS & GENERAL
  {
    id: 'cumpleanos',
    category: 'prospectos',
    categoryLabel: 'Especiales',
    label: 'Cumpleañeras del Mes',
    sublabel: 'Con fecha de cumpleaños registrada',
    badgeTag: 'Máxima Conversión',
    badgeSolidClass: 'bg-pink-600 text-white',
    icon: Gift,
    emoji: '🎂',
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    activeBgDark: 'bg-pink-950/50 border-pink-500/70 shadow-pink-900/30',
    activeBgLight: 'bg-pink-50 border-pink-500/70 shadow-pink-100',
    accentTextDark: 'text-pink-400',
    accentTextLight: 'text-pink-800',
    strategy: 'Felicitarlas en su mes/semana especial con un detalle es la táctica con mayor conversión histórica.',
    cta: 'Regalo de cumpleaños: servicio de cortesía o descuento especial.',
    diasIntegrados: false,
    urgency: 'media',
    roiPotential: '⭐⭐⭐⭐⭐',
  },
  {
    id: 'todas',
    category: 'todas',
    categoryLabel: 'General',
    label: 'Toda la Base de Datos',
    sublabel: 'Todas las clientas disponibles',
    badgeTag: 'Alcance Total',
    badgeSolidClass: 'bg-violet-700 text-white',
    icon: Users,
    emoji: '🌟',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    activeBgDark: 'bg-violet-950/50 border-violet-500/70 shadow-violet-900/30',
    activeBgLight: 'bg-violet-50 border-violet-500/70 shadow-violet-100',
    accentTextDark: 'text-violet-400',
    accentTextLight: 'text-violet-700',
    strategy: 'Máximo alcance. Indicado para campañas de temporada, feriados o aniversarios.',
    cta: 'Anuncios generales u ofertas masivas de temporada.',
    diasIntegrados: false,
    urgency: 'baja',
    roiPotential: '⭐⭐⭐',
  },
];

// ── Servicios Presets
const SERVICIOS_PRESETS = [
  { id: 'todos',    label: 'Todos',           icon: '✨' },
  { id: 'unas',     label: 'Uñas / Manicura', icon: '💅' },
  { id: 'pestanas', label: 'Pestañas / Cejas',icon: '👁️' },
  { id: 'cabello',  label: 'Cabello',         icon: '💇' },
  { id: 'facial',   label: 'Facial / Piel',   icon: '💆' },
  { id: 'pedicura', label: 'Pedicura / Pies', icon: '🦶' },
];

// ── Copys Maestros con Método Activador de 3 Párrafos (Alta Conversión)
const DEFAULT_COPYS: Partial<CopyPromocional>[] = [
  {
    id: 'default-rescate-60d',
    titulo: '🚨 Rescate 60d — Las Paredes Preguntan',
    audiencia_target: 'ausentes_60d',
    contenido: `Las paredes de acá llevan semanas preguntando por ti. Francamente, yo también. 👀

{nombre}, guardé un beneficio especial de {promocion} en tu próximo {ultimo_servicio} para consentirte como mereces. 💅

¿Coordinamos esta semana? 😌

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '20% OFF',
    regalo_sugerido: 'Exfoliación de Manos Spa'
  },
  {
    id: 'default-rescate-90d',
    titulo: '💔 Rescate 90d — Tu Espacio Sigue Intacto',
    audiencia_target: 'rescate_90d',
    contenido: `Estaba revisando fotos de tus visitas anteriores y no es lo mismo sin ti por acá. 🥹

{nombre}, preparé un regalo especial de {regalo} más {promocion} exclusivo para que vuelvas a desconectar un ratito. ✨

¿Te gustaría que te guarde un espacio? 😉

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '30% OFF',
    regalo_sugerido: 'Tratamiento Spa Reconstituyente'
  },
  {
    id: 'default-vip',
    titulo: '👑 Lealtad VIP — Acceso Exclusivo',
    audiencia_target: 'vip',
    contenido: `Hay clientas que simplemente le dan vida al salón y tú eres una de ellas. 🌟

{nombre}, reservé un obsequio de {regalo} en tu próximo {ultimo_servicio} antes de anunciarlo a las demás. 👑

¿Te gustaría aprovecharlo estos días? 😌

{opt_out}`,
    tipo_promocion: 'regalo',
    valor_promocion: 'VIP Especial',
    regalo_sugerido: 'Tratamiento Argán Premium'
  },
  {
    id: 'default-unas',
    titulo: '💅 Fans de Uñas — Retoque & Nuevos Tonos',
    audiencia_target: 'servicio_unas',
    contenido: `Tus manos dicen todo antes de que digas una sola palabra. 👀

{nombre}, llegaron nuevos efectos y te guardé {promocion} más {regalo} en tu próxima sesión. 💅

¿Te gustaría renovarlas estos días? 😌

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '15% OFF',
    regalo_sugerido: 'Exfoliación de Manos Spa'
  },
  {
    id: 'default-pestanas',
    titulo: '👁️ Mirada & Pestañas — Volumen Intacto',
    audiencia_target: 'servicio_pestanas',
    contenido: `Una mirada bien cuidada ahorra tiempo y cambia el día por completo. ✨

{nombre}, reservé un kit de cuidado de {regalo} junto con {promocion} en tu mantenimiento de pestañas. 👁️

¿Te gustaría que coordinemos tu espacio? 😉

{opt_out}`,
    tipo_promocion: 'regalo',
    valor_promocion: '15% OFF Retoque',
    regalo_sugerido: 'Cepillo Lash Spa'
  },
  {
    id: 'default-cabello',
    titulo: '💇 Melena Radiante — Sellado & Brillo',
    audiencia_target: 'servicio_cabello',
    contenido: `El cabello sano y con movimiento no es casualidad, es dedicación. 🌿

{nombre}, separé un tratamiento de {regalo} sin costo en tu próximo servicio de color o corte. 💇

¿Coordinamos tu sesión esta semana? 😌

{opt_out}`,
    tipo_promocion: 'regalo',
    valor_promocion: 'Nutrición Capilar',
    regalo_sugerido: 'Ampolla Argán Reconstituyente'
  },
  {
    id: 'default-facial',
    titulo: '💆 Skincare — Renovación y Glow',
    audiencia_target: 'servicio_facial',
    contenido: `Tu piel absorbe todo el estrés de la rutina y merece una pausa. 🌸

{nombre}, tienes una mascarilla de {regalo} incluida con {promocion} en tu limpieza facial mensual. 💆

¿Te gustaría regalarte este momento? 😌

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '20% OFF',
    regalo_sugerido: 'Velo de Colágeno Hidratante'
  },
  {
    id: 'default-cross-unas-pestanas',
    titulo: '💅✨👁️ Cross: Uñas a Pestañas — Combo #1',
    audiencia_target: 'cross_unas_pestanas',
    contenido: `Tus manos siempre lucen impecables, pero tu mirada merece el mismo protagonismo. 👀

{nombre}, por ser clienta consentida de uñas te preparé un beneficio exclusivo de {promocion} en tu primera sesión de pestañas o lifting. 💅

¿Te animas a probarlo esta semana? 😉

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '20% OFF Especial',
    regalo_sugerido: 'Cepillo Spa de Pestañas'
  },
  {
    id: 'default-cross-cabello-facial',
    titulo: '💇✨💆 Cross: Cabello a Facial — Dúo Radiante',
    audiencia_target: 'cross_cabello_facial',
    contenido: `Mientras cuidamos tu cabello podemos dejar tu rostro igual de radiante. ✨

{nombre}, preparé un facial exprés de {regalo} con {promocion} para consentirte en la misma cita. 💆

¿Te gustaría que te lo reserve? 😌

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '25% OFF Dúo',
    regalo_sugerido: 'Limpieza Exprés Glow'
  },
  {
    id: 'default-cross-mani-pedi',
    titulo: '💅✨🦶 Cross: Manos a Pies — Dúo Spa Total',
    audiencia_target: 'cross_mani_pedi',
    contenido: `Tus manos están listas, pero tus pies también merecen el mismo descanso. 🦶

{nombre}, puedes sumar tu pedicura spa en tu próxima visita con {promocion} y sales completamente renovada. 💅

¿Coordinamos tu sesión completa? 😉

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '20% OFF Pedicura',
    regalo_sugerido: 'Sales Minerales Relajantes'
  },
  {
    id: 'default-cross-pestanas-cejas',
    titulo: '👁️✨📐 Cross: Pestañas a Cejas — Mirada 360°',
    audiencia_target: 'cross_pestanas_cejas',
    contenido: `Unas pestañas perfectas con cejas en armonía cambian todo el marco de tu rostro. 💫

{nombre}, te guardé un perfilado o laminado de cejas de {regalo} en tu próximo retoque de pestañas. 👁️

¿Te gustaría que lo agendemos juntos? 😌

{opt_out}`,
    tipo_promocion: 'regalo',
    valor_promocion: 'Mirada 360°',
    regalo_sugerido: 'Diseño y Laminado de Cejas'
  },
  {
    id: 'default-leads',
    titulo: '📣 Leads Ads — Duda Pendiente',
    audiencia_target: 'leads',
    contenido: `Me quedé pensando en la consulta que nos hiciste hace unos días. 👀

{nombre}, te guardé un beneficio de {promocion} de bienvenida en tu primera visita para que conozcas el salón y salgas renovada. 💆

¿Te ayudo a resolver cualquier duda que tengas? 😌

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '15% OFF Bienvenida',
    regalo_sugerido: 'Diagnóstico Capilar o Facial'
  },
  {
    id: 'default-nuevas',
    titulo: '🌱 Nuevas — 2da Visita Inolvidable',
    audiencia_target: 'nuevas',
    contenido: `Nos encantó tenerte por primera vez y queremos que tu segunda visita sea aún mejor. 💫

{nombre}, tienes listo tu {promocion} en tu próximo {ultimo_servicio} para seguir cuidando tus resultados. 💅

¿Te animas a coordinar un espacio? 😉

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '15% OFF',
    regalo_sugerido: 'Muestra de Producto Spa'
  },
  {
    id: 'default-cumpleanos',
    titulo: '🎂 Cumpleaños — Detalle Exclusivo',
    audiencia_target: 'cumpleanos',
    contenido: `¡El salón está de fiesta porque este mes te toca celebrar a ti! 🎉

{nombre}, tenemos preparado tu regalo de {regalo} + {promocion} para que te consientas y brilles en tu día especial. 👑

¿Te gustaría coordinar tu cita consentida? 🥹

{opt_out}`,
    tipo_promocion: 'regalo',
    valor_promocion: 'Cumpleañera VIP',
    regalo_sugerido: 'Servicio Spa de Cortesía'
  },
  {
    id: 'default-todas',
    titulo: '🌟 Toda la Base — Momento de Consentirte',
    audiencia_target: 'todas',
    contenido: `La rutina a veces no nos da respiro y tu momento de autocuidado no se negocia. 🌿

{nombre}, habilitamos una cortesía de {promocion} en {ultimo_servicio} para consentirte como te mereces. 💅

¿Coordinamos un momento para ti? 😌

{opt_out}`,
    tipo_promocion: 'porcentaje',
    valor_promocion: '15% OFF',
    regalo_sugerido: 'Exfoliación de Manos'
  }
];

type MainTab = 'envios' | 'calendario' | 'roi' | 'autopilot' | 'copys';

export const Marketing: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const businessId = localStorage.getItem('korat_business_id') || '';

  // 5 Tabs Principales
  const [activeTab, setActiveTab] = useState<MainTab>('envios');

  // ── 7. Calendario de Fechas Clave / Festivos State ──
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('PE');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todas');
  const [calendarSearchQuery, setCalendarSearchQuery] = useState<string>('');

  // ── 1. Marketplace de Audiencias State ──
  const [selectedSegmento, setSelectedSegmento] = useState<string>('vip');
  const [marketFilterCategory, setMarketFilterCategory] = useState<AudienceCategory>('todas');
  const [marketSearchQuery, setMarketSearchQuery] = useState<string>('');
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState<boolean>(false);
  const [audienceCounts, setAudienceCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<boolean>(false);
  const [tenantCategories, setTenantCategories] = useState<string[]>([]);
  const [tenantServicesList, setTenantServicesList] = useState<any[]>([]);

  // ── 2. Filtros de Servicio e Inactividad ──
  const [selectedServicio, setSelectedServicio] = useState<string>('todos');
  const [diasSinVisita, setDiasSinVisita] = useState<number>(0);
  const [soloOptin, setSoloOptin] = useState<boolean>(true);
  const [audienceList, setAudienceList] = useState<BroadcastAudienceClient[]>([]);
  const [loadingAudience, setLoadingAudience] = useState<boolean>(false);
  const [sendCap, setSendCap] = useState<number>(20);

  // ── 3. Formato de Envío e Imagen ──
  const [formato, setFormato] = useState<'texto' | 'imagen_texto'>('texto');
  const [imagenUrl, setImagenUrl] = useState<string>('');
  const [imagenUrlInput, setImagenUrlInput] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // ── 4. Copys State ──
  const [copys, setCopys] = useState<CopyPromocional[]>([]);
  const [loadingCopys, setLoadingCopys] = useState<boolean>(false);
  const [selectedCopy, setSelectedCopy] = useState<CopyPromocional | null>(null);
  const [copysCategoryFilter, setCopysCategoryFilter] = useState<string>('todas');
  const [showOnlyRecommendedCopys, setShowOnlyRecommendedCopys] = useState<boolean>(true);
  const [showMethodGuide, setShowMethodGuide] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingCopy, setEditingCopy] = useState<Partial<CopyPromocional>>({
    titulo: '',
    audiencia_target: 'todas',
    contenido: '',
    tipo_promocion: 'porcentaje',
    valor_promocion: '15% OFF',
    regalo_sugerido: ''
  });

  // ── 5. Estado de Envío & Scheduling ──
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [lastSentCount, setLastSentCount] = useState<number>(0);
  const [timingMode, setTimingMode] = useState<'inmediato' | 'programado'>('inmediato');
  const [fechaProgramada, setFechaProgramada] = useState<string>('');
  const [scheduledPreset, setScheduledPreset] = useState<'hoy_7pm' | 'manana_11am' | 'manana_7pm' | 'custom' | null>(null);
  const [scheduledCampaigns, setScheduledCampaigns] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState<boolean>(false);
  const [cancelingCampaignId, setCancelingCampaignId] = useState<number | null>(null);
  const [scheduledSuccessMsg, setScheduledSuccessMsg] = useState<string | null>(null);

  // Cargar campañas programadas
  const loadScheduledCampaigns = async () => {
    if (!businessId) return;
    try {
      setLoadingScheduled(true);
      const data = await broadcastsApi.getScheduledCampaigns();
      setScheduledCampaigns(data || []);
    } catch (err) {
      console.warn('Error al cargar campañas programadas:', err);
    } finally {
      setLoadingScheduled(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'envios') {
      loadScheduledCampaigns();
    }
  }, [activeTab, businessId]);

  // Cancelar campaña programada
  const handleCancelScheduled = async (id: number) => {
    if (!confirm('¿Deseas cancelar esta campaña programada?')) return;
    try {
      setCancelingCampaignId(id);
      await broadcastsApi.cancelScheduledCampaign(id);
      await loadScheduledCampaigns();
    } catch (err) {
      alert('Error al cancelar la campaña');
    } finally {
      setCancelingCampaignId(null);
    }
  };

  // Helper para presets rápidos de fecha/hora
  const applyTimingPreset = (preset: 'hoy_7pm' | 'manana_11am' | 'manana_7pm') => {
    setScheduledPreset(preset);
    const now = new Date();
    const target = new Date();

    if (preset === 'hoy_7pm') {
      target.setHours(19, 0, 0, 0);
      if (target <= now) {
        // Si ya pasó las 7pm, programar para mañana a las 7pm
        target.setDate(target.getDate() + 1);
      }
    } else if (preset === 'manana_11am') {
      target.setDate(target.getDate() + 1);
      target.setHours(11, 0, 0, 0);
    } else if (preset === 'manana_7pm') {
      target.setDate(target.getDate() + 1);
      target.setHours(19, 0, 0, 0);
    }

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, '0');
    const day = String(target.getDate()).padStart(2, '0');
    const hours = String(target.getHours()).padStart(2, '0');
    const minutes = String(target.getMinutes()).padStart(2, '0');
    setFechaProgramada(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  const [roiStats, setRoiStats] = useState<any>(null);
  const [loadingRoi, setLoadingRoi] = useState(false);
  const [campaignStats, setCampaignStats] = useState<any[]>([]);
  const [loadingCampaignStats, setLoadingCampaignStats] = useState(false);
  const [roiActiveFilter, setRoiActiveFilter] = useState<'todos' | 'retoques' | 'noshows' | 'rescates' | 'fidelizacion' | 'cuidados' | 'masivos'>('todos');
  const [roiTimeRange, setRoiTimeRange] = useState<'hoy' | '7dias' | 'mes' | 'todo'>('mes');
  const [inspectingEvent, setInspectingEvent] = useState<any | null>(null);

  // Cargar Métricas ROI 100% Reales
  const fetchRoiData = async (rangeOverride?: 'hoy' | '7dias' | 'mes' | 'todo') => {
    if (!businessId) return;
    setLoadingRoi(true);
    setLoadingCampaignStats(true);
    const range = rangeOverride || roiTimeRange;
    try {
      const { data, error } = await supabase.rpc('get_marketing_roi_stats', { 
        p_business_id: businessId,
        p_mes_inicio: null,
        p_filtro_rango: range
      });
      if (!error && data) {
        setRoiStats(data);
        if (data.campanas && Array.isArray(data.campanas)) {
          setCampaignStats(data.campanas);
        }
      }
    } catch (e) {
      console.warn('Error cargando métricas reales de ROI:', e);
    } finally {
      setLoadingRoi(false);
      setLoadingCampaignStats(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'roi') fetchRoiData();
  }, [activeTab, roiTimeRange]);

  // ── Cargar Servicios Reales del Negocio (Multitenant) ──
  useEffect(() => {
    const loadTenantServices = async () => {
      if (!businessId) return;
      try {
        const { data } = await supabase
          .from('servicios')
          .select('id, nombre, categoria, precio')
          .eq('business_id', businessId);
        if (data && data.length > 0) {
          setTenantServicesList(data);
          const cats = Array.from(new Set(data.map((s: any) => s.categoria).filter(Boolean))) as string[];
          setTenantCategories(cats);
        }
      } catch (err) {
        console.warn('Error cargando servicios del tenant:', err);
      }
    };
    loadTenantServices();
  }, [businessId]);

  // ── Catálogo Maestro Dinámico (Combina Universales + Servicios y Cross Reales del Tenant) ──
  const fullAudienceCatalog = useMemo<AudienceDefinition[]>(() => {
    // Si el tenant tiene categorías configuradas en BD, generar dinámicamente audiencias por servicio
    const dynamicServiceAudiences: AudienceDefinition[] = tenantCategories.map((cat, idx) => {
      const lower = cat.toLowerCase();
      let emoji = '✨';
      let badgeClass = 'bg-violet-600 text-white';
      let icon = Sparkles;
      let grad = 'from-violet-500 to-pink-600';

      if (lower.includes('man') || lower.includes('uñ')) {
        emoji = '💅'; badgeClass = 'bg-pink-600 text-white'; icon = Scissors; grad = 'from-pink-500 to-rose-600';
      } else if (lower.includes('pesta') || lower.includes('cej') || lower.includes('mirada')) {
        emoji = '👁️'; badgeClass = 'bg-violet-600 text-white'; icon = Target; grad = 'from-violet-500 to-purple-600';
      } else if (lower.includes('cabel') || lower.includes('pel') || lower.includes('capilar')) {
        emoji = '💇'; badgeClass = 'bg-amber-700 text-white'; icon = Sparkles; grad = 'from-amber-600 to-yellow-600';
      } else if (lower.includes('pie') || lower.includes('pedi')) {
        emoji = '🦶'; badgeClass = 'bg-blue-600 text-white'; icon = Sparkle; grad = 'from-blue-500 to-cyan-600';
      } else if (lower.includes('rost') || lower.includes('fac') || lower.includes('piel')) {
        emoji = '💆'; badgeClass = 'bg-teal-600 text-white'; icon = Heart; grad = 'from-teal-500 to-emerald-600';
      } else if (lower.includes('masaj') || lower.includes('spa') || lower.includes('relax')) {
        emoji = '🌿'; badgeClass = 'bg-emerald-700 text-white'; icon = Heart; grad = 'from-emerald-600 to-teal-700';
      } else if (lower.includes('depil')) {
        emoji = '✨'; badgeClass = 'bg-orange-600 text-white'; icon = Zap; grad = 'from-orange-500 to-rose-600';
      }

      return {
        id: `cat_${cat}`,
        category: 'servicios',
        categoryLabel: 'Por Servicio',
        label: `${cat} Lovers`,
        sublabel: `Clientas con citas de ${cat}`,
        badgeTag: `Fans ${cat}`,
        badgeSolidClass: badgeClass,
        icon,
        emoji,
        color: 'pink',
        gradient: grad,
        activeBgDark: 'bg-pink-950/50 border-pink-500/70 shadow-pink-900/30',
        activeBgLight: 'bg-pink-50 border-pink-500/70 shadow-pink-100',
        accentTextDark: 'text-pink-400',
        accentTextLight: 'text-pink-800',
        strategy: `Clientas que consumen ${cat}. Activar ciclo de mantenimiento e introducir novedades de ${cat}.`,
        cta: `Promoción en próxima sesión de ${cat} o regalo de cortesía.`,
        diasIntegrados: false,
        urgency: 'media',
        roiPotential: '⭐⭐⭐⭐⭐',
      };
    });

    // Generar combinaciones de Venta Cruzada dinámicas entre las categorías del negocio
    const dynamicCrossAudiences: AudienceDefinition[] = [];
    if (tenantCategories.length >= 2) {
      for (let i = 0; i < tenantCategories.length; i++) {
        for (let j = i + 1; j < tenantCategories.length; j++) {
          const c1 = tenantCategories[i];
          const c2 = tenantCategories[j];
          if (dynamicCrossAudiences.length >= 6) break; // Máximo 6 cruces destacados
          dynamicCrossAudiences.push({
            id: `cross_dyn_${c1}__${c2}`,
            category: 'cruzadas',
            categoryLabel: 'Venta Cruzada',
            label: `Combo ${c1} + ${c2}`,
            sublabel: `Consumen ${c1} y no ${c2} (o viceversa)`,
            badgeTag: `Cross ${c1}+${c2}`,
            badgeSolidClass: 'bg-fuchsia-600 text-white',
            icon: Zap,
            emoji: '⚡',
            color: 'fuchsia',
            gradient: 'from-fuchsia-600 to-violet-600',
            activeBgDark: 'bg-fuchsia-950/50 border-fuchsia-500/70 shadow-fuchsia-900/30',
            activeBgLight: 'bg-fuchsia-50 border-fuchsia-500/70 shadow-fuchsia-100',
            accentTextDark: 'text-fuchsia-400',
            accentTextLight: 'text-fuchsia-800',
            strategy: `Cruzar a las clientas de ${c1} para que prueben ${c2}. Duplica el ticket promedio del salón.`,
            cta: `Beneficio exclusivo del 20% OFF en ${c2} por ser clienta de ${c1}.`,
            diasIntegrados: false,
            urgency: 'alta',
            roiPotential: '⭐⭐⭐⭐⭐',
          });
        }
      }
    }

    // Audiencias base fijas
    const baseLifecycles = AUDIENCE_CATALOG.filter(a => a.category !== 'servicios' && a.category !== 'cruzadas');
    const baseCruzadas = AUDIENCE_CATALOG.filter(a => a.category === 'cruzadas');

    return [
      ...baseLifecycles,
      ...(dynamicServiceAudiences.length > 0 ? dynamicServiceAudiences : AUDIENCE_CATALOG.filter(a => a.category === 'servicios')),
      ...(dynamicCrossAudiences.length > 0 ? dynamicCrossAudiences : baseCruzadas),
    ];
  }, [tenantCategories]);

  // Presets de servicios para el filtro interactivo
  const serviciosPresetsDinamicos = useMemo(() => {
    if (tenantCategories.length === 0) return SERVICIOS_PRESETS;
    return [
      { id: 'todos', label: 'Todos', icon: '✨' },
      ...tenantCategories.map(cat => {
        const lower = cat.toLowerCase();
        let icon = '✨';
        if (lower.includes('man') || lower.includes('uñ')) icon = '💅';
        else if (lower.includes('pesta') || lower.includes('cej')) icon = '👁️';
        else if (lower.includes('cabel') || lower.includes('pel')) icon = '💇';
        else if (lower.includes('pie') || lower.includes('pedi')) icon = '🦶';
        else if (lower.includes('rost') || lower.includes('fac')) icon = '💆';
        else if (lower.includes('masaj') || lower.includes('spa')) icon = '🌿';
        return { id: cat, label: cat, icon };
      })
    ];
  }, [tenantCategories]);

  // Audiencia activa
  const audienciaActiva = useMemo(() => {
    return fullAudienceCatalog.find(s => s.id === selectedSegmento) || fullAudienceCatalog[0];
  }, [selectedSegmento, fullAudienceCatalog]);

  // Auto-seleccionar copy recomendado cuando el usuario cambia de audiencia en el Marketplace
  useEffect(() => {
    if (copys.length > 0) {
      const match = copys.find(c => c.audiencia_target === selectedSegmento);
      if (match) {
        setSelectedCopy(match);
      } else {
        const fallbackGeneral = copys.find(c => c.audiencia_target === 'todas') || copys[0];
        if (fallbackGeneral) setSelectedCopy(fallbackGeneral);
      }
    }
  }, [selectedSegmento, copys]);

  // Lista filtrada para el carrusel y modal
  const audienciasFiltradas = useMemo(() => {
    return fullAudienceCatalog.filter(a => {
      const matchCat = marketFilterCategory === 'todas' || a.category === marketFilterCategory;
      const matchSearch = !marketSearchQuery || 
        a.label.toLowerCase().includes(marketSearchQuery.toLowerCase()) ||
        a.sublabel.toLowerCase().includes(marketSearchQuery.toLowerCase()) ||
        a.badgeTag.toLowerCase().includes(marketSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [fullAudienceCatalog, marketFilterCategory, marketSearchQuery]);

  // Límites diarios Anti-Baneo
  const esLeads = audienciaActiva.esLeads || selectedSegmento === 'leads' || selectedSegmento === 'potenciales';
  const limiteMaxDiario = useMemo(() => {
    if (esLeads) return formato === 'imagen_texto' ? 15 : 35;
    return formato === 'imagen_texto' ? 40 : 100;
  }, [esLeads, formato]);

  useEffect(() => {
    setSendCap(prev => Math.min(prev, limiteMaxDiario));
  }, [limiteMaxDiario]);

  // Cargar Copys
  const fetchCopys = async () => {
    try {
      setLoadingCopys(true);
      const data = await broadcastsApi.getCopys();
      if (data && data.length > 0) {
        setCopys(data);
        if (!selectedCopy) setSelectedCopy(data[0]);
      } else {
        setCopys(DEFAULT_COPYS as CopyPromocional[]);
        if (!selectedCopy) setSelectedCopy(DEFAULT_COPYS[0] as CopyPromocional);
      }
    } catch {
      setCopys(DEFAULT_COPYS as CopyPromocional[]);
      if (!selectedCopy) setSelectedCopy(DEFAULT_COPYS[0] as CopyPromocional);
    } finally {
      setLoadingCopys(false);
    }
  };

  useEffect(() => { fetchCopys(); }, []);

  // Cargar Conteos de Audiencias: 1 sola llamada al RPC corregido + conteos dinámicos del tenant
  const fetchAudienceCounts = async (catalog: AudienceDefinition[]) => {
    if (!businessId) return;
    try {
      setLoadingCounts(true);

      // ── 1. RPC base: conteos de todos los segmentos fijos en una sola llamada ──
      const { data: rawStats, error } = await supabase.rpc('get_marketing_audience_counts', {
        p_business_id: businessId
      });

      if (!error && rawStats && typeof rawStats === 'object') {
        setAudienceCounts(rawStats as Record<string, number>);
      } else if (error) {
        console.warn('[Marketing] get_marketing_audience_counts error:', error.message);
      }

      // ── 2. Conteos dinámicos del tenant: cat_X y cross_dyn_X__Y ──
      const dynamicSegs = catalog.filter(a => a.id.startsWith('cat_') || a.id.startsWith('cross_dyn_'));
      if (dynamicSegs.length > 0) {
        const dynResults = await Promise.allSettled(
          dynamicSegs.slice(0, 12).map(seg =>
            supabase.rpc('get_combined_broadcast_audience', {
              p_business_id: businessId,
              p_servicio_keyword: '',
              p_dias_sin_visita: 0,
              p_segmento: seg.id,
              p_solo_optin: false,
              p_limit: 5000
            }).then(({ data, error: e }) => ({
              id: seg.id,
              count: (!e && Array.isArray(data)) ? data.length : 0
            }))
          )
        );
        const dynCounts: Record<string, number> = {};
        dynResults.forEach(r => {
          if (r.status === 'fulfilled') dynCounts[r.value.id] = r.value.count;
        });
        setAudienceCounts(prev => ({ ...prev, ...dynCounts }));
      }
    } catch (e) {
      console.warn('Error al cargar conteos de audiencias:', e);
    } finally {
      setLoadingCounts(false);
    }
  };

  // Disparar conteos cuando el catálogo esté listo (o cuando cambie por nuevos servicios del tenant)
  useEffect(() => {
    if (businessId && fullAudienceCatalog.length > 0) {
      fetchAudienceCounts(fullAudienceCatalog);
    }
  }, [businessId, fullAudienceCatalog]);


  // Cargar Audiencia RPC para el segmento activo y filtros seleccionados
  const loadAudience = async () => {
    setAudienceList([]);
    setSendCap(0);
    try {
      setLoadingAudience(true);
      // Refrescar también los conteos globales (usa el catálogo activo)
      fetchAudienceCounts(fullAudienceCatalog);
      const data = await broadcastsApi.getAudience({
        servicioKeyword: '',
        diasSinVisita,
        segmento: selectedSegmento,
        soloOptin,
        limit: 300
      });
      setAudienceList(data || []);
      if (data && data.length > 0) {
        setSendCap(Math.min(limiteMaxDiario, data.length));
      }
    } catch (e) {
      console.error('Error al consultar audiencia:', e);
    } finally {
      setLoadingAudience(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'envios') loadAudience();
  }, [selectedSegmento, diasSinVisita, soloOptin, activeTab]);

  // Audiencia final filtrando cooldown
  const finalRecipients = useMemo(
    () => audienceList.filter(c => !c.cooldown_activo).slice(0, sendCap),
    [audienceList, sendCap]
  );

  const getFirstName = (fullName: string) => {
    if (!fullName) return 'Cliente';
    return fullName.trim().split(' ')[0] || 'Cliente';
  };

  const formatDaysText = (days: number) => {
    if (!days || days >= 900) return 'un tiempo';
    return `${days}`;
  };

  // Preview dinámico del mensaje
  const previewMessage = useMemo(() => {
    if (!selectedCopy) return 'Selecciona un copy para ver la vista previa...';
    const sample = finalRecipients[0] || {
      nombre: 'Sofía Rodríguez',
      dia_preferido: 'Viernes',
      ultimo_servicio: 'Rubber Base',
      dias_sin_visita: 45,
      regalo_sugerido: 'Exfoliación de Manos Spa'
    };
    let text = selectedCopy.contenido;
    text = text.replace(/{nombre}/g, getFirstName(sample.nombre));
    text = text.replace(/{dia_preferido}/g, sample.dia_preferido || 'esta semana');
    text = text.replace(/{ultimo_servicio}/g, sample.ultimo_servicio || 'servicio');
    text = text.replace(/{dias_sin_visita}/g, formatDaysText(sample.dias_sin_visita));
    text = text.replace(/{promocion}/g, selectedCopy.valor_promocion || 'un descuento especial');
    text = text.replace(/{regalo}/g, selectedCopy.regalo_sugerido || sample.regalo_sugerido || 'un regalo especial');
    text = text.replace(/{opt_out}/g, '✨ Si prefieres no recibir más promociones por WhatsApp, responde con la palabra NO.');
    return text;
  }, [selectedCopy, finalRecipients]);

  // Subir imagen a Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `broadcasts/${businessId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('imagenes_servicios')
        .upload(filename, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from('imagenes_servicios')
        .getPublicUrl(filename);
      setImagenUrl(urlData.publicUrl);
      setImagenUrlInput(urlData.publicUrl);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      alert('Error al subir imagen. Verifica el bucket de Storage.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Insertar variable en copy
  const insertVariable = (v: string) => {
    setEditingCopy(prev => ({
      ...prev,
      contenido: (prev.contenido || '') + `{${v}}`
    }));
  };

  // Guardar copy
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
        audiencia_target: editingCopy.audiencia_target || 'todas',
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

  // Usar Fecha Clave en Envíos
  const handleUseKeyDateInBroadcast = (keyDate: KeyDate) => {
    // 1. Buscar copy que coincida o crear uno dinámico festivo
    const foundCopy = copys.find(c => c.titulo.toLowerCase().includes(keyDate.name.toLowerCase()));
    const keyDateCopy: CopyPromocional = foundCopy || {
      id: `keydate-${keyDate.id}`,
      business_id: businessId,
      titulo: `🎉 ${keyDate.name} — Promo Especial`,
      audiencia_target: 'todas',
      contenido: `✨ ¡Celebremos juntos ${keyDate.name}! ✨\n\n{nombre}, reservé un beneficio exclusivo de {promocion} en tu próximo {ultimo_servicio} para consentirte como te mereces. 💅\n\n¿Te gustaría que te guarde un espacio? 😌\n\n{opt_out}`,
      tipo_promocion: 'porcentaje',
      valor_promocion: '20% OFF',
      regalo_sugerido: 'Detalle Especial de Cortesía'
    };

    setSelectedCopy(keyDateCopy);
    setActiveTab('envios');
  };

  // Eliminar copy
  const handleDeleteCopy = async (id: string) => {
    if (!confirm('¿Eliminar este copy de tu biblioteca?')) return;
    try { await broadcastsApi.deleteCopy(id); } catch {}
    setCopys(prev => prev.filter(c => c.id !== id));
    if (selectedCopy?.id === id) setSelectedCopy(copys.find(c => c.id !== id) || null);
  };

  // Enviar Masivo
  const handleSendBroadcast = async () => {
    if (!selectedCopy || finalRecipients.length === 0) return;
    if (formato === 'imagen_texto' && !imagenUrl) {
      alert('Agrega una imagen para enviar en formato Imagen + Texto.');
      return;
    }
    if (sendCap > limiteMaxDiario) {
      alert(`Límite seguro: máx ${limiteMaxDiario}/día para esta audiencia y formato.`);
      return;
    }
    if (timingMode === 'programado' && !fechaProgramada) {
      alert('Por favor selecciona una fecha y hora para programar el envío.');
      return;
    }

    const isScheduled = timingMode === 'programado' && Boolean(fechaProgramada);
    const scheduledIso = isScheduled ? new Date(fechaProgramada).toISOString() : null;

    if (isScheduled && new Date(fechaProgramada).getTime() <= Date.now() + 60000) {
      alert('La fecha programada debe ser al menos 1 minuto en el futuro.');
      return;
    }

    setIsSending(true);
    setSendSuccess(false);
    setScheduledSuccessMsg(null);

    const optOutFooter = '\n\n_Si no deseas recibir más promociones responde NO._';
    const recipientsPayload = finalRecipients.map(c => {
      let mensaje = selectedCopy.contenido;
      mensaje = mensaje.replace(/{nombre}/g, getFirstName(c.nombre));
      mensaje = mensaje.replace(/{dia_preferido}/g, c.dia_preferido || 'esta semana');
      mensaje = mensaje.replace(/{ultimo_servicio}/g, c.ultimo_servicio || 'servicio');
      mensaje = mensaje.replace(/{dias_sin_visita}/g, formatDaysText(c.dias_sin_visita));
      mensaje = mensaje.replace(/{promocion}/g, selectedCopy.valor_promocion || 'descuento especial');
      mensaje = mensaje.replace(/{regalo}/g, selectedCopy.regalo_sugerido || c.regalo_sugerido || 'regalo');
      mensaje = mensaje.replace(/{opt_out}/g, optOutFooter.trim());
      if (!mensaje.includes('responde NO') && !mensaje.includes('BAJA')) {
        mensaje += optOutFooter;
      }
      return {
        id: c.id,
        nombre: c.nombre,
        primer_nombre: getFirstName(c.nombre),
        telefono: c.telefono,
        dia_preferido: c.dia_preferido,
        ultimo_servicio: c.ultimo_servicio,
        dias_sin_visita: c.dias_sin_visita,
        mensaje_personalizado: mensaje
      };
    });

    try {
      await broadcastsApi.sendBulkBroadcast({
        business_id: businessId,
        titulo_campana: selectedCopy.titulo + (isScheduled ? ' ⏰ Programada' : ''),
        copy_id: selectedCopy.id,
        mensaje_template: selectedCopy.contenido,
        total_audiencia_encontrada: audienceList.length,
        total_seleccionados: finalRecipients.length,
        tipo_promocion: selectedCopy.tipo_promocion,
        valor_promocion: selectedCopy.valor_promocion,
        regalo: selectedCopy.regalo_sugerido,
        imagen_url: formato === 'imagen_texto' ? imagenUrl : undefined,
        formato,
        fecha_programada: scheduledIso,
        recipients: recipientsPayload
      });
      setLastSentCount(finalRecipients.length);
      if (isScheduled) {
        setScheduledSuccessMsg(`Campaña programada con éxito para el ${new Date(fechaProgramada).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}`);
        loadScheduledCampaigns();
      } else {
        setSendSuccess(true);
      }
    } finally {
      setIsSending(false);
    }
  };

  const fmt = (n: number) => (n || 0).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className={`min-h-screen pb-44 sm:pb-32 font-sans transition-colors duration-300 ${
      isDark ? 'bg-[#07090e] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>

      {/* ── Header Sticky Mobile-First ── */}
      <div className={`sticky top-0 z-30 backdrop-blur-xl border-b transition-colors duration-300 px-4 pt-3 pb-2.5 ${
        isDark ? 'bg-[#0b0d18]/95 border-white/8' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between max-w-lg mx-auto mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/25 shrink-0">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className={`text-[15px] font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Marketing <span className="text-pink-500">&</span> Envíos
              </h1>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Centro de crecimiento comercial 🚀
              </p>
            </div>
          </div>
          {activeTab === 'envios' && (
            <button
              onClick={loadAudience}
              disabled={loadingAudience}
              className={`p-2.5 rounded-xl border transition-all active:scale-95 ${
                isDark ? 'bg-white/5 border-white/8 text-slate-300 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
              title="Refrescar audiencia"
            >
              <RefreshCw className={`h-4 w-4 ${loadingAudience ? 'animate-spin text-pink-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Segmented Control 5 Tabs — Ultra-Modern Mobile-First Grid (Cero Desbordes) */}
        <div className={`p-1 rounded-2xl border grid grid-cols-5 gap-1 shadow-lg max-w-lg mx-auto relative ${
          isDark ? 'bg-[#0f1422]/90 border-white/10' : 'bg-slate-100/90 border-slate-200'
        }`}>
          {[
            { id: 'envios' as MainTab, label: 'Envíos', shortLabel: 'Envíos', icon: Send, emoji: '📣' },
            { id: 'calendario' as MainTab, label: 'Festivos', shortLabel: 'Fechas', icon: Calendar, emoji: '📅' },
            { id: 'roi' as MainTab, label: 'Impacto & ROI', shortLabel: 'Impacto', icon: TrendingUp, emoji: '💰' },
            { id: 'autopilot' as MainTab, label: 'Automático', shortLabel: 'Auto', icon: Bot, emoji: '🤖' },
            { id: 'copys' as MainTab, label: 'Copys', shortLabel: 'Copys', icon: MessageSquare, emoji: '📝' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative z-10 py-2 px-1 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 min-h-[40px] min-w-0 select-none active:scale-95 ${
                  isActive
                    ? 'text-white'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMarketingTab"
                    transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                    className="absolute inset-0 bg-gradient-to-r from-pink-600 to-violet-600 rounded-xl shadow-md shadow-pink-500/25 -z-10"
                  />
                )}
                <span className="text-xs sm:text-sm shrink-0">{tab.emoji}</span>
                <span className="truncate text-[11px] sm:text-xs">
                  <span className="inline sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════ TAB 1: ENVÍOS (MARKETPLACE REDISEÑADO PRO) ════════════════════ */}
      {activeTab === 'envios' && (
        <div className="px-4 pt-4 pb-20 space-y-4 max-w-lg mx-auto">

          {/* ── BANNER CAMPAÑAS PROGRAMADAS ACTIVAS (SI EXISTEN) ── */}
          {scheduledCampaigns.length > 0 && (
            <div className={`border rounded-2xl p-3.5 shadow-lg transition-all ${
              isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4" />
                    Campañas Programadas ({scheduledCampaigns.length})
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  Auto-despacho vía Supabase
                </span>
              </div>
              <div className="space-y-2">
                {scheduledCampaigns.map((sc: any) => (
                  <div
                    key={sc.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-black/30 border-white/5' : 'bg-white border-amber-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-bold truncate text-slate-800 dark:text-slate-200">
                        {sc.titulo}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(sc.fecha_programada).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })} • {sc.clientes_objetivo || 0} clientes
                      </p>
                    </div>
                    <button
                      onClick={() => handleCancelScheduled(sc.id)}
                      disabled={cancelingCampaignId === sc.id}
                      className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-black hover:bg-red-500/25 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {cancelingCampaignId === sc.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 1. HERO CARD AUDIENCIA SELECCIONADA + MARKETPLACE ACCORDION/DRAWER ── */}
          <div className={`border rounded-3xl p-4 shadow-2xl transition-all duration-300 relative overflow-hidden ${
            isDark ? 'bg-gradient-to-br from-[#12162a] via-[#0f1422] to-[#181126] border-violet-500/30' : 'bg-gradient-to-br from-white via-violet-50/40 to-pink-50/40 border-violet-200'
          }`}>
            {/* Header del bloque */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[11px] font-black uppercase tracking-widest text-violet-400">
                  Audiencia Activa
                </p>
              </div>
              <button
                onClick={() => setIsMarketplaceModalOpen(true)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  isDark
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 hover:bg-violet-500/30'
                    : 'bg-violet-100 border-violet-300 text-violet-700 hover:bg-violet-200'
                }`}
              >
                <Compass className="h-3.5 w-3.5 text-violet-400" />
                Explorar Catálogo ({AUDIENCE_CATALOG.length})
              </button>
            </div>

            {/* Tarjeta Visual de la Audiencia Seleccionada */}
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? audienciaActiva.activeBgDark : audienciaActiva.activeBgLight
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-tr ${audienciaActiva.gradient} flex items-center justify-center text-2xl shadow-lg shrink-0 text-white`}>
                    {audienciaActiva.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {audienciaActiva.label}
                      </h3>
                      {/* Badge sólido de alto contraste con texto blanco */}
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm ${audienciaActiva.badgeSolidClass}`}>
                        {audienciaActiva.badgeTag}
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {audienciaActiva.sublabel}
                    </p>
                  </div>
                </div>

                {/* Conteo de clientes en la base de datos para esta audiencia */}
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-pink-500 bg-pink-500/10 dark:bg-pink-500/20 border border-pink-500/30 px-2.5 py-1 rounded-xl inline-block shadow-sm">
                    {loadingCounts ? '...' : `${audienceCounts[audienciaActiva.id] ?? audienceList.length} en BD`}
                  </span>
                </div>
              </div>

              {/* Estrategia & CTA en tarjeta */}
              <div className={`mt-3 p-2.5 rounded-xl border text-[11px] space-y-1 ${
                isDark ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-white/80 border-slate-200 text-slate-700'
              }`}>
                <p className="leading-snug">
                  💡 <strong className={audienciaActiva.accentTextDark}>Estrategia:</strong> {audienciaActiva.strategy}
                </p>
                <p className="font-semibold text-emerald-400 text-[10px]">
                  🎯 Recomendación: {audienciaActiva.cta}
                </p>
              </div>
            </div>

            {/* Carrusel Horizontal Rápido de Audiencias (Swipeable Mobile) */}
            <div className="mt-4 pt-3 border-t dark:border-white/5 border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <p className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Cambiar Rápido (Desliza 👉)
                </p>
                <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide max-w-[260px]">
                  {(['todas', 'servicios', 'cruzadas', 'rescate', 'lealtad', 'prospectos'] as AudienceCategory[]).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setMarketFilterCategory(cat)}
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg whitespace-nowrap transition-all ${
                        marketFilterCategory === cat
                          ? 'bg-pink-500 text-white shadow-sm'
                          : isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {cat === 'todas' ? '🌟 Todas' : cat === 'servicios' ? '💅 Servicios' : cat === 'cruzadas' ? '⚡ Cruzadas' : cat === 'rescate' ? '🚨 Rescate' : cat === 'lealtad' ? '👑 VIP' : '📣 Ads'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-hide snap-x">
                {audienciasFiltradas.map(seg => {
                  const isCurrent = selectedSegmento === seg.id;
                  const countForSeg = audienceCounts[seg.id] ?? 0;
                  return (
                    <button
                      key={seg.id}
                      onClick={() => setSelectedSegmento(seg.id)}
                      className={`flex-shrink-0 w-[155px] p-3 rounded-2xl border text-left transition-all snap-start active:scale-95 flex flex-col justify-between ${
                        isCurrent
                          ? `${isDark ? seg.activeBgDark : seg.activeBgLight} ring-2 ring-violet-500/50 shadow-md`
                          : isDark ? 'bg-white/3 border-white/5 hover:bg-white/8' : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-xl leading-none">{seg.emoji}</span>
                          {isCurrent ? (
                            <CheckCircle2 className={`h-4 w-4 ${isDark ? seg.accentTextDark : seg.accentTextLight}`} />
                          ) : (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm ${seg.badgeSolidClass}`}>
                              {seg.badgeTag}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] font-black leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {seg.label}
                        </p>
                        <p className={`text-[9px] mt-0.5 line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {seg.sublabel}
                        </p>
                      </div>

                      {/* Contador sincronizado desde Supabase */}
                      <div className="mt-2 pt-1.5 border-t dark:border-white/5 border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-pink-500">
                          {loadingCounts ? '...' : `${countForSeg} contactos`}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {seg.categoryLabel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 2. INACTIVIDAD & PROTECCIÓN ANTI-SPAM (7 DÍAS) ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              2. Inactividad & Filtros
            </p>

            {audienciaActiva.diasIntegrados ? (
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'
              }`}>
                <div>
                  <p className={`text-xs font-bold ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>Rango de días propio del segmento</p>
                  <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    El segmento <span className="font-semibold text-amber-600">"{audienciaActiva.label}"</span> ya incluye su filtro ({audienciaActiva.rangoDiasLabel}).
                  </p>
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
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Excluir bajas de WhatsApp automáticamente</p>
              </div>
              <div
                onClick={() => setSoloOptin(v => !v)}
                className={`relative h-5 w-9 rounded-full transition-colors ${soloOptin ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${soloOptin ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </label>

            {/* Badge Anti-Spam */}
            <div className={`p-3 rounded-xl flex items-center gap-2.5 border ${
              isDark ? 'bg-violet-500/10 border-violet-500/20' : 'bg-violet-50 border-violet-200'
            }`}>
              <div className="h-7 w-7 rounded-lg bg-violet-500/20 text-violet-500 font-bold flex items-center justify-center text-xs shrink-0">
                🛡️
              </div>
              <div className="flex-1">
                <p className={`text-[11px] font-bold ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>Protección Anti-Spam Activa (7 Días)</p>
                <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Clientas que recibieron un mensaje en los últimos 7 días son excluidas automáticamente para no saturarlas.
                </p>
              </div>
            </div>
          </div>

          {/* ── 3. FORMATO: TEXTO VS IMAGEN + TEXTO ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <p className="text-xs font-extrabold uppercase tracking-widest text-violet-500 flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              3. Formato de Envío
            </p>
            <div className={`p-1.5 rounded-xl border flex gap-1 ${
              isDark ? 'bg-black/20 border-white/8' : 'bg-slate-100 border-slate-200'
            }`}>
              {([{ val: 'texto', label: '💬 Solo Texto' }, { val: 'imagen_texto', label: '🖼️ Imagen + Texto' }] as const).map(f => (
                <button
                  key={f.val}
                  onClick={() => setFormato(f.val)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    formato === f.val
                      ? 'bg-violet-500 text-white shadow-md'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {formato === 'imagen_texto' && (
              <div className="space-y-3">
                {esLeads && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">⚠️ Riesgo alto para Leads</p>
                      <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 leading-snug mt-0.5">
                        Enviar imágenes a prospectos sin relación previa tiene alto riesgo de reporte en Meta. Límite reducido a 15 envíos/día.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>URL pública de imagen:</p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imagenUrlInput}
                      onChange={e => setImagenUrlInput(e.target.value)}
                      placeholder="https://... (Supabase, Cloudinary, etc.)"
                      className={`flex-1 text-xs px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-black/30 border-white/10 text-slate-200 placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                    <button
                      onClick={() => setImagenUrl(imagenUrlInput)}
                      disabled={!imagenUrlInput}
                      className="px-3 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold disabled:opacity-40"
                    >
                      Usar
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                    isDark ? 'border-white/15 hover:border-violet-500/60 text-slate-400' : 'border-slate-300 hover:border-violet-400 text-slate-500'
                  }`}>
                    <Upload className="h-4 w-4" />
                    <span className="text-xs font-semibold">{uploadingImage ? 'Subiendo...' : 'Subir imagen desde tu dispositivo'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>

                {imagenUrl && (
                  <div className="relative">
                    <img
                      src={imagenUrl}
                      alt="Preview"
                      className="w-full rounded-2xl object-cover max-h-48 border border-violet-500/30"
                      onError={() => setImagenUrl('')}
                    />
                    <button
                      onClick={() => { setImagenUrl(''); setImagenUrlInput(''); }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                      ✅ Imagen lista
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── 4. AUDIENCIA ENCONTRADA & CAP ANTI-BANEO ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-widest text-pink-500 flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                4. Destinatarios Encontrados
              </p>
              {loadingAudience ? (
                <span className={`text-[11px] flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <RefreshCw className="h-3 w-3 animate-spin text-pink-500" /> Calculando...
                </span>
              ) : (
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
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
                <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">Prueba cambiando el segmento o filtros de inactividad</p>
              </div>
            ) : !loadingAudience && audienceList.length > 0 ? (
              <div className="space-y-3">
                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>¿A cuántas enviar?</span>
                    <span className="text-xs font-extrabold text-pink-500 bg-pink-500/10 px-2 py-0.5 rounded-md border border-pink-500/20">
                      {sendCap} de {Math.min(audienceList.length, limiteMaxDiario)}
                    </span>
                  </div>
                  <input
                    type="range" min="1" max={Math.min(Math.max(1, audienceList.length), limiteMaxDiario)}
                    value={Math.min(sendCap, Math.min(audienceList.length, limiteMaxDiario))}
                    onChange={e => setSendCap(Number(e.target.value))}
                    className="w-full accent-pink-500 h-1.5 bg-slate-300 dark:bg-white/10 rounded-lg cursor-pointer"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      💡 Empieza con grupos pequeños
                    </p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                      esLeads
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      🛡️ Máx. {limiteMaxDiario}/día
                    </span>
                  </div>
                </div>

                {/* Preview de clientas */}
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

          {/* ── 5. MENSAJE PROMOCIONAL & PREVIEW WHATSAPP (SEGMENTADO) ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold uppercase tracking-widest text-violet-500 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  5. Mensaje Promocional
                </p>
              </div>
              <button onClick={() => setActiveTab('copys')} className="text-[11px] text-pink-500 hover:underline font-semibold">
                Ver biblioteca →
              </button>
            </div>

            {/* Selector de visualización de copys (Recomendados vs Todos) */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className={`flex gap-1 p-0.5 rounded-xl border ${
                isDark ? 'bg-black/30 border-white/8' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setShowOnlyRecommendedCopys(true)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                    showOnlyRecommendedCopys
                      ? 'bg-violet-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✨ Para {audienciaActiva.label.split(' ')[0]}
                </button>
                <button
                  onClick={() => setShowOnlyRecommendedCopys(false)}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                    !showOnlyRecommendedCopys
                      ? 'bg-violet-600 text-white shadow-sm'
                      : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({copys.length})
                </button>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'
              }`}>
                3 Párrafos Activadores 🎯
              </span>
            </div>

            {/* Lista de copys filtrados */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {copys
                .filter(c => {
                  if (!showOnlyRecommendedCopys) return true;
                  return c.audiencia_target === selectedSegmento || c.audiencia_target === 'todas' || !c.audiencia_target;
                })
                .map(c => {
                  const isMatch = c.audiencia_target === selectedSegmento;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCopy(c)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] ${
                        selectedCopy?.id === c.id
                          ? 'bg-violet-500/15 border-violet-500/50 shadow-sm ring-1 ring-violet-500/40'
                          : isDark ? 'bg-white/3 border-white/5 hover:bg-white/6' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {selectedCopy?.id === c.id && <CheckCircle2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                          {c.titulo}
                        </span>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {isMatch && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-emerald-600 text-white shadow-sm">
                              IDEAL
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-600 dark:text-violet-300">
                            {c.valor_promocion}
                          </span>
                        </div>
                      </div>
                      <p className={`text-[11px] leading-snug line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {c.contenido}
                      </p>
                    </div>
                  );
                })}
            </div>

            {/* Vista Previa WhatsApp */}
            {selectedCopy && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vista previa WhatsApp:</span>
                </div>
                <div className="bg-[#0b141a] p-3 rounded-2xl border border-emerald-500/20 space-y-2">
                  {formato === 'imagen_texto' && imagenUrl && (
                    <img src={imagenUrl} alt="Preview" className="w-full rounded-xl object-cover max-h-40" />
                  )}
                  {formato === 'imagen_texto' && !imagenUrl && (
                    <div className="flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-emerald-500/20 text-slate-600 text-[10px] gap-1">
                      <Image className="h-4 w-4" />
                      Agrega una imagen arriba
                    </div>
                  )}
                  <div className="bg-[#005c4b] text-slate-100 p-3 rounded-xl text-xs leading-relaxed shadow-md whitespace-pre-wrap">
                    {previewMessage}
                  </div>
                  <div className="text-[9px] text-slate-600 text-right pr-1">
                    Pre-visualización • Variable del 1er cliente seleccionado
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 6. PROGRAMACIÓN & ESPACIADO SEGURO (JITTER) ── */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3.5 transition-colors duration-300 ${
            isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-widest text-pink-500 flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5" />
                6. Momento de Envío & Seguridad
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                timingMode === 'inmediato'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}>
                {timingMode === 'inmediato' ? '⚡ Enviar Ahora' : '⏰ Programado'}
              </span>
            </div>

            {/* Selector Modo Inmediato vs Programado */}
            <div className={`p-1 rounded-xl border flex gap-1 ${
              isDark ? 'bg-black/20 border-white/8' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setTimingMode('inmediato')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  timingMode === 'inmediato'
                    ? 'bg-pink-500 text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Disparo Inmediato
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimingMode('programado');
                  if (!fechaProgramada) applyTimingPreset('hoy_7pm');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  timingMode === 'programado'
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Programar Fecha/Hora
              </button>
            </div>

            {/* Opciones de Programación */}
            {timingMode === 'programado' && (
              <div className="space-y-3 pt-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sugerencias de Horario Óptimo (Mayor Lectura):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'hoy_7pm' as const, label: '🌙 Hoy 7:00 PM', sub: 'Pico WhatsApp' },
                    { id: 'manana_11am' as const, label: '☀️ Mañana 11 AM', sub: 'Media mañana' },
                    { id: 'manana_7pm' as const, label: '🌙 Mañana 7 PM', sub: 'Descanso' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyTimingPreset(p.id)}
                      className={`p-2 rounded-xl border text-center transition-all active:scale-95 ${
                        scheduledPreset === p.id
                          ? 'bg-violet-500/20 border-violet-500/60 text-violet-400 font-bold shadow-sm'
                          : isDark ? 'bg-white/3 border-white/5 text-slate-400 hover:bg-white/6' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <p className="text-[11px] font-bold leading-tight">{p.label}</p>
                      <p className="text-[9px] opacity-75 mt-0.5">{p.sub}</p>
                    </button>
                  ))}
                </div>

                {/* Input selector datetime */}
                <div className="space-y-1 pt-1">
                  <label className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    O define fecha y hora exacta:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={fechaProgramada}
                      onChange={e => {
                        setFechaProgramada(e.target.value);
                        setScheduledPreset(null);
                      }}
                      className={`flex-1 text-xs px-3 py-2 rounded-xl border outline-none ${
                        isDark ? 'bg-black/30 border-white/10 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {fechaProgramada && (
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                    isDark ? 'bg-violet-950/40 border-violet-500/30 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-800'
                  }`}>
                    <Calendar className="h-4 w-4 shrink-0 text-violet-400" />
                    <p className="text-[11px] font-semibold leading-tight">
                      Se enviará el: <strong className="text-pink-500">{new Date(fechaProgramada).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Badge de Espaciado Inteligente & Anti-Baneo (Jitter) */}
            <div className={`p-3 rounded-xl flex items-start gap-2.5 border ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                🛡️
              </div>
              <div className="flex-1">
                <p className={`text-[11px] font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  Espaciado Inteligente Activo (Jitter 12–25s)
                </p>
                <p className={`text-[10px] leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Pausas aleatorias y simulación de escritura humana real entre mensajes. Protege tu número contra baneos de Meta y permite al equipo responder cada chat sin colapsar.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback de Éxito Inmediato */}
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
                  <strong className="text-emerald-400">{lastSentCount} mensajes</strong> despachados con espaciado seguro a n8n → Evolution API
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback de Campaña Programada */}
          <AnimatePresence>
            {scheduledSuccessMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/40 rounded-2xl text-center space-y-2"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white mx-auto flex items-center justify-center">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white">¡Campaña Programada!</h3>
                <p className="text-xs text-slate-300">
                  {scheduledSuccessMsg}
                </p>
                <p className="text-[10px] text-violet-400">
                  El motor de Supabase despachará automáticamente los mensajes en el horario elegido.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de Disparo Masivo con clearance inferior */}
          <div className="pt-2 space-y-2">
            {formato === 'imagen_texto' && !imagenUrl && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Agrega una imagen para continuar con el envío</p>
              </div>
            )}

            <button
              onClick={handleSendBroadcast}
              disabled={isSending || finalRecipients.length === 0 || !selectedCopy || (formato === 'imagen_texto' && !imagenUrl) || (timingMode === 'programado' && !fechaProgramada)}
              className={`w-full py-4 px-4 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-2xl transition-all active:scale-[0.98] ${
                isSending || finalRecipients.length === 0 || !selectedCopy || (formato === 'imagen_texto' && !imagenUrl) || (timingMode === 'programado' && !fechaProgramada)
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                  : timingMode === 'programado'
                    ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-violet-500/30 hover:brightness-110 ring-1 ring-violet-500/30'
                    : 'bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 text-white shadow-pink-500/30 hover:brightness-110 ring-1 ring-pink-500/30'
              }`}
            >
              {isSending
                ? <><RefreshCw className="h-5 w-5 animate-spin" />{timingMode === 'programado' ? 'Programando campaña...' : 'Despachando mensajes...'}</>
                : finalRecipients.length === 0
                  ? <><AlertCircle className="h-5 w-5" />Sin audiencia seleccionada</>
                  : timingMode === 'programado'
                    ? <><CalendarClock className="h-5 w-5" />Programar Envío para {finalRecipients.length} Clientes</>
                    : formato === 'imagen_texto'
                      ? <><Image className="h-5 w-5" />Enviar Imagen + Texto a {finalRecipients.length} clientes</>
                      : <><Send className="h-5 w-5" />Enviar Promo Ahora a {finalRecipients.length} Clientes</>
              }
            </button>
          </div>

          {/* Espaciador de seguridad para BottomNavBar móvil */}
          <div className="h-16" aria-hidden="true" />
        </div>
      )}

      {/* ════════════════════ TAB: CALENDARIO DE FECHAS CLAVE & FESTIVOS ════════════════════ */}
      {activeTab === 'calendario' && (() => {
        const currentCountryDates = KEY_DATES_BY_COUNTRY[selectedCountry] || KEY_DATES_BY_COUNTRY['PE'] || [];

        // Filtro por mes, categoría y búsqueda
        const filteredDates = currentCountryDates.filter(kd => {
          const monthStr = kd.date.split('-')[0];
          if (selectedMonthFilter !== 'todos' && monthStr !== selectedMonthFilter) return false;
          if (selectedCategoryFilter !== 'todas' && kd.category !== selectedCategoryFilter) return false;
          if (calendarSearchQuery.trim()) {
            const q = calendarSearchQuery.toLowerCase();
            return kd.name.toLowerCase().includes(q) || kd.description.toLowerCase().includes(q);
          }
          return true;
        });

        const monthNamesMap: Record<string, string> = {
          '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
          '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
          '09': 'Setiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
        };

        return (
          <div className="px-4 pt-4 pb-20 space-y-4 max-w-lg mx-auto">
            {/* Header / Hero del Calendario */}
            <div className={`p-4 rounded-3xl border shadow-2xl space-y-3 ${
              isDark ? 'bg-gradient-to-br from-[#131024] via-[#0f1422] to-[#181126] border-violet-500/30' : 'bg-gradient-to-br from-violet-50 via-white to-pink-50 border-violet-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📅</span>
                  <div>
                    <h2 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Calendario Comercial & Festivos
                    </h2>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Planifica tus campañas de WhatsApp según el calendario oficial del país
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-pink-500 bg-pink-500/10 px-2.5 py-1 rounded-xl border border-pink-500/30">
                  {currentCountryDates.length} festivos
                </span>
              </div>

              {/* Selector de País (Banderas) */}
              <div className="pt-1">
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Selecciona País:
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide snap-x">
                  {(Object.keys(SUPPORTED_COUNTRIES) as CountryCode[]).map(code => {
                    const country = SUPPORTED_COUNTRIES[code];
                    const isSelected = selectedCountry === code;
                    return (
                      <button
                        key={code}
                        onClick={() => setSelectedCountry(code)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 snap-start active:scale-95 ${
                          isSelected
                            ? 'bg-gradient-to-r from-pink-500 to-violet-600 text-white border-transparent shadow-md'
                            : isDark ? 'bg-white/5 border-white/8 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{country.flag}</span>
                        <span>{country.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Buscador de Festividades */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={calendarSearchQuery}
                  onChange={e => setCalendarSearchQuery(e.target.value)}
                  placeholder="Buscar festividad (ej. Madre, San Valentín, Pisco Sour...)"
                  className={`w-full text-xs pl-8 pr-3 py-2 rounded-xl border outline-none ${
                    isDark ? 'bg-black/30 border-white/10 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>

            {/* Carrusel de Filtro por Meses */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedMonthFilter('todos')}
                className={`text-[10px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap border transition-all ${
                  selectedMonthFilter === 'todos'
                    ? 'bg-pink-500 text-white border-transparent shadow-sm'
                    : isDark ? 'bg-white/5 border-white/8 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                🌟 Todo el Año
              </button>
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMonthFilter(m)}
                  className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl whitespace-nowrap border transition-all ${
                    selectedMonthFilter === m
                      ? 'bg-pink-500 text-white border-transparent shadow-sm'
                      : isDark ? 'bg-white/5 border-white/8 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {monthNamesMap[m]}
                </button>
              ))}
            </div>

            {/* Filtro por Tipo (Comercial, Feriado, Cultural) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { id: 'todas', label: 'Todas las categorías' },
                { id: 'commercial', label: '🛍️ Comercial / Promos' },
                { id: 'holiday', label: '🌴 Feriados / Relax' },
                { id: 'cultural', label: '🎉 Eventos Culturales' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(cat.id)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-violet-600 text-white shadow-sm'
                      : isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Lista de Tarjetas de Festividades */}
            <div className="space-y-3">
              {filteredDates.length === 0 ? (
                <div className={`p-6 rounded-2xl border text-center ${
                  isDark ? 'bg-black/20 border-white/5 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50 text-pink-500" />
                  <p className="text-xs font-bold">No hay festividades registradas con estos filtros</p>
                  <p className="text-[10px] mt-0.5">Prueba seleccionando otro mes o borrando la búsqueda.</p>
                </div>
              ) : (
                filteredDates.map(kd => {
                  const [m, d] = kd.date.split('-');
                  const monthName = monthNamesMap[m] || m;
                  const isCommercial = kd.category === 'commercial';
                  const isHoliday = kd.category === 'holiday';

                  return (
                    <div
                      key={kd.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden space-y-3 ${
                        isDark ? 'bg-[#0f1422] border-white/10 hover:border-violet-500/40' : 'bg-white border-slate-200 shadow-sm hover:border-violet-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {/* Badge de Fecha */}
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white flex flex-col items-center justify-center font-black shadow-md shrink-0">
                            <span className="text-[10px] uppercase leading-none opacity-90">{monthName.slice(0, 3)}</span>
                            <span className="text-base leading-none mt-0.5">{d}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {kd.name}
                              </h3>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                isCommercial
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : isHoliday
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                              }`}>
                                {isCommercial ? '🛍️ Comercial' : isHoliday ? '🌴 Feriado' : '🎉 Cultural'}
                              </span>
                            </div>
                            <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {kd.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ideas de Contenido / Copys sugeridos */}
                      {kd.contentIdeas && kd.contentIdeas.length > 0 && (
                        <div className={`p-2.5 rounded-xl border space-y-1.5 text-[11px] ${
                          isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-pink-500 flex items-center gap-1">
                            💡 Ideas de Campaña Sugeridas:
                          </p>
                          {kd.contentIdeas.map((idea, i) => (
                            <div key={idea.id || i} className="flex items-start gap-1.5">
                              <span className="text-xs">✨</span>
                              <div className="flex-1 min-w-0">
                                <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{idea.title}: </span>
                                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{idea.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Botón de Acción 1-Click */}
                      <button
                        onClick={() => handleUseKeyDateInBroadcast(kd)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Lanzar Campaña de WhatsApp para {kd.name}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ════════════════════ TAB 2: ROI & RESULTADOS BI (100% REAL) ════════════════════ */}
      {activeTab === 'roi' && (
        <div className="px-4 pt-4 pb-12 space-y-4 max-w-lg mx-auto">
          {/* ── 1. Hero Card: Impacto Económico Real ── */}
          <div className={`p-4 rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300 ${
            isDark
              ? 'bg-gradient-to-br from-violet-950/60 via-[#0d111e] to-pink-950/40 border-violet-500/30'
              : 'bg-gradient-to-br from-violet-50 via-white to-pink-50 border-violet-200 shadow-violet-100'
          }`}>
            {/* Selector de Rango Temporal Rápido */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-black/5 dark:border-white/10">
              <div className={`flex items-center gap-1 p-1 rounded-2xl border transition-all ${
                isDark 
                  ? 'bg-black/40 border-white/10 shadow-inner' 
                  : 'bg-white/90 border-violet-100 shadow-sm backdrop-blur-sm'
              }`}>
                {[
                  { id: 'hoy', label: '✨ Hoy' },
                  { id: '7dias', label: '🗓️ 7 Días' },
                  { id: 'mes', label: '📅 Mes' },
                  { id: 'todo', label: '♾️ Todo' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setRoiTimeRange(tab.id as any);
                      fetchRoiData(tab.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                      roiTimeRange === tab.id
                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-500/25'
                        : isDark 
                          ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-violet-50/60'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchRoiData()}
                disabled={loadingRoi}
                className={`h-9 w-9 rounded-2xl border flex items-center justify-center transition-all active:scale-95 shrink-0 ${
                  isDark 
                    ? 'bg-violet-500/20 border-violet-500/30 text-violet-400 hover:bg-violet-500/30' 
                    : 'bg-violet-100 border-violet-200 text-violet-700 hover:bg-violet-200 shadow-sm'
                }`}
                title="Actualizar datos"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRoi ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">
                    Facturación Real Atribuida
                  </p>
                </div>
                {loadingRoi ? (
                  <div className="h-9 w-36 rounded-xl bg-white/10 animate-pulse my-1" />
                ) : (
                  <p className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    S/. {fmt(roiStats?.ingresos_totales || roiStats?.ingresos_rescatados || 0)}
                  </p>
                )}
                <p className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {loadingRoi ? 'Calculando...' : `${roiStats?.citas_totales || 0} citas concretadas • ${roiStats?.mensajes_enviados_mes || 0} mensajes enviados`}
                </p>
              </div>
            </div>

            {/* Quick KPI Bar Mobile (4 Bloques) */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10">
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/80 border-slate-200'}`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-pink-400">💅 Retoques Activos</p>
                <p className="text-base font-black text-pink-400 mt-0.5">
                  {loadingRoi ? '—' : `${roiStats?.retoques?.enviados || 0} avisos`}
                </p>
                <p className="text-[9px] text-slate-500">
                  {roiStats?.retoques?.respondidos || 0} respondieron ({roiStats?.retoques?.agendados || 0} citas)
                </p>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/80 border-slate-200'}`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">🛡️ No-Shows Evitados</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  {loadingRoi ? '—' : `${roiStats?.no_shows?.citas_salvadas || 0} citas`}
                </p>
                <p className="text-[9px] text-slate-500">S/. {fmt(roiStats?.no_shows?.dinero_protegido || 0)} asegurados</p>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/80 border-slate-200'}`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-violet-400">📢 Envíos Masivos</p>
                <p className="text-base font-black text-violet-400 mt-0.5">
                  {loadingRoi ? '—' : `${campaignStats.length} campañas`}
                </p>
                <p className="text-[9px] text-slate-500">
                  {campaignStats.reduce((acc, c) => acc + (c.citas_generadas || 0), 0)} citas ganadas
                </p>
              </div>

              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white/80 border-slate-200'}`}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400">⭐ CSAT Feedback</p>
                <p className="text-base font-black text-amber-400 mt-0.5">
                  {loadingRoi ? '—' : `${roiStats?.fidelizacion?.promedio_csat || 5.0}★`}
                </p>
                <p className="text-[9px] text-slate-500">
                  {roiStats?.fidelizacion?.positivos || 0} promotoras
                </p>
              </div>
            </div>
          </div>

          {/* ── 2. Selector de Sub-Pills Mobile-First ── */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
            {[
              { id: 'todos', label: '✨ Todos' },
              { id: 'retoques', label: `💅 Retoques (${roiStats?.retoques?.enviados || 0})` },
              { id: 'noshows', label: `⏰ No-Shows (${roiStats?.no_shows?.citas_salvadas || 0})` },
              { id: 'rescates', label: `🫀 Rescates (${roiStats?.rescate?.enviados || 0})` },
              { id: 'fidelizacion', label: `⭐ Feedback (${roiStats?.fidelizacion?.promedio_csat || 5}★)` },
              { id: 'cuidados', label: `🌸 Cuidados Post` },
              { id: 'masivos', label: `📢 Envíos Masivos (${campaignStats.length})` },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setRoiActiveFilter(pill.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all active:scale-95 border shrink-0 ${
                  roiActiveFilter === pill.id
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white border-violet-500 shadow-md shadow-violet-600/30'
                    : isDark
                      ? 'bg-[#0f1422] text-slate-400 border-white/8 hover:text-white hover:bg-white/5'
                      : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* ── 3. CARD 1: Recordatorios de Retoque & Mantenimiento ── */}
          {(roiActiveFilter === 'todos' || roiActiveFilter === 'retoques') && (
            <div className={`p-4 rounded-2xl border shadow-xl space-y-3 ${
              isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Recordatorio de Retoque / Mantenimiento
                    </p>
                    <p className="text-[10px] text-slate-500">Uñas, pestañas, alisados y servicios recurrentes</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  Piloto 24/7
                </span>
              </div>

              {/* Funnel Retoque */}
              <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Enviados</p>
                  <p className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {roiStats?.retoques?.enviados || 0}
                  </p>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Respondieron</p>
                  <p className="text-base font-black text-violet-400">
                    {roiStats?.retoques?.respondidos || 0}
                  </p>
                  <p className="text-[9px] text-violet-400/80">
                    {roiStats?.retoques?.enviados ? Math.round(((roiStats.retoques.respondidos || 0) / roiStats.retoques.enviados) * 100) : 0}% tasa
                  </p>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Citas Nuevas</p>
                  <p className="text-base font-black text-emerald-400">
                    {roiStats?.retoques?.agendados || 0}
                  </p>
                  <p className="text-[9px] text-emerald-400/80">
                    S/. {fmt(roiStats?.retoques?.ingresos || 0)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 4. CARD 2: Prevención de No-Shows (24h & 3h) ── */}
          {(roiActiveFilter === 'todos' || roiActiveFilter === 'noshows') && (
            <div className={`p-4 rounded-2xl border shadow-xl space-y-3 ${
              isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Prevención de No-Shows (24h y 3h Antes)
                    </p>
                    <p className="text-[10px] text-slate-500">Puntualidad y confirmación interactiva</p>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Protección
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Citas Asistidas</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">
                    {roiStats?.no_shows?.citas_salvadas || 0}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Con recordatorio activo</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase">Dinero Protegido</p>
                  <p className="text-xl font-black text-emerald-400 mt-0.5">
                    S/. {fmt(roiStats?.no_shows?.dinero_protegido || 0)}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Facturación asegurada</p>
                </div>
              </div>
            </div>
          )}

          {/* ── 5. CARD 3: Fidelización & CSAT Post-Cita ── */}
          {(roiActiveFilter === 'todos' || roiActiveFilter === 'fidelizacion') && (
            <div className={`p-4 rounded-2xl border shadow-xl space-y-3 ${
              isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Star className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Fidelización & Encuestas Post-Cita
                    </p>
                    <p className="text-[10px] text-slate-500">Puntuación real capturada en WhatsApp</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 text-[11px] font-black">
                  ⭐ {roiStats?.fidelizacion?.promedio_csat || 5.0} / 5.0
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Encuestas</p>
                  <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {roiStats?.fidelizacion?.enviados || 0}
                  </p>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] font-bold text-emerald-400 uppercase">Promotoras 👑</p>
                  <p className="text-sm font-black text-emerald-400">
                    {roiStats?.fidelizacion?.positivos || 0}
                  </p>
                </div>
                <div className={`p-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-[9px] font-bold text-rose-400 uppercase">Alertas Quejas</p>
                  <p className="text-sm font-black text-rose-400">
                    {roiStats?.fidelizacion?.detractores || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 6. CARD 4: Envíos Masivos (por Card de Audiencia) ── */}
          {(roiActiveFilter === 'todos' || roiActiveFilter === 'masivos') && (
            <div className={`p-4 rounded-2xl border shadow-xl space-y-3 ${
              isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Envíos Masivos por Audiencia
                    </p>
                    <p className="text-[10px] text-slate-500">Campañas enviadas desde el Marketplace</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-violet-400">
                  {campaignStats.length} campañas
                </span>
              </div>

              {campaignStats.length === 0 ? (
                <div className="text-center py-5 text-slate-500">
                  <Zap className="h-6 w-6 mx-auto mb-1 opacity-50 text-slate-400" />
                  <p className="text-xs font-bold">Sin campañas masivas en este período</p>
                  <p className="text-[10px] text-slate-500">Lanza un envío desde la pestaña "Envíos" para medir conversiones</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {campaignStats.map((camp: any) => {
                    const total = camp.enviados || 1;
                    const resp = camp.respuestas || 0;
                    const pos = camp.positivas || 0;
                    const ind = camp.indecisas || 0;
                    const neg = camp.negativas || 0;
                    const sinResp = Math.max(0, total - resp);

                    const pctResp = Math.round((resp / total) * 100);
                    const pctPos = Math.round((pos / total) * 100);
                    const pctInd = Math.round((ind / total) * 100);
                    const pctNeg = Math.round((neg / total) * 100);
                    const pctSinResp = Math.round((sinResp / total) * 100);

                    return (
                      <div key={camp.id} className={`p-3 rounded-xl border space-y-2 ${
                        isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{camp.titulo || 'Campaña'}</p>
                            <p className="text-[10px] text-slate-500">
                              🎯 Segmento: <span className="text-pink-400 font-semibold">{camp.segmento || 'Audiencia'}</span> • {new Date(camp.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {camp.enviados} enviados
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 text-center">
                          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Respuesta</p>
                            <p className="text-xs font-black text-violet-400">{pctResp}%</p>
                          </div>
                          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Agendar 👑</p>
                            <p className="text-xs font-black text-emerald-400">{pctPos}%</p>
                          </div>
                          <div className={`p-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                            <p className="text-[8px] text-slate-400 font-bold uppercase">Dudas 💬</p>
                            <p className="text-xs font-black text-amber-400">{pctInd}%</p>
                          </div>
                        </div>

                        {/* Espaciador de seguridad para BottomNavBar móvil */}
                        <div className="h-16" aria-hidden="true" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── 7. FEED EN VIVO: "Nilah en Acción" (Filtrado estricto por categoría) ── */}
          {(() => {
            const rawEvents = roiStats?.ultimos_eventos || [];
            const filteredEvents = rawEvents.filter((ev: any) => {
              const orig = (ev.flujo_origen || '').toLowerCase();
              if (roiActiveFilter === 'todos') return true;
              if (roiActiveFilter === 'retoques') return orig === 'retoque' || orig.includes('retoque');
              if (roiActiveFilter === 'noshows') return ['recordatorio_24h', 'recordatorio_3h', 'no_show'].includes(orig) || orig.includes('recordatorio');
              if (roiActiveFilter === 'rescates') return orig.includes('rescate');
              if (roiActiveFilter === 'fidelizacion') return orig === 'fidelizacion' || orig.includes('fidelizacion') || orig.includes('encuesta');
              if (roiActiveFilter === 'cuidados') return orig.includes('cuidados');
              if (roiActiveFilter === 'masivos') return ['campana', 'envio_masivo', 'audiencia'].includes(orig);
              return true;
            });

            return (
              <div className={`p-4 rounded-3xl border shadow-xl space-y-3.5 transition-all ${
                isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <p className={`text-xs font-black uppercase tracking-widest ${
                      isDark ? 'text-violet-400' : 'text-violet-700'
                    }`}>
                      Nilah en Acción • Feed de Automatizaciones
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                    {filteredEvents.length} evento{filteredEvents.length === 1 ? '' : 's'}
                  </span>
                </div>

                {filteredEvents.length === 0 ? (
                  <div className={`p-8 rounded-2xl border text-center space-y-2 ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Sparkles className="h-7 w-7 mx-auto text-violet-400 opacity-80" />
                    <p className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Sin actividad reciente en esta categoría
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                      Tan pronto Nilah envíe mensajes de {
                        roiActiveFilter === 'noshows' ? 'recordatorios 24h/3h' :
                        roiActiveFilter === 'retoques' ? 'mantenimiento de servicios' :
                        roiActiveFilter === 'rescates' ? 'rescate de clientas ausentes' :
                        roiActiveFilter === 'cuidados' ? 'cuidados post-servicio' :
                        roiActiveFilter === 'fidelizacion' ? 'encuestas de satisfacción' : 'esta categoría'
                      }, los verás reflejados aquí en tiempo real.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredEvents.slice(0, 15).map((ev: any) => {
                      const isCooldown = ev.estado === 'bloqueado_cooldown';
                      const isError = ev.estado === 'error';
                      const isSimulacion = ev.es_simulacion || ev.estado === 'simulacion';

                      return (
                        <div
                          key={ev.id}
                          onClick={() => setInspectingEvent(ev)}
                          className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all cursor-pointer active:scale-98 ${
                            isDark
                              ? 'bg-black/40 border-white/8 hover:border-violet-500/50 hover:bg-white/5'
                              : 'bg-slate-50/80 border-slate-200/90 hover:border-violet-300 hover:bg-violet-50/30 shadow-2xs'
                          }`}
                        >
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {ev.cliente_nombre || 'Clienta'}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${
                                (ev.flujo_origen || '').includes('rescate')
                                  ? (isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-100 text-amber-800 border border-amber-200')
                                  : (ev.flujo_origen || '').includes('cuidados')
                                    ? (isDark ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-teal-100 text-teal-800 border border-teal-200')
                                    : (ev.flujo_origen || '').includes('retoque')
                                      ? (isDark ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-pink-100 text-pink-700 border border-pink-200')
                                      : (isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200')
                              }`}>
                                {ev.flujo_origen || 'Robot'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                              {isCooldown && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                  🛡️ Cooldown
                                </span>
                              )}
                              {isError && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                  ⚠️ Error
                                </span>
                              )}
                              {isSimulacion && (
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                  🧪 Test
                                </span>
                              )}
                              <span className={`text-[10px] font-mono font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {new Date(ev.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            "{ev.mensaje_preview || ev.mensaje_completo || 'Mensaje de automatización enviado'}"
                          </p>

                          {ev.respondio && (
                            <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                              isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'
                            }`}>
                              <CheckCheck className={`h-4 w-4 shrink-0 mt-0.5 ${
                                isDark ? 'text-emerald-400' : 'text-emerald-600'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-bold ${
                                  isDark ? 'text-emerald-400' : 'text-emerald-800'
                                }`}>
                                  Respondió: <span className={`font-medium ${
                                    isDark ? 'text-emerald-300' : 'text-emerald-700'
                                  }`}>"{ev.respuesta_texto || 'Confirmación / Respuesta positiva'}"</span>
                                </p>
                                {ev.agendo_cita && (
                                  <div className={`mt-1.5 flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg inline-flex ${
                                    isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-600 text-white shadow-xs'
                                  }`}>
                                    <span>👑 ¡CITA AGENDADA! {ev.servicio_agendado ? `— ${ev.servicio_agendado}` : ''} (+ S/. {fmt(ev.precio_agendado || 0)})</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 text-[10px] text-slate-400 font-medium">
                            <span>Toca para ver el mensaje completo</span>
                            <span className="text-violet-500 font-bold">Ver detalle →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Modal BottomSheet para inspeccionar el mensaje que recibió la clienta */}
          {inspectingEvent && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-3 animate-fade-in" onClick={() => setInspectingEvent(null)}>
              <div className={`rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl border ${
                isDark ? 'bg-[#0f1422] border-white/15 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-white/10">
                  <div>
                    <h3 className="text-sm font-black tracking-tight">
                      Detalle del Envío a {inspectingEvent.cliente_nombre || 'Clienta'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {new Date(inspectingEvent.created_at).toLocaleString('es-PE')}
                    </p>
                  </div>
                  <button onClick={() => setInspectingEvent(null)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Flujo</p>
                    <p className="font-black truncate">{inspectingEvent.flujo_origen || 'Automatización'}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Estado</p>
                    <p className="font-black text-emerald-500 uppercase">{inspectingEvent.estado || 'Enviado'}</p>
                  </div>
                </div>

                {/* Burbuja estilo WhatsApp con el mensaje exacto */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Mensaje WhatsApp Enviado:
                  </p>
                  <div className="bg-[#0b141a] rounded-2xl p-3.5 text-white shadow-inner">
                    <div className="bg-[#005c4b] text-white p-3 rounded-xl rounded-tr-none text-xs leading-relaxed max-w-sm ml-auto shadow-md">
                      <p className="whitespace-pre-wrap font-sans text-[11px]">
                        {inspectingEvent.mensaje_completo || inspectingEvent.mensaje_preview}
                      </p>
                      <div className="text-[9px] text-emerald-200/70 text-right mt-1.5 flex items-center justify-end gap-1">
                        <span>{new Date(inspectingEvent.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {inspectingEvent.razon_bloqueo && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 text-xs font-bold">
                    ⚠️ {inspectingEvent.razon_bloqueo}
                  </div>
                )}

                <button
                  onClick={() => setInspectingEvent(null)}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-all shadow-md shadow-violet-600/25 cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}

          {/* Espaciador de seguridad para BottomNavBar móvil */}
          <div className="h-16" aria-hidden="true" />
        </div>
      )}

      {/* ════════════════════ TAB 3: PILOTO AUTOMÁTICO ════════════════════ */}
      {activeTab === 'autopilot' && (
        <div className="px-4 pt-4 pb-20 space-y-4 max-w-lg mx-auto">
          <div className={`p-5 rounded-2xl border text-center space-y-2 ${
            isDark ? 'bg-gradient-to-br from-violet-950/30 to-[#0f1422] border-violet-500/20' : 'bg-gradient-to-br from-violet-50 to-white border-violet-200'
          }`}>
            <Bot className="h-9 w-9 text-violet-400 mx-auto" />
            <h2 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Piloto Automático 24/7</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Flujos desatendidos en n8n que protegen la agenda y la puntualidad sin intervención manual.
            </p>
          </div>

          {[
            {
              id: 'rec24h',
              title: '⏰ Recordatorio 24 Horas Antes',
              desc: 'Confirmación interactiva del turno el día previo para liberar huecos si cancelan.',
              impact: 'Reduce no-shows hasta un 40%',
              impactColor: 'text-emerald-400',
              active: true,
              icon: BellRing,
            },
            {
              id: 'rec3h',
              title: '🔔 Recordatorio 3 Horas Antes',
              desc: 'Mensaje con recordatorio final, ubicación y hora exacta.',
              impact: 'Mejora puntualidad +65%',
              impactColor: 'text-blue-400',
              active: true,
              icon: Clock,
            },
            {
              id: 'mant',
              title: '💅 Recordatorio de Retoque',
              desc: 'A los 20-25 días del servicio invita a renovar manicura o pestañas.',
              impact: 'Acelera ciclo de recompra',
              impactColor: 'text-pink-400',
              active: true,
              icon: Scissors,
            },
          ].map(flow => (
            <div key={flow.id} className={`p-4 rounded-2xl border shadow-xl ${
              isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-white/8' : 'bg-slate-100'}`}>
                    <flow.icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{flow.title}</p>
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{flow.desc}</p>
                    <p className={`text-[10px] font-bold mt-1 ${flow.impactColor}`}>📊 {flow.impact}</p>
                  </div>
                </div>
                <div className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-extrabold ${
                  flow.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'
                }`}>
                  {flow.active ? '● ACTIVO' : '○ INACTIVO'}
                </div>
              </div>
            </div>
          ))}

          <div className={`p-4 rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5`}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-400">¿Dónde se gestiona el Rescate Progresivo (45, 75 y 120 días)?</p>
                <p className="text-[10px] text-emerald-400/80 mt-1 leading-snug">
                  Ahora se ejecuta de forma 100% autónoma en el módulo <strong>"Automatizaciones" ➔ "Rescate de Inactivas"</strong> con cálculo de digitación humana y detección automática de opt-out (BAJA). En este módulo de Marketing puedes enfocarte en campañas comerciales y ofertas puntuales para tus clientas VIP, Nuevas y por Servicio. 🚀
                </p>
              </div>
            </div>
          </div>

          {/* Espaciador de seguridad para BottomNavBar móvil */}
          <div className="h-16" aria-hidden="true" />
        </div>
      )}

      {/* ════════════════════ TAB 4: BIBLIOTECA DE COPYS (SEGMENTADA PRO) ════════════════════ */}
      {activeTab === 'copys' && (
        <div className="px-4 pt-4 pb-20 space-y-4 max-w-lg mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Biblioteca de Copys</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mensajes activadores de 3 párrafos por audiencia</p>
            </div>
            <button
              onClick={() => {
                setEditingCopy({
                  titulo: '',
                  audiencia_target: selectedSegmento || 'todas',
                  contenido: `Las paredes de acá llevan días preguntando por ti. Francamente, yo también. 👀\n\n{nombre}, guardé un beneficio especial de {promocion} en tu próximo {ultimo_servicio} para consentirte como mereces. 💅\n\n¿Coordinamos esta semana? 😌\n\n{opt_out}`,
                  tipo_promocion: 'porcentaje',
                  valor_promocion: '15% OFF',
                  regalo_sugerido: ''
                });
                setIsEditorOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-md text-xs font-bold flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="h-4 w-4" />Crear Copy
            </button>
          </div>

          {/* Guía Visual Interactiva: Método Activador de 3 Párrafos */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-gradient-to-br from-violet-950/40 via-[#0f1422] to-[#12162a] border-violet-500/30' : 'bg-gradient-to-br from-violet-50 via-white to-pink-50 border-violet-200 shadow-sm'
          }`}>
            <div
              onClick={() => setShowMethodGuide(v => !v)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">🧠</span>
                <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  El Método Activador de 3 Párrafos
                </h3>
              </div>
              <span className="text-[10px] font-extrabold text-violet-400 hover:underline">
                {showMethodGuide ? 'Ocultar guía ▲' : 'Ver regla maestra ▼'}
              </span>
            </div>

            {showMethodGuide && (
              <div className="mt-3 pt-3 border-t dark:border-white/5 border-slate-200/80 space-y-2.5 text-[11px] leading-relaxed">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200'}`}>
                  <p className="font-bold text-pink-400">P1 — El Gancho (Para el scroll en &lt;2 seg):</p>
                  <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Observación o frase intrigante. <strong>Sin saludo "Hola", sin nombre, sin oferta directa.</strong>
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200'}`}>
                  <p className="font-bold text-violet-400">P2 — La Confidencia (El Privilegio):</p>
                  <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Empieza SIEMPRE con <strong>{`{nombre}`}</strong> al inicio. Comunica el beneficio como un privilegio personal, no como spam comercial.
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-black/30 border-white/5' : 'bg-white border-slate-200'}`}>
                  <p className="font-bold text-emerald-400">P3 — El Cierre Suave (Cero Fricción):</p>
                  <p className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Una sola pregunta tranquila (ej. <em>¿Coordinamos esta semana? 😌</em>). Sin fechas forzadas ni urgencia falsa.
                  </p>
                </div>
                <p className="text-[10px] text-amber-400 font-semibold pt-1">
                  🎯 Regla de Emojis: 4 a 5 emojis distribuidos individualmente a lo largo del texto (nunca agrupados juntos al final), con al menos una carita expresiva (👀 😌 😉 🥹 😏).
                </p>
              </div>
            )}
          </div>

          {/* Filtros de Copys por Audiencia / Categoría Dinámico Multitenant */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-black uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Filtrar por Audiencia:
              </p>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Desliza para ver más →
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-none snap-x -mx-4 px-4">
              <button
                onClick={() => setCopysCategoryFilter('todas')}
                className={`flex-shrink-0 snap-start px-3.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                  copysCategoryFilter === 'todas'
                    ? 'bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-pink-500/25 ring-2 ring-pink-500/30'
                    : isDark ? 'bg-white/5 border border-white/8 text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <span>🌟</span>
                <span>Todos los Copys</span>
              </button>
              {fullAudienceCatalog.filter(a => a.id !== 'todas').map(fil => (
                <button
                  key={fil.id}
                  onClick={() => setCopysCategoryFilter(fil.id)}
                  className={`flex-shrink-0 snap-start px-3.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                    copysCategoryFilter === fil.id
                      ? 'bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-pink-500/25 ring-2 ring-pink-500/30'
                      : isDark ? 'bg-white/5 border border-white/8 text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <span>{fil.emoji}</span>
                  <span>{fil.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Variables Disponibles Chips */}
          <div className={`p-3 rounded-2xl border ${
            isDark ? 'bg-[#0f1422] border-white/8' : 'bg-white border-slate-200'
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Variables dinámicas para tus copys:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'nombre', desc: 'Nombre de la clienta' },
                { key: 'dia_preferido', desc: 'Su día favorito de visita' },
                { key: 'ultimo_servicio', desc: 'Último servicio realizado' },
                { key: 'dias_sin_visita', desc: 'Días que lleva sin venir' },
                { key: 'promocion', desc: 'Valor de descuento/cupón' },
                { key: 'regalo', desc: 'Regalo sugerido' },
                { key: 'opt_out', desc: 'Leyenda legal Anti-Baneo WhatsApp' },
              ].map(v => (
                <span key={v.key} className="px-2 py-1 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30 text-[10px] font-mono cursor-default">
                  {`{${v.key}}`}
                </span>
              ))}
            </div>
          </div>

          {/* Lista de Copys de la Biblioteca */}
          <div className="space-y-3">
            {copys
              .filter(c => {
                if (copysCategoryFilter === 'todas') return true;
                return c.audiencia_target === copysCategoryFilter;
              })
              .map(c => {
                const targetAud = fullAudienceCatalog.find(a => a.id === c.audiencia_target);
                return (
                  <div key={c.id} className={`border rounded-2xl p-4 space-y-2 shadow-xl transition-colors duration-300 ${
                    isDark ? 'bg-[#0f1422] border-white/10' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.titulo}</h3>
                          {targetAud ? (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm ${targetAud.badgeSolidClass}`}>
                              {targetAud.emoji} {targetAud.label}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-400">
                              🌟 General
                            </span>
                          )}
                        </div>
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
                      onClick={() => {
                        setSelectedCopy(c);
                        if (c.audiencia_target && c.audiencia_target !== 'todas') {
                          setSelectedSegmento(c.audiencia_target);
                        }
                        setActiveTab('envios');
                      }}
                      className="w-full py-2 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 text-[11px] font-bold hover:bg-violet-500/20 transition-colors"
                    >
                      Usar este copy en Envío →
                    </button>
                  </div>
                );
              })}
          </div>

          {/* Espaciador de seguridad para BottomNavBar móvil */}
          <div className="h-16" aria-hidden="true" />
        </div>
      )}

      {/* ════════════════════ MODAL / DRAWER CATÁLOGO MARKETPLACE ════════════════════ */}
      <AnimatePresence>
        {isMarketplaceModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className={`w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border shadow-2xl flex flex-col max-h-[92vh] ${
                isDark ? 'bg-[#0d101d] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Header Modal */}
              <div className="p-4 border-b dark:border-white/5 border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center text-white shadow-md">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Marketplace de Audiencias</h3>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Selecciona una audiencia de alto impacto comercial
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMarketplaceModalOpen(false)}
                  className={`p-2 rounded-xl transition-all ${
                    isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Buscador & Filtros Categoría */}
              <div className="p-4 border-b dark:border-white/5 border-slate-100 space-y-3 shrink-0">
                <div className="relative">
                  <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input
                    type="text"
                    value={marketSearchQuery}
                    onChange={e => setMarketSearchQuery(e.target.value)}
                    placeholder="Buscar audiencia (ej. uñas, pestañas, rescate, cross, VIP)..."
                    className={`w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border outline-none ${
                      isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { id: 'todas' as AudienceCategory, label: 'Todas', emoji: '🌟' },
                    { id: 'servicios' as AudienceCategory, label: 'Por Servicio', emoji: '💅' },
                    { id: 'cruzadas' as AudienceCategory, label: 'Venta Cruzada', emoji: '⚡' },
                    { id: 'rescate' as AudienceCategory, label: 'Rescate', emoji: '🚨' },
                    { id: 'lealtad' as AudienceCategory, label: 'Lealtad & VIP', emoji: '👑' },
                    { id: 'prospectos' as AudienceCategory, label: 'Prospectos / Ads', emoji: '📣' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setMarketFilterCategory(cat.id)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                        marketFilterCategory === cat.id
                          ? 'bg-gradient-to-r from-pink-600 to-violet-600 text-white shadow-md'
                          : isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista Scrollable de Audiencias */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {audienciasFiltradas.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-slate-400">No se encontraron audiencias</p>
                  </div>
                ) : (
                  audienciasFiltradas.map(seg => {
                    const isCurrent = selectedSegmento === seg.id;
                    return (
                      <div
                        key={seg.id}
                        onClick={() => {
                          setSelectedSegmento(seg.id);
                          setIsMarketplaceModalOpen(false);
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative active:scale-[0.99] ${
                          isCurrent
                            ? `${isDark ? seg.activeBgDark : seg.activeBgLight} ring-2 ring-violet-500 shadow-lg`
                            : isDark ? 'bg-white/3 border-white/8 hover:bg-white/8' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${seg.gradient} flex items-center justify-center text-2xl shadow-md shrink-0 text-white`}>
                              {seg.emoji}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {seg.label}
                                </h4>
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm ${seg.badgeSolidClass}`}>
                                  {seg.badgeTag}
                                </span>
                              </div>
                              <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {seg.sublabel}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Contador sincronizado */}
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-pink-500/10 dark:bg-pink-500/20 text-pink-500 border border-pink-500/30">
                              {loadingCounts ? '...' : `${audienceCounts[seg.id] ?? 0} contactos`}
                            </span>

                            {isCurrent ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">
                                ✓ ACTIVA
                              </span>
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2.5 border-t dark:border-white/5 border-slate-100 flex items-center justify-between text-[10px]">
                          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            🎯 {seg.cta}
                          </span>
                          <span className="text-[10px] shrink-0 font-bold ml-2">
                            ROI: {seg.roiPotential}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Modal */}
              <div className="p-3 border-t dark:border-white/5 border-slate-100 text-center shrink-0">
                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Toca cualquier audiencia para seleccionarla y configurar su envío
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL EDITOR COPY (CON SELECTOR DE AUDIENCIA) ── */}
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
                <h3 className={`text-sm font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Sparkles className="h-4 w-4 text-pink-500" />
                  {editingCopy.id ? 'Editar Copy Activador' : 'Crear Nuevo Copy Activador'}
                </h3>
                <button onClick={() => setIsEditorOpen(false)} className={`text-xs px-2 py-1 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleSaveCopy} className="space-y-3.5">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Título del Copy:</label>
                  <input
                    type="text" required placeholder="Ej. 🚨 Rescate 60d — Las Paredes Preguntan"
                    value={editingCopy.titulo || ''}
                    onChange={e => setEditingCopy({ ...editingCopy, titulo: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#161c2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>

                {/* Selector de Audiencia Objetivo Dinámico */}
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Audiencia Objetivo (Segmento Recomendado):
                  </label>
                  <select
                    value={editingCopy.audiencia_target || 'todas'}
                    onChange={e => setEditingCopy({ ...editingCopy, audiencia_target: e.target.value })}
                    className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-pink-500 ${
                      isDark ? 'bg-[#161c2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="todas">🌟 Toda la Base de Datos (General)</option>
                    {['rescate', 'servicios', 'cruzadas', 'lealtad', 'prospectos'].map(catKey => {
                      const audsInCat = fullAudienceCatalog.filter(a => a.category === catKey && a.id !== 'todas');
                      if (audsInCat.length === 0) return null;
                      const catName = catKey === 'rescate' ? '🚨 Rescate & Abandono' :
                                      catKey === 'servicios' ? '💅 Por Servicio Específico' :
                                      catKey === 'cruzadas' ? '⚡ Venta Cruzada (Cross-Selling)' :
                                      catKey === 'lealtad' ? '👑 Lealtad & VIP' : '📣 Prospectos & Especiales';
                      return (
                        <optgroup key={catKey} label={catName}>
                          {audsInCat.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.emoji} {a.label}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Descuento / Beneficio:</label>
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
                      type="text" placeholder="Ej. Exfoliación Spa"
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
                    {['nombre', 'dia_preferido', 'ultimo_servicio', 'dias_sin_visita', 'promocion', 'regalo', 'opt_out'].map(v => (
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
                  <div className="flex justify-between items-center mb-1">
                    <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Cuerpo del Mensaje (3 Párrafos Activadores):
                    </label>
                  </div>
                  <textarea
                    rows={6} required
                    value={editingCopy.contenido || ''}
                    onChange={e => setEditingCopy({ ...editingCopy, contenido: e.target.value })}
                    className={`w-full border rounded-xl p-3 text-xs focus:outline-none focus:border-pink-500 resize-none font-sans leading-relaxed ${
                      isDark ? 'bg-[#161c2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    💡 P1: Gancho sin saludo | P2: Confidencia con {`{nombre}`} | P3: Cierre suave sin presión.
                  </p>
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

export default Marketing;
