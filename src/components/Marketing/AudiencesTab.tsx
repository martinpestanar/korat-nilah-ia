/**
 * AudiencesTab — Nilah Marketing Audience Marketplace
 * ─────────────────────────────────────────────────────────────────────────────
 * Marketplace de audiencias con 3 capas: CRM, Oportunidades IA, y Servicios.
 * Optimizado para Mobile y High-Contrast Dark Mode.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Lock, Users, AlertCircle, RefreshCw,
  Zap, ChevronRight, Calendar, X, ArrowRight,
  TrendingUp, Scissors, Brain, Crown
} from 'lucide-react';
import { campaigns as campaignsApi } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SmartAudience {
  id: string;
  capa: 'crm' | 'marketing' | 'servicios';
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  count: number;
  desbloqueado: boolean;
  condicion_desbloqueo?: string;
  insight?: string;
  roi_tip?: string;
  estrategia?: string;
  roi_badge?: string;
}

interface AudiencesData {
  business_age_months: number;
  fase: 'semilla' | 'crecimiento' | 'autoridad';
  total_clientes: number;
  crm: SmartAudience[];
  crm_extra?: SmartAudience[];
  marketing: SmartAudience[];
  servicios?: SmartAudience[];
}

interface WeekSlot {
  week: number;
  label: string;
  hasPlan: boolean;
  planTitle?: string;
  isPast: boolean;
  isCurrent: boolean;
}

interface AudiencesTabProps {
  businessId: string;
  weeklyPlans?: Array<{ semana_del_mes: number; title: string }>;
  onLaunch?: (audience: SmartAudience, week: number) => void;
  onLaunchFlash?: (audience: SmartAudience) => void;
}

type SectionKey = 'crm' | 'marketing' | 'servicios';

// ─── Adaptive Color System ────────────────────────────────────────────────────
// Contrastes ajustados para modo oscuro y claro

type AColor = 'blue' | 'emerald' | 'pink' | 'amber' | 'rose' | 'green' | 'violet' | 'purple' | 'orange';

interface ColorTokens {
  cardBg: string;
  cardBorder: string;
  labelText: string;
  countText: string;
  pillBg: string;
  pillText: string;
  pillBorder: string;
  iconBg: string;
  detailBg: string;
  detailBorder: string;
  cardGlow: string;
  cardHover: string;
}

const CM: Record<AColor, ColorTokens> = {
  blue: {
    cardBg: 'bg-gradient-to-br from-blue-50/90 to-blue-100/50 dark:from-blue-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-blue-200/60 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] dark:border-blue-700/50 dark:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)]',
    cardGlow: 'bg-gradient-to-br from-blue-500/25 via-blue-500/5 to-transparent dark:from-blue-400/20 dark:via-blue-400/5',
    cardHover: 'hover:border-blue-400/80 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:border-blue-600/60 dark:hover:shadow-blue-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-blue-700 dark:text-blue-300',
    countText: 'text-blue-600 dark:text-blue-300',
    pillBg: 'bg-blue-100/90 dark:bg-blue-900/40 backdrop-blur-md',
    pillText: 'text-blue-800 dark:text-blue-200',
    pillBorder: 'border-blue-200/80 dark:border-blue-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-blue-900/40 dark:text-white',
    detailBg: 'bg-blue-50/90 dark:bg-blue-900/30',
    detailBorder: 'border-blue-200/60 dark:border-blue-700/50',
  },
  emerald: {
    cardBg: 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/50 dark:from-emerald-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-emerald-200/60 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)] dark:border-emerald-700/50 dark:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)]',
    cardGlow: 'bg-gradient-to-br from-emerald-500/25 via-emerald-500/5 to-transparent dark:from-emerald-400/20 dark:via-emerald-400/5',
    cardHover: 'hover:border-emerald-400/80 hover:shadow-2xl hover:shadow-emerald-500/20 dark:hover:border-emerald-600/60 dark:hover:shadow-emerald-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-emerald-700 dark:text-emerald-300',
    countText: 'text-emerald-600 dark:text-emerald-300',
    pillBg: 'bg-emerald-100/90 dark:bg-emerald-900/40 backdrop-blur-md',
    pillText: 'text-emerald-800 dark:text-emerald-200',
    pillBorder: 'border-emerald-200/80 dark:border-emerald-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-emerald-900/40 dark:text-white',
    detailBg: 'bg-emerald-50/90 dark:bg-emerald-900/30',
    detailBorder: 'border-emerald-200/60 dark:border-emerald-700/50',
  },
  pink: {
    cardBg: 'bg-gradient-to-br from-pink-50/90 to-pink-100/50 dark:from-pink-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-pink-200/60 shadow-[0_4px_20px_-4px_rgba(236,72,153,0.15)] dark:border-pink-700/50 dark:shadow-[0_4px_20px_-4px_rgba(236,72,153,0.1)]',
    cardGlow: 'bg-gradient-to-br from-pink-500/25 via-pink-500/5 to-transparent dark:from-pink-400/20 dark:via-pink-400/5',
    cardHover: 'hover:border-pink-400/80 hover:shadow-2xl hover:shadow-pink-500/20 dark:hover:border-pink-600/60 dark:hover:shadow-pink-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-pink-700 dark:text-pink-300',
    countText: 'text-pink-600 dark:text-pink-300',
    pillBg: 'bg-pink-100/90 dark:bg-pink-900/40 backdrop-blur-md',
    pillText: 'text-pink-800 dark:text-pink-200',
    pillBorder: 'border-pink-200/80 dark:border-pink-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-pink-900/40 dark:text-white',
    detailBg: 'bg-pink-50/90 dark:bg-pink-900/30',
    detailBorder: 'border-pink-200/60 dark:border-pink-700/50',
  },
  amber: {
    cardBg: 'bg-gradient-to-br from-amber-50/90 to-amber-100/50 dark:from-amber-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-amber-200/60 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)] dark:border-amber-700/50 dark:shadow-[0_4px_20px_-4px_rgba(245,158,11,0.1)]',
    cardGlow: 'bg-gradient-to-br from-amber-500/25 via-amber-500/5 to-transparent dark:from-amber-400/20 dark:via-amber-400/5',
    cardHover: 'hover:border-amber-400/80 hover:shadow-2xl hover:shadow-amber-500/20 dark:hover:border-amber-600/60 dark:hover:shadow-amber-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-amber-700 dark:text-amber-300',
    countText: 'text-amber-600 dark:text-amber-300',
    pillBg: 'bg-amber-100/90 dark:bg-amber-900/40 backdrop-blur-md',
    pillText: 'text-amber-800 dark:text-amber-200',
    pillBorder: 'border-amber-200/80 dark:border-amber-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-amber-900/40 dark:text-white',
    detailBg: 'bg-amber-50/90 dark:bg-amber-900/30',
    detailBorder: 'border-amber-200/60 dark:border-amber-700/50',
  },
  rose: {
    cardBg: 'bg-gradient-to-br from-rose-50/90 to-rose-100/50 dark:from-rose-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-rose-200/60 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.15)] dark:border-rose-700/50 dark:shadow-[0_4px_20px_-4px_rgba(244,63,94,0.1)]',
    cardGlow: 'bg-gradient-to-br from-rose-500/25 via-rose-500/5 to-transparent dark:from-rose-400/20 dark:via-rose-400/5',
    cardHover: 'hover:border-rose-400/80 hover:shadow-2xl hover:shadow-rose-500/20 dark:hover:border-rose-600/60 dark:hover:shadow-rose-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-rose-700 dark:text-rose-300',
    countText: 'text-rose-600 dark:text-rose-300',
    pillBg: 'bg-rose-100/90 dark:bg-rose-900/40 backdrop-blur-md',
    pillText: 'text-rose-800 dark:text-rose-200',
    pillBorder: 'border-rose-200/80 dark:border-rose-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-rose-900/40 dark:text-white',
    detailBg: 'bg-rose-50/90 dark:bg-rose-900/30',
    detailBorder: 'border-rose-200/60 dark:border-rose-700/50',
  },
  green: {
    cardBg: 'bg-gradient-to-br from-green-50/90 to-green-100/50 dark:from-green-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-green-200/60 shadow-[0_4px_20px_-4px_rgba(34,197,94,0.15)] dark:border-green-700/50 dark:shadow-[0_4px_20px_-4px_rgba(34,197,94,0.1)]',
    cardGlow: 'bg-gradient-to-br from-green-500/25 via-green-500/5 to-transparent dark:from-green-400/20 dark:via-green-400/5',
    cardHover: 'hover:border-green-400/80 hover:shadow-2xl hover:shadow-green-500/20 dark:hover:border-green-600/60 dark:hover:shadow-green-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-green-700 dark:text-green-300',
    countText: 'text-green-600 dark:text-green-300',
    pillBg: 'bg-green-100/90 dark:bg-green-900/40 backdrop-blur-md',
    pillText: 'text-green-800 dark:text-green-200',
    pillBorder: 'border-green-200/80 dark:border-green-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-green-900/40 dark:text-white',
    detailBg: 'bg-green-50/90 dark:bg-green-900/30',
    detailBorder: 'border-green-200/60 dark:border-green-700/50',
  },
  violet: {
    cardBg: 'bg-gradient-to-br from-violet-50/90 to-violet-100/50 dark:from-violet-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-violet-200/60 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.15)] dark:border-violet-700/50 dark:shadow-[0_4px_20px_-4px_rgba(139,92,246,0.1)]',
    cardGlow: 'bg-gradient-to-br from-violet-500/25 via-violet-500/5 to-transparent dark:from-violet-400/20 dark:via-violet-400/5',
    cardHover: 'hover:border-violet-400/80 hover:shadow-2xl hover:shadow-violet-500/20 dark:hover:border-violet-600/60 dark:hover:shadow-violet-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-violet-700 dark:text-violet-300',
    countText: 'text-violet-600 dark:text-violet-300',
    pillBg: 'bg-violet-100/90 dark:bg-violet-900/40 backdrop-blur-md',
    pillText: 'text-violet-800 dark:text-violet-200',
    pillBorder: 'border-violet-200/80 dark:border-violet-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-violet-900/40 dark:text-white',
    detailBg: 'bg-violet-50/90 dark:bg-violet-900/30',
    detailBorder: 'border-violet-200/60 dark:border-violet-700/50',
  },
  purple: {
    cardBg: 'bg-gradient-to-br from-purple-50/90 to-purple-100/50 dark:from-purple-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-purple-200/60 shadow-[0_4px_20px_-4px_rgba(168,85,247,0.15)] dark:border-purple-700/50 dark:shadow-[0_4px_20px_-4px_rgba(168,85,247,0.1)]',
    cardGlow: 'bg-gradient-to-br from-purple-500/25 via-purple-500/5 to-transparent dark:from-purple-400/20 dark:via-purple-400/5',
    cardHover: 'hover:border-purple-400/80 hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:border-purple-600/60 dark:hover:shadow-purple-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-purple-700 dark:text-purple-300',
    countText: 'text-purple-600 dark:text-purple-300',
    pillBg: 'bg-purple-100/90 dark:bg-purple-900/40 backdrop-blur-md',
    pillText: 'text-purple-800 dark:text-purple-200',
    pillBorder: 'border-purple-200/80 dark:border-purple-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-purple-900/40 dark:text-white',
    detailBg: 'bg-purple-50/90 dark:bg-purple-900/30',
    detailBorder: 'border-purple-200/60 dark:border-purple-700/50',
  },
  orange: {
    cardBg: 'bg-gradient-to-br from-orange-50/90 to-orange-100/50 dark:from-orange-900/20 dark:to-[#0f111a]/80',
    cardBorder: 'border-orange-200/60 shadow-[0_4px_20px_-4px_rgba(249,115,22,0.15)] dark:border-orange-700/50 dark:shadow-[0_4px_20px_-4px_rgba(249,115,22,0.1)]',
    cardGlow: 'bg-gradient-to-br from-orange-500/25 via-orange-500/5 to-transparent dark:from-orange-400/20 dark:via-orange-400/5',
    cardHover: 'hover:border-orange-400/80 hover:shadow-2xl hover:shadow-orange-500/20 dark:hover:border-orange-600/60 dark:hover:shadow-orange-500/20 translate-y-0 hover:-translate-y-1',
    labelText: 'text-orange-700 dark:text-orange-300',
    countText: 'text-orange-600 dark:text-orange-300',
    pillBg: 'bg-orange-100/90 dark:bg-orange-900/40 backdrop-blur-md',
    pillText: 'text-orange-800 dark:text-orange-200',
    pillBorder: 'border-orange-200/80 dark:border-orange-700/50',
    iconBg: 'bg-white shadow-sm dark:bg-orange-900/40 dark:text-white',
    detailBg: 'bg-orange-50/90 dark:bg-orange-900/30',
    detailBorder: 'border-orange-200/60 dark:border-orange-700/50',
  },
};

function ct(color: string): ColorTokens {
  return CM[(color as AColor)] ?? CM.violet;
}

// ─── Week Slots ───────────────────────────────────────────────────────────────

function buildWeekSlots(plans: Array<{ semana_del_mes: number; title: string }>): WeekSlot[] {
  const now  = new Date();
  const mth  = now.toLocaleString('es-ES', { month: 'long' });
  const mCap = mth.charAt(0).toUpperCase() + mth.slice(1);
  const cw   = Math.ceil(now.getDate() / 7);
  return [1, 2, 3, 4].map(w => ({
    week: w,
    label: `Semana ${w} · ${(w - 1) * 7 + 1}–${Math.min(w * 7, 31)} ${mCap}`,
    hasPlan:   !!plans.find(p => p.semana_del_mes === w),
    planTitle: plans.find(p => p.semana_del_mes === w)?.title,
    isPast:    w < cw,
    isCurrent: w === cw,
  }));
}

// ─── Campaign Slot Modal ──────────────────────────────────────────────────────

const CampaignSlotModal: React.FC<{
  audience: SmartAudience;
  slots: WeekSlot[];
  onConfirm: (week: number) => void;
  onClose: () => void;
}> = ({ audience, slots, onConfirm, onClose }) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const tok = ct(audience.color);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mt-4 mb-2 sm:hidden shrink-0" />
        
        <div className="p-5 space-y-5 overflow-y-auto w-full no-scrollbar pb-[max(20px,env(safe-area-inset-bottom))] sm:pb-5 outline-none">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-2xl ${tok.iconBg}`}>{audience.icono}</div>
              <div className="flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Activar Campaña</p>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">{audience.nombre}</p>
                <p className={`text-sm font-semibold mt-0.5 ${tok.labelText}`}>{audience.count} clientas listas</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Slots */}
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Calendar size={14} /> Elige la Semana
            </p>
            {slots.map(slot => (
              <button
                key={slot.week}
                onClick={() => !slot.isPast ? setSelectedWeek(slot.week) : undefined}
                disabled={slot.isPast}
                className={`
                  w-full rounded-2xl border px-5 py-4 text-left transition-all duration-200
                  ${slot.isPast
                    ? 'cursor-not-allowed opacity-40 border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5'
                    : selectedWeek === slot.week
                      ? `${tok.cardBg} ${tok.cardBorder} ring-2 ring-violet-500/30`
                      : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-white/5'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {slot.isCurrent && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />}
                    <p className={`text-sm sm:text-base font-bold ${selectedWeek === slot.week ? tok.labelText : 'text-gray-800 dark:text-white'}`}>{slot.label}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {slot.isCurrent && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">Actual</span>}
                    {selectedWeek === slot.week && (
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${tok.iconBg} shadow-sm border ${tok.cardBorder}`}>
                        <span className={`text-[12px] font-black ${tok.labelText}`}>✓</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Action Button */}
          <div className="pt-2 mt-auto">
            {selectedWeek ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => onConfirm(selectedWeek)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/25 active:scale-95 transition-transform"
              >
                <Zap size={18} /> Crear Campaña · Semana {selectedWeek} <ArrowRight size={18} />
              </motion.button>
            ) : (
              <div className="w-full py-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-dark-bg">
                <p className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400">Elige una semana para continuar</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Audience Detail Sheet ────────────────────────────────────────────────────

const AudienceDetailSheet: React.FC<{
  audience: SmartAudience;
  onClose: () => void;
  onActivate: () => void;
}> = ({ audience, onClose, onActivate }) => {
  const tok    = ct(audience.color);
  const locked = !audience.desbloqueado;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      layoutRoot
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div 
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <motion.div
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Top accent rule */}
        <div className={`absolute top-0 inset-x-0 h-1 ${locked ? 'bg-gray-300 dark:bg-gray-700' : `bg-gradient-to-r from-transparent ${tok.labelText.replace('text-', 'via-')} to-transparent`}`} />

        <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 mx-auto mt-4 mb-2 sm:hidden shrink-0" />

        <div className="relative p-6 space-y-5 overflow-y-auto w-full no-scrollbar pb-[max(24px,env(safe-area-inset-bottom))] sm:pb-6 outline-none">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[2rem] text-3xl sm:text-4xl shadow-md ${locked ? 'bg-gray-100 dark:bg-dark-bg grayscale' : tok.iconBg}`}>
                {locked ? <Lock size={28} className="text-gray-400 dark:text-gray-500" /> : audience.icono}
                {!locked && audience.estrategia && (
                  <span className={`absolute -bottom-2 -right-2 rounded-full px-2.5 py-1 text-[10px] font-black border tracking-wider shadow-sm ${tok.pillBg} ${tok.pillText} ${tok.pillBorder}`}>
                    {audience.estrategia}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl sm:text-2xl font-black leading-tight ${locked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{audience.nombre}</h3>
                {!locked && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${tok.pillBg} ${tok.pillText} ${tok.pillBorder}`}>
                      <Users size={12} /> {audience.count} clientas en este grupo
                    </div>
                    {audience.roi_badge && (
                      <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black shadow-sm" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}>
                        <Sparkles size={12} className="text-emerald-100" />
                        {audience.roi_badge}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>

          {/* Description */}
          <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300 font-medium">{audience.descripcion}</p>

          {/* BI Insight */}
          {!locked && audience.insight && (
            <div className={`rounded-3xl border p-5 sm:p-6 space-y-4 ${tok.detailBg} ${tok.detailBorder} shadow-inner`}>
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={tok.labelText} />
                <p className={`text-xs font-black uppercase tracking-widest ${tok.labelText}`}>Estrategia Inteligente</p>
              </div>
              <p className="text-[15px] font-medium text-gray-800 dark:text-white/90 leading-relaxed">{audience.insight}</p>
              {audience.roi_tip && (
                <div className="flex items-start gap-2 pt-4 border-t border-gray-200 dark:border-white/10">
                  <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-emerald-700 dark:text-emerald-300 font-semibold leading-relaxed">{audience.roi_tip}</p>
                </div>
              )}
            </div>
          )}

          {/* WhatsApp Sugerido */}
          {!locked && (
            <div className="bg-[#E7F6EC] dark:bg-[#1A2E23] border border-[#25D366]/30 p-5 rounded-3xl relative overflow-hidden">
              <div className="absolute -top-4 -right-4 opacity-[0.04] dark:opacity-[0.08]">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              </div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="bg-[#25D366] text-white p-1.5 rounded-xl shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                </div>
                <h4 className="text-xs font-black uppercase text-[#128C7E] dark:text-[#25D366] tracking-wider">Borrador IA</h4>
              </div>
              <div className="bg-white dark:bg-[#0B141A] rounded-[1.25rem] rounded-tl-sm p-4 shadow-sm relative z-10">
                <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                  "¡Hola <span className="text-[#25D366]">María</span>! 🌟 Hemos visto que <span className="bg-emerald-100 dark:bg-emerald-900/30 px-1 rounded">{audience.nombre.toLowerCase()}</span> y te extrañamos en el salón. Como eres súper importante para nosotros, tenemos un trato especial para ti. ¿Qué día de esta semana te gustaría visitarnos?"
                </p>
                <div className="mt-3 flex justify-end">
                  <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">
                    Podrás personalizar el envío
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Locked block */}
          {locked && (
             <div className="rounded-3xl bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-800 p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Requisito de Desbloqueo</p>
                <Lock size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 leading-relaxed">{audience.condicion_desbloqueo}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 mt-auto">
            {!locked ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { onClose(); onActivate(); }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white active:scale-95 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.4)'
                }}
              >
                <Zap size={18} /> Activar Campaña Ahora
              </motion.button>
            ) : (
              <button disabled className="w-full flex items-center justify-center gap-2 py-4.5 sm:py-4 rounded-2xl text-base font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-800 cursor-not-allowed">
                <Lock size={18} /> Segmento Bloqueado
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Audience Card ────────────────────────────────────────────────────────────

const AudienceCard: React.FC<{
  audience: SmartAudience;
  index: number;
  onViewDetails: () => void;
}> = ({ audience, index, onViewDetails }) => {
  const tok    = ct(audience.color);
  const locked = !audience.desbloqueado;
  const empty  = audience.count === 0;

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={locked ? {} : { scale: 1.02, rotateX: 2, rotateY: -2 }}
      whileTap={locked ? {} : { scale: 0.96 }}
      onClick={onViewDetails}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`
        group relative overflow-hidden rounded-3xl border cursor-pointer transition-all duration-300 ease-out backdrop-blur-xl flex flex-col h-full
        ${locked
          ? 'opacity-60 border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5'
          : empty
            ? 'border-dashed border-gray-300 dark:border-white/10 bg-gray-50/50 dark:bg-white/5'
            : `${tok.cardBg} ${tok.cardBorder} hover:shadow-2xl hover:border-[${tok.labelText}]`
        }
      `}
      style={{ perspective: 1000 }}
    >
      {/* Background glow for non-empty active cards (Spotlight effect) */}
      {!locked && !empty && isHovered && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.15), transparent 40%)`
          }}
        />
      )}
      
      <div className="relative p-5 flex flex-col flex-1 z-10 w-full min-h-[140px]">
        {/* Row 1: icon + count badge + roi badge */}
        <div className="flex items-start justify-between mb-4 w-full relative">
          <motion.div 
            className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl text-2xl shadow-sm ${locked ? 'bg-gray-200 dark:bg-gray-800/60' : tok.iconBg}`}
            animate={isHovered && !locked ? { y: -4, rotate: [-2, 2, -1, 1, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {locked ? <Lock size={20} className="text-gray-500 dark:text-gray-400" /> : audience.icono}
          </motion.div>
          
          <div className="flex flex-col items-end gap-2 max-w-[65%]">
            {!locked && audience.roi_badge && (
              <div className="inline-flex items-center shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 text-white gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-black tracking-wide shrink-0 whitespace-nowrap overflow-hidden">
                <Sparkles size={10} className="text-emerald-100" />
                <span className="truncate">{audience.roi_badge}</span>
              </div>
            )}
            {!locked && (
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-2.5 sm:py-1.5 text-xs sm:text-[11px] font-bold border transition-transform duration-300 ${empty ? 'opacity-0' : 'group-hover:scale-105'} ${tok.pillBg} ${tok.pillText} ${tok.pillBorder} shadow-sm w-fit`}>
                <Users size={12} className="shrink-0" />
                <span className="truncate">{empty ? '–' : audience.count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: name */}
        <p className={`text-base font-bold leading-tight mb-2 w-full ${locked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
          {audience.nombre}
        </p>

        {/* Row 3: description (clipped) */}
        <p className={`text-xs sm:text-sm leading-snug line-clamp-2 w-full flex-1 ${locked ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
          {locked ? `🔒 ${audience.condicion_desbloqueo}` : audience.descripcion}
        </p>

        {/* Row 4: strategy tag + detail link */}
        <div className="mt-4 flex items-center justify-between w-full pt-2 border-t border-gray-100 dark:border-white/5 disabled-auto">
          {!locked && audience.estrategia ? (
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${tok.pillBg} ${tok.pillText} ${tok.pillBorder} truncate max-w-[65%]`}>
              {audience.estrategia}
            </span>
          ) : <span />}
          <span className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold shrink-0 ${locked ? 'text-gray-400 dark:text-gray-500' : tok.labelText}`}>
            {locked ? 'Ver req.' : 'Detalle'} <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* Empty state ribbon */}
      {empty && !locked && (
        <div className="absolute top-3 right-3">
          <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 rounded-full px-2 py-1 shadow-inner">SIN PÚBLICO</span>
        </div>
      )}
    </motion.div>
  );
};

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: Array<{ key: SectionKey; label: string; subLabel: string; icon: React.ReactNode }> = [
  { key: 'crm',       label: 'Por Comportamiento',        subLabel: 'Historial real',  icon: <Crown size={14} /> },
  { key: 'marketing', label: 'Estrategia IA',   subLabel: 'Alto ROI',   icon: <Brain size={14} /> },
  { key: 'servicios', label: 'Por Servicio',  subLabel: 'Categorizados',   icon: <Scissors size={14} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const AudiencesTab: React.FC<AudiencesTabProps> = ({ businessId, weeklyPlans = [], onLaunch, onLaunchFlash }) => {
  const { clients } = useDashboardData();
  const [data, setData]           = useState<AudiencesData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [cacheTime, setCacheTime] = useState<string | null>(null);
  const [viewing, setViewing]     = useState<SmartAudience | null>(null);
  const [activating, setActivating] = useState<SmartAudience | null>(null);
  const [slots, setSlots]         = useState<WeekSlot[]>([]);
  const [activeSection, setActiveSection] = useState<SectionKey>('crm');
  const fetchedRef = useRef(false);

  const fetchAudiences = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await campaignsApi.getSmartAudiences(clients?.length ?? 0, forceRefresh);
      if (!result) throw new Error('Sin datos');
      setData(result as AudiencesData);
      setCacheTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      setError(e.message || 'Error al cargar audiencias');
    } finally {
      setLoading(false);
    }
  }, [clients?.length]);

  useEffect(() => {
    fetchAudiences(false);
    setSlots(buildWeekSlots(weeklyPlans));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActivate = (aud: SmartAudience) => {
    if (onLaunchFlash) {
      onLaunchFlash(aud);
      return;
    }
    setSlots(buildWeekSlots(weeklyPlans));
    setActivating(aud);
  };
  const handleConfirmSlot = (week: number) => {
    if (!activating || !onLaunch) return;
    const a = activating;
    setActivating(null);
    onLaunch(a, week);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 px-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-violet-100 dark:bg-violet-900/30"
        >
          <Sparkles size={36} className="text-violet-600 dark:text-violet-400" />
        </motion.div>
        <div className="text-center space-y-2">
          <p className="text-lg font-bold text-gray-900 dark:text-white">Analizando tu base de datos...</p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nilah está encontrando los mejores grupos de clientes <br className="hidden sm:block"/>para enviarte campañas listas para usar.</p>
        </div>
        <div className="w-full max-w-lg space-y-4 px-2 mt-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 rounded-3xl bg-gray-100 dark:bg-white/5 animate-pulse border border-gray-200 dark:border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-rose-100 dark:bg-rose-900/30">
          <AlertCircle size={36} className="text-rose-600 dark:text-rose-400" />
        </div>
        <div>
           <p className="text-lg font-bold text-gray-900 dark:text-white">Ops, algo salió mal</p>
           <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{error || 'No se pudieron cargar las audiencias'}</p>
        </div>
        <button
          onClick={() => fetchAudiences(true)}
          className="mt-2 flex items-center justify-center gap-2 w-full max-w-[200px] rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 text-base font-bold shadow-lg shadow-gray-900/10 dark:shadow-white/10 active:scale-95 transition-transform"
        >
          <RefreshCw size={18} /> Reintentar
        </button>
      </div>
    );
  }

  // Flatten all segments
  const allSegs: SmartAudience[] = [
    ...data.crm,
    ...(data.crm_extra || []),
    ...data.marketing,
    ...(data.servicios || []),
  ];
  const unlocked = allSegs.filter(a => a.desbloqueado && a.count > 0).length;

  // Current section display
  const sectionAudienceMap: Record<SectionKey, SmartAudience[]> = {
    crm:       [...data.crm, ...(data.crm_extra || [])],
    marketing: data.marketing,
    servicios: data.servicios || [],
  };
  const displayed = sectionAudienceMap[activeSection];

  // Top hot opportunities (count > 0, unlocked, sorted)
  const hotSpots = allSegs
    .filter(a => a.desbloqueado && a.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-24 sm:pb-8">

      {/* ── Header stats bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border p-3 sm:p-2 sm:px-3 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <span className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-300 text-sm">
            <Users size={16} className="text-violet-500" />
            {data.total_clientes} clientes
          </span>
          <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            {unlocked} listos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/nilah/app/broadcasts"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-extrabold shadow-md shadow-pink-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Zap size={14} />
            Envíos Masivos (Mobile)
          </a>
          <button
            onClick={() => fetchAudiences(true)}
            title="Forzar recarga de segmentos"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-dark-bg border border-gray-200 dark:border-white/10 shadow-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-white/5 active:scale-95 transition-all"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>


      {/* ── Top 3 Hot Spots ──────────────────────────────────────────────── */}
      {hotSpots.length > 0 && (
        <div className="px-1">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            <Sparkles size={14} className="text-violet-500" /> Top Oportunidades Ahora
          </p>
          <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x snap-mandatory">
            {hotSpots.map((aud, i) => {
              const tok = ct(aud.color);
              return (
                <motion.button
                  key={aud.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewing(aud)}
                  className={`snap-center flex-none w-[140px] sm:w-auto flex flex-col items-center justify-center text-center p-4 rounded-[1.5rem] border gap-1.5 transition-all duration-300 shadow-sm ${tok.cardBg} ${tok.cardBorder} hover:shadow-lg hover:-translate-y-1`}
                >
                  <span className={`flex items-center justify-center h-12 w-12 rounded-2xl text-2xl shadow-sm ${tok.iconBg} mb-1`}>{aud.icono}</span>
                  <span className={`text-xl font-black ${tok.countText}`}>{aud.count}</span>
                  <span className={`text-[11px] font-bold leading-tight line-clamp-2 ${tok.pillText} opacity-90`}>{aud.nombre}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Marketplace: Section Toggle (Horizontal Scroll on Mobile) ── */}
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar pb-1">
        <div className="flex bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-white/5 rounded-2xl p-1.5 gap-1.5 w-max sm:w-full min-w-full">
          {SECTIONS.map(sec => {
            const count = sectionAudienceMap[sec.key].length;
            const active = activeSection === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveSection(sec.key)}
                className={`flex-1 flex flex-col items-start sm:items-center justify-center px-4 sm:px-2 py-3 sm:py-2.5 rounded-xl transition-all duration-300 min-w-[140px] sm:min-w-0 ${
                  active
                    ? 'bg-white dark:bg-dark-bg text-violet-600 dark:text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {sec.icon}
                  {sec.label}
                </div>
                <div className="flex items-center gap-1.5 mt-1 sm:mt-0.5">
                  <span className={`text-[10px] sm:text-[9px] font-semibold uppercase tracking-wider ${active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>{sec.subLabel}</span>
                  <span className={`rounded-full px-1.5 py-0.5 sm:py-0 text-[10px] sm:text-[9px] font-black ${active ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 px-1">
        <div>
          <p className="text-xl sm:text-lg font-black text-gray-900 dark:text-white">
            {activeSection === 'crm' ? '🧠 Por Comportamiento' : activeSection === 'marketing' ? '✨ Estrategia de IA' : '✂️ Segmentos por Servicio'}
          </p>
          <p className="text-sm sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            {activeSection === 'crm' && 'Grupos analizados en base a cuántas veces o hace cuánto te visitan.'}
            {activeSection === 'marketing' && 'Oportunidades que Nilah detecta para que recuperes o multipliques tus ventas.'}
            {activeSection === 'servicios' && 'Campañas específicas según los servicios que más les gusta consumir.'}
          </p>
        </div>
        <span className="self-start sm:self-auto text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 rounded-full px-2.5 py-1">
          {displayed.length} Plantillas
        </span>
      </div>

      {/* ── Cards Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayed.length === 0 && activeSection === 'servicios' ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-pink-100 dark:bg-pink-900/20">
              <Scissors size={36} className="text-pink-500 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-800 dark:text-white">Aún no hay segmentos por servicio</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs">
                Cuando registres citas con servicios, Nilah creará aquí segmentos automáticamente por categoría.
              </p>
            </div>
          </div>
        ) : (
          displayed.map((aud, i) => (
            <AudienceCard
              key={aud.id}
              audience={aud}
              index={i}
              onViewDetails={() => setViewing(aud)}
            />
          ))
        )}
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-2">
         <p className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border py-1.5 px-3 rounded-full text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            <RefreshCw size={10} /> Actualización automática inteligente
         </p>
      </div>

      {/* ── Modals via Portal para evadir transform bounds ── */}
      {typeof document !== 'undefined' && createPortal(
        <>
          <AnimatePresence>
            {viewing && (
              <AudienceDetailSheet
                key="detail"
                audience={viewing}
                onClose={() => setViewing(null)}
                onActivate={() => {
                  const v = viewing;
                  setViewing(null);
                  handleActivate(v);
                }}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {activating && (
              <CampaignSlotModal
                key="slot"
                audience={activating}
                slots={slots}
                onConfirm={handleConfirmSlot}
                onClose={() => setActivating(null)}
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
};

export default AudiencesTab;
