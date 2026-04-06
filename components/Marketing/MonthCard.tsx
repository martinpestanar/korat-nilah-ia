/**
 * MonthCard Component - Rediseño Premium Weekly-First
 * Tarjeta individual del mes con Weekly Roadmap como eje central.
 * Eliminado: botón "Crear Campaña" primario, sección de ideas legacy.
 * Incorpora: WeeklyRoadmap con animaciones framer-motion.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles, Lock, Star, Gift, ChevronDown } from 'lucide-react';
import { MonthCard as MonthCardType, MonthStatus } from '../../types/campaignBuilderTypes';
import { MONTH_NAMES } from '../../services/campaignMockData';
import { campaigns as campaignsApi } from '../../services/api';
import { supabase } from '../../services/supabase';
import WeeklyRoadmap from './WeeklyRoadmap';
import CampaignTuningModal from './CampaignTuningModal';
import AudienceQuizWizard from './AudienceQuizWizard';

interface WeeklyIdea {
    semana: number;
    titulo: string;
    objetivo: string;
    segmento: string;
    mensaje?: string;
    mensaje_sugerido?: string;
    promoLabel?: string;
    promo_label?: string;
    clientesObjetivo?: number;
    clientes_objetivo?: number;
    audience_id?: string;
    audience_nombre?: string;
    audience_descripcion?: string;
    variaciones_copy?: string[];
    [key: string]: any;
}

interface MonthCardProps {
    card: MonthCardType;
    onSelectWeeklyIdea?: (idea: WeeklyIdea, card: MonthCardType) => void;
    businessId: string;
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

    // Solo mostrar roadmap para el mes actual y el siguiente
    const now = new Date();
    const cardMonthsFromNow = (card.year - now.getFullYear()) * 12 + (card.month - now.getMonth());
    const shouldShowRoadmap = isClickable && cardMonthsFromNow >= 0 && cardMonthsFromNow <= 1;
    console.log("MonthCard shouldShowRoadmap:", shouldShowRoadmap, "month:", card.month, "year:", card.year, "cardMonthsFromNow:", cardMonthsFromNow, "isClickable:", isClickable);

    // State para key dates collapsed/expanded
    const [showAllDates, setShowAllDates] = useState(false);

    // State para ideas semanales
    const [weeklyIdeas, setWeeklyIdeas] = useState<WeeklyIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [ideasLoaded, setIdeasLoaded] = useState(false);
    const fetchingRef = useRef(false);

    // State para Tuning Studio modal
    const [tuningIdea, setTuningIdea] = useState<WeeklyIdea | null>(null);
    const [isTuningOpen, setIsTuningOpen] = useState(false);

    // State para Audience Quiz
    const [isQuizOpen, setIsQuizOpen] = useState(false);

    const getCacheKey = () => `korat_plan_${businessId}_${card.year}_${card.month + 1}`;

    // Cargar plan al montar - AHORA LEYENDO DIRECTO DE SUPABASE
    useEffect(() => {
        let ignore = false;
        const checkPlan = async () => {
            if (!shouldShowRoadmap || !businessId) return;

            // 1. Intentar caché primero para renderizado rápido
            const cached = localStorage.getItem(getCacheKey());
            if (cached && !ideasLoaded) {
                try {
                    const parsed = JSON.parse(cached);
                    const validCached = (parsed.semanas || []).filter((w: any) => w?.semana && w?.titulo);
                    if (validCached.length > 0) {
                        if (!ignore) {
                            setWeeklyIdeas(validCached);
                            setIdeasLoaded(true);
                        }
                    }
                } catch { /* ignore */ }
            }

            // 2. Consultar a Supabase directamente para refrescar SIEMPRE
            // Limpiar caché viejo para evitar que datos obsoletos bloqueen la vista
            localStorage.removeItem(getCacheKey());
            try {
                const { data, error } = await supabase
                    .from('campanas')
                    .select('*')
                    .eq('business_id', businessId)
                    .or(`anio.eq.${card.year},anio.is.null`)
                    .eq('mes', card.month + 1)
                    .order('created_at', { ascending: true }); // fallback de orden

                console.log("MonthCard fetch", "month:", card.month, "year:", card.year, "data:", data, "businessId:", businessId);

                if (ignore) return;

                if (error) throw error;

                if (data && data.length > 0) {
                    // Mapear los datos de Supabase a la interfaz WeeklyIdea
                    const validWeeks = data.map((row, index) => ({
                        semana: row.semana_del_mes || index + 1, // Fallback si es nulo
                        titulo: row.titulo,
                        objetivo: row.objetivo,
                        segmento: row.segmento,
                        mensaje: row.mensaje,
                        clientesObjetivo: row.clientes_objetivo,
                        ingresoEstimado: row.ingreso_estimado,
                        estado: row.estado,
                        fechaInicio: row.fecha_programada, // o calculada según semana
                        razon: row.ai_analysis?.razon || '',
                        ideaImagen: row.imagen_url || null,
                        audience_id: row.audience_id || '',
                        audience_nombre: row.audience_nombre || row.segmento || '',
                        audience_descripcion: row.audience_descripcion || '',
                        variaciones_copy: row.ai_analysis?.variaciones_copy || [],
                        campaign_id: row.id,
                        ...row // mantener resto para data cruda
                    })).filter((w: any) => w.semana && w.titulo);

                    if (validWeeks.length > 0) {
                        setWeeklyIdeas(validWeeks);
                        setIdeasLoaded(true);
                        
                        // Guardar en caché para la próxima vez
                        localStorage.setItem(getCacheKey(), JSON.stringify({
                            month: card.month, year: card.year,
                            semanas: validWeeks,
                            generatedAt: new Date().toISOString()
                        }));
                    }
                } else {
                    setWeeklyIdeas([]);
                    setIdeasLoaded(false);
                }
            } catch (err) {
                console.error("Error fetching roadmap from Supabase:", err);
            }
        };

        if (businessId && shouldShowRoadmap) {
            checkPlan();
        }

        return () => {
            ignore = true;
        };
    }, [card.month, card.year, businessId, shouldShowRoadmap]);

    // Abrir el quiz de audiencias en lugar de generar a ciegas
    const handleGeneratePlan = () => {
        setIsQuizOpen(true);
    };

    // POST para generar el plan usando las audiencias seleccionadas por el usuario
    const handleQuizComplete = async (selectedAudiences: { semana: number; audience_id: string; audience_nombre: string; audience_descripcion: string; beneficio?: string; beneficio_detalle?: string }[]) => {
        setIsQuizOpen(false);
        setIsLoadingIdeas(true);
        try {
            const response = await campaignsApi.flow('generar_mes', {
                mes: card.month + 1,
                anio: card.year,
                semanas_audiencias: selectedAudiences // array de {semana, audience_id, audience_nombre, audience_descripcion, beneficio, beneficio_detalle}
            });

            // Si la IA nos devuelve la estructura directamente (o podemos recargar de DB)
            let rawWeeks: any[] = Array.isArray(response) ? response : (response?.semanas || []);

            if (rawWeeks.length > 0) {
                const validWeeks = rawWeeks.map((w: any) => ({
                    ...w,
                    semana: w.semana_del_mes || w.semana
                })).filter((w: any) => w?.semana && w?.titulo);

                setWeeklyIdeas(validWeeks);
                localStorage.setItem(getCacheKey(), JSON.stringify({ semanas: validWeeks, timestamp: Date.now() }));
            }
        } catch (err) {
            console.error("Error generating month plan:", err);
        } finally {
            setIsLoadingIdeas(false);
            setIdeasLoaded(true);
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
            audience_descripcion: fullDescription.trim()
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
                            <p className="text-2xl font-black text-primary leading-none">{card.campaignsCreated}</p>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Creadas</p>
                        </div>
                        {card.campaignsPending > 0 && (
                            <>
                                <div className="w-px h-8 bg-gray-200 dark:bg-dark-border" />
                                <div>
                                    <p className="text-2xl font-black text-amber-500 leading-none">{card.campaignsPending}</p>
                                    <p className="text-[9px] text-gray-400 uppercase tracking-wide">Pending</p>
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
