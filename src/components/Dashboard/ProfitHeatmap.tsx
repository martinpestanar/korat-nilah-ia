import React, { useMemo, useState } from 'react';
import { Wand2, Info, CheckCircle, Zap, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8am to 9pm (21:00)
const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const ProfitHeatmap: React.FC = () => {
    const { appointments, isLoading } = useDashboardData();
    const citas = appointments || [];
    const navigate = useNavigate();
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [zonaMuertaDetectada, setZonaMuertaDetectada] = useState<{ dia: string; horas: string; hora?: number } | null>(null);
    const { formatValue, moneda } = useCurrency();

    // --- DATA PROCESSING ---
    const heatmapData = useMemo(() => {
        // Initialize grid with zeros
        const grid: Record<string, Record<number, number>> = {};
        DAYS.forEach(day => {
            grid[day] = {};
            HOURS.forEach(hour => grid[day][hour] = 0);
        });

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

            if (grid[dayName] && hour >= 8 && hour <= 21 && grid[dayName][hour] !== undefined) {
                grid[dayName][hour] += apt.precio || 0;
                citasProcesadas++;
            }
        });

        return grid;
    }, [citas]);

    // --- HELPER: GET COLOR ---
    const getCellColor = (value: number) => {
        if (value === 0) return 'bg-slate-100 hover:bg-rose-100 dark:bg-[#2A2A2A] dark:hover:bg-rose-900/30 text-transparent'; // Dead Zone
        if (value < 100) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'; // Low Value
        if (value >= 100) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'; // High Value
        return 'bg-gray-50';
    };

    const handleCellClick = (day: string, hour: number, value: number) => {
        if (value >= 100) return;
        setZonaMuertaDetectada({
            dia: day,
            horas: `${hour}:00 - ${hour + 1}:00`,
            hora: hour,
        });
        setShowModal(true);
    };

    const handleGoToMarketing = (audienceId?: string, audienceName?: string) => {
        setShowModal(false);
        const dia = zonaMuertaDetectada?.dia || '';
        const horas = zonaMuertaDetectada?.horas || '';
        const hora = (zonaMuertaDetectada as any)?.hora;

        if (audienceId && audienceName) {
            // Ir directo al Tuning Studio con la audiencia elegida
            const contextMsg = hora !== undefined
                ? hora < 12
                    ? `¡Hola! Tenemos un espacio especial este ${dia} en la mañana para ti. ¿Te gustaría aprovechar un beneficio exclusivo hoy?`
                    : hora < 17
                    ? `¡Hola! Tenemos disponibilidad especial este ${dia} por la tarde. ¿Quieres reservar tu cita con un descuento exclusivo?`
                    : `¡Hola! Tenemos un espacio perfecto este ${dia} en el horario nocturno. ¿Te gustaría una atención especial hoy?`
                : `¡Hola! Tenemos un espacio disponible este ${dia}. ¿Quieres aprovecharlo con un descuento exclusivo?`;

            navigate('/nilah/app/marketing', {
                state: {
                    openTuningModal: true,
                    tuningTitle: `Flash: ${audienceName} (${dia})`,
                    tuningPayload: {
                        audience_id: audienceId,
                        segmento: audienceId,
                        mensaje: contextMsg,
                        dia_zona_muerta: dia,
                        hora_zona_muerta: horas,
                        origen_campana: 'flash_mapa_calor',
                    }
                }
            });
        } else {
            // Navegar a Marketing - abrir Marketplace de audiencias directamente
            navigate('/nilah/app/marketing', {
                state: {
                    openMarketplace: true,
                    zonaMuerta: `${dia} ${horas}`,
                    dia_zona_muerta: dia,
                    hora_zona_muerta: horas,
                }
            });
        }
    };

    if (isLoading) return <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-dark-card"></div>;

    return (
        <div className="h-full w-full min-w-0 relative">
            {/* HEADER */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                        Mapa de Calor de Ingresos
                        <Info size={14} className="text-gray-400" />
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Identifica tus "Horas de Oro" y tus "Zonas Muertas".</p>
                </div>


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
                                        onClick={() => handleCellClick(day, hour, value)}
                                        className={`col-span-1 flex h-8 items-center justify-center rounded text-[10px] font-bold transition-all ${value < 100 ? 'cursor-pointer hover:ring-2 hover:ring-purple-400 hover:scale-105' : 'cursor-default'} group relative ${colorClass}`}
                                    >
                                        {value > 0 ? value : <span className="text-rose-500/20 text-lg select-none">•</span>}

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 hidden w-max rounded bg-black px-2 py-1 text-xs text-white opacity-0 shadow-lg group-hover:block group-hover:opacity-100 z-10 pointer-events-none">
                                            {day} {hour}:00 - {formatValue(value)}
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
                    <span className="text-gray-600 dark:text-gray-300">Alta Rentabilidad (&gt; {moneda} 100)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-500/30"></span>
                    <span className="text-gray-600 dark:text-gray-300">Ingreso Bajo</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-slate-100 dark:bg-[#2A2A2A] border border-gray-200 dark:border-gray-700"></span>
                    <span className="text-gray-600 dark:text-gray-300">Zona Muerta ({moneda} 0)</span>
                </div>
            </div>

            {/* --- AI AUDIENCE RECOMMENDATION MODAL --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold text-lg">Llenar horario: {zonaMuertaDetectada?.dia} {zonaMuertaDetectada?.horas}</h3>
                            <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
                                Para rellenar este horario de baja ocupación, se recomiendan audiencias que suelen tener disponibilidad (como estudiantes o clientas con horarios flexibles) o usar un gancho atractivo.
                            </p>
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Audiencias Recomendadas</h4>
                            <div className="space-y-3">
                                {(() => {
                                    const dia = zonaMuertaDetectada?.dia || '';
                                    const hora = zonaMuertaDetectada?.hora ?? 12;
                                    type Rec = { id: string; name: string; desc: string; border: string; iconBg: string; iconText: string; hover: string };
                                    const recs: Rec[] = [];
                                    if (hora < 12) {
                                        recs.push({ id: 'mkt-morning', name: '☕ Público Mañanero', desc: 'Clientas que suelen venir antes de las 12h. Las más propensas a llenar slots de mañana.', border: 'border-amber-200 dark:border-amber-500/20', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/10', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400' });
                                    } else if (hora >= 17) {
                                        recs.push({ id: 'mkt-night', name: '🌙 After-Office', desc: 'Profesionales que prefieren citas en la tarde-noche. Perfectas para este horario.', border: 'border-violet-200 dark:border-violet-500/20', hover: 'hover:bg-violet-50 dark:hover:bg-violet-900/10', iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconText: 'text-violet-600 dark:text-violet-400' });
                                    } else {
                                        recs.push({ id: 'mkt-afternoon', name: '☀️ Público de Tarde', desc: 'Clientas con horarios flexibles. Ideal para el turno de tarde libre.', border: 'border-orange-200 dark:border-orange-500/20', hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/10', iconBg: 'bg-orange-100 dark:bg-orange-900/30', iconText: 'text-orange-600 dark:text-orange-400' });
                                    }
                                    if (['Mar', 'Mie'].includes(dia)) {
                                        recs.push({ id: 'mkt-slowdays', name: '📅 Flexibles (Días Valle)', desc: 'Historial de citas martes/miércoles. Las que llenan estos días naturalmente.', border: 'border-blue-200 dark:border-blue-500/20', hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/10', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400' });
                                    } else {
                                        recs.push({ id: 'crm-vip', name: 'Clientas VIP 👑', desc: 'Alta tasa de respuesta. Perfectas para servicios exclusivos en horarios tranquilos.', border: 'border-purple-200 dark:border-purple-500/20', hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/10', iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconText: 'text-purple-600 dark:text-purple-400' });
                                    }
                                    return recs.map(rec => (
                                        <div key={rec.id} onClick={() => handleGoToMarketing(rec.id, rec.name)}
                                            className={`p-4 border ${rec.border} rounded-xl ${rec.hover} cursor-pointer transition-colors group`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 ${rec.iconBg} ${rec.iconText} rounded-lg shrink-0`}>
                                                    <CheckCircle size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{rec.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>

                            <button
                                onClick={() => handleGoToMarketing()}
                                className="w-full mt-6 border-2 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Elegir otra audiencia desde el Marketplace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitHeatmap;
