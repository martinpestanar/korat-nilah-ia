
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

export interface Negocio {
  id: string;                 // UUID del negocio
  nombre: string;
  created_at: string;
  whatsapp_phone_id?: string;
  whatsapp_token?: string;
  recursos_saas: RecursosSaaS;
  bot_config?: Record<string, any>;
  owner?: {
    nombre_persona: string;
    email: string;
  } | null;
  Usuarios?: any[]; // All users assigned to this tenant
  briefCompleted?: boolean;
}

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
  ultimo_servicio?: string;                 // Nombre del último servicio contratado
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
  max_concurrent_appointments?: number;
}

// Colores predefinidos por especialidad
export const STAFF_COLORS: Record<StaffEspecialidad, string> = {
  manos: '#ec4899',    // Rosa
  pies: '#f97316',     // Naranja
  pestañas: '#8b5cf6', // Violeta
  rostro: '#10b981',   // Verde
  cabello: '#3b82f6',  // Azul
  multi: '#6366f1',    // Indigo (was Gris)
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
  // Estados: Pendiente → Confirmada → Completada | No-Show | Cancelada
  estado: 'Pendiente' | 'Confirmada' | 'Reagendada' | 'Cancelada' | 'Completada' | 'No-Show';
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
export interface RecursosSaaS {
  plan_base: 'glow' | 'glow_pro' | 'glow_elite' | 'basico' | 'pro' | 'copilot' | 'automatico';
  chatbot: {
    activo: boolean;
    tipo: 'mago_de_oz' | 'autonomo'; // mago_de_oz = humano asiste, autonomo = IA agenda sola
  };
  modulos: {
    marketing: boolean;
    fidelizacion: boolean;
    analiticas_avanzadas: boolean;
    zonas_muertas: boolean;
    engagement_recordatorios: boolean;
    copilot?: boolean;
    imagenes_promocionales?: boolean;
    contenido_redes?: boolean;
    estrategia_ads?: boolean;
    studio_humano?: boolean;
  };
  limites: {
    max_staff: number;
    max_citas_mes?: number;
  };
  ui_config?: {
    dashboard_widgets: {
      ingresos_chart: boolean;
      citas_canceladas: boolean;
      top_servicios: boolean;
    };
    action_buttons: {
      rescate_whatsapp: boolean;
      envio_masivo: boolean;
    };
  };
}

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

// Features por defecto para plan Copilot
export const DEFAULT_COPILOT_FEATURES: UserFeatures = {
  ai_insights: true,
  marketing_module: true,
  advanced_reports: true,
  client_rescue: true,
  financial_forecast: true,
  custom_branding: true,
  api_access: true,
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
  plan: 'Glow' | 'Glow Pro' | 'Glow Elite' | 'Starter' | 'Pro' | 'Copilot';
  avatar?: string;
  salon_id?: number;                      // Para Staff: ID del salón al que pertenece
  business_id?: string;                   // UUID del negocio (multi-tenant)
  features?: UserFeatures;                // Features del usuario (viene del backend)
  staffPermissions?: StaffPermissions;    // Permisos configurables (solo para Staff)
  recursos_saas?: RecursosSaaS;           // SaaS configurations (from Super Admin)
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

// ============================================================
// --- MÓDULO: CARTA DIGITAL INTERACTIVA ---
// ============================================================

export interface CartaCategoria {
  id: string;
  business_id: string;
  nombre: string;
  emoji?: string;
  orden: number;
  activo: boolean;
  created_at?: string;
  // Relación cliente-side (no viene de DB)
  servicios?: CartaServicio[];
}

export interface CartaServicio {
  id: string;
  business_id: string;
  categoria_id?: string | null;
  nombre: string;
  descripcion?: string | null;
  precio?: number | null;
  precio_desde: boolean;          // true = "Desde S/ X"
  duracion_min?: number | null;
  media_url?: string | null;      // URL de imagen o video externo
  media_tipo: 'imagen' | 'video';
  destacado: boolean;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CartaStory {
  id: string;
  titulo: string;
  emoji?: string;
  media_url?: string;             // Foto/video de la story
  descripcion?: string;
}

export interface CartaPromoMes {
  activa: boolean;
  badge_texto?: string;           // ej: "Agosto"
  badge_emoji?: string;           // ej: "🌸"
  titulo: string;
  descripcion?: string;
}

export interface CartaOfertaSemana {
  activa: boolean;
  titulo: string;
  descripcion?: string;
  precio_original?: number;
  precio_oferta?: number;
  expira_en?: string;             // ISO date string — se oculta automáticamente
  servicios_ids?: string[];       // IDs de servicios aplicables
}

export type CartaPaleta = 'rose' | 'lilac' | 'mauve' | 'gold' | 'pearl' | 'custom';

export type CartaLayoutEstilo = 'pinterest' | 'editorial' | 'minimal' | 'stories';

export interface CartaConfig {
  id?: string;
  business_id: string;
  // Paleta y Layout
  paleta: CartaPaleta;
  layout_estilo?: CartaLayoutEstilo;
  color_primario?: string;
  color_secundario?: string;
  color_acento?: string;
  // Header
  nombre_salon?: string;
  logo_url?: string;
  descripcion_header?: string;
  telefono_whatsapp?: string;
  maps_url?: string;
  horario?: string;
  direccion?: string;
  instagram_url?: string;
  // Contenido dinámico
  stories?: CartaStory[];
  promo_mes?: CartaPromoMes | null;
  oferta_semana?: CartaOfertaSemana | null;
  created_at?: string;
  updated_at?: string;
}

// Paletas predefinidas estilo salón de belleza
export const CARTA_PALETAS: Record<CartaPaleta, { label: string; emoji: string; primario: string; secundario: string; acento: string; descripcion: string }> = {
  rose:   { label: 'Rose Garden',  emoji: '🌸', primario: '#f43f5e', secundario: '#fda4af', acento: '#fff1f2', descripcion: 'Rosa vibrante y femenino' },
  lilac:  { label: 'Lilac Dream',  emoji: '💜', primario: '#a855f7', secundario: '#d8b4fe', acento: '#faf5ff', descripcion: 'Lila suave y elegante' },
  mauve:  { label: 'Mauve Bliss',  emoji: '🪻', primario: '#7c3aed', secundario: '#c4b5fd', acento: '#f5f3ff', descripcion: 'Morado profundo y lujoso' },
  gold:   { label: 'Gold Glam',    emoji: '✨', primario: '#d97706', secundario: '#fde68a', acento: '#fffbeb', descripcion: 'Dorado premium y brillante' },
  pearl:  { label: 'Pearl White',  emoji: '🤍', primario: '#6b7280', secundario: '#e5e7eb', acento: '#f9fafb', descripcion: 'Blanco puro y minimalista' },
  custom: { label: 'Personalizado',emoji: '🖌️', primario: '#ec4899', secundario: '#fbcfe8', acento: '#fdf2f8', descripcion: 'Colores a tu medida' },
};
