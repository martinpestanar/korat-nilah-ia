
// Data Models based on Baserow Schema

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
}

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
  isAiGenerated?: boolean; // NEW: Flag for AI scheduled appointments
}

export interface ServiceItem {
  id: number;
  name: string;
  price: number;
  durationMin: number;
}

export interface User {
  name: string;
  email: string;
  role: 'Admin' | 'Staff'; 
  plan: 'Starter' | 'Pro' | 'Agency'; // NEW FIELD
  avatar?: string;
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
