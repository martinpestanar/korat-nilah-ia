/**
 * RedemptionHistory Component
 * 
 * Muestra el historial de canjes con estado (pendiente/entregado).
 * Permite marcar canjes como entregados.
 */

import React, { useState } from 'react';
import { ArrowRightLeft, Gift, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { loyalty } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useAuth } from '../../context/AuthContext';

// Legacy interface for backward compatibility
interface Redemption {
    id: number;
    clientId: number;
    clientName: string;
    rewardId: number;
    rewardName: string;
    pointsUsed: number;
    date: string;
    status?: 'pendiente' | 'entregado' | 'cancelado';
}

interface RedemptionHistoryProps {
    redemptions: Redemption[];
    maxItems?: number;
}

const RedemptionHistory: React.FC<RedemptionHistoryProps> = ({
    redemptions,
    maxItems = 8
}) => {
    const { refresh } = useDashboardData();
    const { user } = useAuth();
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const sortedRedemptions = [...redemptions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, maxItems);

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('es-PE', { month: 'short' });
        return `${day} ${month}`;
    };

    const handleMarkDelivered = async (canjeId: number) => {
        setLoadingId(canjeId);
        try {
            const staffName = user?.name || user?.email || 'Staff';
            const response = await loyalty.marcarEntregado(canjeId, staffName);

            if (response.success) {
                refresh(true); // Refresh data
            }
        } catch (error) {
            console.error('Error marking canje as delivered:', error);
        } finally {
            setLoadingId(null);
        }
    };

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'entregado':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle size={10} />
                        Entregado
                    </span>
                );
            case 'cancelado':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Cancelado
                    </span>
                );
            case 'pendiente':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock size={10} />
                        Pendiente
                    </span>
                );
        }
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Últimos Canjes
                    </h3>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {redemptions.length}
                    </span>
                </div>
            </div>

            {sortedRedemptions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-dark-border">
                                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Cliente
                                </th>
                                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Premio
                                </th>
                                <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Puntos
                                </th>
                                <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Estado
                                </th>
                                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Fecha
                                </th>
                                <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Acción
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-dark-border">
                            {sortedRedemptions.map((redemption) => (
                                <tr
                                    key={redemption.id}
                                    className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                >
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 dark:bg-dark-hover dark:text-gray-300">
                                                {redemption.clientName.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {redemption.clientName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3">
                                        <div className="flex items-center gap-2">
                                            <Gift className="h-4 w-4 text-purple-400" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {redemption.rewardName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600 dark:bg-red-500/20 dark:text-red-400">
                                            -{redemption.pointsUsed}
                                        </span>
                                    </td>
                                    <td className="py-3 text-center">
                                        {getStatusBadge(redemption.status)}
                                    </td>
                                    <td className="py-3 text-right">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(redemption.date)}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right">
                                        {(redemption.status === 'pendiente' || !redemption.status) && (
                                            <button
                                                onClick={() => handleMarkDelivered(redemption.id)}
                                                disabled={loadingId === redemption.id}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                                            >
                                                {loadingId === redemption.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle size={12} />
                                                )}
                                                Entregar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Gift className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No hay canjes registrados aún
                    </p>
                </div>
            )}

            {redemptions.length > maxItems && (
                <div className="mt-4 text-center">
                    <button className="text-sm font-medium text-primary hover:underline">
                        Ver todos los canjes
                    </button>
                </div>
            )}
        </div>
    );
};

export default RedemptionHistory;
