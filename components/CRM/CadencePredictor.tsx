/**
 * CadencePredictor.tsx
 * BI Widget 1 — Personal rhythm predictor.
 * Shows clients grouped by their PERSONAL overdue status,
 * not a generic 45-day threshold.
 * Premium iPhone-style. Nilah IA · Korat Flow.
 */
import React, { useState } from 'react';
import { Clock, AlertTriangle, TrendingDown, CheckCircle, ChevronDown, Zap } from 'lucide-react';
import { RFMClientProfile } from '../../types/crm';
import { useCurrency } from '../../hooks/useCurrency';

interface Props {
    profiles: RFMClientProfile[];
    onClientClick?: (clientId: number) => void;
}

const riskConfig = {
    'overdue': {
        label: 'Atrasadas',
        sublabel: 'Pasaron su ventana habitual',
        gradient: 'from-red-400 to-rose-500',
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        dot: 'bg-red-500',
        icon: AlertTriangle,
        emoji: '🚨',
    },
    'due-soon': {
        label: 'Por Venir',
        sublabel: 'En los próximos 7 días',
        gradient: 'from-amber-400 to-orange-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        dot: 'bg-amber-400',
        icon: Clock,
        emoji: '⏰',
    },
    'on-time': {
        label: 'Al Día',
        sublabel: 'Dentro de su ventana',
        gradient: 'from-emerald-400 to-teal-500',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        dot: 'bg-emerald-400',
        icon: CheckCircle,
        emoji: '✅',
    },
    'lost': {
        label: 'Perdidas',
        sublabel: 'Muy por encima de su ritmo',
        gradient: 'from-gray-400 to-slate-500',
        badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
        dot: 'bg-gray-400',
        icon: TrendingDown,
        emoji: '💔',
    },
};

const CadencePredictor: React.FC<Props> = ({ profiles }) => {
    const { formatValue } = useCurrency();
    const [activeRisk, setActiveRisk] = useState<RFMClientProfile['riskLevel']>('overdue');
    const [expandedClient, setExpandedClient] = useState<number | null>(null);

    const grouped = {
        overdue: profiles.filter(p => p.riskLevel === 'overdue'),
        'due-soon': profiles.filter(p => p.riskLevel === 'due-soon'),
        'on-time': profiles.filter(p => p.riskLevel === 'on-time'),
        lost: profiles.filter(p => p.riskLevel === 'lost'),
    };

    const cfg = riskConfig[activeRisk];
    const Icon = cfg.icon;
    const activeList = grouped[activeRisk];

    const riskOrder: RFMClientProfile['riskLevel'][] = ['overdue', 'due-soon', 'on-time', 'lost'];

    return (
        <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Gradient header */}
            <div className={`bg-gradient-to-br ${cfg.gradient} p-5 relative overflow-hidden`}>
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" aria-hidden />
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white leading-tight tracking-tight">Predictor de Ritmo</h3>
                        <p className="text-[11px] text-white/75">Basado en la cadencia personal de cada clienta</p>
                    </div>
                </div>

                {/* Risk tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {riskOrder.map(risk => {
                        const rc = riskConfig[risk];
                        const count = grouped[risk].length;
                        return (
                            <button
                                key={risk}
                                onClick={() => setActiveRisk(risk)}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black transition-all ${activeRisk === risk
                                    ? 'bg-white text-gray-800 shadow-md'
                                    : 'bg-white/20 text-white'
                                    }`}
                            >
                                <span>{rc.emoji}</span>
                                {rc.label}
                                {count > 0 && (
                                    <span className={`min-w-[18px] text-center rounded-full px-1 text-[10px] font-black ${activeRisk === risk ? 'bg-gray-100 text-gray-700' : 'bg-white/30 text-white'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Body */}
            <div className="bg-white dark:bg-dark-card p-4">
                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-3">{cfg.sublabel}</p>

                {activeList.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <span className="text-3xl block mb-2">✨</span>
                        <p className="text-sm font-medium">Sin clientas en esta categoría</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {activeList.slice(0, 20).map(p => {
                            const isExpanded = expandedClient === p.clientId;
                            const overdueTxt = p.overdueByDays > 0
                                ? `+${p.overdueByDays}d atrasada`
                                : p.overdueByDays === 0
                                    ? 'Justo hoy'
                                    : `Faltan ${Math.abs(p.overdueByDays)}d`;

                            return (
                                <div
                                    key={p.clientId}
                                    className="rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedClient(isExpanded ? null : p.clientId)}
                                        className="flex items-center gap-3 w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.gradient} text-white font-black text-sm`}>
                                            {p.nombre.charAt(0).toUpperCase()}
                                            <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-dark-card ${cfg.dot}`} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.nombre}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{p.topService}</p>
                                        </div>

                                        {/* Overdue badge + expand */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${cfg.badge}`}>
                                                {overdueTxt}
                                            </span>
                                            <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-bg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="h-3 w-3 text-gray-500" />
                                            </div>
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="bg-gray-50 dark:bg-dark-bg/50 px-4 py-3 border-t border-gray-100 dark:border-dark-border/50 flex flex-wrap gap-3">
                                            {[
                                                { label: 'LTV', value: formatValue(p.ltv) },
                                                { label: 'Ritmo habitual', value: `${p.avgCadenceDays}d` },
                                                { label: 'Última visita', value: `hace ${p.daysSinceLastVisit}d` },
                                                { label: 'Total visitas', value: String(p.totalVisits) },
                                            ].map(m => (
                                                <div key={m.label} className="rounded-xl bg-white dark:bg-dark-card px-3 py-2 border border-gray-100 dark:border-dark-border text-center">
                                                    <p className="text-[11px] font-black text-gray-900 dark:text-white">{m.value}</p>
                                                    <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide font-medium">{m.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {activeList.length > 20 && (
                            <p className="text-center text-xs text-gray-400 py-2">+{activeList.length - 20} más</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CadencePredictor;
