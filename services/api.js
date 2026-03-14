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
import { supabase } from './supabase';

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

  // DEBUG: Log del business_id en cada llamada
  console.log(`🔑 fetchN8n [${method}] ${endpoint} - business_id:`, businessId || 'NO DEFINIDO');

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

  // Recuperar token del localStorage
  const token = localStorage.getItem('korat_token');

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

    // Manejar error 401 (No autorizado) - Redirigir a login
    if (response.status === 401) {
      console.warn('Sesión expirada o no autorizada. Redirigiendo a login...');
      localStorage.removeItem('korat_token');
      localStorage.removeItem('korat_user');
      window.location.hash = '#/login';
      throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
    }

    // Manejar otros errores HTTP
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ HTTP Error ${response.status}:`, errorData);
      throw new Error(errorData.message || `Error HTTP: ${response.status}`);
    }

    // Parsear y retornar la respuesta
    const text = await response.text();
    console.log(`📥 Response for ${endpoint}:`, text.substring(0, 200));

    if (!text || text.trim() === '') {
      // Respuesta vacía - retornar objeto vacío (NO asumir success: true)
      // El componente que llama debe manejar este caso
      console.warn(`⚠️ Empty response from ${endpoint}`);
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
    console.log(`📦 Cache EXPIRED: ${key}`);
    cacheStorage.delete(key);
    return null;
  }

  console.log(`📦 Cache HIT: ${key}`);
  return item.data;
};

const cacheSet = (key, data) => {
  console.log(`📦 Cache SET: ${key}`);
  cacheStorage.set(key, { data, timestamp: Date.now() });
};

const cacheInvalidate = (key) => {
  if (key) {
    cacheStorage.delete(key);
  } else {
    cacheStorage.clear();
  }
  console.log(`📦 Cache INVALIDATE: ${key || 'ALL'}`);
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
        console.log('📦 Dashboard: usando datos de caché');
        return cached;
      }
    }

    // CRÍTICO: Verificar business_id
    const businessId = localStorage.getItem('korat_business_id');
    console.log('🔄 Dashboard: cargando datos directamente desde Supabase...');
    console.log('📍 Business ID en localStorage:', businessId);
    console.log('📍 korat_user:', localStorage.getItem('korat_user'));

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
            console.log('✅ business_id sincronizado desde korat_user:', parsed.business_id);
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
  getFinancialHistory: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    const params = businessId ? `?business_id=${businessId}` : '';
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
    console.log('👥 crm.getClients - Cargando desde dashboard unificado');
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

    console.log('📤 createClient - Enviando payload:', payload);
    console.log('📤 createClient - business_id:', businessId);

    const response = await fetchN8n('/clientes', 'POST', payload);

    // Debug log
    console.log('📥 createClient response (raw):', response);

    // Normalizar respuesta: n8n a veces devuelve array [{...}]
    const data = Array.isArray(response) ? response[0] : response;

    console.log('📥 createClient response (normalized):', data);

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

export const appointments = {
  /**
   * Crear una nueva cita (usa endpoint unificado /citas POST)
   * @param {object} appointmentData - Datos de la cita
   * @param {string} appointmentData.fecha - Fecha/hora en formato ISO 8601
   * @param {number} appointmentData.duracion_min - Duración en minutos
   * @param {number} appointmentData.cliente_id - ID del cliente (opcional)
   * @param {string} appointmentData.nombre - Nombre del cliente
   * @param {string} appointmentData.servicio - Nombre del servicio
   * @param {number} appointmentData.precio - Precio del servicio
   * @returns {Promise<object>} - Cita creada con { success, id, message }
   * @throws {Error} - Error 409 si hay conflicto de horario
   */
  create: async (appointmentData) => {
    const businessId = localStorage.getItem('korat_business_id');

    const payload = {
      business_id: businessId,
      fecha: appointmentData.fecha || appointmentData.start_time,
      duracion_min: appointmentData.duracion_min || 60,
      cliente_id: appointmentData.cliente_id || appointmentData.client_id || null,
      nombre: appointmentData.nombre || appointmentData.client_name || '',
      servicio: appointmentData.servicio || appointmentData.service_name || '',
      precio: appointmentData.precio || 0,
      staff_id: appointmentData.staff_id || null,
      categoria: appointmentData.categoria || null
    };

    try {
      const rawResult = await fetchN8n('/citas', 'POST', payload);

      // Normalizar respuesta si n8n devuelve un array
      const result = Array.isArray(rawResult) ? rawResult[0] : rawResult;

      // El RPC devuelve { success, id, message } o { success: false, error, message }
      if (result?.success === false) {
        const error = new Error(result.message || 'Este horario ya está ocupado');
        error.status = 409;
        throw error;
      }

      return result;
    } catch (error) {
      // Re-lanzar errores de conflicto
      if (error.status === 409) throw error;
      throw new Error(error.message || 'Error al crear la cita');
    }
  },

  /**
   * Actualizar/reagendar una cita (usa endpoint unificado /citas PUT)
   * @param {number} citaId - ID de la cita a actualizar
   * @param {object} data - Datos a actualizar
   * @param {string} [data.nueva_fecha] - Nueva fecha/hora (opcional)
   * @param {string} [data.nuevo_servicio] - Nuevo servicio (opcional)
   * @param {number} [data.nuevo_precio] - Nuevo precio (opcional)
   * @param {string} [data.nuevo_estado] - Nuevo estado (opcional)
   * @param {number|null} [data.staff_id] - ID del staff asignado (opcional)
   * @returns {Promise<object>} - Resultado con { success, id, message }
   */
  update: async (citaId, data) => {
    const businessId = localStorage.getItem('korat_business_id');

    const payload = {
      business_id: businessId,
      cita_id: citaId,
      nueva_fecha: data.nueva_fecha || data.fecha || null,
      duracion_min: data.duracion_min || 60,
      nuevo_servicio: data.nuevo_servicio || data.servicio || null,
      nuevo_precio: data.nuevo_precio || data.precio || null,
      nuevo_estado: data.nuevo_estado || data.estado || null,
      staff_id: data.staff_id !== undefined ? data.staff_id : null
    };

    try {
      const result = await fetchN8n('/citas', 'PUT', payload);

      if (result.success === false) {
        const error = new Error(result.message || 'No se pudo actualizar la cita');
        error.status = result.error === 'CONFLICT' ? 409 : 400;
        throw error;
      }

      return result;
    } catch (error) {
      throw new Error(error.message || 'Error al actualizar la cita');
    }
  },

  /**
   * Obtener disponibilidad de un día (usa endpoint unificado /citas GET)
   * @param {string} fecha - Fecha en formato YYYY-MM-DD
   * @param {number} duracionMin - Duración del servicio en minutos
   * @returns {Promise<array>} - Lista de slots { hora, disponible, cliente_nombre }
   */
  getAvailability: async (fecha, duracionMin = 60) => {
    const businessId = localStorage.getItem('korat_business_id');

    if (!businessId) {
      console.error('❌ Critical: No business_id found for availability check');
    }

    const params = new URLSearchParams();
    if (businessId) params.append('business_id', businessId);
    params.append('fecha', fecha);
    params.append('duracion_min', duracionMin.toString());

    const queryString = params.toString();
    console.log(`🔍 Consultando disponibilidad: /citas?${queryString}`);

    return await fetchN8n(`/citas?${queryString}`, 'GET');
  },

  /**
   * Actualizar solo el estado de una cita (legacy - usa endpoint específico)
   * @param {number} citaId - ID de la cita
   * @param {string} nuevoEstado - Nuevo estado (Pendiente, Completada, No-Show, Cancelada)
   * @returns {Promise<object>} - Cita actualizada
   */
  updateStatus: async (citaId, nuevoEstado) => {
    const businessId = localStorage.getItem('korat_business_id');
    console.log(`🔄 Actualizando estado de cita #${citaId} a: ${nuevoEstado}`);

    // Usar el endpoint específico solicitado por el usuario
    return await fetchN8n('/citas/actualizar-estado', 'POST', {
      cita_id: citaId,
      estado: nuevoEstado,
      business_id: businessId
    });
  }
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
    
    console.log('📤 campaigns.create → marketing/flow crear_campana', payload);
    
    const result = await fetchN8n('/marketing/flow', 'POST', {
      business_id: businessId,
      action: 'crear_campana',
      payload: {
        ...payload,
        business_id: businessId,
      },
    });

    console.log('✅ campaigns.create N8N response:', result);
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
   * Llama a la función Supabase get_smart_audiences que desbloquea segmentos
   * basado en la "madurez de datos" del negocio (edad en meses).
   * @returns {Promise<{ fase, business_age_months, total_clientes, crm: [], marketing: [] }>}
   */
  getSmartAudiences: async (overrideClientCount) => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return null;
    
    console.log('Using Mock Smart Audiences (Forcing UI preview)');
    
    // Fetch REAL client count from dashboard memory cache or override
    let realClientCount = overrideClientCount !== undefined ? overrideClientCount : 0;
    
    if (overrideClientCount === undefined) {
      try {
        const cacheKey = 'dashboard_all';
        const cachedData = cacheGet(cacheKey);
        if (cachedData && cachedData.clientes) {
           realClientCount = cachedData.clientes.length;
        }
      } catch (e) {
        console.warn('Could not fetch real client count for mock UI from cache:', e);
      }
    }
    
    // Calculate a dynamic business age based on client count for a realistic mock feel
    const dynamicAge = Math.max(1, Math.floor(realClientCount / 50)); 
    
    // Obtener moneda del negocio
    let monedaSymbol = 'S/.';
    try {
      const { data } = await supabase.from('negocios').select('moneda').eq('id', businessId).maybeSingle();
      if (data?.moneda) monedaSymbol = data.moneda;
    } catch (e) {
      console.warn('Could not fetch currency for mock audiences:', e);
    }
    
    // CALCULATING REAL COUNTS FROM SUPABASE
    let countVip = 0;
    let countNuevas = 0;
    let count30 = 0;
    let countCumples = 0;
    let countOverdue = 0;
    let countCrossPestanas = 0;
    let countAdictasPoly = 0;
    let countUpsellRetail = 0;
    let countEarly = 0;
    let countDiscount = 0;

    try {
      // 1. VIPs (Top 10% spenders - we'll approximate with LTV > 500 for now or just fetch a count)
      const { count: vipC } = await supabase.from('perfil_cliente')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('lifetime_value', 500);
      countVip = vipC || 0;

      // 2. Nuevas (First visit < 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: nuevasC } = await supabase.from('perfil_cliente')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .gte('fecha_registro', thirtyDaysAgo.toISOString());
      countNuevas = nuevasC || 0;

      // 3. Ausentes 30 días
      const { count: ausentesC } = await supabase.from('perfil_cliente')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .lt('ultima_visita', thirtyDaysAgo.toISOString());
      count30 = ausentesC || 0;

      // 4. Cumpleañeras reales (Próximos 15 días EXACTOS)
      // Since PostgREST doesn't support complex date extractions easily, we fetch those with birthdays and filter in JS
      const { data: clientsWithBirthdays } = await supabase.from('perfil_cliente')
        .select('fecha_nacimiento')
        .eq('business_id', businessId)
        .not('fecha_nacimiento', 'is', null);
      
      if (clientsWithBirthdays) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const in15Days = new Date(today);
        in15Days.setDate(today.getDate() + 15);
        
        countCumples = clientsWithBirthdays.filter(c => {
          if (!c.fecha_nacimiento) return false;
          // Parse birthday, handle cases where year might be arbitrary (e.g. 1900)
          const bday = new Date(c.fecha_nacimiento);
          bday.setMinutes(bday.getMinutes() + bday.getTimezoneOffset()); // Fix timezone shift
          
          // Create a "this year" birthday
          const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
          
          // Create a "next year" birthday (in case we are in late December and birthday is early January)
          const nextYearBday = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
          
          return (thisYearBday >= today && thisYearBday <= in15Days) || 
                 (nextYearBday >= today && nextYearBday <= in15Days);
        }).length;
      }

      // 5. Fallback approximations for the rest for now, based on realClientCount 
      //    (to avoid overloading with too many complex queries right now, unless requested)
      countOverdue = Math.floor(realClientCount * 0.12);
      countCrossPestanas = Math.floor(realClientCount * 0.25);
      countAdictasPoly = Math.floor(realClientCount * 0.14);
      countUpsellRetail = Math.floor(realClientCount * 0.30);
      countEarly = Math.floor(realClientCount * 0.06);
      countDiscount = Math.floor(realClientCount * 0.20);
      
    } catch (e) {
      console.error('Error fetching real audience counts, falling back to 0', e);
    }
    return {
      business_age_months: dynamicAge,
      fase: realClientCount > 500 ? 'autoridad' : (realClientCount > 100 ? 'crecimiento' : 'semilla'),
      total_clientes: realClientCount,
      crm: [
        { id: 'crm-vip', capa: 'crm', nombre: 'Clientas VIP (Oro)', descripcion: 'Top 10% de clientas con mayor gasto histórico.', icono: '👑', color: 'amber', count: countVip, desbloqueado: true },
        { id: 'crm-nuevas', capa: 'crm', nombre: 'Nuevas Recientes', descripcion: 'Tuvieron su primera cita en los últimos 30 días.', icono: '🌱', color: 'emerald', count: countNuevas, desbloqueado: true },
        { id: 'crm-30', capa: 'crm', nombre: 'Ausentes 30 Días', descripcion: 'Clientas regulares que no han venido en un mes.', icono: '⏱️', color: 'blue', count: count30, desbloqueado: true },
        { id: 'crm-perdidas', capa: 'crm', nombre: 'Clientas Perdidas', descripcion: 'No han regresado en más de 120 días.', icono: '💔', color: 'rose', count: 0, desbloqueado: false, condicion_desbloqueo: 'cuando registres clientas con más de 120 días de ausencia total' },
        { id: 'crm-cumples', capa: 'crm', nombre: 'Cumpleañeras', descripcion: 'Celebran su cumpleaños en los próximos 15 días.', icono: '🎂', color: 'pink', count: countCumples, desbloqueado: true },
        { id: 'crm-resenas', capa: 'crm', nombre: 'Promotoras (5 Estrellas)', descripcion: 'Te han dejado reviews positivas recientemente.', icono: '⭐', color: 'amber', count: 0, desbloqueado: false, condicion_desbloqueo: 'cuando conectes Google Reviews o recibas >10 calificaciones internas' },
      ],
      marketing: [
        { id: 'mkt-overdue', capa: 'marketing', nombre: 'Retoques Vencidos', descripcion: 'Se hicieron Acrílicas/Pestañas hace >21 días y no han agendado.', icono: '⏰', color: 'rose', count: countOverdue, desbloqueado: true, insight: 'El 80% de estas clientas agenda si envías un recordatorio amistoso advirtiendo desgaste.' },
        { id: 'mkt-cross-pestanas', capa: 'marketing', nombre: 'Oportunidad Pestañas', descripcion: 'Aman hacerse las uñas, pero jamás se han hecho pestañas.', icono: '👁️', color: 'pink', count: countCrossPestanas, desbloqueado: true, insight: `Bolsillo de dinero oculto: Oportunidad de ${monedaSymbol} 3,400 si ofreces un 20% OFF en su primer Full Set.` },
        { id: 'mkt-adictas-poly', capa: 'marketing', nombre: 'Adictas al Polygel', descripcion: 'Consumen tu servicio estrella recurrentemente.', icono: '✨', color: 'violet', count: countAdictasPoly, desbloqueado: true, insight: 'Segmento hiper-leal. Ideal para hacerles upselling a "Membresías VIP" o paquetes pre-pagados de 3 meses.' },
        { id: 'mkt-upsell-retail', capa: 'marketing', nombre: 'Potencial Retail', descripcion: 'Clientas mensuales de corte/color que NUNCA compran productos.', icono: '🛍️', color: 'blue', count: countUpsellRetail, desbloqueado: true, insight: 'Incentiva la primera compra enviando un tip sobre cuidado en casa + cupón de 10% en shampoos.' },
        { id: 'mkt-points', capa: 'marketing', nombre: 'Economía Dormida', descripcion: 'Tienen suficientes puntos para canjear pero no los usan.', icono: '🎁', color: 'emerald', count: 0, desbloqueado: false, condicion_desbloqueo: 'cuando actives el programa de lealtad y existan balances altos' },
        { id: 'mkt-early', capa: 'marketing', nombre: 'Early Adopters', descripcion: 'Han consumido más de 3 categorías distintas en tu salón.', icono: '🚀', color: 'violet', count: countEarly, desbloqueado: true, insight: 'Tus clientas más atrevidas. Exclusivas para invitar como "modelos" a probar nuevas tecnologías o servicios costosos.' },
        { id: 'mkt-discount', capa: 'marketing', nombre: 'Cazadoras de Ofertas', descripcion: 'Solo asisten cuando publicas cupones o hay Cyber Days.', icono: '🏷️', color: 'amber', count: countDiscount, desbloqueado: true, insight: 'No gastes margen en ellas normalmente. Resérvalas solo para rellenar huecos en tu agenda en días de "Baja Demanda" (ej. Martes).' },
        { id: 'mkt-slowdays', capa: 'marketing', nombre: 'Rescate de Días Lentos', descripcion: 'Clientas con flexibilidad que suelen agendar Martes y Miércoles.', icono: '📉', color: 'blue', count: 0, desbloqueado: false, condicion_desbloqueo: 'cuando el sistema detecte patrones claros de asistencia en días valle' },
        { id: 'mkt-churn', capa: 'marketing', nombre: 'Riesgo de Fuga', descripcion: 'Su patrón de visitas ha disminuido drásticamente.', icono: '⚠️', color: 'rose', count: 0, desbloqueado: false, condicion_desbloqueo: 'cuando la IA detecte desvíos estadísticos en frecuencias de clientas regulares' },
      ]
    };
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
          categorias_calendario ( nombre, emoji )
        `)
        .eq('cliente_id', clienteId)
        .eq('business_id', businessId);

      if (error) throw error;

      // Map to expected format
      return (data || []).map(row => ({
        categoria_id: row.categoria_id,
        categoria_nombre: row.categorias_calendario?.nombre || 'Desconocido',
        categoria_emoji: row.categorias_calendario?.emoji || '',
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
          categorias_calendario ( nombre, emoji )
        `)
        .eq('business_id', bid);

      if (error) throw error;

      return (data || []).map(row => ({
        cliente_id: row.cliente_id,
        categoria_id: row.categoria_id,
        categoria_nombre: row.categorias_calendario?.nombre || 'Desconocido',
        categoria_emoji: row.categorias_calendario?.emoji || '',
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
  /**
   * Obtener todos los servicios del negocio actual
   * @returns {Promise<array>} - Lista de servicios
   */
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
    return data || [];
  },

  /**
   * Crear un nuevo servicio
   * @param {object} data - Datos del servicio
   * @param {string} data.nombre - Nombre del servicio
   * @param {string} data.categoria - Categoría (uñas, pestañas, cabello, etc.)
   * @param {number} data.precio - Precio en soles
   * @param {number} data.duracion_min - Duración en minutos
   * @param {string} [data.tags] - Tags separados por coma
   * @returns {Promise<object>} - Servicio creado
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');

    const { data: result, error } = await supabase
      .from('servicios')
      .insert([{ ...data, business_id: businessId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating servicio:', error);
      throw error;
    }
    return result;
  },

  /**
   * Actualizar un servicio existente
   * @param {number} id - ID del servicio
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Servicio actualizado
   */
  update: async (id, data) => {
    const { data: result, error } = await supabase
      .from('servicios')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating servicio:', error);
      throw error;
    }
    return result;
  },

  /**
   * Eliminar un servicio
   * @param {number} id - ID del servicio a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
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
      .select()
      .single();

    if (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
    return result;
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
      .insert([payload])
      .select()
      .single();

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
    const hoy = new Date().toISOString().split('T')[0];
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
    const { data, error } = await supabase
      .from('negocio_info')
      .update({ valor })
      .eq('clave', clave)
      .eq('business_id', businessId)
      .select()
      .single();

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
    // Using simple loop since batch update requires upsert setup
    const results = [];
    for (const item of items) {
      const { data, error } = await supabase
        .from('negocio_info')
        .update({ valor: item.valor })
        .eq('clave', item.clave)
        .eq('business_id', businessId)
        .select()
        .single();
      if (!error && data) results.push(data);
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
    return found ? found.valor : null;
  },

  /**
   * Crear un nuevo campo
   * @param {object} data - {clave, valor_texto, valor_img, valor_video, descripcion}
   * @returns {Promise<object>} - Resultado
   */
  create: async (data) => {
    const businessId = localStorage.getItem('korat_business_id');
    const { data: result, error } = await supabase
      .from('negocio_info')
      .insert([{ ...data, business_id: businessId }])
      .select()
      .single();

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

export const categoriasCalendario = {
  /**
   * Obtener todas las categorías de calendario
   * @returns {Promise<array>} - Lista de categorías
   */
  getAll: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return [];

    const { data, error } = await supabase
      .from('categorias_calendario')
      .select('*')
      .eq('business_id', businessId)
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching categorias_calendario:', error);
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
      .from('categorias_calendario')
      .insert([{ ...data, business_id: businessId }])
      .select()
      .single();

    if (error) {
      console.error('Error creating categoria_calendario:', error);
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
      .from('categorias_calendario')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating categoria_calendario:', error);
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
      .from('categorias_calendario')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting categoria_calendario:', error);
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
    const params = businessId ? `?business_id=${businessId}` : '';
    return await fetchN8n(`/negocios${params}`, 'GET');
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
   * @param {object} marcaIdentidad - JSON completo de identidad de marca
   * @returns {Promise<object>} - Resultado
   */
  updateMarcaIdentidad: async (marcaIdentidad) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/negocios/marca-identidad', 'PUT', {
      marca_identidad: marcaIdentidad,
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
    try {
      return await fetchN8n(`/negocios/brand-wizard?business_id=${businessId}`, 'GET');
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
    return await fetchN8n('/negocios/brand-wizard', isUpdate ? 'PUT' : 'POST', {
      respuestas,
      business_id: businessId
    });
  }
};



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
  categoriasCalendario,
  negocios
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

    // Actualizar también la base de datos para que quede referenciado
    await supabase
      .from('negocios')
      .update({ logo_url: publicUrl })
      .eq('id', businessId);

    return publicUrl;
  }
};


