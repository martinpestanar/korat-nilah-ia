import React, { useState, useEffect } from 'react';
import { 
    X, Phone, Calendar, AlertCircle, CheckCircle2, MessageCircle, FileText, 
    Trash2, Clock, Shield, ShieldAlert, ShieldCheck, Bot, BotOff, Edit2, Loader2,
    Sparkles, Crown, Star, Gift, ChevronRight, User, ExternalLink, Zap,
    Eye, Scissors, HeartPulse
} from 'lucide-react';
import { Client } from '../../context/DashboardDataContext';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';
import { BottomSheet } from '../UI/BottomSheet';
import { FichaTecnicaEditor, FichaTecnicaData } from './FichaTecnicaEditor';

const STATUS_COLORS: Record<string, string> = {
    'Completada': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40',
    'Programada': 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/40',
    'Anulada': 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40',
    'Reagendada': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40',
};

interface ClientInsights {
    avgTicketRecent?: number | null;
    frequencyDays?: number | null;
    cancelRate90?: number | null;
    noShow90?: number | null;
    favoriteService?: string | null;
    favoriteCategory?: string | null;
    favoriteStaff?: string | null;
    lastVisit?: string | null;
    nextVisit?: { date: string; service?: string | null; staff?: string | null } | null;
}

interface ClientModalProps {
    client: Client;
    isOpen: boolean;
    onClose: () => void;
    onSaveNotes: (notes: string) => void;
    clientNotes: string;
    insights?: ClientInsights | null;
    totalSpent: number;
    nextAppointment: any | null;
    history: any[];
    isAdmin: boolean;
    onDelete: () => void;
    onToggleBot?: (clienteId: number, pausado: boolean) => void;
    ratingAvg?: number | null;
    totalRedemptions?: number;
    isStaffMode?: boolean;
    isStaff?: boolean;
    onUpdateClient?: (id: number, data: any) => Promise<void>;
}

export const ClientModal: React.FC<ClientModalProps> = ({
    client, isOpen, onClose, onSaveNotes, clientNotes, insights,
    totalSpent, nextAppointment, history, isAdmin, onDelete, onToggleBot,
    ratingAvg, totalRedemptions, isStaffMode, isStaff, onUpdateClient
}) => {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState(clientNotes);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [botPausado, setBotPausado] = useState(client.bot_pausado ?? false);
    const [botToggling, setBotToggling] = useState(false);
    const { formatValue } = useCurrency();

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(client.nombre);
    const [editPhone, setEditPhone] = useState(client.telefono || '');
    const [editBirthday, setEditBirthday] = useState(client.cumpleanos || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'perfil' | 'ficha' | 'historial' | 'puntos'>('perfil');

    useEffect(() => {
        setEditName(client.nombre);
        setEditPhone(client.telefono || '');
        setEditBirthday(client.cumpleanos || '');
        setBotPausado(client.bot_pausado ?? false);
        setTempNotes(clientNotes);
    }, [client, clientNotes]);

    const handleSaveProfile = async () => {
        if (!editName.trim() || !editPhone.trim()) {
            setProfileError('Nombre y teléfono son obligatorios');
            return;
        }
        if (editPhone.includes('+')) {
            setProfileError('El teléfono no debe contener el símbolo +');
            return;
        }
        setProfileError(null);
        setIsSavingProfile(true);
        try {
            await onUpdateClient?.(client.id, { nombre: editName.trim(), telefono: editPhone.trim(), cumpleanos: editBirthday || null });
            setIsEditingProfile(false);
        } catch (e: any) {
            setProfileError('Error al guardar. Verifica que el teléfono no esté duplicado.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveFichaTecnica = async (fichaData: FichaTecnicaData) => {
        try {
            await onUpdateClient?.(client.id, { ficha_tecnica: fichaData });
        } catch (e) {
            console.error('Error actualizando ficha técnica:', e);
            throw e;
        }
    };

    const handleToggleBot = async () => {
        setBotToggling(true);
        const nuevoEstado = !botPausado;
        try {
            const { error } = await supabase.rpc('toggle_bot_cliente', {
                p_cliente_id: client.id,
                p_pausado: nuevoEstado,
                p_horas_reactivacion: nuevoEstado ? 24 : null,
                p_razon: nuevoEstado ? 'Pausado manualmente desde CRM' : null
            });
            if (!error) {
                setBotPausado(nuevoEstado);
                onToggleBot?.(client.id, nuevoEstado);
            } else {
                console.error('Error toggling bot:', error);
            }
        } catch (e) {
            console.error('Error toggling bot:', e);
        } finally {
            setBotToggling(false);
        }
    };

    if (!isOpen) return null;

    const diasAusente = client.dias_ausente || 0;
    const cooldownInfo = client.bloqueado_hasta && new Date(client.bloqueado_hasta) > new Date()
        ? Math.ceil((new Date(client.bloqueado_hasta).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const cleanPhone = client.telefono ? client.telefono.replace(/\s+/g, '').replace('+', '') : '';

    // Color badges based on category / lifecycle
    const getCategoryBadge = (cat?: string) => {
        const lower = (cat || '').toLowerCase();
        if (lower.includes('vip') || lower.includes('platino')) {
            return { label: cat || 'VIP', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Crown };
        }
        if (lower.includes('fiel') || lower.includes('recurrente')) {
            return { label: cat || 'Fiel', bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: Sparkles };
        }
        if (lower.includes('nueva') || lower.includes('nuevo')) {
            return { label: cat || 'Nuevo', bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20', icon: Zap };
        }
        return { label: cat || 'Regular', bg: 'bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20', icon: User };
    };

    const categoryBadge = getCategoryBadge(client.categoria);
    const CategoryIcon = categoryBadge.icon;

    // Ficha Tecnica Helper for Profile Tab preview
    const ficha = (client.ficha_tecnica || {}) as FichaTecnicaData;
    const hasLashFicha = ficha.lash && (ficha.lash.efecto || ficha.lash.curvatura || ficha.lash.mapeo || ficha.lash.tecnica);
    const hasNailsFicha = ficha.nails && (ficha.nails.sistema || ficha.nails.largo || ficha.nails.forma || ficha.nails.tono_favorito);
    const hasBrowsFicha = ficha.brows && (ficha.brows.servicio || ficha.brows.tono_pigmento);
    const hasAnyFicha = hasLashFicha || hasNailsFicha || hasBrowsFicha;

    const headerActions = (
        <div className="flex items-center gap-1">
            {(isAdmin || isStaffMode) && !isStaff && !isEditingProfile && (
                <button
                    onClick={() => {
                        setEditName(client.nombre);
                        setEditPhone(client.telefono || '');
                        setEditBirthday((client as any).cumpleanos || '');
                        setProfileError(null);
                        setIsEditingProfile(true);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:scale-95 transition-all"
                    title="Editar perfil"
                >
                    <Edit2 className="h-4.5 w-4.5" />
                </button>
            )}
            {isAdmin && (
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 active:scale-95 transition-all"
                    title="Eliminar cliente"
                >
                    <Trash2 className="h-4.5 w-4.5" />
                </button>
            )}
        </div>
    );

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title=""
            showCloseButton={true}
            headerActions={headerActions}
        >
            <div className="flex flex-col pb-6 px-4 sm:px-6">
                {/* Delete confirmation modal overlay */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-zinc-800 space-y-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400 mx-auto">
                                <Trash2 className="h-6 w-6" />
                            </div>
                            <div className="text-center space-y-1">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white">¿Eliminar cliente?</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Esta acción eliminará a <strong>{client.nombre}</strong> del sistema.
                                </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 active:scale-98 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete();
                                        setShowDeleteConfirm(false);
                                        onClose();
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700 active:scale-98 transition-all shadow-md shadow-rose-600/30"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Native Hero Profile Header ── */}
                <div className="pt-1 pb-4">
                    {isEditingProfile ? (
                        <div className="bg-gray-50 dark:bg-zinc-950/60 rounded-2xl p-4 border border-gray-200/60 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Edit2 className="h-4 w-4 text-indigo-500" /> Editar Ficha del Cliente
                                </h3>
                                <button
                                    onClick={() => setIsEditingProfile(false)}
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    Cancelar
                                </button>
                            </div>
                            {profileError && (
                                <div className="text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200/50">
                                    {profileError}
                                </div>
                            )}
                            <div className="space-y-2.5">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Nombre completo</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full text-sm rounded-xl border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Nombre del cliente"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Teléfono / WhatsApp</label>
                                    <input
                                        type="text"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        className="w-full text-sm rounded-xl border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Ej: 51987654321"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 block">Cumpleaños <span className="text-gray-400 font-normal">(opcional)</span></label>
                                    <input
                                        type="date"
                                        value={editBirthday}
                                        onChange={(e) => setEditBirthday(e.target.value)}
                                        className="w-full text-sm rounded-xl border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2.5 font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => setIsEditingProfile(false)}
                                    disabled={isSavingProfile}
                                    className="flex-1 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-bold py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 active:scale-98 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-indigo-700 active:scale-98 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                                >
                                    {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-3">
                            {/* Avatar with gradient ring */}
                            <div className="relative">
                                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white text-3xl font-black shadow-lg shadow-indigo-500/25 ring-4 ring-white dark:ring-zinc-900">
                                    {client.nombre ? client.nombre.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white dark:ring-zinc-900 ${
                                    diasAusente <= 30 ? 'bg-emerald-500 text-white' : diasAusente <= 60 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                                }`} title={diasAusente <= 30 ? 'Cliente Activo' : diasAusente <= 60 ? 'En Riesgo' : 'Inactivo'}>
                                    <div className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                                </div>
                            </div>

                            {/* Name & Badges */}
                            <div className="space-y-1 max-w-full">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate px-2">
                                    {client.nombre}
                                </h2>

                                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${categoryBadge.bg}`}>
                                        <CategoryIcon className="h-3.5 w-3.5" />
                                        {categoryBadge.label}
                                    </span>

                                    {client.telefono && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                                            <Phone className="h-3 w-3" /> {client.telefono}
                                        </span>
                                    )}

                                    {client.cumpleanos && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-200/50 dark:border-pink-800/30 px-2.5 py-0.5 text-xs font-bold text-pink-600 dark:text-pink-400">
                                            🎂 {new Date(client.cumpleanos).toLocaleDateString('es-ES', { timeZone: 'UTC', day: '2-digit', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Native Quick Action Buttons Bar */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full pt-1">
                                {cleanPhone ? (
                                    <a
                                        href={`https://wa.me/${cleanPhone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-97 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                                    >
                                        <MessageCircle className="h-4 w-4 fill-white/20" />
                                        WhatsApp
                                    </a>
                                ) : (
                                    <button disabled className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gray-200 dark:bg-zinc-800 text-gray-400 font-bold text-xs opacity-50 cursor-not-allowed">
                                        <MessageCircle className="h-4 w-4" />
                                        WhatsApp
                                    </button>
                                )}

                                {cleanPhone ? (
                                    <a
                                        href={`tel:${cleanPhone}`}
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-97 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
                                    >
                                        <Phone className="h-4 w-4" />
                                        Llamar
                                    </a>
                                ) : (
                                    <button disabled className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-gray-200 dark:bg-zinc-800 text-gray-400 font-bold text-xs opacity-50 cursor-not-allowed">
                                        <Phone className="h-4 w-4" />
                                        Llamar
                                    </button>
                                )}

                                <button
                                    onClick={handleToggleBot}
                                    disabled={botToggling}
                                    className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl font-bold text-xs transition-all border ${
                                        botPausado
                                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                                    } active:scale-97`}
                                >
                                    {botToggling ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : botPausado ? (
                                        <>
                                            <BotOff className="h-4 w-4 text-rose-500" />
                                            <span>Bot: Inactivo</span>
                                        </>
                                    ) : (
                                        <>
                                            <Bot className="h-4 w-4 text-emerald-500" />
                                            <span>Bot: Activo</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Native Quick Metrics 2x2 Cards (100% Mobile Responsive) ── */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {/* Card 1: LTV */}
                    <div className="bg-gray-50 dark:bg-zinc-900/80 rounded-2xl p-3 border border-gray-100 dark:border-zinc-800 flex flex-col justify-between min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">LTV Gastado</span>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">💰 Total</span>
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate whitespace-nowrap">
                                {formatValue(totalSpent || client.ltv || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Visitas */}
                    <div className="bg-gray-50 dark:bg-zinc-900/80 rounded-2xl p-3 border border-gray-100 dark:border-zinc-800 flex flex-col justify-between min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">Visitas Citas</span>
                            <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 shrink-0">
                                {client.total_visitas > 0 ? `${formatValue((totalSpent || client.ltv || 0) / client.total_visitas)}/tk` : '0 visitas'}
                            </span>
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                            <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate whitespace-nowrap">
                                {client.total_visitas || 0} <span className="text-xs font-bold text-gray-400">visitas</span>
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Fiabilidad Score */}
                    <div className="bg-gray-50 dark:bg-zinc-900/80 rounded-2xl p-3 border border-gray-100 dark:border-zinc-800 flex flex-col justify-between min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">Fiabilidad</span>
                            {(client.fiabilidad_score ?? 100) < 50 ? (
                                <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0" />
                            ) : (client.fiabilidad_score ?? 100) < 80 ? (
                                <Shield className="h-4 w-4 text-amber-500 shrink-0" />
                            ) : (
                                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                            )}
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                            <span className={`text-base sm:text-lg font-black truncate whitespace-nowrap ${
                                (client.fiabilidad_score ?? 100) < 50 ? 'text-rose-600' :
                                (client.fiabilidad_score ?? 100) < 80 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                                {client.fiabilidad_score ?? 100}<span className="text-xs font-bold text-gray-400">/100</span>
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Puntos & Ratings */}
                    <div className="bg-gray-50 dark:bg-zinc-900/80 rounded-2xl p-3 border border-gray-100 dark:border-zinc-800 flex flex-col justify-between min-w-0">
                        <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">Puntos & Rating</span>
                            {ratingAvg != null ? (
                                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5 shrink-0">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {ratingAvg.toFixed(1)}
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-400 shrink-0">Sin calificar</span>
                            )}
                        </div>
                        <div className="mt-1.5 flex items-baseline justify-between gap-1 min-w-0">
                            <span className="text-base sm:text-lg font-black text-amber-500 truncate whitespace-nowrap">
                                {client.puntos || 0} <span className="text-xs font-bold text-amber-500/70">pts</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Native Segmented Control Tabs (iOS Style 100% Uniform) ── */}
                <div className="bg-gray-100 dark:bg-zinc-900/90 p-1 rounded-2xl grid grid-cols-4 gap-1 text-xs font-bold mb-4">
                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`py-2 px-1 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-center truncate ${
                            activeTab === 'perfil'
                                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Perfil</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('ficha')}
                        className={`py-2 px-1 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-center relative truncate ${
                            activeTab === 'ficha'
                                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">Ficha</span>
                        {hasAnyFicha && (
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 absolute top-1.5 right-1.5" />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`py-2 px-1 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-center truncate ${
                            activeTab === 'historial'
                                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Historial</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('puntos')}
                        className={`py-2 px-1 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-center truncate ${
                            activeTab === 'puntos'
                                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <Gift className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Puntos</span>
                    </button>
                </div>

                {/* ── Tab Body Content ── */}
                <div className="space-y-4">
                    {/* ── TAB 1: PERFIL ── */}
                    {activeTab === 'perfil' && (
                        <>
                            {/* Beauty & Ficha Técnica Summary Card */}
                            <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 rounded-2xl p-4 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Sparkles className="h-4 w-4 text-indigo-500" />
                                        Ficha Técnica Beauty
                                    </h4>
                                    <button
                                        onClick={() => setActiveTab('ficha')}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                                    >
                                        {hasAnyFicha ? 'Editar Ficha' : '+ Registrar'}
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {hasAnyFicha ? (
                                    <div className="space-y-2 pt-0.5">
                                        {hasLashFicha && (
                                            <div className="flex items-center gap-2 text-xs bg-white/70 dark:bg-zinc-900/70 p-2 rounded-xl border border-indigo-100 dark:border-zinc-800">
                                                <span className="font-bold text-indigo-700 dark:text-indigo-300 shrink-0">👁️ Lash:</span>
                                                <span className="text-gray-700 dark:text-gray-200 truncate">
                                                    {[ficha.lash?.efecto, ficha.lash?.curvatura && `Curva ${ficha.lash.curvatura}`, ficha.lash?.mapeo, ficha.lash?.tecnica].filter(Boolean).join(' • ')}
                                                </span>
                                            </div>
                                        )}
                                        {hasNailsFicha && (
                                            <div className="flex items-center gap-2 text-xs bg-white/70 dark:bg-zinc-900/70 p-2 rounded-xl border border-pink-100 dark:border-zinc-800">
                                                <span className="font-bold text-pink-700 dark:text-pink-300 shrink-0">💅 Nails:</span>
                                                <span className="text-gray-700 dark:text-gray-200 truncate">
                                                    {[ficha.nails?.sistema, ficha.nails?.largo, ficha.nails?.forma, ficha.nails?.tono_favorito].filter(Boolean).join(' • ')}
                                                </span>
                                            </div>
                                        )}
                                        {hasBrowsFicha && (
                                            <div className="flex items-center gap-2 text-xs bg-white/70 dark:bg-zinc-900/70 p-2 rounded-xl border border-amber-100 dark:border-zinc-800">
                                                <span className="font-bold text-amber-700 dark:text-amber-300 shrink-0">🪞 Cejas:</span>
                                                <span className="text-gray-700 dark:text-gray-200 truncate">
                                                    {[ficha.brows?.servicio, ficha.brows?.tono_pigmento].filter(Boolean).join(' • ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => setActiveTab('ficha')}
                                        className="cursor-pointer bg-white/60 dark:bg-zinc-900/40 border border-dashed border-indigo-200 dark:border-zinc-800 rounded-xl p-3 text-center space-y-1 hover:border-indigo-400 transition-colors"
                                    >
                                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            Sin ficha técnica registrada
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            Toca para registrar mapeo de pestañas, largo de uñas o tonos favoritos
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Bot Status Banner Card */}
                            <div className={`rounded-2xl p-4 border transition-all ${
                                botPausado
                                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                                    : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl ${botPausado ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'}`}>
                                            {botPausado ? <BotOff className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                                Respuesta Automática Nilah IA
                                                <span className={`inline-block h-2 w-2 rounded-full ${botPausado ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                            </h4>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                {botPausado
                                                    ? 'Bot pausado. Responde manualmente en WhatsApp.'
                                                    : 'Bot activo atendiendo y agendando automáticamente.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleToggleBot}
                                        disabled={botToggling}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${botPausado ? 'bg-gray-300 dark:bg-zinc-700' : 'bg-emerald-500'}`}
                                    >
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${botPausado ? 'translate-x-0' : 'translate-x-5'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Alerta de Retención (Ausente) */}
                            {diasAusente >= 45 && (
                                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/40 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">⚠️ Cliente Inactivo ({diasAusente} días)</h4>
                                            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                                                No realiza citas hace más de 45 días.
                                            </p>
                                            {client.rescate_exitoso ? (
                                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Campaña de rescate exitosa
                                                </div>
                                            ) : cooldownInfo ? (
                                                <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
                                                    Cooldown de rescate: {cooldownInfo} días restantes.
                                                </p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Alerta de Fiabilidad Baja */}
                            {(client.fiabilidad_score ?? 100) < 50 && (
                                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 dark:bg-rose-950/20 dark:border-rose-900/40 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600">
                                            <ShieldAlert className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">Solicitar Pago Adelantado</h4>
                                            <p className="text-xs text-rose-800 dark:text-rose-400 leading-relaxed">
                                                Score de fiabilidad bajo (<strong>{client.fiabilidad_score ?? 100}/100</strong>) por inasistencias o cancelaciones tardías.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Section: Client Notes */}
                            <div className="bg-gray-50 dark:bg-zinc-900/60 rounded-2xl p-4 border border-gray-100 dark:border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <FileText className="h-4 w-4 text-indigo-500" />
                                        Notas & Preferencias
                                    </h4>
                                    {!isEditingNotes && !isStaff && (
                                        <button
                                            onClick={() => setIsEditingNotes(true)}
                                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                        >
                                            Editar
                                        </button>
                                    )}
                                </div>

                                {isEditingNotes ? (
                                    <div className="space-y-2 pt-1">
                                        <textarea
                                            value={tempNotes}
                                            onChange={(e) => setTempNotes(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                            placeholder="Preferencias del cliente, alergias, colores favoritos, observaciones..."
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => { setTempNotes(clientNotes); setIsEditingNotes(false); }}
                                                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => { onSaveNotes(tempNotes); setIsEditingNotes(false); }}
                                                className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 active:scale-98 transition-all shadow-sm"
                                            >
                                                Guardar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pt-0.5">
                                        {clientNotes || <span className="text-gray-400 italic">Sin notas u observaciones registradas...</span>}
                                    </p>
                                )}
                            </div>

                            {/* Additional metadata info */}
                            {client.origen_captacion && (
                                <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 text-gray-500 dark:text-gray-400">
                                    <span>Origen de Captación:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200 uppercase">
                                        {client.origen_captacion}
                                    </span>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── TAB 2: FICHA TÉCNICA ESPECIALIZADA ── */}
                    {activeTab === 'ficha' && (
                        <FichaTecnicaEditor
                            initialData={client.ficha_tecnica}
                            onSave={handleSaveFichaTecnica}
                            readOnly={isStaff && !isAdmin && !isStaffMode}
                        />
                    )}

                    {/* ── TAB 3: HISTORIAL ── */}
                    {activeTab === 'historial' && (
                        <>
                            {/* Next Appointment Card */}
                            {nextAppointment && (
                                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
                                            <Calendar className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                                Próxima Cita Agendada
                                            </span>
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                {nextAppointment.servicio}
                                            </h4>
                                            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                                {new Date(nextAppointment.fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* History List */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5 px-1">
                                    <Clock className="h-4 w-4 text-indigo-500" />
                                    Historial de Citas ({history.length})
                                </h4>

                                {history.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                        {history.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/80 hover:border-gray-200 transition-all"
                                            >
                                                <div className="space-y-0.5 min-w-0 pr-2">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                        {apt.servicio}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(apt.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${STATUS_COLORS[apt.estado] || 'bg-gray-100 text-gray-600'}`}>
                                                    {apt.estado}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 dark:bg-zinc-900/40 rounded-2xl border border-gray-100 dark:border-zinc-800">
                                        <Clock className="h-8 w-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Sin citas previas registradas</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── TAB 4: PUNTOS ── */}
                    {activeTab === 'puntos' && (
                        <>
                            {/* Loyalty Stats Card */}
                            <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-4 border border-amber-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                                            <Crown className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-900 dark:text-white">Programa de Puntos</h4>
                                            <p className="text-[10px] text-gray-500">Puntos acumulados por visitas</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-black text-amber-500">{client.puntos || 0} pts</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Días ausente</span>
                                    <p className={`text-lg font-black ${diasAusente > 45 ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                                        {diasAusente} días
                                    </p>
                                </div>

                                <div className="bg-gray-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Canjes realizados</span>
                                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                        {totalRedemptions || 0} canjes
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </BottomSheet>
    );
};




