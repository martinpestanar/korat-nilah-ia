
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Megaphone,
  Crown,
  MessageCircle,
  DatabaseZap,
  BarChart3,
  Wallet,
  Sparkles,
  MessageSquare,
  Zap,
} from 'lucide-react';

export const APP_NAME = "Korat Flow";

// --- DATE SETTINGS ---
const now = new Date();
export const SIMULATION_DATE = now;

/**
 * Navigation items with saasModule guard keys.
 * saasModule maps to modulos[key].activo in recursos_saas (V2 format).
 * If saasModule is undefined, the item is always visible.
 * allowedRoles controls which roles can see it (regardless of plan).
 */
export const NAVIGATION_ITEMS = [
  // Always visible core modules
  { path: '/nilah/app', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['Admin', 'Staff'], saasModule: 'dashboard' as const },
  { path: '/nilah/app/calendar', label: 'Agenda', icon: Calendar, allowedRoles: ['Admin', 'Staff'], saasModule: 'agenda' as const },
  { path: '/nilah/app/inbox', label: 'Inbox', icon: MessageSquare, allowedRoles: ['Admin', 'Staff'], saasModule: 'inbox' as const },
  { path: '/nilah/app/clients', label: 'Mis Clientas', icon: DatabaseZap, allowedRoles: ['Admin', 'Staff'], saasModule: 'crm' as const },
  // Plan-gated modules
  { path: '/nilah/app/growth', label: 'Crecimiento', icon: BarChart3, allowedRoles: ['Admin'], saasModule: 'crecimiento' as const },
  { path: '/nilah/app/finances', label: 'Finanzas', icon: Wallet, allowedRoles: ['Admin'], saasModule: 'finanzas' as const },
  { path: '/nilah/app/marketing', label: 'Marketing IA', icon: Megaphone, allowedRoles: ['Admin'], saasModule: 'marketing' as const },
  { path: '/nilah/app/creative', label: 'Crear Contenido', icon: Sparkles, allowedRoles: ['Admin'], saasModule: 'nilah_creative' as const },
  { path: '/nilah/app/settings', label: 'Mi Salón', icon: Settings, allowedRoles: ['Admin'], saasModule: 'configuracion' as const },
];

export const SERVICE_DEFAULTS = [
  { id: 1, name: 'Manicura Gel', price: 50.00, durationMin: 60 },
  { id: 2, name: 'Pedicura Spa', price: 65.00, durationMin: 75 },
  { id: 3, name: 'Masaje Relajante', price: 90.00, durationMin: 60 },
  { id: 4, name: 'Facial Hidratante', price: 80.00, durationMin: 45 },
];

export const STATUS_LABELS: Record<string, string> = {
  'Pendiente': 'Pendiente',
  'Reagendada': 'Reagendada',
  'Cancelada': 'Cancelada',
  'Completada': 'Completada',
  'No-Show': 'No-Show'
};

export const STATUS_COLORS: Record<string, string> = {
  'Pendiente': 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  'Reagendada': 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-400 dark:border-indigo-500/30',
  'Cancelada': 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
  'Completada': 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  'No-Show': 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-500/20 dark:text-slate-400 dark:border-slate-500/30',
};

export const DASHBOARD_REFRESH_INTERVAL = 5 * 60 * 1000;

export const VAPID_PUBLIC_KEY = 'BIDDIbCcnfHS8bLgzPFz8rPsth_7L61-hOMYuJZeyzMt7cv9RACByiE0hVxMS8-LpOT3FpxHqCOC-IPNcShm2vU';
