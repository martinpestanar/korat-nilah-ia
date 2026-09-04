/**
 * ============================================================
 * SERVICIO: Nilah Autopilot Mission Control
 * Lee y controla nilah_autopilot_log + nilah_config
 * Multi-tenant: filtra por business_id cuando aplica
 * ============================================================
 */
import { supabase } from '@/services/supabase';

// ─── Tipos ───────────────────────────────────────────────────

export type FlujoOrigen =
  | 'retencion'
  | 'recordatorio_24h'
  | 'recordatorio_3h'
  | 'retoque'
  | 'fidelizacion'
  | 'rescate_45d'
  | 'rescate_75d'
  | 'rescate_120d'
  | 'cumpleanos'
  | 'campana_marketing';

// Flujos en el JSONB usan estas claves (recordatorios 24h y 3h comparten una)
export type FlujoScheduleKey = 'retencion' | 'recordatorios' | 'retoque' | 'fidelizacion' | 'rescate' | 'cumpleanos';

export type EstadoLog =
  | 'pendiente'
  | 'enviado'
  | 'bloqueado_cooldown'
  | 'bloqueado_ia'
  | 'error'
  | 'bloqueado_config'
  | 'simulacion';

/** Horario dinámico de un flujo: qué días y a qué horas corre */
export interface FlujoSchedule {
  activo: boolean;
  /** 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb */
  dias: number[];
  /** Array de horas en formato "HH:MM" */
  horas: string[];
}

export type AutopilotSchedules = Record<FlujoScheduleKey, FlujoSchedule>;

export interface AutopilotLog {
  id: number;
  created_at: string;
  updated_at: string;
  flujo_origen: FlujoOrigen;
  business_id: string | null;
  cliente_id: number | null;
  cita_id: number | null;
  telefono: string | null;
  tipo_mensaje: string | null;
  mensaje_preview: string | null;
  mensaje_completo: string | null;
  es_simulacion: boolean;
  estado: EstadoLog;
  razon_bloqueo: string | null;
  execution_id: string | null;
  metadata: Record<string, unknown>;
}

export interface AutopilotConfig {
  id: number;
  pausa_global: boolean;
  pausa_retencion: boolean;
  pausa_recordatorio_24h: boolean;
  pausa_recordatorio_3h: boolean;
  pausa_retoque: boolean;
  pausa_fidelizacion: boolean;
  limite_diario_por_negocio: number;
  limite_total_por_ejecucion: number;
  modo_simulacion: boolean;
  // Schedules (legacy – mantenidos para compatibilidad)
  hora_retencion: string;
  hora_recordatorio_24h: string;
  hora_recordatorio_3h: string;
  hora_retoque: string;
  hora_fidelizacion: string;
  // Schedules dinámicos (nuevo)
  autopilot_schedules: AutopilotSchedules | null;
  modificado_por: string | null;
  notas: string | null;
  updated_at: string;
}

export interface LogResumenHoy {
  flujo_origen: string;
  estado: string;
  total: number;
  negocios_afectados: number;
  ultimo_evento: string;
}

export interface FiltrosLog {
  flujo?: FlujoOrigen | null;
  estado?: EstadoLog | null;
  business_id?: string | null;
  desde?: string | null;
  limite?: number;
}

// ─── Helpers de schedule ─────────────────────────────────────

/** Devuelve el schedule key que corresponde a un FlujoOrigen */
export function flujoToScheduleKey(flujo: FlujoOrigen): FlujoScheduleKey {
  if (flujo === 'recordatorio_24h' || flujo === 'recordatorio_3h') return 'recordatorios';
  return flujo as FlujoScheduleKey;
}

/** Schedule por defecto (7am-11pm, todos los días) */
export function defaultSchedule(): FlujoSchedule {
  return {
    activo: true,
    dias: [0, 1, 2, 3, 4, 5, 6],
    horas: ['07:00','08:00','09:00','10:00','11:00','12:00','13:00',
            '14:00','15:00','16:00','17:00','18:00','19:00','20:00',
            '21:00','22:00','23:00'],
  };
}

/** Genera autopilot_schedules con todos los flujos si aún no existe */
export function resolveSchedules(config: AutopilotConfig): AutopilotSchedules {
  const def = defaultSchedule();
  const base = (config.autopilot_schedules || {}) as Partial<AutopilotSchedules>;
  return {
    retencion:     base.retencion     ?? def,
    recordatorios: base.recordatorios ?? def,
    retoque:       base.retoque       ?? def,
    fidelizacion:  base.fidelizacion  ?? def,
    rescate:       base.rescate       ?? def,
    cumpleanos:    base.cumpleanos    ?? def,
  };
}

// ─── Config: leer ────────────────────────────────────────────

export async function fetchAutopilotConfig(): Promise<AutopilotConfig> {
  const { data, error } = await supabase
    .from('nilah_config')
    .select('*')
    .order('id', { ascending: true })
    .limit(1)
    .single();
  if (error) throw error;
  return data as AutopilotConfig;
}

// ─── Config: actualizar ───────────────────────────────────────

export async function updateAutopilotConfig(
  updates: Partial<Omit<AutopilotConfig, 'id' | 'updated_at'>>,
  modificado_por = 'super_admin'
): Promise<void> {
  const { error } = await supabase
    .from('nilah_config')
    .update({ ...updates, modificado_por })
    .gte('id', 1); // actualiza el singleton
  if (error) throw error;
}

// ─── Pausa rápida (toggle global) ────────────────────────────

export async function togglePausaGlobal(pausa: boolean): Promise<void> {
  await updateAutopilotConfig({
    pausa_global: pausa,
    notas: pausa
      ? `Sistema PAUSADO manualmente — ${new Date().toLocaleString('es-PE')}`
      : `Sistema REACTIVADO — ${new Date().toLocaleString('es-PE')}`,
  });
}

export async function togglePausaFlujo(
  flujo: FlujoOrigen,
  pausa: boolean
): Promise<void> {
  const key = `pausa_${flujo}` as keyof AutopilotConfig;
  await updateAutopilotConfig({ [key]: pausa } as any);
}

// ─── Schedule dinámico: actualizar un flujo ──────────────────

/**
 * Actualiza el horario de un flujo específico en autopilot_schedules.
 * Lee el objeto completo, lo modifica y lo vuelve a guardar (upsert parcial).
 */
export async function updateFlujSchedule(
  flujoKey: FlujoScheduleKey,
  schedule: FlujoSchedule,
  currentConfig: AutopilotConfig
): Promise<void> {
  const current = resolveSchedules(currentConfig);
  const updated: AutopilotSchedules = {
    ...current,
    [flujoKey]: schedule,
  };
  await updateAutopilotConfig({ autopilot_schedules: updated });
}

// ─── Logs: leer ──────────────────────────────────────────────

export async function fetchLogs(filtros: FiltrosLog = {}): Promise<AutopilotLog[]> {
  let q = supabase
    .from('nilah_autopilot_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filtros.limite ?? 200);

  if (filtros.flujo)       q = q.eq('flujo_origen', filtros.flujo);
  if (filtros.estado)      q = q.eq('estado', filtros.estado);
  if (filtros.business_id) q = q.eq('business_id', filtros.business_id);
  if (filtros.desde)       q = q.gte('created_at', filtros.desde);

  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as AutopilotLog[];
}

export async function fetchLogsHoy(business_id?: string): Promise<AutopilotLog[]> {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fetchLogs({
    desde: hoy.toISOString(),
    business_id: business_id ?? null,
    limite: 500,
  });
}

export async function fetchResumenHoy(): Promise<LogResumenHoy[]> {
  const { data, error } = await supabase
    .from('nilah_log_resumen_hoy')
    .select('*');
  if (error) throw error;
  return (data || []) as LogResumenHoy[];
}

// ─── Stats derivadas ─────────────────────────────────────────

export interface AutopilotStats {
  total_hoy: number;
  enviados_hoy: number;
  bloqueados_hoy: number;
  errores_hoy: number;
  por_flujo: Record<string, { enviados: number; bloqueados: number; errores: number }>;
  tasa_exito: number;
}

export function calcularStatsAutopilot(logs: AutopilotLog[]): AutopilotStats {
  const stats: AutopilotStats = {
    total_hoy: logs.length,
    enviados_hoy: 0,
    bloqueados_hoy: 0,
    errores_hoy: 0,
    por_flujo: {},
    tasa_exito: 0,
  };

  for (const log of logs) {
    const f = log.flujo_origen || 'desconocido';
    if (!stats.por_flujo[f]) stats.por_flujo[f] = { enviados: 0, bloqueados: 0, errores: 0 };

    if (log.estado === 'enviado') {
      stats.enviados_hoy++;
      stats.por_flujo[f].enviados++;
    } else if (log.estado.startsWith('bloqueado')) {
      stats.bloqueados_hoy++;
      stats.por_flujo[f].bloqueados++;
    } else if (log.estado === 'error') {
      stats.errores_hoy++;
      stats.por_flujo[f].errores++;
    }
  }

  stats.tasa_exito =
    stats.total_hoy > 0
      ? Math.round((stats.enviados_hoy / stats.total_hoy) * 100)
      : 0;

  return stats;
}

// ─── Webhook paths por flujo ──────────────────────────────────

// ─── Webhook paths por flujo ──────────────────────────────────

const N8N_BASE = import.meta.env.VITE_API_URL ?? 'https://hooks.koratflow.agency/webhook';

const FLUJO_WEBHOOK: Record<string, string> = {
  retencion:        `${N8N_BASE}/test-retencion`,
  recordatorio_24h: `${N8N_BASE}/test-recordatorio-24h`,
  recordatorio_3h:  `${N8N_BASE}/test-recordatorio-24h`,
  retoque:          `${N8N_BASE}/test-retoque`,
  fidelizacion:     `${N8N_BASE}/test-fidelizacion`,
  rescate_45d:      `${N8N_BASE}/test-rescate-45d`,
  rescate_75d:      `${N8N_BASE}/test-rescate-75d`,
  rescate_120d:     `${N8N_BASE}/test-rescate-120d`,
  cuidados_24h:     `${N8N_BASE}/test-cuidados`,
};

// ─── Test Run en Producción & Simulación Real ────────────────

export interface TestRunParams {
  flujo: FlujoOrigen | string;
  business_id?: string;
  cliente_id?: number;
  telefono_prueba?: string;
  modo_simulacion?: boolean;
}

export interface TestRunResult {
  ok: boolean;
  mensaje?: string;
  log_id?: number;
  error?: string;
  estado?: string;
  telefono?: string;
  execution_id?: string;
}

export interface NegocioAutopilotStatus {
  id: string;
  nombre: string;
  timezone: string;
  instance_name: string | null;
  api_key: string | null;
  evo_status: 'conectado' | 'disconnected' | string;
  telefono_recepcionista: string | null;
}

export interface CitaRecientePrueba {
  cita_id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio: string;
  fecha_iso: string;
  fecha_formateada: string;
  hora_formateada: string;
  especialista: string;
  estado: string;
}

export interface TestProductionParams {
  business_id: string;
  flujo: string;
  telefono_destino: string;
  nombre_cliente: string;
  servicio: string;
  fecha_cita?: string;
  hora_cita?: string;
  especialista?: string;
  cita_id?: number | null;
  es_simulacion?: boolean;
}

export interface Tiempo2Params {
  business_id: string;
  telefono_cliente: string;
  nota: string;
  nombre_cliente?: string;
  servicio?: string;
  es_simulacion?: boolean;
}

/** Obtiene todos los negocios con su estado de conexión de Evolution API */
export async function fetchNegociosAutopilot(): Promise<NegocioAutopilotStatus[]> {
  const { data, error } = await supabase.rpc('get_negocios_autopilot_status');
  if (error) {
    console.error('Error fetching get_negocios_autopilot_status:', error);
    // Fallback directo a la tabla negocios
    const { data: fallback } = await supabase.from('negocios').select('id, nombre, timezone');
    return (fallback || []).map(f => ({
      id: f.id,
      nombre: f.nombre,
      timezone: f.timezone || 'America/Lima',
      instance_name: null,
      api_key: null,
      evo_status: 'disconnected',
      telefono_recepcionista: null,
    }));
  }
  return data as NegocioAutopilotStatus[];
}

/** Carga las últimas citas de un salón para auto-rellenar datos del simulador */
export async function fetchCitasRecientes(business_id: string): Promise<CitaRecientePrueba[]> {
  const { data, error } = await supabase.rpc('get_citas_recientes_prueba', {
    p_business_id: business_id,
  });
  if (error) {
    console.warn('Error fetching get_citas_recientes_prueba:', error);
    return [];
  }
  return (data || []) as CitaRecientePrueba[];
}

/** Dispara una prueba en producción usando la plantilla del salón y Evolution API */
export async function dispararPruebaProduccion(params: TestProductionParams): Promise<TestRunResult> {
  const { data, error } = await supabase.rpc('disparar_prueba_autopilot_produccion', {
    p_business_id: params.business_id,
    p_flujo: params.flujo,
    p_telefono_destino: params.telefono_destino,
    p_nombre_cliente: params.nombre_cliente,
    p_servicio: params.servicio,
    p_fecha_cita: params.fecha_cita || 'mañana',
    p_hora_cita: params.hora_cita || '16:00',
    p_especialista: params.especialista || 'Staff',
    p_cita_id: params.cita_id ?? null,
    p_es_simulacion: params.es_simulacion ?? false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: (data as any)?.success ?? true,
    mensaje: (data as any)?.mensaje,
    telefono: (data as any)?.telefono || params.telefono_destino,
    log_id: (data as any)?.log_id,
    estado: (data as any)?.estado,
    error: (data as any)?.error,
  };
}

/** Simula o envía el Tiempo 2 de Fidelización (Puntos vs Queja) */
export async function simularRespuestaTiempo2(params: Tiempo2Params): Promise<{
  ok: boolean;
  mensaje?: string;
  tipo?: string;
  nota?: string;
  telefono?: string;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('simular_respuesta_tiempo2_fidelizacion', {
    p_business_id: params.business_id,
    p_telefono_cliente: params.telefono_cliente,
    p_nota: params.nota,
    p_nombre_cliente: params.nombre_cliente || 'Valeria',
    p_servicio: params.servicio || 'Lifting de Pestañas',
    p_es_simulacion: params.es_simulacion ?? false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: (data as any)?.success ?? true,
    mensaje: (data as any)?.mensaje,
    tipo: (data as any)?.tipo,
    nota: (data as any)?.nota,
    telefono: (data as any)?.telefono,
    error: (data as any)?.error,
  };
}

export async function triggerTestRun(params: TestRunParams): Promise<TestRunResult> {
  const url = FLUJO_WEBHOOK[params.flujo] || `${N8N_BASE}/test-${params.flujo}`;
  const esSimulacion = params.modo_simulacion !== false;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_mode: true,
        flujo: params.flujo,
        business_id: params.business_id ?? null,
        cliente_id: params.cliente_id ?? null,
        telefono_prueba: params.telefono_prueba ?? null,
        modo_simulacion: esSimulacion,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `n8n respondió ${res.status}: ${txt.slice(0, 200)}` };
    }

    // Esperar a que n8n procese y guarde el log
    await new Promise(r => setTimeout(r, 4500));

    const hace2min = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    let query = supabase
      .from('nilah_autopilot_log')
      .select('id, mensaje_completo, estado, flujo_origen, telefono, execution_id')
      .gte('created_at', hace2min)
      .order('created_at', { ascending: false })
      .limit(1);

    if (params.business_id) {
      query = query.eq('business_id', params.business_id);
    }

    const { data } = await query.maybeSingle();

    return {
      ok: true,
      mensaje: data?.mensaje_completo ?? '(Flujo ejecutado en n8n con éxito. Verifica el log en unos segundos).',
      log_id: data?.id,
      estado: data?.estado ?? (esSimulacion ? 'simulacion' : 'enviado'),
      telefono: data?.telefono || params.telefono_prueba,
      execution_id: data?.execution_id || undefined,
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Schedule legacy: compatibilidad ─────────────────────────
/** @deprecated Usa updateFlujSchedule en su lugar */
export async function updateSchedule(
  flujo: FlujoOrigen,
  hora: string
): Promise<void> {
  const key = `hora_${flujo}` as keyof AutopilotConfig;
  await updateAutopilotConfig({ [key]: hora } as any);
}
