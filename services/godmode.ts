/**
 * ============================================================
 * SERVICIO: God-Mode Super Admin
 * Datos directo a Supabase (sin n8n)
 * ============================================================
 */
import { createClient } from '@supabase/supabase-js';
import type {
  NegocioAdmin, OnboardingTokenAdmin, PrecioSuscripcion,
  RecursosSaaSV2, PlanBase, EstadoNegocio
} from '../types/godmode';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Negocios ─────────────────────────────────────────────────

/**
 * Normaliza el valor legacy del campo plan_suscripcion al nuevo esquema
 *   'automatico' | 'Pro' | 'pro' → 'korat'
 *   'nilah_copilot' | 'vip' | 'copilot' → 'copilot'
 *   cualquier otro (manual, basico, Starter, nil) → 'nilah'
 */
function normalizePlan(raw: string | null | undefined): PlanBase {
  const p = (raw || '').toLowerCase().trim();
  if (['korat', 'pro', 'automatico', 'auto'].includes(p)) return 'korat';
  if (['copilot', 'nilah_copilot', 'vip', 'premium'].includes(p)) return 'copilot';
  return 'nilah';
}

function normalizeEstado(raw: string | null | undefined): EstadoNegocio {
  const e = (raw || '').toLowerCase().trim();
  if (['suspendido', 'suspended', 'inactivo'].includes(e)) return 'suspendido';
  if (['trial', 'prueba', 'demo'].includes(e)) return 'trial';
  if (['cancelado', 'baja'].includes(e)) return 'cancelado';
  return 'activo';
}

export async function fetchNegocios(): Promise<NegocioAdmin[]> {
  const { data, error } = await supabase
    .rpc('superadmin_fetch_all_negocios');

  if (error) throw error;

  return (data || []).map((n: any) => ({
    ...n,
    recursos_saas: n.recursos_saas || {},
    plan: normalizePlan(n.plan),
    estado: normalizeEstado(n.estado),
    destellos_disponibles: n.destellos_disponibles ?? 0,
    destellos_limite_mensual: n.destellos_limite_mensual ?? 0,
    owner: typeof n.owner === 'string' ? JSON.parse(n.owner) : n.owner,
  }));
}

export async function fetchNegocioById(id: string): Promise<NegocioAdmin | null> {
  const { data, error } = await supabase
    .from('v_superadmin_negocios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as NegocioAdmin;
}

// ─── Actualizar negocio ───────────────────────────────────────

export async function updateNegocioFull(
  negocioId: string,
  updates: {
    recursos?: RecursosSaaSV2;
    tipo_fidelizacion?: string;
    plan?: string;
    estado?: EstadoNegocio;
    destellos_disponibles?: number;
    destellos_limite_mensual?: number;
  }
): Promise<void> {
  const { error } = await supabase.rpc('superadmin_update_negocio_full', {
    p_negocio_id: negocioId,
    p_recursos: updates.recursos || null,
    p_tipo_fidelizacion: updates.tipo_fidelizacion || null,
    p_plan: updates.plan || null,
    p_estado: updates.estado || null,
    p_destellos_disponibles: updates.destellos_disponibles ?? null,
    p_destellos_limite_mensual: updates.destellos_limite_mensual ?? null,
  });
  if (error) throw error;
}

// ─── Destellos ───────────────────────────────────────────────

export async function resetDestellos(negocioId: string, cantidad?: number): Promise<void> {
  const { error } = await supabase.rpc('superadmin_reset_destellos', {
    p_negocio_id: negocioId,
    p_cantidad: cantidad ?? null,
  });
  if (error) throw error;
}

export async function resetDestellosMensual(): Promise<{ negocio_id: string; nombre: string; destellos_asignados: number }[]> {
  const { data, error } = await supabase.rpc('superadmin_reset_destellos_mensual');
  if (error) throw error;
  return data || [];
}

// ─── Onboarding tokens ───────────────────────────────────────

export async function fetchOnboardingTokens(): Promise<OnboardingTokenAdmin[]> {
  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createOnboardingToken(params: {
  email: string;
  nombre_salon?: string;
  plan_inicial?: PlanBase;
  whatsapp?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('superadmin_create_onboarding_token', {
    p_email: params.email,
    p_nombre_salon: params.nombre_salon || null,
    p_plan_inicial: params.plan_inicial || 'nilah',
    p_whatsapp: params.whatsapp || null,
  });
  if (error) throw error;
  return data as string;
}

// ─── Usuarios del negocio ─────────────────────────────────────

export async function fetchUsuariosNegocio(businessId: string) {
  const { data, error } = await supabase.rpc('superadmin_get_usuarios_negocio', {
    p_business_id: businessId,
  });
  if (error) throw error;
  return data || [];
}

const PERMISOS_DEFECTO_POR_ROL: Record<string, Record<string, boolean>> = {
  Dueno: {
    dashboard: true, agenda: true, inbox: true, crm: true,
    finanzas: true, marketing: true, nilah_creative: true,
    crecimiento: true, fidelizacion: true, analiticas: true,
    copilot: true, configuracion: true,
  },
  Admin: {
    dashboard: true, agenda: true, inbox: true, crm: true,
    finanzas: true, marketing: true, nilah_creative: true,
    crecimiento: true, fidelizacion: true, analiticas: true,
    copilot: true, configuracion: true,
  },
  Staff: {
    dashboard: true, agenda: true, inbox: true, crm: false,
    finanzas: false, marketing: false, nilah_creative: false,
    crecimiento: false, fidelizacion: true, analiticas: false,
    copilot: false, configuracion: false,
  },
};

export async function createUsuarioNegocio(data: {
  business_id: string;
  nombre_persona: string;
  email: string;
  password: string;
  role: string;
  permisos?: Record<string, boolean>;
}): Promise<void> {
  // 1. Crear en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (authError) throw new Error(`Error al crear cuenta: ${authError.message}`);

  // 2. Crear en tabla Usuarios usando RPC SECURITY DEFINER (bypass RLS)
  const { error: dbError } = await supabase.rpc('superadmin_insert_usuario', {
    p_email: data.email,
    p_nombre_persona: data.nombre_persona,
    p_role: data.role,
    p_business_id: data.business_id,
    p_nombre_negocio: '',
  });
  if (dbError) throw new Error(`Usuario creado en Auth pero falló en BD: ${dbError.message}`);

  // 3. Guardar permisos_modulos (usa preset por rol si no se pasan permisos personalizados)
  const permisosFinales = data.permisos ?? PERMISOS_DEFECTO_POR_ROL[data.role] ?? PERMISOS_DEFECTO_POR_ROL.Staff;
  const { error: permError } = await supabase
    .from('Usuarios')
    .update({ permisos_modulos: permisosFinales })
    .eq('email', data.email)
    .eq('business_id', data.business_id);
  // No bloqueamos si falla — es best-effort
  if (permError) console.warn('No se pudieron guardar permisos_modulos:', permError.message);
}

export async function updatePermisosUsuario(
  userId: number,
  permisos: Record<string, boolean>
): Promise<void> {
  const { error } = await supabase
    .from('Usuarios')
    .update({ permisos_modulos: permisos })
    .eq('id', userId);
  if (error) throw new Error(`Error al actualizar permisos: ${error.message}`);
}

// ─── Precios ─────────────────────────────────────────────────

export async function fetchPrecios(): Promise<PrecioSuscripcion[]> {
  const { data, error } = await supabase
    .from('precios_suscripcion')
    .select('*')
    .order('categoria');
  if (error) throw error;
  return data || [];
}

export async function updatePrecio(id: string, precio: number): Promise<void> {
  const { error } = await supabase.rpc('superadmin_update_precio', {
    p_id: id,
    p_precio: precio,
  });
  if (error) throw error;
}

// ─── Stats globales ───────────────────────────────────────────

export interface GlobalStats {
  total_clientes: number;
  activos: number;
  trial: number;
  suspendidos: number;
  mrr_total: number;
  briefs_completados: number;
  onboarding_pendientes: number;
  plan_distribution: Record<string, number>;
}

export function calcularStats(negocios: NegocioAdmin[]): GlobalStats {
  const stats: GlobalStats = {
    total_clientes: negocios.length,
    activos: 0,
    trial: 0,
    suspendidos: 0,
    mrr_total: 0,
    briefs_completados: 0,
    onboarding_pendientes: 0,
    plan_distribution: { nilah: 0, korat: 0, copilot: 0 },
  };

  const PLAN_PRECIOS: Record<string, number> = {
    nilah: 105,
    korat: 158,
    copilot: 210,
  };

  for (const n of negocios) {
    if (n.estado === 'activo') stats.activos++;
    else if (n.estado === 'trial') stats.trial++;
    else if (n.estado === 'suspendido') stats.suspendidos++;

    const plan = n.plan || 'nilah';
    stats.mrr_total += PLAN_PRECIOS[plan] || 0;

    if (n.brief_completado) stats.briefs_completados++;
    if (!n.onboarding_completado) stats.onboarding_pendientes++;

    if (plan in stats.plan_distribution) {
      stats.plan_distribution[plan]++;
    }
  }

  return stats;
}
