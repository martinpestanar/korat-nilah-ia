import React, { useMemo } from 'react';
import { Appointment } from '../../types';

interface DailyMetricsBarProps {
    appointments: Appointment[]; // Filtered for the day
    allAppointments?: Appointment[]; // Full history for weekly ctx
    selectedDate: Date;
    staff: Array<{ id: number; nombre: string; activo?: boolean }>;
    businessHours: { weekdays: { start: number; end: number }; saturday: { start: number; end: number }; sunday: { start: number; end: number } };
    closedDays?: Array<{ fecha: string; es_dia_completo: boolean }>;
}

export const DailyMetricsBar: React.FC<DailyMetricsBarProps> = ({ appointments, allAppointments = [], selectedDate, staff, businessHours, closedDays = [] }) => {
    // Helpers locales
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const isAfter = (d1: Date, d2: Date) => {
        return d1.getTime() > d2.getTime();
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    // Calcular métricas
    const metrics = useMemo(() => {
        // --- 1. Daily Metrics (Existing Logic) ---
        const dayAppointments = appointments.filter(apt => {
            if (!apt.fecha) return false;
            const aptDate = new Date(apt.fecha);
            if (isNaN(aptDate.getTime())) return false;
            return isSameDay(aptDate, selectedDate);
        });

        const activeAppointments = dayAppointments.filter(a => a.estado !== 'Cancelada' && a.estado !== 'No-Show');
        const completed = activeAppointments.filter(a => a.estado === 'Completada').length;
        const pending = activeAppointments.filter(a => a.estado === 'Pendiente' || a.estado === 'Reagendada').length;
        const total = activeAppointments.length;
        const revenue = activeAppointments.reduce((sum, apt) => sum + (Number(apt.precio) || 0), 0);
        const avgTicket = total > 0 ? Math.round(revenue / total) : 0;

        // Ocupación
        let openHour = 9;
        let closeHour = 20;
        const dayOfWeek = selectedDate.getDay();
        const dateStr = selectedDate.toISOString().split('T')[0];
        const isClosed = closedDays.some(c => c.fecha === dateStr && c.es_dia_completo);

        if (isClosed) {
            openHour = 0; closeHour = 0;
        } else {
            if (dayOfWeek === 0) { openHour = businessHours.sunday.start; closeHour = businessHours.sunday.end; }
            else if (dayOfWeek === 6) { openHour = businessHours.saturday.start; closeHour = businessHours.saturday.end; }
            else { openHour = businessHours.weekdays.start; closeHour = businessHours.weekdays.end; }
        }

        const operatingHours = Math.max(0, closeHour - openHour);
        const activeStaffCount = staff.filter(s => s.activo !== false).length || 1;
        const totalCapacityMinutes = operatingHours * 60 * activeStaffCount;
        const bookedMinutes = activeAppointments.reduce((sum, apt) => {
            const duration = (apt as any).duracion_min || 60;
            return sum + duration;
        }, 0);
        const utilizationRate = totalCapacityMinutes > 0
            ? Math.min(100, Math.round((bookedMinutes / totalCapacityMinutes) * 100))
            : 0;

        // Próxima Cita
        let nextAppointment: Appointment | null = null;
        const now = new Date();
        if (isSameDay(selectedDate, now)) {
            const upcomingAppointments = activeAppointments.filter(apt => {
                const aptDate = new Date(apt.fecha);
                return isAfter(aptDate, now) && apt.estado !== 'Completada';
            }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

            if (upcomingAppointments.length > 0) nextAppointment = upcomingAppointments[0];
        }

        // --- 2. Weekly Context Metrics (New) ---
        // Determine week range for selectedDate
        const currentDay = selectedDate.getDay(); // 0-6
        const diffToMon = selectedDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(selectedDate);
        monday.setDate(diffToMon);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Filter full history for this week
        const weeklyApts = allAppointments.filter(apt => {
            if (!apt.fecha) return false;
            const d = new Date(apt.fecha);
            // Include only active/completed
            const valid = apt.estado !== 'Cancelada' && apt.estado !== 'No-Show';
            return valid && d >= monday && d <= sunday;
        });

        const weeklyRevenue = weeklyApts.reduce((sum, a) => sum + (Number(a.precio) || 0), 0);

        // Find Top Staff
        const staffMap: Record<string, number> = {};
        weeklyApts.forEach(apt => {
            if (apt.staff_id) {
                const sid = String(apt.staff_id);
                staffMap[sid] = (staffMap[sid] || 0) + (Number(apt.precio) || 0);
            }
        });

        let topStaffId = '';
        let topStaffRevenue = 0;
        Object.entries(staffMap).forEach(([sid, rev]) => {
            if (rev > topStaffRevenue) {
                topStaffRevenue = rev;
                topStaffId = sid;
            }
        });

        const topStaffName = topStaffId
            ? staff.find(s => String(s.id) === topStaffId)?.nombre?.split(' ')[0]
            : null;

        return {
            total, completed, pending, revenue, avgTicket, utilizationRate, nextAppointment, isClosed,
            weeklyRevenue, topStaffName, topStaffRevenue
        };
    }, [appointments, allAppointments, selectedDate, staff, businessHours, closedDays]);

    return (
        <div className="flex flex-col gap-4 rounded-xl items-start sm:flex-row sm:items-center sm:justify-between transition-all duration-300">
            {/* SECCIÓN 1: KPIs Rápidos */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full sm:w-auto">

                {/* Total Citas */}
                <div className="flex items-center gap-3 min-w-[110px]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{metrics.total}</span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Citas Agendadas</span>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                {/* Ingresos & Ticket */}
                <div className="flex items-center gap-3 min-w-[130px]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
                            S/ {metrics.revenue.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Venta Proyectada</span>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                {/* Ocupación */}
                <div className="flex items-center gap-3 min-w-[100px]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="23" x2="17" y1="11" y2="11" /></svg>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className={`text-2xl font-bold leading-none ${metrics.utilizationRate > 80 ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                            {metrics.utilizationRate}%
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Nivel Ocupación</span>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: Next Action or Insights */}
            {metrics.nextAppointment ? (
                <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10 sm:max-w-md w-full sm:w-auto mt-2 sm:mt-0 shadow-sm">
                    <div className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase shrink-0">
                            PRÓXIMA
                        </span>
                        <div className="flex items-center gap-2 overflow-hidden min-w-0">
                            <span className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                {formatTime(new Date(metrics.nextAppointment.fecha))}
                            </span>
                            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">|</span>
                            <div className="flex flex-col leading-tight truncate min-w-0">
                                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                                    {metrics.nextAppointment.nombre_cliente}
                                </span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                    {metrics.nextAppointment.servicio}
                                    {metrics.nextAppointment.staffId ? ` • Staff` : ''}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : metrics.isClosed ? (
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-lg mt-2 sm:mt-0 border border-gray-100 dark:border-gray-700">
                    <span>😴 Negocio Cerrado</span>
                </div>
            ) : (
                /* UX MEJORADO: Mostrar insights semanales cuando no hay "Próxima Cita" */
                <div className="hidden sm:flex items-center gap-4 bg-gray-50 dark:bg-gray-800/40 px-4 py-2 rounded-xl mt-2 sm:mt-0 border border-gray-100 dark:border-gray-700">
                    {/* Weekly Revenue Mini-Stat */}
                    <div className="flex flex-col items-end border-r border-gray-200 dark:border-gray-700 pr-4">
                        <span className="text-[10px] font-medium text-gray-500 uppercase">Semana Actual</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-gray-800 dark:text-white">
                                S/ {metrics.weeklyRevenue.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>

                    {/* Top Staff Mini-Stat */}
                    {metrics.topStaffName ? (
                        <div className="flex flex-col min-w-[80px]">
                            <span className="text-[10px] font-medium text-gray-500 uppercase">Top Staff ⭐</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    {metrics.topStaffName}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    (S/{metrics.topStaffRevenue.toLocaleString('es-PE', { maximumFractionDigits: 0 })})
                                </span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">Sin datos esta semana</span>
                    )}
                </div>
            )}
        </div>
    );
};
