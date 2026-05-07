/**
 * MonthCard Component - Rediseño Premium Weekly-First
 * Tarjeta individual del mes con Weekly Roadmap como eje central.
 * Eliminado: botón "Crear Campaña" primario, sección de ideas legacy.
 * Incorpora: WeeklyRoadmap con animaciones framer-motion.
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Lock, Star, ChevronDown } from 'lucide-react';
import { MonthCard as MonthCardType, MonthStatus } from '../../types/campaignBuilderTypes';
import { MONTH_NAMES } from '../../services/campaignMockData';
import { campaigns as campaignsApi } from '../../services/api';
import { useCampaignRoadmap, WeeklyIdea } from '../../hooks/useCampaignRoadmap';
import WeeklyRoadmap from './WeeklyRoadmap';
import CampaignTuningModal from './CampaignTuningModal';
import AudienceQuizWizard from './AudienceQuizWizard';

// WeeklyIdea is now imported from the hook — single source of truth

interface MonthCardProps {
    card: MonthCardType;
    onSelectWeeklyIdea?: (idea: WeeklyIdea, card: MonthCardType) => void;
    businessId: string | null;
}

const statusConfig: Record<MonthStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    active: {
        label: 'Activo',
        color: 'text-emerald-700 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
        icon: <Star size={11} className="fill-current" />,
    },
    planning: {
        label: 'Planificando',
        color: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
        icon: <Calendar size={11} />,
    },
    preview: {
        label: 'Vista Previa',
        color: 'text-indigo-700 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30',
        icon: <Sparkles size={11} />,
    },
    locked: {
        label: 'Bloqueado',
        color: 'text-gray-500 dark:text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        icon: <Lock size={11} />,
    },
    past: {
        label: 'Pasado',
        color: 'text-gray-400 dark:text-gray-600',
        bgColor: 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800',
        icon: null,
    },
};

const categoryColors: Record<string, string> = {
    holiday: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    commercial: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    cultural: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    industry: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
};

const MonthCard: React.FC<MonthCardProps> = ({ card, onSelectWeeklyIdea, businessId }) => {
    const config = statusConfig[card.status];
    const isClickable = card.status === 'active' || card.status === 'planning';

    // Mostrar roadmap para meses activo y planning — condición robusta:
    // No usar cálculo de distancia en meses que puede romperse por timezone o estado incorrecto.
    const shouldShowRoadmap = isClickable;

    // State para key dates collapsed/expanded
    const [showAllDates, setShowAllDates] = useState(false);

    // ─── Carga de campañas via hook centralizado ───────────────────────────────
    // El hook maneja toda la lógica de Supabase, errores y race conditions.
    // businessId inválido (null, vacío, 'biz-demo') es bloqueado internamente.
    const { ideas: weeklyIdeas, isLoading: isLoadingIdeas, refetch } = useCampaignRoadmap({
        businessId,
        month: card.month,
        year: card.year,
        enabled: shouldShowRoadmap,
    });

    // State para Tuning Studio modal
    const [tuningIdea, setTuningIdea] = useState<WeeklyIdea | null>(null);
    const [isTuningOpen, setIsTuningOpen] = useState(false);

    // State para Audience Quiz
    const [isQuizOpen, setIsQuizOpen] = useState(false);

    // Abrir el quiz de audiencias en lugar de generar a ciegas
    const handleGeneratePlan = () => {
        setIsQuizOpen(true);
    };

    // POST para generar el plan usando las audiencias seleccionadas por el usuario
    const handleQuizComplete = async (selectedAudiences: { semana: number; audience_id: string; audience_nombre: string; audience_descripcion: string; beneficio?: string; beneficio_detalle?: string }[]) => {
        setIsQuizOpen(false);
        try {
            await campaignsApi.flow('generar_mes', {
                mes: card.month + 1,
                anio: card.year,
                semanas_audiencias: selectedAudiences
            });
            // Recargar campañas desde Supabase para reflejar las nuevas generadas por IA
            refetch();
        } catch (err) {
            console.error("Error generating month plan:", err);
        }
    };

    const handleActivateWeek = useCallback((idea: WeeklyIdea, _card: MonthCardType) => {
        // Abre el Tuning Studio en lugar de delegar al padre de inmediato
        setTuningIdea(idea);
        setIsTuningOpen(true);
    }, []);

    const handleTuningLaunch = useCallback(async (params: {
        campaign_id: number | string | undefined;
        audience: { id: string; nombre: string; count: number; [key: string]: any };
        message: string;
        scheduled_at?: string;
        origen_campana?: string | number;
    }) => {
        await campaignsApi.flow('lanzar_campana', {
            campaign_id: params.campaign_id,
            audience_id: params.audience.id,
            mensaje: params.message,
            scheduled_at: params.scheduled_at || null,
            origen_campana: params.origen_campana
        });
        // Notificar al padre (para que pueda refrescar la lista si quiere)
        if (onSelectWeeklyIdea && tuningIdea) {
            onSelectWeeklyIdea(tuningIdea, card);
        }
    }, [card, onSelectWeeklyIdea, tuningIdea]);

    const handleGenerateAssets = useCallback(async (params: {
        campaign_id: number | string | undefined;
        audience: { id: string; nombre: string; count: number; descripcion?: string; insight?: string; [key: string]: any };
        mes?: number;
        anio?: number;
    }) => {
        // Combinamos la descripción del segmento (ej: "Celebran su cumpleaños en los próximos 15 días")
        // junto con el insight de Nilah si existe para darle máximo contexto al agente de IA.
        let fullDescription = params.audience.descripcion || '';
        if (params.audience.insight) {
            fullDescription += ` \nEstrategia de Nilah: ${params.audience.insight}`;
        }

        const response = await campaignsApi.flow('generar_activos', {
            campaign_id: params.campaign_id,
            audience_id: params.audience.id,
            audience_nombre: params.audience.nombre,
            audience_descripcion: fullDescription.trim(),
            mes: params.mes || (card.month + 1),
            anio: params.anio || card.year
        });
        
        // Retornamos el response para que el modal maneje las variaciones localmente
        return response;
    }, [card, onSelectWeeklyIdea, tuningIdea]);

    const visibleDates = showAllDates ? card.keyDates : card.keyDates.slice(0, 3);

    return (
        <>
        <motion.div
            layout
            className={`relative flex flex-col h-full rounded-2xl border-2 transition-all duration-300 overflow-hidden ${card.status === 'active'
                ? 'border-primary/60 bg-white dark:bg-dark-card shadow-xl shadow-primary/10 ring-1 ring-primary/10'
                : card.status === 'planning'
                    ? 'border-amber-300 dark:border-amber-500/50 bg-white dark:bg-dark-card shadow-lg'
                    : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50'
                } ${isClickable ? '' : 'opacity-70'}`}
        >
            {/* ─── CardHeader ─── */}
            <div className="px-5 pt-4 pb-3">
                {/* Status badge */}
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.bgColor} ${config.color} mb-3`}
                >
                    {config.icon}
                    {config.label}
                </span>

                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none">
                            {MONTH_NAMES[card.month]}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.year}</p>
                    </div>
                    {/* Campaign counters */}
                    <div className="flex items-center gap-3 text-right">
                        <div>
                            <p className="text-2xl font-black text-primary leading-none">
                                {weeklyIdeas.length > 0 
                                    ? weeklyIdeas.filter(i => i.estado === 'lanzada' || i.estado === 'programada').length 
                                    : card.campaignsCreated}
                            </p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Creadas</p>
                        </div>
                        {(weeklyIdeas.length > 0 || card.campaignsPending > 0) && (
                            <>
                                <div className="w-px h-8 bg-gray-200 dark:bg-dark-border" />
                                <div>
                                    <p className="text-2xl font-black text-amber-500 leading-none">
                                        {(() => {
                                            if (weeklyIdeas.length === 0) return card.campaignsPending;
                                            
                                            const now = new Date();
                                            const isCurrentMonth = card.month === now.getMonth() && card.year === now.getFullYear();
                                            const isFutureMonth = card.year > now.getFullYear() || (card.year === now.getFullYear() && card.month > now.getMonth());
                                            
                                            if (isFutureMonth) {
                                                return weeklyIdeas.filter(i => i.estado === 'sugerida' || i.estado === 'borrador').length;
                                            }
                                            
                                            if (isCurrentMonth) {
                                                const currentWeek = Math.min(Math.ceil(now.getDate() / 7), 4);
                                                return weeklyIdeas.filter(i => 
                                                    (i.estado === 'sugerida' || i.estado === 'borrador') && 
                                                    i.semana >= currentWeek
                                                ).length;
                                            }
                                            
                                            return 0; // Mes pasado
                                        })()}
                                    </p>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-wide font-bold">Pendientes</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Key Dates - collapsible */}
                {card.keyDates.length > 0 && (
                    <div className="mt-3">
                        <div className="flex flex-wrap gap-1.5">
                            {visibleDates.map((date) => (
                                <span
                                    key={date.id}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-lg ${categoryColors[date.category]}`}
                                >
                                    {date.category === 'holiday' ? '🎉' : date.category === 'commercial' ? '💰' : date.category === 'cultural' ? '🎭' : '💼'}
                                    {date.name}
                                </span>
                            ))}
                            {card.keyDates.length > 3 && (
                                <button
                                    onClick={() => setShowAllDates(!showAllDates)}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showAllDates ? 'menos' : `+${card.keyDates.length - 3} más`}
                                    <ChevronDown size={9} className={`transition-transform ${showAllDates ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Divider ─── */}
            {shouldShowRoadmap && (
                <div className="h-px mx-5 bg-gradient-to-r from-transparent via-gray-200 dark:via-dark-border to-transparent" />
            )}

            {/* ─── WEEKLY ROADMAP (center of the card) ─── */}
            {shouldShowRoadmap && (
                <div className="flex-1 pt-3 overflow-hidden">
                    <WeeklyRoadmap
                        weeklyIdeas={weeklyIdeas}
                        isLoading={isLoadingIdeas}
                        card={card}
                        businessId={businessId}
                        onActivateWeek={handleActivateWeek}
                        onGeneratePlan={handleGeneratePlan}
                    />
                </div>
            )}

            {/* ─── Footer: locked or manual create ─── */}


            {/* Decorative glow for active month */}
            {card.status === 'active' && (
                <div className="absolute -top-2 -right-2 w-24 h-24 bg-gradient-to-br from-primary/25 to-transparent rounded-full blur-2xl pointer-events-none" />
            )}
        </motion.div>

        {/* ─── Tuning Studio Modal ─── */}
        <CampaignTuningModal
            isOpen={isTuningOpen}
            onClose={() => setIsTuningOpen(false)}
            idea={tuningIdea}
            businessId={businessId}
            onLaunch={handleTuningLaunch}
            onGenerateAssets={handleGenerateAssets}
        />

        {/* ─── Audience Quiz Wizard (Nivel 1) ─── */}
        <AudienceQuizWizard
            isOpen={isQuizOpen}
            onClose={() => setIsQuizOpen(false)}
            onComplete={handleQuizComplete}
            monthName={MONTH_NAMES[card.month]}
        />
        </>
    );
};

export default MonthCard;
