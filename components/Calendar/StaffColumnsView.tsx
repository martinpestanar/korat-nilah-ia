/**
 * StaffColumnsView — Premium Mobile-First Redesign
 * 
 * - Columnas por empleado, no por categoría
 * - Diseño tipo Kanban visual compacto
 * - Mobile: scroll horizontal suave con Avatar chips
 * - Desktop: vista completa con slots de tiempo
 */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

interface StaffMember {
    id: number;
    nombre: string;
    especialidad?: string;
    cat_staff?: string;
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
    duracion_min?: number;
    durationMin?: number;
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

// Paleta de colores vibrantes por área
const STAFF_AREAS = [
    { categoria: 'manos', label: 'Manos', emoji: '💅', gradient: 'from-pink-500 to-rose-500', color: '#ec4899', light: '#fce7f3', keywords: ['manos', 'unas', 'uñas', 'manicura', 'manicure', 'acrilicas', 'gel'] },
    { categoria: 'pies', label: 'Pies', emoji: '🦶', gradient: 'from-orange-500 to-amber-500', color: '#f97316', light: '#fff7ed', keywords: ['pies', 'pedicura', 'pedicure'] },
    { categoria: 'pestanas', label: 'Pestañas', emoji: '✨', gradient: 'from-violet-500 to-purple-500', color: '#8b5cf6', light: '#f5f3ff', keywords: ['pestanas', 'pestañas', 'cejas', 'extensiones', 'lifting', 'volumen'] },
    { categoria: 'rostro', label: 'Rostro', emoji: '💆', gradient: 'from-emerald-500 to-teal-500', color: '#10b981', light: '#ecfdf5', keywords: ['rostro', 'facial', 'limpieza', 'masaje'] },
    { categoria: 'cabello', label: 'Cabello', emoji: '💇', gradient: 'from-blue-500 to-indigo-500', color: '#3b82f6', light: '#eff6ff', keywords: ['cabello', 'corte', 'tinte', 'botox', 'capilar'] },
];

// Colors para avatares cuando no hay área definida
const AVATAR_COLORS = [
    { bg: 'from-pink-400 to-rose-500', color: '#ec4899' },
    { bg: 'from-violet-400 to-purple-500', color: '#8b5cf6' },
    { bg: 'from-emerald-400 to-teal-500', color: '#10b981' },
    { bg: 'from-blue-400 to-indigo-500', color: '#3b82f6' },
    { bg: 'from-orange-400 to-amber-500', color: '#f97316' },
    { bg: 'from-cyan-400 to-sky-500', color: '#06b6d4' },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    'Pendiente': { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-400', label: 'Pendiente' },
    'Confirmada': { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-400', label: 'Confirm.' },
    'Completada': { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400', label: 'Listo ✓' },
    'Cancelada': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', label: 'Cancelada' },
    'No-Show': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400', label: 'No-Show' },
};

const normalize = (str?: string) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getAreaDef = (especialidad?: string, index = 0) => {
    const spec = normalize(especialidad);
    return STAFF_AREAS.find(area => area.keywords.some(k => spec.includes(k))) || {
        categoria: 'general',
        label: especialidad || 'General',
        emoji: '👤',
        gradient: AVATAR_COLORS[index % AVATAR_COLORS.length].bg,
        color: AVATAR_COLORS[index % AVATAR_COLORS.length].color,
        light: '#f9fafb',
        keywords: [],
    };
};

const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};


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
    const { formatValue } = useCurrency();
    const [showEmptyStaff, setShowEmptyStaff] = useState(false);

    // Staff activo, ordenado por cantidad de citas del día (más ocupados primero)
    const activeStaff = useMemo(() => {
        const base = staff.filter(s => s.activo !== false);

        // Count appointments per staff (for sorting)
        const countMap: Record<number, number> = {};
        appointments.filter(a => a.fecha?.startsWith(date)).forEach(a => {
            const sid = a.staff_id || 0;
            countMap[sid] = (countMap[sid] || 0) + 1;
        });

        // Sort: staff with most appointments first
        const sorted = [...base].sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0));

        // Add unassigned column if needed
        const hasUnassigned = appointments.some(apt => apt.fecha?.startsWith(date) && !apt.staff_id);
        if (hasUnassigned) {
            sorted.push({
                id: 0,
                nombre: 'Sin asignar',
                especialidad: 'General',
                color: '#9ca3af',
                activo: true,
            });
        }

        return sorted;
    }, [staff, appointments, date]);

    // ¿Qué staff tiene citas hoy?
    const staffWithAppointments = useMemo(() => {
        const ids = new Set<number>();
        appointments.filter(a => a.fecha?.startsWith(date) && a.estado !== 'Cancelada').forEach(a => {
            ids.add(a.staff_id || 0);
        });
        return ids;
    }, [appointments, date]);

    // Staff visible según toggle
    const visibleStaff = useMemo(() => {
        if (showEmptyStaff) return activeStaff;
        const filtered = activeStaff.filter(s => staffWithAppointments.has(s.id));
        // Si no hay nadie con citas, mostrar todos
        return filtered.length > 0 ? filtered : activeStaff;
    }, [activeStaff, staffWithAppointments, showEmptyStaff]);

    const formattedDate = useMemo(() => {
        const d = new Date(date + 'T12:00:00');
        return {
            day: d.toLocaleDateString('es-PE', { weekday: 'long' }),
            date: d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' }),
            year: d.getFullYear(),
        };
    }, [date]);

    const isToday = useMemo(() => date === getLocalDateString(new Date()), [date]);

    const currentHour = new Date().getHours();
    const currentMinutes = new Date().getMinutes();
    const currentTime = currentHour + currentMinutes / 60;

    const HOURS = useMemo(() => {
        const d = new Date(date + 'T12:00:00');
        const day = d.getDay();
        let start = 9, end = 20;
        if (day === 0) { start = businessHours.sunday.start; end = businessHours.sunday.end; }
        else if (day === 6) { start = businessHours.saturday.start; end = businessHours.saturday.end; }
        else { start = businessHours.weekdays.start; end = businessHours.weekdays.end; }
        if (start >= end) return [];
        const hours = [];
        for (let i = start; i < end; i++) hours.push(i);
        return hours;
    }, [date, businessHours]);

    const parsedLunch = useMemo(() => {
        if (!lunchHours || lunchHours === 'CERRADO') return { start: 0, end: 0 };
        try {
            const parts = lunchHours.toLowerCase().replace(/\s/g, '').split('-');
            if (parts.length !== 2) return { start: 12, end: 14 };
            const ph = (s: string) => {
                const isPm = s.includes('pm');
                let h = parseInt(s.replace(/[^0-9]/g, ''));
                if (isPm && h < 12) h += 12;
                if (!isPm && h === 12) h = 0;
                return h;
            };
            return { start: ph(parts[0]), end: ph(parts[1]) };
        } catch { return { start: 12, end: 14 }; }
    }, [lunchHours]);

    const dayClosure = useMemo(() => closedDays.find(c => c.fecha === date), [closedDays, date]);

    const todayApts = useMemo(() =>
        appointments.filter(a => a.fecha?.startsWith(date) && a.estado !== 'Cancelada')
        , [appointments, date]);

    const goTo = (offset: number) => {
        if (!onDateChange) return;
        const d = new Date(date + 'T12:00:00');
        d.setDate(d.getDate() + offset);
        onDateChange(getLocalDateString(d));
    };

    // Empty state
    if (activeStaff.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-dark-card rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-bold text-gray-700 dark:text-gray-300">Sin equipo configurado</p>
                <p className="text-sm text-gray-400 mt-1">Agrega personal en Configuración → Equipo</p>
            </div>
        );
    }

    // ── Half-hour intervals ────────────────────────────────────────────────
    const halfHourIntervals: number[] = [];
    if (HOURS.length > 0) {
        const start = HOURS[0];
        const end = HOURS[HOURS.length - 1] + 1;
        for (let i = start; i < end; i += 0.5) halfHourIntervals.push(i);
    }

    // Compute today's total revenue
    const todayRevenue = todayApts.reduce((sum, a) => sum + (a.precio || 0), 0);


    return (
        <div className="flex flex-col w-full min-w-0 bg-white dark:bg-dark-card rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border shadow-sm">

            {/* ── TOP HEADER ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden">
                {/* Gradient background strip */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

                <div className="relative flex items-center justify-between gap-3 px-4 pt-4 pb-3">
                    {/* Date navigation */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => goTo(-1)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition-all active:scale-95"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => goTo(1)}
                            className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-gray-300 transition-all active:scale-95"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Date display */}
                    <div className="flex-1 min-w-0 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 capitalize">
                            {formattedDate.day}
                        </p>
                        <p className="text-base font-bold text-gray-900 dark:text-white capitalize leading-tight">
                            {formattedDate.date}
                            {isToday && (
                                <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0 text-[9px] font-bold text-primary">
                                    HOY
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Today button + stats */}
                    <div className="flex flex-col items-end gap-0.5">
                        {!isToday && (
                            <button
                                onClick={() => onDateChange?.(getLocalDateString(new Date()))}
                                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition-colors active:scale-95"
                            >
                                Hoy
                            </button>
                        )}
                        <p className="text-[10px] text-gray-400 font-medium">
                            {todayApts.length} cita{todayApts.length !== 1 ? 's' : ''}
                            {todayRevenue > 0 && <span className="text-emerald-500 ml-1">• {formatValue(todayRevenue)}</span>}
                        </p>
                    </div>
                </div>

                {/* ── Staff Chips (horizontal scroll on mobile) ─────────── */}
                <div className="px-4 pb-3">
                    <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide snap-x">
                        {activeStaff.map((s, idx) => {
                            const areaDef = getAreaDef(s.especialidad || s.cat_staff, idx);
                            const aptCount = todayApts.filter(a => (a.staff_id || 0) === s.id).length;
                            const hasApts = aptCount > 0;
                            const isUnassigned = s.id === 0;

                            return (
                                <div
                                    key={s.id}
                                    className={`flex-shrink-0 snap-start flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border-2 transition-all ${hasApts
                                        ? 'border-transparent shadow-sm'
                                        : 'border-gray-100 dark:border-white/10 opacity-60'
                                        }`}
                                    style={hasApts ? {
                                        background: `linear-gradient(135deg, ${areaDef.color}15, ${areaDef.color}08)`,
                                        borderColor: areaDef.color + '40',
                                    } : {}}
                                >
                                    {/* Avatar */}
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${isUnassigned ? 'bg-gray-400' : `bg-gradient-to-br ${areaDef.gradient}`}`}
                                    >
                                        {isUnassigned ? '?' : getInitials(s.nombre)}
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-gray-800 dark:text-white leading-none">
                                            {s.nombre.split(' ')[0]}
                                        </p>
                                        <p className="text-[9px] text-gray-400 leading-none mt-0.5">
                                            {hasApts ? `${aptCount} cita${aptCount > 1 ? 's' : ''}` : 'Libre'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── TOGGLE: Mostrar sin citas ─────────────────────────────── */}
            {activeStaff.length > visibleStaff.length && (
                <div className="px-4 py-2 border-t border-gray-50 dark:border-white/5">
                    <button
                        onClick={() => setShowEmptyStaff(p => !p)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                        {showEmptyStaff
                            ? 'Ocultar personal sin citas'
                            : `Ver ${activeStaff.length - visibleStaff.length} sin citas hoy`}
                    </button>
                </div>
            )}

            {/* ── GRID ──────────────────────────────────────────────────── */}
            {dayClosure?.es_dia_completo ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">Negocio cerrado</p>
                        <p className="text-sm text-gray-400 mt-0.5">Este día está marcado como día cerrado</p>
                    </div>
                </div>
            ) : HOURS.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <Clock className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-400 text-sm">No hay horas de atención configuradas para este día</p>
                </div>
            ) : (
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)] min-h-[400px]">
                    <div className="min-w-max">

                        {/* ── STICKY COLUMN HEADERS ─────────────────────── */}
                        <div className="flex border-b border-gray-100 dark:border-white/10 sticky top-0 z-20 bg-white dark:bg-dark-card shadow-sm">
                            {/* Hour gutter */}
                            <div className="w-12 shrink-0 bg-gray-50/80 dark:bg-white/[0.03] border-r border-gray-100 dark:border-white/10" />

                            {visibleStaff.map((s, idx) => {
                                const areaDef = getAreaDef(s.especialidad || s.cat_staff, idx);
                                const isUnassigned = s.id === 0;
                                const aptCount = todayApts.filter(a => (a.staff_id || 0) === s.id).length;

                                return (
                                    <div
                                        key={s.id}
                                        className="w-40 shrink-0 border-r border-gray-100 dark:border-white/10 last:border-r-0"
                                    >
                                        <div className="flex flex-col items-center justify-center py-2.5 px-1 gap-1 h-16">
                                            {/* Avatar circle */}
                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md ${isUnassigned ? 'bg-gray-400' : `bg-gradient-to-br ${areaDef.gradient}`}`}
                                            >
                                                {isUnassigned ? '?' : getInitials(s.nombre)}
                                            </div>
                                            <div className="text-center min-w-0">
                                                <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate max-w-[136px]">
                                                    {s.nombre.split(' ')[0]}
                                                </p>
                                                <p className="text-[9px] font-medium" style={{ color: areaDef.color }}>
                                                    {areaDef.emoji} {areaDef.label} {aptCount > 0 && <span className="text-gray-400">· {aptCount}</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── TIME ROWS ─────────────────────────────────── */}
                        {halfHourIntervals.map(slotTime => {
                            const hourFloor = Math.floor(slotTime);
                            const isHalfHour = slotTime % 1 !== 0;
                            const timeString = `${hourFloor.toString().padStart(2, '0')}:${isHalfHour ? '30' : '00'}`;

                            const isPast = isToday && slotTime < currentTime;
                            const isCurrentSlot = isToday && slotTime <= currentTime && (slotTime + 0.5) > currentTime;

                            let isLunch = false;
                            if (lunchHours !== 'CERRADO' && parsedLunch.start > 0) {
                                isLunch = slotTime >= parsedLunch.start && slotTime < parsedLunch.end;
                            }

                            let isDayClosed = false;
                            if (dayClosure && !dayClosure.es_dia_completo && dayClosure.hora_inicio && dayClosure.hora_fin) {
                                const cs = parseInt(dayClosure.hora_inicio.split(':')[0]);
                                const ce = parseInt(dayClosure.hora_fin.split(':')[0]);
                                isDayClosed = slotTime >= cs && slotTime < ce;
                            }

                            const isBlocked = isLunch || isDayClosed;

                            return (
                                <div
                                    key={slotTime}
                                    className={`flex border-b last:border-b-0 transition-colors ${isBlocked
                                        ? 'bg-gray-50 dark:bg-white/[0.02] border-gray-100/50 dark:border-white/5'
                                        : isHalfHour
                                            ? 'border-gray-50 dark:border-white/[0.04]'
                                            : 'border-gray-100 dark:border-white/[0.07]'
                                        } ${isCurrentSlot ? 'relative' : ''} ${isPast && !isBlocked ? 'opacity-60' : ''}`}
                                    style={{ height: '52px' }}
                                >
                                    {/* Current time indicator */}
                                    {isCurrentSlot && (
                                        <div className="absolute left-0 right-0 z-30" style={{ top: `${((currentTime - slotTime) / 0.5) * 100}%` }}>
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-primary ml-10 shrink-0 shadow-md shadow-primary/50" />
                                                <div className="flex-1 h-[2px] bg-gradient-to-r from-primary to-primary/0" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Hour label */}
                                    <div className="w-12 shrink-0 border-r border-gray-100 dark:border-white/10 relative flex items-start justify-end pr-2 pt-1">
                                        {!isHalfHour ? (
                                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tabular-nums">
                                                {hourFloor < 12 ? `${hourFloor}am` : hourFloor === 12 ? '12pm' : `${hourFloor - 12}pm`}
                                            </span>
                                        ) : (
                                            <span className="text-[9px] text-gray-300 dark:text-gray-700">:30</span>
                                        )}
                                    </div>

                                    {/* Staff cells */}
                                    {visibleStaff.map((staffMember, idx) => {
                                        const slotStart = slotTime;
                                        const slotEnd = slotTime + 0.5;

                                        const found = appointments.find(apt => {
                                            if (!apt.fecha?.startsWith(date)) return false;
                                            const assignedId = apt.staff_id || 0;
                                            if (assignedId !== staffMember.id) return false;

                                            const [h, m] = (apt.hora || '00:00').split(':').map(Number);
                                            const aptStart = h + m / 60;
                                            const durMin = apt.duracion_min || apt.durationMin || 60;
                                            const aptEnd = aptStart + durMin / 60;

                                            return Math.max(aptStart, slotStart) < Math.min(aptEnd, slotEnd) - 0.001;
                                        });

                                        const areaDef = getAreaDef(staffMember.especialidad || staffMember.cat_staff, idx);
                                        const isStart = found ? (() => {
                                            const [h, m] = (found.hora || '00:00').split(':').map(Number);
                                            return Math.abs(h + m / 60 - slotStart) < 0.001;
                                        })() : false;

                                        const statusInfo = found ? (STATUS_BADGE[found.estado || ''] || STATUS_BADGE['Pendiente']) : null;

                                        return (
                                            <div
                                                key={`${staffMember.id}-${slotTime}`}
                                                className="w-40 shrink-0 border-r border-gray-100 dark:border-white/10 last:border-r-0 p-0.5 relative"
                                            >
                                                {found ? (
                                                    <button
                                                        onClick={() => onSelectAppointment?.(found)}
                                                        className={`w-full h-full rounded-lg text-left transition-all active:scale-[0.97] overflow-hidden ${isStart ? 'shadow-sm hover:shadow-md' : ''}`}
                                                        style={{
                                                            backgroundColor: isStart ? areaDef.color + '18' : areaDef.color + '10',
                                                            borderLeft: `3px solid ${areaDef.color}${isStart ? '' : '60'}`,
                                                            borderTopLeftRadius: isStart ? '0.5rem' : '0',
                                                            borderTopRightRadius: isStart ? '0.5rem' : '0',
                                                            borderBottomLeftRadius: '0.5rem',
                                                            borderBottomRightRadius: '0.5rem',
                                                        }}
                                                    >
                                                        {isStart && (
                                                            <div className="px-2 pt-1.5 pb-1 flex flex-col gap-0.5 h-full">
                                                                <p className="text-[11px] font-black text-gray-900 dark:text-white truncate leading-tight">
                                                                    {found.cliente_nombre || found.nombre || 'Cliente'}
                                                                </p>
                                                                <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                                                                    {found.servicio}
                                                                </p>
                                                                {statusInfo && (
                                                                    <span className={`inline-block mt-0.5 rounded px-1 text-[8px] font-bold w-fit ${statusInfo.bg} ${statusInfo.text}`}>
                                                                        {statusInfo.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </button>
                                                ) : isBlocked ? (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        {!isHalfHour && isLunch && (
                                                            <span className="text-[9px] text-gray-300 dark:text-gray-700 italic">
                                                                Almuerzo
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    !isPast && onCreateAppointment && staffMember.id !== 0 ? (
                                                        <button
                                                            onClick={() => onCreateAppointment(timeString, staffMember.id)}
                                                            className="w-full h-full rounded-lg border border-dashed border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center justify-center group transition-all active:scale-95"
                                                        >
                                                            <Plus className="h-3 w-3 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-400 group-hover:scale-110 transition-all" />
                                                        </button>
                                                    ) : null
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── FOOTER SUMMARY ───────────────────────────────────────── */}
            {todayApts.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {todayApts.length} cita{todayApts.length !== 1 ? 's' : ''} hoy
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        {todayRevenue > 0 && (
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Ingresos</p>
                                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{formatValue(todayRevenue)}</p>
                            </div>
                        )}
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Equipo</p>
                            <p className="text-sm font-black text-gray-700 dark:text-gray-300">{Math.max(1, staffWithAppointments.size)} activo{staffWithAppointments.size !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffColumnsView;
