/**
 * WeeklyCampaignCard Component
 * Muestra una campaña sugerida por IA para una semana específica
 */

import React, { useState } from 'react';
import {
    Calendar,
    Users,
    DollarSign,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Send,
    Image,
    MessageCircle,
    Target,
    Lightbulb,
    Clock,
    CheckCircle2,
} from 'lucide-react';

interface WeeklyPlan {
    id?: number;
    semana: number;
    fechaInicio?: string;
    fechaFin?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    fechaSugeridaEnvio?: string;
    fecha_sugerida_envio?: string;
    titulo: string;
    objetivo: string;
    segmento: string;
    mensaje?: string;
    mensaje_sugerido?: string;
    tipoPromo?: string;
    tipo_promo?: string;
    promoLabel?: string;
    promo_label?: string;
    ideaImagen?: any;
    idea_imagen?: any;
    tipsWhatsApp?: string[];
    tips_whatsapp?: string[];
    ideaVideo?: any;
    idea_video?: any;
    razon?: string;
    razon_ia?: string;
    clientesObjetivo?: number;
    clientes_objetivo?: number;
    ingresoEstimado?: number;
    ingreso_estimado?: number;
    estado?: string;
}

interface WeeklyCampaignCardProps {
    plan: WeeklyPlan;
    currencySymbol: string;
    onUseCampaign: (plan: WeeklyPlan) => void;
    isExpanded?: boolean;
}

const OBJETIVO_LABELS: Record<string, { icon: string; label: string; color: string }> = {
    'recuperar_inactivos': { icon: '💔', label: 'Recuperar', color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
    'llenar_agenda': { icon: '📅', label: 'Llenar Agenda', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    'fidelizar': { icon: '💝', label: 'Fidelizar', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    'referidos': { icon: '👯', label: 'Referidos', color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    'fecha_especial': { icon: '🎉', label: 'Fecha Especial', color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
};

const SEGMENTO_LABELS: Record<string, string> = {
    'inactivas_30': 'Inactivas 30+ días',
    'inactivas_60': 'Inactivas 60+ días',
    'frecuentes': 'Clientas frecuentes',
    'todas': 'Todas las clientas',
    'vips': 'Clientas VIP',
};

const WeeklyCampaignCard: React.FC<WeeklyCampaignCardProps> = ({
    plan,
    currencySymbol,
    onUseCampaign,
    isExpanded: initialExpanded = false,
}) => {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);

    // Normalizar campos (snake_case vs camelCase)
    const fechaInicio = plan.fechaInicio || plan.fecha_inicio;
    const fechaFin = plan.fechaFin || plan.fecha_fin;
    const mensaje = plan.mensaje || plan.mensaje_sugerido;
    const promoLabel = plan.promoLabel || plan.promo_label;
    const ideaImagen = plan.ideaImagen || plan.idea_imagen;
    const tipsWhatsApp = plan.tipsWhatsApp || plan.tips_whatsapp;
    const ideaVideo = plan.ideaVideo || plan.idea_video;
    const razon = plan.razon || plan.razon_ia;
    const clientesObjetivo = plan.clientesObjetivo || plan.clientes_objetivo || 0;
    const ingresoEstimado = plan.ingresoEstimado || plan.ingreso_estimado || 0;

    const objetivoInfo = OBJETIVO_LABELS[plan.objetivo] || { icon: '📣', label: plan.objetivo, color: 'text-gray-600 bg-gray-100' };
    const segmentoLabel = SEGMENTO_LABELS[plan.segmento] || plan.segmento;

    // Formatear fechas
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
    };

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${plan.estado === 'enviada'
                ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800'
                : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card'
            }`}>
            {/* Header compacto */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {/* Número de semana */}
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{plan.semana}</span>
                    </div>

                    <div className="text-left">
                        {/* Fecha range */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(fechaInicio)} - {formatDate(fechaFin)}
                        </p>
                        {/* Título */}
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                            {plan.titulo}
                        </h4>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Objetivo badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${objetivoInfo.color}`}>
                        {objetivoInfo.icon} {objetivoInfo.label}
                    </span>

                    {/* Métricas compactas */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Users size={12} />
                            {clientesObjetivo}
                        </span>
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <DollarSign size={12} />
                            ~{currencySymbol}{Math.round(ingresoEstimado)}
                        </span>
                    </div>

                    {/* Estado si ya se usó */}
                    {plan.estado === 'enviada' && (
                        <CheckCircle2 size={18} className="text-green-500" />
                    )}

                    {/* Expand icon */}
                    {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                    )}
                </div>
            </button>

            {/* Contenido expandido */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-dark-border pt-4 space-y-4">
                    {/* Razón de la IA */}
                    {razon && (
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 dark:text-gray-300">{razon}</p>
                        </div>
                    )}

                    {/* Grid de info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg">
                            <p className="text-xs text-gray-500 mb-1">Segmento</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{segmentoLabel}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg">
                            <p className="text-xs text-gray-500 mb-1">Promoción</p>
                            <p className="text-sm font-bold text-primary">{promoLabel}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg">
                            <p className="text-xs text-gray-500 mb-1">Destinatarios</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{clientesObjetivo} clientas</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                            <p className="text-xs text-gray-500 mb-1">Ingreso Est.</p>
                            <p className="text-sm font-bold text-green-600">~{currencySymbol}{Math.round(ingresoEstimado)}</p>
                        </div>
                    </div>

                    {/* Mensaje preview */}
                    {mensaje && (
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border">
                            <div className="flex items-center gap-2 mb-2">
                                <MessageCircle size={14} className="text-green-500" />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Mensaje sugerido</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                {mensaje}
                            </p>
                        </div>
                    )}

                    {/* Ideas creativas (acordeón) */}
                    <div className="space-y-2">
                        {/* Idea imagen */}
                        {ideaImagen && (
                            <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg">
                                    <Image size={14} className="text-rose-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Idea para imagen</span>
                                </summary>
                                <div className="mt-2 pl-6 text-xs text-gray-600 dark:text-gray-400">
                                    <p><strong>Descripción:</strong> {ideaImagen.descripcion}</p>
                                    {ideaImagen.elementosClaves && <p><strong>Elementos:</strong> {ideaImagen.elementosClaves}</p>}
                                    {ideaImagen.textoSugerido && <p className="mt-1 p-2 bg-rose-50 dark:bg-rose-900/20 rounded">💬 "{ideaImagen.textoSugerido}"</p>}
                                </div>
                            </details>
                        )}

                        {/* Tips WhatsApp */}
                        {tipsWhatsApp && tipsWhatsApp.length > 0 && (
                            <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg">
                                    <Lightbulb size={14} className="text-amber-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tips para WhatsApp</span>
                                </summary>
                                <ul className="mt-2 pl-6 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    {tipsWhatsApp.map((tip, i) => (
                                        <li key={i}>• {tip}</li>
                                    ))}
                                </ul>
                            </details>
                        )}

                        {/* Idea video */}
                        {ideaVideo && (
                            <details className="group">
                                <summary className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg">
                                    <Sparkles size={14} className="text-indigo-500" />
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Idea para video/reel</span>
                                </summary>
                                <div className="mt-2 pl-6 text-xs text-gray-600 dark:text-gray-400">
                                    {ideaVideo.titulo && <p className="font-semibold">🎬 {ideaVideo.titulo}</p>}
                                    {ideaVideo.concepto && <p><strong>Concepto:</strong> {ideaVideo.concepto}</p>}
                                    {ideaVideo.estructura && <p><strong>Estructura:</strong> {ideaVideo.estructura}</p>}
                                </div>
                            </details>
                        )}
                    </div>

                    {/* Botón de acción */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-border">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={12} />
                            <span>Sugerido: {formatDate(plan.fechaSugeridaEnvio || plan.fecha_sugerida_envio)}</span>
                        </div>

                        {plan.estado !== 'enviada' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUseCampaign(plan);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-emerald-400 text-black font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
                            >
                                <Send size={14} />
                                Usar esta campaña
                            </button>
                        )}

                        {plan.estado === 'enviada' && (
                            <span className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium rounded-lg text-sm">
                                <CheckCircle2 size={14} />
                                Ya enviada
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeeklyCampaignCard;
