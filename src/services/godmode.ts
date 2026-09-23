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

export type {
  NegocioAdmin, OnboardingTokenAdmin, PrecioSuscripcion,
  RecursosSaaSV2, PlanBase, EstadoNegocio
};


// ─── Negocios ─────────────────────────────────────────────────

/**
 * Normaliza el valor legacy del campo plan_suscripcion al nuevo esquema:
 *   'glow_pro' | 'pro' → 'glow_pro'
 *   cualquier otro ('glow', 'free', 'automatico', 'manual', 'basico', etc.) → 'glow'
 */
function normalizePlan(raw: string | null | undefined): PlanBase {
  const p = (raw || '').toLowerCase().trim();
  if (['glow_pro', 'pro'].includes(p)) return 'glow_pro';
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

  // Sincronizar también la columna plan en Usuarios para consistencia
  if (updates.plan) {
    const userPlanText = updates.plan.toLowerCase().includes('pro') ? 'Glow Pro' : 'Glow';
    await supabase.from('Usuarios').update({ plan: userPlanText }).eq('business_id', negocioId);
  }

  // Registrar auditoría automática
  try {
    const { data: authData } = await supabase.auth.getUser();
    const adminEmail = authData?.user?.email || 'superadmin';
    await logSuperadminAction(adminEmail, 'update_negocio_config', negocioId, {
      plan: updates.plan,
      estado: updates.estado,
      has_recursos: !!updates.recursos,
      estado_pago: updates.recursos?.estado_pago,
      proximo_cobro: updates.recursos?.proximo_cobro
    });
  } catch (err) {
    console.warn('No se pudo registrar log de auditoría:', err);
  }
}

// ─── Kill Switch Global & Auditoría ─────────────────────────

export interface KillSwitchConfig {
  activo: boolean;
  motivo: string;
  fecha: string | null;
  detener_whatsapp: boolean;
  detener_autopilot: boolean;
}

export async function getKillSwitchStatus(): Promise<KillSwitchConfig> {
  try {
    const { data, error } = await supabase.rpc('get_superadmin_config', { p_clave: 'kill_switch' });
    if (error) throw error;
    return (data as KillSwitchConfig) || {
      activo: false,
      motivo: '',
      fecha: null,
      detener_whatsapp: false,
      detener_autopilot: false,
    };
  } catch (e) {
    console.error('Error fetching kill switch:', e);
    return { activo: false, motivo: '', fecha: null, detener_whatsapp: false, detener_autopilot: false };
  }
}

export async function setKillSwitchStatus(config: KillSwitchConfig, adminEmail: string): Promise<void> {
  const { error } = await supabase.rpc('set_superadmin_config', {
    p_clave: 'kill_switch',
    p_valor: config,
    p_admin_email: adminEmail
  });
  if (error) throw error;

  await logSuperadminAction(adminEmail, config.activo ? 'kill_switch_activated' : 'kill_switch_deactivated', null, {
    motivo: config.motivo,
    detener_whatsapp: config.detener_whatsapp,
    detener_autopilot: config.detener_autopilot
  });
}

export async function logSuperadminAction(
  adminEmail: string,
  accion: string,
  negocioId?: string | null,
  detalles: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.rpc('log_superadmin_action', {
      p_admin_email: adminEmail,
      p_accion: accion,
      p_negocio_id: negocioId || null,
      p_detalles: detalles
    });
  } catch (err) {
    console.warn('Error al guardar log de auditoría:', err);
  }
}

export interface AuditLogItem {
  id: string;
  created_at: string;
  admin_email: string;
  accion: string;
  negocio_id: string | null;
  negocio_nombre: string | null;
  detalles: Record<string, any>;
}

export async function fetchSuperadminAuditLogs(limit = 40): Promise<AuditLogItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_superadmin_audit_logs', { p_limit: limit });
    if (error) throw error;
    return (data || []) as AuditLogItem[];
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
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
    plan_distribution: { glow: 0, glow_pro: 0 },
  };

  // Precios referenciales en PEN (Glow = Gratis S/ 0, Glow Pro = S/ 149)
  const PLAN_PRECIOS_PEN: Record<string, number> = {
    glow: 0,
    glow_pro: 149,
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
