import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Bot, X } from 'lucide-react';
import { Appointment, StaffEspecialidad, StaffMember, STAFF_COLORS, STAFF_ICONS, ClosedDay } from '../../types';
import { getTimeInLima } from '../../utils/timezone';

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

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Helper para fecha local YYYY-MM-DD
const getLocalDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * MonthlyCalendarView - Vista de calendario mensual estilo Google Calendar
 * Optimizado para salones de belleza con colores por staff/especialidad
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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null);
    const [selectedCell, setSelectedCell] = useState<string | null>(null);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Navegar entre meses
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Generar grid de días del mes
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);

        // Ajustar para que la semana empiece en Lunes (0=Lun, 6=Dom)
        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const daysInMonth = lastDay.getDate();
        const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = [];

        // Días del mes anterior
        const prevMonth = new Date(currentYear, currentMonth, 0);
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i);
            days.push({
                date,
                isCurrentMonth: false,
                dateStr: getLocalDateStr(date)
            });
        }

        // Días del mes actual
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            days.push({
                date,
                isCurrentMonth: true,
                dateStr: getLocalDateStr(date)
            });
        }

        // Días del mes siguiente para completar la grilla
        const remainingDays = 42 - days.length; // 6 semanas x 7 días
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(currentYear, currentMonth + 1, i);
            days.push({
                date,
                isCurrentMonth: false,
                dateStr: getLocalDateStr(date)
            });
        }

        return days;
    }, [currentMonth, currentYear]);

    // Filtrar citas por especialidad y staff
    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            // Filtrar por especialidad
            if (selectedEspecialidad !== 'todos') {
                const aptCategoria = (apt.categoria || '').toLowerCase();
                if (aptCategoria !== selectedEspecialidad) return false;
            }

            // Filtrar por staff específico
            if (selectedStaffId && apt.staffId !== selectedStaffId) return false;

            // Excluir canceladas de la vista
            if (apt.estado === 'Cancelada' || apt.estado === 'No-Show') return false;

            return true;
        });
    }, [appointments, selectedEspecialidad, selectedStaffId]);

    // Agrupar citas por fecha
    const appointmentsByDate = useMemo(() => {
        const map: Record<string, Appointment[]> = {};

        filteredAppointments.forEach(apt => {
            if (!apt.fecha) return;

            let dateKey: string;
            if (apt.fecha.includes('T')) {
                dateKey = apt.fecha.split('T')[0];
            } else if (apt.fecha.includes(' ')) {
                dateKey = apt.fecha.split(' ')[0];
            } else {
                dateKey = apt.fecha;
            }

            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(apt);
        });

        // Ordenar citas por hora
        Object.keys(map).forEach(key => {
            map[key].sort((a, b) => {
                const timeA = a.fecha || '';
                const timeB = b.fecha || '';
                return timeA.localeCompare(timeB);
            });
        });

        return map;
    }, [filteredAppointments]);

    // Verificar si un día está cerrado
    const isClosedDay = (dateStr: string): ClosedDay | null => {
        return closedDays.find(cd => cd.fecha === dateStr) || null;
    };

    // Verificar si es hoy
    const isToday = (dateStr: string): boolean => {
        const today = new Date();
        const todayStr = getLocalDateStr(today);
        return dateStr === todayStr;
    };

    // Obtener color de la cita según categoría
    const getAppointmentColor = (apt: Appointment): string => {
        const categoria = (apt.categoria || 'multi') as StaffEspecialidad;
        return STAFF_COLORS[categoria] || '#6b7280';
    };

    // Obtener icono de la cita
    const getAppointmentIcon = (apt: Appointment): string => {
        const categoria = (apt.categoria || 'multi') as StaffEspecialidad;
        return STAFF_ICONS[categoria] || '✨';
    };

    // Calcular nivel de ocupación del día
    const getOccupancyLevel = (dateStr: string): 'low' | 'medium' | 'high' | 'empty' => {
        const count = appointmentsByDate[dateStr]?.length || 0;
        if (count === 0) return 'empty';
        if (count <= 2) return 'low';
        if (count <= 5) return 'medium';
        return 'high';
    };

    // Handle cell click
    const handleCellClick = (dateStr: string, isCurrentMonth: boolean) => {
        if (!isCurrentMonth) return;
        setSelectedCell(dateStr);
        onSelectDate(dateStr);
    };

    return (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-dark-border dark:bg-dark-card overflow-hidden">
            {/* Header con navegación */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-border dark:bg-dark-bg">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevMonth}
                        className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>

                    <h2 className="text-lg font-bold text-gray-900 dark:text-white min-w-[180px] text-center">
                        {MONTHS[currentMonth]} {currentYear}
                    </h2>

                    <button
                        onClick={goToNextMonth}
                        className="rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <button
                    onClick={goToToday}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                >
                    Hoy
                </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-dark-border">
                {WEEKDAYS.map((day, i) => (
                    <div
                        key={day}
                        className={`
              py-2 text-center text-xs font-bold uppercase tracking-wider
              ${i >= 5 ? 'text-primary/70' : 'text-gray-500 dark:text-gray-400'}
            `}
                    >
                        <span className="hidden sm:inline">{WEEKDAYS_FULL[i]}</span>
                        <span className="sm:hidden">{day}</span>
                    </div>
                ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((day, index) => {
                    const { date, isCurrentMonth, dateStr } = day;
                    const dayAppointments = appointmentsByDate[dateStr] || [];
                    const closed = isClosedDay(dateStr);
                    const today = isToday(dateStr);
                    const occupancy = getOccupancyLevel(dateStr);
                    const isSelected = selectedCell === dateStr;

                    return (
                        <div
                            key={index}
                            onClick={() => handleCellClick(dateStr, isCurrentMonth)}
                            className={`
                relative min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-b border-r border-gray-100 p-1 sm:p-2
                transition-all duration-150 cursor-pointer
                dark:border-dark-border
                ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900/50' : ''}
                ${today ? 'ring-2 ring-inset ring-primary' : ''}
                ${isSelected ? 'bg-primary/5' : isCurrentMonth ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
                ${closed ? 'bg-gray-100 dark:bg-gray-800' : ''}
              `}
                        >
                            {/* Número del día */}
                            <div className="flex items-start justify-between mb-1">
                                <span className={`
                  inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-medium
                  ${today ? 'bg-primary text-white font-bold' : ''}
                  ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                `}>
                                    {date.getDate()}
                                </span>

                                {/* Indicador de ocupación */}
                                {isCurrentMonth && !closed && occupancy !== 'empty' && (
                                    <span className={`
                    w-2 h-2 rounded-full
                    ${occupancy === 'high' ? 'bg-red-400' : occupancy === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}
                  `} title={`${dayAppointments.length} citas`} />
                                )}
                            </div>

                            {/* Overlay de día cerrado */}
                            {closed && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200/80 dark:bg-gray-700/80 z-10">
                                    <span className="text-lg">🚫</span>
                                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 text-center px-1 line-clamp-2">
                                        {closed.motivo || 'Cerrado'}
                                    </span>
                                </div>
                            )}

                            {/* Lista de citas */}
                            {!closed && isCurrentMonth && (
                                <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                                    {dayAppointments.slice(0, 3).map((apt) => (
                                        <div
                                            key={apt.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectAppointment(apt);
                                            }}
                                            onMouseEnter={() => setHoveredAppointment(apt)}
                                            onMouseLeave={() => setHoveredAppointment(null)}
                                            className="group relative rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-medium text-white truncate cursor-pointer hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: getAppointmentColor(apt) }}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span className="hidden sm:inline">{getAppointmentIcon(apt)}</span>
                                                <span className="hidden sm:inline font-bold">{getTimeInLima(apt.fecha)}</span>
                                                <span className="truncate">{apt.nombre_cliente || 'Cliente'}</span>
                                            </div>

                                            {/* AI Badge */}
                                            {apt.isAiGenerated && (
                                                <Bot className="absolute -top-1 -right-1 w-3 h-3 text-purple-300" />
                                            )}
                                        </div>
                                    ))}

                                    {/* Mostrar "+X más" si hay más de 3 citas */}
                                    {dayAppointments.length > 3 && (
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium text-center">
                                            +{dayAppointments.length - 3} más
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botón de agregar cita (solo en hover en desktop) */}
                            {isCurrentMonth && !closed && onCreateAppointment && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCreateAppointment(dateStr);
                                    }}
                                    className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary p-1 text-white hover:bg-primary/90 shadow-lg hidden sm:block"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tooltip para cita hover */}
            {hoveredAppointment && (
                <div className="fixed z-50 pointer-events-none hidden lg:block" style={{
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }}>
                    {/* Este tooltip aparecería cerca del cursor - simplificado por ahora */}
                </div>
            )}

            {/* Leyenda de colores (móvil) */}
            <div className="flex flex-wrap gap-2 p-3 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg sm:hidden">
                {Object.entries(STAFF_COLORS).map(([esp, color]) => (
                    <div key={esp} className="flex items-center gap-1 text-[10px]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{esp}</span>
                    </div>
                ))}
            </div>

            {/* Resumen del mes */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2 dark:border-dark-border dark:bg-dark-bg">
                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                        <strong className="text-gray-900 dark:text-white">{filteredAppointments.length}</strong> citas este mes
                    </span>
                    <span className="hidden sm:inline">
                        <strong className="text-gray-900 dark:text-white">
                            S/ {filteredAppointments.reduce((sum, apt) => sum + (apt.precio || 0), 0).toLocaleString()}
                        </strong> proyectado
                    </span>
                </div>

                {/* Leyenda de ocupación */}
                <div className="hidden sm:flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Bajo</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Medio</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Alto</span>
                </div>
            </div>
        </div>
    );
};

export default MonthlyCalendarView;
