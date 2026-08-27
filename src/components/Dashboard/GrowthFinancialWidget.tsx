/**
 * GrowthFinancialWidget
 * Version compacta del FinancialHealthTab para el Dashboard.
 * Muestra 4 KPIs clave + mini grafico de tendencia de ingresos.
 */

import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Zap, ChevronRight } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import { useCurrency } from "../../hooks/useCurrency";
import { useNavigate } from "react-router-dom";

const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const EMERALD = "#10B981";

const GrowthFinancialWidget: React.FC = () => {
    const { appointments } = useDashboardData();
    const { formatMoney } = useCurrency();
    const navigate = useNavigate();

    const monthlyData = useMemo(() => {
        const byMonth: Record<string, { revenue: number; count: number; tickets: number[] }> = {};
        (appointments || []).forEach((c: any) => {
            if (c.estado !== "Completada") return;
            const date = new Date(c.fecha_hora || c.fecha || "");
            if (isNaN(date.getTime())) return;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            if (!byMonth[key]) byMonth[key] = { revenue: 0, count: 0, tickets: [] };
            const price = parseFloat(c.precio_servicio || c.precio || 0);
            byMonth[key].revenue += price;
            byMonth[key].count += 1;
            if (price > 0) byMonth[key].tickets.push(price);
        });
        return Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([key, val]) => {
                const [, m] = key.split("-");
                const avg = val.tickets.length > 0 ? val.tickets.reduce((a, b) => a + b, 0) / val.tickets.length : 0;
                return { month: MONTH_NAMES[parseInt(m) - 1], revenue: Math.round(val.revenue), citas: val.count, ticket: Math.round(avg) };
            });
    }, [appointments]);

    const lastM = monthlyData[monthlyData.length - 1];
    const prevM = monthlyData[monthlyData.length - 2];
    const revTrend = lastM && prevM && prevM.revenue > 0
        ? Math.round(((lastM.revenue - prevM.revenue) / prevM.revenue) * 100) : 0;
    const ticketTrend = lastM && prevM && prevM.ticket > 0
        ? Math.round(((lastM.ticket - prevM.ticket) / prevM.ticket) * 100) : 0;
    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const avgMonthly = monthlyData.length > 0 ? Math.round(totalRevenue / monthlyData.length) : 0;

    const TrendBadge: React.FC<{ value: number }> = ({ value }) => (
        <span className={`flex items-center gap-0.5 text-[10px] font-bold ${value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
            {value >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(value)}%
        </span>
    );

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Resumen Financiero</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Últimos 6 meses</p>
                    </div>
                </div>
            </div>

            {/* Mini chart */}
            {monthlyData.length > 1 ? (
                <div className="px-2 -mt-1">
                    <ResponsiveContainer width="100%" height={80} minWidth={0}>
                        <AreaChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="fwGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={EMERALD} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #e5e7eb" }}
                                formatter={(v: any) => [formatMoney(v), "Ingresos"]}
                            />
                            <Area type="monotone" dataKey="revenue" stroke={EMERALD} strokeWidth={2} fill="url(#fwGrad)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-20 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Sin historial suficiente</p>
                </div>
            )}

            {/* KPIs row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-dark-border border-t border-gray-100 dark:border-dark-border">
                {[
                    { label: "Mes actual", value: formatMoney(lastM?.revenue || 0), trend: revTrend, icon: DollarSign },
                    { label: "Ticket prom.", value: formatMoney(lastM?.ticket || 0), trend: ticketTrend, icon: Target },
                    { label: "Prom. mensual", value: formatMoney(avgMonthly), trend: undefined, icon: BarChart3 },
                ].map((kpi, i) => (
                    <div key={i} className="flex flex-col items-center py-3 px-2 gap-0.5">
                        <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-gray-500 text-center">{kpi.label}</p>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{kpi.value}</p>
                        {kpi.trend !== undefined && <TrendBadge value={kpi.trend} />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GrowthFinancialWidget;
