/**
 * SegmentInsights.tsx
 * Premium iPhone-style auto-insights cards.
 * Horizontal scroll with gradient "story" cards.
 */
import React from 'react';
import { AutoInsight } from '../../types/crm';
import { Zap, ArrowRight, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react';
import WidgetHelper from '../UI/WidgetHelper';

interface Props {
    insights: AutoInsight[];
    onInsightClick: (insight: AutoInsight) => void;
}

const priorityConfig = {
    high: {
        label: 'Urgente',
        icon: AlertTriangle,
        badgeCls: 'bg-red-500/90 text-white',
    },
    medium: {
        label: 'Oportunidad',
        icon: TrendingUp,
        badgeCls: 'bg-amber-500/90 text-white',
    },
    low: {
        label: 'Insight',
        icon: Lightbulb,
        badgeCls: 'bg-sky-500/90 text-white',
    },
};

const SegmentInsights: React.FC<Props> = ({ insights, onInsightClick }) => {
    if (insights.length === 0) return null;

    const urgentCount = insights.filter(i => i.priority === 'high').length;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-indigo-500/30">
                    <Zap className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                        Insights IA
                    </h2>
                    <WidgetHelper
                        title="Insights IA"
                        what="Nilah analiza tu base de datos cada noche buscando alertas u oportunidades automáticas."
                        why="Ahorras horas buscando a quién contactar. Son listas accionables listas para enviar campañas."
                    />
                </div>
                {urgentCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-[10px] font-black text-white animate-pulse shadow-sm shadow-red-500/50">
                        {urgentCount}
                    </span>
                )}
                <span className="ml-auto text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    {insights.length} detectados
                </span>
            </div>

            {/* Cards — horizontal scroll like iPhone "stories" */}
            <div
                className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory -mx-1 px-1"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {insights.map(insight => {
                    const cfg = priorityConfig[insight.priority];
                    const PriorityIcon = cfg.icon;

                    return (
                        <button
                            key={insight.id}
                            onClick={() => onInsightClick(insight)}
                            className="flex-shrink-0 snap-start w-52 rounded-3xl overflow-hidden active:scale-[0.97] transition-transform duration-200 text-left focus:outline-none"
                            style={{
                                boxShadow: '0 6px 28px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.06)',
                            }}
                        >
                            {/* Gradient body */}
                            <div className={`bg-gradient-to-br ${insight.color} p-4 relative overflow-hidden`}>
                                {/* Decorative blob */}
                                <div
                                    className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-white/10 blur-xl"
                                    aria-hidden
                                />

                                {/* Priority badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full shadow-sm ${cfg.badgeCls}`}>
                                        <PriorityIcon className="h-3 w-3" />
                                        {cfg.label}
                                    </span>
                                    <span className="text-xl">{insight.emoji}</span>
                                </div>

                                {/* Title */}
                                <p className="text-[13px] font-black text-white leading-tight tracking-tight line-clamp-2 mb-2">
                                    {insight.title}
                                </p>

                                {/* Client count */}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-white leading-none tracking-tighter">
                                        {insight.clientCount}
                                    </span>
                                    <span className="text-xs text-white/70 font-medium">clientas</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="bg-white dark:bg-dark-card px-4 py-3">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight line-clamp-2 mb-2">
                                    {insight.description}
                                </p>
                                <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                    <span>{insight.actionLabel}</span>
                                    <ArrowRight className="h-3 w-3" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SegmentInsights;
