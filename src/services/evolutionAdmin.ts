/**
 * ============================================================
 * SERVICIO: Evolution API Admin — SuperAdmin GodMode
 * Gestión de instancias WhatsApp desde el panel de administración
 * ============================================================
 */
import { supabase } from '@/services/supabase';

// ─── Tipos ───────────────────────────────────────────────────

export interface EvolutionInstance {
  id: string;
  business_id: string | null;
  instance_name: string;
  instance_id: string | null;
  api_key: string | null;
  status: 'pendiente' | 'conectado' | 'desconectado' | 'error';
  label: string | null;          // Etiqueta para instancias independientes
  phone_number: string | null;   // Número vinculado
  created_at: string;
  updated_at: string;
  // Datos enriquecidos (JOIN con negocios)
  negocio_nombre?: string;
  negocio_plan?: string;
  negocio_estado?: string;
}

export interface CreateInstanceResult {
  success: boolean;
  instanceName?: string;
  clientInstanceId?: string;
  clientApiKey?: string;
  base64QR?: string;
  error?: string;
}

export interface PairingCodeResult {
  success: boolean;
  pairingCode?: string;
  instanceName?: string;
  error?: string;
}

export interface ConnectionStateResult {
  isConnected: boolean;
  state?: string;
  owner?: string;
  error?: string;
}

export interface DeleteInstanceResult {
  success: boolean;
  error?: string;
}

// ─── Fetch todas las instancias ──────────────────────────────

export async function fetchAllInstances(): Promise<EvolutionInstance[]> {
  const { data, error } = await supabase
    .from('instancias_evolution')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching instancias_evolution:', error);
    throw error;
  }

  return (data || []) as EvolutionInstance[];
}

/**
 * Enriquece las instancias con datos de negocios haciendo un JOIN manual.
 * Devuelve la lista con negocio_nombre, negocio_plan, negocio_estado.
 */
export async function fetchInstancesEnriched(): Promise<EvolutionInstance[]> {
  const [instances, negocios] = await Promise.all([
    fetchAllInstances(),
    supabase.from('negocios').select('id, nombre, plan_suscripcion, estado').then(r => r.data || []),
  ]);

  const negocioMap = new Map<string, { nombre: string; plan: string; estado: string }>();
  for (const n of negocios) {
    negocioMap.set(n.id, { nombre: n.nombre, plan: n.plan_suscripcion || 'glow', estado: n.estado || 'activo' });
  }

  return instances.map(inst => {
    const neg = inst.business_id ? negocioMap.get(inst.business_id) : undefined;
    return {
      ...inst,
      negocio_nombre: neg?.nombre || null,
      negocio_plan: neg?.plan || null,
      negocio_estado: neg?.estado || null,
    } as EvolutionInstance;
  });
}

// ─── Crear instancia para un negocio ─────────────────────────

// ─── Helper de extracción de error de Edge Function ─────────
async function extractErrorMessage(error: any, fallback: string): Promise<string> {
  let detail = error?.message || fallback;
  try {
    if (error && typeof error === 'object' && 'context' in error && error.context) {
      const body = await (error.context as Response).clone().json();
      if (body?.error) detail = body.error;
    }
  } catch {}
  return detail;
}

// ─── Crear instancia para un negocio ─────────────────────────

export async function createInstanceForBusiness(businessId: string, label?: string, number?: string): Promise<CreateInstanceResult & { pairingCode?: string }> {
  const { data, error } = await supabase.functions.invoke('create-evo-instance', {
    body: { businessId, label, number, qrcode: !number },
  });

  if (error) {
    const msg = await extractErrorMessage(error, 'Error al crear instancia');
    return { success: false, error: msg };
  }

  return {
    success: data?.success ?? false,
    instanceName: data?.instanceName,
    clientInstanceId: data?.clientInstanceId,
    clientApiKey: data?.clientApiKey,
    base64QR: data?.base64QR,
    pairingCode: data?.pairingCode,
    error: data?.error,
  };
}

/**
 * Crea una instancia independiente (sin salón asociado).
 * Se guarda con su label descriptivo y business_id nulo en DB.
 */
export async function createStandaloneInstance(label: string, number?: string): Promise<CreateInstanceResult & { pairingCode?: string }> {
  const { data, error } = await supabase.functions.invoke('create-evo-instance', {
    body: { businessId: null, label: label || 'Instancia independiente', number, qrcode: !number },
  });

  if (error) {
    const msg = await extractErrorMessage(error, 'Error al crear instancia independiente');
    return { success: false, error: msg };
  }

  return {
    success: data?.success ?? false,
    instanceName: data?.instanceName,
    clientInstanceId: data?.clientInstanceId,
    clientApiKey: data?.clientApiKey,
    base64QR: data?.base64QR,
    pairingCode: data?.pairingCode,
    error: data?.error,
  };
}

// ─── Pairing Code ────────────────────────────────────────────

export interface PairingCodeParams {
  businessId?: string | null;
  instanceName?: string | null;
  phoneNumber: string;
}

export async function getPairingCode(
  paramsOrBusinessId: string | PairingCodeParams,
  maybePhone?: string
): Promise<PairingCodeResult> {
  let body: Record<string, unknown>;

  if (typeof paramsOrBusinessId === 'string') {
    body = {
      businessId: paramsOrBusinessId,
      phoneNumber: (maybePhone || '').replace(/\D/g, ''),
    };
  } else {
    body = {
      businessId: paramsOrBusinessId.businessId || undefined,
      instanceName: paramsOrBusinessId.instanceName || undefined,
      phoneNumber: paramsOrBusinessId.phoneNumber.replace(/\D/g, ''),
    };
  }

  const { data, error } = await supabase.functions.invoke('get-pairing-code', { body });

  if (error) {
    const msg = await extractErrorMessage(error, 'Error al obtener pairing code');
    return { success: false, error: msg };
  }

  return {
    success: data?.success ?? false,
    pairingCode: data?.pairingCode,
    instanceName: data?.instanceName,
    error: data?.error,
  };
}

// ─── Verificar conexión ──────────────────────────────────────

export async function checkConnection(instanceName: string): Promise<ConnectionStateResult> {
  const { data, error } = await supabase.functions.invoke('check-evo-connection', {
    body: { instanceName },
  });

  if (error) {
    return { isConnected: false, error: error.message };
  }

  return {
    isConnected: data?.isConnected ?? false,
    state: data?.state,
    owner: data?.owner,
  };
}

// ─── Eliminar instancia ──────────────────────────────────────

export async function deleteInstance(businessId?: string | null, instanceName?: string | null): Promise<DeleteInstanceResult> {
  const { data, error } = await supabase.functions.invoke('delete-evo-instance', {
    body: {
      businessId: businessId || undefined,
      instanceName: instanceName || undefined,
    },
  });

  if (error) {
    const msg = await extractErrorMessage(error, 'Error al eliminar instancia');
    return { success: false, error: msg };
  }

  return {
    success: data?.success ?? false,
    error: data?.error,
  };
}

/**
 * Desvincula directamente por instance_name (para instancias independientes).
 */
export async function deleteInstanceByName(instanceName: string): Promise<DeleteInstanceResult> {
  return deleteInstance(null, instanceName);
}

// ─── Actualizar status local ─────────────────────────────────

export async function updateInstanceStatus(
  instanceName: string,
  status: EvolutionInstance['status']
): Promise<void> {
  await supabase
    .from('instancias_evolution')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('instance_name', instanceName);
}

// ─── Refresh estado de todas las instancias ──────────────────

export async function refreshAllConnectionStates(): Promise<Map<string, ConnectionStateResult>> {
  const instances = await fetchAllInstances();
  const results = new Map<string, ConnectionStateResult>();

  // Hacer todas las consultas en paralelo (máximo 10 a la vez para no saturar)
  const chunks: EvolutionInstance[][] = [];
  for (let i = 0; i < instances.length; i += 10) {
    chunks.push(instances.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const batch = await Promise.allSettled(
      chunk.map(async (inst) => {
        const result = await checkConnection(inst.instance_name);
        results.set(inst.instance_name, result);

        // Actualizar estado en DB
        const newStatus = result.isConnected ? 'conectado' : 'desconectado';
        if (inst.status !== newStatus) {
          await updateInstanceStatus(inst.instance_name, newStatus as EvolutionInstance['status']);
        }
      })
    );
  }

  return results;
}
