import React, { useState } from 'react';
import { X, Phone, Calendar, Loader2, AlertCircle, HeartHandshake, CheckCircle2, MessageCircle, FileText, Gift, Edit2, Save, Trash2, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Client } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

// Copiado de utils/metrics y constants para simplificar
const STATUS_COLORS: Record<string, string> = {
    'Completada': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'Programada': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Anulada': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Reagendada': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

interface ClientModalProps {
    client: Client;
    isOpen: boolean;
    onClose: () => void;
    onRescue: (e: React.MouseEvent) => void;
    rescueState: 'idle' | 'sending' | 'sent' | 'error';
    onSaveNotes: (notes: string) => void;
    clientNotes: string;
    // Métodos mock para mantener la compatibilidad con el diseño original
    getTotalSpent: () => number;
    getNextAppointment: () => any | null;
    getClientHistory: () => any[];
    isAdmin: boolean;
    onDelete: () => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
    client, isOpen, onClose, onRescue, rescueState, onSaveNotes, clientNotes,
    getTotalSpent, getNextAppointment, getClientHistory, isAdmin, onDelete
}) => {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState(clientNotes);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { formatValue } = useCurrency();

    if (!isOpen) return null;

    const diasAusente = client.dias_ausente || 0;
    const cooldownInfo = client.bloqueado_hasta && new Date(client.bloqueado_hasta) > new Date()
        ? Math.ceil((new Date(client.bloqueado_hasta).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 dark:border-dark-border dark:bg-dark-card flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-border">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ficha de Cliente</h2>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="rounded-full p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Eliminar cliente"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                    <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-dark-border">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. Hero Profile */}
                <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary shrink-0">
                        {client.nombre.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{client.nombre}</h3>
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
                        <div className="flex flex-wrap gap-2">
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
                        </div>
                    </div>
                </div>

                {/* 2. Banner de Retención (Si está en riesgo) */}
                {diasAusente >= 45 && (
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-900/20">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <AlertCircle size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-orange-800 dark:text-orange-400">Riesgo de Fuga</h4>
                                <p className="text-sm text-orange-700 mt-1">Este cliente no ha vuelto en <strong>{diasAusente} días</strong>.</p>

                                <div className="mt-3">
                                    {client.rescate_exitoso ? (
                                        <div className="flex items-center gap-2 text-sm font-bold text-green-600 bg-green-100/50 p-2 rounded-lg">
                                            <CheckCircle2 size={16} /> ¡Rescatado Exitosamente!
                                        </div>
                                    ) : cooldownInfo ? (
                                        <div className="text-sm font-medium text-orange-800 bg-orange-100/50 p-2 rounded-lg text-center">
                                            ⏳ Esperando respuesta ({cooldownInfo} días restantes)
                                        </div>
                                    ) : (
                                        <button
                                            onClick={onRescue}
                                            disabled={rescueState === 'sending'}
                                            className="w-full flex justify-center items-center gap-2 rounded-lg bg-primary py-2 text-sm font-bold text-white hover:bg-primary-dim shadow-sm disabled:opacity-50"
                                        >
                                            {rescueState === 'sending' ? <Loader2 size={16} className="animate-spin" /> : <HeartHandshake size={16} />}
                                            {rescueState === 'sending' ? 'Enviando...' : rescueState === 'sent' ? 'Mensaje Enviado' : 'Enviar Promoción de Rescate'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2.5 Alerta de Fiabilidad Baja */}
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

                {/* 3. Métricas Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-[10px] uppercase text-gray-500">Puntos Disponibles</p>
                        <p className="text-xl font-bold text-amber-500">{client.puntos || 0}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-[10px] uppercase text-gray-500">Días sin venir</p>
                        <p className={`text-xl font-bold ${diasAusente > 45 ? 'text-red-500' : 'text-gray-900'}`}>{diasAusente}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-[10px] uppercase text-gray-500">Total Gastado</p>
                        <p className="text-xl font-bold text-green-600">{formatValue(getTotalSpent())}</p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <p className="text-[10px] uppercase text-gray-500">Ticket Promedio</p>
                        <p className="text-xl font-bold text-gray-900">
                            {formatValue(client.total_visitas > 0 ? (getTotalSpent() / client.total_visitas) : 0)}
                        </p>
                    </div>
                </div>

                {/* 4. Próxima Cita */}
                {(() => {
                    const nextAppt = getNextAppointment();
                    if (nextAppt) {
                        return (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
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

                {/* 5. Notas */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={16} className="text-gray-400" /> Notas del Cliente
                        </h3>
                        {!isEditingNotes && (
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
                                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-primary focus:ring-primary"
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
                                    className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                            {clientNotes || <span className="text-gray-400 italic">Sin notas agregadas...</span>}
                        </p>
                    )}
                </div>

                {/* 6. Historial de Visitas */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" /> Historial de Citas
                    </h3>
                    <div className="space-y-2">
                        {getClientHistory().map(apt => (
                            <div key={apt.id} className="flex justify-between items-center p-3 rounded-lg border border-gray-100 bg-gray-50">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{apt.servicio}</p>
                                    <p className="text-xs text-gray-500">{new Date(apt.fecha).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${STATUS_COLORS[apt.estado] || 'bg-gray-100 text-gray-600'}`}>
                                    {apt.estado}
                                </span>
                            </div>
                        ))}
                        {getClientHistory().length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No hay visitas registradas.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
