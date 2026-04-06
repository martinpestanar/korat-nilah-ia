/**
 * ============================================================
 * Plan Features — Nilah IA
 * ============================================================
 * Fuente única de verdad de las funcionalidades por plan.
 * Basado en la Landing page de Nilah IA (Landing.tsx).
 *
 * Plan mapping:
 *   Glow        → plan_base: 'basico'
 *   Glow Pro    → plan_base: 'pro'
 *   Glow Elite  → plan_base: 'copilot'
 * ============================================================
 */

export type PlanBase = 'basico' | 'pro' | 'copilot';

export interface PlanFeatureSet {
  /** Recordatorios automáticos 24h/3h antes de la cita */
  recordatoriosCita: boolean;
  /** Sistema de rescate automático a los 35, 60 y 90 días de ausencia */
  rescate: boolean;
  /** Recordatorios de retoque de servicios de mantenimiento */
  retoques: boolean;
  /** Chatbot en Modo Automático (agenda, modifica, cancela solo) */
  chatbotAuto: boolean;
  /** Módulo de Marketing — Campañas semanales por WhatsApp */
  marketing: boolean;
  /** Nilah Creative — Generador de flyers con IA */
  creative: boolean;
  /** Action Cards — Acciones rápidas con un toque */
  actionCards: boolean;
  /** Nilah Lumina — Director Estratégico con briefing diario */
  lumina: boolean;
  /** Soporte prioritario 1 a 1 */
  soportePrioritario: boolean;
}

export const PLAN_FEATURES: Record<PlanBase, PlanFeatureSet> = {
  basico: {
    recordatoriosCita: true,
    rescate: false,
    retoques: false,
    chatbotAuto: false,
    marketing: false,
    creative: false,
    actionCards: false,
    lumina: false,
    soportePrioritario: false,
  },
  pro: {
    recordatoriosCita: true,
    rescate: true,
    retoques: true,
    chatbotAuto: true,
    marketing: true,
    creative: true,
    actionCards: true,
    lumina: false,
    soportePrioritario: false,
  },
  copilot: {
    recordatoriosCita: true,
    rescate: true,
    retoques: true,
    chatbotAuto: true,
    marketing: true,
    creative: true,
    actionCards: true,
    lumina: true,
    soportePrioritario: true,
  },
};

/** Nombre visible del plan para mostrar en UI */
export const PLAN_DISPLAY_NAMES: Record<PlanBase, string> = {
  basico: 'Glow',
  pro: 'Glow Pro',
  copilot: 'Glow Elite',
};

/** Nombre del plan siguiente para CTAs de upgrade */
export const PLAN_NEXT: Record<PlanBase, { plan: PlanBase; displayName: string } | null> = {
  basico: { plan: 'pro', displayName: 'Glow Pro' },
  pro: { plan: 'copilot', displayName: 'Glow Elite' },
  copilot: null,
};

/**
 * Hook-ready helper: normaliza el plan_base del contexto Auth a PlanBase.
 * Acepta strings provenientes de la DB como 'glow_pro', 'glow_elite', etc.
 */
export const normalizeToPlanBase = (plan: string | undefined | null): PlanBase => {
  const p = (plan || '').toLowerCase().replace(' ', '_');
  if (['glow_pro', 'pro', 'automatico', 'korat'].includes(p)) return 'pro';
  if (['glow_elite', 'copilot', 'nilah_copilot', 'vip', 'premium'].includes(p)) return 'copilot';
  return 'basico';
};
