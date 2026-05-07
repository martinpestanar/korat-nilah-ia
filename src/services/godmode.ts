import { supabase } from '@/services/supabase';
/**
 * ============================================================
 * SERVICIO: God-Mode Super Admin
 * Datos directo a Supabase (sin n8n)
 * ============================================================
 */
import type {
  NegocioAdmin, OnboardingTokenAdmin, PrecioSuscripcion,
  RecursosSaaSV2, PlanBase, EstadoNegocio
} from '../types/godmode';


// ─── Negocios ─────────────────────────────────────────────────

/**
 * Normaliza el valor legacy del campo plan_suscripcion al nuevo esquema
 *   'automatico' | 'Pro' | 'pro' → 'korat'
 *   'nilah_copilot' | 'vip' | 'copilot' → 'copilot'
 *   cualquier otro (manual, basico, Starter, nil) → 'nilah'
 */
function normalizePlan(raw: string | null | undefined): PlanBase {
  const p = (raw || '').toLowerCase().trim();
  if (['glow_pro', 'korat', 'pro', 'automatico', 'auto'].includes(p)) return 'glow_pro';
  if (['glow_elite', 'copilot', 'nilah_copilot', 'vip', 'premium'].includes(p)) return 'glow_elite';
  return 'glow';
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
  plan_inicial?: PlanBase;
}): Promise<string> {
  const { data, error } = await supabase.rpc('superadmin_create_onboarding_token', {
    p_plan_inicial: params.plan_inicial || 'glow_pro',
  });
  if (error) throw error;
  return data as string;
}

export async function deleteOnboardingData(tokenId: string, businessId: string | null): Promise<void> {
  // Si tiene un negocio ya creado, usar la RPC que borra todo en cascada
  // (la RPC también borra onboarding_tokens, así que no hace falta borrarlo por separado)
  if (businessId) {
    const { data, error } = await supabase.rpc('eliminar_negocio_completo', {
      p_business_id: businessId,
    });
    if (error) throw new Error(`Error al eliminar negocio: ${error.message}`);
    if (data && data.success === false) throw new Error(`Error en eliminación: ${data.error}`);
    return;
  }

  // Si solo existe el token (negocio aún no creado), borramos solo el token
  const { error: tokenError } = await supabase
    .from('onboarding_tokens')
    .delete()
    .eq('id', tokenId);

  if (tokenError) throw new Error(`Error al borrar token: ${tokenError.message}`);
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

  const authUserId = authData?.user?.id ?? null;

  // 2. Crear en tabla Usuarios usando RPC SECURITY DEFINER (bypass RLS)
  //    Ahora incluye password y auth_uid para sincronizar correctamente
  const { error: dbError } = await supabase.rpc('superadmin_insert_usuario', {
    p_email: data.email,
    p_nombre_persona: data.nombre_persona,
    p_role: data.role,
    p_business_id: data.business_id,
    p_nombre_negocio: '',
    p_password: data.password,
    p_auth_uid: authUserId,
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

export async function updatePrecio(id: string, updates: Partial<PrecioSuscripcion>): Promise<void> {
  const { error } = await supabase
    .from('precios_suscripcion')
    .update(updates)
    .eq('id', id);
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
    plan_distribution: { glow: 0, glow_pro: 0, glow_elite: 0 },
  };

  // Precios referenciales en PEN (se pueden cruzar con DB en el futuro)
  const PLAN_PRECIOS_PEN: Record<string, number> = {
    glow: 149,
    glow_pro: 249,
    glow_elite: 399,
  };

  for (const n of negocios) {
    if (n.estado === 'activo') stats.activos++;
    else if (n.estado === 'trial') stats.trial++;
    else if (n.estado === 'suspendido') stats.suspendidos++;

    const plan = n.plan || 'glow';
    const precioBase = PLAN_PRECIOS_PEN[plan] || 0;
    const precioFinal = n.recursos_saas?.precio_acordado_pen !== undefined
      ? n.recursos_saas.precio_acordado_pen
      : precioBase;
      
    stats.mrr_total += precioFinal;

    if (n.brief_completado) stats.briefs_completados++;
    if (!n.onboarding_completado) stats.onboarding_pendientes++;

    if (plan in stats.plan_distribution) {
      stats.plan_distribution[plan]++;
    } else {
      // Fallback a glow si el plan es inválido
      stats.plan_distribution['glow']++;
    }
  }

  return stats;
}
