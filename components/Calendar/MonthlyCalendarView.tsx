import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Bot, X, Clock } from 'lucide-react';
import { Appointment, StaffEspecialidad, StaffMember, STAFF_COLORS, STAFF_ICONS, ClosedDay } from '../../types';
import { getTimeInLima } from '../../utils/timezone';
import { useCurrency } from '../../hooks/useCurrency';

interface MonthlyCalendarViewProps {
    appointments: Appointment[];
    staff?: StaffMember[];
    closedDays?: ClosedDay[];
    selectedEspecialidad?: StaffEspecialidad | 'todos';
    selectedStaffId?: number | null;
    onSelectDate: (date: string) => void;
    onSelectAppointment: (apt: Appointment) => void;
    onCreateAppointment?: (date: string) => void;
}

const WEEKDAYS_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAYS_MED = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const STATUS_COLORS_MAP: Record<string, string> = {
    'Pendiente': '#f59e0b',
    'Completada': '#10b981',
    'Cancelada': '#ef4444',
    'No-Show': '#6b7280',
    'Reagendada': '#3b82f6',
};

/**
 * MonthlyCalendarView v2 — Estilo iOS Calendar / Google Calendar
 * - Mobile: dots de color por categoría, panel inferior al seleccionar día
 * - Desktop: barras con nombre del cliente y hora
 * - Leyenda de categorías siempre visible
 * - Touch targets 44px, scroll suave
 */
export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
    appointments,
    staff = [],
    closedDays = [],
    selectedEspecialidad = 'todos',
    selectedStaffId = null,
    onSelectDate,
    onSelectAppointment,
    onCreateAppointment
}) => {
    const { formatValue } = useCurrency();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedCell, setSelectedCell] = useState<string | null>(null);
    const dayPanelRef = useRef<HTMLDivElement>(null);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const goToPrevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedCell(getLocalDateStr(new Date()));
    };

    // Scroll al panel de día cuando se selecciona
    useEffect(() => {
        if (selectedCell && dayPanelRef.current) {
            setTimeout(() => {
                dayPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 50);
        }
    }, [selectedCell]);

    // Grid de días del mes
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const daysInMonth = lastDay.getDate();
        const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

        const prevMonth = new Date(currentYear, currentMonth, 0);
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i);
            days.push({ date, isCurrentMonth: false, dateStr: getLocalDateStr(date) });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            days.push({ date, isCurrentMonth: true, dateStr: getLocalDateStr(date) });
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const date = new Date(currentYear, currentMonth + 1, i);
            days.push({ date, isCurrentMonth: false, dateStr: getLocalDateStr(date) });
        }
        return days;
    }, [currentMonth, currentYear]);

    // Filtrar citas
    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            if (selectedEspecialidad !== 'todos') {
                const aptCategoria = (apt.categoria || '').toLowerCase();
                if (aptCategoria !== selectedEspecialidad) return false;
            }
            if (selectedStaffId && apt.staffId !== selectedStaffId) return false;
            if (apt.estado === 'Cancelada' || apt.estado === 'No-Show') return false;
            return true;
        });
    }, [appointments, selectedEspecialidad, selectedStaffId]);

    // Agrupar por fecha
    const appointmentsByDate = useMemo(() => {
        const map: Record<string, Appointment[]> = {};
        filteredAppointments.forEach(apt => {
            if (!apt.fecha) return;
            let dateKey: string;
            if (apt.fecha.includes('T')) dateKey = apt.fecha.split('T')[0];
            else if (apt.fecha.includes(' ')) dateKey = apt.fecha.split(' ')[0];
            else dateKey = apt.fecha;
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(apt);
        });
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
        });
        return map;
    }, [filteredAppointments]);

    const isClosedDay = (dateStr: string): ClosedDay | null =>
        closedDays.find(cd => cd.fecha === dateStr) || null;

    const isToday = (dateStr: string): boolean =>
        dateStr === getLocalDateStr(new Date());

    const getAppointmentColor = (apt: Appointment): string => {
        const categoria = (apt.categoria || 'multi') as StaffEspecialidad;
        return STAFF_COLORS[categoria] || '#6b7280';
    };

    const getAppointmentIcon = (apt: Appointment): string => {
        const categoria = (apt.categoria || 'multi') as StaffEspecialidad;
        return STAFF_ICONS[categoria] || '✨';
    };

    const handleCellClick = (dateStr: string, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return;
        setSelectedCell(prev => prev === dateStr ? null : dateStr);
        onSelectDate(dateStr);
    };

    // Citas del día seleccionado para el panel inferior
    const selectedDayAppointments = selectedCell ? (appointmentsByDate[selectedCell] || []) : [];

    // Nombre del día seleccionado
    const selectedDayLabel = useMemo(() => {
        if (!selectedCell) return '';
        const [y, m, d] = selectedCell.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
    }, [selectedCell]);

    // Categorías activas en el mes actual para la leyenda
    const activeCategoriesInMonth = useMemo(() => {
        const cats = new Set<string>();
        filteredAppointments.forEach(apt => {
            const dateKey = apt.fecha?.includes('T')
                ? apt.fecha.split('T')[0]
                : apt.fecha?.split(' ')[0] || '';
            if (dateKey.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)) {
                if (apt.categoria) cats.add(apt.categoria);
            }
        });
        return Array.from(cats);
    }, [filteredAppointments, currentYear, currentMonth]);

    return (
        <div className="w-full flex-1 min-h-0 min-w-0 flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-card overflow-hidden">

            {/* ── Header con navegación ─────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToPrevMonth}
                        className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                        aria-label="Mes anterior"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white min-w-[140px] text-center select-none">
                        {MONTHS[currentMonth]} {currentYear}
                    </h2>
                    <button
                        onClick={goToNextMonth}
                        className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
                        aria-label="Mes siguiente"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>
                <button
                    onClick={goToToday}
                    className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors active:scale-95 min-h-[36px]"
                >
                    Hoy
                </button>
            </div>

            {/* ── Cabecera días de la semana ────────────────────────────── */}
            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
                {WEEKDAYS_SHORT.map((day, i) => (
                    <div
                        key={day}
                        className={`py-2 text-center text-[11px] font-bold uppercase tracking-wider select-none
                            ${i >= 5 ? 'text-primary/70' : 'text-gray-400 dark:text-gray-500'}`}
                    >
                        <span className="sm:hidden">{WEEKDAYS_SHORT[i]}</span>
                        <span className="hidden sm:inline">{WEEKDAYS_MED[i]}</span>
                    </div>
                ))}
            </div>

            {/* ── Grid de días ─────────────────────────────────────────── */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto auto-rows-[minmax(64px,1fr)]">
                {calendarDays.map((day, index) => {
                    const { date, isCurrentMonth, dateStr } = day;
                    const dayAppointments = appointmentsByDate[dateStr] || [];
                    const closed = isClosedDay(dateStr);
                    const today = isToday(dateStr);
                    const isSelected = selectedCell === dateStr;
                    const isWeekend = index % 7 >= 5;

                    // Colores únicos de categorías para los dots
                    const dotColors = Array.from(
                        new Set(dayAppointments.map(apt => getAppointmentColor(apt)))
                    ).slice(0, 4);

                    return (
                        <div
                            key={index}
                            onClick={() => handleCellClick(dateStr, isCurrentMonth)}
                            className={`
                                relative flex flex-col items-center
                                border-b border-r border-gray-100 dark:border-dark-border
                                transition-all duration-150 select-none
                                ${isCurrentMonth ? 'cursor-pointer' : 'cursor-default'}
                                ${!isCurrentMonth ? 'bg-gray-50/60 dark:bg-gray-900/30' : ''}
                                ${isSelected && isCurrentMonth ? 'bg-primary/5 dark:bg-primary/10' : ''}
                                ${!isSelected && isCurrentMonth ? 'hover:bg-gray-50 dark:hover:bg-gray-800/40 active:bg-gray-100 dark:active:bg-gray-800' : ''}
                                ${closed ? 'bg-gray-100 dark:bg-gray-800/60' : ''}
                            `}
                            style={{ minHeight: '56px' }}
                        >
                            {/* Número del día */}
                            <div className="flex flex-col items-center pt-1.5 pb-1 w-full px-1">
                                <span className={`
                                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold transition-all
                                    ${today
                                        ? 'bg-primary text-white font-bold shadow-md shadow-primary/30'
                                        : isSelected && isCurrentMonth
                                            ? 'bg-primary/15 text-primary font-bold'
                                            : !isCurrentMonth
                                                ? 'text-gray-300 dark:text-gray-600'
                                                : isWeekend
                                                    ? 'text-primary/80 dark:text-primary/60'
                                                    : 'text-gray-700 dark:text-gray-300'
                                    }
                                `}>
                                    {date.getDate()}
                                </span>
                            </div>

                            {/* Overlay día cerrado */}
                            {closed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200/70 dark:bg-gray-700/70 z-10 rounded-sm">
                                    <span className="text-base">🚫</span>
                                </div>
                            )}

                            {/* MOBILE: dots de color por categoría */}
                            {!closed && isCurrentMonth && dayAppointments.length > 0 && (
                                <div className="sm:hidden flex items-center justify-center gap-0.5 pb-1.5 flex-wrap max-w-full px-1">
                                    {dotColors.map((color, i) => (
                                        <span
                                            key={i}
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    {dayAppointments.length > 4 && (
                                        <span className="text-[8px] font-bold text-gray-400">+</span>
                                    )}
                                </div>
                            )}

                            {/* DESKTOP: barras con nombre del cliente */}
                            {!closed && isCurrentMonth && (
                                <div className="hidden sm:flex flex-col gap-0.5 w-full px-1 pb-1.5 overflow-hidden">
                                    {dayAppointments.slice(0, 3).map((apt) => (
                                        <div
                                            key={apt.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectAppointment(apt);
                                            }}
                                            className="group flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white truncate cursor-pointer hover:opacity-90 transition-opacity active:scale-[0.98]"
                                            style={{ backgroundColor: getAppointmentColor(apt) }}
                                        >
                                            <span className="text-[9px] opacity-90 shrink-0">
                                                {getTimeInLima(apt.fecha)}
                                            </span>
                                            <span className="truncate">
                                                {apt.nombre_cliente || 'Cliente'}
                                            </span>
                                            {apt.isAiGenerated && (
                                                <Bot className="w-2.5 h-2.5 opacity-80 shrink-0" />
                                            )}
                                        </div>
                                    ))}
                                    {dayAppointments.length > 3 && (
                                        <div className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold text-center">
                                            +{dayAppointments.length - 3} más
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botón agregar (desktop hover) */}
                            {isCurrentMonth && !closed && onCreateAppointment && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateAppointment(dateStr);
                                    }}
                                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary p-0.5 text-white hover:bg-primary/90 shadow-md hidden sm:flex items-center justify-center"
                                    style={{ width: '18px', height: '18px' }}
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Panel inferior: citas del día seleccionado (mobile) ───── */}
            {selectedCell && (
                <div
                    ref={dayPanelRef}
                    className="border-t border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card"
                    style={{ animation: 'slideDownPanel 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
                >
                    <style>{`
                        @keyframes slideDownPanel {
                            from { opacity: 0; transform: translateY(-8px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>

                    {/* Header del panel */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-dark-border">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                                {selectedDayLabel}
                            </span>
                            {selectedDayAppointments.length > 0 && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-black text-primary">
                                    {selectedDayAppointments.length}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {onCreateAppointment && (
                                <button
                                    onClick={() => onCreateAppointment(selectedCell)}
                                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 active:scale-95 transition-all min-h-[36px]"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Nueva</span>
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedCell(null)}
                                className="flex items-center justify-center w-8 h-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Lista de citas del día */}
                    {selectedDayAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                                <Clock className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                Sin citas este día
                            </p>
                            {onCreateAppointment && (
                                <button
                                    onClick={() => onCreateAppointment(selectedCell)}
                                    className="mt-3 text-xs font-bold text-primary hover:underline"
                                >
                                    + Agregar cita
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-dark-border max-h-64 overflow-y-auto">
                            {selectedDayAppointments.map((apt) => {
                                const color = getAppointmentColor(apt);
                                const icon = getAppointmentIcon(apt);
                                const time = getTimeInLima(apt.fecha);
                                const statusColor = STATUS_COLORS_MAP[apt.estado] || '#6b7280';

                                return (
                                    <button
                                        key={apt.id}
                                        onClick={() => onSelectAppointment(apt)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800 transition-colors text-left"
                                        style={{ minHeight: '56px' }}
                                    >
                                        {/* Color strip */}
                                        <div
                                            className="w-1 self-stretch rounded-full shrink-0"
                                            style={{ backgroundColor: color }}
                                        />

                                        {/* Icono categoría */}
                                        <span className="text-lg shrink-0">{icon}</span>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {apt.nombre_cliente || 'Cliente'}
                                                </span>
                                                {apt.isAiGenerated && (
                                                    <span className="rounded-md bg-purple-100 dark:bg-purple-900/40 px-1 py-0.5 text-[9px] font-black text-purple-700 dark:text-purple-300 shrink-0">
                                                        IA
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {apt.servicio}
                                            </p>
                                        </div>

                                        {/* Hora + estado */}
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                                                {time}
                                            </span>
                                            <span
                                                className="text-[10px] font-bold rounded-md px-1.5 py-0.5"
                                                style={{
                                                    backgroundColor: statusColor + '18',
                                                    color: statusColor
                                                }}
                                            >
                                                {apt.estado}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── Footer: leyenda de categorías + resumen del mes ──────── */}
            <div className="border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-white/[0.02] px-4 py-3">
                {/* Leyenda de categorías */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-2">
                    {Object.entries(STAFF_COLORS).map(([esp, color]) => {
                        const icon = STAFF_ICONS[esp as StaffEspecialidad] || '✨';
                        const isActive = activeCategoriesInMonth.includes(esp);
                        return (
                            <div
                                key={esp}
                                className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-[11px] text-gray-600 dark:text-gray-400 capitalize font-medium">
                                    {icon} {esp}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Resumen del mes */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>
                        <strong className="text-gray-800 dark:text-gray-200">{filteredAppointments.length}</strong> citas este mes
                    </span>
                    <span className="hidden sm:inline">
                        <strong className="text-gray-800 dark:text-gray-200">
                            {formatValue(filteredAppointments.reduce((sum, apt) => sum + (apt.precio || 0), 0))}
                        </strong> proyectado
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MonthlyCalendarView;
