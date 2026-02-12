/**
 * MonthlyPlanView Component
 * Vista del plan mensual de marketing generado por IA
 * Muestra las semanas con sus campañas sugeridas
 */

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Sparkles,
    Loader2,
    RefreshCw,
    X,
    ChevronLeft,
    AlertCircle,
    Zap,
} from 'lucide-react';
import WeeklyCampaignCard from './WeeklyCampaignCard';
import { campaigns } from '../../services/api';

interface WeeklyPlan {
    id?: number;
    semana: number;
    fechaInicio?: string;
    fechaFin?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    titulo: string;
    objetivo: string;
    segmento: string;
    mensaje?: string;
    mensaje_sugerido?: string;
    promoLabel?: string;
    promo_label?: string;
    clientesObjetivo?: number;
    clientes_objetivo?: number;
    ingresoEstimado?: number;
    ingreso_estimado?: number;
    estado?: string;
    [key: string]: any;
}

interface MonthlyPlanViewProps {
    isOpen: boolean;
    onClose: () => void;
    month: number; // 0-11 (JS format)
    year: number;
    currencySymbol: string;
    onUseCampaign: (weeklyPlan: WeeklyPlan) => void;
}

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MonthlyPlanView: React.FC<MonthlyPlanViewProps> = ({
    isOpen,
    onClose,
    month,
    year,
    currencySymbol,
    onUseCampaign,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [plan, setPlan] = useState<WeeklyPlan[]>([]);
    const [source, setSource] = useState<'cache' | 'generated' | null>(null);

    // Obtener businessId
    const getBusinessId = () => {
        const user = localStorage.getItem('korat_user');
        return user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';
    };

    // Cargar plan al abrir
    useEffect(() => {
        if (isOpen) {
            loadPlan();
        }
    }, [isOpen, month, year]);

    const loadPlan = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const businessId = getBusinessId();
            const response = await campaigns.getMonthlyPlan(businessId, month + 1, year, false);

            if (response?.success && response?.semanas) {
                setPlan(response.semanas);
                setSource(response.source);
            } else {
                setError(response?.message || 'No se pudo cargar el plan');
            }
        } catch (err: any) {
            console.error('Error cargando plan mensual:', err);
            setError(err.message || 'Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        setError(null);

        try {
            const businessId = getBusinessId();
            const response = await campaigns.regenerateMonthlyPlan(businessId, month + 1, year);

            if (response?.success && response?.semanas) {
                setPlan(response.semanas);
                setSource('generated');
            } else {
                setError(response?.message || 'No se pudo regenerar el plan');
            }
        } catch (err: any) {
            console.error('Error regenerando plan:', err);
            setError(err.message || 'Error de conexión');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleUseCampaign = (weeklyPlan: WeeklyPlan) => {
        onUseCampaign(weeklyPlan);
        onClose();
    };

    // Calcular totales
    const totalClientes = plan.reduce((sum, p) => sum + (p.clientesObjetivo || p.clientes_objetivo || 0), 0);
    const totalIngreso = plan.reduce((sum, p) => sum + (p.ingresoEstimado || p.ingreso_estimado || 0), 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-primary/5 to-violet-500/5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                        >
                            <ChevronLeft size={20} className="text-gray-500" />
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Plan {MONTH_NAMES[month]} {year}
                                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                                    ✨ IA
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500">
                                {plan.length} campañas sugeridas por semana
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleRegenerate}
                            disabled={isRegenerating || isLoading}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-border transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={isRegenerating ? 'animate-spin' : ''} />
                            Regenerar
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Loading state */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-4 animate-pulse">\n                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Generando plan con IA...
                            </h3>
                            <p className="text-sm text-gray-500">
                                Analizando métricas y creando campañas personalizadas
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Esto puede tomar unos segundos...</span>
                            </div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                No se pudo cargar el plan
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">{error}</p>
                            <button
                                onClick={loadPlan}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/80"
                            >
                                <RefreshCw size={16} />
                                Reintentar
                            </button>
                        </div>
                    )}

                    {/* Plan cargado */}
                    {!isLoading && !error && plan.length > 0 && (
                        <div className="space-y-4">
                            {/* Resumen */}
                            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-dark-bg dark:to-dark-card border border-gray-100 dark:border-gray-800">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan.length}</p>
                                    <p className="text-xs text-gray-500">Campañas</p>
                                </div>
                                <div className="text-center border-x border-gray-200 dark:border-gray-700">
                                    <p className="text-2xl font-bold text-blue-600">{totalClientes}</p>
                                    <p className="text-xs text-gray-500">Destinatarios</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">~{currencySymbol}{Math.round(totalIngreso)}</p>
                                    <p className="text-xs text-gray-500">Ingreso Est.</p>
                                </div>
                            </div>

                            {/* Indicador de fuente */}
                            {source && (
                                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${source === 'generated'
                                        ? 'bg-primary/10 text-primary'
                                        : 'bg-gray-100 dark:bg-dark-bg text-gray-500'
                                    }`}>
                                    {source === 'generated' ? (
                                        <>
                                            <Sparkles size={12} />
                                            Plan recién generado con IA
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={12} />
                                            Plan cargado desde caché
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Lista de semanas */}
                            <div className="space-y-3">
                                {plan.map((weekPlan, index) => (
                                    <WeeklyCampaignCard
                                        key={weekPlan.id || index}
                                        plan={weekPlan}
                                        currencySymbol={currencySymbol}
                                        onUseCampaign={handleUseCampaign}
                                        isExpanded={index === 0}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && !error && plan.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-dark-bg flex items-center justify-center mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Sin plan para este mes
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Genera un plan personalizado con IA
                            </p>
                            <button
                                onClick={handleRegenerate}
                                disabled={isRegenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold rounded-lg hover:opacity-90"
                            >
                                {isRegenerating ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Sparkles size={16} />
                                )}
                                Generar Plan con IA
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MonthlyPlanView;
