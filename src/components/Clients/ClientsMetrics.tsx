import React from 'react';
import { Users, TrendingDown, AlertTriangle, HeartHandshake } from 'lucide-react';
import { Client } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

interface ClientsMetricsProps {
    clients: Client[];
}

export const ClientsMetrics: React.FC<ClientsMetricsProps> = ({ clients }) => {
    const { formatValue, moneda } = useCurrency();
    const totalClients = clients.length;

    const atRiskClients = clients.filter(c =>
        (c.dias_ausente || 0) >= 45 ||
        c.riesgo === 'Alto' ||
        c.riesgo === 'Crítico'
    );
    const totalLtvRisk = atRiskClients.reduce((acc, c) => acc + (c.ltv || 0), 0);
    const lostClients = clients.filter(c => (c.dias_ausente || 0) >= 90);
    const availableToRescue = atRiskClients.filter(c => {
        if (c.rescate_exitoso) return false;
        if (!c.bloqueado_hasta) return true;
        return new Date(c.bloqueado_hasta) <= new Date();
    });

    const kpis = [
        {
            label: 'Total',
            value: totalClients.toString(),
            icon: <Users size={18} />,
            bg: 'bg-white dark:bg-dark-card',
            border: 'border-gray-100 dark:border-dark-border',
            iconColor: 'text-blue-500',
            valueColor: 'text-gray-900 dark:text-white',
            labelColor: 'text-gray-500 dark:text-gray-400',
        },
        {
            label: 'Valor en Riesgo',
            value: totalLtvRisk > 999 ? `${moneda} ${(totalLtvRisk / 1000).toFixed(1)}k` : formatValue(totalLtvRisk),
            icon: <TrendingDown size={18} />,
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            border: 'border-orange-100 dark:border-orange-900/40',
            iconColor: 'text-orange-500',
            valueColor: 'text-orange-700 dark:text-orange-300',
            labelColor: 'text-orange-500 dark:text-orange-400',
        },
        {
            label: 'Perdidos',
            value: lostClients.length.toString(),
            icon: <AlertTriangle size={18} />,
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-100 dark:border-red-900/40',
            iconColor: 'text-red-500',
            valueColor: 'text-red-700 dark:text-red-300',
            labelColor: 'text-red-500 dark:text-red-400',
        },
        {
            label: 'Rescatables',
            value: availableToRescue.length.toString(),
            icon: <HeartHandshake size={18} />,
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-100 dark:border-green-900/40',
            iconColor: 'text-green-500',
            valueColor: 'text-green-700 dark:text-green-300',
            labelColor: 'text-green-500 dark:text-green-400',
        },
    ];

    return (
        <div className="mb-4">
            {/* Grid 2x2 en mobile, Grid 4x1 en desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.label}
                        className={`
                            w-full
                            ${kpi.bg} ${kpi.border}
                            flex flex-col gap-1 p-3 rounded-[20px] border shadow-sm
                        `}
                    >
                        <div className={`${kpi.iconColor}`}>{kpi.icon}</div>
                        <p className={`text-xl sm:text-2xl font-extrabold leading-none mt-1 ${kpi.valueColor}`}>{kpi.value}</p>
                        <p className={`text-[10px] sm:text-xs font-bold leading-tight ${kpi.labelColor}`}>{kpi.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
