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

export const DailyMetricsBar: React.FC<DailyMetricsBarProps> = ({
    appointments,
    allAppointments = [],
    selectedDate,
    staff,
    businessHours,
    closedDays = []
}) => {
    const { formatMoney, moneda } = useCurrency();

    const isSameDay = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const formatTime = (date: Date) =>
        date.toLocaleTimeString('es-PE', { hour: 'numeric', minute: '2-digit', hour12: true });

    const metrics = useMemo(() => {
        const dayAppointments = appointments.filter(apt => {
            if (!apt.fecha) return false;
            const aptDate = new Date(apt.fecha);
            return !isNaN(aptDate.getTime()) && isSameDay(aptDate, selectedDate);
        });
        const activeAppointments = dayAppointments.filter(
            a => a.estado !== 'Cancelada' && a.estado !== 'No-Show'
        );
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
        const bookedMinutes = activeAppointments.reduce(
            (sum, apt) => sum + ((apt as any).duracion_min || 60), 0
        );
        const utilizationRate = totalCapacityMinutes > 0
            ? Math.min(100, Math.round((bookedMinutes / totalCapacityMinutes) * 100))
            : 0;

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

    // Formatear ingresos de forma compacta
    const revenueStr = metrics.revenue > 9999
        ? `${moneda}${(metrics.revenue / 1000).toFixed(1)}k`
        : metrics.revenue > 0
            ? formatMoney(metrics.revenue)
            : `${moneda} 0`;

    const occupancyColor =
        metrics.utilizationRate > 80 ? '#f97316' :
            metrics.utilizationRate > 50 ? '#10b981' :
                '#8b5cf6';

    return (
        <div className="flex flex-col gap-2">
            {/* ── 3 KPIs en fila — colores amigables con light/dark mode ─────── */}
            <div className="grid grid-cols-3 gap-2">

                {/* Citas */}
                <div className="flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 text-center bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                    <span className="text-2xl font-black leading-none tabular-nums text-indigo-600 dark:text-indigo-400">
                        {metrics.total}
                    </span>
                    <span className="text-[10px] font-bold mt-0.5 text-indigo-500 dark:text-indigo-300">
                        Citas
                    </span>
                </div>

                {/* Ingresos */}
                <div className="flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 text-center bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <span className="text-[13px] sm:text-base font-black leading-none tabular-nums tracking-tight truncate w-full text-emerald-600 dark:text-emerald-400">
                        {revenueStr}
                    </span>
                    <span className="text-[10px] font-bold mt-0.5 text-emerald-500 dark:text-emerald-300">
                        Venta
                    </span>
                </div>

                {/* Ocupación */}
                <div className="flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 text-center bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20">
                    <span className={`text-2xl font-black leading-none tabular-nums ${metrics.utilizationRate > 80 ? 'text-orange-600 dark:text-orange-400' : metrics.utilizationRate > 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`}>
                        {metrics.utilizationRate}%
                    </span>
                    <span className="text-[10px] font-bold mt-0.5 text-violet-500 dark:text-violet-300">
                        Ocup.
                    </span>
                </div>
            </div>

            {/* ── Próxima cita ─────────────────────────────────────────── */}
            {metrics.nextAppointment && (
                <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <div className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-amber-500" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide shrink-0 text-amber-700 dark:text-amber-400">
                        Próxima
                    </span>
                    <span className="text-sm font-bold whitespace-nowrap shrink-0 text-gray-900 dark:text-white">
                        {formatTime(new Date(metrics.nextAppointment.fecha))}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 shrink-0">·</span>
                    <span className="text-sm font-semibold truncate min-w-0 text-gray-700 dark:text-gray-200">
                        {metrics.nextAppointment.nombre_cliente}
                    </span>
                </div>
            )}
        </div>
    );
};
