/**
 * Utilidades de Zona Horaria para Korat Flow
 * Convierte fechas UTC a hora local de Lima, Perú (America/Lima)
 */

// Mapeo de países y zonas horarias soportadas
export const COUNTRY_TIMEZONE_MAP: Record<string, { tz: string; phoneCode: string; locale: string }> = {
    'peru': { tz: 'America/Lima', phoneCode: '51', locale: 'es-PE' },
    'perú': { tz: 'America/Lima', phoneCode: '51', locale: 'es-PE' },
    'colombia': { tz: 'America/Bogota', phoneCode: '57', locale: 'es-CO' },
    'mexico': { tz: 'America/Mexico_City', phoneCode: '52', locale: 'es-MX' },
    'méxico': { tz: 'America/Mexico_City', phoneCode: '52', locale: 'es-MX' },
    'chile': { tz: 'America/Santiago', phoneCode: '56', locale: 'es-CL' },
    'argentina': { tz: 'America/Argentina/Buenos_Aires', phoneCode: '54', locale: 'es-AR' },
    'ecuador': { tz: 'America/Guayaquil', phoneCode: '593', locale: 'es-EC' },
    'bolivia': { tz: 'America/La_Paz', phoneCode: '591', locale: 'es-BO' },
    'venezuela': { tz: 'America/Caracas', phoneCode: '58', locale: 'es-VE' },
    'españa': { tz: 'Europe/Madrid', phoneCode: '34', locale: 'es-ES' },
    'espana': { tz: 'Europe/Madrid', phoneCode: '34', locale: 'es-ES' },
    'estados unidos': { tz: 'America/New_York', phoneCode: '1', locale: 'es-US' },
    'usa': { tz: 'America/New_York', phoneCode: '1', locale: 'es-US' },
};

// Zona horaria del salón
// Obtener la zona horaria del negocio guardada en localStorage, inferida por país, o la del navegador por defecto
export const getSalonTimezone = () => {
    const directTz = localStorage.getItem('korat_business_timezone');
    if (directTz && directTz !== 'null' && directTz !== 'undefined') {
        return directTz;
    }
    const pais = (localStorage.getItem('korat_business_pais') || '').toLowerCase().trim();
    if (pais && COUNTRY_TIMEZONE_MAP[pais]) {
        return COUNTRY_TIMEZONE_MAP[pais].tz;
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Lima';
};

// Código telefónico de país internacional del negocio
export const getSalonPhoneCode = () => {
    const pais = (localStorage.getItem('korat_business_pais') || '').toLowerCase().trim();
    if (pais && COUNTRY_TIMEZONE_MAP[pais]) {
        return COUNTRY_TIMEZONE_MAP[pais].phoneCode;
    }
    return '51';
};

// Locale para nombres de días y meses
export const getSalonLocale = () => {
    const pais = (localStorage.getItem('korat_business_pais') || '').toLowerCase().trim();
    if (pais && COUNTRY_TIMEZONE_MAP[pais]) {
        return COUNTRY_TIMEZONE_MAP[pais].locale;
    }
    return 'es-PE';
};

/**
 * Convierte una fecha UTC a hora local de Lima (o la zona del negocio)
 * @param utcDate - Fecha en formato ISO string (UTC) o Date object
 * @returns Date object en hora local
 */
export const utcToLima = (utcDate: string | Date): Date => {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

    // Si la fecha no tiene timezone indicator, asumimos que ya está en hora local
    if (typeof utcDate === 'string' && !utcDate.includes('Z') && !utcDate.includes('+')) {
        return date;
    }

    // Convertir a hora local usando Intl API
    const limaTime = new Date(date.toLocaleString('en-US', { timeZone: getSalonTimezone() }));
    return limaTime;
};

/**
 * Extrae solo la hora (HH:mm) de una fecha UTC convertida a Lima
 * @param utcDate - Fecha en formato ISO string (UTC)
 * @returns String con la hora en formato "HH:mm"
 */
export const getTimeInLima = (utcDate: string | Date): string => {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

    // Si la fecha tiene indicador de timezone (Z o +00:00), convertir a Lima
    const isUTC = typeof utcDate === 'string' && (utcDate.includes('Z') || utcDate.includes('+00:00'));

    if (isUTC) {
        return date.toLocaleTimeString('es-PE', {
            timeZone: getSalonTimezone(),
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    // Si no tiene timezone, extraer hora directamente del string
    if (typeof utcDate === 'string') {
        const timePart = utcDate.includes('T')
            ? utcDate.split('T')[1]?.slice(0, 5)
            : utcDate.split(' ')[1]?.slice(0, 5);
        if (timePart) return timePart;
    }

    // Fallback: usar getHours/getMinutes locales
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Extrae solo la hora en formato 12h (h:mm AM/PM) de una fecha UTC convertida a Lima
 * @param utcDate - Fecha en formato ISO string (UTC)
 * @returns String con la hora en formato "h:mm AM/PM"
 */
export const getTimeInLima12h = (utcDate: string | Date): string => {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

    // Si la fecha tiene indicador de timezone (Z o +00:00), convertir a Lima
    const isUTC = typeof utcDate === 'string' && (utcDate.includes('Z') || utcDate.includes('+00:00'));

    if (isUTC) {
        return date.toLocaleTimeString('es-PE', {
            timeZone: getSalonTimezone(),
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // Extraer hora del string directamente
    const time24 = getTimeInLima(utcDate);
    const [hours, minutes] = time24.split(':').map(Number);
    const h12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Formatea una fecha UTC completa a formato legible en hora de Lima
 * @param utcDate - Fecha en formato ISO string (UTC)
 * @returns String formateado: "Lunes, 28 de Enero 2026 - 4:00 PM"
 */
export const formatDateTimeLima = (utcDate: string | Date): string => {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

    // Si la fecha tiene indicador de timezone, usar toLocaleString
    const isUTC = typeof utcDate === 'string' && (utcDate.includes('Z') || utcDate.includes('+00:00'));

    if (isUTC) {
        const options: Intl.DateTimeFormatOptions = {
            timeZone: getSalonTimezone(),
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        };

        let formatted = date.toLocaleString(getSalonLocale(), options);
        // Capitalizar primera letra
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    // Si no tiene timezone, parsear manualmente
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const time = getTimeInLima12h(utcDate);

    return `${weekday}, ${day} de ${month} ${year} - ${time}`;
};

/**
 * Extrae la fecha en formato YYYY-MM-DD de una fecha UTC (en hora de Lima)
 * @param utcDate - Fecha en formato ISO string (UTC)
 * @returns String con la fecha en formato "YYYY-MM-DD"
 */
export const getDateInLima = (utcDate: string | Date): string => {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

    const isUTC = typeof utcDate === 'string' && (utcDate.includes('Z') || utcDate.includes('+00:00'));

    if (isUTC) {
        const limaDate = utcToLima(date);
        const year = limaDate.getFullYear();
        const month = (limaDate.getMonth() + 1).toString().padStart(2, '0');
        const day = limaDate.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Si no tiene timezone, extraer fecha directamente
    if (typeof utcDate === 'string') {
        return utcDate.split('T')[0] || utcDate.split(' ')[0] || '';
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
