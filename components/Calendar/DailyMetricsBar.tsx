import React, { useMemo } from 'react';
import { Appointment } from '../../types';
import { useCurrency } from '../../hooks/useCurrency';

interface DailyMetricsBarProps {
    appointments: Appointment[];
    allAppointments?: Appointment[];
    selectedDate: Date;
    staff: Array<{ id: number; nombre: string; activo?: boolean }>;
    businessHours: { weekdays: { start: number; end: number }; saturday: { start: number; end: number }; sunday: { start: number; end: number } };
    closedDays?: Array<{ fecha: string; es_dia_completo: boolean }>;
}

export const DailyMetricsBar: React.FC<DailyMetricsBarProps> = ({ appointments, allAppointments = [], selectedDate, staff, businessHours, closedDays = [] }) => {
    const { formatValue, moneda, idioma } = useCurrency();

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });

    const metrics = useMemo(() => {
        const dayAppointments = appointments.filter(apt => {
            if (!apt.fecha) return false;
            const aptDate = new Date(apt.fecha);
            return !isNaN(aptDate.getTime()) && isSameDay(aptDate, selectedDate);
        });
        const activeAppointments = dayAppointments.filter(a => a.estado !== 'Cancelada' && a.estado !== 'No-Show');
        const total = activeAppointments.length;
        const revenue = activeAppointments.reduce((sum, apt) => sum + (Number(apt.precio) || 0), 0);

        // Ocupación
        const dayOfWeek = selectedDate.getDay();
        const dateStr = selectedDate.toISOString().split('T')[0];
        const isClosed = closedDays.some(c => c.fecha === dateStr && c.es_dia_completo);
        let openHour = businessHours.weekdays.start, closeHour = businessHours.weekdays.end;
        if (isClosed) { openHour = 0; closeHour = 0; }
        else if (dayOfWeek === 0) { openHour = businessHours.sunday.start; closeHour = businessHours.sunday.end; }
        else if (dayOfWeek === 6) { openHour = businessHours.saturday.start; closeHour = businessHours.saturday.end; }

        const operatingHours = Math.max(0, closeHour - openHour);
        const activeStaffCount = staff.filter(s => s.activo !== false).length || 1;
        const totalCapacityMinutes = operatingHours * 60 * activeStaffCount;
        const bookedMinutes = activeAppointments.reduce((sum, apt) => sum + ((apt as any).duracion_min || 60), 0);
        const utilizationRate = totalCapacityMinutes > 0 ? Math.min(100, Math.round((bookedMinutes / totalCapacityMinutes) * 100)) : 0;

        // Próxima cita
        let nextAppointment: Appointment | null = null;
        const now = new Date();
        if (isSameDay(selectedDate, now)) {
            const upcoming = activeAppointments
                .filter(apt => new Date(apt.fecha) > now && apt.estado !== 'Completada')
                .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
            if (upcoming.length > 0) nextAppointment = upcoming[0];
        }

        return { total, revenue, utilizationRate, nextAppointment, isClosed, activeStaffCount };
    }, [appointments, selectedDate, staff, businessHours, closedDays]);

    const occupancyColor = metrics.utilizationRate > 80
        ? 'text-orange-500'
        : metrics.utilizationRate > 50
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-900 dark:text-white';

    return (
        <div className="flex flex-col gap-3">
            {/* ── 3 KPIs en grid full-width — caben en 390px ─────── */}
            <div className="grid grid-cols-3 gap-2">

                {/* Citas */}
                <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-3 text-center">
                    <span className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 leading-none">{metrics.total}</span>
                    <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400">Citas</span>
                </div>

                {/* Ingresos */}
                <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
                    <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 leading-none">
                        {metrics.revenue > 999
                            ? `${moneda} ${(metrics.revenue / 1000).toFixed(1)}k`
                            : formatValue(metrics.revenue)
                        }
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">Venta</span>
                </div>

                {/* Ocupación */}
                <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center">
                    <span className={`text-xl font-extrabold leading-none ${occupancyColor}`}>{metrics.utilizationRate}%</span>
                    <span className="text-[10px] font-semibold text-blue-500 dark:text-blue-400">Ocupación</span>
                </div>
            </div>

            {/* ── Próxima cita — full width ─────────────────────── */}
            {metrics.nextAppointment && (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10 px-4 py-3">
                    <div className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wide">PRÓXIMA</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                {formatTime(new Date(metrics.nextAppointment.fecha))}
                            </span>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {metrics.nextAppointment.nombre_cliente}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {metrics.nextAppointment.servicio}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
