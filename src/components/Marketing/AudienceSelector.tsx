/**
 * AudienceSelector
 * ─────────────────────────────────────────────────────────────────────────────
 * Componente premium de selección de audiencias para campaña semanal.
 * Obtiene audiencias de Supabase via `get_smart_audiences` y las muestra
 * como tarjetas interactivas en dos capas:
 *   1. CRM         — basadas en comportamiento histórico (Clientes)
 *   2. Marketing   — oportunidades detectadas por Nilah IA
 *
 * Las audiencias bloqueadas muestran un candado con el mensaje de cuándo
 * se desbloquean, creando una gamificación de "negocio que crece".
 * Compatible con light y dark mode.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, Sparkles, Users, TrendingUp, Crown, Star,
  Heart, AlertCircle, RefreshCw, ChevronRight, Check,
  Gift, Filter
} from 'lucide-react';
import { campaigns } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SmartAudience {
  id: string;
  capa: 'crm' | 'marketing' | 'servicios';
  nombre: string;
  descripcion: string;
  icono: string;
  color: AudienceColor;
  count: number;
  desbloqueado: boolean;
  requiere_meses?: number;
  condicion_desbloqueo?: string;
  insight?: string;
  roi_tip?: string;
  estrategia?: string;
}

interface AudienciasData {
  business_age_months: number;
  fase: 'semilla' | 'crecimiento' | 'autoridad';
  total_clientes: number;
  crm: SmartAudience[];
  crm_extra?: SmartAudience[];
  marketing: SmartAudience[];
  servicios?: SmartAudience[];
}

type AudienceColor = 'blue' | 'emerald' | 'pink' | 'amber' | 'rose' | 'green' | 'violet' | 'purple';

interface AudienceSelectorProps {
  /** Called when user confirms an audience selection */
  onSelect: (audience: SmartAudience) => void;
  /** Currently selected audience id (controlled) */
  selectedId?: string;
  /** If true, renders in compact/chip mode instead of full cards */
  compact?: boolean;
  /**
   * When true (default), only shows segments with count > 0 AND desbloqueado.
   * Set to false in the marketplace to show all segments including empty/locked.
   */
  onlyWithClients?: boolean;
}

// ─── Color Maps (Light + Dark adaptive) ──────────────────────────────────────

const COLOR_MAP: Record<AudienceColor, {
  cardBg: string;
  cardBorder: string;
  cardSelected: string;
  cardGlow: string;
  hover: string;
  iconBg: string;
  text: string;
  subtext: string;
  badge: string;
  badgeText: string;
  glow: string;
}> = {
  blue: {
    cardBg: 'bg-white dark:bg-blue-950/30',
    cardBorder: 'border-blue-200 dark:border-blue-800/50',
    cardSelected: 'bg-blue-50 dark:bg-blue-900/40 border-blue-400 dark:border-blue-500 ring-2 ring-blue-400/30 dark:ring-blue-500/30',
    cardGlow: 'bg-gradient-to-br from-blue-100/60 via-transparent to-transparent dark:from-blue-500/10 dark:via-transparent',
    hover: 'hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/20',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    subtext: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30',
    badgeText: 'text-blue-700 dark:text-blue-200',
    glow: 'shadow-blue-500/20',
  },
  emerald: {
    cardBg: 'bg-white dark:bg-emerald-950/30',
    cardBorder: 'border-emerald-200 dark:border-emerald-800/50',
    cardSelected: 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-500 ring-2 ring-emerald-400/30 dark:ring-emerald-500/30',
    cardGlow: 'bg-gradient-to-br from-emerald-100/60 via-transparent to-transparent dark:from-emerald-500/10 dark:via-transparent',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    subtext: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30',
    badgeText: 'text-emerald-700 dark:text-emerald-200',
    glow: 'shadow-emerald-500/20',
  },
  pink: {
    cardBg: 'bg-white dark:bg-pink-950/30',
    cardBorder: 'border-pink-200 dark:border-pink-800/50',
    cardSelected: 'bg-pink-50 dark:bg-pink-900/40 border-pink-400 dark:border-pink-500 ring-2 ring-pink-400/30 dark:ring-pink-500/30',
    cardGlow: 'bg-gradient-to-br from-pink-100/60 via-transparent to-transparent dark:from-pink-500/10 dark:via-transparent',
    hover: 'hover:border-pink-300 dark:hover:border-pink-600 hover:bg-pink-50/80 dark:hover:bg-pink-900/20',
    iconBg: 'bg-pink-100 dark:bg-pink-500/20',
    text: 'text-pink-700 dark:text-pink-300',
    subtext: 'text-pink-600 dark:text-pink-400',
    badge: 'bg-pink-100 dark:bg-pink-500/20 border-pink-200 dark:border-pink-500/30',
    badgeText: 'text-pink-700 dark:text-pink-200',
    glow: 'shadow-pink-500/20',
  },
  amber: {
    cardBg: 'bg-white dark:bg-amber-950/30',
    cardBorder: 'border-amber-200 dark:border-amber-800/50',
    cardSelected: 'bg-amber-50 dark:bg-amber-900/40 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/30 dark:ring-amber-500/30',
    cardGlow: 'bg-gradient-to-br from-amber-100/60 via-transparent to-transparent dark:from-amber-500/10 dark:via-transparent',
    hover: 'hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/80 dark:hover:bg-amber-900/20',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    subtext: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30',
    badgeText: 'text-amber-700 dark:text-amber-200',
    glow: 'shadow-amber-500/20',
  },
  rose: {
    cardBg: 'bg-white dark:bg-rose-950/30',
    cardBorder: 'border-rose-200 dark:border-rose-800/50',
    cardSelected: 'bg-rose-50 dark:bg-rose-900/40 border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/30 dark:ring-rose-500/30',
    cardGlow: 'bg-gradient-to-br from-rose-100/60 via-transparent to-transparent dark:from-rose-500/10 dark:via-transparent',
    hover: 'hover:border-rose-300 dark:hover:border-rose-600 hover:bg-rose-50/80 dark:hover:bg-rose-900/20',
    iconBg: 'bg-rose-100 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-300',
    subtext: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 dark:bg-rose-500/20 border-rose-200 dark:border-rose-500/30',
    badgeText: 'text-rose-700 dark:text-rose-200',
    glow: 'shadow-rose-500/20',
  },
  green: {
    cardBg: 'bg-white dark:bg-green-950/30',
    cardBorder: 'border-green-200 dark:border-green-800/50',
    cardSelected: 'bg-green-50 dark:bg-green-900/40 border-green-400 dark:border-green-500 ring-2 ring-green-400/30 dark:ring-green-500/30',
    cardGlow: 'bg-gradient-to-br from-green-100/60 via-transparent to-transparent dark:from-green-500/10 dark:via-transparent',
    hover: 'hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50/80 dark:hover:bg-green-900/20',
    iconBg: 'bg-green-100 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    subtext: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 dark:bg-green-500/20 border-green-200 dark:border-green-500/30',
    badgeText: 'text-green-700 dark:text-green-200',
    glow: 'shadow-green-500/20',
  },
  violet: {
    cardBg: 'bg-white dark:bg-violet-950/30',
    cardBorder: 'border-violet-200 dark:border-violet-800/50',
    cardSelected: 'bg-violet-50 dark:bg-violet-900/40 border-violet-400 dark:border-violet-500 ring-2 ring-violet-400/30 dark:ring-violet-500/30',
    cardGlow: 'bg-gradient-to-br from-violet-100/60 via-transparent to-transparent dark:from-violet-500/10 dark:via-transparent',
    hover: 'hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/80 dark:hover:bg-violet-900/20',
    iconBg: 'bg-violet-100 dark:bg-violet-500/20',
    text: 'text-violet-700 dark:text-violet-300',
    subtext: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30',
    badgeText: 'text-violet-700 dark:text-violet-200',
    glow: 'shadow-violet-500/20',
  },
  purple: {
    cardBg: 'bg-white dark:bg-purple-950/30',
    cardBorder: 'border-purple-200 dark:border-purple-800/50',
    cardSelected: 'bg-purple-50 dark:bg-purple-900/40 border-purple-400 dark:border-purple-500 ring-2 ring-purple-400/30 dark:ring-purple-500/30',
    cardGlow: 'bg-gradient-to-br from-purple-100/60 via-transparent to-transparent dark:from-purple-500/10 dark:via-transparent',
    hover: 'hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50/80 dark:hover:bg-purple-900/20',
    iconBg: 'bg-purple-100 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    subtext: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-100 dark:bg-purple-500/20 border-purple-200 dark:border-purple-500/30',
    badgeText: 'text-purple-700 dark:text-purple-200',
    glow: 'shadow-purple-500/20',
  },
};

// ─── Phase Badge ──────────────────────────────────────────────────────────────

const PHASE_CONFIG = {
  semilla:     { label: 'Salón Semilla 🌱',   color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
  crecimiento: { label: 'En Crecimiento 🚀',  color: 'text-blue-700 dark:text-blue-400',      bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  autoridad:   { label: 'Salón Autoridad 👑', color: 'text-violet-700 dark:text-violet-400',  bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20' },
};

// ─── Audience Card ────────────────────────────────────────────────────────────

interface AudienceCardProps {
  audience: SmartAudience;
  isSelected: boolean;
  onSelect: () => void;
}

const AudienceCard: React.FC<AudienceCardProps> = ({ audience, isSelected, onSelect }) => {
  const colors = COLOR_MAP[audience.color] || COLOR_MAP.blue;
  const isLocked = !audience.desbloqueado;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={isLocked ? {} : { scale: 0.98 }}
      onClick={() => !isLocked && onSelect()}
      disabled={isLocked}
      className={`
        group relative w-full flex rounded-2xl border text-left transition-all duration-200 ease-out overflow-hidden shadow-sm
        ${isLocked
          ? 'cursor-not-allowed opacity-40 grayscale border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/2'
          : isSelected
            ? `${colors.cardSelected} shadow-md ${colors.glow}`
            : `${colors.cardBg} ${colors.cardBorder} ${colors.hover} hover:shadow-md`
        }
      `}
    >
      {/* Subtle background glow */}
      {!isLocked && (
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${colors.cardGlow}`} />
      )}
      {isSelected && !isLocked && (
        <div className={`absolute inset-0 ${colors.cardGlow} opacity-60 pointer-events-none`} />
      )}

      <div className="relative flex items-start w-full gap-3 p-4 z-10">
        {/* Emoji icon */}
        <div className={`
          flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm
          ${isLocked ? 'bg-gray-100 dark:bg-white/5' : colors.iconBg}
        `}>
          {isLocked ? <Lock size={16} className="text-gray-400 dark:text-gray-500" /> : audience.icono}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm font-semibold leading-tight ${isLocked ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>
              {audience.nombre}
            </p>
            {isSelected && !isLocked ? (
              <div className={`flex-shrink-0 w-5 h-5 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                <Check size={11} className={colors.text} />
              </div>
            ) : !isSelected && !isLocked ? (
              <ChevronRight size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            ) : null}
          </div>

          {isLocked ? (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              🔒 Disponible en tu mes {audience.requiere_meses}
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%] line-clamp-2">
                {audience.descripcion}
              </p>
              {/* Count badge */}
              {audience.count > 0 && (
                <div className="mt-2.5 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm transition-transform duration-200 ${isSelected ? '' : 'group-hover:scale-105'} ${colors.badge} ${colors.badgeText}`}>
                    <Users size={10} />
                    {audience.count} <span className="opacity-60 font-medium">clientas</span>
                  </span>
                  {/* Nilah insight chip (marketing only) */}
                  {audience.capa === 'marketing' && audience.insight && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                      <Sparkles size={8} />
                      IA
                    </span>
                  )}
                </div>
              )}
              {/* Nilah insight text */}
              {audience.capa === 'marketing' && audience.insight && isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 flex items-start gap-1.5 p-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20"
                >
                  <Sparkles size={11} className="text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-violet-700 dark:text-violet-300 leading-relaxed">{audience.insight}</p>
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle: string; icon: React.ReactNode }> = ({ title, subtitle, icon }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/8 flex items-center justify-center text-gray-500 dark:text-gray-400">
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-800 dark:text-white">{title}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500">{subtitle}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AudienceSelector: React.FC<AudienceSelectorProps> = ({
  onSelect,
  selectedId,
  compact = false,
  onlyWithClients = true,
}) => {
  const { clients } = useDashboardData();
  const [data, setData] = useState<AudienciasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await campaigns.getSmartAudiences(clients.length);
      if (!result) throw new Error('No se pudieron cargar las audiencias');
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Error al cargar audiencias');
    } finally {
      setLoading(false);
    }
  }, [clients.length]);

  useEffect(() => {
    fetchAudiences();
  }, [fetchAudiences]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="w-10 h-10 rounded-2xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={20} className="text-violet-600 dark:text-violet-400" />
          </motion.div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Analizando tu audiencia...</p>
          <p className="text-xs text-gray-400 mt-0.5">Nilah está calculando tus segmentos</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <AlertCircle size={24} className="text-rose-500 dark:text-rose-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchAudiences}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/8 text-gray-700 dark:text-gray-300 text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/12 transition-colors"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const phaseCfg = PHASE_CONFIG[data.fase];

  // Filtering logic: for quiz (onlyWithClients=true), only unlocked segments with count > 0
  const filterFn = (a: SmartAudience) =>
    onlyWithClients ? (a.desbloqueado && a.count > 0) : true;

  const crmFiltered = data.crm.filter(filterFn);
  const mktFiltered = data.marketing.filter(filterFn);
  const srvFiltered = ((data as any).servicios || []).filter(filterFn);

  // ── Compact mode (chips, for inline use) ─────────────────────────────────
  if (compact) {
    const allUnlocked = [...data.crm, ...data.marketing].filter(a => a.desbloqueado && a.count > 0);
    return (
      <div className="flex flex-wrap gap-2">
        {allUnlocked.map(aud => {
          const c = COLOR_MAP[aud.color] || COLOR_MAP.blue;
          return (
            <motion.button
              key={aud.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(aud)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${selectedId === aud.id
                  ? `${c.badge} ${c.badgeText}`
                  : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-gray-200'
                }
              `}
            >
              <span>{aud.icono}</span>
              {aud.nombre}
              {aud.count > 0 && (
                <span className="opacity-60">({aud.count})</span>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  // ── Full mode ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Phase badge */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${phaseCfg.bg} ${phaseCfg.color}`}>
          <Filter size={11} />
          {phaseCfg.label}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Users size={11} />
          <span>{data.total_clientes} clientes totales</span>
        </div>
      </div>

      {/* CRM Audiences */}
      {crmFiltered.length > 0 && (
        <div>
          <SectionHeader
            title="Audiencias CRM"
            subtitle={onlyWithClients ? `${crmFiltered.length} segmentos con clientes activos` : "Basadas en el comportamiento real de tus clientes"}
            icon={<Users size={14} />}
          />
          <div className="space-y-2">
            <AnimatePresence>
              {crmFiltered.map((aud, i) => (
                <motion.div
                  key={aud.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <AudienceCard
                    audience={aud}
                    isSelected={selectedId === aud.id}
                    onSelect={() => onSelect(aud)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Marketing / IA Audiences */}
      {mktFiltered.length > 0 && (
        <div>
          <SectionHeader
            title="Oportunidades Nilah ✨"
            subtitle={onlyWithClients ? `${mktFiltered.length} oportunidades con clientes` : "Segmentos inteligentes detectados por IA para maximizar ingresos"}
            icon={<Sparkles size={14} />}
          />
          <div className="space-y-2">
            <AnimatePresence>
              {mktFiltered.map((aud, i) => (
                <motion.div
                  key={aud.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                >
                  <AudienceCard
                    audience={aud}
                    isSelected={selectedId === aud.id}
                    onSelect={() => onSelect(aud)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Servicios Audiences */}
      {srvFiltered.length > 0 && (
        <div>
          <SectionHeader
            title="Por Servicios ✂️"
            subtitle={onlyWithClients ? `${srvFiltered.length} categorías con clientas` : "Agrupadas por el servicio que consumen"}
            icon={<Gift size={14} />}
          />
          <div className="space-y-2">
            <AnimatePresence>
              {srvFiltered.map((aud, i) => (
                <motion.div
                  key={aud.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <AudienceCard
                    audience={aud}
                    isSelected={selectedId === aud.id}
                    onSelect={() => onSelect(aud)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty state */}
      {onlyWithClients && crmFiltered.length === 0 && mktFiltered.length === 0 && srvFiltered.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-3xl mb-2">🌱</p>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Aún no hay suficientes datos</p>
          <p className="text-xs text-gray-400 mt-1">Registra más citas para activar tus primeros segmentos</p>
        </div>
      )}

      {/* Footer note */}
      {!onlyWithClients && (
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed pb-1">
          🔒 Los segmentos bloqueados se activan automáticamente conforme tu salón acumula datos.
        </p>
      )}
    </div>
  );
};

export default AudienceSelector;
