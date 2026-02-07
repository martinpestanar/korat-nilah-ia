import React from 'react';
import { Gift, ArrowRightLeft, Crown, Sparkles } from 'lucide-react';
import { LoyaltyStats } from '../../context/DashboardDataContext';

interface LoyaltyStatsCardProps {
    stats: LoyaltyStats;
}

const LoyaltyStatsCard: React.FC<LoyaltyStatsCardProps> = ({ stats }) => {
    const statItems = [
        {
            label: 'Puntos Activos',
            value: stats.totalActivePoints.toLocaleString(),
            icon: Sparkles,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            label: 'Premios Activos',
            value: stats.totalRewards,
            icon: Gift,
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            label: 'Canjes Este Mes',
            value: stats.redemptionsThisMonth,
            icon: ArrowRightLeft,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            label: 'Clientes VIP',
            value: stats.vipClients,
            icon: Crown,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statItems.map((item, index) => (
                <div
                    key={index}
                    className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-card"
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
        </div>
    );
};

export default LoyaltyStatsCard;
