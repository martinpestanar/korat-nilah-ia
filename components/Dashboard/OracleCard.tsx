/**
 * OracleCard
 * 
 * Muestra pronóstico de ingresos e información financiera.
 * Enfoque analítico: Meta de tickets y crecimiento mensual (MoM).
 */

import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Target, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

const OracleCard: React.FC = () => {
  const { financials, isLoading } = useDashboardData();
  const { formatValue } = useCurrency();

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
  // Valores mock o por defecto si no están en el backend aún
  const goalRevenue = 15000;
  const ticketPromedio = 85;
  const ingresosMesPasadoMismaFecha = 12500;

  const faltanteMeta = Math.max(0, goalRevenue - ingresosActuales);
  const ticketsFaltantes = Math.ceil(faltanteMeta / ticketPromedio);

  // Crecimiento MoM (Month over Month) a la misma fecha
  const crecimientoMoM = ingresosMesPasadoMismaFecha > 0
    ? ((ingresosActuales - ingresosMesPasadoMismaFecha) / ingresosMesPasadoMismaFecha) * 100
    : 0;
  const isCrecimientoPositivo = crecimientoMoM >= 0;

  // Proyección simple lineal
  const now = new Date();
  const dayOfMonth = Math.max(now.getDate(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const factorProyeccion = daysInMonth / dayOfMonth;
  const projectedRevenue = Math.round(ingresosActuales * factorProyeccion);

  const status = projectedRevenue >= goalRevenue ? 'ahead' :
    projectedRevenue >= (goalRevenue * 0.9) ? 'on_track' : 'behind';

  return (
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
              Pronóstico Inteligente
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Proyección Fin de Mes</p>
            <p className="text-lg font-black text-gray-900 dark:text-white whitespace-nowrap">{formatValue(projectedRevenue)}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row h-full">
          {/* Status Indicator */}
          <div className="flex-1 rounded-lg bg-gray-50 p-4 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex flex-col justify-center">
            <div className="flex items-start gap-3">
              {status === 'ahead' ? (
                <TrendingUp className="mt-0.5 h-6 w-6 text-green-500 shrink-0" />
              ) : status === 'on_track' ? (
                <TrendingUp className="mt-0.5 h-6 w-6 text-blue-500 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-6 w-6 text-yellow-500 shrink-0" />
              )}
              <div className="flex-1 w-full">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  {status === 'ahead'
                    ? 'Meta superada proyectada'
                    : status === 'on_track'
                      ? 'Vas por buen camino'
                      : ingresosActuales === 0
                        ? 'Aún sin ingresos'
                        : `Faltan ${formatValue(goalRevenue - projectedRevenue)} proyectados`}
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                  <div
                    className={`absolute left-0 top-0 bottom-0 transition-all duration-1000 ease-out ${status === 'ahead' ? 'bg-green-500' :
                      status === 'on_track' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                    style={{ width: `${Math.min((projectedRevenue / goalRevenue) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400 font-medium">
                  <span>Logrado: {formatValue(ingresosActuales)}</span>
                  <span>Meta: {formatValue(goalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analytical Insights */}
          <div className="flex-[1.5] flex flex-col gap-3 justify-center">
            {/* Meta a Tickets */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/20">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  Traducción a tickets
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{ticketsFaltantes}</span> servicios pendientes
                </p>
              </div>
              {ticketPromedio > 0 && (
                <div className="text-[10px] text-right text-gray-400 leading-tight">
                  a {formatValue(ticketPromedio)}<br />c/u prom.
                </div>
              )}
            </div>

            {/* Crecimiento MoM */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5">
              <div className={`p-2 rounded-lg shrink-0 ${isCrecimientoPositivo ? 'bg-green-100 dark:bg-green-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                {isCrecimientoPositivo
                  ? <ArrowUpRight className={`w-4 h-4 text-green-600 dark:text-green-400`} />
                  : <ArrowDownRight className={`w-4 h-4 text-rose-600 dark:text-rose-400`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  Misma fecha el mes pasado
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${isCrecimientoPositivo ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isCrecimientoPositivo ? '+' : ''}{crecimientoMoM.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-gray-400 truncate">
                    (llevabas {formatValue(ingresosMesPasadoMismaFecha)})
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OracleCard;