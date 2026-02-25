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
    console.warn(`⚠️ BLOQUEANDO llamada a ${endpoint} - business_id no disponible`);
    throw new Error('business_id no disponible. Usuario no autenticado correctamente.');
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
    console.log('🔄 Dashboard: cargando datos desde n8n...');
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
    const params = new URLSearchParams();
    if (finalBusinessId) params.append('business_id', finalBusinessId);
    params.append('_t', Date.now().toString());
    console.log('🌐 URL completa:', `/dashboard/all?${params}`);
    const response = await fetchN8n(`/dashboard/all?${params}`, 'GET');

    // Normalizar respuesta (n8n a veces devuelve array)
    const data = Array.isArray(response) ? response[0] : response;

    // Guardar en caché
    cacheSet(CACHE_KEY, data);

    return data;
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
   * Obtener lista de clientes
   * @returns {Promise<array>} - Lista de clientes
   */
  getClients: async () => {
    const businessId = localStorage.getItem('korat_business_id');
    console.log('👥 crm.getClients - business_id:', businessId);
    if (!businessId) {
      console.error('❌ CRÍTICO: No hay business_id para cargar clientes');
      throw new Error('business_id requerido para cargar clientes');
    }
    const params = `?business_id=${businessId}`;
    return await fetchN8n(`/clients${params}`, 'GET');
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
      const result = await fetchN8n('/citas', 'POST', payload);

      // El RPC devuelve { success, id, message } o { success: false, error, message }
      if (result.success === false) {
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
   * @param {string} data.nueva_fecha - Nueva fecha/hora (opcional)
   * @param {string} data.nuevo_servicio - Nuevo servicio (opcional)
   * @param {number} data.nuevo_precio - Nuevo precio (opcional)
   * @param {string} data.nuevo_estado - Nuevo estado (opcional)
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
   * Obtener todas las campañas de un negocio (Unified GET /campanas)
   * @param {string} businessId - ID del negocio
   * @param {object} filters - Filtros opcionales { estado }
   * @returns {Promise<array>} - Lista de campañas con métricas
   */
  getAll: async (businessId, filters = {}) => {
    const params = new URLSearchParams({ business_id: businessId, ...filters });
    return await fetchN8n(`/campanas?${params}`, 'GET');
  },

  /**
   * Crear/guardar una campaña (Unified POST /campanas)
   * @param {object} campaignData - Datos de la campaña
   * @returns {Promise<object>} - Campaña creada con ID
   */
  create: async (campaignData) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/campanas', 'POST', { ...campaignData, business_id: businessId });
  },

  /**
   * Eliminar una campaña (Unified DELETE /campanas)
   * @param {number} campaignId - ID de la campaña
   * @returns {Promise<object>} - Resultado de la eliminación
   */
  delete: async (campaignId) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/campanas', 'DELETE', { id: campaignId, business_id: businessId });
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
    const params = businessId ? `?business_id=${businessId}` : '';
    const response = await fetchN8n(`/servicios${params}`, 'GET');
    return Array.isArray(response) ? response : response.data || [];
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
    return await fetchN8n('/servicios', 'POST', { ...data, business_id: businessId });
  },

  /**
   * Actualizar un servicio existente
   * @param {number} id - ID del servicio
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Servicio actualizado
   */
  update: async (id, data) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/servicios', 'PUT', { id, ...data, business_id: businessId });
  },

  /**
   * Eliminar un servicio
   * @param {number} id - ID del servicio a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/servicios', 'DELETE', { id, business_id: businessId });
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
    const params = businessId ? `?business_id=${businessId}` : '';
    const response = await fetchN8n(`/precios-extras${params}`, 'GET');
    return Array.isArray(response) ? response : response.data || [];
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
    return await fetchN8n('/precios-extras', 'POST', { ...data, business_id: businessId });
  },

  /**
   * Actualizar un precio extra
   * @param {number} id - ID del precio
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Precio actualizado
   */
  update: async (id, data) => {
    return await fetchN8n('/precios-extras', 'PUT', { id, ...data });
  },

  /**
   * Eliminar un precio extra
   * @param {number} id - ID a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    return await fetchN8n('/precios-extras', 'DELETE', { id });
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
    const params = businessId ? `?business_id=${businessId}` : '';
    const response = await fetchN8n(`/equipo${params}`, 'GET');
    return Array.isArray(response) ? response : response.data || [];
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
    return await fetchN8n('/equipo', 'POST', {
      rol: 'Staff',
      activo: true,
      permisos: {},
      ...data,
      business_id: businessId
    });
  },

  /**
   * Actualizar datos de un staff
   * @param {number} id - ID del staff
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Staff actualizado
   */
  update: async (id, data) => {
    return await fetchN8n('/equipo', 'PUT', { id, ...data });
  },

  /**
   * Eliminar un staff
   * @param {number} id - ID a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    return await fetchN8n('/equipo', 'DELETE', { id });
  },

  /**
   * Toggle estado activo/inactivo
   * @param {number} id - ID del staff
   * @param {boolean} activo - Nuevo estado
   * @returns {Promise<object>} - Staff actualizado
   */
  toggleActive: async (id, activo) => {
    return await fetchN8n('/equipo', 'PUT', { id, activo });
  },

  /**
   * Actualizar permisos de un staff
   * @param {number} id - ID del staff
   * @param {object} permisos - Objeto de permisos
   * @returns {Promise<object>} - Staff actualizado
   */
  updatePermisos: async (id, permisos) => {
    return await fetchN8n('/equipo', 'PUT', { id, permisos });
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
    const params = new URLSearchParams();
    if (businessId) params.append('business_id', businessId);
    if (staffId) params.append('staff_id', staffId.toString());
    if (fecha) params.append('fecha', fecha);
    const response = await fetchN8n(`/staff-disponibilidad?${params}`, 'GET');
    return Array.isArray(response) ? response : response.data || [];
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
    return await fetchN8n('/staff-disponibilidad', 'POST', {
      ...data,
      business_id: businessId
    });
  },

  /**
   * Eliminar un registro de disponibilidad
   * @param {number} id - ID del registro
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    return await fetchN8n(`/staff-disponibilidad?id=${id}`, 'DELETE');
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
    const params = businessId ? `?business_id=${businessId}` : '';
    const response = await fetchN8n(`/dias-cerrados${params}`, 'GET');
    // Normalizar respuesta (n8n a veces devuelve objeto con array)
    return Array.isArray(response) ? response : response.data || [];
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
    return await fetchN8n('/dias-cerrados', 'POST', payload);
  },

  /**
   * Eliminar un día cerrado
   * @param {number} id - ID del día a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    return await fetchN8n('/dias-cerrados', 'DELETE', { id });
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
    const params = businessId ? `?business_id=${businessId}` : '';
    const response = await fetchN8n(`/negocio-info${params}`, 'GET');
    return Array.isArray(response) ? response : response.data || [];
  },

  /**
   * Actualizar un campo específico
   * @param {string} clave - Clave del campo a actualizar
   * @param {string} valor - Nuevo valor
   * @returns {Promise<object>} - Resultado
   */
  update: async (clave, valor) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/negocio-info', 'PUT', { clave, valor, business_id: businessId });
  },

  /**
   * Actualizar múltiples campos en batch
   * @param {array} items - Array de {clave, valor}
   * @returns {Promise<object>} - Resultado
   */
  updateBulk: async (items) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/negocio-info', 'PUT', { bulk: items, business_id: businessId });
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
    return await fetchN8n('/negocio-info', 'POST', { ...data, business_id: businessId });
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
    const response = await fetchN8n('/categorias-calendario', 'GET');
    return Array.isArray(response) ? response : response.data || [];
  },

  /**
   * Crear una nueva categoría
   * @param {object} data - { nombre, emoji, descripcion, activo }
   * @returns {Promise<object>} - Categoría creada
   */
  create: async (data) => {
    return await fetchN8n('/categorias-calendario', 'POST', data);
  },

  /**
   * Actualizar una categoría existente
   * @param {number} id - ID de la categoría
   * @param {object} data - Datos a actualizar
   * @returns {Promise<object>} - Categoría actualizada
   */
  update: async (id, data) => {
    return await fetchN8n('/categorias-calendario', 'PUT', { id, ...data });
  },

  /**
   * Eliminar una categoría
   * @param {number} id - ID a eliminar
   * @returns {Promise<object>} - Resultado
   */
  delete: async (id) => {
    return await fetchN8n('/categorias-calendario', 'DELETE', { id });
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
   * Guardar respuestas del wizard y lanzar la generación de Identidad en n8n
   * @param {object} respuestas - Respuestas recolectadas del wizard
   * @returns {Promise<object>} - Resultado del flujo de n8n
   */
  saveBrandWizardAnswers: async (respuestas) => {
    const businessId = localStorage.getItem('korat_business_id');
    return await fetchN8n('/negocios/brand-wizard', 'POST', {
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

