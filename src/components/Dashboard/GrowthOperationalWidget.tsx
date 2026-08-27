/**
 * GrowthOperationalWidget
 * Version compacta de OperationalTab para el Dashboard.
 * Muestra top 5 servicios mas vendidos + barra de ocupacion semanal.
 */

import React, { useMemo } from "react";
import { Scissors, ChevronRight, TrendingUp } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import { useCurrency } from "../../hooks/useCurrency";
import { useNavigate } from "react-router-dom";

const BAR_COLORS = ["#8B5CF6", "#3B82F6", "#EC4899", "#F59E0B", "#10B981"];

const GrowthOperationalWidget: React.FC = () => {
    const { appointments, services } = useDashboardData();
    const { formatMoney } = useCurrency();
    const navigate = useNavigate();

    const topServices = useMemo(() => {
        const counts: Record<string, { name: string; count: number; revenue: number }> = {};
        (appointments || []).forEach((apt: any) => {
            if (apt.estado === "Cancelada" || apt.estado === "No-Show") return;
            const name = apt.nombre_servicio || apt.servicio || "Otro";
            if (!counts[name]) counts[name] = { name, count: 0, revenue: 0 };
            counts[name].count += 1;
            counts[name].revenue += parseFloat(apt.precio_servicio || apt.precio || 0);
        });
        return Object.values(counts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [appointments]);

    const maxCount = topServices[0]?.count || 1;

    // Ocupacion por dia de la semana (ultimas semanas)
    const weekdayOccupancy = useMemo(() => {
        const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
        const counts = Array(7).fill(0);
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);

        (appointments || []).forEach((apt: any) => {
            if (apt.estado === "Cancelada" || apt.estado === "No-Show") return;
            const d = new Date(apt.fecha_hora || apt.fecha || "");
            if (isNaN(d.getTime()) || d < threeMonthsAgo) return;
            // getDay() retorna 0=Dom..6=Sab; convertimos a Lun=0..Dom=6
            const dow = (d.getDay() + 6) % 7;
            counts[dow] += 1;
        });

        const maxDay = Math.max(...counts) || 1;
        return days.map((label, i) => ({
            label,
            count: counts[i],
            pct: Math.round((counts[i] / maxDay) * 100),
        }));
    }, [appointments]);

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
                        <Scissors className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Servicios Más Vendidos</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Últimos 3 meses</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate("/growth?tab=operational")}
                    className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                    Ver detalle <ChevronRight className="h-3 w-3" />
                </button>
            </div>

            {/* Top services */}
            {topServices.length > 0 ? (
                <div className="px-4 pb-3 space-y-2">
                    {topServices.map((svc, i) => (
                        <div key={svc.name} className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 w-4 shrink-0">#{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{svc.name}</p>
                                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 shrink-0 ml-2">{svc.count} citas</p>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${Math.round((svc.count / maxCount) * 100)}%`, background: BAR_COLORS[i] }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="px-4 pb-4 h-24 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Sin citas registradas aún</p>
                </div>
            )}

            {/* Ocupacion semanal */}
            <div className="px-4 pb-4 border-t border-gray-50 dark:border-dark-border pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2.5">Ocupación por día</p>
                <div className="flex items-end justify-between gap-1 h-12">
                    {weekdayOccupancy.map((day, i) => (
                        <div key={day.label} className="flex flex-col items-center gap-1 flex-1">
                            <div className="w-full flex items-end justify-center" style={{ height: 36 }}>
                                <div
                                    className="w-full rounded-t-sm transition-all duration-500"
                                    style={{
                                        height: `${Math.max(day.pct, 4)}%`,
                                        background: day.pct >= 80 ? "#10B981" : day.pct >= 40 ? "#8B5CF6" : "#E5E7EB",
                                    }}
                                />
                            </div>
                            <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500">{day.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GrowthOperationalWidget;
