/**
 * RewardsList Component
 * 
 * Catálogo de premios en formato lista con puntos a la derecha.
 * Diseño original restaurado con funcionalidad de canje.
 */

import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, CheckCircle, Filter, Loader2, X, Search, AlertTriangle, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { loyalty } from '../../services/api';

interface LoyaltyClient {
    id: number;
    name: string;
    phone: string;
    points: number;
    totalVisits: number;
    category: string;
    lastVisit: string;
    pointsThisMonth: number;
}

interface Reward {
    id: number;
    name: string;
    pointsCost: number;
    description: string;
    category: string;
    isActive: boolean;
    timesRedeemed: number;
}

interface RewardsListProps {
    rewards: Reward[];
    isStaffMode?: boolean;
    categoryId?: number | null;
    leaderboard?: LoyaltyClient[];
    maxItems?: number;
}

interface RedeemModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: Reward | null;
    leaderboard: LoyaltyClient[];
    onSuccess: () => void;
    isStaffMode?: boolean;
    categoryId?: number | null;
}

// ===========================================
// Modal de Canje
// ===========================================
const RedeemModal: React.FC<RedeemModalProps> = ({ isOpen, onClose, reward, leaderboard, onSuccess, isStaffMode, categoryId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<LoyaltyClient | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredClients = leaderboard.filter(c => {
        const nombreMatch = c.name ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        const telefonoMatch = c.phone ? c.phone.includes(searchTerm) : false;
        return nombreMatch || telefonoMatch;
    });

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
            let response;
            if (isStaffMode && categoryId) {
                response = await loyalty.canjearPorCategoria(selectedClient.id, reward.id, categoryId);
            } else {
                response = await loyalty.canjear(selectedClient.id, reward.id);
            }
            if (response.success) {
                setSuccess(`¡Listo! ${selectedClient.name} canjeó "${reward.name}". Le quedan ${response.canje?.puntos_restantes || 0} puntos.`);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                setError(response.error || 'Error al canjear el premio');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectClient = (client: LoyaltyClient) => {
        if (reward && client.points >= reward.pointsCost) {
            setSelectedClient(client);
        }
    };

    const canRedeem = selectedClient && reward && selectedClient.points >= reward.pointsCost;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-dark-card overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-gradient-to-r from-primary to-purple-500 p-5 text-white flex-shrink-0">
                    <button onClick={onClose} className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                        <Gift className="h-5 w-5" />
                        <h3 className="font-semibold">Canjear Premio</h3>
                    </div>
                    <p className="text-white/90 text-sm font-medium">{reward?.name}</p>
                    <div className="mt-2 flex items-center gap-1.5 font-bold text-white bg-white/20 w-fit px-2 py-1 rounded">
                        <Sparkles size={14} />
                        {reward?.pointsCost} puntos
                    </div>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    {success ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center h-full">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <h4 className="lg font-bold text-gray-900 dark:text-white mb-2">¡Canje Exitoso!</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{success}</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex gap-2 text-red-700 dark:text-red-400 text-sm">
                                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-dark-bg transition-colors dark:text-white"
                                />
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map((client, index) => {
                                        const hasEnoughPoints = reward && client.points >= reward.pointsCost;
                                        const isSelected = selectedClient?.id === client.id;
                                        const clientInitial = client.name ? client.name.charAt(0).toUpperCase() : '?';

                                        // Prevención de duplicate keys si vienen IDs repetidos de la base de datos
                                        const uniqueKey = client.id ? `${client.id}-${index}` : `client-${index}`;

                                        return (
                                            <button
                                                key={uniqueKey}
                                                onClick={() => handleSelectClient(client)}
                                                disabled={!hasEnoughPoints}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : hasEnoughPoints
                                                        ? 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                                        : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                                            {clientInitial}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white text-sm">{client.name || 'Sin nombre'}</p>
                                                            <p className="text-xs text-gray-500">{client.phone || 'Sin teléfono'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`flex items-center gap-1 ${hasEnoughPoints ? 'text-primary' : 'text-red-500'}`}>
                                                            <Sparkles size={12} />
                                                            <span className="font-bold text-sm">{client.points}</span>
                                                        </div>
                                                        {!hasEnoughPoints && <p className="text-[10px] text-red-500">Faltan {reward!.pointsCost - client.points}</p>}
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

                            {selectedClient && reward && (
                                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 mb-1">Resumen:</p>
                                    <div className="flex justify-between text-sm"><span>Puntos actuales:</span><span className="font-bold">{selectedClient.points}</span></div>
                                    <div className="flex justify-between text-sm"><span>Costo:</span><span className="font-bold text-red-500">-{reward.pointsCost}</span></div>
                                    <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-600 pt-1 mt-1"><span>Restantes:</span><span className="font-bold text-primary">{selectedClient.points - reward.pointsCost}</span></div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!success && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3 flex-shrink-0">
                        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50">Cancelar</button>
                        <button
                            onClick={handleRedeem}
                            disabled={!canRedeem || isLoading}
                            className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 ${canRedeem && !isLoading ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
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
// RewardsList Component
// ===========================================
const RewardsList: React.FC<RewardsListProps> = ({ rewards, isStaffMode, categoryId, leaderboard = [], maxItems = 7 }) => {
    const { loyalty: loyaltyData, refresh } = useDashboardData();
    const [filterCategory, setFilterCategory] = useState<string>('Todos');
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = maxItems;

    const categories = ['Todos', ...Array.from(new Set(rewards.map(r => r.category)))];

    const filteredRewards = rewards
        .filter(r => filterCategory === 'Todos' || r.category === filterCategory)
        .sort((a, b) => a.pointsCost - b.pointsCost);

    // Paginación
    const totalPages = Math.ceil(filteredRewards.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRewards = filteredRewards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset página cuando cambia el filtro
    const handleFilterChange = (category: string) => {
        setFilterCategory(category);
        setCurrentPage(1);
    };

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

    return (
        <>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-purple-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Catálogo de Premios</h3>
                        <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                            {rewards.filter(r => r.isActive).length} activos
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={filterCategory}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white"
                        >
                            {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>
                    </div>
                </div>

                {filteredRewards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
                        <Gift className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">No hay premios</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Prueba cambiando el filtro de categoría.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {paginatedRewards.map((reward) => (
                            <div
                                key={reward.id}
                                className="group flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:border-purple-200 hover:shadow-md dark:border-gray-800 dark:hover:border-purple-500/30"
                            >
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                                        <Gift className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {reward.name}
                                            </h4>
                                            {reward.category && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium tracking-wide ${getCategoryStyle(reward.category)}`}>
                                                    {reward.category}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {reward.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex w-full sm:w-auto items-center justify-between gap-4 border-t border-gray-100 sm:border-0 pt-4 sm:pt-0 dark:border-gray-800">
                                    <div className="flex flex-col sm:items-end">
                                        <div className="flex items-center gap-1.5 text-primary text-lg font-bold">
                                            <Sparkles className="h-4 w-4" />
                                            {reward.pointsCost}
                                        </div>
                                        <span className="text-[10px] uppercase tracking-wider font-medium text-gray-400 whitespace-nowrap">
                                            {reward.timesRedeemed} canjes
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRedeemClick(reward)}
                                        disabled={!reward.isActive}
                                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-primary hover:text-white dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        Canjear
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredRewards.length)} de {filteredRewards.length}
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
                )}
            </div>

            <RedeemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                reward={selectedReward}
                leaderboard={leaderboard}
                onSuccess={() => refresh(true)}
                isStaffMode={isStaffMode}
                categoryId={categoryId}
            />
        </>
    );
};

export default RewardsList;
