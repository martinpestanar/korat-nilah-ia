/**
 * ClientesCercaDePremio Component
 * 
 * Muestra clientes que están cerca de poder canjear un premio.
 * Permite enviar un mensaje de "¡Te faltan solo X puntos!"
 * Incluye modal para ver todos los clientes.
 */

import React, { useState } from 'react';
import { Target, Gift, Bell, Loader2, CheckCircle, X, ChevronRight } from 'lucide-react';

interface ClienteCercaDePremio {
    clienteId: number;
    nombre: string;
    telefono?: string;
    puntosActuales: number;
    proximoPremio: string;
    puntosNecesarios: number;
    faltantes: number;
}

interface ClientesCercaDePremioProps {
    clientes: ClienteCercaDePremio[];
    maxItems?: number;
    umbralPuntos?: number;
    onNotificar?: (cliente: ClienteCercaDePremio) => Promise<void>;
}

const ClientesCercaDePremio: React.FC<ClientesCercaDePremioProps> = ({
    clientes,
    maxItems = 5,
    umbralPuntos = 50,
    onNotificar
}) => {
    const [sendingId, setSendingId] = useState<number | null>(null);
    const [sentIds, setSentIds] = useState<Set<number>>(new Set());
    const [showModal, setShowModal] = useState(false);

    // Filtrar y ordenar clientes
    const clientesCercanos = clientes
        .filter(c => c.faltantes > 0 && c.faltantes <= umbralPuntos)
        .sort((a, b) => a.faltantes - b.faltantes);

    const displayedClientes = clientesCercanos.slice(0, maxItems);
    const totalClientes = clientesCercanos.length;
    const hasMore = totalClientes > maxItems;

    const handleNotificar = async (cliente: ClienteCercaDePremio) => {
        if (onNotificar) {
            setSendingId(cliente.clienteId);
            try {
                await onNotificar(cliente);
                setSentIds(prev => new Set([...prev, cliente.clienteId]));
            } catch (error) {
                console.error('Error al notificar:', error);
            } finally {
                setSendingId(null);
            }
        }
    };

    const getProgressColor = (faltantes: number) => {
        if (faltantes <= 10) return 'bg-emerald-500';
        if (faltantes <= 25) return 'bg-amber-500';
        return 'bg-blue-500';
    };

    const getProgressBg = (faltantes: number) => {
        if (faltantes <= 10) return 'bg-emerald-100 dark:bg-emerald-500/20';
        if (faltantes <= 25) return 'bg-amber-100 dark:bg-amber-500/20';
        return 'bg-blue-100 dark:bg-blue-500/20';
    };

    const progress = (cliente: ClienteCercaDePremio) => {
        return Math.min((cliente.puntosActuales / cliente.puntosNecesarios) * 100, 100);
    };

    const renderClienteRow = (cliente: ClienteCercaDePremio) => {
        const isSent = sentIds.has(cliente.clienteId);
        const isSending = sendingId === cliente.clienteId;

        return (
            <div
                key={cliente.clienteId}
                className={`rounded-lg p-3 transition-all ${cliente.faltantes <= 10
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/20'
                        : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
            >
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary flex-shrink-0">
                            {cliente.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                                {cliente.nombre}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs">
                                <Gift className="h-3 w-3 text-gray-400" />
                                <span className="text-gray-500 dark:text-gray-400 truncate">
                                    {cliente.proximoPremio}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                    {cliente.puntosActuales}
                                </span>
                                <span className="text-xs text-gray-400">
                                    /{cliente.puntosNecesarios}
                                </span>
                            </div>
                            <span className={`text-xs font-medium ${cliente.faltantes <= 10
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                ¡Faltan solo {cliente.faltantes}!
                            </span>
                        </div>

                        {onNotificar && (
                            <button
                                onClick={() => handleNotificar(cliente)}
                                disabled={isSending || isSent}
                                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${isSent
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                                        : 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
                                    } disabled:opacity-50`}
                                title={isSent ? 'Notificado' : 'Notificar cliente'}
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : isSent ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    <Bell className="h-4 w-4" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-2">
                    <div className={`h-1.5 rounded-full ${getProgressBg(cliente.faltantes)}`}>
                        <div
                            className={`h-full rounded-full ${getProgressColor(cliente.faltantes)} transition-all`}
                            style={{ width: `${progress(cliente)}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                            <Target className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                A Punto de Canjear
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Faltan menos de {umbralPuntos} pts
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {totalClientes > 0 && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                {hasMore ? `${maxItems} de ${totalClientes}` : totalClientes}
                            </span>
                        )}
                        {hasMore && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                                Ver todos
                                <ChevronRight className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Lista de Clientes */}
                {displayedClientes.length > 0 ? (
                    <div className="space-y-3">
                        {displayedClientes.map((cliente) => renderClienteRow(cliente))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            <Target className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            No hay clientes cerca de premio
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Los clientes con menos de {umbralPuntos} pts faltantes aparecerán aquí
                        </p>
                    </div>
                )}

                {/* Tip */}
                {displayedClientes.length > 0 && (
                    <div className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-400">
                        💡 <strong>Tip:</strong> Envía un mensaje recordando cuánto les falta para motivarlos a volver
                    </div>
                )}
            </div>

            {/* Modal Ver Todos */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl bg-white dark:bg-dark-card shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card p-4">
                            <div className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-emerald-500" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Clientes Cerca de Premio
                                </h2>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    {totalClientes}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                            {clientesCercanos.map((cliente) => renderClienteRow(cliente))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ClientesCercaDePremio;
