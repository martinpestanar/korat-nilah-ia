/**
 * PointsLeaderboard Component
 * 
 * Ranking de clientes por puntos con barra de progreso hacia siguiente premio.
 * Diseño original de lista sin calificación.
 */

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Star, AlertTriangle, Target } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';

interface LoyaltyClient {
    id: number;
    name: string;
    phone: string;
    points: number;
    totalVisits: number;
    category: 'Nuevo' | 'Recurrente' | 'VIP' | 'Platino';
    lastVisit: string;
    pointsThisMonth: number;
}

interface PointsLeaderboardProps {
    clients: LoyaltyClient[];
    maxItems?: number;
}

const getCategoryColor = (category: string): string => {
    switch (category) {
        case 'Platino':
            return 'bg-gradient-to-r from-gray-700 to-gray-900 text-white';
        case 'VIP':
            return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
        case 'Recurrente':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
        case 'Nuevo':
        default:
            return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    }
};

const PointsLeaderboard: React.FC<PointsLeaderboardProps> = ({ clients, maxItems = 10 }) => {
    const { loyalty } = useDashboardData();

    const sortedClients = [...clients]
        .sort((a, b) => b.points - a.points)
        .slice(0, maxItems);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getMedalColor = (index: number): string => {
        switch (index) {
            case 0: return 'text-amber-400';
            case 1: return 'text-gray-400';
            case 2: return 'text-amber-700';
            default: return 'text-gray-300 dark:text-gray-600';
        }
    };

    // Get next reward using real data
    const getNextReward = (points: number) => {
        const premios = loyalty?.premios || [];
        const sortedRewards = [...premios]
            .filter(p => p.activo !== false)
            .sort((a, b) => a.costo_puntos - b.costo_puntos);

        const nextReward = sortedRewards.find(r => r.costo_puntos > points);
        if (!nextReward) return null;

        const progress = (points / nextReward.costo_puntos) * 100;
        const remaining = nextReward.costo_puntos - points;
        return {
            name: nextReward.nombre,
            pointsCost: nextReward.costo_puntos,
            progress: Math.min(progress, 100),
            remaining
        };
    };

    // Clientes con puntos por vencer (simulado)
    const expiringClients = sortedClients.filter(c => c.points > 200).slice(0, 2);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Ranking de Puntos
                    </h3>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Top {maxItems}
                </span>
            </div>

            {/* Puntos por vencer Alert */}
            {expiringClients.length > 0 && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Puntos por vencer (30 días)
                        </span>
                    </div>
                    <div className="space-y-1">
                        {expiringClients.map(c => (
                            <p key={c.id} className="text-xs text-amber-600 dark:text-amber-500">
                                {c.name}: {Math.floor(c.points * 0.3)} pts vencen pronto
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {sortedClients.length > 0 ? (
                <div className="space-y-3">
                    {sortedClients.map((client, index) => {
                        const nextRewardInfo = getNextReward(client.points);
                        return (
                            <div
                                key={client.id}
                                className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${index < 3
                                        ? 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                            >
                                {/* Position */}
                                <div className="flex w-8 items-center justify-center">
                                    {index < 3 ? (
                                        <Star className={`h-5 w-5 fill-current ${getMedalColor(index)}`} />
                                    ) : (
                                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                                            {index + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary">
                                    {client.name.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="truncate font-medium text-gray-900 dark:text-white">
                                        {client.name}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${getCategoryColor(client.category)}`}>
                                            {client.category}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {client.totalVisits} visitas
                                        </span>
                                    </div>
                                </div>

                                {/* Next Reward Progress */}
                                {nextRewardInfo && (
                                    <div className="w-24 hidden sm:block">
                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                            <span className="text-gray-400 truncate">{nextRewardInfo.name}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-200 rounded-full dark:bg-gray-700">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${nextRewardInfo.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-[9px] text-gray-400 mt-0.5">{nextRewardInfo.remaining} pts más</p>
                                    </div>
                                )}

                                {/* Points */}
                                <div className="text-right">
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {client.points.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400">pts</p>
                                </div>

                                {/* Points This Month */}
                                {client.pointsThisMonth > 0 && (
                                    <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                        <TrendingUp className="h-3 w-3" />
                                        +{client.pointsThisMonth}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <Trophy className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No hay clientes con puntos aún</p>
                </div>
            )}
        </div>
    );
};

export default PointsLeaderboard;
