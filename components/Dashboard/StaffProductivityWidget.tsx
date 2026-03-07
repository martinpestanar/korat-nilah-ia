/**
 * StaffProductivityWidget
 * 
 * Widget para mostrar métricas de productividad por staff en el Dashboard.
 * Muestra citas completadas, ingresos generados y comparativa de rendimiento.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Users, TrendingUp, Trophy, DollarSign, Calendar } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';
import { equipo } from '../../services/api';

// Staff colors predefinidos
const STAFF_COLORS: Record<string, string> = {
    manos: '#ec4899',
    pies: '#f97316',
    pestanas: '#8b5cf6',
    rostro: '#10b981',
    cabello: '#3b82f6',
    multi: '#6366f1'
};

const ESPECIALIDAD_ICONS: Record<string, string> = {
    manos: '💅',
    pies: '🦶',
    pestanas: '👁️',
    rostro: '💆',
    cabello: '💇',
    multi: '🔄'
};

interface StaffMember {
    id: number;
    nombre: string;
    especialidad?: string;
    color?: string;
    activo?: boolean;
}

interface StaffMetric {
    id: number;
    nombre: string;
    especialidad: string;
    color: string;
    citasCompletadas: number;
    citasPendientes: number;
    ingresos: number;
    rating: number; // 1-5 stars
}

const StaffProductivityWidget: React.FC = () => {
    const { appointments, staff: contextStaff, isLoading: dashboardLoading } = useDashboardData();
    const { formatValue } = useCurrency();

    // Use staff from context
    const staffList = useMemo(() => {
        if (!contextStaff) return [];
        return contextStaff.filter((s: any) => s.activo !== false);
    }, [contextStaff]);

    const isLoading = dashboardLoading;

    // Calcular métricas por staff
    const staffMetrics = useMemo<StaffMetric[]>(() => {
        const citas = appointments || [];

        if (staffList.length === 0) return [];

        const metrics: StaffMetric[] = [];

        // Para cada miembro del equipo
        staffList.forEach((staff) => {
            // Filtrar citas asignadas a este staff (por nombre o staff_id)
            const staffAppointments = citas.filter((apt: any) => {
                // Buscar por staff_id o por nombre si no hay staff_id
                if (apt.staff_id && apt.staff_id === staff.id) return true;
                // Fallback: buscar por especialidad/categoría
                if (staff.especialidad && apt.categoria === staff.especialidad) return true;
                return false;
            });

            const completadas = staffAppointments.filter((apt: any) =>
                apt.estado === 'Completada' || apt.estado === 'completada'
            );
            const pendientes = staffAppointments.filter((apt: any) =>
                apt.estado === 'Pendiente' || apt.estado === 'pendiente'
            );

            const ingresos = completadas.reduce((sum: number, apt: any) =>
                sum + (Number(apt.precio) || 0), 0);

            // Rating basado en porcentaje de citas completadas vs no-shows/canceladas
            const totalWithStatus = staffAppointments.filter((apt: any) =>
                ['Completada', 'completada', 'No-Show', 'Cancelada', 'cancelada'].includes(apt.estado)
            ).length;
            const completedRatio = totalWithStatus > 0
                ? completadas.length / totalWithStatus
                : 0.8; // Default si no hay historial
            const rating = Math.min(5, Math.max(1, Math.round(completedRatio * 5)));

            metrics.push({
                id: staff.id,
                nombre: staff.nombre,
                especialidad: staff.especialidad || 'multi',
                color: staff.color || STAFF_COLORS[staff.especialidad || 'multi'] || STAFF_COLORS.multi,
                citasCompletadas: completadas.length,
                citasPendientes: pendientes.length,
                ingresos,
                rating
            });
        });

        // Ordenar por ingresos descendente
        return metrics.sort((a, b) => b.ingresos - a.ingresos);
    }, [appointments, staffList]);

    // Calcular totales
    const totals = useMemo(() => {
        return {
            citas: staffMetrics.reduce((sum, s) => sum + s.citasCompletadas, 0),
            ingresos: staffMetrics.reduce((sum, s) => sum + s.ingresos, 0),
            staffActivo: staffMetrics.filter(s => s.citasCompletadas > 0 || s.citasPendientes > 0).length
        };
    }, [staffMetrics]);

    // Loading state
    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (staffMetrics.length === 0) {
        return (
            <div className="text-center py-8">
                <Users className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    No hay datos de equipo disponibles
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Agrega miembros del equipo en Configuración → Equipo
                </p>
            </div>
        );
    }

    const topPerformer = staffMetrics[0];

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/20">
                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Productividad del Equipo</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {totals.staffActivo} de {staffMetrics.length} activos este mes
                        </p>
                    </div>
                </div>

                {/* Top Performer Badge */}
                {topPerformer && topPerformer.ingresos > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            {topPerformer.nombre.split(' ')[0]}
                        </span>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs">Citas Completadas</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{totals.citas}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-xs">Ingresos</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatValue(totals.ingresos)}
                    </p>
                </div>
            </div>

            {/* Staff Table */}
            <div className="space-y-2">
                {staffMetrics.map((staff, idx) => (
                    <div
                        key={staff.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20 transition-colors"
                    >
                        {/* Avatar con color */}
                        <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ backgroundColor: staff.color }}
                        >
                            {staff.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {staff.nombre}
                                </p>
                                {idx === 0 && staff.ingresos > 0 && (
                                    <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span>{ESPECIALIDAD_ICONS[staff.especialidad] || '🔄'}</span>
                                <span className="capitalize">{staff.especialidad}</span>
                                <span>•</span>
                                <span>{staff.citasCompletadas} citas</span>
                            </div>
                        </div>

                        {/* Rating Stars */}
                        <div className="flex items-center gap-0.5 shrink-0">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`text-xs ${star <= staff.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>

                        {/* Ingresos */}
                        <div className="text-right shrink-0 min-w-[80px]">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {formatValue(staff.ingresos)}
                            </p>
                            {staff.citasPendientes > 0 && (
                                <p className="text-xs text-gray-400">
                                    +{staff.citasPendientes} pendientes
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Trend indicator */}
            {totals.ingresos > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Datos del período actual</span>
                </div>
            )}
        </div>
    );
};

export default StaffProductivityWidget;
