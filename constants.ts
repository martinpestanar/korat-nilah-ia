
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings,
  Megaphone // Icon for Marketing
} from 'lucide-react';

export const APP_NAME = "Korat Flow";

// --- SIMULATION SETTINGS ---
// Definimos la fecha "HOY" para la simulación
export const SIMULATION_DATE = new Date('2025-12-04T09:00:00');

// Navigation Definition with Role Based Access Control
// allowedRoles: undefined means "All", otherwise specific array
export const NAVIGATION_ITEMS = [
  { path: '/app', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['Admin', 'Staff'] },
  { path: '/app/calendar', label: 'Agenda', icon: Calendar, allowedRoles: ['Admin', 'Staff'] },
  { path: '/app/clients', label: 'Clientes', icon: Users, allowedRoles: ['Admin', 'Staff'] },
  { path: '/app/marketing', label: 'Nilah Marketing', icon: Megaphone, allowedRoles: ['Admin'] }, // Admin Only
  { path: '/app/settings', label: 'Configuración', icon: Settings, allowedRoles: ['Admin'] }, // Admin Only
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
