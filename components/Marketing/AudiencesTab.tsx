/**
 * AudiencesTab
 * ─────────────────────────────────────────────────────────────────────────────
 * Tab permanente de Audiencias Inteligentes para el módulo Nilah Marketing.
 * Muestra todas las Cards de segmentos (CRM + Nilah IA + CRM personalizados)
 * en un Marketplace visual de alta gama.
 *
 * Al dar clic a "Activar Campaña" en una Card:
 *   → Se abre el CampaignSlotSelector para elegir la semana del mes.
 *   → Si la semana ya tiene una plantilla de Nilah, avisa y pregunta.
 *   → Finalmente dispara el flujo de creación (onLaunch callback).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Lock, Users, Crown, AlertCircle, RefreshCw,
  Zap, ChevronRight, Filter, Calendar, X, ArrowRight,
  Heart, Star, TrendingDown, UserPlus, Gift
} from 'lucide-react';
import { campaigns as campaignsApi } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SmartAudience {
  id: string;
  capa: 'crm' | 'marketing';
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  count: number;
  desbloqueado: boolean;
  condicion_desbloqueo?: string;
  insight?: string;
}

interface WeekSlot {
  week: number;          // 1-4
  label: string;         // "Semana 1 - 3 al 9 Mar"
  hasPlan: boolean;      // Nilah already has a plan for this week
  planTitle?: string;    // If hasPlan, the plan title
  isPast: boolean;
  isCurrent: boolean;
}

interface AudiencesData {
  business_age_months: number;
  fase: 'semilla' | 'crecimiento' | 'autoridad';
  total_clientes: number;
  crm: SmartAudience[];
  marketing: SmartAudience[];
}

interface AudiencesTabProps {
  businessId: string;
  /** Weekly plans from the current month (to detect collisions) */
  weeklyPlans?: Array<{ semana_del_mes: number; title: string }>;
  /** Called when slot is confirmed. audienceId + week are passed to open the wizard */
  onLaunch: (audience: SmartAudience, week: number) => void;
}

// ─── Color / Phase helpers ────────────────────────────────────────────────────

type AudienceColor = 'blue' | 'emerald' | 'pink' | 'amber' | 'rose' | 'green' | 'violet' | 'purple';

const COLOR_MAP: Record<AudienceColor, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',   text: 'text-blue-400',   glow: 'shadow-blue-500/20',   badge: 'bg-blue-500/20 text-blue-300' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',text: 'text-emerald-400',glow: 'shadow-emerald-500/20',  badge: 'bg-emerald-500/20 text-emerald-300' },
  pink:    { bg: 'bg-pink-500/10',    border: 'border-pink-500/30',   text: 'text-pink-400',   glow: 'shadow-pink-500/20',   badge: 'bg-pink-500/20 text-pink-300' },
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',  text: 'text-amber-400',  glow: 'shadow-amber-500/20',  badge: 'bg-amber-500/20 text-amber-300' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',   text: 'text-rose-400',   glow: 'shadow-rose-500/20',   badge: 'bg-rose-500/20 text-rose-300' },
  green:   { bg: 'bg-green-500/10',   border: 'border-green-500/30',  text: 'text-green-400',  glow: 'shadow-green-500/20',  badge: 'bg-green-500/20 text-green-300' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/30', text: 'text-violet-400', glow: 'shadow-violet-500/20', badge: 'bg-violet-500/20 text-violet-300' },
  purple:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/20', badge: 'bg-purple-500/20 text-purple-300' },
};

const PHASE_CFG = {
  semilla:     { label: 'Salón Semilla 🌱',  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  crecimiento: { label: 'En Crecimiento 🚀',  color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  autoridad:   { label: 'Salón Autoridad 👑', color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
};

// ─── Week Slot Calculation ────────────────────────────────────────────────────

function buildWeekSlots(weeklyPlans: Array<{ semana_del_mes: number; title: string }>): WeekSlot[] {
  const now = new Date();
  const month = now.toLocaleString('es-ES', { month: 'long' });
  const year = now.getFullYear();

  return [1, 2, 3, 4].map(week => {
    const startDay = (week - 1) * 7 + 1;
    const endDay = Math.min(week * 7, 31);
    const plan = weeklyPlans.find(p => p.semana_del_mes === week);
    // Rough current week calculation
    const currentWeek = Math.ceil(now.getDate() / 7);
    return {
      week,
      label: `Semana ${week} · ${startDay} al ${endDay} ${month.charAt(0).toUpperCase() + month.slice(1)}`,
      hasPlan: !!plan,
      planTitle: plan?.title,
      isPast: week < currentWeek,
      isCurrent: week === currentWeek,
    };
  });
}

// ─── Campaign Slot Selector Modal ─────────────────────────────────────────────

interface CampaignSlotModalProps {
  audience: SmartAudience;
  slots: WeekSlot[];
  onConfirm: (week: number) => void;
  onClose: () => void;
}

const CampaignSlotModal: React.FC<CampaignSlotModalProps> = ({ audience, slots, onConfirm, onClose }) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [showConflict, setShowConflict] = useState<WeekSlot | null>(null);
  const colors = COLOR_MAP[(audience.color as AudienceColor)] || COLOR_MAP.violet;

  const handleSelectWeek = (slot: WeekSlot) => {
    if (slot.isPast) return;
    if (slot.hasPlan) {
      setShowConflict(slot);
    } else {
      setSelectedWeek(slot.week);
    }
  };

  const handleConfirmConflict = () => {
    if (showConflict) {
      setSelectedWeek(showConflict.week);
      setShowConflict(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl bg-[#111118] border border-white/8 overflow-hidden shadow-2xl"
      >
        {/* Glow accent at top edge */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent ${colors.text.replace('text-', 'via-')} to-transparent`} />

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${colors.bg}`}>
                {audience.icono}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Activar Campaña</p>
                <h3 className="text-base font-bold text-white">{audience.nombre}</h3>
                <p className={`text-xs font-semibold ${colors.text}`}>{audience.count} clientas listas</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-gray-400 hover:bg-white/12 transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Week Selector */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <Calendar size={12} />
              ¿Para qué semana de {new Date().toLocaleString('es-ES', { month: 'long' })}?
            </p>
            <div className="space-y-2">
              {slots.map(slot => (
                <motion.button
                  key={slot.week}
                  whileTap={slot.isPast ? {} : { scale: 0.98 }}
                  onClick={() => handleSelectWeek(slot)}
                  disabled={slot.isPast}
                  className={`
                    relative w-full rounded-xl border px-4 py-3 text-left transition-all duration-200
                    ${slot.isPast ? 'cursor-not-allowed opacity-30 border-white/5 bg-white/2'
                      : selectedWeek === slot.week ? `${colors.bg} ${colors.border} shadow-lg`
                      : slot.isCurrent ? 'border-white/15 bg-white/5 hover:bg-white/8'
                      : 'border-white/8 bg-white/2 hover:bg-white/5 hover:border-white/12'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {slot.isCurrent && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                      <div>
                        <p className={`text-sm font-semibold ${selectedWeek === slot.week ? colors.text : slot.isPast ? 'text-gray-600' : 'text-white'}`}>
                          {slot.label}
                        </p>
                        {slot.isCurrent && <p className="text-[10px] text-emerald-400">Semana actual</p>}
                        {slot.isPast && <p className="text-[10px] text-gray-600">Ya pasó</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slot.hasPlan && !slot.isPast && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                          <Sparkles size={8} />
                          Nilah
                        </span>
                      )}
                      {selectedWeek === slot.week && (
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center ${colors.bg} border ${colors.border}`}>
                          <span className={`text-[10px] font-black ${colors.text}`}>✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {slot.hasPlan && !slot.isPast && (
                    <p className="mt-1 text-[10px] text-amber-400/70 pl-0">
                      Nilah tiene una plantilla: "{slot.planTitle}"
                    </p>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Conflict warning (inline) */}
          <AnimatePresence>
            {showConflict && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 space-y-3"
              >
                <p className="text-sm font-semibold text-amber-400">⚠️ Esta semana ya tiene una campaña Nilah</p>
                <p className="text-xs text-amber-300/70">
                  La semana {showConflict.week} ya tenía planeado: <strong>"{showConflict.planTitle}"</strong>.
                  ¿Quieres usar esa plantilla para <strong>{audience.nombre}</strong>, o crear un nuevo mensaje personalizado?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmConflict}
                    className="flex-1 rounded-xl bg-amber-500/20 py-2.5 text-xs font-bold text-amber-300 border border-amber-500/20 hover:bg-amber-500/30 transition-colors"
                  >
                    Usar plantilla existente
                  </button>
                  <button
                    onClick={() => { setSelectedWeek(showConflict.week); setShowConflict(null); }}
                    className="flex-1 rounded-xl bg-violet-500/20 py-2.5 text-xs font-bold text-violet-300 border border-violet-500/20 hover:bg-violet-500/30 transition-colors"
                  >
                    Crear mensaje nuevo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          {selectedWeek && !showConflict && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onConfirm(selectedWeek)}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-xl transition-transform active:scale-[0.98] bg-gradient-to-r from-violet-600 to-indigo-600 shadow-violet-500/20`}
            >
              <Zap size={16} />
              Crear Campaña para Semana {selectedWeek}
              <ArrowRight size={16} />
            </motion.button>
          )}

          {!selectedWeek && (
            <p className="text-center text-[11px] text-gray-600">Elige una semana para continuar</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Audience Details Modal (Bottom Sheet) ───────────────────────────────────

interface AudienceDetailsModalProps {
  audience: SmartAudience;
  onClose: () => void;
  onActivate: () => void;
}

const AudienceDetailsModal: React.FC<AudienceDetailsModalProps> = ({ audience, onClose, onActivate }) => {
  const colors = COLOR_MAP[(audience.color as AudienceColor)] || COLOR_MAP.violet;
  const isLocked = !audience.desbloqueado;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl bg-[#111118] border border-white/8 overflow-hidden shadow-2xl"
      >
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent ${isLocked ? 'via-gray-500' : colors.text.replace('text-', 'via-')} to-transparent`} />

        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${isLocked ? 'bg-white/5 grayscale' : colors.bg}`}>
              {isLocked ? <Lock size={24} className="text-gray-500" /> : audience.icono}
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-gray-400 hover:bg-white/12 transition-colors">
              <X size={14} />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className={`text-xl font-bold ${isLocked ? 'text-gray-400' : 'text-white'}`}>{audience.nombre}</h3>
              {!isLocked && audience.count > 0 && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${colors.badge} border-current/20`}>
                  <Users size={10} /> {audience.count}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              {audience.descripcion}
            </p>
          </div>

          {/* AI Insight Section */}
          {!isLocked && audience.capa === 'marketing' && audience.insight && (
            <div className="rounded-2xl bg-violet-500/10 border border-violet-500/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-violet-400" />
                <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider">Estrategia Nilah</h4>
              </div>
              <p className="text-sm text-violet-200/90 leading-relaxed">{audience.insight}</p>
            </div>
          )}

          {/* Locked State Section */}
          {isLocked && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 mt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requisito para Desbloqueo</p>
                <Lock size={14} className="text-gray-500" />
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Este segmento avanzado se activará automáticamente <strong>{audience.condicion_desbloqueo}</strong>.
              </p>
              <div className="flex items-center gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                <RefreshCw size={14} className="text-gray-500 animate-spin-slow" />
                <p className="text-xs text-gray-400">Nilah está monitoreando tus datos diariamente...</p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          {!isLocked ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { onClose(); onActivate(); }}
              className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white shadow-xl transition-all hover:brightness-110 ${colors.bg.replace('10', '20')} border ${colors.border}`}
            >
              <Zap size={16} />
              Seleccionar esta Audiencia
            </motion.button>
          ) : (
             <button
              disabled
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-gray-500 bg-white/5 border border-white/5 cursor-not-allowed"
            >
              Audiencia Bloqueada
            </button>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Audience Card (full-page version) ───────────────────────────────────────

interface AudienceCardBigProps {
  audience: SmartAudience;
  onViewDetails: () => void;
}

const AudienceCardBig: React.FC<AudienceCardBigProps> = ({ audience, onViewDetails }) => {
  const colors = COLOR_MAP[(audience.color as AudienceColor)] || COLOR_MAP.violet;
  const isLocked = !audience.desbloqueado;

  return (
    <motion.div
      layout
      whileTap={{ scale: 0.98 }}
      onClick={onViewDetails}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 cursor-pointer
        ${isLocked
          ? 'opacity-50 grayscale border-white/5 bg-white/2 hover:bg-white/5'
          : `${colors.bg} ${colors.border} hover:shadow-lg hover:${colors.glow} hover:bg-opacity-20`
        }
      `}
    >
      {/* Decorative circle */}
      <div className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full ${colors.bg} opacity-50 blur-xl`} />

      <div className="relative">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${isLocked ? 'bg-white/5' : colors.bg}`}>
            {isLocked ? <Lock size={16} className="text-gray-500" /> : audience.icono}
          </div>
          {/* Count pill */}
          {!isLocked && audience.count > 0 && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${colors.badge} border-current/20`}>
              <Users size={9} />
              {audience.count}
            </span>
          )}
          {isLocked && (
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-500 max-w-[120px] truncate">
              {audience.condicion_desbloqueo || 'Monitorizando...'}
            </span>
          )}
        </div>

        {/* Text */}
        <div className="mt-3">
          <p className={`text-sm font-bold leading-tight ${isLocked ? 'text-gray-500' : 'text-white'}`}>
            {audience.nombre}
          </p>
          <p className={`mt-1 text-[11px] leading-relaxed ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {isLocked ? `🔒 ${audience.condicion_desbloqueo}` : audience.descripcion}
          </p>
        </div>

        {/* AI Insight chip */}
        {!isLocked && audience.capa === 'marketing' && audience.insight && (
          <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 p-2.5">
            <Sparkles size={11} className="shrink-0 mt-0.5 text-violet-400" />
            <p className="text-[10px] leading-relaxed text-violet-300">{audience.insight}</p>
          </div>
        )}

        {/* CTA "Button" Lookalike -> the whole card is clickable now */}
        {!isLocked && (
          <div
            className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all
              bg-white/8 border border-white/10 text-gray-200`}
          >
            Ver Detalles
            <ChevronRight size={12} />
          </div>
        )}
        {isLocked && (
          <div className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold bg-white/5 border border-white/5 text-gray-500">
             <Lock size={12} /> ¿Cómo desbloquear?
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ title: string; subtitle: string; icon: React.ReactNode }> = ({ title, subtitle, icon }) => (
  <div className="flex items-center gap-2.5 mb-3">
    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/8 text-gray-400">{icon}</div>
    <div>
      <p className="text-xs font-bold text-white">{title}</p>
      <p className="text-[10px] text-gray-500">{subtitle}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const AudiencesTab: React.FC<AudiencesTabProps> = ({ businessId, weeklyPlans = [], onLaunch }) => {
  const { clients } = useDashboardData();
  const [data, setData] = useState<AudiencesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingAudience, setViewingAudience] = useState<SmartAudience | null>(null);
  const [activeAudience, setActiveAudience] = useState<SmartAudience | null>(null);
  const [slots, setSlots] = useState<WeekSlot[]>([]);

  const fetchAudiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await campaignsApi.getSmartAudiences(clients.length);
      if (!result) throw new Error('Sin datos');
      setData(result as AudiencesData);
    } catch (e: any) {
      setError(e.message || 'Error al cargar audiencias');
    } finally {
      setLoading(false);
    }
  }, [clients.length]);

  useEffect(() => {
    fetchAudiences();
    setSlots(buildWeekSlots(weeklyPlans));
  }, [fetchAudiences, weeklyPlans]);

  const handleActivate = (audience: SmartAudience) => {
    setSlots(buildWeekSlots(weeklyPlans)); // Refresh slots
    setActiveAudience(audience);
  };

  const handleConfirmSlot = (week: number) => {
    if (!activeAudience) return;
    setActiveAudience(null);
    onLaunch(activeAudience, week);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15"
        >
          <Sparkles size={24} className="text-violet-400" />
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-300">Nilah está analizando tu audiencia...</p>
          <p className="text-xs text-gray-600 mt-1">Calculando segmentos en tiempo real</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle size={28} className="text-rose-400" />
        <div>
          <p className="text-sm font-medium text-gray-300">{error || 'No se pudieron cargar las audiencias'}</p>
          <p className="text-xs text-gray-600 mt-1">Revisa tu conexión o intenta de nuevo</p>
        </div>
        <button
          onClick={fetchAudiences}
          className="flex items-center gap-2 rounded-xl bg-white/8 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/12 transition-colors"
        >
          <RefreshCw size={14} />
          Reintentar
        </button>
      </div>
    );
  }

  const phase = PHASE_CFG[data.fase];
  const totalUnlocked = [...data.crm, ...data.marketing].filter(a => a.desbloqueado).length;
  const totalLocked = [...data.crm, ...data.marketing].filter(a => !a.desbloqueado).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${phase.bg} ${phase.color}`}>
            <Filter size={11} />
            {phase.label}
          </div>
          <span className="text-xs text-gray-500">
            {data.total_clientes} clientes registrados
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{totalUnlocked} activas</span>
          {totalLocked > 0 && <span className="flex items-center gap-1 text-gray-600"><Lock size={10} />{totalLocked} bloqueadas</span>}
        </div>
      </div>

      {/* CRM Audiences */}
      <div>
        <SectionLabel
          title="Audiencias CRM"
          subtitle="Basadas en el historial real de tu salón"
          icon={<Users size={14} />}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.crm.map((aud, i) => (
            <motion.div key={aud.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <AudienceCardBig audience={aud} onViewDetails={() => setViewingAudience(aud)} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Nilah AI Audiences */}
      <div>
        <SectionLabel
          title="Oportunidades Nilah ✨"
          subtitle="Segmentos de alto impacto detectados por inteligencia artificial"
          icon={<Sparkles size={14} />}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.marketing.map((aud, i) => (
            <motion.div key={aud.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
              <AudienceCardBig audience={aud} onViewDetails={() => setViewingAudience(aud)} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-[10px] leading-relaxed text-gray-700 pb-2">
        🔒 Los segmentos bloqueados se desbloquean automáticamente conforme tu salón acumula datos y sube de nivel.
        Conectado con <strong className="text-gray-500">Mi Legado</strong>.
      </p>

      {/* Campaign Slot Selector Modal */}
      <AnimatePresence>
        {activeAudience && (
          <CampaignSlotModal
            audience={activeAudience}
            slots={slots}
            onConfirm={handleConfirmSlot}
            onClose={() => setActiveAudience(null)}
          />
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {viewingAudience && data && (
          <AudienceDetailsModal
            audience={viewingAudience}
            onClose={() => setViewingAudience(null)}
            onActivate={() => {
               setViewingAudience(null);
               handleActivate(viewingAudience);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudiencesTab;
