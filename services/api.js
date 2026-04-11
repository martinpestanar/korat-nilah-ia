/**
 * ===========================================
 * Korat MVP - API Services Layer
 * ===========================================
 * 
 * Este archivo contiene la capa de servicios para comunicarse
 * con el backend de n8n a través de webhooks.
 */

// ===========================================
// Helper Privado para Fetch a n8n
// ===========================================

/**
 * Función helper para realizar peticiones al backend n8n
 * @param {string} endpoint - El endpoint a llamar (ej: '/auth/login')
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {object|null} body - Cuerpo de la petición (para POST/PUT)
 * @returns {Promise<any>} - Respuesta parseada del servidor
 */
import { supabase, getSupabaseClient } from './supabase';

const fetchN8n = async (endpoint, method = 'GET', body = null) => {
  // En desarrollo, usar el proxy local para evitar CORS
  // En producción, usar la URL real
  const isDev = import.meta.env.DEV;
  const envUrl = import.meta.env.VITE_API_URL;

  // Si estamos en desarrollo, usar el proxy
  // El proxy está configurado en vite.config.ts: /api/n8n -> https://wh.martinwork.mooo.com/webhook
  const baseUrl = isDev ? '/api/n8n' : envUrl;

  if (!baseUrl && !isDev) {
    throw new Error('VITE_API_URL no está configurada en el archivo .env');
  }

  // Recuperar business_id del localStorage (multi-tenant)
  // Primero intentar korat_business_id (más directo), luego fallback a korat_user
  let businessId = localStorage.getItem('korat_business_id');

  if (!businessId) {
    const storedUser = localStorage.getItem('korat_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        businessId = user.business_id;
        // Sincronizar para futuras llamadas
        if (businessId) {
          localStorage.setItem('korat_business_id', businessId);
        }
      } catch (e) {
        console.warn('Error parsing stored user for business_id');
      }
    }
  }


  // GUARD: Endpoints que REQUIEREN business_id
  const requiresBusinessId = [
    '/dashboard/all',
    '/clients',
    '/clientes',
    '/citas',
  ];

  const needsBusinessId = requiresBusinessId.some(ep => endpoint.startsWith(ep));

  if (needsBusinessId && !businessId) {
    console.warn(`⚠️ fallback business_id activado para ${endpoint} ya que no está disponible`);
    // En MVP/Dev usamos un fallback ID en lugar de bloquear la UI y lanzar error de pantalla completa
    businessId = "default-korat-business-id";
  }

  // Configurar headers
  const headers = {
    'Content-Type': 'application/json',
    ...(businessId && { 'x-business-id': businessId }),  // Minúsculas para consistencia con n8n
  };

  // Obtener token de sesión de Supabase Auth (JWT real, compatible con n8n)
  let token = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || null;
  } catch (e) {
    // Si falla, continuar sin token (endpoints públicos)
  }

  // Si existe el token, añadirlo al header Authorization
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Configurar opciones de fetch
  const options = {
    method,
    headers,
  };

  // Añadir body si existe y el método lo permite
  // Nota: Incluimos DELETE porque algunos endpoints lo requieren (ej: /dias-cerrados)
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, options);

    // Manejar error 401 (No autorizado) - Cerrar sesión de Supabase y redirigir
    if (response.status === 401) {
      console.warn('Sesión expirada o no autorizada. Redirigiendo a login...');
      supabase.auth.signOut(); // Limpia sesión de Supabase Auth
      window.location.hash = '#/nilah/login';
      throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
    }

    // Manejar otros errores HTTP
    if (!response.ok) {
      if (response.status === 404 && endpoint.startsWith('/negocios')) {
        // Silenciar endpoints no implementados en el MVP
        throw new Error(`Endpoint 404 silenciado: ${endpoint}`);
      }
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ HTTP Error ${response.status}:`, errorData);
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    // Parsear y retornar la respuesta
    const text = await response.text();

    if (!text || text.trim() === '') {
      // Respuesta vacía - retornar objeto vacío (NO asumir success: true)
      // El componente que llama debe manejar este caso
      console.log(`ℹ️ No se encontraron datos (Empty response) de ${endpoint}`); // No es un error, es un estado esperado para cuentas nuevas
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('Respuesta no es JSON válido:', text);
      // Si la respuesta no es JSON, retornar el texto raw sin asumir éxito
      return { rawResponse: text };
    }

  } catch (error) {
    if (error.message && error.message.includes('Endpoint 404 silenciado: /negocios')) {
      // Ignorar log en consola si es un error silenciado
      throw error;
    }
    // Re-lanzar el error para que sea manejado por el componente
    console.error(`Error en fetchN8n (${method} ${endpoint}):`, error);
    throw error;
  }
};


// ===========================================
// CACHE HELPERS (inline para evitar import de TS)
// ===========================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const cacheStorage = new Map();

const cacheGet = (key) => {
  const item = cacheStorage.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > CACHE_TTL) {
    cacheStorage.delete(key);
    return null;
  }

  return item.data;
};

const cacheSet = (key, data) => {
  cacheStorage.set(key, { data, timestamp: Date.now() });
};

const cacheInvalidate = (key) => {
  if (key) {
    cacheStorage.delete(key);
  } else {
    cacheStorage.clear();
  }
};


// ===========================================
// Servicios de Autenticación
// ===========================================

export const auth = {
  /**
   * Iniciar sesión con credenciales
   * @param {object} credentials - { email, password }
   * @returns {Promise<{ token: string, user: object }>}
   */
  login: async (credentials) => {
    const response = await fetchN8n('/auth/login', 'POST', credentials);

    // Si el login es exitoso, guardar el token y datos del usuario
    if (response.token) {
      localStorage.setItem('korat_token', response.token);
    }
    if (response.user) {
      localStorage.setItem('korat_user', JSON.stringify(response.user));
      // Guardar business_id para usarlo en las peticiones multi-tenant
      if (response.user.business_id) {
        localStorage.setItem('korat_business_id', response.user.business_id);
      }
    }

    return response;
  },

  /**
   * Cerrar sesión (limpiar localStorage)
   */
  logout: () => {
    localStorage.removeItem('korat_token');
    localStorage.removeItem('korat_user');
    localStorage.removeItem('korat_business_id');
    window.location.hash = '#/login';
  },

  /**
   * Verificar si el usuario está autenticado
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('korat_token');
  },

  /**
   * Obtener usuario actual del localStorage
   * @returns {object|null}
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('korat_user');
    return user ? JSON.parse(user) : null;
  }
};


// ===========================================
// Servicios del Dashboard
// ===========================================

export const dashboard = {
  /**
   * 🚀 ENDPOINT UNIFICADO - Obtener TODOS los datos en una sola llamada
   * @param {boolean} forceRefresh - Forzar recarga ignorando caché
   * @returns {Promise<object>} - Objeto con clientes, citas, engagement, stats
   */
  getAll: async (forceRefresh = false) => {
    const CACHE_KEY = 'dashboard_all';

    // Intentar obtener de caché
    if (!forceRefresh) {
      const cached = cacheGet(CACHE_KEY);
      if (cached) {
        return cached;
      }
    }

    // CRÍTICO: Verificar business_id
    const businessId = localStorage.getItem('korat_business_id');

    if (!businessId) {
      console.error('❌ CRÍTICO: No hay business_id en localStorage');
      console.error('📋 Contenido de localStorage:', Object.keys(localStorage));
      // Intentar extraer de korat_user como fallback
      const user = localStorage.getItem('korat_user');
      if (user) {
        try {
          const parsed = JSON.parse(user);
          if (parsed.business_id) {
            localStorage.setItem('korat_business_id', parsed.business_id);
          }
        } catch (e) { }
      }
    }

    const finalBusinessId = localStorage.getItem('korat_business_id');

    if (!finalBusinessId) {
      console.error('❌ No se encontró business_id, devolviendo estructura vacía');
      return { success: false, data: { clientes: [], citas: [], staff: [], configuracion: [], premios: [], canjes: [] }, _meta: {} };
    }

    try {
      const [{ data, error }, { data: puntosData }] = await Promise.all([
        supabase.rpc('obtener_dashboard_completo', { p_business_id: finalBusinessId }),
        supabase.from('puntos_por_categoria').select('*').eq('negocio_id', finalBusinessId)
      ]);

      if (error) {
        throw error;
      }

      // El RPC ya devuelve la estructura idéntica a n8n: { success, data, _meta, timestamp }
      if (data && data.data) {
        data.data.puntos_por_categoria = puntosData || [];
      }

      // Guardar en caché
      cacheSet(CACHE_KEY, data);

      return data;
    } catch (error) {
      console.error('❌ Error cargando dashboard desde Supabase:', error);
      throw error;
    }
  },

  /**
   * Invalidar caché del dashboard (llamar después de cambios)
   */
  invalidateCache: () => {
    cacheInvalidate('dashboard_all');
  },

  /**
   * @deprecated Use `dashboard.getAll()` o `useDashboardData()` en su lugar.
   * Este endpoint está cubierto por /dashboard/all → response.stats
   * 
   * Obtener estadísticas generales del dashboard
   * @returns {Promise<object>} - Stats del negocio
   */
  getStats: async () => {
    console.warn('⚠️ dashboard.getStats() está deprecado. Usa dashboard.getAll() o useDashboardData()');
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/dashboard-stats${params}`, 'GET');
  },

  /**
   * @deprecated Use `dashboard.getAll()` o `useDashboardData()` en su lugar.
   * Este endpoint está cubierto por /dashboard/all → response.forecast
   * 
   * Obtener pronóstico financiero
   * @returns {Promise<object>} - Datos de forecast
   */
  getForecast: async () => {
    console.warn('⚠️ dashboard.getForecast() está deprecado. Usa dashboard.getAll() o useDashboardData()');
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/financial-forecast${params}`, 'GET');
  },

  /**
   * @deprecated Use `dashboard.getAll()` o `useDashboardData()` en su lugar.
   * Este endpoint está cubierto por /dashboard/all → response.citas
   * 
   * Obtener lista de citas/appointments (legacy endpoint)
   * @returns {Promise<array>} - Lista de citas
   */
  getAppointments: async () => {
    console.warn('⚠️ dashboard.getAppointments() está deprecado. Usa dashboard.getAll() o useDashboardData()');
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/appointments${params}`, 'GET');
  },

  /**
   * Obtener lista de citas desde el dashboard unificado
   * @returns {Promise<array>} - Lista de citas formateadas para calendario
   */
  getCitas: async (forceRefresh = false) => {
    // Usar el endpoint unificado y extraer solo las citas
    const data = await dashboard.getAll(forceRefresh);
    return data?.citas || [];
  },

  /**
   * Obtener historial financiero (7 días atrás + 7 días adelante)
   * @returns {Promise<object>} - Datos para el gráfico financiero
   */
  getFinancialHistory: async (businessId = null) => {
    const finalId = businessId || localStorage.getItem('korat_business_id');
    const params = finalId ? `?business_id=${finalId}` : '';
    return await fetchN8n(`/financial-history${params}`, 'GET');
  }
};


// ===========================================
// Servicios del CRM
// ===========================================

export const crm = {
  /**
   * Obtener lista de clientes desde el dashboard unificado
   * @param {boolean} forceRefresh - Forzar recarga ignorando caché
   * @returns {Promise<array>} - Lista de clientes
   */
  getClients: async (forceRefresh = false) => {
    const data = await dashboard.getAll(forceRefresh);
    return data?.clientes || [];
  },


  /**
   * Obtener lista de servicios disponibles
   * @returns {Promise<array>} - Lista de servicios
   */
  getServices: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/servicios${params}`, 'GET');
  },

  /**
   * Enviar campaña de rescate a un cliente
   * @param {string} clientId - ID del cliente a rescatar
   * @returns {Promise<object>} - Resultado de la operación
   */
  rescueClient: async (clientId) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/client/rescue', 'POST', { clientId, business_id: businessId });
  },

  /**
   * Actualizar notas de un cliente
   * @param {number} clientId - ID del cliente
   * @param {string} notas - Texto de las notas
   * @returns {Promise<object>} - Resultado de la operación
   */
  updateClientNotes: async (clientId, notas) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/clientes', 'PUT', { id: clientId, notas, business_id: businessId });
  },

  /**
   * Actualizar datos de un cliente (genérico)
   * @param {number} clientId - ID del cliente
   * @param {object} data - Campos a actualizar { nombre, telefono, notas, etc. }
   * @returns {Promise<object>} - Resultado de la operación
   */
  updateClient: async (clientId, data) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/clientes', 'PUT', { id: clientId, ...data, business_id: businessId });
  },

  /**
   * Crear un nuevo cliente
   * @param {object} clientData - Datos del nuevo cliente
   * @param {string} clientData.nombre - Nombre del cliente
   * @param {string} clientData.telefono - Teléfono del cliente
   * @returns {Promise<object>} - Cliente creado con su ID
   */
  createClient: async (clientData) => {
    const businessId = localStorage.getItem('korat_business_id');

    const payload = {
      nombre: clientData.nombre,
      telefono: clientData.telefono,
      fecha_registro: new Date().toISOString().split('T')[0],
      categoria: 'Nuevo',
      puntos_acumulados: 0,
      total_visitas: 0,
      Estado: 'Activo',
      business_id: businessId
    };

    const response = await fetchN8n('/clientes', 'POST', payload);

    // Normalizar respuesta: n8n a veces devuelve array [{...}]
    const data = Array.isArray(response) ? response[0] : response;

    return data;
  },

  /**
   * Eliminar un cliente
   * @param {number} clientId - ID del cliente a eliminar
   * @returns {Promise<object>} - Resultado de la operación
   */
  deleteClient: async (clientId) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/clientes', 'DELETE', { id: clientId, business_id: businessId });
  }
};


// ===========================================
// Servicios de Citas/Appointments
// ===========================================
// MIGRADO: Llama directamente a Supabase RPCs (sin n8n)

export const appointments = {
  /**
   * Crear una nueva cita via Supabase RPC crear_cita_segura.
   * La funcion en Supabase:
   *   1. Detecta solapamientos con duracion_min real del servicio
   *   2. Inserta la cita en tabla Citas
   *   3. Actualiza ultimo_servicio del cliente
   *   4. Acumula puntos de fidelidad (1 pt por cada S/10)
   */
  create: async (appointmentData) => {
    const businessId = localStorage.getItem('korat_business_id');
    const basePayload = {
      p_business_id:      businessId,
      p_fecha:            appointmentData.fecha || appointmentData.start_time,
      p_duracion_min:     appointmentData.duracion_min || 60,
      p_cliente_id:       appointmentData.cliente_id || appointmentData.client_id || null,
      p_nombre:           appointmentData.nombre || appointmentData.client_name || '',
      p_servicio:         appointmentData.servicio || appointmentData.service_name || '',
      p_precio:           appointmentData.precio || 0,
      p_staff_id:         appointmentData.staff_id || null,
      p_categoria:        appointmentData.categoria || null,
      p_origen_cita:      appointmentData.origen_cita || 'organico'
    };

    // Solo añadir parámetros de depósito/comprobante si explicitamente se requiere_deposito
    // esto ayuda a PostgREST a resolver la firma correcta sobrecargada sin lanzar un error de ambigüedad
    let payload = { ...basePayload };
    if (appointmentData.requiere_deposito) {
      payload.p_requiere_deposito = true;
      payload.p_monto_deposito = appointmentData.monto_deposito || 0;
      if (appointmentData.comprobante_url) {
         payload.p_comprobante_url = appointmentData.comprobante_url;
      }
    }

    const { data, error } = await supabase.rpc('crear_cita_segura', payload);
    if (error) throw new Error(error.message || 'Error al crear la cita');
    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.success === false) {
      const err = new Error(result.message || 'Este horario ya esta ocupado');
      err.code = result.error;
      err.status = 409;
      throw err;
    }
    return result;
  },

  /**
   * Actualizar / reagendar una cita via Supabase RPC actualizar_cita_segura.
   * Revalida solapamientos con duracion real.
   * Actualiza ultimo_servicio del cliente si cambia el servicio.
   */
  update: async (citaId, data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase.rpc('actualizar_cita_segura', {
      p_business_id:     businessId,
      p_cita_id:         citaId,
      p_nueva_fecha:     data.nueva_fecha || data.fecha || null,
      p_duracion_min:    data.duracion_min || 60,
      p_nuevo_servicio:  data.nuevo_servicio || data.servicio || null,
      p_nuevo_precio:    (data.nuevo_precio !== undefined && data.nuevo_precio !== null) ? data.nuevo_precio : (data.precio !== undefined ? data.precio : null),
      p_nuevo_estado:    data.nuevo_estado || data.estado || null,
      p_nuevo_staff_id:  data.staff_id !== undefined ? data.staff_id : null,
      p_nueva_categoria: data.categoria || null,
    });
    if (error) throw new Error(error.message || 'Error al actualizar la cita');
    const r = Array.isArray(result) ? result[0] : result;
    if (r && r.success === false) {
      const err = new Error(r.message || 'No se pudo actualizar la cita');
      err.code = r.error;
      err.status = r.error === 'STAFF_CONFLICT' ? 409 : 400;
      throw err;
    }
    return r;
  },

  /**
   * Eliminar una cita -> DELETE directo en tabla Citas
   */
  delete: async (citaId) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { error } = await supabase
      .from('Citas')
      .delete()
      .eq('id', citaId)
      .eq('business_id', businessId);
    if (error) throw new Error(error.message || 'Error al eliminar la cita');
    return { success: true, message: 'Cita cancelada con exito' };
  },

  /**
   * Actualizar estado de una cita -> UPDATE directo en Supabase
   */
  /**
   * Actualizar estado de una cita via RPC actualizar_estado_cita_y_puntos.
   * FIX E3: El RPC calcula puntos de fidelidad correctamente al pasar a Completada.
   * FIX E4: Al revertir de Completada, el RPC quita los puntos acumulados.
   */
  updateStatus: async (citaId, nuevoEstado) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data, error } = await supabase.rpc('actualizar_estado_cita_y_puntos', {
      p_cita_id:    citaId,
      p_estado:     nuevoEstado,
      p_business_id: businessId,
    });
    if (error) throw new Error(error.message || 'Error al actualizar estado de cita');
    const result = Array.isArray(data) ? data[0] : data;
    if (result && result.success === false) {
      throw new Error(result.error || result.message || 'No se pudo actualizar el estado');
    }
    return result;
  },

  /**
   * Verificar deposito de una cita -> UPDATE directo en Supabase
   */
  verifyDeposit: async (citaId) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data, error } = await supabase
      .from('Citas')
      .update({ deposito_verificado: true })
      .eq('id', citaId)
      .eq('business_id', businessId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Obtener citas de un dia -> SELECT directo en Supabase
   * Ya no depende del endpoint GET /citas de n8n.
   */
  getAvailability: async (fecha, duracionMin, staffId) => {
    duracionMin = duracionMin || 60;
    staffId = staffId || null;
    const businessId = localStorage.getItem('korat_business_id');
    const fechaInicio = fecha + 'T00:00:00';
    const fechaFin    = fecha + 'T23:59:59';
    let query = supabase
      .from('Citas')
      .select('id, fecha, duracion_min, nombre, servicio, estado, staff_id')
      .eq('business_id', businessId)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .not('estado', 'in', '("Cancelada","No-Show")');
    if (staffId) query = query.eq('staff_id', staffId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },
};


// ===========================================
// Servicios de Retención
// ===========================================

export const retention = {
  /**
   * Obtener estadísticas de retención para el widget del Dashboard
   * @returns {Promise<object>} - Stats de retención por impacto
   */
  getStats: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/clientes/retention-stats${params}`, 'GET');
  },

  /**
   * Rescate manual con tipo de impacto específico
   * @param {string} clientId - ID del cliente
   * @param {number} impactType - Tipo de impacto (1, 2 o 3)
   * @returns {Promise<object>} - Resultado de la operación
   */
  rescueManual: async (clientId, impactType) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/client/rescue-manual', 'POST', {
      clientId,
      impactType,
      business_id: businessId
    });
  },

  /**
   * Obtener historial de rescates
   * @param {number} limit - Límite de resultados (opcional)
   * @returns {Promise<object>} - Historial de rescates
   */
  getRescueHistory: async (limit = 20) => {
    const businessId = localStorage.getItem('korat_business_id');
    const params = new URLSearchParams();
    if (businessId) params.append('business_id', businessId);
    params.append('limit', limit.toString());
    return await fetchN8n(`/rescates/historial?${params}`, 'GET');
  },

  /**
   * Obtener sugerencia de plan de rescate con IA
   * @returns {Promise<object>} - Análisis y sugerencia de la IA
   */
  getPlanSuggestion: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/rescue/plan-suggestion${params}`, 'GET');
  },

  /**
   * Ejecutar plan de rescate masivo
   * @param {object} planData - Datos del plan
   * @param {string[]} planData.clientIds - IDs de clientes a rescatar (opcional)
   * @param {string} planData.mensaje - Mensaje a enviar
   * @param {string} planData.estrategia - Tipo de estrategia
   * @param {number} planData.limite - Máximo de clientes a contactar
   * @returns {Promise<object>} - Resultado con cantidad de enviados
   */
  executePlan: async (planData) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/rescue/execute-plan', 'POST', { ...planData, business_id: businessId });
  }
};


// ===========================================
// Servicios de Business Brief
// ===========================================

export const business = {
  /**
   * Obtener brief del negocio (GET /brief)
   * @param {string} businessId
   */
  getBrief: async (businessId) => {
    return await fetchN8n(`/brief?business_id=${businessId}`, 'GET');
  },

  /**
   * Guardar nuevo brief (POST /brief)
   * @param {object} briefData
   */
  saveBrief: async (briefData) => {
    return await fetchN8n('/brief', 'POST', briefData);
  },

  /**
   * Actualizar brief existente (PUT /brief)
   * @param {object} briefData
   */
  updateBrief: async (briefData) => {
    return await fetchN8n('/brief', 'PUT', briefData);
  },

  /**
   * Verificar si un negocio tiene brief completado
   * @param {string} businessId - ID del negocio
   * @returns {Promise<boolean>} - true si tiene brief
   */
  hasBrief: async (businessId) => {
    try {
      const response = await business.getBrief(businessId);
      return response && response.business_id ? true : false;
    } catch {
      return false;
    }
  },

  /**
   * Obtener información pública del negocio (nombre, slug, logo)
   * @param {string} businessId
   */
  getPublicInfo: async (businessId) => {
    if (!businessId) businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return null;

    const { data, error } = await supabase
      .from('negocios')
      .select('id, nombre, logo_url')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('[API Negocios] Error getting public info:', error);
      return null;
    }
    return data;
  }
};


// ===========================================
// Servicios de Campañas Marketing
// ===========================================

export const campaigns = {
  /**
   * Obtener fechas clave del calendario por país
   * @param {string} countryCode - Código del país (PE, MX, etc)
   * @param {string} month - Mes opcional (01-12)
   * @returns {Promise<object>} - Fechas clave
   */
  getCalendar: async (countryCode = 'PE', month = '') => {
    const params = new URLSearchParams({ country: countryCode });
    if (month) params.append('month', month);
    return await fetchN8n(`/campaigns/calendar?${params}`, 'GET');
  },

  /**
   * Generar mensaje y recomendaciones con IA
   * @param {object} campaignData - Datos de la campaña
   * @returns {Promise<object>} - Mensaje, imagen generados
   */
  generate: async (campaignData) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/campanas/generar', 'POST', { ...campaignData, business_id: businessId });
  },

  /**
   * Generar imagen IA para campaña (Nilah Studio Creativo)
   * @param {object} payload - { estilo, servicio, formato, promptExtra }
   * @returns {Promise<object>} - { imagen_url, prompt_usado }
   */
  generateVisual: async (payload) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/nilah-studio/generar', 'POST', {
      business_id: businessId,
      ...payload
    });
  },

  /**
   * Obtener todas las campañas de un negocio (Directo Supabase)
   * @param {string} businessId - ID del negocio
   * @param {object} filters - Filtros opcionales { estado }
   * @returns {Promise<array>} - Lista de campañas
   */
  getAll: async (businessId, filters = {}) => {
    let query = supabase.from('campanas').select('*').eq('business_id', businessId).order('created_at', { ascending: false });
    if (filters.estado) query = query.eq('estado', filters.estado);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Crear/guardar una campaña vía N8N Master Flow (evita RLS de Supabase)
   * @param {object} campaignData - Datos de la campaña
   * @returns {Promise<array>} - Array [{ id, titulo, business_id, estado }]
   */
  create: async (campaignData) => {
    const businessId = localStorage.getItem('korat_business_id');
    // Strip invalid/duplicate fields, remap ingreso_estimado
    const { business_id: _biz, ...payload } = campaignData;
    
    const result = await fetchN8n('/marketing/flow', 'POST', {
      business_id: businessId,
      action: 'crear_campana',
      payload: {
        ...payload,
        business_id: businessId,
      },
    });

    // Normalize to array format for compatibility with callers using [0].id
    if (Array.isArray(result)) return result;
    if (result?.id) return [result];
    return result;
  },

  /**
   * Eliminar una campaña (Directo Supabase)
   * @param {number} campaignId - ID de la campaña
   * @returns {Promise<object>} - Resultado de la eliminación
   */
  delete: async (campaignId) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data, error } = await supabase.from('campanas').delete().eq('id', campaignId).eq('business_id', businessId).select();
    if (error) throw error;
    return data;
  },

  /**
   * Obtener sugerencias de segmentos inteligentes basados en BI
   * @returns {Promise<array>} - Lista de sugerencias de segmentos
   */
  getSmartSegments: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];
    try {
      const { data, error } = await supabase.rpc('get_smart_segments_suggestions', { p_business_id: businessId });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching smart segments:', err);
      return [];
    }
  },

  /**
   * Obtener audiencias inteligentes disponibles para la campaña semanal.
   * Usa lazy cache en Supabase (se recalcula cada 6h). Para forzar recarga usar forceRefresh=true.
   * @param {number} [overrideClientCount] - Count override para tests
   * @param {boolean} [forceRefresh=false] - Si true, invalida caché y recalcula
   * @returns {Promise<{ fase, business_age_months, total_clientes, crm: [], marketing: [] }>}
   */
  getSmartAudiences: async (overrideClientCount, forceRefresh = false) => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return null;

    // Fetch REAL client count from dashboard memory cache or override
    let realClientCount = overrideClientCount !== undefined ? overrideClientCount : 0;

    if (overrideClientCount === undefined) {
      try {
        const cachedData = cacheGet('dashboard_all');
        if (cachedData?.clientes) {
          realClientCount = cachedData.clientes.length;
        }
      } catch (e) {
        console.warn('Could not fetch real client count from cache:', e);
      }
    }

    // Obtener moneda del negocio
    let monedaSymbol = 'S/.';
    try {
      const { data } = await supabase.from('negocios').select('moneda').eq('id', businessId).maybeSingle();
      if (data?.moneda) monedaSymbol = data.moneda;
    } catch (e) {
      console.warn('Could not fetch currency for audiences:', e);
    }

    // Contar segmentos usando la RPC con lazy cache en Supabase
    const stats = {};
    try {
      const { data, error } = await supabase.rpc('get_marketing_audience_stats', {
        p_business_id: businessId,
        p_force_refresh: forceRefresh
      });

      if (!error && data) {
        data.forEach(row => {
          stats[row.segment_id] = parseInt(row.count_clients, 10) || 0;
        });
      } else if (error) {
        console.error('Error in get_marketing_audience_stats RPC:', error);
      }
    } catch (e) {
      console.error('Error fetching audience stats:', e);
    }

    const s = (id) => stats[id] || 0;
    const r = (id, assumedTicket = 80) => {
      const c = s(id);
      if (c === 0) return undefined;
      return `+ ${monedaSymbol}${(c * assumedTicket).toLocaleString()} potenciales`;
    };
    const dynamicAge = Math.max(1, Math.floor(realClientCount / 50));

    return {
      business_age_months: dynamicAge,
      fase: realClientCount > 500 ? 'autoridad' : (realClientCount > 100 ? 'crecimiento' : 'semilla'),
      total_clientes: realClientCount,
      crm: [
        {
          id: 'crm-vip', capa: 'crm', nombre: 'Clientas VIP 👑', icono: '👑', color: 'violet',
          count: s('crm-vip'), desbloqueado: true,
          descripcion: 'Clientas con 26+ visitas O ticket acumulado mayor a S/2,000. Tus embajadoras.',
          insight: 'Son tu núcleo duro. Un mensaje exclusivo de "te lo mereces" y trato de primera asegura que nunca se vayan.',
          roi_tip: 'Tasa de retención histórica: 98%',
          estrategia: 'Exclusividad',
          roi_badge: r('crm-vip', 120)
        },
        {
          id: 'crm-fiel', capa: 'crm', nombre: 'Clientas Fieles 💎', icono: '💎', color: 'blue',
          count: s('crm-fiel'), desbloqueado: true,
          descripcion: 'Tienen de 13 a 25 visitas O un ticket acumulado de S/1,000 a S/2,000.',
          insight: 'Alta retención. Ideales para armar programas de recompensas o planes anuales, ya confían en tu servicio.',
          roi_tip: 'Candidatas #1 para paquetes anuales o membresías.',
          estrategia: 'Membresías',
          roi_badge: r('crm-fiel', 90)
        },
        {
          id: 'crm-regular', capa: 'crm', nombre: 'Regulares ⭐', icono: '⭐', color: 'emerald',
          count: s('crm-regular'), desbloqueado: true,
          descripcion: 'Entre 5 y 12 visitas O gasto acumulado mayor a S/400. Clientas confiables.',
          insight: 'Conocen el servicio pero aún pueden ser atraídas por la competencia. Ofréceles upgrades gratuitos en su servicio habitual.',
          roi_tip: 'Invertir en su frecuencia de visita eleva el LTV un 40%',
          estrategia: 'Frecuencia',
          roi_badge: r('crm-regular', 70)
        },
        {
          id: 'crm-casual', capa: 'crm', nombre: 'Casuales 💅', icono: '💅', color: 'pink',
          count: s('crm-casual'), desbloqueado: true,
          descripcion: 'Llevan 2 a 4 visitas y LTV menor a S/400. Vienen de vez en cuando.',
          insight: 'Aún no tienen un hábito creado contigo. Un recordatorio amigable a las 3 semanas de su visita ayuda a cerrar la brecha.',
          roi_tip: 'Convertirlas a Regulares multiplica su valor anual x3.',
          estrategia: 'Hábito',
          roi_badge: r('crm-casual', 55)
        },
        {
          id: 'crm-nuevas', capa: 'crm', nombre: 'Nuevas 🌱', icono: '🌱', color: 'amber',
          count: s('crm-nuevas'), desbloqueado: true,
          descripcion: 'Solo tienen 1 visita registrada. Primera impresión.',
          insight: 'El riesgo de abandono es más alto aquí. Envíales un mensaje de bienvenida con un pequeño incentivo para su segunda cita.',
          roi_tip: '70% decide si volverá dentro de los primeros 10 días desde su cita',
          estrategia: 'Conversión',
          roi_badge: r('crm-nuevas', 60)
        },
      ],
      marketing: [
        {
          id: 'crm-nuevas-recientes', capa: 'marketing', nombre: 'Nuevas Recientes', icono: '👋', color: 'emerald',
          count: s('crm-nuevas-recientes'), desbloqueado: true,
          descripcion: 'Primerizas en los últimos 30 días.',
          insight: 'Excelente segmento para enviar una encuesta de satisfacción y un 10% OFF en su 2da visita.',
          roi_tip: 'Duplica la probabilidad de regreso',
          estrategia: 'Fidelización Temprana',
          roi_badge: r('crm-nuevas-recientes', 60)
        },
        {
          id: 'crm-30', capa: 'marketing', nombre: 'Ausentes 30 Días', icono: '⏱️', color: 'orange',
          count: s('crm-30'), desbloqueado: true,
          descripcion: 'Clientas que llevan 30-60 días sin venir. (No aplica para nuevas)',
          insight: 'Aún recordables. La reactivación temprana evita el abandono permanente.',
          roi_tip: 'Ventana óptima de retención de regulares',
          estrategia: 'Reactivación',
          roi_badge: r('crm-30', 70)
        },
        {
          id: 'crm-perdidas', capa: 'marketing', nombre: 'Clientas Perdidas', icono: '💔', color: 'rose',
          count: s('crm-perdidas'), desbloqueado: s('crm-perdidas') > 0,
          descripcion: 'No regresan hace 120+ días.',
          condicion_desbloqueo: 'cuando registres clientas con más de 120 días de ausencia',
          insight: 'Campaña de "te extrañamos" con gancho agresivo para recuperar su interés.',
          roi_tip: 'Más barato de reactivar que adquirir leads fríos',
          estrategia: 'Recuperación',
          roi_badge: r('crm-perdidas', 50)
        },
        {
          id: 'crm-cumples', capa: 'marketing', nombre: 'Cumpleañeras', icono: '🎂', color: 'pink',
          count: s('crm-cumples'), desbloqueado: true,
          descripcion: 'Cumpleaños en los próximos 15 días.',
          insight: 'Envía un saludo con un "regalo" especial en salón (ej. Masaje o hidratación de cortesía).',
          roi_tip: 'Tasa de apertura > 80%',
          estrategia: 'Conexión Emocional',
          roi_badge: r('crm-cumples', 90)
        },
        {
          id: 'mkt-points', capa: 'marketing', nombre: 'Puntos Dormidos', icono: '🎁', color: 'emerald',
          count: s('mkt-points'), desbloqueado: s('mkt-points') > 0,
          descripcion: 'Tienen 100+ puntos acumulados para canjear pero no lo saben o no lo hacen.',
          condicion_desbloqueo: 'cuando actives el programa de fidelización',
          insight: 'Recordarles sus puntos genera una visita inmediata. Es el mensaje con mejor ROI del año.',
          roi_tip: 'Tasa de conversión de recordatorio de puntos: 55%',
          estrategia: 'Fidelización',
          roi_badge: r('mkt-points', 100)
        },
        {
          id: 'mkt-early', capa: 'marketing', nombre: 'Early Adopters', icono: '🚀', color: 'violet',
          count: s('mkt-early'), desbloqueado: true,
          descripcion: 'Han probado 3+ categorías de servicios. Tu audiencia más experimental y atrevida.',
          insight: 'Úsalas como "modelos" para probar nuevos servicios. Su opinión vale más que cualquier encuesta.',
          roi_tip: 'Influencers internas: cada una refiere en promedio 3 personas nuevas',
          estrategia: 'Innovación',
          roi_badge: r('mkt-early', 120)
        },
        {
          id: 'mkt-discount', capa: 'marketing', nombre: 'Cazadoras de Ofertas', icono: '🏷️', color: 'amber',
          count: s('mkt-discount'), desbloqueado: true,
          descripcion: 'Ticket promedio bajo. Solo asisten por promociones o en temporadas de descuentos.',
          insight: 'No gastes margen en ellas regularmente. Resérvalas para días lentos (martes/miércoles) para llenar huecos.',
          roi_tip: 'Perfectas para rentabilizar tiempo muerto en la agenda',
          estrategia: 'Eficiencia',
          roi_badge: r('mkt-discount', 40)
        },
        {
          id: 'mkt-slowdays', capa: 'marketing', nombre: 'Flexibles (Días Lentos)', icono: '📉', color: 'blue',
          count: s('mkt-slowdays'), desbloqueado: s('mkt-slowdays') > 0,
          descripcion: 'Históricamente agendan martes/miércoles. Las perfectas para dinamizar días valle.',
          condicion_desbloqueo: 'cuando el sistema detecte patrones de asistencia en días valle',
          insight: 'Una promo de "Martes Mágico" dirigida solo a ellas puede llenar tu agenda un 40%.',
          roi_tip: `Potencial días lentos: +${monedaSymbol}${(s('mkt-slowdays') * 60).toLocaleString()} / semana`,
          estrategia: 'Agenda',
          roi_badge: r('mkt-slowdays', 60)
        },
        {
          id: 'mkt-churn', capa: 'marketing', nombre: 'Riesgo de Fuga', icono: '🚨', color: 'rose',
          count: s('mkt-churn'), desbloqueado: s('mkt-churn') > 0,
          descripcion: 'Llevan 45+ días sin aparecer y tenían historial de 5+ visitas. Señal de alarma.',
          condicion_desbloqueo: 'cuando la IA detecte desvíos en la frecuencia de visitas de clientas regulares',
          insight: 'Actuar ahora es 7x más económico que reemplazarlas. Una llamada personalizada rescata al 30%.',
          roi_tip: 'Cada cliente rescatada equivale al LTV promedio de 5 visitas',
          estrategia: 'Rescate',
          roi_badge: r('mkt-churn', 90)
        },
        {
          id: 'mkt-morning', capa: 'marketing', nombre: 'Público Mañanero ☕', icono: '☕', color: 'amber',
          count: s('mkt-morning'), desbloqueado: true,
          descripcion: 'Sus citas suelen ser antes de las 12:00 PM. Estudiantes o independientes.',
          insight: 'Ofréceles un "Pack Desayuno Beauty" o descuentos flash para llenar tus primeras horas del día.',
          roi_tip: 'Ideal para elevar la ocupación matutina en un 25%',
          estrategia: 'Early Bird',
          roi_badge: r('mkt-morning', 65)
        },
        {
          id: 'mkt-afternoon', capa: 'marketing', nombre: 'Público de Tarde ☀️', icono: '☀️', color: 'orange',
          count: s('mkt-afternoon'), desbloqueado: true,
          descripcion: 'Asisten entre 12:00 PM y 5:00 PM. Clientela con horarios flexibles.',
          insight: 'Un "Break de Tarde" con un servicio express adicional (ej. hidratación) funciona de maravilla.',
          roi_tip: 'Optimiza el bloque de mayor disponibilidad de staff',
          estrategia: 'Mid-Day Boost',
          roi_badge: r('mkt-afternoon', 75)
        },
        {
          id: 'mkt-night', capa: 'marketing', nombre: 'After-Office 🌙', icono: '🌙', color: 'violet',
          count: s('mkt-night'), desbloqueado: true,
          descripcion: 'Prefieren citas después de las 5:00 PM. Profesionales que vienen al salir de oficina.',
          insight: 'Envíales promociones flash los días que tengas cancelaciones de última hora en el turno noche.',
          roi_tip: 'Asegura el cierre del día con agenda llena',
          estrategia: 'Night Owl',
          roi_badge: r('mkt-night', 85)
        },
        {
          id: 'mkt-tue-wed', capa: 'marketing', nombre: 'Fieles Martes/Mier 📅', icono: '📅', color: 'blue',
          count: s('mkt-tue-wed'), desbloqueado: true,
          descripcion: 'Clientas que históricamente agendan martes o miércoles. Tus aliadas en días lentos.',
          insight: 'Dales prioridad en promociones de "Días de Oro" para garantizar que tus días valle sean rentables.',
          roi_tip: 'Estabiliza el flujo de caja semanal desde el inicio',
          estrategia: 'Agenda Inteligente',
          roi_badge: r('mkt-tue-wed', 70)
        },
        {
          id: 'mkt-primera-vez-facial', capa: 'marketing', nombre: '1ª Vez Facial', icono: '🧖', color: 'pink',
          count: s('mkt-primera-vez-facial'), desbloqueado: true,
          descripcion: 'Clientas activas que nunca han probado ningún servicio facial. Cross-sell de alto valor.',
          insight: 'Ofrecer una Limpieza Facial de introducción a mitad de precio convierte al 28% de este segmento.',
          roi_tip: `Potencial de activación: ${monedaSymbol}${(s('mkt-primera-vez-facial') * 50).toLocaleString()}`,
          estrategia: 'Cross-Sell',
          roi_badge: r('mkt-primera-vez-facial', 80)
        },
        // --- NEW SMART AI SEGMENTS FROM IDEA 5 ---
        {
          id: 'xsell-color-gloss', capa: 'marketing', nombre: 'Retoque de Color Perfecto', icono: '🎨', color: 'rose',
          count: s('xsell-color-gloss'), desbloqueado: s('xsell-color-gloss') > 0,
          descripcion: 'Clientas que se hicieron Mechas o Balayage hace exactamente 21-28 días.',
          condicion_desbloqueo: 'cuando registres clientas de coloración recurrentes',
          insight: 'Su color está empezando a oxidarse. Es el momento perfecto para venderles un Baño de Color rápido antes de que se vean mal.',
          roi_tip: 'Eleva el ticket promedio mensual del cliente de color',
          estrategia: 'Mantenimiento',
          roi_badge: r('xsell-color-gloss', 90)
        },
        {
          id: 'xsell-nails-overdue', capa: 'marketing', nombre: 'Alerta de Uñas Crecidas', icono: '💅', color: 'pink',
          count: s('xsell-nails-overdue'), desbloqueado: s('xsell-nails-overdue') > 0,
          descripcion: 'Clientas de Acrílico/Gel que vinieron hace exactamente 18+ días.',
          condicion_desbloqueo: 'cuando registres manicuras regulares',
          insight: 'Ya tienen crecimiento visible, necesitan su retoque ahora. Manda recordatorio para evitar quiebres.',
          roi_tip: 'Mantiene un flujo quincenal constante.',
          estrategia: 'Mantenimiento',
          roi_badge: r('xsell-nails-overdue', 50)
        },
        {
          id: 'xsell-hair-no-nails', capa: 'marketing', nombre: 'Las Traicioneras Silenciosas', icono: '✂️', color: 'blue',
          count: s('xsell-hair-no-nails'), desbloqueado: s('xsell-hair-no-nails') > 0,
          descripcion: 'VIPs que solo se hacen cabello pero NUNCA se han hecho las manos/pies contigo.',
          condicion_desbloqueo: 'automático cuando detectemos clientes cruzados',
          insight: 'Son leales, pero se están haciendo las uñas en otro salón. Ofrece 50% OFF en su primera manicura; las robaremos.',
          roi_tip: 'Venta cruzada aumenta LTV un 25%',
          estrategia: 'Cross-Sell',
          roi_badge: r('xsell-hair-no-nails', 45)
        },
        {
          id: 'xsell-long-service', capa: 'marketing', nombre: 'Paquetes de Tiempo Muerto', icono: '☕', color: 'amber',
          count: s('xsell-long-service'), desbloqueado: s('xsell-long-service') > 0,
          descripcion: 'Clientas que piden servicios largos (ej: Alisado 3h) y no compran nada más.',
          condicion_desbloqueo: 'automático al usar servicios de larga duración',
          insight: 'Mientras el producto reposa, ¡véndeles las pestañas o manicure simultánea! No te gasta tiempo operativo extra.',
          roi_tip: 'Aumenta el ingreso por hora en un 30%',
          estrategia: 'Upsell Optimizado',
          roi_badge: r('xsell-long-service', 60)
        },
        {
          id: 'crm-promo-only', capa: 'marketing', nombre: 'Las Caza-Promos', icono: '🏷', color: 'orange',
          count: s('crm-promo-only'), desbloqueado: s('crm-promo-only') > 0,
          descripcion: 'Solo han venido cuando envías descuentos o en fechas Black Friday.',
          condicion_desbloqueo: 'automático al cruzar historial con descuentos',
          insight: 'Estas clientas reaccionan fuerte al OFF%. No gastes margen en ellas; mándales súper promo SOLO días martes lentos.',
          roi_tip: 'Perfectas para rentabilizar espacios vacíos rotundos.',
          estrategia: 'Caza Ofertas',
          roi_badge: r('crm-promo-only', 30)
        },
        {
          id: 'crm-seasonal-whale', capa: 'marketing', nombre: 'Las Ballenas de Temporada', icono: '👑', color: 'emerald',
          count: s('crm-seasonal-whale'), desbloqueado: s('crm-seasonal-whale') > 0,
          descripcion: 'Hace exactamente 1 año gastaron durísimo, pero este mes no han asomado.',
          condicion_desbloqueo: 'se activa luego de 1 año de operación',
          insight: 'Recuérdales reservar antes de que gasten el sueldo en otro salón. ¡No dejes que se escapen a la competencia!',
          roi_tip: 'Recupera tickets enormes perdidos',
          estrategia: 'Recuperación VIP',
          roi_badge: r('crm-seasonal-whale', 250)
        },
        {
          id: 'crm-bday-missed', capa: 'marketing', nombre: 'Cumpleaños Atrasados', icono: '🎉', color: 'pink',
          count: s('crm-bday-missed'), desbloqueado: s('crm-bday-missed') > 0,
          descripcion: 'Tuvieron cumple el mes pasado y no lo celebraron contigo.',
          condicion_desbloqueo: 'automático el primer día de cada mes',
          insight: '"Llegamos tarde, pero tu regalo sigo intacto. Ven por tu masaje de regalo". Genera una ternura que convierte seguro.',
          roi_tip: 'Tasa de respuesta emocional: 65%',
          estrategia: 'Fidelización Emocional',
          roi_badge: r('crm-bday-missed', 80)
        },
        {
          id: 'crm-vip-alert', capa: 'marketing', nombre: 'VIP en Alerta Amarilla', icono: '🚦', color: 'amber',
          count: s('crm-vip-alert'), desbloqueado: s('crm-vip-alert') > 0,
          descripcion: 'Venían rigurosamente cada 3 semanas, pero llevan 5 semanas sin venir.',
          condicion_desbloqueo: 'automático cuando rompen su patrón de visita',
          insight: 'No se han perdido (aún). Están coqueteando con no regresar. Dales atención extrema de inmediato.',
          roi_tip: 'Previene pérdida masiva de valor (Churn Prevent)',
          estrategia: 'Rescate Crítico',
          roi_badge: r('crm-vip-alert', 150)
        },
      ],
      crm_extra: [
        {
          id: 'crm-resenas', capa: 'crm', nombre: 'Embajadoras 5★', icono: '⭐', color: 'violet',
          count: s('crm-resenas'), desbloqueado: s('crm-resenas') > 0,
          descripcion: 'Clientas que te dejaron 5 estrellas en alguna cita. Tu mejor canal de marketing orgánico.',
          condicion_desbloqueo: 'cuando recibas calificaciones de 5 estrellas en el sistema',
          insight: 'Son tus embajadoras. Invítalas a ser parte de un programa exclusive de referidos. Una foto en sus redes vale más que publicidad pagada.',
          roi_tip: 'Una review positiva = +12 nuevos clientes potenciales',
          estrategia: 'Boca a Boca',
          roi_badge: r('crm-resenas', 100)
        },
        {
          id: 'mkt-overdue', capa: 'crm', nombre: 'Retoques Vencidos ⏰', icono: '⏰', color: 'rose',
          count: s('mkt-overdue'), desbloqueado: true,
          descripcion: 'Clientas cuya última cita fue hace más de 21 días y no han regresado. Probablemente necesitan un retoque.',
          insight: 'El 80% de ellas agenda si envías un recordatorio amistoso advirtiendo el desgaste del servicio.',
          roi_tip: `Potencial inmediato: ${monedaSymbol}${(s('mkt-overdue') * 75).toLocaleString()} en retoques`,
          estrategia: 'Urgencia',
          roi_badge: r('mkt-overdue', 75)
        },
      ],
    };

    // ── Build DYNAMIC service segments via get_business_service_categories ─────
    try {
      const { data: serviceCategories, error: catError } = await supabase.rpc(
        'get_business_service_categories',
        { p_business_id: businessId }
      );

      // Color palette for dynamic categories (cycling)
      const DYNAMIC_COLORS = ['pink', 'violet', 'amber', 'emerald', 'blue', 'rose', 'cyan', 'orange'];

      // Auto-detect cross-sell opportunity:
      // The category with the 2nd most clients becomes the cross-sell target for those in the largest category
      const serviceStats = serviceCategories
        ? serviceCategories.map(cat => ({ ...cat, count: s(cat.segment_id) }))
        : [];
      const sortedByCount = [...serviceStats].sort((a, b) => b.count - a.count);
      const topCat = sortedByCount[0];
      const crossSellCat = sortedByCount[1];

      if (!catError && serviceCategories && serviceCategories.length > 0) {
        structure.servicios = serviceCategories.map((cat, idx) => {
          const count = s(cat.segment_id);
          const color = DYNAMIC_COLORS[idx % DYNAMIC_COLORS.length];
          const isTopCategory = topCat && cat.segment_id === topCat.segment_id;
          const hasCrossSell = crossSellCat && cat.segment_id === topCat?.segment_id;

          let insight = `Clientes que han agendado servicios de ${cat.nombre} en tu salón.`;
          let roi_tip = `Potencial campaña: ${count} clientes × tu ticket promedio de ${cat.nombre}`;
          let estrategia = 'Retención';

          if (isTopCategory) {
            insight = `Tu categoría más popular. Ideal para campañas de temporada y nuevas tendencias en ${cat.nombre}.`;
            estrategia = 'Liderazgo';
          }
          if (hasCrossSell && crossSellCat) {
            roi_tip = `Cross-sell a ${crossSellCat.nombre}: hasta ${monedaSymbol}${(count * 0.25 * 80).toLocaleString()} potencial`;
            estrategia = 'Cross-Sell';
          }

          return {
            id: cat.segment_id,
            capa: 'servicios',
            nombre: `${cat.emoji} Clientas de ${cat.nombre}`,
            icono: cat.emoji,
            color,
            count,
            desbloqueado: count > 0,
            descripcion: cat.descripcion || `Han tenido al menos 1 servicio de ${cat.nombre} en el salón.`,
            condicion_desbloqueo: count === 0 ? `cuando registres citas de servicios de ${cat.nombre}` : undefined,
            insight,
            roi_tip,
            estrategia,
            // Store service names for advanced matching
            _service_names: cat.service_names || [],
          };
        });
      } else {
        // Fallback: empty servicios array if RPC fails
        console.warn('[Audiences] Could not load service categories dynamically:', catError);
        structure.servicios = [];
      }
    } catch (e) {
      console.error('[Audiences] Error fetching dynamic service categories:', e);
      structure.servicios = [];
    }

    return structure;
  },

  /**
   * Obtener plan mensual existente (GET)
   * @param {string} businessId
   * @param {number} month - 1-12
   * @param {number} year
   */
  getMonthlyPlan: async (businessId, month, year) => {
    const params = new URLSearchParams({
      business_id: businessId,
      month: month.toString(),
      year: year.toString()
    });
    return await fetchN8n(`/campanas/plan-mensual?${params}`, 'GET');
  },

  /**
   * Generar nuevo plan mensual con IA (POST)
   * @param {string} businessId
   * @param {number} month
   * @param {number} year
   * @param {boolean} regenerar
   */
  generateMonthlyPlan: async (businessId, month, year, regenerar = false) => {
    return await fetchN8n('/campanas/plan-mensual', 'POST', {
      business_id: businessId,
      mes: month,
      anio: year,
      regenerar
    });
  },

  /**
   * Enviar/lanzar una campaña
   * @param {number} campaignId - ID de la campaña
   * @param {object} options - Opciones adicionales
   * @returns {Promise<object>} - Resultado del envío
   */
  send: async (campaignId, options = {}) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/campanas/enviar', 'POST', {
      campana_id: campaignId,
      business_id: businessId,
      ...options
    });
  },

  /**
   * 🚀 NUEVO: Flujo Maestro de Marketing Nilah
   * Centraliza todas las acciones de IA y Programación en un solo webhook
   * @param {string} action - 'generate_month' | 'generate_assets' | 'schedule' | 'execute'
   * @param {object} payload - Datos específicos de la acción
   */
  flow: async (action, payload = {}) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/marketing/flow', 'POST', {
      business_id: businessId,
      action,
      payload
    });
  },

  /**
   * Obtener métricas agregadas de marketing
   * @param {string} businessId - ID del negocio
   * @returns {Promise<object>} - Resumen, top campañas, etc.
   */
  getMetrics: async (businessId) => {
    return await fetchN8n(`/campanas/metricas?business_id=${businessId}`, 'GET');
  },

  /**
   * Registrar evento de campaña (desde chatbot)
   * @param {object} evento - { business_id, tipo_evento, campana_id, monto? }
   * @returns {Promise<object>} - Confirmación
   */
  registrarEvento: async (evento) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/campanas/metrica', 'POST', { ...evento, business_id: evento.business_id || businessId });
  },

  /**
   * Obtener zonas muertas (horarios con baja ocupación)
   * @param {string} businessId - ID del negocio
   * @returns {Promise<object>} - Zonas muertas y sugerencias
   */
  getZonasMuertas: async (businessId) => {
    return await fetchN8n(`/zonas-muertas?business_id=${businessId}`, 'GET');
  },

  /**
   * Forzar recálculo de ocupación
   * @param {string} businessId - ID del negocio
   * @returns {Promise<object>} - Confirmación
   */
  calcularOcupacion: async (businessId) => {
    return await fetchN8n('/zonas-muertas/calcular', 'POST', { business_id: businessId });
  },

  /**
   * Obtener el Daily Briefing de IA
   * @param {string} businessId - ID del negocio
   * @returns {Promise<object>} - Resumen de ayer, semana, recomendación
   */
  getDailyBriefing: async (businessId) => {
    return await fetchN8n(`/briefing/daily?business_id=${businessId}`, 'GET');
  },

  /**
   * 🚀 NUEVO: Dashboard unificado de Marketing
   * Retorna campañas + métricas de segmentación en una sola llamada
   * @param {string} businessId - ID del negocio
   * @returns {Promise<object>} - { campaigns, segments, metrics }
   */
  getDashboard: async (businessId) => {
    const params = new URLSearchParams({ business_id: businessId });
    const response = await fetchN8n(`/campanas?${params}`, 'GET');

    // Normalizar respuesta (n8n devuelve estructura combinada)
    const data = Array.isArray(response) ? response[0] : response;

    return {
      campaigns: data.campanas || data.campaigns || [],
      segments: data.segments || {
        vip: 0,
        recuperar: 0,
        nuevo: 0,
        recurrente: 0,
        interes_unas: 0,
        interes_pestanas: 0,
        interes_cabello: 0,
        total: 0
      },
      metrics: data.metrics || null
    };
  },

  /**
   * 🚀 NUEVO: Enviar campaña con control de velocidad
   * @param {object} params - { segmento, mensaje, speedMode, canal }
   * @returns {Promise<object>} - { success, queued, estimated_time }
   */
  sendCampaign: async ({ segmento, mensaje, speedMode = 'safe', canal = 'whatsapp' }) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/campanas/enviar', 'POST', {
      business_id: businessId,
      segmento,
      mensaje,
      speed_mode: speedMode,
      canal
    });
  }
};


// ===========================================
// Servicios de Engagement (Recordatorios Mantenimiento)
// ===========================================

export const engagement = {
  /**
   * @deprecated Use `dashboard.getAll()` o `useDashboardData()` en su lugar.
   * Este endpoint está cubierto por /dashboard/all → response.engagement.config
   * 
   * Obtener configuración de recordatorios
   * @returns {Promise<object>} - Lista de servicios configurados
   */
  getConfig: async () => {
    console.warn('⚠️ engagement.getConfig() está deprecado. Usa dashboard.getAll() o useDashboardData()');
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/engagement/config${params}`, 'GET');
  },

  /**
   * Actualizar configuración de un servicio (Unified PUT)
   * @param {string} serviceId - ID del servicio
   * @param {object} data - Datos actualizados
   * @returns {Promise<object>} - Confirmación
   */
  updateConfig: async (serviceId, data) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/engagement/config', 'PUT', { id: serviceId, ...data, business_id: businessId });
  },

  /**
   * Crear nueva configuración de servicio (Unified POST)
   * @param {object} data - Datos del nuevo servicio
   * @returns {Promise<object>} - Confirmación
   */
  createConfig: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/engagement/config', 'POST', { ...data, business_id: businessId });
  },

  /**
   * Eliminar configuración de un servicio (Unified DELETE)
   * @param {string} serviceId - ID del servicio
   * @returns {Promise<object>} - Confirmación
   */
  deleteConfig: async (serviceId) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/engagement/config', 'DELETE', { id: serviceId, business_id: businessId });
  },

  /**
   * @deprecated Use `dashboard.getAll()` o `useDashboardData()` en su lugar.
   * Este endpoint está cubierto por /dashboard/all → response.engagement.pendientesRetoque
   * 
   * Obtener recordatorios pendientes
   * @returns {Promise<object>} - Lista de clientes con recordatorios pendientes
   */
  getPendingReminders: async () => {
    console.warn('⚠️ engagement.getPendingReminders() está deprecado. Usa dashboard.getAll() o useDashboardData()');
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/engagement/recordatorios-pendientes${params}`, 'GET');
  },

  /**
   * @deprecated Use `dashboard.getAll()` o `useDashboardData()` en su lugar.
   * El resumen de engagement está cubierto por /dashboard/all → response.stats
   * 
   * Obtener resumen de engagement
   * @returns {Promise<object>} - Estadísticas de recordatorios
   */
  getSummary: async () => {
    console.warn('⚠️ engagement.getSummary() está deprecado. Usa dashboard.getAll() o useDashboardData()');
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/engagement/summary${params}`, 'GET');
  },

  /**
   * Enviar recordatorio manual a un cliente
   * @param {number} clienteId - ID del cliente
   * @param {string} tipoServicio - Tipo de servicio
   * @param {number} diasPasados - Días desde última cita (opcional)
   * @param {number} citaId - ID de la cita específica (opcional)
   * @returns {Promise<object>} - Resultado del envío
   */
  sendReminder: async (clienteId, tipoServicio, diasPasados = 0, citaId = null) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/engagement/send-reminder', 'POST', {
      clienteId,
      tipoServicio,
      diasPasados,
      citaId,
      business_id: businessId
    });
  },

  /**
   * Enviar petición de reseña en Google Maps manual
   * @param {object} params - Datos para la reseña
   * @param {number} params.clientId - ID del cliente
   * @param {string} params.clientName - Nombre del cliente
   * @param {string} params.clientPhone - Teléfono del cliente
   * @param {number} params.ratingId - ID de la reseña interna
   * @returns {Promise<object>} - Resultado del envío
   */
  requestGoogleReview: async (params) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/engagement/request-google-review', 'POST', {
      ...params,
      business_id: businessId
    });
  },

  /**
   * @deprecated Use `dashboard.getAll()` o `useDashboardData()` en su lugar.
   * Este endpoint está cubierto por /dashboard/all → response.engagement.citasProximas
   * 
   * Obtener citas próximas (para recordatorios de confirmación)
   * @returns {Promise<object>} - Lista de citas próximas (24-48h)
   */
  getUpcomingAppointments: async () => {
    console.warn('⚠️ engagement.getUpcomingAppointments() está deprecado. Usa dashboard.getAll() o useDashboardData()');
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/engagement/citas-pendientes${params}`, 'GET');
  },

  /**
   * Enviar recordatorio de cita manualmente
   * @param {number} citaId - ID de la cita
   * @param {string} tipo - Tipo: 'recordatorio_24h' | 'recordatorio_3h'
   * @returns {Promise<object>} - Resultado del envío
   */
  sendAppointmentReminder: async (citaId, tipo = 'recordatorio_manual') => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/engagement/send-appointment-reminder', 'POST', {
      citaId,
      tipo,
      business_id: businessId
    });
  }
};


// ===========================================
// Servicios de Fidelización (Loyalty)
// ===========================================

export const loyalty = {
  /**
   * Canjear un premio
   * @param {number} clienteId - ID del cliente
   * @param {number} premioId - ID del premio a canjear
   * @returns {Promise<object>} - Resultado del canje
   */
  canjear: async (clienteId, premioId) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/loyalty/canjear', 'POST', {
      cliente_id: clienteId,
      premio_id: premioId,
      business_id: businessId
    });
  },

  /**
   * Marcar un canje como entregado
   * @param {number} canjeId - ID del canje
   * @param {string} entregadoPor - Nombre del staff que entrega
   * @returns {Promise<object>} - Resultado de la actualización
   */
  marcarEntregado: async (canjeId, entregadoPor) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/loyalty/canje/entregar', 'PUT', {
      canje_id: canjeId,
      entregado_por: entregadoPor,
      business_id: businessId
    });
  },

  /**
   * Obtener puntos por categoría de un cliente (modo fidelización por staff)
   * @param {number} clienteId - ID del cliente
   * @returns {Promise<array>} - Lista de { categoria_id, categoria_nombre, puntos }
   */
  getPuntosPorCategoria: async (clienteId) => {
    const businessId = localStorage.getItem('korat_business_id');
    try {
      const { data, error } = await supabase
        .from('puntos_por_categoria') // Using verified table name
        .select(`
          categoria_id,
          puntos_acumulados,
          categorias_servicio ( nombre, emoji )
        `)
        .eq('cliente_id', clienteId)
        .eq('business_id', businessId);

      if (error) throw error;

      // Map to expected format
      return (data || []).map(row => ({
        categoria_id: row.categoria_id,
        categoria_nombre: row.categorias_servicio?.nombre || 'Desconocido',
        categoria_emoji: row.categorias_servicio?.emoji || '',
        puntos: row.puntos_acumulados
      }));
    } catch (e) {
      console.error('Error fetching puntos por categoria from Supabase:', e);
      // Fallback to webhook if table doesn't exist
      const params = new URLSearchParams({ cliente_id: clienteId.toString(), business_id: businessId });
      const response = await fetchN8n(`/loyalty/puntos-categoria?${params}`, 'GET');
      return Array.isArray(response) ? response : response.data || [];
    }
  },

  /**
   * Obtener tipo de fidelización del negocio actual
   * @returns {Promise<string>} - 'global' | 'staff'
   */
  getTipoFidelizacion: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    try {
      const response = await fetchN8n(`/negocios?business_id=${businessId}`, 'GET');
      const negocio = Array.isArray(response) ? response[0] : response;
      return negocio?.tipo_fidelizacion || 'global';
    } catch {
      return 'global';
    }
  },

  /**
   * Canjear un premio usando puntos de una categoría específica (modo staff)
   * @param {number} clienteId - ID del cliente
   * @param {number} premioId - ID del premio a canjear
   * @param {number} categoriaId - ID de la categoría de la que se descuentan los puntos
   * @returns {Promise<object>} - Resultado del canje
   */
  canjearPorCategoria: async (clienteId, premioId, categoriaId) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/loyalty/canjear-categoria', 'POST', {
      cliente_id: clienteId,
      premio_id: premioId,
      categoria_id: categoriaId,
      business_id: businessId
    });
  },

  /**
   * Obtener todos los puntos por categoría del negocio (modo staff)
   * @param {string} businessId - ID del negocio
   * @returns {Promise<array>} - Lista de { cliente_id, categoria_id, categoria_nombre, categoria_emoji, puntos_acumulados }
   */
  getPuntosCategoria: async (businessId) => {
    const bid = businessId || localStorage.getItem('korat_business_id');
    try {
      const { data, error } = await supabase
        .from('puntos_por_categoria') // Using verified table name
        .select(`
          cliente_id,
          categoria_id,
          puntos_acumulados,
          categorias_servicio ( nombre, emoji )
        `)
        .eq('business_id', bid);

      if (error) throw error;

      return (data || []).map(row => ({
        cliente_id: row.cliente_id,
        categoria_id: row.categoria_id,
        categoria_nombre: row.categorias_servicio?.nombre || 'Desconocido',
        categoria_emoji: row.categorias_servicio?.emoji || '',
        puntos_acumulados: row.puntos_acumulados
      }));
    } catch (e) {
      console.error('Error fetching all puntos por categoria from Supabase:', e);
      const params = new URLSearchParams({ business_id: bid });
      const response = await fetchN8n(`/loyalty/puntos-categoria?${params}`, 'GET');
      return Array.isArray(response) ? response : response.data || [];
    }
  }
};


// ===========================================
// Servicios CRUD (Catálogo de Servicios)
// ===========================================

export const servicios = {
  getAll: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    const { data, error } = await supabase
      .from('servicios')
      .select('*')
      .eq('business_id', businessId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching servicios from Supabase:', error);
      return [];
    }
    // Map duracion to duracion_min for the frontend
    return (data || []).map(s => ({ ...s, duracion_min: s.duracion || s.duracion_min }));
  },

  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    
    // Convert duracion_min to duracion for the DB
    const dbData = { ...data, business_id: businessId };
    if (dbData.duracion_min !== undefined) {
      dbData.duracion = dbData.duracion_min;
      delete dbData.duracion_min;
    }

    const { data: result, error } = await supabase
      .from('servicios')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('Error creating servicio:', error);
      throw error;
    }
    return { ...result, duracion_min: result.duracion };
  },

  update: async (id, data) => {
    const businessId = localStorage.getItem('korat_business_id');
    // Convert duracion_min to duracion for the DB
    const dbData = { ...data };
    if (dbData.duracion_min !== undefined) {
      dbData.duracion = dbData.duracion_min;
      delete dbData.duracion_min;
    }

    const { data: result, error } = await supabase
      .from('servicios')
      .update(dbData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating servicio:', error);
      throw error;
    }
    const finalResult = Array.isArray(result) && result.length > 0 ? result[0] : { id, ...data, ...dbData };
    return { ...finalResult, duracion_min: finalResult.duracion || finalResult.duracion_min };
  },

  /**
   * Eliminar un servicio
   * @param {number} id - ID del servicio a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { error } = await supabase
      .from('servicios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting servicio:', error);
      throw error;
    }
    return { success: true };
  }
};


// ===========================================
// Precios Extras CRUD (Cotización Nail Art)
// ===========================================

export const preciosExtras = {
  /**
   * Obtener todos los precios extras
   * @returns {Promise<array>} - Lista de precios extras
   */
  getAll: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    const { data, error } = await supabase
      .from('precios_extras')
      .select('*')
      .eq('business_id', businessId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching precios_extras:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Obtener precios por categoría
   * @param {string} categoria - largo, diseño, extras
   * @returns {Promise<array>} - Lista filtrada
   */
  getByCategoria: async (categoria) => {
    const all = await preciosExtras.getAll();
    return all.filter(p => p.categoria === categoria);
  },

  /**
   * Crear un nuevo precio extra
   * @param {object} data - Datos del precio
   * @param {string} data.categoria - Categoría (largo, diseño, extras)
   * @param {string} data.nombre - Nombre interno
   * @param {string} data.etiqueta - Etiqueta visible
   * @param {number} data.precio - Precio adicional
   * @param {string} [data.descripcion] - Descripción opcional
   * @param {number} [data.orden] - Orden de visualización
   * @returns {Promise<object>} - Precio creado
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase
      .from('precios_extras')
      .insert([{ ...data, business_id: businessId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating precio_extra:', error);
      throw error;
    }
    return result;
  },

  /**
   * Actualizar un precio extra
   * @param {number} id - ID del precio
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Precio actualizado
   */
  update: async (id, data) => {
    const { data: result, error } = await supabase
      .from('precios_extras')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating precio_extra:', error);
      throw error;
    }
    return result;
  },

  /**
   * Eliminar un precio extra
   * @param {number} id - ID a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    const { error } = await supabase
      .from('precios_extras')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting precio_extra:', error);
      throw error;
    }
    return { success: true };
  }
};


// ===========================================
// Equipo/Staff CRUD
// ===========================================

export const equipo = {
  /**
   * Obtener todo el equipo de trabajo
   * @returns {Promise<array>} - Lista de staff
   */
  getAll: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('business_id', businessId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching staff from Supabase:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Crear un nuevo miembro del equipo
   * @param {object} data - Datos del staff
   * @param {string} data.nombre - Nombre del empleado
   * @param {string} data.email - Email (opcional)
   * @param {string} data.telefono - Teléfono (opcional)
   * @param {string} [data.rol='Staff'] - Rol del empleado
   * @param {object} [data.permisos] - Permisos JSONB
   * @returns {Promise<object>} - Staff creado
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase
      .from('staff')
      .insert([{
        rol: 'Staff',
        activo: true,
        permisos: {},
        ...data,
        business_id: businessId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
    return result;
  },

  /**
   * Actualizar datos de un staff
   * @param {number} id - ID del staff
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Staff actualizado
   */
  update: async (id, data) => {
    const { data: result, error } = await supabase
      .from('staff')
      .update(data)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
    return Array.isArray(result) ? result[0] : result;
  },

  /**
   * Eliminar un staff
   * @param {number} id - ID a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
    return { success: true };
  },

  /**
   * Toggle estado activo/inactivo
   * @param {number} id - ID del staff
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<object>} - Staff actualizado
   */
  toggleActive: async (id, activo) => {
    return await equipo.update(id, { activo });
  },

  /**
   * Actualizar permisos de un staff
   * @param {number} id - ID del staff
   * @param {object} permisos - Objeto de permisos
   * @returns {Promise<object>} - Staff actualizado
   */
  updatePermisos: async (id, permisos) => {
    return await equipo.update(id, { permisos });
  }
};


// ===========================================
// Staff Disponibilidad CRUD (Ausencias, Almuerzos)
// ===========================================

export const staffDisponibilidad = {
  /**
   * Obtener toda la disponibilidad/ausencias del negocio
   * @param {number} [staffId] - Filtrar por staff (opcional)
   * @param {string} [fecha] - Filtrar por fecha YYYY-MM-DD (opcional)
   * @returns {Promise<array>} - Lista de registros de disponibilidad
   */
  getAll: async (staffId, fecha) => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    let query = supabase
      .from('staff_availability')
      .select('*')
      .eq('business_id', businessId);

    if (staffId) query = query.eq('staff_id', staffId);
    if (fecha) query = query.eq('fecha', fecha);

    const { data, error } = await query.order('id', { ascending: false });

    if (error) {
      console.error('Error fetching staff_availability:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Obtener disponibilidad de un staff específico
   * @param {number} staffId - ID del staff
   * @returns {Promise<array>} - Ausencias del staff
   */
  getByStaff: async (staffId) => {
    return await staffDisponibilidad.getAll(staffId);
  },

  /**
   * Crear una nueva ausencia/almuerzo/vacaciones
   * @param {object} data - Datos de la ausencia
   * @param {number} data.staff_id - ID del staff
   * @param {string} data.tipo - 'ausencia' | 'almuerzo' | 'medio_dia' | 'vacaciones' | 'permiso'
   * @param {string} [data.fecha] - Fecha YYYY-MM-DD (null si recurrente)
   * @param {string} [data.hora_inicio] - HH:mm (null = todo el día)
   * @param {string} [data.hora_fin] - HH:mm (null = todo el día)
   * @param {string} [data.motivo] - Motivo
   * @param {boolean} [data.recurrente] - Si es recurrente
   * @param {number[]} [data.dias_semana] - [1-7] si recurrente
   * @returns {Promise<object>} - Registro creado
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase
      .from('staff_availability')
      .insert([{ ...data, business_id: businessId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating staff_availability:', error);
      throw error;
    }
    return result;
  },

  /**
   * Eliminar un registro de disponibilidad
   * @param {number} id - ID del registro
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    const { error } = await supabase
      .from('staff_availability')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting staff_availability:', error);
      throw error;
    }
    return { success: true };
  },

  /**
   * Marcar a un staff como "Falta Hoy" (acceso rápido)
   * @param {number} staffId - ID del staff
   * @param {string} [motivo] - Motivo de la falta
   * @returns {Promise<object>} - Registro creado
   */
  marcarFaltaHoy: async (staffId, motivo = 'Falta del día') => {
    const hoy = new Date().toISOString().split('T')[0];
    return await staffDisponibilidad.create({
      staff_id: staffId,
      tipo: 'ausencia',
      fecha: hoy,
      hora_inicio: null,
      hora_fin: null,
      motivo,
      recurrente: false
    });
  },

  /**
   * Marcar medio día (se fue temprano)
   * @param {number} staffId - ID del staff
   * @param {string} desdeHora - Hora desde la que no está (HH:mm)
   * @param {string} [motivo] - Motivo
   * @returns {Promise<object>} - Registro creado
   */
  marcarMedioDia: async (staffId, desdeHora, motivo = 'Se retiró temprano') => {
    const hoy = new Date().toISOString().split('T')[0];
    return await staffDisponibilidad.create({
      staff_id: staffId,
      tipo: 'medio_dia',
      fecha: hoy,
      hora_inicio: desdeHora,
      hora_fin: '23:59',
      motivo,
      recurrente: false
    });
  }
};


// ===========================================
// Servicios de Días Cerrados (Interruptor Maestro)
// ===========================================

export const diasCerrados = {
  /**
   * Obtener lista de días cerrados (futuros)
   * @returns {Promise<array>} - Lista de días cerrados
   */
  getAll: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    const { data, error } = await supabase
      .from('dias_cerrados')
      .select('*')
      .eq('business_id', businessId)
      .order('fecha', { ascending: true });

    if (error) {
      console.error('Error fetching dias_cerrados:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Crear un nuevo día cerrado (completo o parcial)
   * @param {object} data - Datos del cierre
   * @param {string} data.fecha - Fecha en formato 'YYYY-MM-DD'
   * @param {string} data.motivo - Motivo del cierre
   * @param {string} [data.mensaje_chatbot] - Mensaje personalizado para el chatbot
   * @param {boolean} [data.es_dia_completo=true] - Si es cierre de día completo
   * @param {string} [data.hora_inicio] - Hora inicio del cierre parcial (HH:mm)
   * @param {string} [data.hora_fin] - Hora fin del cierre parcial (HH:mm)
   * @returns {Promise<object>} - Día creado
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const payload = {
      fecha: data.fecha,
      motivo: data.motivo,
      mensaje_chatbot: data.mensaje_chatbot || null,
      es_dia_completo: data.es_dia_completo !== false, // Default true
      hora_inicio: data.es_dia_completo !== false ? null : data.hora_inicio,
      hora_fin: data.es_dia_completo !== false ? null : data.hora_fin,
      created_by: data.created_by || 'admin',
      business_id: businessId
    };

    const { data: result, error } = await supabase
      .from('dias_cerrados')
      .upsert([payload], { onConflict: 'fecha, business_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error creating dia_cerrado:', error);
      throw error;
    }
    return result;
  },

  /**
   * Eliminar un día cerrado
   * @param {number} id - ID del día a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    const { error } = await supabase
      .from('dias_cerrados')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting dia_cerrado:', error);
      throw error;
    }
    return { success: true };
  },

  /**
   * Cerrar HOY (botón de pánico)
   * @param {string} motivo - Motivo del cierre
   * @returns {Promise<object>} - Día creado
   */
  cerrarHoy: async (motivo = 'Cerrado de emergencia') => {
    // Usar la zona horaria local en formato YYYY-MM-DD
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hoy = `${year}-${month}-${day}`;

    return await diasCerrados.create({
      fecha: hoy,
      motivo,
      mensaje_chatbot: `Lo siento, hoy estamos cerrados por: ${motivo}. ¿Te gustaría agendar para mañana?`
    });
  }
};


// ===========================================
// Información del Negocio (negocio_info)
// ===========================================

export const negocioInfo = {
  /**
   * Obtener toda la información del negocio
   * @returns {Promise<array>} - Lista de {id, clave, valor, descripcion}
   */
  getAll: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    const { data, error } = await supabase
      .from('negocio_info')
      .select('*')
      .eq('business_id', businessId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching negocio_info:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Actualizar un campo específico
   * @param {string} clave - Clave del campo a actualizar
   * @param {string} valor - Nuevo valor
   * @returns {Promise<object>} - Resultado
   */
  update: async (clave, valor) => {
    const businessId = localStorage.getItem('korat_business_id');
    
    const { data, error } = await supabase.rpc('upsert_negocio_info', {
      p_business_id: businessId,
      p_clave: clave,
      p_valor_texto: valor ?? ''
    });

    if (error) {
      console.error('Error updating negocio_info:', error);
      throw error;
    }
    return data;
  },

  /**
   * Actualizar múltiples campos en batch
   * @param {array} items - Array de {clave, valor}
   * @returns {Promise<object>} - Resultado
   */
  updateBulk: async (items) => {
    const businessId = localStorage.getItem('korat_business_id');
    const results = [];
    
    for (const item of items) {
      const { data, error } = await supabase.rpc('upsert_negocio_info', {
        p_business_id: businessId,
        p_clave: item.clave,
        p_valor_texto: item.valor ?? ''
      });
      if (!error) results.push(data);
      else console.error('Error bulk upsert negocio_info:', item.clave, error);
    }
    return { success: true, updated: results.length };
  },

  /**
   * Obtener un campo específico
   * @param {string} clave - Clave del campo
   * @returns {Promise<string|null>} - Valor del campo
   */
  get: async (clave) => {
    const all = await negocioInfo.getAll();
    const found = all.find(item => item.clave === clave);
    return found ? (found.valor_texto || found.valor) : null;
  },


  /**
   * Crear un nuevo campo
   * @param {object} data - {clave, valor_texto, valor_img, valor_video, descripcion}
   * @returns {Promise<object>} - Resultado
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase.rpc('upsert_negocio_info', {
      p_business_id: businessId,
      p_clave: data.clave,
      p_valor_texto: data.valor_texto || data.valor || ''
    });

    if (error) {
      console.error('Error creating negocio_info:', error);
      throw error;
    }
    return result;
  }
};


// ===========================================
// Categorías Calendario CRUD (Equipos / Áreas de trabajo)
// ===========================================

export const categoriasServicio = {
  /**
   * Obtener todas las categorías de calendario
   * @returns {Promise<array>} - Lista de categorías
   */
  getAll: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    const { data, error } = await supabase
      .from('categorias_servicio')
      .select('*')
      .eq('business_id', businessId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching categorias_servicio:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Crear una nueva categoría
   * @param {object} data - { nombre, emoji, descripcion, activo }
   * @returns {Promise<object>} - Categoría creada
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase
      .from('categorias_servicio')
      .insert([{ ...data, business_id: businessId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating categorias_servicio:', error);
      throw error;
    }
    return result;
  },

  /**
   * Actualizar una categoría existente
   * @param {number} id - ID de la categoría
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Categoría actualizada
   */
  update: async (id, data) => {
    const { data: result, error } = await supabase
      .from('categorias_servicio')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating categorias_servicio:', error);
      throw error;
    }
    return result;
  },

  /**
   * Eliminar una categoría
   * @param {number} id - ID a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    const { error } = await supabase
      .from('categorias_servicio')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting categorias_servicio:', error);
      throw error;
    }
    return { success: true };
  }
};


// ===========================================
// Negocios CRUD (Configuración General / Bot)
// ===========================================

export const negocios = {
  /**
   * Actualizar configuración del bot (Kill Switch)
   * @param {object} config - { bot_enabled: boolean, ... }
   * @returns {Promise<object>} - Resultado
   */
  updateBotConfig: async (config) => {
    const businessId = localStorage.getItem('korat_business_id');

    // ✅ Usar Supabase directamente si está configurado (más robusto/rápido)
    if (false) { // Supabase disabled due to RLS
      if (!businessId) throw new Error('Business ID requerido');

      // 1. Obtener config actual para no sobrescribir otros campos
      const { data: current, error: fetchError } = await supabase
        .from('negocios')
        .select('bot_config')
        .eq('id', businessId)
        .single();

      if (fetchError) {
        console.error('Error fetching bot config:', fetchError);
        throw fetchError;
      }

      // 2. Fusionar config
      const currentConfig = current?.bot_config || {};
      const newConfig = { ...currentConfig, ...config };

      // 3. Actualizar
      const { data, error } = await supabase
        .from('negocios')
        .update({ bot_config: newConfig })
        .eq('id', businessId)
        .select();

      if (error) throw error;
      return data;
    }

    // Fallback original (n8n webhook)
    return await fetchN8n('/negocios/bot-config', 'PUT', { config, business_id: businessId });
  },

  /**
   * Obtener configuración del negocio
   * @returns {Promise<object>} - Datos del negocio
   */
  get: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    // Para evitar log 404 ("Not Found") nativo del navegador por webhook n8n faltante, 
    // verificamos primero si podemos leerlo de Supabase.
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();
      
      if (!error && data) return data;
      return {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Obtener marca_identidad del negocio actual
   * @returns {Promise<object|null>} - JSON de identidad de marca
   */
  getMarcaIdentidad: async () => {
    const data = await negocios.get();
    const negocio = Array.isArray(data) ? data[0] : data;
    return negocio?.marca_identidad || null;
  },

  /**
   * Actualizar marca_identidad del negocio
   * @param {object} marcaIdentidad - JSON de identidad de marca a actualizar
   * @returns {Promise<object>} - Resultado
   */
  updateMarcaIdentidad: async (marcaIdentidad) => {
    const businessId = localStorage.getItem('korat_business_id');
    
    // Primero obtener el objeto actual para no borrar 'tema'
    let fullMarca = marcaIdentidad;
    try {
      const { data } = await supabase
        .from('negocios')
        .select('marca_identidad')
        .eq('id', businessId)
        .maybeSingle();

      if (data?.marca_identidad) {
        fullMarca = { ...data.marca_identidad, ...marcaIdentidad };
      }
    } catch (e) {
      // Ignorar, `fullMarca` se usa tal cual
    }

    return await fetchN8n('/negocios/marca-identidad', 'PUT', {
      marca_identidad: fullMarca,
      business_id: businessId
    });
  },

  /**
   * Obtener la configuración guardada del Brand Wizard
   * @returns {Promise<object|null>} - { respuestas } o null si no existe
   */
  getBrandWizardAnswers: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return null;
    
    // Bypass fetchN8n para evitar 404 nativo
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select('marca_identidad')
        .eq('id', businessId)
        .maybeSingle();
      
      if (!error && data) return [data]; // El frontend espera esto en array
      return null;
    } catch {
      return null;
    }
  },

  /**
   * Guardar respuestas del Brand Wizard v2.0 — formato plano.
   * @param {object} respuestas - Mapa plano { step_id: "option_id" | ["id1","id2"], nombre_bot }
   * @param {boolean} isUpdate - Si true, usa PUT (actualizar); si false usa POST (crear)
   * @returns {Promise<object>}
   */
  saveBrandWizardAnswers: async (respuestas, isUpdate = false) => {
    const businessId = localStorage.getItem('korat_business_id');
    
    // El Wizard guarda en `respuestas_onboarding` (dentro de marca_identidad o raíz del webhook)
    // El n8n probablemente setea todo en `marca_identidad.respuestas`, vamos a pre-mergearlo
    try {
      const { data } = await supabase
        .from('negocios')
        .select('marca_identidad')
        .eq('id', businessId)
        .maybeSingle();

      if (data?.marca_identidad) {
        const _ = data.marca_identidad;
        // Evitamos que N8N sobreescriba `tema` enviando el objecto anidado?
        // El endpoint `/negocios/brand-wizard` de n8n parece solo esperar `respuestas` y `business_id`
        // Lo que se enviaría a n8n está intacto, pero en caso de que n8n sobreescriba `marca_identidad`
        // por default, podríamos mergearlo con un campo de fallback, aunque el problema original
        // ocurre más con los RPC directos. Aseguramos pasando `marca_identidad_previa` si
        // necesitamos que n8n lo re-empaque.
        respuestas = { ...respuestas, _marca_identidad_previa: data.marca_identidad };
      }
    } catch (e) {
      console.warn("Could not fetch old marca_identidad before saving brand wizard answers:", e);
    }
    
    return await fetchN8n('/negocios/brand-wizard', isUpdate ? 'PUT' : 'POST', {
      respuestas,
      business_id: businessId
    });
  }
};

// ===========================================
// Token System (Destellos)
// ===========================================

export const tokens = {
  getBalance: async (userId) => {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('korat_user') || '{}');
      userId = user.id;
    }
    if (!userId) return 0;

    try {
      const { data, error } = await supabase
        .from('Usuarios')
        .select('destellos')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error obteniendo destellos:', error);
        return 0;
      }
      return data?.destellos ?? 0;
    } catch (err) {
      console.error('Error en getBalance:', err);
      return 0;
    }
  },

  deduct: async (userId, amount) => {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('korat_user') || '{}');
      userId = user.id;
    }
    if (!userId) throw new Error('Usuario no identificado');

    const { data, error } = await supabase.rpc('deduct_destellos', {
      user_id: userId,
      amount: amount
    });

    if (error) {
      console.error('Error descontando destellos (RPC):', error);
      throw error;
    }
    return data ?? 0;
  }
};


// ===========================================
// Brand Settings (Logo y Configuración de Marca)
// ===========================================

export const brandSettings = {
  /**
   * Subir logo del negocio al Supabase Storage
   * @param {File} file - El archivo de imagen (PNG)
   * @returns {Promise<string>} - URL pública del logo
   */
  uploadLogo: async (file) => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) throw new Error('No hay business_id');

    const fileExt = file.name.split('.').pop();
    const filePath = `${businessId}/logo_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('brand_assets')
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error('Error subiendo logo:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('brand_assets')
      .getPublicUrl(filePath);

    // Actualizar la base de datos usando RPC (SECURITY DEFINER) para evitar bloqueos de RLS
    // La app usa auth propio (no Supabase Auth), por eso auth.uid()=null y RLS bloquea updates directos
    const { error: rpcError } = await supabase.rpc('update_negocio_logo', {
      p_business_id: businessId,
      p_logo_url: publicUrl
    });
    if (rpcError) {
      console.error('Error actualizando logo en negocios via RPC:', rpcError);
    }

    // Guardado robusto como fallback en negocio_info
    try {
      const { data: existingLogo } = await supabase
        .from('negocio_info')
        .select('*')
        .eq('clave', 'logo_url')
        .eq('business_id', businessId)
        .maybeSingle();

      if (existingLogo) {
        await supabase.from('negocio_info').update({ valor_texto: publicUrl }).eq('id', existingLogo.id);
      } else {
        await supabase.from('negocio_info').insert([{
          business_id: businessId,
          clave: 'logo_url',
          valor_texto: publicUrl,
          descripcion: 'Logo de marca'
        }]);
      }
    } catch(err) {
      console.error('Error guardando logo en negocio_info:', err);
    }

    return publicUrl;
  }
};


// ===========================================
// Alias de retrocompatibilidad
// ===========================================
export const categoriasCalendario = categoriasServicio;

// ===========================================
// Export por defecto (todos los servicios)
// ===========================================

export default {
  auth,
  dashboard,
  crm,
  appointments,
  retention,
  business,
  campaigns,
  engagement,
  loyalty,
  diasCerrados,
  servicios,
  preciosExtras,
  equipo,
  staffDisponibilidad,
  negocioInfo,
  categoriasServicio,
  categoriasCalendario,
  negocios,
  tokens,
  brandSettings
};
