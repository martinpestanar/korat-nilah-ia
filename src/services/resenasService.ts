import { supabase } from './supabase';
import { ResenasConfig, ResenaPremio, ResenaCupon, ResenasPublicData } from '../types/resenas';

export const CATEGORIAS_PREDEFINIDAS = [
  { id: 'Uñas', label: 'Uñas & Manicure', emoji: '💅', color: 'from-pink-500 to-rose-500' },
  { id: 'Cabello', label: 'Cabello & Color', emoji: '💇‍♀️', color: 'from-purple-500 to-indigo-500' },
  { id: 'Pestañas & Cejas', label: 'Pestañas & Cejas', emoji: '👁️', color: 'from-amber-500 to-pink-500' },
  { id: 'Faciales & Spa', label: 'Faciales & Spa', emoji: '💆‍♀️', color: 'from-emerald-500 to-teal-500' },
  { id: 'General', label: 'Cualquier Servicio', emoji: '✨', color: 'from-rose-500 to-amber-500' },
];

export const PREMIOS_SEMBRADOR = [
  {
    categoria: 'Uñas',
    titulo_premio: '20% OFF en tu próximo servicio de uñas',
    tipo_recompensa: 'porcentaje' as const,
    valor_recompensa: '20%',
    dias_validez: 30,
    orden: 1,
    activo: true,
  },
  {
    categoria: 'Cabello',
    titulo_premio: 'Tratamiento de Hidratación Profunda de Regalo',
    tipo_recompensa: 'regalo' as const,
    valor_recompensa: 'Gratis',
    dias_validez: 30,
    orden: 2,
    activo: true,
  },
  {
    categoria: 'Pestañas & Cejas',
    titulo_premio: 'Diseño y Perfilado de Cejas Express Gratis',
    tipo_recompensa: 'regalo' as const,
    valor_recompensa: 'Gratis',
    dias_validez: 30,
    orden: 3,
    activo: true,
  },
  {
    categoria: 'Faciales & Spa',
    titulo_premio: 'S/ 25 de descuento en Limpieza Facial Profunda',
    tipo_recompensa: 'monto_fijo' as const,
    valor_recompensa: 'S/ 25',
    dias_validez: 30,
    orden: 4,
    activo: true,
  },
  {
    categoria: 'General',
    titulo_premio: '15% OFF en cualquier servicio para tu próxima visita',
    tipo_recompensa: 'porcentaje' as const,
    valor_recompensa: '15%',
    dias_validez: 30,
    orden: 5,
    activo: true,
  },
];

export async function getResenasConfig(businessId: string): Promise<ResenasConfig> {
  const { data, error } = await supabase
    .from('resenas_config')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();

  if (error) {
    console.warn('Error fetching resenas_config:', error);
  }

  if (data) return data as ResenasConfig;

  // Si no existe, crear registro por defecto
  const defaultConfig = {
    business_id: businessId,
    google_review_url: '',
    admin_pin: '1234',
    dias_validez_default: 30,
    limite_dias_por_cliente: 30,
    webhook_n8n_url: 'https://n8n.koratflow.agency/webhook/envio-cupon',
    flyer_titulo: '¡Tu opinión vale oro!',
    flyer_subtitulo: 'Escanea, califícanos en Google y recibe un beneficio exclusivo en tu próxima visita',
    activo: true,
  };

  const { data: created, error: createErr } = await supabase
    .from('resenas_config')
    .insert([defaultConfig])
    .select('*')
    .single();

  if (createErr) {
    console.error('Error creating default resenas_config:', createErr);
    return { ...defaultConfig, id: 'temp-id', created_at: new Date().toISOString() };
  }

  return created as ResenasConfig;
}

export async function saveResenasConfig(businessId: string, updates: Partial<ResenasConfig>): Promise<ResenasConfig | null> {
  const { data, error } = await supabase
    .from('resenas_config')
    .upsert({
      business_id: businessId,
      ...updates,
    }, { onConflict: 'business_id' })
    .select('*')
    .single();

  if (error) {
    console.error('Error saving resenas_config:', error);
    throw error;
  }
  return data as ResenasConfig;
}

export async function getPremios(businessId: string): Promise<ResenaPremio[]> {
  const { data, error } = await supabase
    .from('resenas_premios')
    .select('*')
    .eq('business_id', businessId)
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching premios:', error);
    return [];
  }

  // Si el salón no tiene premios aún, inicializar con los de plantilla
  if (!data || data.length === 0) {
    const toInsert = PREMIOS_SEMBRADOR.map((p) => ({
      business_id: businessId,
      ...p,
    }));
    const { data: seeded, error: seedErr } = await supabase
      .from('resenas_premios')
      .insert(toInsert)
      .select('*');

    if (!seedErr && seeded) {
      return seeded as ResenaPremio[];
    }
  }

  return (data || []) as ResenaPremio[];
}

export async function savePremio(businessId: string, premio: Partial<ResenaPremio>): Promise<ResenaPremio> {
  const payload = {
    business_id: businessId,
    categoria: premio.categoria || 'General',
    titulo_premio: premio.titulo_premio || 'Beneficio Especial',
    tipo_recompensa: premio.tipo_recompensa || 'porcentaje',
    valor_recompensa: premio.valor_recompensa || '',
    dias_validez: premio.dias_validez || 30,
    orden: premio.orden ?? 0,
    activo: premio.activo ?? true,
    ...(premio.id ? { id: premio.id } : {}),
  };

  const { data, error } = await supabase
    .from('resenas_premios')
    .upsert(payload)
    .select('*')
    .single();

  if (error) {
    console.error('Error saving premio:', error);
    throw error;
  }
  return data as ResenaPremio;
}

export async function deletePremio(premioId: string): Promise<boolean> {
  const { error } = await supabase
    .from('resenas_premios')
    .delete()
    .eq('id', premioId);

  if (error) {
    console.error('Error deleting premio:', error);
    return false;
  }
  return true;
}

export async function getCupones(
  businessId: string,
  filter?: { estado?: string; search?: string }
): Promise<ResenaCupon[]> {
  let query = supabase
    .from('resenas_cupones')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (filter?.estado && filter.estado !== 'todos') {
    query = query.eq('estado', filter.estado);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching cupones:', error);
    return [];
  }

  let list = (data || []) as ResenaCupon[];
  if (filter?.search && filter.search.trim()) {
    const s = filter.search.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.codigo.toLowerCase().includes(s) ||
        c.cliente_telefono.includes(s) ||
        c.cliente_nombre.toLowerCase().includes(s)
    );
  }

  return list;
}

export async function canjearCupon(
  cuponId: string,
  canjeadoPor: string = 'Recepción',
  notas?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('resenas_cupones')
    .update({
      estado: 'canjeado',
      canjeado_en: new Date().toISOString(),
      canjeado_por: canjeadoPor,
      notas_canje: notas || null,
    })
    .eq('id', cuponId);

  if (error) {
    console.error('Error canjeando cupon:', error);
    return false;
  }
  return true;
}

export function generateCouponCode(businessName: string): string {
  const prefix = (businessName || 'KORAT')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, 'X');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomLetter = chars.charAt(Math.floor(Math.random() * chars.length));
  return `${prefix}-${randomNum}-${randomLetter}`;
}

export async function emitirCuponPublico(params: {
  businessId: string;
  businessName: string;
  premioId?: string;
  categoriaServicio: string;
  tituloBeneficio: string;
  diasValidez: number;
  clienteNombre: string;
  clienteTelefono: string;
  webhookUrl?: string;
}): Promise<{ cupon: ResenaCupon; yaExistia: boolean }> {
  const cleanPhone = params.clienteTelefono.replace(/[^0-9]/g, '');

  // 1. Verificar si ya tiene un cupón activo reciente (anti-spam / anti-fraude)
  const { data: existentes } = await supabase
    .from('resenas_cupones')
    .select('*')
    .eq('business_id', params.businessId)
    .eq('cliente_telefono', cleanPhone)
    .eq('estado', 'activo')
    .gte('expira_en', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (existentes && existentes.length > 0) {
    return { cupon: existentes[0] as ResenaCupon, yaExistia: true };
  }

  // 2. Generar nuevo cupón
  const code = generateCouponCode(params.businessName);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (params.diasValidez || 30));

  const nuevoRegistro = {
    business_id: params.businessId,
    premio_id: params.premioId || null,
    codigo: code,
    cliente_nombre: params.clienteNombre.trim(),
    cliente_telefono: cleanPhone,
    categoria_servicio: params.categoriaServicio,
    titulo_beneficio: params.tituloBeneficio,
    estado: 'activo' as const,
    expira_en: expiresAt.toISOString(),
  };

  const { data: created, error } = await supabase
    .from('resenas_cupones')
    .insert([nuevoRegistro])
    .select('*')
    .single();

  if (error) {
    console.error('Error insertando cupon:', error);
    throw error;
  }

  // 3. Respaldo silencioso en el CRM de Clientes
  try {
    const { data: clienteExistente } = await supabase
      .from('Clientes')
      .select('id, nombre')
      .eq('telefono', cleanPhone)
      .maybeSingle();

    if (!clienteExistente) {
      await supabase.from('Clientes').insert([
        {
          nombre: params.clienteNombre.trim(),
          telefono: cleanPhone,
          notas: `Registrado desde QR Reseñas Google (Premio: ${params.tituloBeneficio})`,
        },
      ]);
    }
  } catch (crmErr) {
    console.warn('CRM sync warning (non-blocking):', crmErr);
  }

  // 4. Disparo opcional a n8n
  if (params.webhookUrl) {
    fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: params.businessId,
        salon_name: params.businessName,
        client_name: params.clienteNombre,
        client_phone: cleanPhone,
        coupon_code: code,
        reward_title: params.tituloBeneficio,
        category: params.categoriaServicio,
        expires_at: expiresAt.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }),
      }),
    }).catch((e) => console.warn('n8n webhook warning:', e));
  }

  return { cupon: created as ResenaCupon, yaExistia: false };
}

export async function fetchPublicSalonData(slugOrId: string): Promise<ResenasPublicData | null> {
  if (!slugOrId) return null;

  // Intentar buscar negocio por slug o por ID
  let query = supabase.from('negocios').select('*');
  if (slugOrId.includes('-') && slugOrId.length > 20) {
    query = query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`);
  } else {
    query = query.eq('slug', slugOrId);
  }

  const { data: biz, error: bizErr } = await query.maybeSingle();

  if (bizErr || !biz) {
    console.warn('Negocio no encontrado por slug/id:', slugOrId, bizErr);
    return null;
  }

  // Obtener config
  const config = await getResenasConfig(biz.id);
  // Obtener premios activos
  const { data: premiosRaw } = await supabase
    .from('resenas_premios')
    .select('*')
    .eq('business_id', biz.id)
    .eq('activo', true)
    .order('orden', { ascending: true });

  const premios = (premiosRaw || []) as ResenaPremio[];

  return {
    negocio: {
      id: biz.id,
      nombre: biz.nombre || 'Mi Salón',
      slug: biz.slug || slugOrId,
      logo_url: biz.logo_url || '',
      direccion: biz.direccion || '',
      telefono: biz.telefono || '',
    },
    config,
    premios,
  };
}
