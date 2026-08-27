/**
 * GrowthClientsWidget
 * Version compacta de RetentionTab para el Dashboard.
 * Muestra clientes nuevos vs recurrentes + boton CTA WhatsApp de fidelizacion.
 */

import React, { useMemo } from "react";
import { Users, UserPlus, Heart, MessageCircle, ChevronRight } from "lucide-react";
import { useDashboardData } from "../../context/DashboardDataContext";
import WhatsAppActionButton from "./WhatsAppActionButton";
import { useNavigate } from "react-router-dom";

interface GrowthClientsWidgetProps {
    onWhatsAppAction?: () => void;
    whatsAppActive?: boolean;
}

const GrowthClientsWidget: React.FC<GrowthClientsWidgetProps> = ({
    onWhatsAppAction,
    whatsAppActive = false,
}) => {
    const { clients, appointments } = useDashboardData();
    const navigate = useNavigate();

    const stats = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Clientes nuevos este mes = primera cita completada en este mes
        const newThisMonth = (clients || []).filter((c: any) => {
            const primera = c.primera_visita ? new Date(c.primera_visita) : null;
            return primera && primera >= monthStart;
        }).length;

        // Recurrentes = clientes con mas de 1 visita
        const recurring = (clients || []).filter((c: any) => (c.total_visitas || 0) > 1).length;

        // Tasa de retención aproximada
        const total = (clients || []).length;
        const retentionRate = total > 0 ? Math.round((recurring / total) * 100) : 0;

        // Clientes en riesgo
        const atRisk = (clients || []).filter((c: any) => c.riesgo === "Alto" || c.riesgo === "Crítico").length;

        return { newThisMonth, recurring, total, retentionRate, atRisk };
    }, [clients]);

    const barWidth = stats.total > 0 ? Math.round((stats.recurring / stats.total) * 100) : 0;

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10">
                        <Users className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Tendencia de Clientes</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">Retención y captación</p>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-3">
                {[
                    { icon: UserPlus, label: "Nuevas este mes", value: stats.newThisMonth, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                    { icon: Heart,    label: "Recurrentes",     value: stats.recurring,    color: "text-rose-600 dark:text-rose-400",  bg: "bg-rose-50 dark:bg-rose-500/10" },
                    { icon: Users,    label: "Total base",      value: stats.total,        color: "text-gray-600 dark:text-gray-400",  bg: "bg-gray-100 dark:bg-white/5" },
                ].map((kpi, i) => (
                    <div key={i} className={`flex flex-col items-center rounded-xl px-2 py-2.5 ${kpi.bg}`}>
                        <kpi.icon className={`h-4 w-4 mb-1 ${kpi.color}`} />
                        <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                        <p className="text-[9px] text-center text-gray-400 dark:text-gray-500 leading-tight">{kpi.label}</p>
                    </div>
                ))}
            </div>

            {/* Retention bar */}
            <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Tasa de retención</p>
                    <p className={`text-xs font-black ${stats.retentionRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {stats.retentionRate}%
                    </p>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${stats.retentionRate >= 50 ? "bg-emerald-500" : "bg-amber-400"}`}
                        style={{ width: `${barWidth}%` }}
                    />
                </div>
            </div>

            {/* WhatsApp CTA */}
            {stats.atRisk > 0 && (
                <div className="px-4 pb-4 border-t border-gray-50 dark:border-dark-border pt-3">
                    <WhatsAppActionButton
                        label={`Campaña de Fidelización por WhatsApp`}
                        count={stats.atRisk}
                        isActive={whatsAppActive}
                        onAction={onWhatsAppAction}
                        variant="secondary"
                        sublabel={`${stats.atRisk} clientas en riesgo de no volver`}
                    />
                </div>
            )}
        </div>
    );
};

export default GrowthClientsWidget;
