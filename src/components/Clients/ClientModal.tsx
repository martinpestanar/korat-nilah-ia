import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Calendar, AlertCircle, CheckCircle2, MessageCircle, FileText, Trash2, Clock, ShieldAlert, ShieldCheck, Bot, BotOff, Edit2, Loader2 } from 'lucide-react';
import { Client } from '../../context/DashboardDataContext';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';
import { BottomSheet } from '../UI/BottomSheet';

// Copiado de utils/metrics y constants para simplificar
const STATUS_COLORS: Record<string, string> = {
    'Completada': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Programada': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Anulada': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Reagendada': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
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
    const formatPct = (value?: number | null) => value == null ? '—' : `${Math.round(value * 100)}%`;

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(client.nombre);
    const [editPhone, setEditPhone] = useState(client.telefono || '');
    const [editBirthday, setEditBirthday] = useState(client.cumpleanos || '');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    React.useEffect(() => {
        setEditName(client.nombre);
        setEditPhone(client.telefono || '');
        setEditBirthday(client.cumpleanos || '');
    }, [client]);

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

    const [activeTab, setActiveTab] = useState<'perfil' | 'historial' | 'puntos'>('perfil');

    if (!isOpen) return null;

    const diasAusente = client.dias_ausente || 0;
    const cooldownInfo = client.bloqueado_hasta && new Date(client.bloqueado_hasta) > new Date()
        ? Math.ceil((new Date(client.bloqueado_hasta).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const headerActions = (
        <>
            {(isAdmin || isStaffMode) && !isStaff && !isEditingProfile && (
                <button
                    onClick={() => {
                        setEditName(client.nombre);
                        setEditPhone(client.telefono || '');
                        setEditBirthday((client as any).cumpleanos || '');
                        setProfileError(null);
                        setIsEditingProfile(true);
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 active:scale-95 transition-all"
                    title="Editar perfil"
                >
                    <Edit2 className="h-5 w-5" />
                </button>
            )}
            {isAdmin && (
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                    title="Eliminar cliente"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            )}
        </>
    );

    const modalContent = (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title="Ficha de Cliente"
            headerActions={headerActions}
        >
            <div className="flex-1 flex flex-col -mx-5 sm:-mx-6">
                {/* 1. Hero Profile */}
                <div className="flex items-start gap-4 px-5 sm:px-6 pb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary shrink-0">
                        {client.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        {isEditingProfile ? (
                            <div className="space-y-3 pr-4 pb-2">
                                {profileError && (
                                    <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg">{profileError}</div>
                                )}
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Nombre</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full text-sm rounded-lg border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg p-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Teléfono</label>
                                    <input
                                        type="text"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        className="w-full text-sm rounded-lg border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg p-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 mb-1 block">Cumpleaños <span className="text-gray-400 normal-case">(opcional)</span></label>
                                    <input
                                        type="date"
                                        value={editBirthday}
                                        onChange={(e) => setEditBirthday(e.target.value)}
                                        className="w-full text-sm rounded-lg border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg p-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile}
                                        className="flex-1 flex items-center justify-center gap-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-dim disabled:opacity-50"
                                    >
                                        {isSavingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Guardar'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingProfile(false)}
                                        disabled={isSavingProfile}
                                        className="flex-1 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-gray-300 text-xs font-bold py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{client.nombre}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1 mb-2">
                                    <Phone size={14} /> {client.telefono}
                                    <a
                                        href={`https://wa.me/${client.telefono.replace(/\s+/g, '').replace('+', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-2 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors"
                                    >
                                        <MessageCircle size={12} /> Escribir
                                    </a>
                                </div>
                                {client.cumpleanos && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                        <Calendar size={14} /> 
                                        <span>Cumpleaños: <strong className="text-gray-700 dark:text-gray-300">{new Date(client.cumpleanos).toLocaleDateString('es-ES', { timeZone: 'UTC', day: '2-digit', month: 'long' })}</strong></span>
                                    </div>
                                )}
                            </>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                {client.categoria || 'Regular'}
                            </span>
                            {(client.ltv || 0) > 0 && (
                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                                    💰 {formatValue(client.ltv || 0)} LTV
                                </span>
                            )}
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                                {client.total_visitas} Visitas
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${(client.fiabilidad_score ?? 100) < 50 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {(client.fiabilidad_score ?? 100) < 50 ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                                {(client.fiabilidad_score ?? 100)}/100 Fiabilidad
                            </span>
                            {ratingAvg != null && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                    ⭐ {ratingAvg.toFixed(1)} Rating
                                </span>
                            )}
                            {(totalRedemptions != null && totalRedemptions > 0) && (
                                <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                                    🎁 {totalRedemptions} {totalRedemptions === 1 ? 'canje' : 'canjes'}
                                </span>
                            )}
                            {client.origen_captacion && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                                    📢 {(() => {
                                        const map: Record<string, string> = {
                                            'organico': 'Orgánico',
                                            'fb_ads': 'Facebook Ads',
                                            'recordatorio_mantenimiento': 'Rec. Mantenimiento',
                                            'whatsapp_marketing': 'WhatsApp Marketing',
                                            'recordatorio_24h': 'Rec. 24h',
                                            'retencion_35': 'Retención 35d',
                                            'retencion_60': 'Retención 60d',
                                            'retencion_90': 'Retención 90d'
                                        };
                                        return map[client.origen_captacion] || client.origen_captacion;
                                    })()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sticky top-0 z-10 bg-white dark:bg-dark-card flex border-b border-gray-100 dark:border-dark-border px-4 overflow-x-auto scrollbar-hide shrink-0">
                    <button
                        onClick={() => setActiveTab('perfil')}
                        className={`flex-1 min-w-[100px] text-center py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'perfil' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Perfil
                    </button>
                    <button
                        onClick={() => setActiveTab('historial')}
                        className={`flex-1 min-w-[100px] text-center py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'historial' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Historial
                    </button>
                    <button
                        onClick={() => setActiveTab('puntos')}
                        className={`flex-1 min-w-[100px] text-center py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'puntos' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Puntos
                    </button>
                </div>

                <div className="px-5 sm:px-6 py-6 space-y-6">
                    {activeTab === 'perfil' && (
                        <>
                            {/* ── CONTROL BOT ── */}
                            <div className={`rounded-2xl border-2 p-4 ${botPausado
                                ? 'border-red-200 bg-red-50 dark:border-red-800/70 dark:bg-red-900/10'
                                : 'border-green-200 bg-green-50 dark:border-green-800/70 dark:bg-green-900/10'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center h-10 w-10 rounded-full ${botPausado ? 'bg-red-100 dark:bg-red-900/40' : 'bg-green-100 dark:bg-green-900/40'}`}>
                                            {botPausado
                                                ? <BotOff className="h-5 w-5 text-red-600 dark:text-red-400" />
                                                : <Bot className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                Bot IA: {botPausado ? 'Apagado' : 'Activo'}
                                            </p>
                                            {botPausado && client.bot_pausado_hasta && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                                                    Reactiva: {new Date(client.bot_pausado_hasta).toLocaleString('es-PE', {
                                                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            )}
                                            {botPausado && client.bot_pausado_razon && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[160px]">
                                                    {client.bot_pausado_razon}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        id={`bot-toggle-${client.id}`}
                                        onClick={handleToggleBot}
                                        disabled={botToggling}
                                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${botPausado ? 'bg-red-500' : 'bg-green-500'}`}
                                        title={botPausado ? 'Reactivar bot' : 'Pausar bot 24h'}
                                    >
                                        <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${botPausado ? 'translate-x-0' : 'translate-x-7'} ${botToggling ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                                    {botPausado
                                        ? '⚡ Pulsa para reactivar el bot ahora'
                                        : '⏸ Pausar 24h para cerrar la venta manualmente'}
                                </p>
                            </div>

                            {/* Banner de Retención (Si está en riesgo) */}
                            {diasAusente >= 45 && (
                                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                            <AlertCircle size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-orange-800 dark:text-orange-400">Riesgo de Fuga</h4>
                                            <p className="text-sm text-orange-700 mt-1">Este cliente no ha vuelto en <strong>{diasAusente} días</strong>.</p>

                                            <div className="mt-3 space-y-2">
                                                {client.rescate_exitoso ? (
                                                    <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-100/50 p-2 rounded-lg">
                                                        <CheckCircle2 size={16} /> Rescatado exitosamente
                                                    </div>
                                                ) : cooldownInfo ? (
                                                    <div className="text-sm font-medium text-orange-800 bg-orange-100/50 p-2 rounded-lg text-center">
                                                        Cooldown activo ({cooldownInfo} dias restantes)
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-medium text-orange-800 bg-orange-100/50 p-2 rounded-lg text-center">
                                                        Rescate automatico en cola. Se enviara cuando corresponda.
                                                    </div>
                                                )}
                                                {client.impacto_actual != null && (
                                                    <div className="text-xs text-orange-700 text-center">
                                                        Impacto actual: {client.impacto_actual}
                                                    </div>
                                                )}
                                                {client.fecha_rescate && (
                                                    <div className="text-xs text-orange-700 text-center">
                                                        Ultimo rescate: {new Date(client.fecha_rescate).toLocaleDateString('es-PE')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Alerta de Fiabilidad Baja */}
                            {(client.fiabilidad_score ?? 100) < 50 && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-red-800 dark:text-red-400">Atención: Solicitar Depósito</h4>
                                            <p className="text-sm text-red-700 mt-1">El score de fiabilidad ha bajado a <strong>{client.fiabilidad_score ?? 100} puntos</strong> por cancelaciones o inasistencias. Es obligatorio solicitar pago por adelantado para agendar nuevas citas.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notas */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <FileText size={16} className="text-gray-400" /> Notas del Cliente
                                    </h3>
                                    {!isEditingNotes && !isStaff && (
                                        <button onClick={() => setIsEditingNotes(true)} className="text-xs text-primary hover:underline">
                                            Editar
                                        </button>
                                    )}
                                </div>
                                {isEditingNotes ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={tempNotes}
                                            onChange={(e) => setTempNotes(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:ring-primary dark:bg-dark-bg dark:border-dark-border dark:text-white"
                                            placeholder="Agregar notas sobre preferencias, colores, alergias..."
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { onSaveNotes(tempNotes); setIsEditingNotes(false); }}
                                                className="px-3 py-1.5 rounded-lg bg-primary text-xs font-bold text-white hover:bg-primary-dim"
                                            >
                                                Guardar
                                            </button>
                                            <button
                                                onClick={() => { setTempNotes(clientNotes); setIsEditingNotes(false); }}
                                                className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-border"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600 dark:text-gray-200 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/10 whitespace-pre-wrap">
                                        {clientNotes || <span className="text-gray-400 italic">Sin notas agregadas...</span>}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'historial' && (
                        <>
                            {/* Próxima Cita */}
                            {(() => {
                                const nextAppt = nextAppointment;
                                if (nextAppt) {
                                    return (
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900/50 dark:bg-green-900/20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar size={14} className="text-green-600" />
                                                <span className="text-xs font-bold uppercase text-green-700">Próxima Cita Agendada</span>
                                            </div>
                                            <p className="text-sm font-semibold text-green-800">{nextAppt.servicio}</p>
                                            <p className="text-xs text-green-600">
                                                {new Date(nextAppt.fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            {/* Historial de Visitas */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <Clock size={16} className="text-gray-400" /> Historial de Citas
                                </h3>
                                <div className="space-y-2">
                                    {history.map(apt => (
                                        <div key={apt.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-white/5">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{apt.servicio}</p>
                                                <p className="text-xs text-gray-500">{new Date(apt.fecha).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${STATUS_COLORS[apt.estado] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                                {apt.estado}
                                            </span>
                                        </div>
                                    ))}
                                    {history.length === 0 && (
                                        <p className="text-sm text-gray-500 text-center py-4">No hay visitas registradas.</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'puntos' && (
                        <>
                            {/* Métricas Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-white/5 p-3">
                                    <p className="text-[10px] uppercase text-gray-500">Puntos Disponibles</p>
                                    <p className="text-xl font-bold text-amber-500">{client.puntos || 0}</p>
                                </div>
                                <div className="rounded-lg border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-white/5 p-3">
                                    <p className="text-[10px] uppercase text-gray-500">Días sin venir</p>
                                    <p className={`text-xl font-bold ${diasAusente > 45 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{diasAusente}</p>
                                </div>
                                <div className="rounded-lg border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-white/5 p-3">
                                    <p className="text-[10px] uppercase text-gray-500">Total Gastado</p>
                                    <p className="text-xl font-bold text-green-600">{formatValue(totalSpent)}</p>
                                </div>
                                <div className="rounded-lg border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-white/5 p-3">
                                    <p className="text-[10px] uppercase text-gray-500">Ticket Promedio</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                                        {formatValue(client.total_visitas > 0 ? (totalSpent / client.total_visitas) : 0)}
                                    </p>
                                </div>
                            </div>
                            {/* ── Calificación promedio y canjes ── */}
                            {(ratingAvg != null || (totalRedemptions != null && totalRedemptions > 0)) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {ratingAvg != null && (
                                        <div className="rounded-lg border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-3">
                                            <p className="text-[10px] uppercase text-amber-600 dark:text-amber-400 font-semibold">Calificación</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <p className="text-xl font-bold text-amber-500">{ratingAvg.toFixed(1)}</p>
                                                <div className="flex">
                                                    {[1,2,3,4,5].map(s => (
                                                        <span key={s} className={`text-sm ${s <= Math.round(ratingAvg) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'}`}>★</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {(totalRedemptions != null && totalRedemptions > 0) && (
                                        <div className="rounded-lg border border-violet-100 dark:border-violet-900/30 bg-violet-50 dark:bg-violet-900/10 p-3">
                                            <p className="text-[10px] uppercase text-violet-600 dark:text-violet-400 font-semibold">Premios Canjeados</p>
                                            <p className="text-xl font-bold text-violet-600 dark:text-violet-400 mt-1">{totalRedemptions}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </BottomSheet>
    );

    // Como BottomSheet ya usa createPortal o similar internamente (en este caso lo incluye), 
    // pero si BottomSheet usa un render directo, debemos devolver modalContent directamente.
    // Veamos si BottomSheet.tsx usa createPortal (sí, lo usa). Así que solo retornamos modalContent.
    return modalContent;
};


