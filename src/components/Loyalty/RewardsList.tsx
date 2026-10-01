import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, CheckCircle, Loader2, X, Search, AlertTriangle, User, ChevronLeft, ChevronRight, Plus, Trash2, Tag, FileText, BookOpen } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { loyalty } from '../../services/api';
import { ManualEstrategiaPremios } from './ManualEstrategiaPremios';

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
    initialTab?: 'formulario' | 'estrategia';
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
const CreateRewardModal: React.FC<CreateRewardModalProps> = ({ isOpen, onClose, onSuccess, initialTab = 'formulario' }) => {
    const [modalTab, setModalTab] = useState<'formulario' | 'estrategia'>(initialTab);
    const [nombre, setNombre] = useState('');
    const [puntos, setPuntos] = useState<number | ''>(150);
    const [categoria, setCategoria] = useState('Uñas');
    const [descripcion, setDescripcion] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setModalTab(initialTab);
            setNombre('');
            setPuntos(150);
            setCategoria('Uñas');
            setDescripcion('');
            setError(null);
            setIsSaving(false);
        } else {
            setModalTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Bloquear scroll de la página mientras el modal está abierto
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

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

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
            {/* Backdrop con desenfoque suave y captura táctil */}
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
                onClick={onClose} 
            />

            {/* Modal Container: Bottom sheet en móvil con altura fija y scroll interno contenido */}
            <div className="relative z-10 w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-3xl bg-white dark:bg-[#151821] shadow-2xl border-t border-x sm:border border-gray-200/80 dark:border-gray-800 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-slide-up sm:animate-scale-up">
                
                {/* Drag pill para móvil */}
                <div className="sm:hidden flex items-center justify-center pt-2.5 pb-1 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600">
                    <div className="w-10 h-1 rounded-full bg-white/40" />
                </div>

                {/* Header Premium y elegante */}
                <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 pt-3 pb-4 sm:p-5 text-white shrink-0">
                    {/* Botón cerrar flotante */}
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="absolute right-3.5 top-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-90 flex items-center justify-center text-white transition-all cursor-pointer shadow-xs"
                    >
                        <X size={18} />
                    </button>

                    <div className="flex items-center gap-3 pr-8">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20 shrink-0">
                            <Gift className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black tracking-wide uppercase text-purple-100">
                                <Sparkles size={9} /> Fidelización
                            </div>
                            <h3 className="text-base font-bold tracking-tight text-white leading-tight">Configuración de Premios</h3>
                            <p className="text-[11px] text-purple-100/80">Crea recompensas o aprende cómo calcular tus puntos sin perder dinero</p>
                        </div>
                    </div>

                    {/* Sub-pestañas dentro del Modal */}
                    <div className="flex items-center gap-1.5 mt-3.5 bg-black/20 p-1 rounded-xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => setModalTab('formulario')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                modalTab === 'formulario'
                                    ? 'bg-white text-purple-900 shadow-sm'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Gift size={13} />
                            <span>Crear Premio</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalTab('estrategia')}
                            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                modalTab === 'estrategia'
                                    ? 'bg-white text-purple-900 shadow-sm'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <BookOpen size={13} />
                            <span>Manual & Estrategia 💡</span>
                        </button>
                    </div>
                </div>

                {modalTab === 'estrategia' ? (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 overscroll-contain">
                            <ManualEstrategiaPremios
                                onAplicarSugerencia={(sugNombre, sugPuntos, sugCat, sugDesc) => {
                                    setNombre(sugNombre);
                                    setPuntos(sugPuntos);
                                    setCategoria(sugCat);
                                    setDescripcion(sugDesc);
                                    setModalTab('formulario');
                                }}
                            />
                        </div>
                        <div className="p-3.5 border-t border-gray-100 dark:border-gray-800/80 bg-white/95 dark:bg-[#151821]/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                            <span className="text-[11px] text-gray-500 font-medium">¿Listo para configurarlo?</span>
                            <button
                                type="button"
                                onClick={() => setModalTab('formulario')}
                                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <span>Ir al Formulario</span>
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Formulario con scroll independiente y botones fijos abajo */
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                        {/* Banner de acceso rápido al manual */}
                        <div className="px-4 sm:px-5 pt-3">
                            <button
                                type="button"
                                onClick={() => setModalTab('estrategia')}
                                className="w-full p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center justify-between gap-2 hover:bg-purple-100 transition-all cursor-pointer"
                            >
                                <span className="flex items-center gap-1.5">
                                    <BookOpen size={13} className="text-purple-600 shrink-0" />
                                    <span>¿No sabes cuántos puntos poner? Ver Manual de Estrategia</span>
                                </span>
                                <span className="text-[10px] uppercase font-black tracking-wider text-purple-600 underline">Ver Guía →</span>
                            </button>
                        </div>

                        {/* Cuerpo con scroll propio */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
                            {error && (
                                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                                    <AlertTriangle size={15} className="shrink-0 text-rose-500" />
                                    <span className="font-semibold">{error}</span>
                                </div>
                            )}

                            {/* Nombre del Premio */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-purple-500" />
                                        Nombre del Premio <span className="text-purple-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-gray-400 font-medium">Claro y atractivo</span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Manicura Rusa Express o 15% Descuento"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-black/20 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all font-medium"
                                />
                            </div>

                            {/* Puntos Requeridos */}
                            <div className="bg-amber-500/5 dark:bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/20 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                        <Sparkles size={12} className="text-amber-500" />
                                        Puntos para Canjear <span className="text-amber-500">*</span>
                                    </label>
                                    {puntos && (
                                        <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/20 px-2 py-0.5 rounded-full">
                                            {puntos} pts
                                        </span>
                                    )}
                                </div>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min={1}
                                        step={10}
                                        required
                                        placeholder="150"
                                        value={puntos}
                                        onChange={(e) => setPuntos(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                                        className="w-full pl-3.5 pr-12 py-2 rounded-xl border border-amber-300/80 dark:border-amber-500/30 bg-white dark:bg-black/30 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all font-black shadow-2xs"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-amber-500">
                                        PTS
                                    </span>
                                </div>

                                {/* Accesos rápidos de puntos */}
                                <div>
                                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-400 mb-1 uppercase tracking-wider">Sugerencias rápidas:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {[100, 150, 250, 400, 600].map(pt => (
                                            <button
                                                type="button"
                                                key={pt}
                                                onClick={() => setPuntos(pt)}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                                    puntos === pt
                                                        ? 'bg-amber-500 text-white shadow-xs'
                                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700/60 hover:border-amber-400'
                                                }`}
                                            >
                                                {pt} pts
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Categoría */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                        <Tag size={12} className="text-indigo-500" />
                                        Categoría
                                    </label>
                                    <span className="text-[10px] text-gray-400">Para filtrar</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {CATEGORIAS_SUGERIDAS.map(c => {
                                        const isSel = categoria === c.val;
                                        return (
                                            <button
                                                type="button"
                                                key={c.val}
                                                onClick={() => setCategoria(c.val)}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                                    isSel
                                                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40 font-bold'
                                                        : 'bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                <span className="text-xs">{c.emoji}</span>
                                                <span>{c.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Descripción Opcional */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                                    <FileText size={12} className="text-gray-400" />
                                    Condiciones o Descripción <span className="text-[10px] font-normal text-gray-400">(opcional)</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Ej. Válido de lunes a jueves. No acumulable."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-black/20 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        {/* Footer con botones de acción SIEMPRE FIJOS en la base (pb-safe para notch/barra móvil) */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800/80 bg-white/95 dark:bg-[#151821]/95 backdrop-blur-md flex items-center gap-2.5 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-center"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || !nombre.trim()}
                                className="flex-[1.5] py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
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
                )}
            </div>
        </div>,
        document.body
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

    // Bloquear scroll de la página mientras el modal de canje está abierto
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
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

    if (!isOpen || typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" onClick={onClose} />
            <div className="relative z-10 w-full sm:max-w-md rounded-t-[2rem] sm:rounded-2xl bg-white dark:bg-dark-card shadow-2xl border-t border-x sm:border border-gray-200 dark:border-dark-border overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-slide-up sm:animate-scale-up">
                
                {/* Drag pill para móvil */}
                <div className="sm:hidden flex items-center justify-center pt-2.5 pb-1 bg-primary">
                    <div className="w-10 h-1 rounded-full bg-white/40" />
                </div>

                <div className="bg-primary p-5 text-white flex-shrink-0 relative">
                    <button onClick={onClose} className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors cursor-pointer">
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-2 mb-1">
                        <Gift className="h-5 w-5" />
                        <h3 className="font-bold text-base">Canjear Premio</h3>
                    </div>
                    <p className="text-white/90 text-sm font-medium">{reward?.name}</p>
                    <div className="mt-2 flex items-center gap-1.5 font-bold text-white bg-white/20 w-fit px-2.5 py-1 rounded-lg text-xs">
                        <Sparkles size={14} />
                        {reward?.pointsCost} puntos
                    </div>
                </div>

                <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
                    {success ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center h-full">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">¡Canje Exitoso!</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">{success}</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex gap-2 text-red-700 dark:text-red-400 text-xs items-center">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 dark:bg-dark-bg transition-colors dark:text-white"
                                />
                            </div>

                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
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
                                                className={`w-full text-left p-2.5 rounded-xl border transition-all ${isSelected
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : hasEnoughPoints
                                                        ? 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                                                        : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                                            {clientInitial}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white text-xs">{client.name || 'Sin nombre'}</p>
                                                            <p className="text-[10px] text-gray-500">{client.phone || 'Sin teléfono'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`flex items-center gap-1 ${hasEnoughPoints ? 'text-primary' : 'text-red-500'}`}>
                                                            <Sparkles size={11} />
                                                            <span className="font-bold text-xs">{client.points}</span>
                                                        </div>
                                                        {!hasEnoughPoints && <p className="text-[9px] text-red-500">Faltan {reward!.pointsCost - client.points}</p>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-6 text-gray-400">
                                        <User className="mx-auto h-7 w-7 mb-1 opacity-50" />
                                        <p className="text-xs">No se encontraron clientes</p>
                                    </div>
                                )}
                            </div>

                            {selectedClient && reward && (
                                <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs">
                                    <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">Resumen del Canje:</p>
                                    <div className="flex justify-between py-0.5"><span>Puntos actuales:</span><span className="font-bold">{selectedClient.points}</span></div>
                                    <div className="flex justify-between py-0.5"><span>Costo:</span><span className="font-bold text-red-500">-{reward.pointsCost}</span></div>
                                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-1 mt-1"><span>Restantes:</span><span className="font-bold text-primary">{selectedClient.points - reward.pointsCost} pts</span></div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {!success && (
                    <div className="p-3.5 border-t border-gray-100 dark:border-gray-700 flex gap-2.5 flex-shrink-0 bg-white/95 dark:bg-dark-card/95 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
                        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50">Cancelar</button>
                        <button
                            onClick={handleRedeem}
                            disabled={!canRedeem || isLoading}
                            className={`flex-[1.4] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${canRedeem && !isLoading ? 'bg-primary text-white hover:bg-primary/90 active:scale-95 shadow-xs' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                        >
                            {isLoading ? <><Loader2 size={14} className="animate-spin" />Canjeando...</> : <><Gift size={14} />Confirmar Canje</>}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
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
    const [createModalTab, setCreateModalTab] = useState<'formulario' | 'estrategia'>('formulario');
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

                        {/* Botón "Manual de Estrategia" */}
                        <button
                            type="button"
                            onClick={() => {
                                setCreateModalTab('estrategia');
                                setIsCreateModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/60 text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                            title="Aprende cuántos puntos poner y cómo no perder dinero"
                        >
                            <BookOpen size={14} className="text-amber-600 dark:text-amber-400" />
                            <span className="hidden sm:inline">Manual de Estrategia</span>
                            <span className="sm:hidden">Estrategia</span>
                        </button>

                        {/* Botón "+ Nuevo Premio" */}
                        <button
                            type="button"
                            onClick={() => {
                                setCreateModalTab('formulario');
                                setIsCreateModalOpen(true);
                            }}
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
                initialTab={createModalTab}
            />
        </>
    );
};

export default RewardsList;
