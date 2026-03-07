/**
 * StaffStatsCards Component
 * 
 * KPIs contextuales por staff seleccionado.
 * Muestra puntos, clientes, canjes y promedio del staff activo.
 * Con animación de entrada al cambiar de staff.
 */

import React from 'react';
import { Sparkles, Users, ArrowRightLeft, TrendingUp } from 'lucide-react';

export interface StaffStats {
    totalPuntos: number;
    clientesActivos: number;
    canjesEsteMes: number;
    promedioPorCliente: number;
    staffNombre: string;
    staffEmoji: string;
}

interface StaffStatsCardsProps {
    stats: StaffStats;
}

const StaffStatsCards: React.FC<StaffStatsCardsProps> = ({ stats }) => {
    const statItems = [
        {
            label: `Puntos ${stats.staffNombre}`,
            value: stats.totalPuntos.toLocaleString(),
            icon: Sparkles,
            color: 'text-violet-500',
            bgColor: 'bg-violet-500/10',
            borderColor: 'border-violet-500/10',
        },
        {
            label: 'Clientes Activos',
            value: stats.clientesActivos,
            icon: Users,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/10',
        },
        {
            label: 'Canjes Este Mes',
            value: stats.canjesEsteMes,
            icon: ArrowRightLeft,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/10',
        },
        {
            label: 'Promedio / Cliente',
            value: Math.round(stats.promedioPorCliente).toLocaleString(),
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/10',
        },
    ];

    return (
        <div
            className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 animate-fade-in"
            key={stats.staffNombre} // Force re-render animation when staff changes
        >
            {statItems.map((item, index) => (
                <div
                    key={index}
                    className={`rounded-xl border bg-white p-3 sm:p-5 shadow-sm dark:bg-dark-card transition-all duration-300 hover:shadow-md ${item.borderColor} dark:border-dark-border`}
                    style={{ animationDelay: `${index * 75}ms` }}
                >
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${item.bgColor}`}>
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {item.value}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                        </div>
                    </div>
                </div>
            ))}

            {/* Inline CSS for fade-in animation */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in > * {
                    animation: fadeInUp 0.3s ease-out both;
                }
            `}</style>
        </div>
    );
};

export default StaffStatsCards;
