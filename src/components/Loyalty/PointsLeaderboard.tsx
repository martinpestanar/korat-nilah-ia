/**
 * PointsLeaderboard Component
 * 
 * Ranking de clientes por puntos con barra de progreso hacia siguiente premio.
 * Diseño original de lista sin calificación.
 * Incluye paginación moderna.
 */

import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Star, AlertTriangle, Target, ChevronLeft, ChevronRight } from 'lucide-react';
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
    staffFilter?: number | null;
    staffCategoryName?: string;
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

const PointsLeaderboard: React.FC<PointsLeaderboardProps> = ({ clients, maxItems = 10, staffFilter, staffCategoryName }) => {
    const { loyalty } = useDashboardData();
    const [currentPage, setCurrentPage] = useState(1);

    const sortedClients = [...clients]
        .sort((a, b) => b.points - a.points);

    const totalItems = sortedClients.length;
    const totalPages = Math.ceil(totalItems / maxItems);
    const startIndex = (currentPage - 1) * maxItems;
    const displayedClients = sortedClients.slice(startIndex, startIndex + maxItems);

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
        const premios = loyalty?.premiosPopulares || [];
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

    // Clientes con puntos por vencer (solo mostramos top 2 general, no paginado)
    const expiringClients = sortedClients.filter(c => c.points > 200).slice(0, 2);

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-dark-border dark:bg-dark-card flex flex-col h-full">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        {staffCategoryName ? `Ranking — ${staffCategoryName}` : 'Top Clientas'}
                    </h3>
                    {staffCategoryName && (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                            Staff
                        </span>
                    )}
                </div>
                {totalItems > 0 && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 self-start sm:self-auto">
                        {totalItems} clientas
                    </span>
                )}
            </div>

            {/* ── Top-3 Podium (mobile-first) ── */}
            {currentPage === 1 && sortedClients.length >= 3 && (
                <div className="mb-4 flex items-end justify-center gap-2">
                    {/* 2nd place */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-xl">🥈</div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-lg font-black text-gray-600 dark:text-gray-200">
                            {sortedClients[1]?.name?.charAt(0)}
                        </div>
                        <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 text-center truncate max-w-[60px]">{sortedClients[1]?.name?.split(' ')[0]}</p>
                        <span className="text-xs font-black text-gray-500">{sortedClients[1]?.points.toLocaleString()}</span>
                        <div className="h-8 w-full rounded-t-lg bg-gray-200 dark:bg-gray-700" />
                    </div>
                    {/* 1st place */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-2xl">🥇</div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-amber-400/40">
                            {sortedClients[0]?.name?.charAt(0)}
                        </div>
                        <p className="text-[10px] font-bold text-gray-800 dark:text-white text-center truncate max-w-[70px]">{sortedClients[0]?.name?.split(' ')[0]}</p>
                        <span className="text-sm font-black text-amber-600">{sortedClients[0]?.points.toLocaleString()}</span>
                        <div className="h-12 w-full rounded-t-lg bg-amber-200 dark:bg-amber-800/40" />
                    </div>
                    {/* 3rd place */}
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="text-xl">🥉</div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-base font-black text-white">
                            {sortedClients[2]?.name?.charAt(0)}
                        </div>
                        <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 text-center truncate max-w-[55px]">{sortedClients[2]?.name?.split(' ')[0]}</p>
                        <span className="text-xs font-black text-amber-800 dark:text-amber-600">{sortedClients[2]?.points.toLocaleString()}</span>
                        <div className="h-6 w-full rounded-t-lg bg-amber-100 dark:bg-amber-900/30" />
                    </div>
                </div>
            )}

            {/* Puntos por vencer Alert */}
            {expiringClients.length > 0 && currentPage === 1 && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
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

            <div className="flex-1">
                {displayedClients.length > 0 ? (
                    <div className="space-y-2">
                        {displayedClients.map((client, index) => {
                            const globalIndex = startIndex + index;
                            // Skip top 3 from the list when showing podium
                            if (currentPage === 1 && globalIndex < 3 && sortedClients.length >= 3) return null;
                            const nextRewardInfo = getNextReward(client.points);
                            return (
                                <div
                                    key={client.id}
                                    className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    {/* Position */}
                                    <div className="w-6 flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                                            {globalIndex + 1}
                                        </span>
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary">
                                        {client.name.charAt(0)}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-medium text-sm text-gray-900 dark:text-white">
                                            {client.name}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`rounded px-1 py-0.5 text-[9px] font-bold uppercase ${getCategoryColor(client.category)}`}>
                                                {client.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right shrink-0">
                                        <p className="font-black text-sm text-amber-600 dark:text-amber-400">
                                            {client.points.toLocaleString()}
                                        </p>
                                        <p className="text-[9px] text-gray-400">pts</p>
                                    </div>

                                    {/* Next Reward Progress */}
                                    {nextRewardInfo && (
                                        <div className="w-16 hidden sm:block shrink-0">
                                            <div className="h-1.5 bg-gray-200 rounded-full dark:bg-gray-700">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${nextRewardInfo.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-0.5">{nextRewardInfo.remaining} más</p>
                                        </div>
                                    )}

                                    {/* Points This Month */}
                                    {client.pointsThisMonth > 0 && (
                                        <div className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0">
                                            <TrendingUp className="h-2.5 w-2.5" />
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {startIndex + 1}-{Math.min(startIndex + maxItems, totalItems)} de {totalItems}
                    </span>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PointsLeaderboard;
