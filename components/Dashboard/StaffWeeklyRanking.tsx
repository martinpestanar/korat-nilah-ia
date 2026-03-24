import React, { useMemo, useState } from 'react';
import {
    TrendingUp, TrendingDown, Calendar, DollarSign,
    Target, Crown, ChevronRight, ChevronDown, Minus, Info, X, Flame, ShieldAlert
} from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

// Configuración de Staff (Colores estilo iOS, vibrantes y suaves)
const STAFF_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
    manos: { label: 'Manos', emoji: '💅', color: '#ec4899', bg: 'bg-pink-500/10' },
    pies: { label: 'Pies', emoji: '🦶', color: '#f97316', bg: 'bg-orange-500/10' },
    pestanas: { label: 'Pestañas', emoji: '👁️', color: '#8b5cf6', bg: 'bg-violet-500/10' },
    rostro: { label: 'Rostro', emoji: '💆', color: '#10b981', bg: 'bg-emerald-500/10' },
    cabello: { label: 'Cabello', emoji: '💇', color: '#3b82f6', bg: 'bg-blue-500/10' },
    multi: { label: 'Varios', emoji: '✨', color: '#6366f1', bg: 'bg-indigo-500/10' }
};

interface RankingData {
    id: string | number;
    nombre: string;
    esGrupo: boolean;
    categoria: string;
    emoji: string;
    color: string;
    bgClass: string;
    citasCompletadas: number;
    citasProyectadas: number; // Pendientes/Confirmadas esta semana
    citasCanceladas: number;
    ingresosReales: number; // Solo de citas completadas
    ingresosProyectados: number; // Solo de pendientes/confirmadas
    ticketPromedio: number;
    tasaCancelacion: number;
    tendenciaIngresos: number;
    empleados?: RankingData[]; // Si es un grupo de área
    debugCitas?: any[];
}

const StaffWeeklyRanking: React.FC = () => {
    const { appointments, staff: contextStaff, services, isLoading } = useDashboardData();
    const { formatValue } = useCurrency();
    const [viewMode, setViewMode] = useState<'staff' | 'empleados'>('empleados');
    const [expandedArea, setExpandedArea] = useState<string | null>(null);
    const [selectedDebugData, setSelectedDebugData] = useState<{ title: string, data: any[] } | null>(null);

    // Helpers
    const normalize = (str?: string) => str ? str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
    const getWeekRange = () => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    // Procesamiento BI Avanzado
    const rankings = useMemo(() => {
        const citas = appointments || [];
        const staffList = (contextStaff || []).filter((s: any) => s.activo !== false);
        const servicesList = services || [];
        const { start, end } = getWeekRange();

        // Pre-construir un mapa de nombre_servicio -> categoria desde la tabla servicios
        // Esta es la FUENTE DE VERDAD (dinamica y multitenant-safe)
        const serviciosCatMap = new Map<string, string>();
        servicesList.forEach((svc: any) => {
            if (svc.nombre && svc.categoria) {
                serviciosCatMap.set(normalize(svc.nombre), normalize(svc.categoria));
            }
        });

        const normCat = (dbCat: string) => {
            const c = normalize(dbCat);
            if (c.includes('pesta')) return 'pestanas';
            if (c.includes('mano') || c.includes('esmalt') || c.includes('nail')) return 'manos';
            if (c.includes('pie') || c.includes('pedi')) return 'pies';
            if (c.includes('rostro') || c.includes('facial') || c.includes('ceja') || c.includes('depil')) return 'rostro';
            if (c.includes('cabello') || c.includes('cabel')) return 'cabello';
            return 'multi';
        };

        // Citas de esta semana
        const citasThisWeek = citas.filter((apt: any) => {
            const dateStr = apt.fecha_hora || apt.fecha;
            if (!dateStr) return false;
            const d = new Date(dateStr);
            return d >= start && d <= end;
        });

        // Helper para categorizar una cita:
        // PRIORIDAD 1: Buscar el nombre del servicio exacto en la tabla servicios (fuente de verdad)
        // PRIORIDAD 2: Keyword matching sobre el nombre del servicio (fallback)
        const getServiceCategory = (c: any) => {
            const servicioKey = normalize(c.servicio || '');

            // Busqueda exacta en tabla servicios
            if (serviciosCatMap.has(servicioKey)) {
                return normCat(serviciosCatMap.get(servicioKey)!);
            }

            // Busqueda parcial en tabla servicios (cobertura de typos o nombres cortos)
            for (const [key, cat] of serviciosCatMap.entries()) {
                if (servicioKey.length > 4 && key.includes(servicioKey.substring(0, Math.min(10, servicioKey.length)))) {
                    return normCat(cat);
                }
            }

            // Fallback: keyword matching sobre el nombre del servicio
            if (servicioKey.includes('pesta') || servicioKey.includes('lifting') || servicioKey.includes('extension') || servicioKey.includes('volumen')) return 'pestanas';
            if (servicioKey.includes('mano') || servicioKey.includes('manicur') || servicioKey.includes('acril') || servicioKey.includes('esmalte') || servicioKey.includes('semiperma') || servicioKey.includes('nail')) return 'manos';
            if (servicioKey.includes('pie') || servicioKey.includes('pedi')) return 'pies';
            if (servicioKey.includes('cejas') || servicioKey.includes('facial') || servicioKey.includes('depilacion') || servicioKey.includes('rostro') || servicioKey.includes('perfilado')) return 'rostro';
            if (servicioKey.includes('cabello') || servicioKey.includes('tinte') || servicioKey.includes('corte') || servicioKey.includes('capilar')) return 'cabello';
            return 'multi';
        };

        // Helper para normalizar estado (compatible con 'cancelado', 'cancelada', 'Cancelada', 'Cancelado')
        const normalizeEstado = (estado: string) => {
            const s = normalize(estado);
            if (s.startsWith('cancelad') || s === 'no-show' || s === 'noshow') return 'cancelada';
            if (s.startsWith('complet')) return 'completada';
            if (s.startsWith('pendient') || s.startsWith('confirm') || s.startsWith('reprogramad')) return 'pendiente';
            return s;
        };

        // 1. Calcular por empleado primero (Vista Global del Empleado)
        const empleadosRank: RankingData[] = staffList.map(emp => {
            const empCat = normalize(emp.cat_staff || emp.especialidad || 'multi');
            const configKey = Object.keys(STAFF_CONFIG).find(k => empCat.includes(k)) || 'multi';
            const config = STAFF_CONFIG[configKey] || STAFF_CONFIG.multi;

            // Todas las citas del empleado
            const empCitas = citasThisWeek.filter((c: any) => c.staff_id === emp.id || c.staff_id === String(emp.id));

            let reales = 0, proyectados = 0, completadas = 0, proyectadas = 0, canceladas = 0;

            empCitas.forEach((c: any) => {
                const s = normalizeEstado(c.estado);
                const p = Number(c.precio) || 0;
                if (s === 'completada') {
                    reales += p;
                    completadas++;
                } else if (s === 'pendiente') {
                    proyectados += p;
                    proyectadas++;
                } else if (s === 'cancelada') {
                    canceladas++;
                }
            });

            const totalAgendadas = completadas + proyectadas + canceladas;
            const tasaCancelacion = totalAgendadas > 0 ? (canceladas / totalAgendadas) * 100 : 0;
            const ticket = completadas > 0 ? reales / completadas : 0;

            return {
                id: emp.id,
                nombre: emp.nombre,
                esGrupo: false,
                categoria: empCat,
                emoji: config.emoji,
                color: config.color,
                bgClass: config.bg,
                citasCompletadas: completadas,
                citasProyectadas: proyectadas,
                citasCanceladas: canceladas,
                ingresosReales: reales,
                ingresosProyectados: proyectados,
                ticketPromedio: ticket,
                tasaCancelacion: tasaCancelacion,
                tendenciaIngresos: 0,
                debugCitas: empCitas
            };
        });

        // 2. Agrupar por ÁREAS basándose en el servicio de la cita (no solo en la categoría del staff)
        const areasMap = new Map<string, RankingData>();

        // Inicializar áreas
        Object.keys(STAFF_CONFIG).forEach(key => {
            const config = STAFF_CONFIG[key];
            areasMap.set(key, {
                id: key,
                nombre: config.label,
                esGrupo: true,
                categoria: key,
                emoji: config.emoji,
                color: config.color,
                bgClass: config.bg,
                citasCompletadas: 0, citasProyectadas: 0, citasCanceladas: 0,
                ingresosReales: 0, ingresosProyectados: 0,
                ticketPromedio: 0, tasaCancelacion: 0, tendenciaIngresos: 0,
                empleados: [],
                debugCitas: []
            });
        });

        // Mapear cada cita individual a su área correspondiente
        citasThisWeek.forEach((c: any) => {
            // Obtener el área real de la cita
            const areaKey = getServiceCategory(c);
            let area = areasMap.get(areaKey);
            if (!area) area = areasMap.get('multi')!;

            // Resolver el nombre del staff para la UI
            const staffObj = staffList.find((s: any) => c.staff_id === s.id || c.staff_id === String(s.id));
            const staffName = staffObj ? staffObj.nombre : 'Sin Asignar';

            const s = normalizeEstado(c.estado);
            const p = Number(c.precio) || 0;

            if (s === 'completada') {
                area.ingresosReales += p;
                area.citasCompletadas++;
            } else if (s === 'pendiente') {
                area.ingresosProyectados += p;
                area.citasProyectadas++;
            } else if (s === 'cancelada') {
                area.citasCanceladas++;
            }

            area.debugCitas!.push({ ...c, _resolvedStaffName: staffName });
        });

        // Recalcular promedios para las áreas y agrupar empleados
        areasMap.forEach((area) => {
            const tCitas = area.citasCompletadas + area.citasProyectadas + area.citasCanceladas;
            area.tasaCancelacion = tCitas > 0 ? (area.citasCanceladas / tCitas) * 100 : 0;
            area.ticketPromedio = area.citasCompletadas > 0 ? area.ingresosReales / area.citasCompletadas : 0;

            // Creamos mocks básicos solo para que el contador de profesionales funcione visualmente
            const staffInArea = new Set(area.debugCitas!.map(c => c._resolvedStaffName));
            area.empleados = Array.from(staffInArea).map(name => ({ nombre: name, esGrupo: false } as RankingData));
        });

        // Limpiar áreas sin citas
        let areaList = Array.from(areasMap.values()).filter(a => a.citasCompletadas > 0 || a.citasProyectadas > 0 || a.citasCanceladas > 0);
        areaList = areaList.sort((a, b) => b.ingresosReales - a.ingresosReales);

        const empList = empleadosRank.sort((a, b) => b.ingresosReales - a.ingresosReales);

        return { areaList, empList };
    }, [appointments, contextStaff]);

    // Resumen Global
    const globalTotals = useMemo(() => {
        return rankings.areaList.reduce((acc, curr) => ({
            reales: acc.reales + curr.ingresosReales,
            proyectados: acc.proyectados + curr.ingresosProyectados,
            completadas: acc.completadas + curr.citasCompletadas,
            canceladas: acc.canceladas + curr.citasCanceladas
        }), { reales: 0, proyectados: 0, completadas: 0, canceladas: 0 });
    }, [rankings]);

    if (isLoading) return <div className="animate-pulse h-64 bg-gray-100 dark:bg-gray-800 rounded-3xl" />;

    const renderCard = (data: RankingData, isFirst: boolean) => {
        // Badges inteligentes
        const isHighCancel = data.tasaCancelacion >= 25 && data.citasCompletadas > 3;
        const totalIngresoPotencial = data.ingresosReales + data.ingresosProyectados;

        // Meta Dinámica (Estimada en 20x Ticket Promedio general en la semana como ejemplo)
        const metaDinámica = Math.max(800, data.ticketPromedio * 15);
        const percentReal = Math.min(100, (data.ingresosReales / metaDinámica) * 100);
        const percentProy = Math.min(100, (totalIngresoPotencial / metaDinámica) * 100);

        return (
            <div key={data.id} className="relative rounded-2xl bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] overflow-hidden transition-all hover:scale-[1.01]">
                {/* Highlight Superior para Top 1 */}
                {isFirst && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                )}

                <div className="p-4 sm:p-5">
                    {/* Header: User / Area */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm ${data.bgClass}`} style={{ color: data.color }}>
                                {data.esGrupo ? data.emoji : (
                                    <span className="text-lg font-bold">
                                        {data.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-base md:text-lg flex items-center gap-2">
                                    {data.nombre}
                                    {isFirst && <Crown size={16} className="text-amber-500" />}
                                </h4>
                                <p className="text-xs text-gray-500 font-medium">
                                    {data.esGrupo ? `${data.empleados?.length} profesionales` : `${data.emoji} ${data.categoria}`}
                                </p>
                            </div>
                        </div>

                        {/* Top Indicator */}
                        <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white text-lg lg:text-xl whitespace-nowrap">
                                {formatValue(data.ingresosReales)}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-400 font-medium flex justify-end items-center gap-1">
                                Facturado hoy
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar (Real vs Proyectado) */}
                    <div className="mb-4">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1.5 font-medium">
                            <span>Progreso vs Meta ({formatValue(metaDinámica)})</span>
                            <span className="text-blue-500 font-semibold">{percentReal.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex relative">
                            <div className="h-full bg-emerald-500 rounded-full absolute left-0 z-20" style={{ width: `${percentReal}%`, transition: 'width 1s ease-out' }} />
                            <div className="h-full bg-blue-300 dark:bg-blue-500/50 rounded-full absolute left-0 z-10" style={{ width: `${percentProy}%`, transition: 'width 1s ease-out' }} />
                        </div>
                    </div>

                    {/* Breakdown Stats */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 dark:border-white/5">
                        <div className="flex flex-col cursor-pointer" onClick={() => setSelectedDebugData({ title: `A detalle: ${data.nombre}`, data: data.debugCitas || [] })}>
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{data.citasCompletadas} / ✨ {data.citasProyectadas}</span>
                            <span className="text-[10px] text-gray-500">Citas (Real/Proy)</span>
                        </div>

                        <div className="flex flex-col items-center border-x border-gray-100 dark:border-white/5">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatValue(data.ingresosProyectados)}</span>
                            <span className="text-[10px] text-gray-500">Por Cobrar</span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className={`text-xs font-semibold flex items-center gap-1 ${isHighCancel ? 'text-rose-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                {isHighCancel && <ShieldAlert size={10} />}
                                {data.tasaCancelacion.toFixed(0)}%
                            </span>
                            <span className="text-[10px] text-gray-500">Tasa Cancelación</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Debug Modal */}
            {selectedDebugData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-3xl rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/50 dark:border-white/10 max-h-[80vh] flex flex-col">
                        <div className="p-5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 border-b border-gray-200/50 dark:border-white/10">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedDebugData.title}</h3>
                                <p className="text-xs text-gray-500">{selectedDebugData.data.length} registros en la semana</p>
                            </div>
                            <button onClick={() => setSelectedDebugData(null)} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:scale-105 transition-transform">
                                <X size={16} className="text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {selectedDebugData.data.map((c, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-2xl bg-white dark:bg-[#2C2C2E] shadow-sm border border-gray-100 dark:border-white/5">
                                    <div>
                                        <p className="text-sm font-semibold dark:text-white">{c.nombre || c.cliente_nombre || c.client_name || 'Cliente'}</p>
                                        <p className="text-xs text-gray-500">{new Date(c.fecha_hora || c.fecha).toLocaleDateString('es-PE', { weekday: 'short', hour: '2-digit', minute: '2-digit' })} • {c.servicio} • {c._resolvedStaffName || ''}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatValue(Number(c.precio) || 0)}</p>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${c.estado === 'completada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : c.estado === 'cancelada' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>{c.estado}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header Global Insights */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Rendimiento de Staff</h2>
                    <p className="text-sm text-gray-500 mt-1">Facturado vs Proyectado de esta semana</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-[#2C2C2E] p-1 rounded-xl w-fit">
                    <button onClick={() => setViewMode('empleados')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'empleados' ? 'bg-white dark:bg-[#48484A] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Por Persona</button>
                    <button onClick={() => setViewMode('staff')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === 'staff' ? 'bg-white dark:bg-[#48484A] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Por Área</button>
                </div>
            </div>

            {/* Smart Summary widgets iOS Style */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-8">
                <div className="rounded-2xl bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-4 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><DollarSign size={14} /> Facturado Real</span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white whitespace-nowrap">{formatValue(globalTotals.reales)}</span>
                </div>
                <div className="rounded-2xl bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-4 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-blue-500 font-medium mb-1 flex items-center gap-1"><TrendingUp size={14} /> Potencial Semanal</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">{formatValue(globalTotals.reales + globalTotals.proyectados)}</span>
                </div>
                <div className="rounded-2xl bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-4 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-emerald-500 font-medium mb-1 flex items-center gap-1"><Target size={14} /> Tasa. Conversión</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {globalTotals.completadas > 0 ? ((globalTotals.completadas / (globalTotals.completadas + globalTotals.canceladas)) * 100).toFixed(1) : 0}%
                    </span>
                </div>
                <div className="rounded-2xl bg-white/60 dark:bg-[#1C1C1E]/60 backdrop-blur-xl border border-rose-500/10 dark:border-rose-500/20 p-4 shadow-sm flex flex-col justify-center">
                    <span className="text-xs text-rose-500 font-medium mb-1 flex items-center gap-1"><ShieldAlert size={14} /> Cancelaciones</span>
                    <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{globalTotals.canceladas} citas perdidas</span>
                </div>
            </div>

            {/* Rankings List */}
            <div className="space-y-4">
                {viewMode === 'empleados' ?
                    rankings.empList.filter(e => e.citasCompletadas > 0 || e.citasProyectadas > 0).map((emp, idx) => renderCard(emp, idx === 0))
                    :
                    rankings.areaList.map((area, idx) => renderCard(area, idx === 0))
                }
            </div>

            {/* Empty State */}
            {((viewMode === 'empleados' && rankings.empList.every(e => e.citasCompletadas === 0 && e.citasProyectadas === 0)) ||
                (viewMode === 'staff' && rankings.areaList.length === 0)) && (
                    <div className="py-12 text-center bg-white/30 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">No hay actividad registrada para esta semana aún.</p>
                    </div>
                )}
        </div>
    );
};

export default StaffWeeklyRanking;
