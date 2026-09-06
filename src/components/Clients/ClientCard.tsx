import React from 'react';
import { MessageCircle, CheckCircle2, ChevronRight, Clock, Shield, ShieldAlert, Sparkles, Phone, Calendar } from 'lucide-react';
import { Client } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';
import { analyzeClientServiceCadence } from '../../utils/serviceCycles';

const getStatusBadgeStyles = (color: string) => {
    switch (color) {
        case 'critical': 
            return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/40';
        case 'error': 
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/40';
        case 'warning': 
            return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
        case 'success': 
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40';
        default: 
            return 'bg-gray-50 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-200/60 dark:border-gray-700/40';
    }
};

const getStatusDot = (color: string) => {
    switch (color) {
        case 'critical': return 'bg-purple-500';
        case 'error': return 'bg-rose-500';
        case 'warning': return 'bg-amber-500';
        case 'success': return 'bg-emerald-500';
        default: return 'bg-gray-400';
    }
};

const getUrgencyBar = (diasAusente: number, isLongCycleOnly: boolean = false) => {
    if (isLongCycleOnly) {
        if (diasAusente >= 180) return { width: '100%', color: 'bg-purple-500' };
        if (diasAusente >= 120) return { width: '75%', color: 'bg-amber-500' };
        return { width: '25%', color: 'bg-emerald-500' };
    }
    if (diasAusente >= 120) return { width: '100%', color: 'bg-purple-500' };
    if (diasAusente > 75) return { width: '80%', color: 'bg-rose-500' };
    if (diasAusente > 45) return { width: '55%', color: 'bg-amber-500' };
    return { width: '20%', color: 'bg-emerald-500' };
};

export const getUXStatus = (diasAusente: number, isInactivo: boolean, isLongCycleOnly: boolean = false) => {
    if (isLongCycleOnly) {
        if (isInactivo || diasAusente >= 180) return { label: 'Perdida (+6m)', color: 'critical' };
        if (diasAusente >= 120) return { label: 'Por Renovar (4-6m)', color: 'warning' };
        return { label: 'Alisado Vigente', color: 'success' };
    }
    if (isInactivo || diasAusente >= 120) return { label: 'Inactiva (+120d)', color: 'critical' };
    if (diasAusente > 75) return { label: 'En Riesgo (+75d)', color: 'error' };
    if (diasAusente > 45) return { label: 'En Riesgo (45-75d)', color: 'warning' };
    return { label: 'Activa (≤45d)', color: 'success' };
};

// Generador determinista de degradados pastel elegantes para avatar según inicial/nombre
const getAvatarGradient = (name: string) => {
    const gradients = [
        'from-violet-500/15 to-purple-500/15 text-violet-700 dark:text-violet-300 dark:from-violet-900/30 dark:to-purple-900/30',
        'from-pink-500/15 to-rose-500/15 text-pink-700 dark:text-pink-300 dark:from-pink-900/30 dark:to-rose-900/30',
        'from-indigo-500/15 to-blue-500/15 text-indigo-700 dark:text-indigo-300 dark:from-indigo-900/30 dark:to-blue-900/30',
        'from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-300 dark:from-emerald-900/30 dark:to-teal-900/30',
        'from-amber-500/15 to-orange-500/15 text-amber-800 dark:text-amber-300 dark:from-amber-900/30 dark:to-orange-900/30',
    ];
    let sum = 0;
    for (let i = 0; i < (name || '').length; i++) {
        sum += name.charCodeAt(i);
    }
    return gradients[sum % gradients.length];
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
    const svcs = Array.isArray(services) && services.length > 0 
        ? services 
        : (client.ultimo_servicio ? [client.ultimo_servicio] : []);
    const cadence = analyzeClientServiceCadence(svcs);
    const diasAusente = client.dias_ausente || 0;
    const uxStatus = getUXStatus(diasAusente, client.estado === 'Inactivo', cadence.isLongCycleOnly);
    const urgency = getUrgencyBar(diasAusente, cadence.isLongCycleOnly);
    
    const cooldownInfo = client.bloqueado_hasta && new Date(client.bloqueado_hasta) > new Date()
        ? Math.ceil((new Date(client.bloqueado_hasta).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null;

    const fiabilidad = client.fiabilidad_score ?? 100;
    const cleanPhone = (client.telefono || '').replace(/\D/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=Hola%20${encodeURIComponent(client.nombre.split(' ')[0])}`;
    const initials = client.nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase())
        .join('') || client.nombre.charAt(0).toUpperCase() || 'C';

    const ultimoServicioTexto = client.ultimo_servicio || (svcs.length > 0 ? svcs[0] : null);

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col justify-between p-4 rounded-2xl border border-gray-100 dark:border-dark-border/90 bg-white dark:bg-dark-card shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(99,102,241,0.12)] hover:border-indigo-200/70 dark:hover:border-indigo-500/30 active:scale-[0.99] cursor-pointer transition-all duration-200 overflow-hidden"
        >
            {/* Header: Avatar, Nombres, Badges y Fiabilidad */}
            <div>
                <div className="flex items-start justify-between gap-2.5">
                    {/* Izquierda: Avatar y Datos de la Clienta */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        {/* Avatar estilizado con gradiente y dot de status */}
                        <div className="relative shrink-0 mt-0.5">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(client.nombre)} text-sm font-extrabold shadow-sm tracking-tight`}>
                                {initials}
                            </div>
                            <span 
                                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-dark-card ${getStatusDot(uxStatus.color)}`} 
                                title={uxStatus.label}
                            />
                        </div>

                        {/* Nombre y Badges de Status */}
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white leading-tight truncate">
                                    {client.nombre}
                                </h3>
                                {client.categoria === 'VIP' && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black tracking-wide border border-amber-500/20">
                                        <Sparkles size={10} className="text-amber-500" /> VIP
                                    </span>
                                )}
                            </div>

                            {/* Badge de salud del ciclo de vida */}
                            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide ${getStatusBadgeStyles(uxStatus.color)}`}>
                                    {uxStatus.label}
                                </span>

                                {client.rescate_exitoso && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
                                        <CheckCircle2 size={11} /> Rescatada
                                    </span>
                                )}

                                {cooldownInfo && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                        <Clock size={10} /> Pausa {cooldownInfo}d
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Derecha: Pill de Fiabilidad y Chevron de apertura */}
                    <div className="shrink-0 flex items-center gap-1.5">
                        <div 
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-black border transition-all ${
                                fiabilidad < 50
                                    ? 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40'
                                    : fiabilidad < 80
                                    ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                            }`}
                            title={`Score de fiabilidad: ${fiabilidad}/100`}
                        >
                            {fiabilidad < 50 ? (
                                <ShieldAlert size={13} className="text-rose-600 dark:text-rose-400 shrink-0" />
                            ) : (
                                <Shield size={13} className={fiabilidad < 80 ? 'text-amber-600 dark:text-amber-400 shrink-0' : 'text-emerald-600 dark:text-emerald-400 shrink-0'} />
                            )}
                            <span>{fiabilidad}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                </div>

                {/* Sub-información relevante: Teléfono, Días ausente y Valor Generado (LTV) */}
                <div className="mt-3 grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-gray-50/70 dark:bg-dark-bg/60 border border-gray-100/80 dark:border-dark-border/50 text-center">
                    <div>
                        <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Última Visita</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                            {diasAusente > 0 ? `Hace ${diasAusente}d` : 'Hoy'}
                        </span>
                    </div>
                    <div className="border-x border-gray-200/60 dark:border-dark-border/60">
                        <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Histórico LTV</span>
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {client.ltv ? formatValue(client.ltv) : 'S/ 0'}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Visitas</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                            {client.total_visitas || 0}
                        </span>
                    </div>
                </div>

                {/* Barra de progreso visual de ausencia */}
                {diasAusente > 0 && (
                    <div className="mt-2 flex items-center gap-2 px-0.5">
                        <div className="h-1.5 flex-1 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${urgency.color}`} 
                                style={{ width: urgency.width }} 
                            />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
                            {diasAusente}d ausente
                        </span>
                    </div>
                )}

                {/* Mini etiquetas complementarias (Último servicio o puntos) */}
                {(ultimoServicioTexto || (client.puntos != null && client.puntos > 0) || ratingAvg != null) && (
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px]">
                        {ultimoServicioTexto && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 font-medium truncate max-w-[200px]">
                                💅 <span className="truncate">{ultimoServicioTexto}</span>
                            </span>
                        )}
                        {ratingAvg != null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 font-bold">
                                ⭐ {ratingAvg.toFixed(1)}
                            </span>
                        )}
                        {client.puntos != null && client.puntos > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300 font-bold">
                                🏆 {client.puntos} pts
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Footer: Teléfono & Acción directa de WhatsApp */}
            <div 
                className="mt-3 pt-2.5 border-t border-gray-100 dark:border-dark-border/60 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <Phone size={13} className="text-gray-400 dark:text-gray-500" />
                    <span>{client.telefono || 'Sin teléfono'}</span>
                </div>

                <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-xs hover:shadow-sm hover:shadow-emerald-500/20 active:scale-95 transition-all"
                    title={`Abrir chat con ${client.nombre}`}
                >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                </a>
            </div>
        </div>
    );
};


