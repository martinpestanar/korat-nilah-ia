/**
 * ============================================================
 * SERVICIO: Auditoría y Monitoreo de Errores en Tiempo Real
 * Consume public.errores_bot y nilah_autopilot_log (estado='error')
 * ============================================================
 */
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ErrorRecord {
  id: number | string;
  source: 'n8n_bot' | 'autopilot';
  created_at: string;
  business_id: string | null;
  business_nombre?: string;
  workflow_name: string;
  nodo_fallido?: string;
  mensaje_error: string;
  execution_id?: string | null;
  output_original?: string | null;
  mensaje_usuario?: string | null;
  metadata?: Record<string, any>;
  cita_id?: number | null;
  cliente_id?: number | null;
  telefono?: string | null;
}

export interface ErrorStats {
  totalHoy: number;
  totalSemana: number;
  negociosAfectados: number;
  n8nErrors: number;
  autopilotErrors: number;
}

export async function fetchAllErrors(businessId?: string): Promise<ErrorRecord[]> {
  try {
    // 1. Fetch from errores_bot
    let qBot = supabase
      .from('errores_bot')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (businessId) {
      qBot = qBot.eq('business_id', businessId);
    }

    // 2. Fetch from nilah_autopilot_log where estado = 'error'
    let qAuto = supabase
      .from('nilah_autopilot_log')
      .select('*')
      .eq('estado', 'error')
      .order('created_at', { ascending: false })
      .limit(100);

    if (businessId) {
      qAuto = qAuto.eq('business_id', businessId);
    }

    // 3. Fetch businesses map for names
    const { data: businesses } = await supabase
      .from('negocios')
      .select('id, nombre');

    const businessMap = new Map<string, string>();
    businesses?.forEach(b => businessMap.set(b.id, b.nombre));

    const [resBot, resAuto] = await Promise.all([qBot, qAuto]);

    const items: ErrorRecord[] = [];

    if (resBot.data) {
      resBot.data.forEach((row: any) => {
        items.push({
          id: `bot_${row.id}`,
          source: 'n8n_bot',
          created_at: row.created_at,
          business_id: row.business_id,
          business_nombre: row.business_id ? businessMap.get(row.business_id) || 'Salón desconocido' : 'Sistema Global / n8n',
          workflow_name: row.workflow_name || 'Workflow Global',
          nodo_fallido: row.nodo_fallido,
          mensaje_error: row.mensaje_error || 'Error sin descripción',
          execution_id: row.execution_id,
          output_original: row.output_original,
          mensaje_usuario: row.mensaje_usuario,
        });
      });
    }

    if (resAuto.data) {
      resAuto.data.forEach((row: any) => {
        items.push({
          id: `auto_${row.id}`,
          source: 'autopilot',
          created_at: row.created_at,
          business_id: row.business_id,
          business_nombre: row.business_id ? businessMap.get(row.business_id) || 'Salón desconocido' : 'Autopilot Motor',
          workflow_name: `Autopilot: ${row.flujo_origen || 'General'}`,
          nodo_fallido: row.tipo_mensaje || 'Motor RPC',
          mensaje_error: row.razon_bloqueo || (row.metadata?.error as string) || 'Fallo en envío de autopilot',
          execution_id: row.execution_id,
          metadata: row.metadata,
          cita_id: row.cita_id,
          cliente_id: row.cliente_id,
          telefono: row.telefono,
        });
      });
    }

    // Sort by created_at descending
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return items;
  } catch (err) {
    console.error('Error fetching error logs:', err);
    return [];
  }
}

export function computeErrorStats(errors: ErrorRecord[]): ErrorStats {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalHoy = 0;
  let totalSemana = 0;
  let n8nErrors = 0;
  let autopilotErrors = 0;
  const uniqueBiz = new Set<string>();

  errors.forEach(e => {
    const eDate = new Date(e.created_at);
    if (e.created_at.startsWith(todayStr)) {
      totalHoy++;
    }
    if (eDate >= weekAgo) {
      totalSemana++;
    }
    if (e.source === 'n8n_bot') {
      n8nErrors++;
    } else {
      autopilotErrors++;
    }
    if (e.business_id) {
      uniqueBiz.add(e.business_id);
    }
  });

  return {
    totalHoy,
    totalSemana,
    negociosAfectados: uniqueBiz.size,
    n8nErrors,
    autopilotErrors,
  };
}

export function subscribeToErrors(
  onNewError: (err: ErrorRecord) => void
): () => void {
  let channel: RealtimeChannel | null = null;

  try {
    channel = supabase
      .channel('realtime_error_auditor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'errores_bot' },
        (payload) => {
          const row = payload.new as any;
          const formatted: ErrorRecord = {
            id: `bot_${row.id}`,
            source: 'n8n_bot',
            created_at: row.created_at || new Date().toISOString(),
            business_id: row.business_id,
            workflow_name: row.workflow_name || 'Workflow Global',
            nodo_fallido: row.nodo_fallido,
            mensaje_error: row.mensaje_error || 'Error sin descripción',
            execution_id: row.execution_id,
            output_original: row.output_original,
            mensaje_usuario: row.mensaje_usuario,
          };
          onNewError(formatted);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nilah_autopilot_log' },
        (payload) => {
          const row = payload.new as any;
          if (row.estado === 'error') {
            const formatted: ErrorRecord = {
              id: `auto_${row.id}`,
              source: 'autopilot',
              created_at: row.created_at || new Date().toISOString(),
              business_id: row.business_id,
              workflow_name: `Autopilot: ${row.flujo_origen || 'General'}`,
              nodo_fallido: row.tipo_mensaje || 'Motor RPC',
              mensaje_error: row.razon_bloqueo || (row.metadata?.error as string) || 'Fallo en envío de autopilot',
              execution_id: row.execution_id,
              metadata: row.metadata,
              cita_id: row.cita_id,
              cliente_id: row.cliente_id,
              telefono: row.telefono,
            };
            onNewError(formatted);
          }
        }
      )
      .subscribe();
  } catch (e) {
    console.error('Failed to subscribe to error realtime channel:', e);
  }

  return () => {
    if (channel) {
      supabase.removeChannel(channel).catch(() => {});
    }
  };
}
