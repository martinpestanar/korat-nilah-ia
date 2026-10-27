import i18n from '../locales/i18n';

/**
 * Obtiene el locale canónico de formato de fechas según el salón actual.
 * Devuelve 'en-US' o 'es-PE'.
 */
export function getCurrentLocale(): string {
  const currentLang = i18n.language || 'es';
  return currentLang.startsWith('en') ? 'en-US' : 'es-PE';
}

/**
 * Formatea una fecha respetando el idioma del negocio y zona horaria.
 */
export function formatBusinessDate(
  dateInput: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' 
    ? new Date(dateInput) 
    : dateInput;

  if (isNaN(date.getTime())) return '';

  const locale = getCurrentLocale();
  return date.toLocaleDateString(locale, options);
}

/**
 * Formatea hora de forma legible según el idioma.
 */
export function formatBusinessTime(
  dateInput: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' 
    ? new Date(dateInput) 
    : dateInput;

  if (isNaN(date.getTime())) return '';

  const locale = getCurrentLocale();
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    ...options
  });
}

/**
 * Mapeo de estados de Citas para UI (NO altera la base de datos).
 */
export const APPOINTMENT_STATUS_LABELS: Record<string, { es: string; en: string }> = {
  'Confirmada': { es: 'Confirmada', en: 'Confirmed' },
  'Pendiente':  { es: 'Pendiente',  en: 'Pending' },
  'Reagendada': { es: 'Reagendada', en: 'Rescheduled' },
  'Completada': { es: 'Completada', en: 'Completed' },
  'Cancelada':  { es: 'Cancelada',  en: 'Cancelled' },
  'No-Show':    { es: 'No Asistió', en: 'No-Show' },
  'No Asistio': { es: 'No Asistió', en: 'No-Show' },
};

export function getAppointmentStatusLabel(status: string): string {
  const currentLang = (i18n.language || 'es').startsWith('en') ? 'en' : 'es';
  const entry = APPOINTMENT_STATUS_LABELS[status];
  if (!entry) return status;
  return entry[currentLang] || status;
}
