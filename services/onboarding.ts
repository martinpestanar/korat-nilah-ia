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
  // 1. Crear negocio
  const { data: negocio, error: negError } = await supabase
    .from('negocios')
    .insert({
      nombre: data.nombre_negocio,
      slug: data.nombre_negocio.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now(),
      activo: true,
      plan: 'Starter',
    })
    .select('id')
    .single();

  if (negError) throw new Error(`Error creando negocio: ${negError.message}`);
  const businessId = negocio.id;

  // 2. Crear usuario vinculado
  const { error: usrError } = await supabase
    .from('Usuarios')
    .insert({
      nombre_persona: data.nombre_persona,
      nombre_negocio: data.nombre_negocio,
      email: data.email,
      password: data.password, // En producción esto debe ser hasheado o vía Supabase Auth
      role: 'admin',
      business_id: businessId,
    });

  if (usrError) throw new Error(`Error creando usuario: ${usrError.message}`);

  // 3. Vincular token al negocio
  await updateTokenProgress(tokenId, 2, businessId);

  return businessId;
}

// ─── Paso 2: Negocio ─────────────────────────────────────────────────────────

export async function saveStepNegocio(
  businessId: string,
  data: StepNegocioData,
  tokenId: string
): Promise<void> {
  // 1. Actualizar tabla negocios (datos técnicos/sensibles)
  await supabase
    .from('negocios')
    .update({
      pais: data.pais,
      moneda: data.moneda,
      idioma: data.pais === 'Peru' ? 'es-PE' : data.pais === 'Colombia' ? 'es-CO' : 'es-MX',
      timezone: data.timezone,
      color_primario: data.color_primario,
      logo_url: data.logo_url,
      telefono_recepcionista: data.telefono_recepcionista,
      email: data.email_negocio,
      dias_trabajo: data.dias_trabajo,
      hora_apertura: data.hora_apertura,
      hora_cierre: data.hora_cierre,
    })
    .eq('id', businessId);

  // 2. Guardar en negocio_info (lo que el chatbot lee)
  const infoKeys: { clave: string; valor: string }[] = [
    { clave: 'nombre_salon', valor: '' }, // se llenará desde negocios.nombre
    { clave: 'ubicacion_contacto', valor: data.ubicacion },
    { clave: 'metodos_pago', valor: data.metodos_pago },
    { clave: 'politicas_reserva', valor: data.politicas_reserva },
    { clave: 'horario_semana', valor: data.horario_semana },
    { clave: 'horario_sabado', valor: data.horario_sabado },
    { clave: 'horario_domingo', valor: data.horario_domingo },
    { clave: 'hora_almuerzo', valor: data.hora_almuerzo },
    ...(data.Instagram ? [{ clave: 'Instagram', valor: data.Instagram }] : []),
    ...(data.Facebook ? [{ clave: 'Facebook', valor: data.Facebook }] : []),
    ...(data.Tiktok ? [{ clave: 'Tiktok', valor: data.Tiktok }] : []),
  ];

  for (const item of infoKeys) {
    if (!item.valor) continue;
    await supabase
      .from('negocio_info')
      .upsert(
        { business_id: businessId, clave: item.clave, valor_texto: item.valor },
        { onConflict: 'business_id,clave' }
      );
  }

  await updateTokenProgress(tokenId, 3);
}

// ─── Paso 3: Staff ────────────────────────────────────────────────────────────

export async function saveStepEquipo(
  businessId: string,
  staff: StaffMember[],
  tokenId: string
): Promise<void> {
  const rows = staff.map((s) => ({
    business_id: businessId,
    nombre: s.nombre,
    especialidad: s.especialidad,
    cat_staff: s.cat_staff,
    rol: s.rol,
    dias_trabajo: s.dias_trabajo,
    horario_trabajo: s.horario_trabajo,
    activo: true,
  }));

  const { error } = await supabase.from('staff').insert(rows);
  if (error) throw new Error(`Error guardando staff: ${error.message}`);
  await updateTokenProgress(tokenId, 4);
}

// ─── Paso 4: Servicios ────────────────────────────────────────────────────────

export async function saveStepServicios(
  businessId: string,
  servicios: ServicioOnboarding[],
  tokenId: string
): Promise<void> {
  const rows = servicios.map((s) => ({
    business_id: businessId,
    nombre: s.nombre,
    categoria: s.categoria,
    precio: s.precio,
    duracion: s.duracion,
    es_variable: s.es_variable,
    prioridad: s.prioridad,
    subcategoria: s.subcategoria || null,
  }));

  const { error } = await supabase.from('servicios').insert(rows);
  if (error) throw new Error(`Error guardando servicios: ${error.message}`);
  await updateTokenProgress(tokenId, 5);
}

// ─── Paso 5: Extras ───────────────────────────────────────────────────────────

export async function saveStepExtras(
  businessId: string,
  extras: ExtraOnboarding[],
  tokenId: string
): Promise<void> {
  if (!extras.length) {
    await updateTokenProgress(tokenId, 6);
    return;
  }
  const rows = extras.map((e, i) => ({
    business_id: businessId,
    categoria: e.categoria,
    nombre: e.nombre,
    etiqueta: e.etiqueta,
    precio: e.precio,
    orden: i,
    activo: true,
  }));

  const { error } = await supabase.from('precios_extras').insert(rows);
  if (error) throw new Error(`Error guardando extras: ${error.message}`);
  await updateTokenProgress(tokenId, 6);
}

// ─── Paso 6: Fidelización ─────────────────────────────────────────────────────

export async function saveStepFidelizacion(
  businessId: string,
  tipoFidelizacion: 'global' | 'staff',
  premios: PremioOnboarding[],
  tokenId: string
): Promise<void> {
  // Guardar modo en negocios.tipo_fidelizacion
  await supabase
    .from('negocios')
    .update({ tipo_fidelizacion: tipoFidelizacion })
    .eq('id', businessId);

  // Guardar premios
  if (premios.length) {
    const rows = premios.map((p) => ({
      business_id: businessId,
      nombre: p.nombre,
      costo_puntos: p.costo_puntos,
      descripcion: p.descripcion || null,
      limite_stock: p.limite_stock || null,
      categoria: p.categoria || 'General',
      activo: true,
    }));
    const { error } = await supabase.from('Premios').insert(rows);
    if (error) throw new Error(`Error guardando premios: ${error.message}`);
  }

  await updateTokenProgress(tokenId, 7);
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
  const { error } = await supabase
    .from('negocios')
    .update({
      marca_identidad: { respuestas },
    })
    .eq('id', businessId);

  if (error) throw new Error(`Error guardando identidad de marca: ${error.message}`);
  await updateTokenProgress(tokenId, 8);
}

// ─── Paso 8: Business Brief ───────────────────────────────────────────────────

export async function saveStepBrief(
  businessId: string,
  brief: Record<string, unknown>,
  tokenId: string
): Promise<void> {
  const { error } = await supabase
    .from('business_briefs')
    .upsert({ business_id: businessId, ...brief }, { onConflict: 'business_id' });

  if (error) throw new Error(`Error guardando brief: ${error.message}`);
  await markTokenCompleted(tokenId);
}
