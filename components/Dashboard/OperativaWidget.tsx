/**
 * OperativaWidget
 * 
 * Muestra métricas operativas del día.
 * Ahora consume datos del DashboardDataContext centralizado.
 */

import React from 'react';
import { Calendar, Scissors, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';

const OperativaWidget: React.FC = () => {
    const { appointments, isLoading } = useDashboardData();

    // Get today's date string
    const today = new Date().toISOString().split('T')[0];

    // Filter today's appointments from unified data
    const todayAppointments = (appointments || []).filter(cita => {
        if (!cita.fecha) return false;
        const citaDate = cita.fecha.split('T')[0];
        return citaDate === today;
    });

    const appointmentStats = {
        total: todayAppointments.length,
        confirmed: todayAppointments.filter(apt =>
            apt.estado === 'Confirmada' || apt.estado === 'confirmada'
        ).length,
        pending: todayAppointments.filter(apt =>
            apt.estado === 'Pendiente' || apt.estado === 'pendiente'
        ).length,
        completed: todayAppointments.filter(apt =>
            apt.estado === 'Completada' || apt.estado === 'completada'
        ).length,
    };

    // Top 3 servicios más populares (from all appointments, not just today)
    const serviceCount: Record<string, number> = {};
    (appointments || []).forEach(apt => {
        if (apt.servicio) {
            serviceCount[apt.servicio] = (serviceCount[apt.servicio] || 0) + 1;
        }
    });

    const topServices = Object.entries(serviceCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }));

    // Porcentaje de ocupación (suponiendo 8 horas laborables, 1 hora por cita)
    const occupancyRate = Math.min((appointmentStats.total / 8) * 100, 100);

    if (isLoading && !appointments) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Operativa del Día</h3>
            </div>

            {/* Stats Grid: 2 col mobile, 4 desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {appointmentStats.total}
                    </span>
                    <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Total</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        {appointmentStats.confirmed}
                    </span>
                    <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Confirm.</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {appointmentStats.pending}
                    </span>
                    <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Pend.</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {appointmentStats.completed}
                    </span>
                    <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70">Compl.</p>
                </div>
            </div>

            {/* Occupancy Bar */}
            <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Ocupación del día
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {occupancyRate.toFixed(0)}%
                    </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${occupancyRate >= 80 ? 'bg-green-500' :
                            occupancyRate >= 50 ? 'bg-blue-500' :
                                'bg-amber-500'
                            }`}
                        style={{ width: `${occupancyRate}%` }}
                    />
                </div>
            </div>

            {/* Top Services */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                    <Scissors className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Servicios Populares
                    </span>
                </div>
                <div className="space-y-2">
                    {topServices.length > 0 ? (
                        topServices.map((service, idx) => (
                            <div
                                key={service.name}
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                        idx === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                                            'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                        }`}>
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                                        {service.name}
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                    {service.count} citas
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                            No hay datos de servicios
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OperativaWidget;
