/**
 * ============================================================
 * CORE FOUNDATION: SaaS Configuration Normalizer (Non-Destructive)
 * ============================================================
 * Resuelve la sincronización entre:
 *   1. negocios.recursos_saas (RecursosSaaSV2)
 *   2. negocios.bot_config (flujos_activos y bot_enabled)
 *   3. sellos_config.addons_activos (preservando temporadas_premios y guardian_cierre)
 *   4. negocios.modo_fidelizacion ('sellos' | 'puntos' | 'ambos' | 'ninguno')
 *
 * Auditado bajo el protocolo Elephant-Goldfish Model (EGM #001).
 */

import type { PlanBase, EstadoNegocio, RecursosSaaSV2 } from '../../types/godmode';
import { PLAN_PRESET } from '../../types/godmode';

export type ModoFidelizacionCanonical = 'sellos' | 'puntos' | 'ambos' | 'ninguno';

/**
 * Normaliza cualquier variante histórica de nombre de plan al esquema canónico V2.
 */
export function normalizePlanCanonical(raw: string | null | undefined): PlanBase {
  const p = (raw || '').toLowerCase().trim();
  if (
    ['glow_pro', 'pro', 'glow pro', 'plan pro', 'pro 360', 'glow_pro_360', 'copilot', 'elite', 'glow elite'].includes(p) ||
    p.includes('pro') ||
    p.includes('copilot') ||
    p.includes('elite')
  ) {
    return 'glow_pro';
  }
  return 'glow';
}

/**
 * Normaliza el estado operativo de un salón.
 */
export function normalizeEstadoCanonical(raw: string | null | undefined): EstadoNegocio {
  const e = (raw || '').toLowerCase().trim();
  if (['suspendido', 'suspended', 'inactivo'].includes(e)) return 'suspendido';
  if (['trial', 'prueba', 'demo'].includes(e)) return 'trial';
  if (['cancelado', 'baja'].includes(e)) return 'cancelado';
  return 'activo';
}

/**
 * Normaliza el modo de fidelización respetando explícitamente 'ninguno'.
 */
export function normalizeModoFidelizacion(
  rawModo: string | null | undefined,
  recursos?: Partial<RecursosSaaSV2> | null
): ModoFidelizacionCanonical {
  const m = (rawModo || '').toLowerCase().trim();
  if (m === 'ninguno' || m === 'off' || m === 'none') return 'ninguno';
  if (m === 'sellos') return 'sellos';
  if (m === 'ambos') return 'ambos';
  if (m === 'puntos') return 'puntos';

  // Fallback inteligente si la columna viene vacía
  if ((recursos?.sellos_addons as any)?.calificaciones_integradas) {
    return 'sellos';
  }
  return 'puntos';
}

/**
 * Deep merge recursivo inmutable para hidratar recursos_saas con el preset del plan.
 */
export function deepMergeConfig<T extends Record<string, any>>(base: T, override: any): T {
  if (!override || typeof override !== 'object') return base;
  const result: Record<string, any> = { ...base };
  for (const key of Object.keys(override)) {
    const ovVal = override[key];
    const baseVal = base[key];
    if (
      ovVal !== null &&
      typeof ovVal === 'object' &&
      !Array.isArray(ovVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMergeConfig(baseVal, ovVal);
    } else if (ovVal !== undefined) {
      result[key] = ovVal;
    }
  }
  return result as T;
}

/**
 * Hidrata un objeto recursos_saas desde la BD combinándolo de forma segura con su PLAN_PRESET.
 */
export function hydrateRecursosSaaS(
  planRaw: string | null | undefined,
  rawRecursos: any
): RecursosSaaSV2 {
  const plan = normalizePlanCanonical(planRaw || rawRecursos?.plan_base || rawRecursos?.plan);
  const preset = PLAN_PRESET[plan] || PLAN_PRESET.glow;
  if (!rawRecursos || typeof rawRecursos !== 'object') {
    return { ...preset, plan_base: plan };
  }
  const merged = deepMergeConfig(preset, rawRecursos);
  merged.plan_base = plan;
  return merged;
}

/**
 * Construye de forma NO-DESTRUCTIVA el objeto `addons_activos` para la tabla `sellos_config`.
 * Preserva configuraciones complejas como `temporadas_premios` y `guardian_cierre`
 * que se editan desde ClubGlow.tsx (Detectado por Auditoría Goldfish EGM #001).
 */
export function buildNonDestructiveSellosAddons(
  existingAddonsActivos: Record<string, any> | null | undefined,
  sellosAddonsFromRecursos: NonNullable<RecursosSaaSV2['sellos_addons']> | undefined
): {
  addons_activos: Record<string, any>;
  acelerador_martes: boolean;
} {
  const current =
    existingAddonsActivos && typeof existingAddonsActivos === 'object'
      ? { ...existingAddonsActivos }
      : {};
  const sAddons = (sellosAddonsFromRecursos || {}) as Record<string, any>;

  const diasMuertos = Boolean(sAddons.dias_muertos_doble ?? sAddons.dias_muertos ?? current.dias_muertos ?? false);

  // Preservar estructura de objeto en guardian_cierre si ya existía como objeto en ClubGlow
  const cierreAlertaBool = Boolean(
    sAddons.cierre_diario_alerta ??
      (typeof current.guardian_cierre === 'object' ? current.guardian_cierre?.activo : current.guardian_cierre) ??
      false
  );
  const guardianCierreMerged =
    typeof current.guardian_cierre === 'object' && current.guardian_cierre !== null
      ? { ...current.guardian_cierre, activo: cierreAlertaBool }
      : cierreAlertaBool;

  const mergedAddons: Record<string, any> = {
    ...current, // Preserva temporadas_premios y cualquier otra llave existente
    recordatorio: Boolean(sAddons.proxima_cita_reminder ?? sAddons.recordatorio ?? current.recordatorio ?? false),
    reactivacion: Boolean(sAddons.alerta_vencimiento ?? sAddons.reactivacion ?? current.reactivacion ?? false),
    cumpleanos: Boolean(sAddons.cumpleanos_vip ?? sAddons.cumpleanos ?? current.cumpleanos ?? false),
    referidas: Boolean(sAddons.referidos_sellos ?? sAddons.referidas ?? current.referidas ?? false),
    dias_muertos: diasMuertos,
    iman_rescate: Boolean(sAddons.rescate_ausentes ?? sAddons.iman_rescate ?? current.iman_rescate ?? false),
    cierre_rapido: Boolean(sAddons.cierre_rapido_whatsapp ?? sAddons.cierre_rapido ?? current.cierre_rapido ?? false),
    roi_dashboard: Boolean(sAddons.roi_metrics_dashboard ?? sAddons.roi_dashboard ?? current.roi_dashboard ?? false),
    guardian_cierre: guardianCierreMerged,
  };

  return {
    addons_activos: mergedAddons,
    acelerador_martes: diasMuertos,
  };
}

/**
 * Construye de forma NO-DESTRUCTIVA el objeto `bot_config` para la tabla `negocios`.
 * Respeta las claves exactas de `automatizaciones` (plural/femenino/masculino) e incluye
 * `calificacion` y `fidelizacion_directa` sin destruir llaves previas como `consentimiento`.
 */
export function buildNonDestructiveBotConfig(
  existingBotConfig: Record<string, any> | null | undefined,
  recursos: RecursosSaaSV2,
  modoFidelizacion?: ModoFidelizacionCanonical | null
): Record<string, any> {
  const currentBot =
    existingBotConfig && typeof existingBotConfig === 'object' ? { ...existingBotConfig } : {};
  const currentFlujos =
    currentBot.flujos_activos && typeof currentBot.flujos_activos === 'object'
      ? { ...currentBot.flujos_activos }
      : {};

  const auto = recursos.automatizaciones;
  const modAuto = recursos.modulos?.automatizaciones;
  const isAutoModuleActive = modAuto?.activo !== false;

  const isMantenimientoOn =
    isAutoModuleActive && Boolean(auto?.permitir_mantenimiento && (auto?.mantenimiento_activo ?? true));
  const isRecordatoriosOn =
    isAutoModuleActive && Boolean(auto?.permitir_recordatorios && (auto?.recordatorios_activos ?? true));
  const isRescateOn =
    isAutoModuleActive && Boolean(auto?.permitir_rescate && (auto?.rescate_activo ?? true));
  const isCuidadosOn =
    isAutoModuleActive && Boolean(auto?.permitir_cuidados && (auto?.cuidados_activo ?? true));
  const isCumpleanosOn =
    isAutoModuleActive &&
    Boolean(
      (auto?.permitir_cumpleanos && (auto?.cumpleanos_activo ?? true)) ||
        recursos.sellos_addons?.cumpleanos_vip
    );

  const isCalificacionOn =
    isAutoModuleActive &&
    Boolean(
      (auto?.permitir_calificacion && (auto?.calificacion_activa ?? true)) ||
        (auto?.permitir_post_cita && (auto?.post_cita_activo ?? true)) ||
        (recursos.sellos_addons as any)?.calificaciones_integradas
    );

  const isFidelizacionOn =
    modoFidelizacion === 'ninguno'
      ? false
      : modoFidelizacion === 'sellos' || modoFidelizacion === 'ambos'
      ? true
      : isAutoModuleActive &&
        Boolean(
          (auto?.permitir_post_cita && (auto?.post_cita_activo ?? true)) ||
            (auto?.permitir_fidelizacion_directa && (auto?.fidelizacion_directa_activa ?? true))
        );

  const mergedFlujos: Record<string, any> = {
    ...currentFlujos, // Preserva llaves personalizadas como 'consentimiento'
    mantenimiento: isMantenimientoOn,
    retoques: isMantenimientoOn,
    recordatorios: isRecordatoriosOn,
    rescate: isRescateOn,
    fidelizacion: isFidelizacionOn,
    calificacion: isCalificacionOn,
    cuidados: isCuidadosOn,
    cumpleanos: isCumpleanosOn,
  };

  const hasAnyActive = Object.values(mergedFlujos).some(v => v === true);

  return {
    ...currentBot,
    bot_enabled: hasAnyActive,
    flujos_activos: mergedFlujos,
  };
}
