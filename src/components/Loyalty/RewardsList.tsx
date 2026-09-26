import React, { useState, useEffect } from 'react';
import { Gift, Sparkles, CheckCircle, Loader2, X, Search, AlertTriangle, User, ChevronLeft, ChevronRight, Plus, Trash2, Tag, FileText } from 'lucide-react';
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

interface CreateRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CATEGORIAS_SUGERIDAS = [
    { label: 'Uñas & Manos', val: 'Uñas', emoji: '💅' },
    { label: 'Pestañas & Cejas', val: 'Pestañas', emoji: '👁️' },
    { label: 'Cabello', val: 'Cabello', emoji: '💇‍♀️' },
    { label: 'Tratamiento', val: 'Tratamiento', emoji: '✨' },
    { label: 'Descuento', val: 'Descuento', emoji: '🏷️' },
    { label: 'Spa & Relax', val: 'Spa', emoji: '🌸' },
    { label: 'General', val: 'General', emoji: '🎁' },
];

// ===========================================
// Modal para Crear Nuevo Premio
// ===========================================
const CreateRewardModal: React.FC<CreateRewardModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [nombre, setNombre] = useState('');
    const [puntos, setPuntos] = useState<number | ''>(150);
    const [categoria, setCategoria] = useState('Uñas');
    const [descripcion, setDescripcion] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setNombre('');
            setPuntos(150);
            setCategoria('Uñas');
            setDescripcion('');
            setError(null);
            setIsSaving(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            setError('Ingresa el nombre del premio');
            return;
        }
        if (!puntos || puntos <= 0) {
            setError('Ingresa una cantidad de puntos válida (mayor a 0)');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await (loyalty as any).crearPremio({
                nombre: nombre.trim(),
                costo_puntos: Number(puntos),
                categoria,
                descripcion: descripcion.trim(),
            });

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error al guardar premio:', err);
            setError(err?.message || 'Error al guardar el premio en el catálogo');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-dark-card shadow-2xl border border-gray-100 dark:border-dark-border overflow-hidden flex flex-col z-10 animate-scale-up">
                
                {/* Header con gradiente temático */}
                <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-5 text-white">
                    <button 
                        onClick={onClose} 
                        className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                            <Gift className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black tracking-tight">Nuevo Premio</h3>
                            <p className="text-xs text-white/80">Agrégalo al catálogo de fidelización</p>
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                            <AlertTriangle size={15} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Nombre del Premio */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-purple-500" />
                            Nombre del Premio *
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Manicura Rusa Express o 15% Descuento"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all font-medium"
                        />
                    </div>

                    {/* Puntos Requeridos */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Sparkles size={13} className="text-amber-500" />
                                Puntos Requeridos para Canjear *
                            </span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                                {puntos ? `${puntos} pts` : ''}
                            </span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min={10}
                                step={10}
                                required
                                placeholder="150"
                                value={puntos}
                                onChange={(e) => setPuntos(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-bold"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">
                                PTS
                            </span>
                        </div>
                        {/* Accesos rápidos de puntos */}
                        <div className="flex gap-1.5 mt-2">
                            {[100, 150, 250, 400, 600].map(pt => (
                                <button
                                    type="button"
                                    key={pt}
                                    onClick={() => setPuntos(pt)}
                                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                        puntos === pt
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                    }`}
                                >
                                    {pt} pts
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <Tag size={13} className="text-indigo-500" />
                            Categoría del Premio
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {CATEGORIAS_SUGERIDAS.map(c => {
                                const isSel = categoria === c.val;
                                return (
                                    <button
                                        type="button"
                                        key={c.val}
                                        onClick={() => setCategoria(c.val)}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                            isSel
                                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
                                                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        <span>{c.emoji}</span>
                                        <span>{c.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Descripción Opcional */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                            <FileText size={13} className="text-gray-400" />
                            Descripción o Condiciones (opcional)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Ej. Válido de lunes a jueves. No acumulable con otras promociones."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-2 flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !nombre.trim()}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={14} />
                                    Guardar Premio
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

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
                <div className="bg-primary p-5 text-white flex-shrink-0">
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
// RewardsList Component — Store Grid (Mobile-First)
// ===========================================
const RewardsList: React.FC<RewardsListProps> = ({ rewards, isStaffMode, categoryId, leaderboard = [], maxItems = 8 }) => {
    const { refresh } = useDashboardData();
    const [filterCategory, setFilterCategory] = useState<string>('Todos');
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = maxItems;

    const categories = ['Todos', ...Array.from(new Set(rewards.map(r => r.category).filter(Boolean)))];

    const filteredRewards = rewards
        .filter(r => filterCategory === 'Todos' || r.category === filterCategory)
        .sort((a, b) => a.pointsCost - b.pointsCost);

    const totalPages = Math.ceil(filteredRewards.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedRewards = filteredRewards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
            case 'Pestañas': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
            case 'Tratamiento': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'Descuento': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const handleRedeemClick = (reward: Reward) => {
        setSelectedReward(reward);
        setIsModalOpen(true);
    };

    const handleDeleteReward = async (e: React.MouseEvent, rewardId: number) => {
        e.stopPropagation();
        if (!window.confirm('¿Seguro que deseas eliminar este premio del catálogo?')) return;
        setDeletingId(rewardId);
        try {
            await (loyalty as any).eliminarPremio(rewardId);
            await refresh(true);
        } catch (err) {
            console.error('Error al eliminar premio:', err);
            alert('No se pudo eliminar el premio.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm dark:border-dark-border dark:bg-dark-card transition-all">
                {/* Header con botón para agregar premio */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Gift className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white">Tienda de Premios</h3>
                                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                                    {rewards.filter(r => r.isActive).length} activos
                                </span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">Premios disponibles que tus clientas pueden canjear con sus puntos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                        <select
                            value={filterCategory}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="flex-1 sm:flex-initial rounded-xl bg-gray-50 px-2.5 py-2 text-xs font-semibold border border-gray-200 dark:border-dark-border dark:bg-dark-bg dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                            {categories.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                        </select>

                        {/* Botón "+ Nuevo Premio" */}
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm shadow-purple-500/20 active:scale-95 transition-all whitespace-nowrap"
                        >
                            <Plus size={15} />
                            <span>Nuevo Premio</span>
                        </button>
                    </div>
                </div>

                {filteredRewards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center dark:border-gray-800 dark:bg-gray-800/30">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-400 mb-3">
                            <Gift className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Aún no hay premios en este catálogo</p>
                        <p className="text-xs text-gray-500 max-w-xs mt-1 mb-4">Crea tu primer premio para que tus clientas acumulen puntos y los canjeen en sus visitas.</p>
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all shadow-sm"
                        >
                            <Plus size={14} />
                            <span>Crear Primer Premio</span>
                        </button>
                    </div>
                ) : (
                    <>
                        {/* 2-col store grid — mobile first */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {paginatedRewards.map((reward) => (
                                <div
                                    key={reward.id}
                                    className="group relative flex flex-col rounded-2xl border border-gray-100 dark:border-dark-border bg-gray-50/70 dark:bg-dark-bg overflow-hidden transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-500/40"
                                >
                                    {/* Action button para eliminar */}
                                    <button
                                        type="button"
                                        title="Eliminar premio"
                                        onClick={(e) => handleDeleteReward(e, reward.id)}
                                        disabled={deletingId === reward.id}
                                        className="absolute right-2 top-2 z-10 w-7 h-7 rounded-lg bg-white/80 dark:bg-dark-card/80 backdrop-blur-xs flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-white dark:hover:bg-dark-card transition-all opacity-0 group-hover:opacity-100 shadow-xs"
                                    >
                                        {deletingId === reward.id ? <Loader2 size={12} className="animate-spin text-rose-500" /> : <Trash2 size={13} />}
                                    </button>

                                    {/* Icon area */}
                                    <div className="flex items-center justify-center h-20 bg-gradient-to-br from-purple-50 via-purple-50/40 to-pink-50/50 dark:from-purple-900/15 dark:to-pink-900/10">
                                        <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white dark:bg-dark-card shadow-xs text-purple-600 dark:text-purple-400">
                                            <Gift className="h-5 w-5" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex flex-col flex-1 p-3 gap-1.5">
                                        <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                                            {reward.name}
                                        </p>
                                        {reward.category && (
                                            <span className={`self-start px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${getCategoryStyle(reward.category)}`}>
                                                {reward.category}
                                            </span>
                                        )}
                                        {reward.description && (
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                                                {reward.description}
                                            </p>
                                        )}

                                        {/* Points badge */}
                                        <div className="flex items-center gap-1 mt-auto pt-1">
                                            <Sparkles className="h-3 w-3 text-amber-500" />
                                            <span className="text-sm font-black text-amber-500">{reward.pointsCost}</span>
                                            <span className="text-[10px] text-gray-400 font-bold">pts</span>
                                        </div>

                                        {/* Canjear button */}
                                        <button
                                            onClick={() => handleRedeemClick(reward)}
                                            disabled={!reward.isActive}
                                            className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all mt-1 ${
                                                reward.isActive
                                                    ? 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95 shadow-xs'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {reward.isActive ? 'Canjear' : 'Inactivo'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredRewards.length)} de {filteredRewards.length}
                                </span>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de Canje */}
            <RedeemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                reward={selectedReward}
                leaderboard={leaderboard}
                onSuccess={() => refresh(true)}
                isStaffMode={isStaffMode}
                categoryId={categoryId}
            />

            {/* Modal para Crear Premio */}
            <CreateRewardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => refresh(true)}
            />
        </>
    );
};

export default RewardsList;
