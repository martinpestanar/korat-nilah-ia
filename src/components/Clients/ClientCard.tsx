import React from 'react';
import { MessageCircle, HeartHandshake, CheckCircle2, ChevronRight, SkipForward, Shield, ShieldAlert, BotOff } from 'lucide-react';
import { Client } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

import { analyzeClientServiceCadence } from '../../utils/serviceCycles';

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

const getUrgencyBar = (diasAusente: number, isLongCycleOnly: boolean = false) => {
    if (isLongCycleOnly) {
        if (diasAusente >= 180) return { width: '100%', color: 'bg-purple-500' };
        if (diasAusente >= 120) return { width: '75%', color: 'bg-amber-500' };
        return { width: '20%', color: 'bg-green-500' };
    }
    if (diasAusente >= 120) return { width: '100%', color: 'bg-purple-500' };
    if (diasAusente > 75) return { width: '75%', color: 'bg-red-500' };
    if (diasAusente > 45) return { width: '50%', color: 'bg-amber-500' };
    return { width: '15%', color: 'bg-emerald-500' };
};

export const getUXStatus = (diasAusente: number, isInactivo: boolean, isLongCycleOnly: boolean = false) => {
    if (isLongCycleOnly) {
        if (isInactivo || diasAusente >= 180) return { label: 'Perdido (+6m)', color: 'critical' };
        if (diasAusente >= 120) return { label: 'Por Renovar (4-6m)', color: 'warning' };
        return { label: 'Alisado Vigente', color: 'success' };
    }
    if (isInactivo || diasAusente >= 120) return { label: 'Perdido (+120d)', color: 'critical' };
    if (diasAusente > 75) return { label: 'Inactiva (+75d)', color: 'error' };
    if (diasAusente > 45) return { label: 'En Riesgo (45-75d)', color: 'warning' };
    return { label: 'Activo (≤45d)', color: 'success' };
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
    services?: string[];
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick, ratingAvg, totalRedemptions, services = [] }) => {
    const { formatValue } = useCurrency();
    const svcs = services.length > 0 ? services : (client.ultimo_servicio ? [client.ultimo_servicio] : []);
    const cadence = analyzeClientServiceCadence(svcs);
    const diasAusente = client.dias_ausente || 0;
    const uxStatus = getUXStatus(diasAusente, client.estado === 'Inactivo', cadence.isLongCycleOnly);
    const urgency = getUrgencyBar(diasAusente, cadence.isLongCycleOnly);
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
                @container
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
                    <div className="flex h-12 w-12 @sm:h-14 @sm:w-14 items-center justify-center rounded-full bg-primary/10 text-lg @sm:text-xl font-black text-primary">
                        {client.nombre.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-dark-card ${getStatusDot(uxStatus.color)}`} />
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[16px] @sm:text-lg font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[150px] @sm:max-w-xs">
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

                {/* Shield / Fiabilidad Pill + chevron */}
                <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
                    <div 
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black border transition-all ${
                            fiabilidad < 50
                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40'
                                : fiabilidad < 80
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                        }`}
                        title={`Fiabilidad: ${fiabilidad}/100`}
                    >
                        {fiabilidad < 50 ? (
                            <ShieldAlert size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        ) : (
                            <Shield size={13} className={fiabilidad < 80 ? 'text-amber-600 dark:text-amber-400 shrink-0' : 'text-emerald-600 dark:text-emerald-400 shrink-0'} />
                        )}
                        <span>{fiabilidad}</span>
                    </div>
                    <ChevronRight size={15} className="text-gray-300 dark:text-gray-600" />
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

            {/* ── Fila 2: Acciones y Estado de Activación ── */}
            <div
                className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-dark-border/60 pt-2.5 mt-0.5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Lado izquierdo: Estado de rescate / automatización / alertas */}
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {client.rescate_exitoso ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                            <CheckCircle2 size={13} />
                            <span>Rescatada</span>
                        </span>
                    ) : cooldownInfo ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            <SkipForward size={13} />
                            <span>Cooldown {cooldownInfo}d</span>
                        </span>
                    ) : showAutoRescue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                            <HeartHandshake size={13} />
                            <span>Auto Rescate</span>
                        </span>
                    ) : null}

                    {fiabilidad < 50 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <ShieldAlert size={11} />
                            <span>Depósito</span>
                        </span>
                    )}
                </div>

                {/* Lado derecho: Botón WhatsApp unificado y estilizado */}
                <div className="flex items-center gap-2 shrink-0">
                    <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 active:scale-95 transition-all"
                        title="Enviar WhatsApp"
                        aria-label={`Enviar WhatsApp a ${client.nombre}`}
                    >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                    </a>
                </div>
            </div>
        </div>
    );
};


