
// Data Models based on Baserow Schema

// Stats del cliente calculados por el backend (semáforo de riesgo)
export interface ClientStats {
  status_color: 'success' | 'warning' | 'error' | 'critical' | 'neutral'; // Color del semáforo
  label: string;           // "Activo", "En riesgo", "Perdido"
  dias_ausente: number;    // Días desde última visita
  nivel_riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'; // Nivel de riesgo de abandono
  ultima_interaccion?: string; // Fecha de última interacción
  rescue_sent?: boolean;   // Si ya se envió mensaje de rescate
  accion_recomendada?: string | null; // Acción recomendada por n8n
  prioridad?: number;      // Prioridad para ordenar (mayor = más urgente)
  // Campos de rescate inteligente
  ultima_promo_enviada?: string;  // Fecha ISO del último mensaje de rescate
  impacto_actual?: number;        // Nivel de impacto actual (1, 2, 3)
  rescate_exitoso?: boolean;      // Si el cliente fue rescatado
  impacto_que_funciono?: number;  // Qué impacto lo rescató
}

// Tipos de ciclo de vida del cliente
export type ClientLifecycle = 'Nuevo' | 'Activo' | 'Leal' | 'En Riesgo' | 'Dormido' | 'Perdido';

export interface Client {
  id: number;
  nombre: string;
  telefono: string;
  fecha_registro: string;
  primera_visita: string;
  ultima_visita: string;
  categoria: 'VIP' | 'Regular' | 'Nuevo' | null;
  puntos_acumulados: number;
  total_visitas: number;
  Estado: 'Activo' | 'Inactivo';
  lifecycle?: ClientLifecycle;  // Ciclo de vida del cliente
  ltv?: number;                  // Lifetime Value (valor total del cliente)
  // Campos de cooldown / envío seguro
  bloqueado_hasta?: string | null;          // Fecha ISO hasta la cual el cliente no debería recibir mensajes
  ultimo_mensaje_enviado?: string | null;   // Fecha ISO del último mensaje enviado
  tipo_ultimo_mensaje?: string | null;      // Tipo del último mensaje (rescate, promo, recordatorio)
  stats?: ClientStats; // Stats del semáforo (viene del backend)
}

// Staff especialidades disponibles para salones de belleza
export type StaffEspecialidad = 'manos' | 'pies' | 'pestañas' | 'rostro' | 'cabello' | 'multi';

// Staff con especialidad y color para calendario
export interface StaffMember {
  id: number;
  nombre: string;
  email?: string;
  telefono?: string;
  rol: 'Staff' | 'Manager' | 'Admin';
  especialidad: StaffEspecialidad;
  color: string; // Hex color para visualización en calendario
  activo: boolean;
  calendarioId?: string; // Google Calendar ID si aplica
}

// Colores predefinidos por especialidad
export const STAFF_COLORS: Record<StaffEspecialidad, string> = {
  manos: '#ec4899',    // Rosa
  pies: '#f97316',     // Naranja
  pestañas: '#8b5cf6', // Violeta
  rostro: '#10b981',   // Verde
  cabello: '#3b82f6',  // Azul
  multi: '#6b7280',    // Gris
};

// Iconos/emojis por especialidad
export const STAFF_ICONS: Record<StaffEspecialidad, string> = {
  manos: '💅',
  pies: '🦶',
  pestañas: '👁️',
  rostro: '💆',
  cabello: '💇',
  multi: '✨',
};

export interface Appointment {
  id: number;
  fecha: string; // ISO String or "YYYY-MM-DD HH:mm"
  cliente_id: number;
  nombre_cliente: string;
  servicio: string;
  precio: number;
  // REMOVED: 'Confirmada', RENAMED: 'Finalizada' -> 'Completada'
  estado: 'Pendiente' | 'Reagendada' | 'Cancelada' | 'Completada' | 'No-Show';
  calificacion: number;
  feedback_cliente: string;
  isAiGenerated?: boolean; // Flag for AI scheduled appointments
  categoria?: StaffEspecialidad; // Categoría del servicio (manos, pies, pestañas, etc.)
  staffId?: number; // Staff asignado a la cita
}

export interface ServiceItem {
  id: number;
  name: string;
  price: number;
  durationMin: number;
}

// Feature flags que controlan el acceso a funcionalidades Pro
export interface UserFeatures {
  ai_insights: boolean;        // Insights de IA en Dashboard
  marketing_module: boolean;   // Módulo de Marketing completo
  advanced_reports: boolean;   // Reportes avanzados
  client_rescue: boolean;      // Campañas de rescate de clientes
  financial_forecast: boolean; // Pronóstico financiero
  custom_branding: boolean;    // Marca personalizada
  api_access: boolean;         // Acceso a API
  priority_support: boolean;   // Soporte prioritario
}

// Features por defecto para plan Starter
export const DEFAULT_STARTER_FEATURES: UserFeatures = {
  ai_insights: false,
  marketing_module: false,
  advanced_reports: false,
  client_rescue: false,
  financial_forecast: false,
  custom_branding: false,
  api_access: false,
  priority_support: false,
};

// Features por defecto para plan Pro
export const DEFAULT_PRO_FEATURES: UserFeatures = {
  ai_insights: true,
  marketing_module: true,
  advanced_reports: true,
  client_rescue: true,
  financial_forecast: true,
  custom_branding: false,
  api_access: false,
  priority_support: true,
};

// Permisos configurables para Staff (Solo aplica en Plan Pro)
export interface StaffPermissions {
  can_view_all_appointments: boolean;  // Ver todas las citas o solo las suyas
  can_view_client_notes: boolean;      // Ver notas de clientes
  can_cancel_appointments: boolean;    // Puede cancelar citas
  can_add_clients: boolean;            // Puede agregar nuevos clientes
  can_edit_appointments: boolean;      // Puede editar citas existentes
  can_view_client_history: boolean;    // Ver historial de servicios del cliente
}

// Permisos por defecto para Staff
export const DEFAULT_STAFF_PERMISSIONS: StaffPermissions = {
  can_view_all_appointments: true,
  can_view_client_notes: true,
  can_cancel_appointments: false,
  can_add_clients: true,
  can_edit_appointments: true,
  can_view_client_history: true,
};

export interface User {
  id?: number;
  name: string;                           // Nombre de la persona (dueño)
  nombreNegocio?: string;                 // Nombre del salón/negocio
  email: string;
  role: 'Admin' | 'Staff';
  plan: 'Starter' | 'Pro';
  avatar?: string;
  salon_id?: number;                      // Para Staff: ID del salón al que pertenece
  business_id?: string;                   // UUID del negocio (multi-tenant)
  features?: UserFeatures;                // Features del usuario (viene del backend)
  staffPermissions?: StaffPermissions;    // Permisos configurables (solo para Staff)
}

export interface KPIStats {
  totalRevenue: number;
  totalAppointments: number;
  averageTicket: number;
  retentionRate: number;
}

export interface Forecast {
  projectedRevenue: number;
  goalRevenue: number;
  status: 'on_track' | 'behind' | 'ahead';
  suggestion: string;
  actionLabel: string;
}

// --- NEW MARKETING TYPES ---

export interface MarketingCampaign {
  id: string;
  title: string;
  description: string;
  aiRationale: string; // Why Nilah suggests this
  channel: 'WhatsApp' | 'Email' | 'Instagram';
  predictedRevenue: number;
  cost: number;
  status: 'Draft' | 'Active' | 'Completed';
  targetSegment: string;
}

export interface FinancialDataPoint {
  day: string;
  revenue: number | null;
  projection: number;
  event: { name: string; impact: number } | null;
}

// --- NOTIFICATION CENTER ---
export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'ai';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// --- DÍAS CERRADOS (Interruptor Maestro) ---
export interface ClosedDay {
  id: number;
  fecha: string;           // Formato: 'YYYY-MM-DD'
  motivo: string;
  mensaje_chatbot?: string | null;
  created_at?: string;
  created_by?: string;
  // Campos para cierres parciales
  es_dia_completo?: boolean;  // true = todo el día, false = solo un rango de horas
  hora_inicio?: string | null; // Formato: 'HH:mm' (ej: '09:00')  
  hora_fin?: string | null;    // Formato: 'HH:mm' (ej: '13:00')
}

// Tipo para el formulario de nuevo cierre
export interface NewClosedDayForm {
  fecha: string;
  motivo: string;
  mensaje_chatbot: string;
  es_dia_completo: boolean;
  hora_inicio: string;
  hora_fin: string;
}

// --- CATEGORÍAS CALENDARIO (Equipos / Áreas de trabajo) ---
export interface CategoriaCalendario {
  id: number;
  business_id?: string;
  nombre: string;        // Nombre del equipo (ej: "Manos", "Pestañas")
  emoji?: string;        // Emoji identificativo (💅, 🦶, etc.)
  descripcion?: string;  // Descripción breve del equipo
  activo: boolean;
  created_at?: string;
}
