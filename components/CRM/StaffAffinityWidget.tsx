/**
 * StaffAffinityWidget.tsx
 * BI Widget 3 — Staff departure risk analysis.
 * Shows staff members with dangerous exclusive client dependencies.
 * Premium iPhone-style. Nilah IA · Korat Flow.
 */
import React, { useState } from 'react';
import { Users, AlertTriangle, Shield, ChevronDown, TrendingDown } from 'lucide-react';
import { StaffAffinityResult } from '../../types/crm';
import { useCurrency } from '../../hooks/useCurrency';

interface Props {
    results: StaffAffinityResult[];
}

const riskConfig = {
    critical: {
        label: 'CRÍTICO',
        gradient: 'from-red-500 to-rose-600',
        badgeCls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        barCls: 'bg-gradient-to-r from-red-400 to-rose-500',
        emoji: '🔴',
        description: 'Si esta empleada renuncia, el salón pierde muchas clientas.',
    },
    high: {
        label: 'ALTO',
        gradient: 'from-orange-400 to-amber-500',
        badgeCls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        barCls: 'bg-gradient-to-r from-orange-400 to-amber-500',
        emoji: '🟠',
        description: 'Riesgo significativo de pérdida de clientes.',
    },
    medium: {
        label: 'MEDIO',
        gradient: 'from-amber-400 to-yellow-500',
        badgeCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        barCls: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        emoji: '🟡',
        description: 'Hay dependencia parcial. Diversifica la exposición.',
    },
    low: {
        label: 'BAJO',
        gradient: 'from-emerald-400 to-teal-500',
        badgeCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        barCls: 'bg-gradient-to-r from-emerald-400 to-teal-500',
        emoji: '🟢',
        description: 'Clientes bien distribuidas entre el equipo.',
    },
};

const StaffAffinityWidget: React.FC<Props> = ({ results }) => {
    const { formatValue } = useCurrency();
    const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

    if (results.length === 0) {
        return (
            <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div className="bg-gradient-to-br from-violet-400 to-purple-600 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white leading-tight">Afinidad de Equipo</h3>
                            <p className="text-[11px] text-white/75">Riesgo si una empleada se va</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-dark-card p-8 text-center text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Sin datos de empleadas</p>
                    <p className="text-xs opacity-70 mt-1">Las citas deben tener empleada asignada</p>
                </div>
            </div>
        );
    }

    const highRiskCount = results.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length;

    return (
        <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" aria-hidden />
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white leading-tight tracking-tight">Afinidad de Equipo</h3>
                        <p className="text-[11px] text-white/75">Riesgo de pérdida de clientas si una empleada se va</p>
                    </div>
                </div>
                {highRiskCount > 0 && (
                    <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2">
                        <AlertTriangle className="h-4 w-4 text-white flex-shrink-0" />
                        <p className="text-[12px] text-white font-semibold leading-tight">
                            {highRiskCount} empleada{highRiskCount > 1 ? 's' : ''} con riesgo alto o crítico
                        </p>
                    </div>
                )}
            </div>

            {/* Staff cards */}
            <div className="bg-white dark:bg-dark-card p-4 space-y-3">
                {results.map(staff => {
                    const cfg = riskConfig[staff.riskLevel];
                    const sid = String(staff.staffId);
                    const isExpanded = expandedStaff === sid;

                    return (
                        <div
                            key={sid}
                            className="rounded-2xl border border-gray-100 dark:border-dark-border overflow-hidden"
                        >
                            {/* Main row */}
                            <button
                                onClick={() => setExpandedStaff(isExpanded ? null : sid)}
                                className="flex items-center gap-3 w-full p-3.5 text-left hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                            >
                                {/* Avatar */}
                                <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${cfg.gradient} text-white font-black text-sm shadow-sm`}>
                                    {staff.staffName.charAt(0).toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{staff.staffName}</p>
                                        <span className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
                                            {cfg.emoji} {cfg.label}
                                        </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-dark-bg overflow-hidden mb-1">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${cfg.barCls}`}
                                            style={{ width: `${staff.exclusivePct}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                        {staff.exclusiveClients} de {staff.totalClients} clientas son exclusivas · {staff.exclusivePct}%
                                    </p>
                                </div>

                                <div className={`flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-bg transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="h-3 w-3 text-gray-500" />
                                </div>
                            </button>

                            {/* Expanded: risk description + top exclusive clients */}
                            {isExpanded && (
                                <div className="border-t border-gray-50 dark:border-dark-border/50 bg-gray-50/60 dark:bg-dark-bg/30 p-4">
                                    {/* Risk description */}
                                    <div className={`flex items-start gap-2 rounded-2xl p-3 mb-3 ${staff.riskLevel === 'critical' || staff.riskLevel === 'high'
                                        ? 'bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-800/30'
                                        : 'bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border'
                                        }`}>
                                        {staff.riskLevel === 'low' ? (
                                            <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                                        )}
                                        <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-snug">{cfg.description}</p>
                                    </div>

                                    {/* Top exclusive clients by LTV */}
                                    {staff.topExclusiveClients.length > 0 && (
                                        <>
                                            <h5 className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                                🎯 Clientas exclusivas (mayor LTV)
                                            </h5>
                                            <div className="space-y-1.5">
                                                {staff.topExclusiveClients.map((c, i) => (
                                                    <div
                                                        key={c.clientId}
                                                        className="flex items-center gap-2.5 bg-white dark:bg-dark-card rounded-xl p-2.5 border border-gray-100 dark:border-dark-border"
                                                    >
                                                        <span className="text-[10px] font-black text-gray-400 w-4 text-center">#{i + 1}</span>
                                                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${cfg.gradient} text-white font-black text-xs flex-shrink-0`}>
                                                            {c.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                        <p className="flex-1 text-[12px] font-semibold text-gray-700 dark:text-gray-300 truncate">{c.nombre}</p>
                                                        <span className="text-[11px] font-black text-gray-600 dark:text-gray-300 flex-shrink-0 whitespace-nowrap">{formatValue(c.ltv)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StaffAffinityWidget;
