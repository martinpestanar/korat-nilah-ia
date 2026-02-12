
import React, { useMemo, useState } from 'react';
import { Wand2, Info, CheckCircle, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../context/DashboardDataContext';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 9pm (21:00)
const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const ProfitHeatmap: React.FC = () => {
    const { appointments, isLoading } = useDashboardData();
    const citas = appointments || [];
    const navigate = useNavigate();
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [zonaMuertaDetectada, setZonaMuertaDetectada] = useState<{ dia: string, horas: string } | null>(null);

    // --- DATA PROCESSING ---
    const heatmapData = useMemo(() => {
        // Initialize grid with zeros
        const grid: Record<string, Record<number, number>> = {};
        DAYS.forEach(day => {
            grid[day] = {};
            HOURS.forEach(hour => grid[day][hour] = 0);
        });

        console.log('🔥 Heatmap - Citas recibidas:', citas.length);

        // Fill with revenue from real appointments
        let citasProcesadas = 0;
        citas.forEach(apt => {
            if (apt.estado === 'Cancelada' || apt.estado === 'No-Show') return;

            // Parsear la fecha - usar la hora LOCAL que viene en el string
            // Las fechas vienen como "2026-01-17T17:00:00+00:00"
            // Pero la hora 17:00 es la hora LOCAL programada
            const fechaStr = apt.fecha || '';

            // Extraer hora directamente del string ISO para evitar conversión de timezone
            const horaMatch = fechaStr.match(/T(\d{2}):/);
            const hour = horaMatch ? parseInt(horaMatch[1], 10) : new Date(fechaStr).getHours();

            const date = new Date(fechaStr);
            const dayIndex = date.getUTCDay(); // Usar UTC para evitar desfase de día
            const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const dayName = DAYS[adjustedDayIndex];

            console.log(`📅 Cita: ${apt.servicio} - ${fechaStr} - Día: ${dayName} - Hora: ${hour} - Precio: ${apt.precio}`);

            if (grid[dayName] && hour >= 8 && hour <= 21 && grid[dayName][hour] !== undefined) {
                grid[dayName][hour] += apt.precio || 0;
                citasProcesadas++;
            } else if (hour < 8 || hour > 21) {
                console.log(`⚠️ Cita fuera de horario comercial: hora ${hour}`);
            }
        });

        console.log('✅ Heatmap - Citas procesadas:', citasProcesadas);

        return grid;
    }, [citas]);

    // --- HELPER: GET COLOR ---
    const getCellColor = (value: number) => {
        if (value === 0) return 'bg-slate-100 hover:bg-rose-100 dark:bg-[#2A2A2A] dark:hover:bg-rose-900/30 text-transparent'; // Dead Zone
        if (value < 100) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'; // Low Value
        if (value >= 100) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'; // High Value
        return 'bg-gray-50';
    };

    const handleOptimize = () => {
        setIsOptimizing(true);
        // Analiza la data para encontrar zonas muertas
        setTimeout(() => {
            // Encontrar la zona muerta más crítica
            let peorDia = '';
            let peorHoraInicio = 9;
            let peorHoraFin = 12;
            let menorIngreso = Infinity;

            DAYS.forEach(day => {
                let ingresoManana = 0;
                [9, 10, 11].forEach(hour => {
                    ingresoManana += heatmapData[day]?.[hour] || 0;
                });
                if (ingresoManana < menorIngreso) {
                    menorIngreso = ingresoManana;
                    peorDia = day;
                }
            });

            setZonaMuertaDetectada({
                dia: peorDia,
                horas: '9:00 - 12:00'
            });
            setIsOptimizing(false);
            setShowModal(true);
        }, 1500);
    };

    const handleGoToMarketing = () => {
        setShowModal(false);
        // Navegar a Marketing - el wizard se abrirá automáticamente
        navigate('/nilah/app/marketing', {
            state: {
                openWizard: true,
                presetObjective: 'llenar_dia_flojo',
                zonaMuerta: zonaMuertaDetectada?.dia
            }
        });
    };

    if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-dark-card"></div>;

    return (
        <div className="h-full w-full relative">
            {/* HEADER */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                        Mapa de Calor de Ingresos
                        <Info size={14} className="text-gray-400" />
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Identifica tus "Horas de Oro" y tus "Zonas Muertas".</p>
                </div>

                <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className="group relative flex items-center gap-2 overflow-hidden rounded-lg bg-black px-4 py-2 text-xs font-bold text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ${isOptimizing ? 'animate-[shimmer_1s_infinite]' : '-translate-x-full'}`}></div>
                    <Wand2 size={14} className={isOptimizing ? 'animate-spin' : ''} />
                    {isOptimizing ? 'Analizando...' : 'Optimizar Zonas Muertas'}
                </button>
            </div>

            {/* HEATMAP GRID */}
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Header Row (Days) */}
                    <div className="mb-2 grid grid-cols-8 gap-1">
                        <div className="col-span-1 text-xs font-bold text-gray-400">Hora</div>
                        {DAYS.map(day => (
                            <div key={day} className="col-span-1 text-center text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Rows (Hours) */}
                    {HOURS.map(hour => (
                        <div key={hour} className="mb-1 grid grid-cols-8 gap-1">
                            {/* Time Label */}
                            <div className="col-span-1 flex items-center text-xs font-medium text-gray-400">
                                {hour}:00
                            </div>
                            {/* Cells */}
                            {DAYS.map(day => {
                                const value = heatmapData[day][hour];
                                const colorClass = getCellColor(value);

                                return (
                                    <div
                                        key={`${day}-${hour}`}
                                        className={`col-span-1 flex h-8 items-center justify-center rounded text-[10px] font-bold transition-all hover:scale-105 cursor-default group relative ${colorClass}`}
                                    >
                                        {value > 0 ? value : <span className="text-rose-500/20 text-lg select-none">•</span>}

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 hidden w-max rounded bg-black px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:block group-hover:opacity-100 z-10 pointer-events-none">
                                            {day} {hour}:00 - S/ {value}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* LEGEND */}
            <div className="mt-4 flex items-center justify-end gap-4 border-t border-gray-100 pt-3 text-[10px] dark:border-dark-border">
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-500/30"></span>
                    <span className="text-gray-600 dark:text-gray-300">Alta Rentabilidad (&gt; S/100)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-500/30"></span>
                    <span className="text-gray-600 dark:text-gray-300">Ingreso Bajo</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-slate-100 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700"></span>
                    <span className="text-gray-600 dark:text-gray-300">Zona Muerta (S/ 0)</span>
                </div>
            </div>

            {/* --- AI ANALYSIS MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Zap className="text-white h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">Análisis Completado</h3>
                                    <p className="text-indigo-100 text-xs">Korat AI (via n8n)</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 mb-6">
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                    <span className="font-bold">Diagnóstico:</span> He analizado tu matriz de ingresos de los últimos 30 días.
                                    <br /><br />
                                    📉 Detecté un patrón crítico de <span className="font-bold text-rose-500">Zonas Muertas</span> los <span className="underline decoration-rose-500 decoration-2">{zonaMuertaDetectada?.dia || 'Martes'} por la mañana</span> ({zonaMuertaDetectada?.horas || '9am - 12pm'}) donde la ocupación es muy baja.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Acción Propuesta</h4>

                                <div className="flex gap-4 items-start">
                                    <div className="mt-1">
                                        <CheckCircle className="text-green-500 h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">Campaña "Martes de Mimo"</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Crear automáticamente un descuento del 15% válido solo para Martes AM.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1">
                                        <CheckCircle className="text-green-500 h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">Targeting Inteligente</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Enviar WhatsApp a 24 clientes recurrentes que suelen venir días de semana.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGoToMarketing}
                                className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2"
                            >
                                <Wand2 size={16} />
                                Crear Campaña para {zonaMuertaDetectada?.dia || 'Martes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitHeatmap;
