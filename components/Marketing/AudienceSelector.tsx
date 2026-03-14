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
  capa: 'crm' | 'marketing';
  nombre: string;
  descripcion: string;
  icono: string;
  color: AudienceColor;
  count: number;
  desbloqueado: boolean;
  requiere_meses: number;
  insight?: string;   // Solo para capa marketing
}

interface AudienciasData {
  business_age_months: number;
  fase: 'semilla' | 'crecimiento' | 'autoridad';
  total_clientes: number;
  crm: SmartAudience[];
  marketing: SmartAudience[];
}

type AudienceColor = 'blue' | 'emerald' | 'pink' | 'amber' | 'rose' | 'green' | 'violet' | 'purple';

interface AudienceSelectorProps {
  /** Called when user confirms an audience selection */
  onSelect: (audience: SmartAudience) => void;
  /** Currently selected audience id (controlled) */
  selectedId?: string;
  /** If true, renders in compact/chip mode instead of full cards */
  compact?: boolean;
}

// ─── Color Maps ──────────────────────────────────────────────────────────────

const COLOR_MAP: Record<AudienceColor, { bg: string; border: string; text: string; badge: string; glow: string }> = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',   text: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-300',    glow: 'shadow-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',text: 'text-emerald-400',badge: 'bg-emerald-500/20 text-emerald-300',glow: 'shadow-emerald-500/20' },
  pink:    { bg: 'bg-pink-500/10',    border: 'border-pink-500/30',   text: 'text-pink-400',   badge: 'bg-pink-500/20 text-pink-300',    glow: 'shadow-pink-500/20' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',  text: 'text-amber-400',  badge: 'bg-amber-500/20 text-amber-300',   glow: 'shadow-amber-500/20' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',   text: 'text-rose-400',   badge: 'bg-rose-500/20 text-rose-300',    glow: 'shadow-rose-500/20' },
  green:   { bg: 'bg-green-500/10',   border: 'border-green-500/30',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-300',   glow: 'shadow-green-500/20' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300', glow: 'shadow-violet-500/20' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300', glow: 'shadow-purple-500/20' },
};

// ─── Phase Badge ──────────────────────────────────────────────────────────────

const PHASE_CONFIG = {
  semilla:     { label: 'Salón Semilla 🌱',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  crecimiento: { label: 'En Crecimiento 🚀',   color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  autoridad:   { label: 'Salón Autoridad 👑',  color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
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
      whileTap={isLocked ? {} : { scale: 0.97 }}
      onClick={() => !isLocked && onSelect()}
      disabled={isLocked}
      className={`
        relative w-full rounded-2xl border p-4 text-left transition-all duration-200 overflow-hidden
        ${isLocked
          ? 'cursor-not-allowed opacity-40 grayscale'
          : isSelected
            ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
            : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
        }
      `}
    >
      {/* Selected glow bg */}
      {isSelected && !isLocked && (
        <div className={`absolute inset-0 ${colors.bg} opacity-60 rounded-2xl`} />
      )}

      <div className="relative flex items-start gap-3">
        {/* Emoji icon */}
        <div className={`
          flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl
          ${isLocked ? 'bg-white/5' : colors.bg}
        `}>
          {isLocked ? <Lock size={16} className="text-gray-600" /> : audience.icono}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className={`text-sm font-semibold ${isLocked ? 'text-gray-600' : 'text-white'}`}>
              {audience.nombre}
            </p>
            {isSelected && !isLocked && (
              <div className={`flex-shrink-0 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center`}>
                <Check size={11} className={colors.text} />
              </div>
            )}
            {!isSelected && !isLocked && (
              <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
            )}
          </div>

          {isLocked ? (
            <p className="text-xs text-gray-600">
              🔒 Disponible en tu mes {audience.requiere_meses}
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                {audience.descripcion}
              </p>
              {/* Count badge */}
              {audience.count > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.badge} border-current/30`}>
                    <Users size={9} />
                    {audience.count} clientes
                  </span>
                  {/* Nilah insight chip (marketing only) */}
                  {audience.capa === 'marketing' && audience.insight && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20">
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
                  className="mt-2 flex items-start gap-1.5 p-2 rounded-xl bg-violet-500/10 border border-violet-500/20"
                >
                  <Sparkles size={11} className="text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-violet-300 leading-relaxed">{audience.insight}</p>
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
    <div className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center text-gray-400">
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-white">{title}</p>
      <p className="text-[10px] text-gray-500">{subtitle}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AudienceSelector: React.FC<AudienceSelectorProps> = ({
  onSelect,
  selectedId,
  compact = false,
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
        <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles size={20} className="text-violet-400" />
          </motion.div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-300">Analizando tu audiencia...</p>
          <p className="text-xs text-gray-600 mt-0.5">Nilah está calculando tus segmentos</p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <AlertCircle size={24} className="text-rose-400" />
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={fetchAudiences}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 text-gray-300 text-sm hover:bg-white/12 transition-colors"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!data) return null;

  const phaseCfg = PHASE_CONFIG[data.fase];

  // ── Compact mode (chips, for inline use) ─────────────────────────────────
  if (compact) {
    const allUnlocked = [...data.crm, ...data.marketing].filter(a => a.desbloqueado);
    return (
      <div className="flex flex-wrap gap-2">
        {allUnlocked.map(aud => (
          <motion.button
            key={aud.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(aud)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
              ${selectedId === aud.id
                ? `${COLOR_MAP[aud.color].bg} ${COLOR_MAP[aud.color].border} ${COLOR_MAP[aud.color].text}`
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }
            `}
          >
            <span>{aud.icono}</span>
            {aud.nombre}
            {aud.count > 0 && (
              <span className="opacity-60">({aud.count})</span>
            )}
          </motion.button>
        ))}
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
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users size={11} />
          <span>{data.total_clientes} clientes totales</span>
        </div>
      </div>

      {/* CRM Audiences */}
      <div>
        <SectionHeader
          title="Audiencias CRM"
          subtitle="Basadas en el comportamiento real de tus clientes"
          icon={<Users size={14} />}
        />
        <div className="space-y-2">
          <AnimatePresence>
            {data.crm.map((aud, i) => (
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

      {/* Marketing / IA Audiences */}
      <div>
        <SectionHeader
          title="Oportunidades Nilah ✨"
          subtitle="Segmentos inteligentes detectados por IA para maximizar ingresos"
          icon={<Sparkles size={14} />}
        />
        <div className="space-y-2">
          <AnimatePresence>
            {data.marketing.map((aud, i) => (
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

      {/* Footer note */}
      <p className="text-center text-[10px] text-gray-700 leading-relaxed pb-1">
        🔒 Los segmentos bloqueados se activan automáticamente conforme tu salón acumula datos.
        Esto asegura que las campañas siempre tenga suficiente respaldo estadístico.
      </p>
    </div>
  );
};

export default AudienceSelector;
