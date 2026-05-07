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
  | 'fidelizacion';

// Flujos en el JSONB usan estas claves (recordatorios 24h y 3h comparten una)
export type FlujoScheduleKey = 'retencion' | 'recordatorios' | 'retoque' | 'fidelizacion';

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
  const base = config.autopilot_schedules ?? {};
  return {
    retencion:     base.retencion     ?? def,
    recordatorios: base.recordatorios ?? def,
    retoque:       base.retoque       ?? def,
    fidelizacion:  base.fidelizacion  ?? def,
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

const N8N_BASE = import.meta.env.VITE_API_URL ?? 'https://hooks.koratflow.agency/webhook';

const FLUJO_WEBHOOK: Record<FlujoOrigen, string> = {
  retencion:        `${N8N_BASE}/test-retencion`,
  recordatorio_24h: `${N8N_BASE}/test-recordatorio-24h`,
  recordatorio_3h:  `${N8N_BASE}/test-recordatorio-24h`, // mismo flujo
  retoque:          `${N8N_BASE}/test-retoque`,
  fidelizacion:     `${N8N_BASE}/test-fidelizacion`,
};

// ─── Test Run ─────────────────────────────────────────────────

export interface TestRunParams {
  flujo: FlujoOrigen;
  business_id?: string;
  cliente_id?: number;
}

export interface TestRunResult {
  ok: boolean;
  mensaje?: string;
  log_id?: number;
  error?: string;
}

export async function triggerTestRun(params: TestRunParams): Promise<TestRunResult> {
  const url = FLUJO_WEBHOOK[params.flujo];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_mode: true,
        flujo:       params.flujo,
        business_id: params.business_id ?? null,
        cliente_id:  params.cliente_id  ?? null,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `n8n respondió ${res.status}: ${txt.slice(0, 200)}` };
    }

    // Esperar 6s para dar tiempo a n8n de procesar y guardar el log
    await new Promise(r => setTimeout(r, 6000));

    // El flujo recordatorio_3h comparte el mismo workflow de n8n que recordatorio_24h,
    // por lo que puede guardar flujo_origen como 'recordatorio_24h'.
    const flujoAliases: string[] =
      params.flujo === 'recordatorio_3h'
        ? ['recordatorio_3h', 'recordatorio_24h']
        : [params.flujo];

    const hace2min = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('nilah_autopilot_log')
      .select('id, mensaje_completo, estado, flujo_origen')
      .in('flujo_origen', flujoAliases)
      .eq('es_simulacion', true)
      .gte('created_at', hace2min)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ok: true,
      mensaje: data?.mensaje_completo ?? '(Flujo disparado — aún procesando)',
      log_id: data?.id,
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
