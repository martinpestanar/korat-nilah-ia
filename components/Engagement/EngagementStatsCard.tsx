import React from 'react';
import { MessageCircle, Bell, Star, TrendingUp } from 'lucide-react';
import { EngagementStats } from '../../services/engagementMockData';

interface EngagementStatsCardProps {
    stats: EngagementStats;
}

const EngagementStatsCard: React.FC<EngagementStatsCardProps> = ({ stats }) => {
    const statItems = [
        {
            label: 'Tasa Confirmación',
            value: `${stats.confirmationRate}%`,
            icon: Bell,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
        },
        {
            label: 'Mantenim. Pendientes',
            value: stats.pendingMaintenances,
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
        },
        {
            label: 'Calificación Promedio',
            value: `⭐ ${stats.averageRating}`,
            icon: Star,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
        },
        {
            label: 'NPS Score',
            value: stats.npsScore,
            icon: MessageCircle,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
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

export default EngagementStatsCard;
