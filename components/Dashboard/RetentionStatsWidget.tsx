
import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Users, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';

// ===========================================
// RetentionStatsWidget
// Ahora consume datos desde DashboardDataContext (consolidado)
// ===========================================

const RetentionStatsWidget: React.FC = () => {
    const { retentionStats, isLoading, refresh } = useDashboardData();

    // Parsear tasa de éxito para determinar color
    const tasaNumero = parseInt(retentionStats?.tasa_exito || '0');
    const getTasaColor = () => {
        if (tasaNumero >= 70) return 'text-green-500';
        if (tasaNumero >= 40) return 'text-yellow-500';
        return 'text-red-500';
    };

    if (isLoading && !retentionStats) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Estadísticas de Rescate</h3>
                </div>
                <button
                    onClick={() => refresh(true)}
                    disabled={isLoading}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw size={14} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Total en Riesgo - Grande */}
            <div className="text-center mb-4 p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-100 dark:border-red-900/30">
                <div className="flex items-center justify-center gap-2">
                    <Users className="h-6 w-6 text-red-500" />
                    <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {retentionStats?.total_en_riesgo || 0}
                    </span>
                </div>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Clientes en Riesgo</p>
            </div>

            {/* Desglose por Impacto */}
            <div className="space-y-2 mb-4">
                {/* Impacto 1 - Soft Touch */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🤗</span>
                        <div>
                            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Soft Touch</p>
                            <p className="text-[10px] text-yellow-600/70 dark:text-yellow-400/70">45 días</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                        {retentionStats?.por_impacto?.impacto_1 || 0}
                    </span>
                </div>

                {/* Impacto 2 - Incentivo */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🎁</span>
                        <div>
                            <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Incentivo</p>
                            <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70">60 días</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                        {retentionStats?.por_impacto?.impacto_2 || 0}
                    </span>
                </div>

                {/* Impacto 3 - Última Llamada */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                            <p className="text-xs font-medium text-red-700 dark:text-red-400">Última Llamada</p>
                            <p className="text-[10px] text-red-600/70 dark:text-red-400/70">90 días</p>
                        </div>
                    </div>
                    <span className="text-lg font-bold text-red-700 dark:text-red-400">
                        {retentionStats?.por_impacto?.impacto_3 || 0}
                    </span>
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
                    <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-0.5">Rescatados</p>
                </div>

                {/* Perdidos */}
                <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-center gap-1">
                        <TrendingDown size={14} className="text-red-500" />
                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                            {retentionStats?.perdidos_este_mes || 0}
                        </span>
                    </div>
                    <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-0.5">Perdidos</p>
                </div>

                {/* Tasa de Éxito */}
                <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-center gap-1">
                        <CheckCircle2 size={14} className={getTasaColor()} />
                        <span className={`text-lg font-bold ${getTasaColor()}`}>
                            {retentionStats?.tasa_exito || '0%'}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Tasa Éxito</p>
                </div>
            </div>
        </div>
    );
};

export default RetentionStatsWidget;
