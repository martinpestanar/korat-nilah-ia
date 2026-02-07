/**
 * RewardsGrid Component
 * 
 * Muestra el catálogo de premios en formato grid con paginación.
 * Permite canjear premios seleccionando un cliente.
 */

import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, CheckCircle, Filter, Loader2, X, Search, AlertTriangle, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboardData, LoyaltyClient } from '../../context/DashboardDataContext';
import { loyalty } from '../../services/api';

interface Reward {
    id: number;
    name: string;
    pointsCost: number;
    description: string;
    category: string;
    isActive: boolean;
    timesRedeemed: number;
}

interface RewardsGridProps {
    rewards: Reward[];
    itemsPerPage?: number;
}

interface RedeemModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: Reward | null;
    leaderboard: LoyaltyClient[];
    onSuccess: () => void;
}

// ===========================================
// Modal de Canje
// ===========================================
const RedeemModal: React.FC<RedeemModalProps> = ({ isOpen, onClose, reward, leaderboard, onSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<LoyaltyClient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredClients = leaderboard.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono.includes(searchTerm)
    );

    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
            setSelectedClient(null);
            setError(null);
            setSuccess(null);
        }
    }, [isOpen]);

    const handleRedeem = async () => {
        if (!selectedClient || !reward) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await loyalty.canjear(selectedClient.id, reward.id);

            if (response.success) {
                setSuccess(`¡Listo! ${selectedClient.nombre} canjeó "${reward.name}". Le quedan ${response.canje?.puntos_restantes || 0} puntos.`);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                setError(response.error || 'Error al canjear el premio');
            }
        } catch (err: any) {
            console.error('Error redeeming reward:', err);
            setError(err.message || 'Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !reward) return null;

    const canRedeem = selectedClient && selectedClient.puntos >= reward.pointsCost;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-card shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-emerald-500 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            <h3 className="font-bold">Canjear Premio</h3>
                        </div>
                        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="mt-2">
                        <p className="text-sm opacity-90">{reward.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <Sparkles size={14} />
                            <span className="font-bold">{reward.pointsCost} puntos</span>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4">
                    {success && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle size={18} />
                                <p className="text-sm font-medium">{success}</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                                <AlertTriangle size={18} />
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        </div>
                    )}

                    {!success && (
                        <>
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nombre o teléfono..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map(client => {
                                        const hasEnoughPoints = client.puntos >= reward.pointsCost;
                                        const isSelected = selectedClient?.id === client.id;

                                        return (
                                            <button
                                                key={client.id}
                                                onClick={() => setSelectedClient(client)}
                                                disabled={!hasEnoughPoints}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected
                                                    ? 'border-primary bg-primary/10 dark:bg-primary/20'
                                                    : hasEnoughPoints
                                                        ? 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800'
                                                        : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                                            {client.nombre.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{client.nombre}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{client.telefono}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`flex items-center gap-1 ${hasEnoughPoints ? 'text-primary' : 'text-red-500'}`}>
                                                            <Sparkles size={12} />
                                                            <span className="font-bold text-sm">{client.puntos}</span>
                                                        </div>
                                                        {!hasEnoughPoints && (
                                                            <p className="text-[10px] text-red-500">Faltan {reward.pointsCost - client.puntos}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <User className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                        <p className="text-sm">No se encontraron clientes</p>
                                    </div>
                                )}
                            </div>

                            {selectedClient && (
                                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resumen:</p>
                                    <div className="flex justify-between text-sm">
                                        <span>Puntos actuales:</span>
                                        <span className="font-bold">{selectedClient.puntos}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Costo:</span>
                                        <span className="font-bold text-red-500">-{reward.pointsCost}</span>
                                    </div>
                                    <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-1 mt-1">
                                        <span>Restantes:</span>
                                        <span className="font-bold text-primary">{selectedClient.puntos - reward.pointsCost}</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!success && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                            Cancelar
                        </button>
                        <button
                            onClick={handleRedeem}
                            disabled={!canRedeem || isLoading}
                            className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 ${canRedeem && !isLoading
                                ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? <><Loader2 size={16} className="animate-spin" />Canjeando...</> : <><Gift size={16} />Confirmar</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ===========================================
// RewardsGrid Component
// ===========================================
const RewardsGrid: React.FC<RewardsGridProps> = ({ rewards, itemsPerPage = 10 }) => {
    const { loyalty: loyaltyData, refresh } = useDashboardData();
    const [filterCategory, setFilterCategory] = useState<string>('Todos');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Get unique categories
    const categories = ['Todos', ...Array.from(new Set(rewards.map(r => r.category)))];

    // Filter rewards
    const filteredRewards = rewards
        .filter(r => filterCategory === 'Todos' || r.category === filterCategory)
        .sort((a, b) => a.pointsCost - b.pointsCost);

    // Pagination
    const totalPages = Math.ceil(filteredRewards.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRewards = filteredRewards.slice(startIndex, startIndex + itemsPerPage);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterCategory]);

    const getCategoryStyle = (category: string): string => {
        switch (category) {
            case 'Premium': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
            case 'Spa': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400';
            case 'Cabello': return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400';
            case 'Uñas': return 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400';
            case 'Tratamiento': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'Descuento': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const handleRedeemClick = (reward: Reward) => {
        setSelectedReward(reward);
        setIsModalOpen(true);
    };

    const handleRedeemSuccess = () => {
        refresh(true);
    };

    return (
        <>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
                {/* Header */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Catálogo de Premios</h3>
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                            {filteredRewards.length} premios
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Category Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-gray-400" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Grid de Premios */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {paginatedRewards.map((reward) => (
                        <div
                            key={reward.id}
                            className={`relative rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md ${reward.isActive
                                ? 'border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50 hover:border-primary/50'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                            onClick={() => reward.isActive && handleRedeemClick(reward)}
                        >
                            {/* Popular Badge */}
                            {reward.timesRedeemed >= 30 && (
                                <div className="absolute -right-1 -top-1 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow">
                                    🔥 TOP
                                </div>
                            )}

                            {/* Points */}
                            <div className="flex items-center gap-1 mb-3">
                                <div className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    <span className="font-bold text-primary text-sm">{reward.pointsCost}</span>
                                </div>
                            </div>

                            {/* Name */}
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                                {reward.name}
                            </h4>

                            {/* Category */}
                            <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${getCategoryStyle(reward.category)}`}>
                                {reward.category}
                            </span>

                            {/* Stats */}
                            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <CheckCircle size={10} />
                                    <span>{reward.timesRedeemed} canjeados</span>
                                </div>
                            </div>

                            {/* Canjear Button */}
                            {reward.isActive && (
                                <button className="mt-2 w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-all">
                                    Canjear
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                                        ? 'bg-primary text-white'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {filteredRewards.length === 0 && (
                    <div className="text-center py-12">
                        <Gift className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No hay premios en esta categoría</p>
                    </div>
                )}
            </div>

            {/* Redeem Modal */}
            <RedeemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                reward={selectedReward}
                leaderboard={loyaltyData?.leaderboard || []}
                onSuccess={handleRedeemSuccess}
            />
        </>
    );
};

export default RewardsGrid;
