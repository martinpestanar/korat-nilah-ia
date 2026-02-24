
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Megaphone, // Icon for Marketing
  Crown, // Icon for Loyalty
  MessageCircle // Icon for Engagement
} from 'lucide-react';

export const APP_NAME = "Korat Flow";

// --- DATE SETTINGS ---
// Usamos la fecha actual del sistema (Correcting for timezone offset)
const now = new Date();
const offsetMs = now.getTimezoneOffset() * 60 * 1000;
const localDate = new Date(now.getTime() - offsetMs);
export const SIMULATION_DATE = now; // Mantener objeto Date, pero la app debería usar utils para formatear

// Navigation Definition with Role Based Access Control
// allowedRoles: undefined means "All", otherwise specific array
// requiredPlan: undefined means "All plans", otherwise 'Pro'
export const NAVIGATION_ITEMS = [
  { path: '/nilah/app', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['Admin', 'Staff'] },
  { path: '/nilah/app/calendar', label: 'Agenda', icon: Calendar, allowedRoles: ['Admin', 'Staff'] },
  { path: '/nilah/app/clients', label: 'Clientes', icon: Users, allowedRoles: ['Admin', 'Staff'] },
  { path: '/nilah/app/loyalty', label: 'Fidelización', icon: Crown, allowedRoles: ['Admin', 'Staff'], saasModule: 'fidelizacion' as const },
  { path: '/nilah/app/engagement', label: 'Engagement', icon: MessageCircle, allowedRoles: ['Admin', 'Staff'], saasModule: 'engagement_recordatorios' as const },
  { path: '/nilah/app/marketing', label: 'Nilah Marketing', icon: Megaphone, allowedRoles: ['Admin'], saasModule: 'marketing' as const },
  { path: '/nilah/app/settings', label: 'Configuración', icon: Settings, allowedRoles: ['Admin'] },
];

export const SERVICE_DEFAULTS = [
  { id: 1, name: 'Manicura Gel', price: 50.00, durationMin: 60 },
  { id: 2, name: 'Pedicura Spa', price: 65.00, durationMin: 75 },
  { id: 3, name: 'Masaje Relajante', price: 90.00, durationMin: 60 },
  { id: 4, name: 'Facial Hidratante', price: 80.00, durationMin: 45 },
];

// Mapeo de valores técnicos a etiquetas legibles para el usuario
export const STATUS_LABELS: Record<string, string> = {
  'Pendiente': 'Pendiente',
  'Reagendada': 'Reagendada',
  'Cancelada': 'Cancelada',
  'Completada': 'Completada',
  'No-Show': 'No-Show'
};

// NUEVA PALETA DE COLORES (Estilo UI Moderno / Badges)
// Usamos combinaciones de bg/text con opacidad para dark mode
export const STATUS_COLORS: Record<string, string> = {
  'Pendiente': 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  'Reagendada': 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20', // Azul para diferenciar del amarillo
  'Cancelada': 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  'Completada': 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  'No-Show': 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-700',
};

// Configuración de refresco (ms)
export const DASHBOARD_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos
