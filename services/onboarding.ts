import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OnboardingToken {
  id: string;
  token: string;
  email: string;
  business_id: string | null;
  paso_actual: number;
  datos_parciales: Record<string, unknown>;
  completado: boolean;
  expires_at: string;
}

export interface StepAccountData {
  nombre_persona: string;
  nombre_negocio: string;
  email: string;
  password: string;
}

export interface StepNegocioData {
  pais: string;
  ubicacion: string;
  moneda: string;
  timezone: string;
  color_primario: string;
  logo_url?: string;
  telefono_recepcionista: string;
  email_negocio: string;
  metodos_pago: string;
  politicas_reserva: string;
  dias_trabajo: string[];
  hora_apertura: string;
  hora_cierre: string;
  // negocio_info keys
  horario_sabado: string;
  horario_domingo: string;
  hora_almuerzo: string;
  horario_semana: string;
  Instagram?: string;
  Facebook?: string;
  Tiktok?: string;
}

export interface StaffMember {
  nombre: string;
  especialidad: string;
  cat_staff: string;
  rol: string;
  dias_trabajo: string[];
  horario_trabajo: { inicio: string; fin: string };
}

export interface ServicioOnboarding {
  nombre: string;
  categoria: string;
  precio: number;
  duracion: number;
  es_variable: boolean;
  prioridad: string;
  subcategoria?: string;
}

export interface ExtraOnboarding {
  categoria: string;
  nombre: string;
  etiqueta: string;
  precio: number;
}

export interface PremioOnboarding {
  nombre: string;
  costo_puntos: number;
  descripcion?: string;
  limite_stock?: number;
  categoria?: string;
}

// ─── Token ───────────────────────────────────────────────────────────────────

export async function getOnboardingToken(token: string): Promise<OnboardingToken | null> {
  const { data, error } = await supabase
    .from('onboarding_tokens')
    .select('*')
    .eq('token', token)
    .eq('completado', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) return null;
  return data;
}

export async function updateTokenProgress(
  tokenId: string,
  pasoActual: number,
  businessId?: string
): Promise<void> {
  const update: Record<string, unknown> = {
    paso_actual: pasoActual,
    updated_at: new Date().toISOString(),
  };
  if (businessId) update.business_id = businessId;

  await supabase
    .from('onboarding_tokens')
    .update(update)
    .eq('id', tokenId);
}

export async function markTokenCompleted(tokenId: string): Promise<void> {
  await supabase
    .from('onboarding_tokens')
    .update({ completado: true, updated_at: new Date().toISOString() })
    .eq('id', tokenId);
}

// ─── Paso 1: Cuenta ──────────────────────────────────────────────────────────

export async function createNegocioAndUsuario(
  data: StepAccountData,
  tokenId: string
): Promise<string> {
  // 1. Crear usuario en Supabase Auth
  const { error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    throw new Error(`Error creando cuenta (Auth): ${authError.message}`);
  }

  // 2. Ejecutar RPC para bypass RLS y crear cuenta en DB
  const { data: negocioId, error: dbError } = await supabase.rpc('onboarding_step_1_cuenta', {
    p_token_id: tokenId,
    p_nombre_persona: data.nombre_persona,
    p_nombre_negocio: data.nombre_negocio,
    p_email: data.email,
    p_password: data.password,
  });

  if (dbError) throw new Error(`Error creando negocio: ${dbError.message}`);

  return negocioId;
}

// ─── Paso 2: Negocio ─────────────────────────────────────────────────────────

export async function saveStepNegocio(
  businessId: string,
  data: StepNegocioData,
  tokenId: string
): Promise<void> {
  const { error } = await supabase.rpc('onboarding_step_2_negocio', {
    p_token_id: tokenId,
    p_business_id: businessId,
    p_data: data
  });
  if (error) throw new Error(`Error guardando datos del negocio: ${error.message}`);
}

// ─── Paso 3: Staff ────────────────────────────────────────────────────────────

export async function saveStepEquipo(
  businessId: string,
  staff: StaffMember[],
  tokenId: string
): Promise<void> {
  const { error } = await supabase.rpc('onboarding_step_3_equipo', {
    p_token_id: tokenId,
    p_business_id: businessId,
    p_staff: staff
  });
  if (error) throw new Error(`Error guardando staff: ${error.message}`);
}

// ─── Paso 4: Servicios ────────────────────────────────────────────────────────

export async function saveStepServicios(
  businessId: string,
  servicios: ServicioOnboarding[],
  tokenId: string
): Promise<void> {
  const { error } = await supabase.rpc('onboarding_step_4_servicios', {
    p_token_id: tokenId,
    p_business_id: businessId,
    p_servicios: servicios
  });
  if (error) throw new Error(`Error guardando servicios: ${error.message}`);
}

// ─── Paso 5: Extras ───────────────────────────────────────────────────────────

export async function saveStepExtras(
  businessId: string,
  extras: ExtraOnboarding[],
  tokenId: string
): Promise<void> {
  const { error } = await supabase.rpc('onboarding_step_5_extras', {
    p_token_id: tokenId,
    p_business_id: businessId,
    p_extras: extras
  });
  if (error) throw new Error(`Error guardando extras: ${error.message}`);
}

// ─── Paso 6: Fidelización ─────────────────────────────────────────────────────

export async function saveStepFidelizacion(
  businessId: string,
  tipoFidelizacion: 'global' | 'staff',
  premios: PremioOnboarding[],
  tokenId: string
): Promise<void> {
  const { error } = await supabase.rpc('onboarding_step_6_fidelizacion', {
    p_token_id: tokenId,
    p_business_id: businessId,
    p_tipo: tipoFidelizacion,
    p_premios: premios
  });
  if (error) throw new Error(`Error guardando premios: ${error.message}`);
}

// ─── Paso 7: Identidad del Bot ────────────────────────────────────────────────

export async function saveStepIdentidadBot(
  businessId: string,
  respuestas: {
    nombre_bot: string;
    identidad_base: string;
    trato_personalizado: string;
    estilo_visual: string;
  },
  tokenId: string
): Promise<void> {
  const { error } = await supabase.rpc('onboarding_step_7_identidad_bot', {
    p_token_id: tokenId,
    p_business_id: businessId,
    p_respuestas: respuestas
  });
  if (error) throw new Error(`Error guardando identidad de marca: ${error.message}`);
}

// ─── Paso 8: Business Brief ───────────────────────────────────────────────────

export async function saveStepBrief(
  businessId: string,
  brief: Record<string, unknown>,
  tokenId: string
): Promise<void> {
  const { error } = await supabase.rpc('onboarding_step_8_brief', {
    p_token_id: tokenId,
    p_business_id: businessId,
    p_brief: brief
  });
  if (error) throw new Error(`Error guardando brief: ${error.message}`);
}
