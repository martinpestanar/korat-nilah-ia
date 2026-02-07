
import React from 'react';
import {
    TrendingUp, TrendingDown, RefreshCw, Loader2,
    CheckCircle2, HeartPulse, Brain
} from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';

// ===========================================
// Types for Retention Stats (still using API for this)
// ===========================================

interface RetentionStats {
    total_en_riesgo: number;
    por_impacto: {
        impacto_1: number;
        impacto_2: number;
        impacto_3: number;
    };
    rescatados_este_mes: number;
    perdidos_este_mes: number;
    tasa_exito: string;
}

// Churn Prediction Types
interface ChurnClient {
    nombre: string;
    diasSinVisita: number;
    probabilidad: number;
}

interface ChurnPrediction {
    riesgoInminente: number;
    probabilidadChurnGeneral: number;
    tendenciaMensual: 'up' | 'down' | 'stable';
    clientesEnPeligro: ChurnClient[];
}

// ===========================================
// Component
// ===========================================

const RetentionIntelligenceWidget: React.FC = () => {
    // Use centralized dashboard data
    const { clients, engagement, isLoading, error, refresh } = useDashboardData();

    // Derive At-Risk Clients
    const atRiskClients = clients ? clients.filter(c => c.riesgo === 'Alto' || c.riesgo === 'Crítico') : [];

    // Calculate Health Metrics on the fly
    const healthMetrics = React.useMemo(() => {
        if (!clients) return null;

        const total = clients.length;
        const activos = clients.filter(c => c.riesgo === 'Bajo').length;
        const enAlerta = clients.filter(c => c.riesgo === 'Medio').length; // Assuming Medio is Alerta
        const enRiesgo = clients.filter(c => c.riesgo === 'Alto').length;
        const criticos = clients.filter(c => c.riesgo === 'Crítico').length;

        const ltvEnRiesgo = clients
            .filter(c => c.riesgo === 'Alto' || c.riesgo === 'Crítico')
            .reduce((sum, c) => sum + (c.ltv || 0), 0);

        return {
            total,
            activos,
            enAlerta,
            enRiesgo,
            criticos,
            ltvEnRiesgo,
            tasaRetencion: engagement?.tasaRetencion || 0
        };
    }, [clients, engagement]);

    // For retention stats, we'd need to add this to the unified endpoint
    // For now, use calculated values from healthMetrics
    const retentionStats: RetentionStats = {
        total_en_riesgo: (healthMetrics?.enRiesgo || 0) + (healthMetrics?.criticos || 0),
        por_impacto: {
            impacto_1: healthMetrics?.enAlerta || 0,
            impacto_2: healthMetrics?.enRiesgo || 0,
            impacto_3: healthMetrics?.criticos || 0,
        },
        rescatados_este_mes: 0, // TODO: Get from API
        perdidos_este_mes: 0,   // TODO: Get from API
        tasa_exito: '0%'        // TODO: Calculate or get from API
    };

    // Build churn prediction from real client data
    const churnPrediction: ChurnPrediction = {
        riesgoInminente: atRiskClients.filter(c => (c.dias_ausente || 0) > 45).length,
        probabilidadChurnGeneral: healthMetrics ?
            Math.round(((healthMetrics.enRiesgo + healthMetrics.criticos) / Math.max(healthMetrics.total, 1)) * 100) : 0,
        tendenciaMensual: 'down', // TODO: Calculate from historical data
        clientesEnPeligro: atRiskClients.slice(0, 3).map(c => ({
            nombre: c.nombre,
            diasSinVisita: c.dias_ausente || 0,
            probabilidad: c.riesgo === 'Crítico' ? 85 :
                c.riesgo === 'Alto' ? 65 : 40
        }))
    };

    // Helper: Color de la tasa
    const tasaNumero = parseInt(retentionStats?.tasa_exito || '0');
    const getTasaColor = () => {
        if (tasaNumero >= 70) return 'text-green-500';
        if (tasaNumero >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    // Helper: Color del semáforo de salud
    const getHealthColor = () => {
        if (!healthMetrics) return 'gray';
        const { total, enRiesgo, criticos } = healthMetrics;
        const riesgoTotal = enRiesgo + criticos;
        const porcentajeRiesgo = total > 0 ? (riesgoTotal / total) * 100 : 0;

        if (porcentajeRiesgo < 10) return 'green';
        if (porcentajeRiesgo < 25) return 'yellow';
        if (porcentajeRiesgo < 40) return 'orange';
        return 'red';
    };

    const healthColor = getHealthColor();
    const healthColorClasses = {
        green: 'from-green-500 to-emerald-500',
        yellow: 'from-yellow-500 to-amber-500',
        orange: 'from-orange-500 to-amber-600',
        red: 'from-red-500 to-rose-600',
        gray: 'from-gray-400 to-gray-500'
    };

    if (isLoading && !healthMetrics) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <div className="h-full flex flex-col">
            {/* Header con Semáforo de Salud */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    {/* Semáforo animado */}
                    <div className={`relative h-10 w-10 rounded-full bg-gradient-to-br ${healthColorClasses[healthColor]} flex items-center justify-center shadow-lg`}>
                        <HeartPulse className="h-5 w-5 text-white animate-pulse" />
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${healthColorClasses[healthColor]} opacity-30 animate-ping`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Inteligencia de Retención</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {healthMetrics ? `${healthMetrics.tasaRetencion.toFixed(0)}% salud general` : 'Cargando...'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => refresh(true)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw size={14} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-3">{error}</p>
            )}

            {/* Grid de Semáforo de Cartera */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {/* Activos */}
                <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        {healthMetrics?.activos || 0}
                    </span>
                    <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Sanos</p>
                </div>
                {/* En Alerta */}
                <div className="text-center p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30">
                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {healthMetrics?.enAlerta || 0}
                    </span>
                    <p className="text-[10px] text-yellow-600/70 dark:text-yellow-400/70">Alerta</p>
                </div>
                {/* En Riesgo */}
                <div className="text-center p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {healthMetrics?.enRiesgo || 0}
                    </span>
                    <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70">Riesgo</p>
                </div>
                {/* Críticos */}
                <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        {healthMetrics?.criticos || 0}
                    </span>
                    <p className="text-[10px] text-red-600/70 dark:text-red-400/70">Crítico</p>
                </div>
            </div>

            {/* 💰 LTV EN RIESGO - Banner destacado */}
            {(healthMetrics?.ltvEnRiesgo || 0) > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">💰</span>
                            <div>
                                <p className="text-xs font-bold text-red-700 dark:text-red-400">LTV en Riesgo</p>
                                <p className="text-[10px] text-red-600/70 dark:text-red-400/70">Valor que podrías perder</p>
                            </div>
                        </div>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                            S/ {(healthMetrics?.ltvEnRiesgo || 0).toLocaleString('es-PE')}
                        </span>
                    </div>
                </div>
            )}

            {/* Desglose por Impacto de Rescate */}
            <div className="space-y-1.5 mb-4">
                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Campaña de Rescate
                </p>
                {/* Impactos en fila compacta */}
                <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <span>🤗</span>
                        <div className="flex-1">
                            <p className="text-[10px] text-yellow-700 dark:text-yellow-400">Soft Touch</p>
                        </div>
                        <span className="font-bold text-yellow-700 dark:text-yellow-400">
                            {retentionStats?.por_impacto?.impacto_1 || 0}
                        </span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                        <span>🎁</span>
                        <div className="flex-1">
                            <p className="text-[10px] text-orange-700 dark:text-orange-400">Incentivo</p>
                        </div>
                        <span className="font-bold text-orange-700 dark:text-orange-400">
                            {retentionStats?.por_impacto?.impacto_2 || 0}
                        </span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <span>⚠️</span>
                        <div className="flex-1">
                            <p className="text-[10px] text-red-700 dark:text-red-400">Urgente</p>
                        </div>
                        <span className="font-bold text-red-700 dark:text-red-400">
                            {retentionStats?.por_impacto?.impacto_3 || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Objetivo Mensual con Barra de Progreso */}
            {(() => {
                const rescatados = retentionStats?.rescatados_este_mes || 0;
                const objetivo = 10; // Meta fija de 10 rescates por mes
                const porcentaje = Math.min((rescatados / objetivo) * 100, 100);
                const mesAnterior = 3; // TODO: Obtener del backend
                const diferencia = rescatados > 0 && mesAnterior > 0
                    ? Math.round(((rescatados - mesAnterior) / mesAnterior) * 100)
                    : 0;

                return (
                    <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-900/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">🎯</span>
                                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                                    Objetivo del Mes
                                </span>
                            </div>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {rescatados}/{objetivo} clientes
                            </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="relative h-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden mb-2">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${porcentaje}%` }}
                            />
                            {/* Marcadores de hitos */}
                            <div className="absolute inset-y-0 left-1/2 w-px bg-indigo-300 dark:bg-indigo-700" />
                            <div className="absolute inset-y-0 left-3/4 w-px bg-indigo-300 dark:bg-indigo-700" />
                        </div>

                        {/* Comparativa */}
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-indigo-600/70 dark:text-indigo-400/70">
                                {porcentaje.toFixed(0)}% completado
                            </span>
                            {diferencia !== 0 && (
                                <span className={`flex items-center gap-0.5 font-medium ${diferencia > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {diferencia > 0 ? (
                                        <TrendingUp size={10} />
                                    ) : (
                                        <TrendingDown size={10} />
                                    )}
                                    {diferencia > 0 ? '+' : ''}{diferencia}% vs mes anterior
                                </span>
                            )}
                            {diferencia === 0 && rescatados === 0 && (
                                <span className="text-gray-500 dark:text-gray-400">
                                    ¡Comienza a rescatar! 💪
                                </span>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* 🧠 AI CHURN PREDICTION (PRO Feature) */}
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border border-rose-100 dark:border-rose-900/30">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-rose-500" />
                        <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                            Predicción de Churn (IA)
                        </span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${churnPrediction.tendenciaMensual === 'down'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {churnPrediction.tendenciaMensual === 'down' ? '↓ Mejorando' : '↑ Empeorando'}
                    </span>
                </div>

                {/* Churn Stats Row */}
                <div className="flex gap-3 mb-3">
                    <div className="flex-1 text-center p-2 rounded-lg bg-white/60 dark:bg-black/20">
                        <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {churnPrediction.riesgoInminente}
                        </span>
                        <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70">Riesgo inminente</p>
                    </div>
                    <div className="flex-1 text-center p-2 rounded-lg bg-white/60 dark:bg-black/20">
                        <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                            {churnPrediction.probabilidadChurnGeneral}%
                        </span>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Prob. general</p>
                    </div>
                </div>

                {/* Top at-risk clients */}
                <div className="space-y-1.5">
                    <p className="text-[10px] font-medium text-rose-600/70 dark:text-rose-400/70">⚠️ Podrían irse esta semana:</p>
                    {churnPrediction.clientesEnPeligro.length > 0 ? (
                        churnPrediction.clientesEnPeligro.slice(0, 3).map((client, idx) => (
                            <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-white/80 dark:bg-black/30">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                        {client.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{client.nombre}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{client.diasSinVisita} días sin visita</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold ${client.probabilidad >= 75 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        {client.probabilidad}%
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-2">No hay clientes en peligro inmediato</p>
                    )}
                </div>
            </div>

            {/* Stats de Este Mes */}
            <div className="grid grid-cols-3 gap-2 mt-auto">
                {/* Rescatados */}
                <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-center gap-1">
                        <TrendingUp size={14} className="text-green-500" />
                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {retentionStats?.rescatados_este_mes || 0}
                        </span>
                    </div>
                    <p className="text-[10px] text-green-600/70 dark:text-green-400/70">Rescatados</p>
                </div>

                {/* Perdidos */}
                <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-center gap-1">
                        <TrendingDown size={14} className="text-red-500" />
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            {retentionStats?.perdidos_este_mes || 0}
                        </span>
                    </div>
                    <p className="text-[10px] text-red-600/70 dark:text-red-400/70">Perdidos</p>
                </div>

                {/* Tasa de Éxito */}
                <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} className={getTasaColor()} />
                        <span className={`text-lg font-bold ${getTasaColor()}`}>
                            {retentionStats?.tasa_exito || '0%'}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Éxito</p>
                </div>
            </div>
        </div>
    );
};

export default RetentionIntelligenceWidget;
