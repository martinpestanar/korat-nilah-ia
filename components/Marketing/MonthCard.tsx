/**
 * MonthCard Component
 * Tarjeta individual que representa un mes en el carousel
 * Incluye ideas de campaña por semana generadas por IA
 */

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Sparkles, Lock, ChevronRight, Gift, Star, Loader2 } from 'lucide-react';
import { MonthCard as MonthCardType, MonthStatus } from '../../types/campaignBuilderTypes';
import { MONTH_NAMES } from '../../services/campaignMockData';
import { campaigns as campaignsApi } from '../../services/api';

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
    [key: string]: any;
}

interface MonthCardProps {
    card: MonthCardType;
    onCreateCampaign: () => void;
    onSelectWeeklyIdea?: (idea: WeeklyIdea, card: MonthCardType) => void;
    businessId: string;
}

const statusConfig: Record<MonthStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    active: {
        label: 'Activo',
        color: 'text-emerald-700 dark:text-emerald-400',
        bgColor: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
        icon: <Star size={12} className="fill-current" />,
    },
    planning: {
        label: 'Planificando',
        color: 'text-amber-700 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
        icon: <Calendar size={12} />,
    },
    preview: {
        label: 'Vista Previa',
        color: 'text-indigo-700 dark:text-indigo-400',
        bgColor: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30',
        icon: <Sparkles size={12} />,
    },
    locked: {
        label: 'Bloqueado',
        color: 'text-gray-500 dark:text-gray-500',
        bgColor: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
        icon: <Lock size={12} />,
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

const OBJETIVO_ICONS: Record<string, string> = {
    'recuperar_inactivos': '💔',
    'llenar_agenda': '📅',
    'fidelizar': '💝',
    'referidos': '👯',
    'fecha_especial': '🎉',
};

const MonthCard: React.FC<MonthCardProps> = ({ card, onCreateCampaign, onSelectWeeklyIdea, businessId }) => {
    const config = statusConfig[card.status];
    const isClickable = card.status === 'active' || card.status === 'planning';

    // Determinar si este mes debe mostrar ideas (solo mes actual y siguiente)
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // Calcular diferencia de meses
    const cardMonthsFromNow = (card.year - currentYear) * 12 + (card.month - currentMonth);

    // Solo mostrar ideas para mes actual (0) y siguiente (1)
    const shouldShowIdeas = isClickable && cardMonthsFromNow >= 0 && cardMonthsFromNow <= 1;

    // State para ideas semanales
    const [weeklyIdeas, setWeeklyIdeas] = useState<WeeklyIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [ideasLoaded, setIdeasLoaded] = useState(false);

    // Clave de caché para este mes
    const getCacheKey = () => `korat_plan_${businessId}_${card.year}_${card.month + 1}`;

    // Evitar múltiples llamadas simultáneas
    const fetchingRef = useRef(false);

    // Cargar desde caché al montar y verificar API
    useEffect(() => {
        const checkPlan = async () => {
            // Si ya estamos buscando o ya tenemos ideas cargadas, no hacer nada
            if (fetchingRef.current || ideasLoaded) return;

            console.log(`🔍 [MonthCard ${card.month + 1}/${card.year}] Checking plan... BusinessID: ${businessId}`);

            // 1. Intentar cargar de caché primero
            const cached = localStorage.getItem(getCacheKey());
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (parsed.semanas && Array.isArray(parsed.semanas)) {
                        // Filtrar caché corrupto o vacío
                        const validCached = parsed.semanas.filter((w: any) => w && w.semana && w.titulo);

                        if (validCached.length > 0) {
                            console.log('📦 Cargando plan desde caché:', getCacheKey());
                            setWeeklyIdeas(validCached);
                            setIdeasLoaded(true);
                        }
                    }
                } catch (e) {
                    console.warn('Error parseando caché:', e);
                }
            }

            // 2. Consultar API (GET) solo si no tenemos ideas (o si queremos refrescar siempre)
            // Aquí chequeamos de nuevo por si se cargó el caché arriba
            // if (ideasLoaded) return; 

            try {
                fetchingRef.current = true;
                // console.log(`🌐 [MonthCard] Calling GET /campanas/plan-mensual...`);

                const response = await campaignsApi.getMonthlyPlan(businessId, card.month + 1, card.year);

                let rawWeeks: any[] = [];
                // N8N puede devolver array directo (raw) o objeto con success:true
                if (Array.isArray(response)) {
                    rawWeeks = response;
                } else if (response?.success && Array.isArray(response?.semanas)) {
                    rawWeeks = response.semanas;
                }

                // Filtrar objetos vacíos de forma estricta (debe tener semana y titulo)
                const validWeeks = rawWeeks.filter(w => w && w.semana && w.titulo);

                if (validWeeks.length > 0) {
                    console.log('🌍 [MonthCard] Plan found on server for Month', card.month + 1);
                    setWeeklyIdeas(validWeeks);
                    setIdeasLoaded(true);

                    // Actualizar caché
                    localStorage.setItem(getCacheKey(), JSON.stringify({
                        semanas: validWeeks,
                        timestamp: Date.now()
                    }));
                }
            } catch (err) {
                // Silencio error 404/Empty para no ensuciar consola
                // console.log('No plan found in server');
            } finally {
                fetchingRef.current = false;
            }
        };

        if (businessId) {
            checkPlan();
        }
    }, [card.month, card.year, businessId]);

    // Función para GENERAR (POST) cuando el usuario da click
    const generatePlan = async () => {
        console.log('🚀 Generando nuevo plan (POST)...');
        setIsLoadingIdeas(true);
        try {
            // Llamar al API para generar (POST)
            const response = await campaignsApi.generateMonthlyPlan(businessId, card.month + 1, card.year);
            console.log('📥 Generación respuesta:', response);

            let rawWeeks: any[] = [];
            if (Array.isArray(response)) {
                rawWeeks = response;
            } else if (response?.success && Array.isArray(response?.semanas)) {
                rawWeeks = response.semanas;
            }

            // Filtrar objetos vacíos de forma estricta
            const validWeeks = rawWeeks.filter(w => w && w.semana && w.titulo);

            if (validWeeks.length > 0) {
                console.log('✨ Plan generado exitosamente:', validWeeks);
                setWeeklyIdeas(validWeeks);

                // Guardar en caché
                localStorage.setItem(getCacheKey(), JSON.stringify({
                    semanas: validWeeks,
                    timestamp: Date.now()
                }));
            } else {
                console.log('⚠️ Respuesta de generación sin semanas válidas:', response);
            }
        } catch (err) {
            console.warn('Error generando plan:', err);
        } finally {
            setIsLoadingIdeas(false);
            setIdeasLoaded(true);
        }
    };

    const handleIdeaClick = (idea: WeeklyIdea, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelectWeeklyIdea) {
            onSelectWeeklyIdea(idea, card);
        }
    };

    return (
        <div
            className={`relative flex flex-col h-full rounded-2xl border-2 transition-all duration-300 overflow-hidden ${card.status === 'active'
                ? 'border-primary bg-white dark:bg-dark-card shadow-xl shadow-primary/10'
                : card.status === 'planning'
                    ? 'border-amber-300 dark:border-amber-500/50 bg-white dark:bg-dark-card shadow-lg'
                    : 'border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50'
                } ${isClickable ? 'hover:shadow-2xl' : 'opacity-75'}`}
        >
            {/* Status Badge - Inside card */}
            <div className="px-4 pt-4 pb-2">
                <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${config.bgColor} ${config.color}`}
                >
                    {config.icon}
                    {config.label}
                </span>
            </div>

            {/* Header */}
            <div className="px-6 pb-4">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {MONTH_NAMES[card.month]}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{card.year}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {card.keyDates.length}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">fechas clave</p>
                    </div>
                </div>

                {/* Key Dates - Compact */}
                {card.keyDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {card.keyDates.slice(0, 4).map((date) => (
                            <span
                                key={date.id}
                                className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-lg ${categoryColors[date.category]}`}
                            >
                                {date.category === 'holiday' ? '🎉' :
                                    date.category === 'commercial' ? '💰' :
                                        date.category === 'cultural' ? '🎭' : '💼'}
                                {date.name}
                            </span>
                        ))}
                        {card.keyDates.length > 4 && (
                            <span className="text-[10px] text-gray-400 self-center">
                                +{card.keyDates.length - 4} más
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* IDEAS POR SEMANA - UI Actualizada */}
            {shouldShowIdeas && (
                <div className="px-4 pb-4 space-y-3">

                    {/* Caso 1: Hay ideas cargadas */}
                    {!isLoadingIdeas && weeklyIdeas.length > 0 && (
                        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-primary/10">
                                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                                    <Sparkles size={12} />
                                    Ideas por Semana
                                </span>
                                <span className="text-[10px] text-primary/70">IA</span>
                            </div>

                            <div className="divide-y divide-primary/10">
                                {weeklyIdeas.slice(0, 4).map((idea, idx) => (
                                    <button
                                        key={idea.semana || `idea-${idx}`}
                                        onClick={(e) => handleIdeaClick(idea, e)}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-primary/10 transition-colors group"
                                    >
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-dark-card flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200 dark:border-dark-border">
                                            {idea.semana || '?'}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                {idea.titulo || 'Idea sin título'}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px]">
                                                    {OBJETIVO_ICONS[idea.objetivo] || '📣'}
                                                </span>
                                                <span className="text-[10px] text-gray-500 truncate">
                                                    {idea.promoLabel || idea.promo_label || 'Promo'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Caso 2: Loading State */}
                    {isLoadingIdeas && (
                        <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-primary/20 bg-primary/5">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            <span className="ml-2 text-xs text-gray-500">Generando ideas con IA...</span>
                        </div>
                    )}

                    {/* Caso 3: Estado Vacío (Mostrar botón para generar) */}
                    {!isLoadingIdeas && weeklyIdeas.length === 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                generatePlan();
                            }}
                            className="w-full py-4 px-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-bg/50 hover:bg-white dark:hover:bg-dark-card hover:border-primary/50 hover:shadow-md transition-all group text-center"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-2 rounded-full bg-white dark:bg-dark-card shadow-sm group-hover:scale-110 transition-transform">
                                    <Sparkles size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
                                </div>
                                <span className="text-xs font-medium text-gray-500 group-hover:text-primary transition-colors">
                                    Generar Ideas Semanales
                                </span>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="mt-auto p-4 pt-0">
                {/* Stats - Compact */}
                <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-dark-bg/50">
                    <div className="flex-1 flex items-center justify-center gap-1.5">
                        <span className="text-sm font-bold text-primary">{card.campaignsCreated}</span>
                        <span className="text-[10px] text-gray-500">Creadas</span>
                    </div>
                    <div className="w-px h-4 bg-gray-200 dark:bg-dark-border" />
                    <div className="flex-1 flex items-center justify-center gap-1.5">
                        <span className="text-sm font-bold text-amber-500">{card.campaignsPending}</span>
                        <span className="text-[10px] text-gray-500">Pendientes</span>
                    </div>
                </div>

                {/* Action Button */}
                {isClickable ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreateCampaign();
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${card.status === 'active'
                            ? 'bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:shadow-lg hover:shadow-primary/30'
                            : 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90'
                            }`}
                    >
                        <Gift size={18} />
                        Crear Campaña
                        <ChevronRight size={18} />
                    </button>
                ) : (
                    <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-dark-bg text-gray-400">
                        <Lock size={16} />
                        <span className="text-sm">Disponible pronto</span>
                    </div>
                )}
            </div>

            {/* Decorative Elements */}
            {card.status === 'active' && (
                <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl pointer-events-none" />
            )}
        </div>
    );
};

export default MonthCard;
