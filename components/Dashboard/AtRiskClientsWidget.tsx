
import React, { useState, useEffect, useCallback } from 'react';
import {
    AlertTriangle, HeartHandshake, Clock, Loader2, CheckCircle2,
    ChevronRight, RefreshCw, History, XCircle, UserCheck,
    ShieldAlert, Zap, Flame, SkipForward
} from 'lucide-react';
import { crm, retention } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData, Client } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';
import { ContextualTooltip, HelpTooltip } from '../UI/ContextualTooltip';

// ===========================================
// Types
// ===========================================

interface RescueState {
    [clientId: number]: 'idle' | 'sending' | 'sent' | 'error';
}

interface RescueHistoryItem {
    id: number;
    clientName: string;
    date: string;
    result: 'success' | 'pending' | 'failed';
    returnedAfter: number | null;
}

// ===========================================
// Helper: Info de cooldown de rescate
// ===========================================

const getRescueCooldownInfo = (bloqueadoHasta: string | null | undefined) => {
    if (!bloqueadoHasta) return null;
    const now = new Date();
    const bloqueo = new Date(bloqueadoHasta);
    if (bloqueo <= now) return null; // Ya expiró
    const diasRestantes = Math.ceil((bloqueo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { diasRestantes };
};

// ===========================================
// Helper: Nivel de impacto del rescate
// ===========================================

const getImpactInfo = (impacto: number | undefined, diasAusente: number) => {
    // Si ya se envió rescate, mostrar qué nivel
    if (impacto && impacto > 0) {
        const labels = ['', 'Soft Touch 🤗', 'Incentivo 🎁', 'Última Llamada ⚠️'];
        return {
            label: labels[impacto] || 'Rescatado',
            color: impacto === 3 ? 'text-red-500' : impacto === 2 ? 'text-orange-500' : 'text-blue-500',
        };
    }
    // Si no se envió aún, sugerir nivel según días
    if (diasAusente >= 90) return { label: 'Última Llamada ⚠️', color: 'text-red-400', suggested: true };
    if (diasAusente >= 60) return { label: 'Incentivo 🎁', color: 'text-orange-400', suggested: true };
    return { label: 'Soft Touch 🤗', color: 'text-blue-400', suggested: true };
};

// ===========================================
// Helper: Texto relativo de la última visita
// ===========================================

const getLastVisitLabel = (diasAusente: number, ultimaVisita: string | null | undefined): string => {
    if (diasAusente <= 0 && !ultimaVisita) return 'Nunca vino';
    if (diasAusente === 0) return 'Hoy';
    if (diasAusente === 1) return 'Ayer';
    if (diasAusente < 7) return `hace ${diasAusente} días`;
    if (diasAusente < 30) return `hace ${Math.floor(diasAusente / 7)} sem`;
    if (diasAusente < 365) return `hace ${Math.floor(diasAusente / 30)} mes${Math.floor(diasAusente / 30) > 1 ? 'es' : ''}`;
    return `hace +1 año`;
};

// ===========================================
// Helper: Color de la barra de urgencia según días
// ===========================================

const getUrgencyBar = (diasAusente: number) => {
    if (diasAusente >= 90) return { width: '100%', color: 'bg-purple-500', label: 'Crítico' };
    if (diasAusente >= 60) return { width: '75%', color: 'bg-red-500', label: 'Urgente' };
    if (diasAusente >= 45) return { width: '50%', color: 'bg-orange-500', label: 'Alto' };
    return { width: '25%', color: 'bg-yellow-500', label: 'Medio' };
};

// ===========================================
// Component
// ===========================================

const AtRiskClientsWidget: React.FC = () => {
    const { hasFeature, user } = useAuth();
    const { clients: allClients, isLoading: isLoadingData, refresh } = useDashboardData();
    const { formatValue } = useCurrency();

    const [history, setHistory] = useState<RescueHistoryItem[]>([]);
    const [historySummary, setHistorySummary] = useState<any>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [rescueStates, setRescueStates] = useState<RescueState>({});
    const [activeTab, setActiveTab] = useState<'atrisk' | 'history'>('atrisk');

    // Filtrar clientes en riesgo (Alto o Crítico), ordenados por urgencia
    const clients = React.useMemo(() => {
        if (!allClients) return [];
        return allClients
            .filter(c => c.riesgo === 'Alto' || c.riesgo === 'Crítico')
            .sort((a, b) => {
                // 1. Rescatados exitosos al fondo
                if (a.rescate_exitoso && !b.rescate_exitoso) return 1;
                if (!a.rescate_exitoso && b.rescate_exitoso) return -1;
                // 2. Los que no tienen cooldown activo, primero
                const aCooldown = getRescueCooldownInfo(a.bloqueado_hasta);
                const bCooldown = getRescueCooldownInfo(b.bloqueado_hasta);
                if (!aCooldown && bCooldown) return -1;
                if (aCooldown && !bCooldown) return 1;
                // 3. Más días ausentes = más urgentes
                return (b.dias_ausente || 0) - (a.dias_ausente || 0);
            });
    }, [allClients]);

    // Clientes disponibles para rescatar ahora (sin cooldown ni rescatados)
    const clientesDisponibles = clients.filter(c =>
        !c.rescate_exitoso &&
        !getRescueCooldownInfo(c.bloqueado_hasta) &&
        (rescueStates[c.id] || 'idle') !== 'sent'
    ).length;

    const PAGE_SIZE = 7;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(clients.length / PAGE_SIZE);
    const paginatedClients = clients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    useEffect(() => { setCurrentPage(1); }, [allClients?.length]);

    const isLoading = activeTab === 'atrisk' ? isLoadingData : isLoadingHistory;

    const loadHistory = useCallback(async () => {
        if (activeTab !== 'history') return;
        setIsLoadingHistory(true);
        try {
            const data = await retention.getRescueHistory();
            if (data?.historial) {
                const mapped = data.historial.map((item: any) => ({
                    id: item.id,
                    clientName: item.cliente_nombre || 'Cliente',
                    date: item.fecha,
                    result: item.resultado || 'pending',
                    returnedAfter: item.dias_para_volver
                }));
                setHistory(mapped);
                if (data.resumen) {
                    setHistorySummary(data.resumen);
                } else {
                    const exitosos = mapped.filter((h: any) => h.result === 'success').length;
                    setHistorySummary({
                        total_enviados: mapped.length,
                        exitosos,
                        tasa_exito: mapped.length > 0 ? Math.round((exitosos / mapped.length) * 100) : 0
                    });
                }
            }
        } catch (error) {
            console.warn('Error loading rescue history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'history') loadHistory();
    }, [activeTab, loadHistory]);

    const handleRescue = async (client: Client) => {
        if (!hasFeature('client_rescue')) return;
        setRescueStates(prev => ({ ...prev, [client.id]: 'sending' }));
        try {
            const response = await crm.rescueClient(String(client.id));
            if (response.success) {
                setRescueStates(prev => ({ ...prev, [client.id]: 'sent' }));
                refresh(true);
            } else {
                throw new Error('Failed');
            }
        } catch {
            setRescueStates(prev => ({ ...prev, [client.id]: 'error' }));
            setTimeout(() => {
                setRescueStates(prev => ({ ...prev, [client.id]: 'idle' }));
            }, 3000);
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
            return new Date(dateStr).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
        } catch { return ''; }
    };

    const rescueStats = historySummary ? {
        total: historySummary.total_enviados || 0,
        success: historySummary.exitosos || 0,
        pending: (historySummary.total_enviados || 0) - (historySummary.exitosos || 0),
        failed: 0
    } : {
        total: history.length,
        success: history.filter(r => r.result === 'success').length,
        pending: history.filter(r => r.result === 'pending').length,
        failed: history.filter(r => r.result === 'failed').length,
    };

    const canRescue = hasFeature('client_rescue') &&
        user?.recursos_saas?.ui_config?.action_buttons?.rescate_whatsapp !== false;

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
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {clients.length > 0 && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                        )}
                    </div>
                    <ContextualTooltip
                        id="at-risk-clients-intro"
                        title="Oportunidades de Rescate"
                        content="Clientes que llevan mucho tiempo sin visitarte. La IA puede enviarles un mensaje personalizado para recuperarlos."
                        position="bottom"
                        showOnce={true}
                        delay={2000}
                    >
                        <h3 className="font-bold text-gray-900 dark:text-white">Oportunidades de Rescate 🛟</h3>
                    </ContextualTooltip>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold dark:bg-red-900/30 dark:text-red-400">
                        {clients.length}
                    </span>
                    <HelpTooltip content={`${clients.length} clientes en riesgo. ${clientesDisponibles} disponibles para rescatar ahora.`} />
                </div>
                <button
                    onClick={() => refresh(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw size={14} className="text-gray-400" />
                </button>
            </div>

            {/* Resumen rápido */}
            {clients.length > 0 && activeTab === 'atrisk' && (
                <div className="flex gap-2 mb-3">
                    <div className="flex-1 text-center p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <span className="text-base font-bold text-red-600 dark:text-red-400">{clients.length}</span>
                        <p className="text-[9px] text-red-500/70 dark:text-red-400/70">En riesgo</p>
                    </div>
                    <div className="flex-1 text-center p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <span className="text-base font-bold text-green-600 dark:text-green-400">{clientesDisponibles}</span>
                        <p className="text-[9px] text-green-600/70 dark:text-green-400/70">Disponibles</p>
                    </div>
                    <div className="flex-1 text-center p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <span className="text-base font-bold text-purple-600 dark:text-purple-400">
                            {clients.filter(c => c.riesgo === 'Crítico').length}
                        </span>
                        <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70">Críticos</p>
                    </div>
                </div>
            )}

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
                                const isSending = rescueState === 'sending';
                                const isSentLocal = rescueState === 'sent';

                                const cooldown = getRescueCooldownInfo(client.bloqueado_hasta);
                                const isRescuado = client.rescate_exitoso;
                                const diasAusente = client.dias_ausente || 0;
                                const lastVisitLabel = getLastVisitLabel(diasAusente, client.ultima_visita);
                                const urgency = getUrgencyBar(diasAusente);
                                const impactInfo = getImpactInfo(client.impacto_actual, diasAusente);

                                // Determinar qué botón mostrar
                                const showRescued = isRescuado;
                                const showSent = isSentLocal;
                                const showCooldown = !isRescuado && !isSentLocal && !!cooldown;
                                const showSending = isSending;
                                const showRescueBtn = !isRescuado && !isSentLocal && !cooldown && !isSending && canRescue;
                                const showProBadge = !canRescue;

                                const riesgoColor = client.riesgo === 'Crítico'
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

                                return (
                                    <div
                                        key={client.id}
                                        className={`p-3 rounded-lg border transition-colors ${isRescuado
                                            ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 opacity-60'
                                            : 'border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                {/* Nombre + badge de riesgo */}
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                                                        {client.nombre}
                                                    </h4>
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${riesgoColor}`}>
                                                        {client.riesgo}
                                                    </span>
                                                </div>

                                                {/* Métricas: días + LTV */}
                                                <div className="flex items-center gap-3 text-xs mb-1.5">
                                                    <span className={`flex items-center gap-1 font-semibold ${diasAusente >= 90 ? 'text-purple-500' : diasAusente >= 60 ? 'text-red-500' : 'text-orange-500'}`}>
                                                        <Clock size={10} />
                                                        {diasAusente > 0 ? `${diasAusente}d` : '—'}
                                                        <span className="text-gray-400 font-normal text-[10px]">({lastVisitLabel})</span>
                                                    </span>
                                                    {(client.ltv || 0) > 0 && (
                                                        <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400 text-[11px]">
                                                            💰 {formatValue(client.ltv!)}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Barra de urgencia */}
                                                <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${urgency.color}`}
                                                        style={{ width: urgency.width }}
                                                    />
                                                </div>

                                                {/* Info de impacto previo o sugerido */}
                                                <p className={`text-[10px] italic ${impactInfo.color}`}>
                                                    {(client.impacto_actual || 0) > 0
                                                        ? `✉️ Enviado: ${impactInfo.label}`
                                                        : `💡 Sugerido: ${impactInfo.label}`
                                                    }
                                                </p>
                                            </div>

                                            {/* Botones de acción */}
                                            <div className="shrink-0 flex flex-col items-end gap-1">
                                                {showRescued && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        <CheckCircle2 size={11} /> Rescatado
                                                    </span>
                                                )}
                                                {showSent && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <CheckCircle2 size={11} /> Enviado
                                                    </span>
                                                )}
                                                {showCooldown && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        <SkipForward size={10} /> {cooldown!.diasRestantes}d
                                                    </span>
                                                )}
                                                {showSending && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        <Loader2 size={11} className="animate-spin" />
                                                    </span>
                                                )}
                                                {showRescueBtn && (
                                                    <button
                                                        onClick={() => handleRescue(client)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-primary text-white hover:bg-primary-dim transition-colors shadow-sm"
                                                    >
                                                        <HeartHandshake size={11} />
                                                        Rescatar
                                                    </button>
                                                )}
                                                {showProBadge && (
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

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="mt-3 flex items-center justify-center gap-4 text-xs font-medium">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                ← Anterior
                            </button>
                            <span className="text-gray-600 dark:text-gray-400">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
