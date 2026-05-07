/**
 * SegmentDetail.tsx
 * Premium iPhone-style segment detail with expandable client history timeline.
 * Mobile-first. Glass morphism header. Animated transitions.
 */
import React, { useState } from 'react';
import {
    ArrowLeft, Users, TrendingUp, Target, AlertTriangle,
    Send, BarChart3, Calendar, ChevronDown, Clock, Sparkles, Star
} from 'lucide-react';
import { ServiceCategory } from '../../types/crm';
import { SegmentClientProfile, SegmentMetrics } from '../../types/crm';
import { getCategoryById } from '../../utils/segmentation';
import { useCurrency } from '../../hooks/useCurrency';

interface Props {
    title: string;
    subtitle?: string;
    emoji?: string;
    color?: string;
    profiles: SegmentClientProfile[];
    metrics: SegmentMetrics;
    categories?: ServiceCategory[];
    onBack: () => void;
    onSendCampaign: (profiles: SegmentClientProfile[]) => void;
}

const lifecycleConfig: Record<string, { cls: string; dot: string; label: string }> = {
    'Activo': { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Activo' },
    'Enfriandose': { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', dot: 'bg-amber-500', label: 'Enfriandose' },
    'En Riesgo': { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', dot: 'bg-orange-500', label: 'En Riesgo' },
    'Perdido': { cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', dot: 'bg-red-500', label: 'Perdido' },
    'Nuevo': { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', dot: 'bg-blue-500', label: 'Nuevo' },
};

const SegmentDetail: React.FC<Props> = ({
    title, subtitle, emoji, color = 'from-indigo-400 to-purple-500',
    profiles, metrics, categories, onBack, onSendCampaign,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'ltv' | 'dias' | 'nombre'>('ltv');
    const [expandedClient, setExpandedClient] = useState<number | null>(null);
    const { formatValue } = useCurrency();

    const filtered = profiles
        .filter(p =>
            !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'ltv') return b.ltv - a.ltv;
            if (sortBy === 'dias') return b.dias_ausente - a.dias_ausente;
            return a.nombre.localeCompare(b.nombre);
        });

    const activePercent = metrics.total > 0 ? Math.round((metrics.activos / metrics.total) * 100) : 0;

    const kpis = [
        { label: 'Clientas', value: String(metrics.total), icon: Users, sub: `${activePercent}% activas` },
        { label: 'LTV Prom.', value: formatValue(metrics.ltvPromedio), icon: TrendingUp, sub: 'promedio' },
        { label: 'Ticket', value: formatValue(metrics.ticketPromedio), icon: Target, sub: 'por visita' },
    ];

    return (
        <div className="flex flex-col min-h-0 -mx-0">
            {/* ── Hero header ── */}
            <div className={`bg-gradient-to-br ${color} rounded-3xl p-5 mb-4 relative overflow-hidden`}
                style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            >
                {/* Decorative blobs */}
                <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
                <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10 blur-xl" aria-hidden />

                {/* Back */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-white/80 hover:text-white mb-4 transition-colors active:scale-95"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-xs font-bold">Volver</span>
                </button>

                <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                        <span className="text-3xl leading-none">{emoji || '📊'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-white leading-tight tracking-tight">{title}</h2>
                        {subtitle && (
                            <p className="text-[12px] text-white/75 mt-1 leading-snug line-clamp-2">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2">
                    {kpis.map(kpi => (
                        <div key={kpi.label} className="rounded-2xl bg-white/15 backdrop-blur-sm px-2.5 py-3 text-center">
                            <p className="text-base font-black text-white leading-none">{kpi.value}</p>
                            <p className="text-[9px] text-white/70 mt-0.5 font-medium uppercase tracking-wide">{kpi.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Health distribution ── */}
            <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-4 mb-3"
                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
            >
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide">Distribución</h4>
                    <span className="text-xs font-bold text-indigo-500">{activePercent}% activas</span>
                </div>
                {/* Stacked bar */}
                <div className="h-2 rounded-full overflow-hidden flex gap-0.5 mb-3">
                    <div className="bg-emerald-400 rounded-l-full transition-all duration-700" style={{ width: `${metrics.activos / Math.max(metrics.total, 1) * 100}%` }} />
                    <div className="bg-amber-400 transition-all duration-700" style={{ width: `${(metrics.enRiesgo * 0.4) / Math.max(metrics.total, 1) * 100}%` }} />
                    <div className="bg-orange-400 transition-all duration-700" style={{ width: `${(metrics.enRiesgo * 0.6) / Math.max(metrics.total, 1) * 100}%` }} />
                    <div className="bg-red-400 rounded-r-full transition-all duration-700" style={{ width: `${metrics.perdidos / Math.max(metrics.total, 1) * 100}%` }} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {[
                        { label: `Activas`, count: metrics.activos, color: 'bg-emerald-400' },
                        { label: `En riesgo`, count: metrics.enRiesgo, color: 'bg-orange-400' },
                        { label: `Perdidas`, count: metrics.perdidos, color: 'bg-red-400' },
                    ].map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${l.color}`} />
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                {l.label} <span className="font-bold text-gray-700 dark:text-gray-300">({l.count})</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Top services ── */}
            {metrics.topServices.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-4 mb-3"
                    style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                >
                    <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
                        Servicios más pedidos
                    </h4>
                    <div className="space-y-2">
                        {metrics.topServices.slice(0, 4).map((s, idx) => {
                            const maxCount = metrics.topServices[0]?.count || 1;
                            const barW = Math.round((s.count / maxCount) * 100);
                            return (
                                <div key={s.servicio}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate max-w-[70%]">{s.servicio}</span>
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded-full">
                                            {s.count}x
                                        </span>
                                    </div>
                                    {idx === 0 && (
                                        <div className="h-1 rounded-full bg-gray-100 dark:bg-dark-bg overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-700" style={{ width: `${barW}%` }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Campaign CTA ── */}
            <button
                onClick={() => onSendCampaign(profiles)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-black text-white mb-4 active:scale-[0.98] transition-transform"
                style={{ boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}
            >
                <Send className="h-4 w-4" />
                Crear campaña
                <span className="bg-white/20 rounded-full px-2 py-0.5 text-[11px] font-black">{profiles.length}</span>
            </button>

            {/* ── Client list ── */}
            <div>
                {/* List header */}
                <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                        Clientas
                        <span className="text-gray-400 font-medium ml-1">({filtered.length})</span>
                    </h4>
                    <div className="ml-auto flex gap-1">
                        {(['ltv', 'dias', 'nombre'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setSortBy(s)}
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${sortBy === s
                                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                                    : 'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400'
                                    }`}
                            >
                                {s === 'ltv' ? 'LTV' : s === 'dias' ? 'Días' : 'A-Z'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search input */}
                <div className="relative mb-3">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar clienta..."
                        className="w-full rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card pl-4 pr-3 py-2.5 text-sm dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                    />
                </div>

                {/* Clients */}
                <div className="space-y-2">
                    {filtered.map(p => {
                        const lc = p.lifecycle || 'Activo';
                        const lcConfig = lifecycleConfig[lc] || lifecycleConfig['Activo'];
                        const serviceCategories = (Array.from(p.categoryIds) as string[])
                            .map(id => getCategoryById(id, categories || []))
                            .filter((c): c is NonNullable<typeof c> => Boolean(c));

                        const isExpanded = expandedClient === p.clientId;

                        // Top service by frequency
                        const serviceCounts: Record<string, number> = {};
                        (p.serviceHistory || []).forEach(h => {
                            serviceCounts[h.servicio] = (serviceCounts[h.servicio] || 0) + 1;
                        });
                        const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

                        return (
                            <div
                                key={p.clientId}
                                className="rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden transition-all duration-200"
                                style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}
                            >
                                {/* Main row */}
                                <button
                                    onClick={() => setExpandedClient(isExpanded ? null : p.clientId)}
                                    className="flex items-center gap-3 p-3.5 text-left w-full hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                                >
                                    {/* Avatar with gradient */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white font-black text-sm shadow-sm`}>
                                            {p.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        {/* Status dot */}
                                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-dark-card ${lcConfig.dot}`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.nombre}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            {topService && (
                                                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded-md border border-amber-100 dark:border-amber-800/40">
                                                    <Sparkles className="h-2.5 w-2.5" />
                                                    {topService}
                                                </span>
                                            )}
                                            {/* Category emojis */}
                                            <div className="flex gap-0.5">
                                                {serviceCategories.slice(0, 4).map((cat: any) => (
                                                    <span key={cat.id} title={cat.label} className="text-sm leading-none">{cat.emoji}</span>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500">{p.dias_ausente}d sin venir</span>
                                        </div>
                                    </div>

                                    {/* LTV + expand */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{formatValue(p.ltv)}</p>
                                            <p className="text-[9px] text-gray-400 font-medium">LTV</p>
                                        </div>
                                        <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-bg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="h-3 w-3 text-gray-500" />
                                        </div>
                                    </div>
                                </button>

                                {/* Expanded: history timeline */}
                                {isExpanded && (
                                    <div className="border-t border-gray-50 dark:border-dark-border/50 bg-gray-50/60 dark:bg-dark-bg/30 px-4 py-3">
                                        {/* Summary chips */}
                                        <div className="flex items-center gap-2 flex-wrap mb-3">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${lcConfig.cls}`}>
                                                {lc}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-dark-card px-2 py-1 rounded-full border border-gray-100 dark:border-dark-border font-medium">
                                                <Star className="h-2.5 w-2.5 text-amber-400" />
                                                {(p.serviceHistory || []).length} servicios totales
                                            </span>
                                        </div>

                                        {/* Timeline */}
                                        {p.serviceHistory && p.serviceHistory.length > 0 ? (
                                            <>
                                                <h5 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    Historial completo
                                                </h5>
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                                                    {[...p.serviceHistory]
                                                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                                        .map((h, i) => {
                                                            const date = new Date(h.fecha);
                                                            const isValid = !isNaN(date.getTime());
                                                            const formattedDate = isValid
                                                                ? date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' })
                                                                : 'Fecha desconocida';
                                                            const isCompleted = h.estado.toLowerCase() === 'completada';
                                                            const isCancelled = h.estado.toLowerCase().includes('cancel');

                                                            return (
                                                                <div key={i} className="flex items-start gap-2.5">
                                                                    {/* Timeline dot */}
                                                                    <div className="relative flex flex-col items-center mt-1">
                                                                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isCompleted ? 'bg-emerald-500' : isCancelled ? 'bg-red-400' : 'bg-gray-300'}`} />
                                                                        {i < (p.serviceHistory!.length - 1) && (
                                                                            <div className="w-px h-4 mt-0.5 bg-gray-200 dark:bg-dark-border" />
                                                                        )}
                                                                    </div>
                                                                    {/* Content */}
                                                                    <div className="flex-1 min-w-0 bg-white dark:bg-dark-card rounded-xl p-2.5 border border-gray-100 dark:border-dark-border">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">{h.servicio}</span>
                                                                            <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                                                                    isCancelled ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
                                                                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                                                }`}>
                                                                                {h.estado}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 mt-1">
                                                                            <Clock className="h-2.5 w-2.5 text-gray-400" />
                                                                            <span className="text-[10px] text-gray-400 font-medium">{formattedDate}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-[11px] text-gray-400 text-center py-2">Sin historial registrado</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm font-medium">No hay clientas en este segmento</p>
                            <p className="text-xs mt-1 opacity-70">Prueba con otro filtro</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SegmentDetail;
