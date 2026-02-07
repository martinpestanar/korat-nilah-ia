/**
 * StaffColumnsView
 * 
 * Vista de agenda diaria con columnas por STAFF (área/categoría).
 * Columnas: Manos, Pies, Pestañas, Rostro, Cabello
 * 
 * Esto es más útil para la mayoría de salones donde 1 persona = 1 área,
 * y también para salones más grandes con múltiples personas por área.
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, User } from 'lucide-react';

interface StaffMember {
    id: number;
    nombre: string;
    especialidad?: string;
    color?: string;
    activo?: boolean;
}

interface Appointment {
    id: number;
    fecha: string;
    hora?: string;
    cliente_nombre?: string;
    nombre?: string;
    servicio?: string;
    precio?: number;
    estado?: string;
    staff_id?: number;
    categoria?: string;
}

interface StaffColumnsViewProps {
    date: string;
    appointments: Appointment[];
    staff: StaffMember[];
    businessHours?: {
        weekdays: { start: number; end: number };
        saturday: { start: number; end: number };
        sunday: { start: number; end: number };
    };
    lunchHours?: string;
    closedDays?: Array<{ fecha: string; es_dia_completo: boolean; hora_inicio?: string; hora_fin?: string }>;
    onCreateAppointment?: (time: string, staffId: number) => void;
    onSelectAppointment?: (apt: Appointment) => void;
    onDateChange?: (date: string) => void;
}

// Configuración de Staff/Áreas
// Configuración de Staff/Áreas
// keywords: términos que mapean a esta columna (normalizados)
const STAFF_AREAS = [
    { categoria: 'manos', label: 'Manos', emoji: '💅', color: '#ec4899', keywords: ['manos', 'unas', 'uñas', 'manicura', 'manicure', 'acrilicas', 'gel'] },
    { categoria: 'pies', label: 'Pies', emoji: '🦶', color: '#f97316', keywords: ['pies', 'pedicura', 'pedicure'] },
    { categoria: 'pestanas', label: 'Pestañas', emoji: '👁️', color: '#8b5cf6', keywords: ['pestanas', 'pestañas', 'cejas', 'extensiones', 'lifting', 'volumen'] },
    { categoria: 'rostro', label: 'Rostro', emoji: '💆', color: '#10b981', keywords: ['rostro', 'facial', 'limpieza', 'masaje'] },
    { categoria: 'cabello', label: 'Cabello', emoji: '💇', color: '#3b82f6', keywords: ['cabello', 'corte', 'tinte', 'botox', 'capilar'] }
];

const normalize = (str?: string) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

// Helper para obtener fecha local YYYY-MM-DD
const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const STATIC_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const StaffColumnsView: React.FC<StaffColumnsViewProps> = ({
    date,
    appointments,
    staff,
    businessHours = { weekdays: { start: 9, end: 20 }, saturday: { start: 9, end: 20 }, sunday: { start: 9, end: 20 } },
    lunchHours = "12pm - 2pm",
    closedDays = [],
    onCreateAppointment,
    onSelectAppointment,
    onDateChange
}) => {
    // Determinar qué áreas de staff mostrar basado en las citas o staff configurado
    const activeAreas = useMemo(() => {
        const activeSet = new Set<string>();

        // 1. Check Staff Specialities
        staff.filter(s => s.activo !== false).forEach(s => {
            const spec = normalize(s.especialidad);
            const found = STAFF_AREAS.find(area => area.keywords.some(k => spec.includes(k)));
            if (found) activeSet.add(found.categoria);
            else if (spec) activeSet.add('multi'); // Fallback logic could be added here
        });

        // 2. Check Appointments Categories AND Service names
        appointments.forEach(apt => {
            // Check categoria first, then fallback to servicio name
            const cat = normalize(apt.categoria);
            const svc = normalize(apt.servicio);
            const textToCheck = cat || svc || '';

            const found = STAFF_AREAS.find(area => area.keywords.some(k => textToCheck.includes(k)));
            if (found) activeSet.add(found.categoria);
        });

        // Filtrar STAFF_AREAS para mostrar solo las activas
        const filtered = STAFF_AREAS.filter(area => activeSet.has(area.categoria));
        return filtered.length > 0 ? filtered : STAFF_AREAS;
    }, [staff, appointments]);

    // Empleados por área (para referencia)
    const empleadosPorArea = useMemo(() => {
        const map: Record<string, StaffMember[]> = {};
        staff.filter(s => s.activo !== false).forEach(s => {
            const spec = normalize(s.especialidad);
            const found = STAFF_AREAS.find(area => area.keywords.some(k => spec.includes(k)));
            const catKey = found ? found.categoria : 'multi';

            if (!map[catKey]) map[catKey] = [];
            map[catKey].push(s);
        });
        return map;
    }, [staff]);

    // Formatear fecha
    const formattedDate = useMemo(() => {
        const d = new Date(date + 'T12:00:00');
        return d.toLocaleDateString('es-PE', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }, [date]);

    const isToday = useMemo(() => {
        return date === getLocalDateString(new Date());
    }, [date]);

    const currentHour = new Date().getHours();

    // Calcular las horas a mostrar basado en businessHours y el día
    const HOURS = useMemo(() => {
        const d = new Date(date + 'T12:00:00');
        const day = d.getDay();
        let start = 9, end = 20;

        if (day === 0) { // Domingo
            start = businessHours.sunday.start;
            end = businessHours.sunday.end;
        } else if (day === 6) { // Sábado
            start = businessHours.saturday.start;
            end = businessHours.saturday.end;
        } else { // Semanal
            start = businessHours.weekdays.start;
            end = businessHours.weekdays.end;
        }

        // Si está cerrado (start >= end), evitar crash creando array vacío
        if (start >= end) return [];

        const hours = [];
        for (let i = start; i < end; i++) {
            hours.push(i);
        }
        return hours;
    }, [date, businessHours]);

    // Parse lunch hours
    const parsedLunch = useMemo(() => {
        if (!lunchHours || lunchHours === 'CERRADO') return { start: 0, end: 0 };
        try {
            const parts = lunchHours.toLowerCase().replace(/\s/g, '').split('-');
            if (parts.length !== 2) return { start: 12, end: 14 };
            const parseH = (s: string) => {
                const isPm = s.includes('pm');
                let h = parseInt(s.replace(/[^0-9]/g, ''));
                if (isPm && h < 12) h += 12;
                if (!isPm && h === 12) h = 0;
                return h;
            };
            return { start: parseH(parts[0]), end: parseH(parts[1]) };
        } catch { return { start: 12, end: 14 }; }
    }, [lunchHours]);

    // Check closed day
    const dayClosure = useMemo(() => {
        return closedDays.find(c => c.fecha === date);
    }, [closedDays, date]);

    const goToPrevDay = () => {
        if (onDateChange) {
            const d = new Date(date + 'T12:00:00');
            d.setDate(d.getDate() - 1);
            onDateChange(getLocalDateString(d));
        }
    };

    const goToNextDay = () => {
        if (onDateChange) {
            const d = new Date(date + 'T12:00:00');
            d.setDate(d.getDate() + 1);
            onDateChange(getLocalDateString(d));
        }
    };

    const goToToday = () => {
        if (onDateChange) {
            onDateChange(getLocalDateString(new Date()));
        }
    };

    // Obtener cita para un área y hora específicos (Considerando duración)
    const getOccupyingAppointment = (areaCategoria: string, slotHour: number): { apt: Appointment, isStart: boolean } | undefined => {
        const areaDef = STAFF_AREAS.find(a => a.categoria === areaCategoria);
        if (!areaDef) return undefined;

        // Buscar citas que solapen con este slot [slotHour, slotHour + 1)
        const found = appointments.find(apt => {
            if (!apt.fecha?.startsWith(date)) return false;

            // Parsear hora inicio
            const [h, m] = (apt.hora || '00:00').split(':').map(Number);
            const aptStart = h + (m / 60);

            // Parsear duración (minutos -> horas)
            // IMPORTANTE: Usar la propiedad correcta o fallback
            const durationMin = (apt as any).duracion_min || (apt as any).durationMin || 60;
            const durationHours = durationMin / 60;
            const aptEnd = aptStart + durationHours;

            // Definir rango del slot actual
            const slotStart = slotHour;
            const slotEnd = slotHour + 1;

            // Chequear superposición strict strict
            // max(start1, start2) < min(end1, end2)
            const overlap = Math.max(aptStart, slotStart) < Math.min(aptEnd, slotEnd);

            if (!overlap) return false;

            // Chequear match de categoría
            const aptCat = normalize(apt.categoria);
            const aptSvc = normalize(apt.servicio);
            const textToCheck = aptCat || aptSvc || '';

            return areaDef.keywords.some(k => textToCheck.includes(k));
        });

        if (!found) return undefined;

        // Determinar si es el slot de inicio (para renderizar info)
        // Consideramos "Inicio" si el start del appointment cae dentro de este slot
        // O si el appointment empezó ANTES pero este es el primer slot visible (ej. empieza 8am pero grid empieza 9am)
        // Pero para simplificar visualmente: solo si el start está en [slotHour, slotHour+1)
        const [h, m] = (found.hora || '00:00').split(':').map(Number);
        const aptStart = h + (m / 60);
        const isStart = aptStart >= slotHour && aptStart < (slotHour + 1);

        return { apt: found, isStart };
    };

    // Obtener empleado asignado a una cita
    const getAssignedEmployee = (apt: Appointment): StaffMember | undefined => {
        if (!apt.staff_id) return undefined;
        return staff.find(s => s.id === apt.staff_id);
    };

    // Empty state
    if (activeAreas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                    No hay áreas de staff configuradas
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Agrega staff en Configuración → Equipo
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevDay}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title="Día anterior"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <button
                        onClick={goToNextDay}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        title="Día siguiente"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                    </button>
                    {!isToday && (
                        <button
                            onClick={goToToday}
                            className="ml-2 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                            Hoy
                        </button>
                    )}
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {formattedDate}
                </h3>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{activeAreas.length} áreas</span>
                    <span>•</span>
                    <span>
                        {appointments.filter(a => a.fecha?.startsWith(date) && a.estado !== 'Cancelada').length} citas
                    </span>
                </div>
            </div>

            {/* Grid de columnas por STAFF */}
            <div className="overflow-x-auto overflow-y-auto max-h-[80vh]">
                <div className="min-w-max">
                    {/* Header con nombres de ÁREAS */}
                    <div className="flex border-b border-gray-100 dark:border-dark-border sticky top-0 bg-white dark:bg-dark-card z-10">
                        {/* Columna de horas */}
                        <div className="w-16 shrink-0 bg-gray-50 dark:bg-white/5 border-r border-gray-100 dark:border-dark-border">
                            <div className="h-14 flex items-center justify-center">
                                {/* Clock icon removed to clean interface */}
                            </div>
                        </div>

                        {/* Columnas por ÁREA de Staff */}
                        {activeAreas.map(area => {
                            const empleados = empleadosPorArea[area.categoria] || [];
                            return (
                                <div
                                    key={area.categoria}
                                    className="w-44 shrink-0 border-r border-gray-100 dark:border-dark-border last:border-r-0"
                                >
                                    <div className="h-14 flex items-center gap-2 px-3 py-2">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-sm"
                                            style={{
                                                backgroundColor: area.color + '20',
                                                border: `2px solid ${area.color}`
                                            }}
                                        >
                                            {area.emoji}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                {area.label}
                                            </p>
                                            <p className="text-[10px] text-gray-400">
                                                {empleados.length === 0 ? 'Sin asignar' :
                                                    empleados.length === 1 ? empleados[0].nombre :
                                                        `${empleados.length} personas`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Filas de horas (30 min intervals) */}
                    {HOURS.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 italic">
                            El negocio está cerrado este día.
                        </div>
                    ) : (() => {
                        // Generar intervalos de 30 min
                        const intervals = [];
                        HOURS.forEach(h => {
                            intervals.push(h);
                            if (h < HOURS[HOURS.length - 1] + 1) { // Avoid adding extra slot at very end if needed
                                intervals.push(h + 0.5);
                            } else {
                                // Last hour logic: usually we push 20.0, if end is 21:00.
                            }
                        });
                        // Better approach: Loop from start to end by 0.5
                        const start = HOURS[0];
                        const end = HOURS[HOURS.length - 1] + 1;
                        const halfHourIntervals = [];
                        for (let i = start; i < end; i += 0.5) {
                            halfHourIntervals.push(i);
                        }

                        return halfHourIntervals.map(slotTime => {
                            const hourFloor = Math.floor(slotTime);
                            const isHalfHour = slotTime % 1 !== 0;
                            const timeString = `${hourFloor.toString().padStart(2, '0')}:${isHalfHour ? '30' : '00'}`;

                            const isPast = isToday && slotTime < (currentHour + (new Date().getMinutes() / 60));
                            const isCurrentSlot = isToday && slotTime <= (currentHour + (new Date().getMinutes() / 60)) && (slotTime + 0.5) > (currentHour + (new Date().getMinutes() / 60));

                            // Check logic for blocked slots (Refined for 30 min)
                            let isBlocked = false;
                            let blockReason = '';

                            // 1. Day Closure
                            if (dayClosure) {
                                if (dayClosure.es_dia_completo) {
                                    isBlocked = true;
                                    blockReason = 'Cerrado';
                                } else if (dayClosure.hora_inicio && dayClosure.hora_fin) {
                                    const start = parseInt(dayClosure.hora_inicio.split(':')[0]); // Simplified parsing
                                    const end = parseInt(dayClosure.hora_fin.split(':')[0]);
                                    if (slotTime >= start && slotTime < end) {
                                        isBlocked = true;
                                        blockReason = 'No disponible';
                                    }
                                }
                            }

                            // 2. Lunch
                            // Use precise float comparison
                            if (!isBlocked && lunchHours !== 'CERRADO') {
                                if (slotTime >= parsedLunch.start && slotTime < parsedLunch.end) {
                                    isBlocked = true;
                                    blockReason = 'Almuerzo';
                                }
                            }

                            return (
                                <div
                                    key={slotTime}
                                    className={`flex border-b border-gray-50 dark:border-white/5 last:border-b-0 ${isBlocked ? 'bg-gray-100/50 dark:bg-white/[0.05]' :
                                        isPast ? 'bg-gray-50/50 dark:bg-white/[0.02]' : ''
                                        } ${isCurrentSlot ? 'ring-1 ring-inset ring-indigo-200 dark:ring-indigo-500/30' : ''}`}
                                    style={{ height: '48px' }} // Altura fija de 48px por cada 30 min (96px por hora)
                                >
                                    {/* Columna de hora */}
                                    <div className="w-16 shrink-0 bg-gray-50/50 dark:bg-white/[0.02] border-r border-gray-100 dark:border-dark-border relative">
                                        <div className="absolute top-1 right-2 text-[10px] text-gray-400 bg-white dark:bg-dark-card px-1 rounded">
                                            {/* Solo mostrar etiqueta cada hora, o marcar :30 sutilmente */}
                                            {!isHalfHour ? timeString : ''}
                                        </div>
                                        {isHalfHour && (
                                            <div className="h-full border-t border-dashed border-gray-100 dark:border-white/5 w-full absolute top-0 pointer-events-none"></div>
                                        )}
                                    </div>

                                    {/* Celdas por área */}
                                    {activeAreas.map(area => {
                                        // Update Logic: Check slot overlap
                                        // slotTime to slotTime + 0.5
                                        const slotStart = slotTime;
                                        const slotEnd = slotTime + 0.5;

                                        // Find occupying appointment
                                        const found = appointments.find(apt => {
                                            if (!apt.fecha?.startsWith(date)) return false;
                                            const [h, m] = (apt.hora || '00:00').split(':').map(Number);
                                            const aptStart = h + (m / 60);
                                            const durationMin = (apt as any).duracion_min || (apt as any).durationMin || 60;
                                            const aptEnd = aptStart + (durationMin / 60);

                                            // Overlap: max(start1, start2) < min(end1, end2)
                                            const overlap = Math.max(aptStart, slotStart) < Math.min(aptEnd, slotEnd) - 0.001; // Epsilon subtraction to allow exact touches

                                            if (!overlap) return false;

                                            const aptCat = normalize(apt.categoria);
                                            const aptSvc = normalize(apt.servicio);
                                            const textToCheck = aptCat || aptSvc || '';
                                            return area.keywords.some(k => textToCheck.includes(k));
                                        });

                                        const slotInfo = found ? {
                                            apt: found,
                                            // Is Start if aptStart is within this slot OR aptStart was exactly on slot boundary
                                            isStart: (() => {
                                                const [h, m] = (found.hora || '00:00').split(':').map(Number);
                                                const aptStart = h + (m / 60);
                                                return Math.abs(aptStart - slotStart) < 0.001; // Float equality
                                            })()
                                        } : undefined;


                                        const assignedEmployee = slotInfo?.apt ? getAssignedEmployee(slotInfo.apt) : undefined;
                                        const empleados = empleadosPorArea[area.categoria] || [];
                                        const defaultStaffId = empleados.length > 0 ? empleados[0].id : 0;

                                        return (
                                            <div
                                                key={`${area.categoria}-${slotTime}`}
                                                className="w-44 shrink-0 border-r border-gray-100 dark:border-dark-border last:border-r-0 p-0.5 relative"
                                            >
                                                {slotInfo ? (
                                                    <button
                                                        onClick={() => onSelectAppointment?.(slotInfo.apt)}
                                                        className="w-full h-full rounded-md text-left transition-all hover:shadow-md overflow-hidden relative z-10"
                                                        style={{
                                                            backgroundColor: `${area.color}${slotInfo.isStart ? '20' : '15'}`,
                                                            borderLeft: slotInfo.isStart ? `3px solid ${area.color}` : `3px solid ${area.color}50`,
                                                            // Hide top border if not start to looks connected
                                                            borderTopLeftRadius: slotInfo.isStart ? '0.375rem' : '0',
                                                            borderTopRightRadius: slotInfo.isStart ? '0.375rem' : '0',
                                                            // Logic for bottom radius? Leave round.
                                                            opacity: slotInfo.isStart ? 1 : 0.8
                                                        }}
                                                    >
                                                        {slotInfo.isStart && (
                                                            <div className="p-1.5 flex flex-col justify-center h-full">
                                                                <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate leading-tight">
                                                                    {slotInfo.apt.cliente_nombre || slotInfo.apt.nombre || 'Cliente'}
                                                                </p>
                                                                <div className="flex items-center gap-1 mt-0.5">
                                                                    {assignedEmployee ? (
                                                                        <span className="text-[8px] bg-white/50 px-1 rounded truncate max-w-[60px]">
                                                                            {assignedEmployee.nombre.split(' ')[0]}
                                                                        </span>
                                                                    ) : null}
                                                                    <span className="text-[9px] opacity-80 truncate">{slotInfo.apt.servicio}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </button>
                                                ) : isBlocked ? (
                                                    <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-300 italic bg-stripes-gray opacity-30 select-none">
                                                        {blockReason}
                                                    </div>
                                                ) : (
                                                    !isPast && onCreateAppointment && (
                                                        <button
                                                            onClick={() => onCreateAppointment(timeString, defaultStaffId)}
                                                            className="w-full h-full rounded-md border border-dashed border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center justify-center group transition-colors opacity-0 hover:opacity-100"
                                                        >
                                                            <Plus className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        });
                    })()}
                </div>
            </div>
        </div>
    );
};

export default StaffColumnsView;
