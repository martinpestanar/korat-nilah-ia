
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, HeartHandshake, Phone, Clock, Loader2, CheckCircle2, ChevronRight, RefreshCw, History, XCircle, UserCheck } from 'lucide-react';
import { crm, retention } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData, Client } from '../../context/DashboardDataContext';
import { ContextualTooltip, HelpTooltip } from '../UI/ContextualTooltip';

// ===========================================
// Types
// ===========================================

interface ClientStats {
    status_color: 'success' | 'warning' | 'error' | 'critical' | 'neutral';
    nivel_riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    label: string;
    dias_ausente: number;
    accion_recomendada?: string;
    rescue_sent?: boolean;
}

interface RescueState {
    [clientId: number]: 'idle' | 'sending' | 'sent' | 'error';
}

// Rescue History Types
interface RescueHistoryItem {
    id: number;
    clientName: string;
    date: string;
    result: 'success' | 'pending' | 'failed';
    returnedAfter: number | null; // days until they came back
    cliente_nombre?: string; // Fallback for API mapping
    fecha?: string;
    dias_para_volver?: number;
    resultado?: string;
}

// ===========================================
// Component
// ===========================================

const AtRiskClientsWidget: React.FC = () => {
    const { hasFeature, user } = useAuth();

    // Use centralized dashboard data
    const { clients: allClients, isLoading: isLoadingData, refresh } = useDashboardData();

    // Local state for component-specific functionality
    const [history, setHistory] = useState<RescueHistoryItem[]>([]);
    const [historySummary, setHistorySummary] = useState<any>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [rescueStates, setRescueStates] = useState<RescueState>({});
    const [activeTab, setActiveTab] = useState<'atrisk' | 'history'>('atrisk');

    // Filter and Sort At-Risk Clients
    const getRiskPriority = (riesgo: string) => {
        switch (riesgo) {
            case 'Crítico': return 4;
            case 'Alto': return 3;
            case 'Medio': return 2;
            case 'Bajo': return 1;
            default: return 0;
        }
    };

    const clients = React.useMemo(() => {
        if (!allClients) return [];
        return allClients
            .filter(c => c.riesgo === 'Alto' || c.riesgo === 'Crítico')
            .sort((a, b) => {
                const priorityDiff = getRiskPriority(b.riesgo || '') - getRiskPriority(a.riesgo || '');
                if (priorityDiff !== 0) return priorityDiff;
                // Secondary sort by days absent (descending)
                return (b.stats?.dias_ausente || 0) - (a.stats?.dias_ausente || 0);
            });
    }, [allClients]);

    // Pagination
    const PAGE_SIZE = 7;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(clients.length / PAGE_SIZE);

    const paginatedClients = clients.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    // Reset page if filtered results change
    useEffect(() => {
        setCurrentPage(1);
    }, [allClients?.length]);

    // Combined loading state
    const isLoading = activeTab === 'atrisk' ? isLoadingData : isLoadingHistory;

    const loadHistory = useCallback(async () => {
        if (activeTab !== 'history') return;

        setIsLoadingHistory(true);
        try {
            const data = await retention.getRescueHistory();
            console.log('📊 Rescue History Response:', data);

            if (data && data.historial) {
                const mappedHistory = data.historial.map((item: any) => ({
                    id: item.id,
                    clientName: item.cliente_nombre || 'Cliente',
                    date: item.fecha,
                    result: item.resultado || 'pending',
                    returnedAfter: item.dias_para_volver
                }));
                setHistory(mappedHistory);

                // Usar resumen si existe, si no calcularlo
                if (data.resumen) {
                    setHistorySummary(data.resumen);
                } else {
                    // Calcular resumen desde historial
                    const exitosos = mappedHistory.filter((h: any) => h.result === 'success').length;
                    setHistorySummary({
                        total_rescates: mappedHistory.length,
                        rescates_exitosos: exitosos,
                        tasa_exito: mappedHistory.length > 0 ? Math.round((exitosos / mappedHistory.length) * 100) : 0
                    });
                }
            } else {
                console.warn('⚠️ No historial data in response:', data);
            }
        } catch (error) {
            console.warn('Error loading rescue history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab, loadHistory]);

    const handleRescue = async (client: Client) => {
        if (!hasFeature('client_rescue')) return;

        setRescueStates(prev => ({ ...prev, [client.id]: 'sending' }));

        try {
            const response = await crm.rescueClient(String(client.id));

            if (response.success) {
                setRescueStates(prev => ({ ...prev, [client.id]: 'sent' }));
                // Refresh data from context to update the client state
                refresh(true);
            } else {
                throw new Error('Failed');
            }
        } catch (error) {
            setRescueStates(prev => ({ ...prev, [client.id]: 'error' }));
            setTimeout(() => {
                setRescueStates(prev => ({ ...prev, [client.id]: 'idle' }));
            }, 3000);
        }
    };

    const getRiskColor = (riesgo: string) => {
        switch (riesgo) {
            case 'Crítico': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Alto': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    const getResultStyle = (result: RescueHistoryItem['result']) => {
        switch (result) {
            case 'success': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: UserCheck, label: 'Volvió' };
            case 'pending': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock, label: 'Esperando' };
            case 'failed': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle, label: 'No volvió' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock, label: 'Pendiente' };
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
        } catch { return ''; }
    };

    // Calculate rescue stats using API data or fallback to local calculation
    const rescueStats = historySummary ? {
        total: historySummary.total_enviados || 0,
        success: historySummary.exitosos || 0,
        pending: (historySummary.total_enviados || 0) - (historySummary.exitosos || 0), // Aproximación
        failed: 0 // Si no viene en el resumen, lo dejamos en 0 o calculamos
    } : {
        total: history.length,
        success: history.filter(r => r.result === 'success').length,
        pending: history.filter(r => r.result === 'pending').length,
        failed: history.filter(r => r.result === 'failed').length,
    };

    if (isLoading && clients.length === 0 && activeTab === 'atrisk') {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {clients.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        )}
                    </div>
                    <ContextualTooltip
                        id="at-risk-clients-intro"
                        title="Clientes en Riesgo"
                        content="Estos clientes llevan muchos días sin visitarte. El sistema de IA puede enviarles un mensaje personalizado para recuperarlos antes de que se vayan."
                        position="bottom"
                        showOnce={true}
                        delay={2000}
                    >
                        <h3 className="font-bold text-gray-900 dark:text-white">Requieren Atención</h3>
                    </ContextualTooltip>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold dark:bg-red-900/30 dark:text-red-400">
                        {clients.length}
                    </span>
                    <HelpTooltip content="Clientes con más de 30 días sin visita. El 'LTV' muestra el valor total que han gastado contigo." />
                </div>
                <button
                    onClick={() => refresh(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw size={14} className="text-gray-400" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3">
                <button
                    onClick={() => setActiveTab('atrisk')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'atrisk'
                        ? 'text-red-600 border-b-2 border-red-500 dark:text-red-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <AlertTriangle size={12} className="inline mr-1" />
                    En Riesgo ({clients.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'history'
                        ? 'text-blue-600 border-b-2 border-blue-500 dark:text-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <History size={12} className="inline mr-1" />
                    Historial ({rescueStats.total})
                </button>
            </div>

            {/* At Risk Tab */}
            {activeTab === 'atrisk' && (
                <>
                    {paginatedClients.length > 0 ? (
                        <div className="flex-1 space-y-2 overflow-y-auto">
                            {paginatedClients.map(client => {
                                const rescueState = rescueStates[client.id] || 'idle';
                                const isRescueSent = client.stats?.rescue_sent || rescueState === 'sent';
                                // Requires both the global module feature and the specific UI button toggle
                                const canRescue = hasFeature('client_rescue') && user?.recursos_saas?.ui_config?.action_buttons?.rescate_whatsapp !== false;

                                return (
                                    <div
                                        key={client.id}
                                        className="p-3 rounded-lg border border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                        {client.nombre}
                                                    </h4>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${getRiskColor(client.stats?.nivel_riesgo || 'Alto')}`}>
                                                        {client.stats?.nivel_riesgo}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                    {/* LTV destacado */}
                                                    {(client.ltv || 0) > 0 && (
                                                        <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                                                            💰 S/{(client.ltv || 0).toLocaleString('es-PE')}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-red-500">
                                                        <Clock size={10} />
                                                        {client.stats?.dias_ausente || 0}d
                                                    </span>
                                                </div>

                                                {client.stats?.accion_recomendada && (
                                                    <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500 italic">
                                                        💡 {client.stats.accion_recomendada}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Botón de rescate */}
                                            <div className="shrink-0">
                                                {canRescue ? (
                                                    isRescueSent ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                            <CheckCircle2 size={12} />
                                                            Enviado
                                                        </span>
                                                    ) : rescueState === 'sending' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                            <Loader2 size={12} className="animate-spin" />
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRescue(client)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-primary-dim transition-colors shadow-sm"
                                                        >
                                                            <HeartHandshake size={12} />
                                                            Rescatar
                                                        </button>
                                                    )
                                                ) : (
                                                    <span className="text-[9px] text-gray-400 uppercase">Pro</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">¡Excelente!</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                No hay clientes en riesgo de fuga
                            </p>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-3 flex items-center justify-center gap-4 text-xs font-medium">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Anterior
                            </button>
                            <span className="text-gray-600 dark:text-gray-400">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <div className="flex-1 flex flex-col">
                    {/* Stats Row */}
                    <div className="flex gap-2 mb-3">
                        <div className="flex-1 text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <span className="text-lg font-bold text-green-600 dark:text-green-400">{rescueStats.success}</span>
                            <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Volvieron</p>
                        </div>
                        <div className="flex-1 text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{rescueStats.pending}</span>
                            <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70">Esperando</p>
                        </div>
                        <div className="flex-1 text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <span className="text-lg font-bold text-red-600 dark:text-red-400">{rescueStats.failed}</span>
                            <p className="text-[10px] text-red-600/70 dark:text-red-400/70">Perdidos</p>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="flex-1 space-y-2 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            </div>
                        ) : history.length > 0 ? (
                            history.map(item => {
                                const style = getResultStyle(item.result);
                                const IconComponent = style.icon;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-2 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                                                {item.clientName?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{item.clientName}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                    Rescatado el {formatDate(item.date)}
                                                    {item.returnedAfter && <span className="text-green-600 dark:text-green-400"> • Volvió en {item.returnedAfter}d</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${style.bg} ${style.text}`}>
                                            <IconComponent size={10} />
                                            {style.label}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-gray-500 text-xs">
                                No hay historial de rescates reciente
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Link a ver todos */}
            {activeTab === 'atrisk' && clients.length > 0 && (
                <a
                    href="#/nilah/app/clients"
                    className="mt-3 flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                    Ver todos los clientes
                    <ChevronRight size={14} />
                </a>
            )}
        </div>
    );
};

export default AtRiskClientsWidget;
