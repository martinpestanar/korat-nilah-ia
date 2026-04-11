/**
 * WeeklyRoadmap Component
 * Componente premium de hoja de ruta semanal con animaciones framer-motion.
 * Muestra las 4 semanas del mes como timeline tipo Notion/Linear.
 * Diseñado como el centro de acción del módulo Marketing.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Loader2,
    ChevronDown,
    CheckCircle2,
    Clock,
    Send,
    Zap,
    Heart,
    Calendar,
    Users,
    TrendingUp,
    MessageSquare,
    ArrowRight,
    Image as ImageIcon,
    Play,
} from 'lucide-react';
import { MonthCard as MonthCardType } from '../../types/campaignBuilderTypes';
import { MONTH_NAMES } from '../../services/campaignMockData';
import { useCurrency } from '../../hooks/useCurrency';

// ─── Types ─────────────────────────────────────────────────────────────────

interface WeeklyIdea {
    semana: number;
    titulo: string;
    objetivo: string;
    segmento: string;
    mensaje?: string;
    mensaje_sugerido?: string;
    promoLabel?: string;
    promo_label?: string;
    clientes_objetivo?: number;
    ingresoEstimado?: number;
    ingreso_estimado?: number;
    retorno_moneda_local?: number; // nuevo campo
    razon?: string;
    razon_ia?: string;
    razon_estrategica?: string;
    datos_en_juego?: string;
    disparador_emocional?: string;
    tipo_promo?: string;
    tono?: string;
    fecha_inicio?: string;
    fechaInicio?: string;
    fecha_fin?: string;
    fechaFin?: string;
    estado?: string;
    imagen_url?: string;
    [key: string]: any;
}

interface WeeklyRoadmapProps {
    weeklyIdeas: WeeklyIdea[];
    isLoading: boolean;
    card: MonthCardType;
    businessId: string;
    onActivateWeek: (idea: WeeklyIdea, card: MonthCardType) => void;
    onGeneratePlan: () => void;
}

// ─── Config Maps ────────────────────────────────────────────────────────────

const OBJETIVO_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string; dotColor: string }> = {
    recuperar_inactivos: {
        icon: <Heart size={12} />,
        label: 'Recuperar',
        color: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-50 dark:bg-rose-500/10',
        dotColor: 'bg-rose-400',
    },
    llenar_agenda: {
        icon: <Calendar size={12} />,
        label: 'Llenar Agenda',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-500/10',
        dotColor: 'bg-blue-400',
    },
    fidelizar: {
        icon: <Sparkles size={12} />,
        label: 'Fidelizar',
        color: 'text-violet-600 dark:text-violet-400',
        bgColor: 'bg-violet-50 dark:bg-violet-500/10',
        dotColor: 'bg-violet-400',
    },
    referidos: {
        icon: <Users size={12} />,
        label: 'Referidos',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-500/10',
        dotColor: 'bg-amber-400',
    },
    fecha_especial: {
        icon: <Zap size={12} />,
        label: 'Fecha Especial',
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-50 dark:bg-pink-500/10',
        dotColor: 'bg-pink-400',
    },
};

const getObjetivoConfig = (objetivo: string) =>
    OBJETIVO_CONFIG[objetivo] || {
        icon: <Send size={12} />,
        label: objetivo,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-50 dark:bg-gray-800',
        dotColor: 'bg-gray-400',
    };

// ─── Helpers ────────────────────────────────────────────────────────────────

const getCurrentWeekOfMonth = (): number => {
    const now = new Date();
    const day = now.getDate();
    return Math.min(Math.ceil(day / 7), 4);
};

const getWeekStatus = (
    semana: number,
    cardMonth: number,
    cardYear: number,
    estado?: string
): 'sent' | 'current' | 'upcoming' | 'done' => {
    if (estado === 'enviada' || estado === 'programada') return 'sent';

    const now = new Date();
    const isPastMonth = cardYear < now.getFullYear() || (cardYear === now.getFullYear() && cardMonth < now.getMonth());
    
    if (isPastMonth) return 'done';
    
    const isFutureMonth = cardYear > now.getFullYear() || (cardYear === now.getFullYear() && cardMonth > now.getMonth());
    if (isFutureMonth) return 'upcoming';

    // Is current month
    const currentWeek = getCurrentWeekOfMonth();
    if (semana < currentWeek) return 'done';
    if (semana === currentWeek) return 'current';
    return 'upcoming';
};

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
    } catch {
        return '';
    }
};

// ─── Row Status Config ──────────────────────────────────────────────────────

const STATUS_CONFIG = {
    sent: {
        dotClass: 'bg-emerald-400',
        ring: 'ring-2 ring-emerald-300/60',
        lineClass: 'bg-emerald-200 dark:bg-emerald-800',
        badge: (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/30">
                <CheckCircle2 size={10} />
                Enviada
            </span>
        ),
    },
    current: {
        dotClass: 'bg-violet-500 animate-pulse',
        ring: 'ring-2 ring-violet-400/60',
        lineClass: 'bg-violet-200 dark:bg-violet-700',
        badge: (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold rounded-full border border-violet-300 dark:border-violet-500/40">
                <Zap size={10} />
                Esta semana
            </span>
        ),
    },
    upcoming: {
        dotClass: 'bg-gray-300 dark:bg-gray-600',
        ring: '',
        lineClass: 'bg-gray-100 dark:bg-gray-700',
        badge: (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-medium rounded-full">
                <Clock size={10} />
                Próxima
            </span>
        ),
    },
    done: {
        dotClass: 'bg-gray-200 dark:bg-gray-700',
        ring: '',
        lineClass: 'bg-gray-100 dark:bg-gray-800',
        badge: (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-400 text-[10px] font-medium rounded-full">
                Pasada
            </span>
        ),
    },
};

// ─── Week Row ────────────────────────────────────────────────────────────────

interface WeekRowProps {
    idea: WeeklyIdea;
    isLast: boolean;
    card: MonthCardType;
    onActivate: () => void;
    index: number;
}

const WeekRow: React.FC<WeekRowProps> = ({ idea, isLast, card, onActivate, index }) => {
    const [expanded, setExpanded] = useState(false);
    const status = getWeekStatus(idea.semana, card.month, card.year, idea.estado);
    const statusCfg = STATUS_CONFIG[status];
    const objCfg = getObjetivoConfig(idea.objetivo);
    const mensaje = idea.mensaje || idea.mensaje_sugerido || '';
    const promoLabel = idea.promoLabel || idea.promo_label || '';
    const clientesObjetivo = idea.clientesObjetivo || idea.clientes_objetivo || 0;
    const ingresoEstimado = idea.retorno_moneda_local || idea.ingresoEstimado || idea.ingreso_estimado || 0;
    const fechaInicio = idea.fechaInicio || idea.fecha_inicio;
    const fechaFin = idea.fechaFin || idea.fecha_fin;
    const razon = idea.razon || idea.razon_ia || idea.razon_estrategica || '';
    const disparador = idea.disparador_emocional || '';
    const tipoPromo = idea.tipo_promo || '';
    const tono = idea.tono || '';
    const datosJuego = idea.datos_en_juego || '';
    const isDone = status === 'done' || status === 'sent';

    const { formatMoney } = useCurrency();

    // Reemplaza algo como "0.5 citas" por "0.5 citas (~ S/ 25)" en el texto
    const formatDatosJuego = (texto: string) => {
        if (!texto) return '';
        if (ingresoEstimado > 0) {
            // Buscamos patrones de citas como "0.5 cita", "1.5 citas"
            const regex = /([0-9.]+)\s*cita(?:s)?/gi;
            if (regex.test(texto)) {
                return texto.replace(regex, (match) => `${match} (${formatMoney(ingresoEstimado)})`);
            }
        }
        return texto;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="relative flex gap-3"
        >
            {/* Timeline line */}
            {!isLast && (
                <div
                    className={`absolute left-[14px] top-8 bottom-0 w-0.5 ${statusCfg.lineClass} transition-colors duration-500`}
                    style={{ zIndex: 0 }}
                />
            )}

            {/* Timeline dot */}
            <div className="relative flex-shrink-0 mt-1 z-10">
                <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${statusCfg.dotClass} ${statusCfg.ring} transition-all duration-300`}
                >
                    {status === 'sent' ? <CheckCircle2 size={14} /> : <span>{idea.semana}</span>}
                </div>
            </div>

            {/* Content Card */}
            <motion.div
                layout
                className={`flex-1 mb-3 rounded-xl border overflow-hidden transition-all duration-200 ${status === 'current'
                    ? 'border-violet-200 dark:border-violet-500/40 bg-gradient-to-br from-violet-50/80 to-white dark:from-violet-900/20 dark:to-dark-card shadow-md shadow-violet-100 dark:shadow-violet-900/20'
                    : status === 'sent'
                        ? 'border-emerald-200 dark:border-emerald-700/40 bg-emerald-50/40 dark:bg-emerald-900/10'
                        : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card'
                    }`}
            >
                {/* Header Row — always visible */}
                <button
                    onClick={() => !isDone && setExpanded(!expanded)}
                    className="w-full flex items-start justify-between gap-3 p-3 text-left"
                    disabled={status === 'done'}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            {statusCfg.badge}
                            {fechaInicio && fechaFin && (
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                    {formatDate(fechaInicio)} – {formatDate(fechaFin)}
                                </span>
                            )}
                        </div>
                        <p
                            className={`text-sm font-semibold leading-snug ${status === 'done'
                                ? 'text-gray-400 dark:text-gray-600 line-through'
                                : 'text-gray-900 dark:text-white'
                                }`}
                        >
                            {idea.titulo}
                        </p>
                        {/* Chips */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <span
                                className={`inline-flex items-start sm:items-center gap-1.5 px-2.5 py-1 rounded-lg sm:rounded-full text-[10px] font-medium border ${objCfg.bgColor} ${objCfg.color} border-current/20 whitespace-normal text-left max-w-full leading-tight`}
                            >
                                <span className="mt-0.5 sm:mt-0 flex-shrink-0">{objCfg.icon}</span>
                                <span>{objCfg.label}</span>
                            </span>
                            {promoLabel && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                                    🏷️ {promoLabel}
                                </span>
                            )}
                            {clientesObjetivo > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border flex items-center gap-1">
                                    <Users size={9} />
                                    {clientesObjetivo}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        {ingresoEstimado > 0 && status !== 'done' && (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                                <TrendingUp size={11} />
                                ~{formatMoney(ingresoEstimado)}
                            </span>
                        )}
                        {status !== 'sent' && status !== 'done' && (
                            <motion.div
                                animate={{ rotate: expanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown size={16} className="text-gray-400" />
                            </motion.div>
                        )}
                    </div>
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                    {expanded && status !== 'done' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                        >
                            <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-dark-border pt-3">
                                {/* Ficha Técnica Fila 1: Tags adicionales */}
                                {(disparador || tipoPromo || tono) && (
                                    <div className="flex flex-wrap gap-2 pt-1 pb-2">
                                        {disparador && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-dark-bg/50 px-2 py-0.5 rounded-md border border-gray-200 dark:border-dark-border">
                                                <Heart size={10} className="text-rose-400" />
                                                {disparador}
                                            </span>
                                        )}
                                        {tipoPromo && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-dark-bg/50 px-2 py-0.5 rounded-md border border-gray-200 dark:border-dark-border">
                                                <Zap size={10} className="text-amber-400" />
                                                {tipoPromo}
                                            </span>
                                        )}
                                        {tono && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-dark-bg/50 px-2 py-0.5 rounded-md border border-gray-200 dark:border-dark-border">
                                                <MessageSquare size={10} className="text-blue-400" />
                                                {tono}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Datos en Juego */}
                                {datosJuego && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.98 }} 
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="relative flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border border-emerald-200/60 dark:border-emerald-800/40 shadow-sm"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-emerald-200/50 dark:bg-emerald-800/60 flex items-center justify-center flex-shrink-0 shadow-inner">
                                            <TrendingUp size={13} className="text-emerald-700 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-400 tracking-wider uppercase">Retorno Calculado</p>
                                                {ingresoEstimado > 0 && (
                                                    <span className="text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                                        {formatMoney(ingresoEstimado)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed font-medium">
                                                {formatDatosJuego(datosJuego)}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Razon Estrategica / IA */}
                                {razon && (
                                    <motion.div 
                                      initial={{ opacity: 0, scale: 0.98 }} 
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.05 }}
                                      className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-br from-violet-50/80 to-violet-100/50 dark:from-violet-900/20 dark:to-violet-900/10 border border-violet-200/60 dark:border-violet-800/40 shadow-sm"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-violet-200/50 dark:bg-violet-800/60 flex items-center justify-center flex-shrink-0 shadow-inner">
                                            <Sparkles size={13} className="text-violet-700 dark:text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-extrabold text-violet-800 dark:text-violet-400 tracking-wider uppercase mb-1">Estrategia Nilah</p>
                                            <p className="text-xs text-violet-900 dark:text-violet-200/90 leading-relaxed">
                                                {formatDatosJuego(razon)}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* WhatsApp message bubble preview */}
                                {mensaje && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            <MessageSquare size={11} className="text-emerald-500" />
                                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Mensaje {idea.estado === 'sugerida' ? '(Pendiente)' : 'WhatsApp'}
                                            </span>
                                        </div>
                                        <div className="relative opacity-90">
                                            {/* Bubble tail */}
                                            <div
                                                className="absolute -left-1.5 top-3 w-3 h-3 bg-emerald-50 dark:bg-emerald-900/30 rotate-45 border-l border-b border-emerald-200 dark:border-emerald-700/40"
                                                aria-hidden
                                            />
                                            <div className="ml-1 p-3 rounded-xl rounded-tl-sm bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-700/30">
                                                <p className="text-[11px] text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed line-clamp-3">
                                                    {idea.estado === 'sugerida' && (!mensaje || mensaje.includes('Pendiente')) ? (
                                                        <span className="italic text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                            <Sparkles size={10} /> La IA generará el copy final en el próximo paso
                                                        </span>
                                                    ) : (
                                                        mensaje
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}


                                {/* CTA */}
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onActivate();
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-sm shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/30 hover:opacity-95 transition-all"
                                >
                                    <Play size={14} className="fill-current" />
                                    Activar esta semana
                                    <ArrowRight size={14} />
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Already sent state */}
                {status === 'sent' && (
                    <div className="px-3 pb-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={13} />
                        <span>Campaña ya enviada esta semana ✓</span>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState: React.FC<{
    isLoading: boolean;
    onGenerate: () => void;
    monthName: string;
}> = ({ isLoading, onGenerate, monthName }) => (
    <AnimatePresence mode="wait">
        {isLoading ? (
            <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-8 gap-3"
            >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                        <Sparkles size={22} className="text-white" />
                    </motion.div>
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                        Nilah está planificando tu mes...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Analizando tus clientes y fechas clave de {monthName}
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-violet-400"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                        />
                    ))}
                </div>
            </motion.div>
        ) : (
            <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-6 gap-4"
            >
                {/* Decorative weeks placeholder */}
                <div className="w-full space-y-2 opacity-30 pointer-events-none select-none" aria-hidden>
                    {[1, 2, 3, 4].map((w) => (
                        <div key={w} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                            <div className="flex-1 h-9 rounded-xl bg-gray-100 dark:bg-gray-800" />
                        </div>
                    ))}
                </div>
                <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Sin plan para {monthName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Nilah genera 4 campañas semanales personalizadas en segundos
                    </p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={onGenerate}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-bold shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 transition-all"
                >
                    <Sparkles size={15} />
                    Generar Plan de Mes con IA
                </motion.button>
            </motion.div>
        )}
    </AnimatePresence>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const WeeklyRoadmap: React.FC<WeeklyRoadmapProps> = ({
    weeklyIdeas,
    isLoading,
    card,
    businessId,
    onActivateWeek,
    onGeneratePlan,
}) => {
    const monthName = MONTH_NAMES[card.month];
    const hasIdeas = weeklyIdeas.length > 0;

    return (
        <div className="px-4 pb-4">
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                        <Sparkles size={10} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Roadmap Semanal
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 rounded-full font-bold">
                        IA
                    </span>
                </div>
                {hasIdeas && (
                    <span className="text-[10px] text-gray-400">
                        {weeklyIdeas.filter((i) => i.estado === 'lanzada' || i.estado === 'programada').length}/{weeklyIdeas.length} completadas
                    </span>
                )}
            </div>

            {/* Content */}
            {hasIdeas ? (
                <div className="relative">
                    {weeklyIdeas.map((idea, index) => (
                        <WeekRow
                            key={idea.semana}
                            idea={idea}
                            isLast={index === weeklyIdeas.length - 1}
                            card={card}
                            onActivate={() => onActivateWeek(idea, card)}
                            index={index}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    isLoading={isLoading}
                    onGenerate={onGeneratePlan}
                    monthName={monthName}
                />
            )}
        </div>
    );
};

export default WeeklyRoadmap;
