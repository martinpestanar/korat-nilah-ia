import React from 'react';
import { MessageCircle, HeartHandshake, CheckCircle2, ChevronRight, SkipForward, Shield, ShieldAlert, BotOff } from 'lucide-react';
import { Client } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

const getStatusBadgeStyles = (color: string) => {
    switch (color) {
        case 'critical': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        case 'error': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        case 'warning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        case 'success': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
};

const getStatusDot = (color: string) => {
    switch (color) {
        case 'critical': return 'bg-purple-500';
        case 'error': return 'bg-red-500';
        case 'warning': return 'bg-amber-400';
        case 'success': return 'bg-green-500';
        default: return 'bg-gray-400';
    }
};

const getUrgencyBar = (diasAusente: number) => {
    if (diasAusente >= 90) return { width: '100%', color: 'bg-purple-500' };
    if (diasAusente >= 60) return { width: '75%', color: 'bg-red-500' };
    if (diasAusente >= 45) return { width: '50%', color: 'bg-orange-500' };
    if (diasAusente >= 30) return { width: '25%', color: 'bg-yellow-500' };
    return { width: '0%', color: 'bg-transparent' };
};

export const getUXStatus = (diasAusente: number, isInactivo: boolean) => {
    if (isInactivo || diasAusente >= 90) return { label: 'Perdido', color: 'critical' };
    if (diasAusente >= 60) return { label: 'En Riesgo', color: 'error' };
    if (diasAusente >= 30) return { label: 'Enfriandose', color: 'warning' };
    return { label: 'Activo', color: 'success' };
};

const getShieldColor = (score: number) => {
    if (score < 50) return 'text-red-500';
    if (score < 80) return 'text-amber-500';
    return 'text-green-500';
};

interface ClientCardProps {
    client: Client;
    onClick: () => void;
    ratingAvg?: number | null;
    totalRedemptions?: number;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, ratingAvg, totalRedemptions }) => {
    const { formatValue } = useCurrency();
    const diasAusente = client.dias_ausente || 0;
    const uxStatus = getUXStatus(diasAusente, client.estado === 'Inactivo');
    const urgency = getUrgencyBar(diasAusente);
    const cooldownInfo = client.bloqueado_hasta && new Date(client.bloqueado_hasta) > new Date()
        ? Math.ceil((new Date(client.bloqueado_hasta).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const showAutoRescue = uxStatus.color !== 'success' && !client.rescate_exitoso && !cooldownInfo;
    const fiabilidad = client.fiabilidad_score ?? 100;
    const waUrl = `https://wa.me/${client.telefono.replace(/\\s+/g, '').replace('+', '')}?text=Hola%20${encodeURIComponent(client.nombre.split(' ')[0])}`;
    const lastVisit = client.ultima_visita ? new Date(client.ultima_visita) : null;
    const lastVisitDays = lastVisit ? Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div
            onClick={(e) => {
                onClick();
            }}
            className="
                relative flex flex-col gap-3 p-4 rounded-2xl
                border border-gray-100 dark:border-dark-border
                bg-white dark:bg-dark-card
                active:scale-[.98] active:bg-gray-50 dark:active:bg-dark-border
                cursor-pointer transition-all duration-150
                overflow-hidden
            "
        >
            {/* â”€â”€ Fila 1: Avatar + Info + Shield â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="flex items-start gap-3">

                {/* Avatar con dot de estado */}
                <div className="relative shrink-0">
                    <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 text-lg sm:text-xl font-black text-primary">
                        {client.nombre.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-dark-card ${getStatusDot(uxStatus.color)}`} />
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[16px] sm:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[150px] sm:max-w-xs">
                            {client.nombre}
                        </h3>
                        <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${getStatusBadgeStyles(uxStatus.color)}`}>
                            {uxStatus.label}
                        </span>
                        {client.categoria === 'VIP' && (
                            <span className="shrink-0 text-[10px] font-black text-amber-500">â­</span>
                        )}
                    </div>

                    {/* Tel + LTV */}
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate">{client.telefono}</span>
                        {lastVisitDays !== null && (
                            <>
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                <span className="font-semibold text-gray-500 dark:text-gray-400 shrink-0">
                                    {lastVisitDays}d
                                </span>
                            </>
                        )}
                        {(client.ltv || 0) > 0 && (
                            <>
                                <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                                <span className="font-bold text-green-600 dark:text-green-400 shrink-0">
                                    {formatValue(client.ltv || 0)}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Barra urgencia */}
                    {diasAusente > 0 && (
                        <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 flex-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${urgency.color}`} style={{ width: urgency.width }} />
                            </div>
                            <span className="shrink-0 text-[10px] font-bold text-gray-400">{diasAusente}d</span>
                        </div>
                    )}
                </div>

                {/* Shield + chevron */}
                <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
                    {fiabilidad < 80 ? (
                        <ShieldAlert size={16} className={getShieldColor(fiabilidad)} />
                    ) : (
                        <Shield size={16} className="text-green-400" />
                    )}
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
                </div>
            </div>

            {/* ── Fila 1.5: Mini métricas (puntos, calificación, canjes) ── */}
            {((client.puntos != null && client.puntos > 0) || ratingAvg != null || (totalRedemptions != null && totalRedemptions > 0)) && (
                <div className="flex items-center gap-3 px-0.5 -mt-1">
                    {ratingAvg != null && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                            ⭐ {ratingAvg.toFixed(1)}
                        </span>
                    )}
                    {(client.puntos != null && client.puntos > 0) && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400">
                            🏆 {client.puntos} pts
                        </span>
                    )}
                     {(totalRedemptions != null && totalRedemptions > 0) && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            🎁 {totalRedemptions} {totalRedemptions === 1 ? 'canje' : 'canjes'}
                        </span>
                    )}
                    {client.origen_captacion && client.origen_captacion !== 'organico' && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                            📢 {(() => {
                                const map: Record<string, string> = {
                                    'fb_ads': 'Ads',
                                    'recordatorio_mantenimiento': 'Manten.',
                                    'whatsapp_marketing': 'WhatsApp',
                                    'recordatorio_24h': 'Rec. 24h',
                                    'retencion_35': '35d',
                                    'retencion_60': '60d',
                                    'retencion_90': '90d'
                                };
                                return map[client.origen_captacion] || client.origen_captacion;
                            })()}
                        </span>
                    )}
                </div>
            )}

            {/* ── Fila 2: Acciones (siempre visible) ── */}
            <div
                className="flex items-center gap-2 border-t border-gray-50 dark:border-dark-border pt-2"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Depósito requerido */}
                {fiabilidad < 50 && (
                    <span className="flex-1 text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <ShieldAlert size={11} /> âš ï¸ DepÃ³sito
                    </span>
                )}

                <div className="ml-auto flex items-center gap-2">
                                        {/* Estado del rescate */}
                    {client.rescate_exitoso ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle2 size={14} /> Rescatado
                        </span>
                    ) : cooldownInfo ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <SkipForward size={14} /> {cooldownInfo}d
                        </span>
                    ) : showAutoRescue ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <HeartHandshake size={14} /> Auto
                        </span>
                    ) : null}

                    {/* BOT APAGADO - urgente para que la recepcionista lo vea */}
                    {client.bot_pausado && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse">
                            <BotOff size={11} />
                            BOT APAG.
                        </span>
                    )}

                    {/* WhatsApp — quick action footer */}
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-sm bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 active:scale-95 transition-all shrink-0"
                        title="WhatsApp"
                    >
                        <MessageCircle size={18} />
                        <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                </div>
            </div>
        </div>
    );
};


