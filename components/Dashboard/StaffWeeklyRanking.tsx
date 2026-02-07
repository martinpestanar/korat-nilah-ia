/**
 * StaffWeeklyRanking - Widget Completo de Inteligencia de Staff
 * 
 * Vista principal: Por STAFF (Manos, Pies, Pestañas, Rostro, Cabello)
 * Vista secundaria: Por EMPLEADO individual
 * 
 * Esto permite a salones pequeños (1 persona por área) y grandes (múltiples) 
 * tener métricas relevantes.
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
    Trophy, TrendingUp, TrendingDown, Users, Calendar, DollarSign,
    Target, Crown, ChevronRight, ChevronDown, Minus, BarChart3, User
} from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { equipo } from '../../services/api';

// Colores por posición
const POSITION_COLORS = {
    1: { bg: 'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-600' },
    2: { bg: 'bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-800 dark:to-slate-800', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-600' },
    3: { bg: 'bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-600' }
};

// Labels y colores por staff/categoría
const STAFF_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    manos: { label: 'Manos', emoji: '💅', color: '#ec4899' },
    pies: { label: 'Pies', emoji: '🦶', color: '#f97316' },
    pestanas: { label: 'Pestañas', emoji: '👁️', color: '#8b5cf6' },
    rostro: { label: 'Rostro', emoji: '💆', color: '#10b981' },
    cabello: { label: 'Cabello', emoji: '💇', color: '#3b82f6' },
    multi: { label: 'Varios', emoji: '✨', color: '#6366f1' }
};

interface StaffMember {
    id: number;
    nombre: string;
    especialidad?: string;
    cat_staff?: string;  // Primary category field from database
    sub_especialidad?: string;
    color?: string;
    activo?: boolean;
}

interface StaffAreaRanking {
    categoria: string;
    label: string;
    emoji: string;
    color: string;
    citasSemana: number;
    ingresosSemana: number;
    clientesAtendidos: number;
    ticketPromedio: number;
    citasSemanaAnterior: number;
    ingresosSemanaAnterior: number;
    tendenciaIngresos: number;
    tendenciaCitas: number;
    empleados: EmployeeRanking[];
    metaCumplida: boolean;
    debugCitas?: any[];
    desglose?: {
        completadas: number;
        pendientes: number;
    };
}

interface EmployeeRanking {
    id: number;
    nombre: string;
    citasSemana: number;
    ingresosSemana: number;
    ticketPromedio: number;
    citasSemanaAnterior: number;
    ingresosSemanaAnterior: number;
    tendenciaIngresos: number;
    tendenciaCitas: number;
    desglose?: {
        completadas: number;
        pendientes: number;
    };
    debugCitas?: any[];
}

const META_SEMANAL = 2000;

const StaffWeeklyRanking: React.FC = () => {
    const { appointments, staff: contextStaff, isLoading: dashboardLoading } = useDashboardData();
    const [rankingType, setRankingType] = useState<'ingresos' | 'citas' | 'ticket'>('ingresos');
    const [viewMode, setViewMode] = useState<'staff' | 'empleados'>('staff');
    const [expandedArea, setExpandedArea] = useState<string | null>(null);
    const [selectedDebugData, setSelectedDebugData] = useState<{ title: string, data: any[] } | null>(null);

    // Render Goal Progress Bar
    const renderGoalProgress = (current: number, target: number = META_SEMANAL) => {
        const percent = Math.min(100, Math.max(0, (current / target) * 100));
        return (
            <div className="mt-1 w-full max-w-[120px]">
                <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                    <span>Meta: {percent.toFixed(0)}%</span>
                    <span>S/{target / 1000}k</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </div>
        );
    };


    // Use staff from context
    const staffList = useMemo(() => {
        if (!contextStaff) return [];
        return contextStaff.filter((s: any) => s.activo !== false);
    }, [contextStaff]);

    // ... (keep date logic identical)
    const weekRanges = useMemo(() => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfWeek.getDate() - 7);
        const endOfLastWeek = new Date(endOfWeek);
        endOfLastWeek.setDate(endOfWeek.getDate() - 7);
        return {
            current: { start: startOfWeek, end: endOfWeek },
            previous: { start: startOfLastWeek, end: endOfLastWeek }
        };
    }, []);

    // Helper para normalizar
    const normalize = (str?: string) => str ? str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';

    // Calcular ranking
    const staffAreaRankings = useMemo<StaffAreaRanking[]>(() => {
        const citas = appointments || [];

        // 1. Obtener categorías ÚNICAS normalizadas
        const categoriasMap = new Map<string, string>(); // key: normalized("manos"), value: "Manos"

        // De citas
        citas.forEach((c: any) => {
            if (c.categoria) {
                const key = normalize(c.categoria);
                if (!categoriasMap.has(key)) categoriasMap.set(key, c.categoria);
            }
        });
        // De staff (cat_staff priority, then especialidad)
        staffList.forEach(s => {
            const cat = s.cat_staff || s.especialidad;
            if (cat) {
                const key = normalize(cat);
                if (!categoriasMap.has(key)) categoriasMap.set(key, cat);
            }
        });

        const uniqueCategories = Array.from(categoriasMap.keys());
        if (uniqueCategories.length === 0) return [];

        const rankings: StaffAreaRanking[] = [];

        uniqueCategories.forEach(catKey => {
            // Label bonito (ej: 'Manos')
            const displayLabel = categoriasMap.get(catKey) || catKey;

            // Config visual (match con STAFF_CONFIG keys: 'manos', 'pies'...)
            const configKey = Object.keys(STAFF_CONFIG).find(k => normalize(k) === catKey) || 'multi';
            const config = STAFF_CONFIG[configKey] || STAFF_CONFIG.multi;

            // Helper para filtrar citas por semana y categoría
            const getCitasForWeek = (start: Date, end: Date) => {
                return citas.filter((apt: any) => {
                    const aptDate = new Date(apt.fecha);
                    const isInRange = aptDate >= start && aptDate <= end;
                    if (!isInRange) return false;
                    return normalize(apt.categoria) === catKey;
                });
            };

            // Citas de esta semana
            const citasThisWeek = getCitasForWeek(weekRanges.current.start, weekRanges.current.end);
            const completadasThisWeek = citasThisWeek.filter((apt: any) => {
                const s = normalize(apt.estado);
                return s === 'completada' || s === 'pendiente' || s === 'confirmada';
            });
            const ingresosThisWeek = completadasThisWeek.reduce((sum: number, apt: any) =>
                sum + (Number(apt.precio) || 0), 0);

            // Citas semana anterior
            const citasLastWeek = getCitasForWeek(weekRanges.previous.start, weekRanges.previous.end);
            const completadasLastWeek = citasLastWeek.filter((apt: any) => {
                const s = normalize(apt.estado);
                return s === 'completada' || s === 'pendiente' || s === 'confirmada';
            });
            const ingresosLastWeek = completadasLastWeek.reduce((sum: number, apt: any) =>
                sum + (Number(apt.precio) || 0), 0);

            // Clientes únicos
            const clientesUnicos = new Set(
                completadasThisWeek.map((apt: any) => apt.cliente_id).filter(Boolean)
            ).size;

            const ticketPromedio = completadasThisWeek.length > 0
                ? ingresosThisWeek / completadasThisWeek.length : 0;

            const ticketPromedioLastWeek = completadasLastWeek.length > 0
                ? ingresosLastWeek / completadasLastWeek.length : 0;

            // Tendencias
            const tendenciaIngresos = ingresosLastWeek > 0
                ? ((ingresosThisWeek - ingresosLastWeek) / ingresosLastWeek) * 100
                : ingresosThisWeek > 0 ? 100 : 0;
            const tendenciaCitas = completadasLastWeek.length > 0
                ? ((completadasThisWeek.length - completadasLastWeek.length) / completadasLastWeek.length) * 100
                : completadasThisWeek.length > 0 ? 100 : 0;

            // Empleados de esta área
            const empleadosDeArea = staffList.filter(s =>
                normalize(s.cat_staff) === catKey || normalize(s.especialidad) === catKey
            );

            const empleadosRanking: EmployeeRanking[] = empleadosDeArea.map(emp => {
                // Filtrar citas de ESTE empleado usando staff_id (CRITICO)
                const empCitas = completadasThisWeek.filter((apt: any) => {
                    if (apt.staff_id !== undefined && emp.id !== undefined) {
                        return Number(apt.staff_id) === Number(emp.id);
                    }
                    return false;
                });

                const empIngresos = empCitas.reduce((sum: number, apt: any) => sum + (Number(apt.precio) || 0), 0);

                const empBreakdown = {
                    completadas: empCitas.filter((c: any) => normalize(c.estado) === 'completada').length,
                    pendientes: empCitas.filter((c: any) => normalize(c.estado) === 'pendiente' || normalize(c.estado) === 'confirmada').length
                };

                return {
                    id: emp.id,
                    nombre: emp.nombre,
                    citasSemana: empCitas.length,
                    ingresosSemana: empIngresos,
                    ticketPromedio: empCitas.length > 0 ? empIngresos / empCitas.length : 0,
                    citasSemanaAnterior: 0,
                    ingresosSemanaAnterior: 0,
                    tendenciaIngresos: 0,
                    tendenciaCitas: 0,
                    desglose: empBreakdown,
                    debugCitas: empCitas
                };
            }).sort((a, b) => b.ingresosSemana - a.ingresosSemana);

            // Desglose de contadores
            const breakdown = {
                completadas: completadasThisWeek.filter((c: any) => normalize(c.estado) === 'completada').length,
                pendientes: completadasThisWeek.filter((c: any) => normalize(c.estado) === 'pendiente' || normalize(c.estado) === 'confirmada').length
            };

            rankings.push({
                categoria: catKey,
                label: displayLabel,
                emoji: config.emoji,
                color: config.color,
                citasSemana: completadasThisWeek.length,
                ingresosSemana: ingresosThisWeek,
                clientesAtendidos: clientesUnicos,
                ticketPromedio,
                citasSemanaAnterior: completadasLastWeek.length,
                ingresosSemanaAnterior: ingresosLastWeek,
                tendenciaIngresos,
                tendenciaCitas,
                empleados: empleadosRanking,
                metaCumplida: ingresosThisWeek >= META_SEMANAL,
                debugCitas: completadasThisWeek,
                desglose: breakdown
            });
        });

        // Ordenar global
        const sortKey = rankingType === 'ingresos' ? 'ingresosSemana'
            : rankingType === 'citas' ? 'citasSemana' : 'ticketPromedio';
        rankings.sort((a, b) => b[sortKey] - a[sortKey]);

        return rankings;
    }, [appointments, staffList, weekRanges, rankingType]);

    // Totales de la semana (Updated for Contextual Ticket)
    const weekTotals = useMemo(() => {
        const citas = staffAreaRankings.reduce((sum, s) => sum + s.citasSemana, 0);
        const ingresos = staffAreaRankings.reduce((sum, s) => sum + s.ingresosSemana, 0);
        const citasAnterior = staffAreaRankings.reduce((sum, s) => sum + s.citasSemanaAnterior, 0);
        const ingresosAnterior = staffAreaRankings.reduce((sum, s) => sum + s.ingresosSemanaAnterior, 0);

        const ticketCurrent = citas > 0 ? ingresos / citas : 0;
        const ticketPrevious = citasAnterior > 0 ? ingresosAnterior / citasAnterior : 0;

        return {
            citas,
            ingresos,
            ticketPromedio: ticketCurrent,
            ticketDifference: ticketCurrent - ticketPrevious, // New field for "S/ 10 menos"
            tendenciaIngresos: ingresosAnterior > 0 ? ((ingresos - ingresosAnterior) / ingresosAnterior) * 100 : 0,
            tendenciaCitas: citasAnterior > 0 ? ((citas - citasAnterior) / citasAnterior) * 100 : 0,
            areasConMeta: staffAreaRankings.filter(s => s.metaCumplida).length
        };
    }, [staffAreaRankings]);




    const isLoading = dashboardLoading;

    // Render tendencia
    const renderTendencia = (valor: number, size: 'sm' | 'md' = 'sm') => {
        const iconSize = size === 'sm' ? 12 : 16;
        if (valor > 0) {
            return (
                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={iconSize} />
                    <span className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>{valor.toFixed(0)}%</span>
                </span>
            );
        } else if (valor < 0) {
            return (
                <span className="inline-flex items-center gap-0.5 text-rose-500 dark:text-rose-400">
                    <TrendingDown size={iconSize} />
                    <span className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>{Math.abs(valor).toFixed(0)}%</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-0.5 text-gray-400">
                <Minus size={iconSize} />
            </span>
        );
    };

    // Loading
    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    // Empty state
    if (staffAreaRankings.length === 0) {
        return (
            <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sin datos de staff</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Asegúrate de que las citas tengan categoría asignada
                </p>
            </div>
        );
    }

    const weekLabel = `${weekRanges.current.start.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} - ${weekRanges.current.end.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}`;

    return (
        <div>
            {/* Modal de Verificación */}
            {selectedDebugData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ margin: 0 }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Detalle: {selectedDebugData.title}</h3>
                                <p className="text-xs text-gray-500">{selectedDebugData.data.length} citas registradas</p>
                            </div>
                            <button
                                onClick={() => setSelectedDebugData(null)}
                                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-2.5">
                            {selectedDebugData.data.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-4">No hay citas para mostrar</p>
                            ) : (
                                selectedDebugData.data
                                    .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                    .map((cita: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700/50 hover:border-blue-200 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-10 rounded-full ${normalize(cita.estado) === 'completada' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                <div>
                                                    <p className="font-medium text-sm text-gray-900 dark:text-gray-200">
                                                        {new Date(cita.fecha).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })} - {cita.servicio || 'Servicio'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {cita.cliente_nombre || 'Cliente'} &bull; <span className="capitalize">{cita.estado}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                S/ {Number(cita.precio).toFixed(2)}
                                            </p>
                                        </div>
                                    ))
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-center">
                            <p className="text-[10px] text-gray-400">Total calculado: S/ {selectedDebugData.data.reduce((sum: number, c: any) => sum + (Number(c.precio) || 0), 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20">
                        <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Inteligencia de Staff</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Calendar size={12} /> {weekLabel}
                        </p>
                    </div>
                </div>

                {/* Toggle vista: Staff vs Empleados */}
                <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('staff')}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${viewMode === 'staff'
                            ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        💅 Por Staff
                    </button>
                    <button
                        onClick={() => setViewMode('empleados')}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${viewMode === 'empleados'
                            ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        👤 Por Empleado
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-3 border border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center justify-between mb-1">
                        <DollarSign size={16} className="text-emerald-500" />
                        {renderTendencia(weekTotals.tendenciaIngresos)}
                    </div>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        S/ {weekTotals.ingresos.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Ingresos Totales</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-1">
                        <Calendar size={16} className="text-blue-500" />
                        {renderTendencia(weekTotals.tendenciaCitas)}
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{weekTotals.citas}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Citas Completadas</p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-3 border border-purple-100 dark:border-purple-800">
                    <Target size={16} className="text-purple-500 mb-1" />
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        S/ {weekTotals.ticketPromedio.toFixed(0)}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[10px] text-gray-500">Ticket Promedio</p>
                        {Math.abs(weekTotals.ticketDifference) > 0 && (
                            <span className={`text-[9px] font-medium px-1 rounded ${weekTotals.ticketDifference > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                                {weekTotals.ticketDifference > 0 ? '▲' : '▼'} S/{Math.abs(weekTotals.ticketDifference).toFixed(0)}
                            </span>
                        )}
                    </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 p-3 border border-amber-100 dark:border-amber-800">
                    <Trophy size={16} className="text-amber-500 mb-1" />
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                        {weekTotals.areasConMeta}/{staffAreaRankings.length}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Áreas con Meta</p>
                </div>
            </div>

            {/* Ranking Toggle */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">Ordenar por:</p>
                <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
                    {(['ingresos', 'citas', 'ticket'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setRankingType(type)}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${rankingType === type
                                ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-white'
                                : 'text-gray-500'}`}
                        >
                            {type === 'ingresos' ? '💰' : type === 'citas' ? '📅' : '🎯'} {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* VISTA POR STAFF */}
            {viewMode === 'staff' && (
                <div className="space-y-2">
                    {staffAreaRankings.map((area, idx) => {
                        const position = idx + 1;
                        const positionStyle = POSITION_COLORS[position as 1 | 2 | 3] || { bg: 'bg-gray-50 dark:bg-white/5', text: 'text-gray-400', border: 'border-gray-200 dark:border-white/10' };
                        const isExpanded = expandedArea === area.categoria;

                        return (
                            <div
                                key={area.categoria}
                                className={`relative rounded-xl border transition-all ${positionStyle.border} ${positionStyle.bg} overflow-hidden`}
                            >
                                <div
                                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                                    onClick={() => setExpandedArea(isExpanded ? null : area.categoria)}
                                >
                                    {/* Position */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${positionStyle.text}`}>
                                        {position === 1 ? <Crown className="h-5 w-5" /> : position}
                                    </div>

                                    {/* Icon */}
                                    <div
                                        className="h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-md"
                                        style={{ backgroundColor: area.color + '20', border: `2px solid ${area.color}` }}
                                    >
                                        {area.emoji}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className="font-semibold text-gray-900 dark:text-white cursor-help"
                                                title={`Categoría detectada por:\n${area.empleados.length > 0 ? `Staff: ${area.empleados.map(e => e.nombre).join(', ')}` : 'Citas'}`}
                                            >
                                                {area.label}
                                            </p>
                                            {area.metaCumplida && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 font-medium">
                                                    ✓ Meta
                                                </span>
                                            )}
                                            {area.empleados.length > 0 && (
                                                <span className="text-[10px] text-gray-400">
                                                    ({area.empleados.length} empleado{area.empleados.length !== 1 ? 's' : ''})
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        {renderGoalProgress(area.ingresosSemana)}

                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <span
                                                className="cursor-pointer text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border-b border-dotted border-gray-400 w-fit font-medium"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDebugData({ title: area.label, data: area.debugCitas || [] });
                                                }}
                                            >
                                                {area.citasSemana} citas totales
                                            </span>

                                            {/* Desglose visual */}

                                            {/* Desglose visual */}
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                {area.desglose && (area.desglose.completadas > 0 || area.desglose.pendientes > 0) ? (
                                                    <>
                                                        {area.desglose.completadas > 0 && (
                                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                {area.desglose.completadas} Realizadas
                                                            </span>
                                                        )}
                                                        {area.desglose.pendientes > 0 && (
                                                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                {area.desglose.pendientes} Futuras
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span>Sin actividad</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metric */}
                                    <div className="text-right shrink-0">
                                        <div className="flex items-center justify-end gap-2">
                                            <p className={`font-bold ${rankingType === 'ingresos' ? 'text-emerald-600' : rankingType === 'citas' ? 'text-blue-600' : 'text-purple-600'}`}>
                                                {rankingType === 'ingresos' && `S/ ${area.ingresosSemana.toLocaleString()}`}
                                                {rankingType === 'citas' && `${area.citasSemana}`}
                                                {rankingType === 'ticket' && `S/ ${area.ticketPromedio.toFixed(0)}`}
                                            </p>
                                            {renderTendencia(rankingType === 'ingresos' ? area.tendenciaIngresos : area.tendenciaCitas)}
                                        </div>
                                    </div>

                                    <div className="text-gray-400">
                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                </div>

                                {/* Expanded: Empleados de esta área */}
                                {isExpanded && area.empleados.length > 0 && (
                                    <div className="px-3 pb-3 pt-0 border-t border-white/50 dark:border-white/10">
                                        <p className="text-xs text-gray-500 mt-2 mb-2 font-medium">Empleados en {area.label}:</p>
                                        <div className="space-y-1">
                                            {area.empleados.map(emp => (
                                                <div key={emp.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/50 dark:bg-white/5">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{emp.nombre}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{emp.citasSemana} citas</span>
                                                        <span className="font-medium text-emerald-600">S/ {emp.ingresosSemana.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {position === 1 && area.ingresosSemana > 0 && (
                                    <div className="absolute -top-2 -right-2 text-xl">🔥</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* VISTA POR EMPLEADOS */}
            {viewMode === 'empleados' && (
                <div className="space-y-2">
                    {staffList
                        .map(emp => {
                            const empCat = normalize(emp.cat_staff || emp.especialidad);
                            const area = staffAreaRankings.find(a => a.categoria === empCat);
                            const empData = area?.empleados.find(e => e.id === emp.id);
                            return {
                                ...emp,
                                citasSemana: empData?.citasSemana || 0,
                                ingresosSemana: empData?.ingresosSemana || 0,
                                ticketPromedio: empData?.ticketPromedio || 0,
                                areaLabel: area?.label || 'Sin área',
                                areaEmoji: area?.emoji || '✨',
                                color: area?.color || '#6366f1',
                                desglose: empData?.desglose,
                                debugCitas: empData?.debugCitas
                            };
                        })
                        .sort((a, b) => b.ingresosSemana - a.ingresosSemana)
                        .map((emp, idx) => {
                            const position = idx + 1;
                            const positionStyle = POSITION_COLORS[position as 1 | 2 | 3] || { bg: 'bg-gray-50 dark:bg-white/5', text: 'text-gray-400', border: 'border-gray-200 dark:border-white/10' };

                            return (
                                <div
                                    key={emp.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border ${positionStyle.border} ${positionStyle.bg}`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${positionStyle.text}`}>
                                        {position}
                                    </div>
                                    <div
                                        className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow"
                                        style={{ backgroundColor: emp.color }}
                                    >
                                        {emp.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {emp.nombre}
                                            </p>
                                            <span
                                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"
                                                style={{ backgroundColor: emp.color + '20', color: emp.color }}
                                            >
                                                {emp.areaEmoji} {emp.areaLabel}
                                            </span>
                                        </div>

                                        {/* Progress Bar (using 25% of area goal for individual roughly, or just pass generic) */}
                                        {/* For employees, let's assume goal is roughly spread, but for now showing global goal might be discouraged. 
                                        Let's just use the same renderGoalProgress but maybe with a smaller goal or just consistent 2k? 
                                        User said "debajo del nombre de cada staff". Let's stick to Area Goal for now or maybe 1000? 
                                        Actually let's use the same META_SEMANAL/2 for individuals as a rough estimate or just keep it consistent.
                                        Let's use 1000 for individual goal as a reasonable default if area is 2000.
                                    */}
                                        {renderGoalProgress(emp.ingresosSemana, META_SEMANAL / 2)}

                                        <div className="flex flex-col gap-0.5 mt-1">
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span
                                                    className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors border-b border-dotted border-gray-400 font-medium"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDebugData({ title: emp.nombre, data: emp.debugCitas || [] });
                                                    }}
                                                >
                                                    {emp.citasSemana} citas totales
                                                </span>
                                            </div>

                                            {/* Desglose visual */}
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                {emp.desglose && (emp.desglose.completadas > 0 || emp.desglose.pendientes > 0) ? (
                                                    <>
                                                        {emp.desglose.completadas > 0 && (
                                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                {emp.desglose.completadas} Realizadas
                                                            </span>
                                                        )}
                                                        {emp.desglose.pendientes > 0 && (
                                                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                                {emp.desglose.pendientes} Futuras
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span>Sin actividad reciente</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Metric */}
                                    <div className="text-right shrink-0">
                                        <p className={`font-bold ${rankingType === 'ingresos' ? 'text-emerald-600' : rankingType === 'citas' ? 'text-blue-600' : 'text-purple-600'}`}>
                                            {rankingType === 'ingresos' && `S/ ${emp.ingresosSemana.toLocaleString()}`}
                                            {rankingType === 'citas' && `${emp.citasSemana}`}
                                            {rankingType === 'ticket' && `S/ ${emp.ticketPromedio.toFixed(0)}`}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {rankingType === 'ingresos' ? 'Ingresos' : rankingType === 'citas' ? 'Citas' : 'Ticket'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Footer */}
            {staffAreaRankings[0]?.ingresosSemana > 0 && (
                <div className="mt-4 text-center p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-100 dark:border-violet-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        🏆 <span className="font-semibold text-gray-900 dark:text-white">{staffAreaRankings[0].emoji} {staffAreaRankings[0].label}</span> lidera la semana
                        con S/ {staffAreaRankings[0].ingresosSemana.toLocaleString()}
                    </p>
                </div>
            )}
        </div>
    );
};

export default StaffWeeklyRanking;
