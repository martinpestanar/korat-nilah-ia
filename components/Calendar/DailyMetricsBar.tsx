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
            {/* ── 3 KPIs en fila — colores sólidos para dark mode ─────── */}
            <div className="grid grid-cols-3 gap-2">

                {/* Citas */}
                <div
                    className="flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 text-center"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}
                >
                    <span className="text-2xl font-black leading-none tabular-nums" style={{ color: '#818cf8' }}>
                        {metrics.total}
                    </span>
                    <span className="text-[10px] font-bold mt-0.5" style={{ color: '#a5b4fc' }}>
                        Citas
                    </span>
                </div>

                {/* Ingresos */}
                <div
                    className="flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 text-center"
                    style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                    <span className="text-[13px] sm:text-base font-black leading-none tabular-nums tracking-tight truncate w-full" style={{ color: '#34d399' }}>
                        {revenueStr}
                    </span>
                    <span className="text-[10px] font-bold mt-0.5" style={{ color: '#6ee7b7' }}>
                        Venta
                    </span>
                </div>

                {/* Ocupación */}
                <div
                    className="flex flex-col items-center justify-center rounded-2xl py-2.5 px-2 text-center"
                    style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                    <span className="text-2xl font-black leading-none tabular-nums" style={{ color: occupancyColor }}>
                        {metrics.utilizationRate}%
                    </span>
                    <span className="text-[10px] font-bold mt-0.5" style={{ color: '#c4b5fd' }}>
                        Ocup.
                    </span>
                </div>
            </div>

            {/* ── Próxima cita ─────────────────────────────────────────── */}
            {metrics.nextAppointment && (
                <div
                    className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5"
                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
                >
                    <div className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#f59e0b' }} />
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#f59e0b' }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wide shrink-0" style={{ color: '#fbbf24' }}>
                        Próxima
                    </span>
                    <span className="text-sm font-bold whitespace-nowrap shrink-0 text-white">
                        {formatTime(new Date(metrics.nextAppointment.fecha))}
                    </span>
                    <span className="text-gray-500 shrink-0">·</span>
                    <span className="text-sm font-semibold truncate min-w-0 text-gray-200">
                        {metrics.nextAppointment.nombre_cliente}
                    </span>
                </div>
            )}
        </div>
    );
};
