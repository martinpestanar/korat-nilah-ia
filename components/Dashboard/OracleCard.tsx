/**
 * OracleCard
 * 
 * Muestra pronóstico de ingresos e información financiera.
 * Ahora consume datos del DashboardDataContext centralizado.
 */

import React, { useState } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Zap, Gem, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';
import RescuePlanModal from './RescuePlanModal';

const OracleCard: React.FC = () => {
  const { financials, isLoading } = useDashboardData();
  const { formatValue } = useCurrency();
  const [isRescueModalOpen, setIsRescueModalOpen] = useState(false);

  // Loading state
  if (isLoading && !financials) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-[#2a2a2a] dark:to-[#1a1a1a] p-1 shadow-lg border border-purple-200 dark:border-purple-500/30 h-full">
        <div className="relative rounded-lg bg-white/95 dark:bg-[#1E1E1E]/90 p-5 backdrop-blur-sm flex items-center justify-center h-full min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  // Calculate Projection Logic
  const ingresosActuales = financials?.ingresosMes || 0;
  const goalRevenue = 15000; // Meta hardcodeada por ahora (podría venir de config)

  // Proyección simple lineal: si estamos a dia 15 y llevamos X, a dia 30 llevaremos 2X
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // Evitar división por cero o proyecciones locas los primeros dias
  const factorProyeccion = dayOfMonth > 0 ? (daysInMonth / Math.max(dayOfMonth, 1)) : 1;
  const projectedRevenue = Math.round(ingresosActuales * factorProyeccion);

  const status = projectedRevenue >= goalRevenue ? 'ahead' :
    projectedRevenue >= (goalRevenue * 0.9) ? 'on_track' : 'behind';

  return (
    <>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-[#2a2a2a] dark:to-[#1a1a1a] p-1 shadow-lg border border-purple-200 dark:border-purple-500/30 h-full flex flex-col">
        {/* Animated Background Effect */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl"></div>

        <div className="relative rounded-lg bg-white p-5 backdrop-blur-sm dark:bg-[#1E1E1E]/90 flex-1 flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 shrink-0">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Pronóstico de Ingresos</h3>
              <span className="hidden sm:inline rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20">
                Pronóstico con IA
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Proyección Mes</p>
              <p className="text-lg font-black text-gray-900 dark:text-white">{formatValue(projectedRevenue)}</p>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            {/* Status Indicator */}
            <div className="flex-1 rounded-lg bg-gray-50 p-3 dark:bg-black/20 border border-gray-100 dark:border-white/5">
              <div className="flex items-start gap-3">
                {status === 'ahead' ? (
                  <TrendingUp className="mt-0.5 h-5 w-5 text-green-500" />
                ) : status === 'on_track' ? (
                  <TrendingUp className="mt-0.5 h-5 w-5 text-blue-500" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    {status === 'ahead'
                      ? '¡Excelente! Vas a superar tu meta'
                      : status === 'on_track'
                        ? 'Vas en buen camino'
                        : ingresosActuales === 0
                          ? 'Aún sin ingresos este mes'
                          : `Faltan ${formatValue(goalRevenue - projectedRevenue)} para la meta`}
                  </p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${status === 'ahead' ? 'bg-green-500' :
                        status === 'on_track' ? 'bg-blue-500' : 'bg-yellow-500'
                        }`}
                      style={{ width: `${Math.min((projectedRevenue / goalRevenue) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>Actual: {formatValue(ingresosActuales)}</span>
                    <span>Meta: {formatValue(goalRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suggestion (Simplified for now) */}
            <div className="flex-[2]">
              <p className="mb-3 text-sm text-gray-600 dark:text-gray-300 italic">
                {status === 'behind'
                  ? '"Se recomienda activar una campaña de reactivación para clientes inactivos."'
                  : '"Mantén el ritmo, la ocupación de la agenda es óptima."'}
              </p>
              <button
                onClick={() => setIsRescueModalOpen(true)}
                className="group flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-500 shadow-lg shadow-purple-500/20"
              >
                <Zap className="h-3 w-3 fill-current" />
                Ver Recomendaciones
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <RescuePlanModal
        isOpen={isRescueModalOpen}
        onClose={() => setIsRescueModalOpen(false)}
      />
    </>
  );
};

export default OracleCard;