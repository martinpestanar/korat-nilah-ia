import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { useData } from '../../context/DataContext';

const OracleCard: React.FC = () => {
  const { forecast, isLoading } = useData();

  if (isLoading || !forecast) return null;

  const gapPercent = ((forecast.goalRevenue - forecast.projectedRevenue) / forecast.goalRevenue) * 100;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] p-1 shadow-lg border border-purple-500/30">
      {/* Animated Background Effect */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl"></div>
      
      <div className="relative rounded-lg bg-[#1E1E1E]/90 p-5 backdrop-blur-sm dark:bg-[#1E1E1E]/90 bg-white/95">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Pronóstico de Ingresos</h3>
            <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-400 border border-purple-500/20">
              Pronóstico con IA
            </span>
          </div>
          <div className="text-right">
             <p className="text-xs text-gray-500 dark:text-gray-400">Proyección Cierre Mes</p>
             <p className="text-xl font-bold text-gray-900 dark:text-white">S/ {forecast.projectedRevenue.toLocaleString('es-PE')}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            {/* Status Indicator */}
            <div className="flex-1 rounded-lg bg-gray-50 p-3 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                <div className="flex items-start gap-3">
                    {forecast.status === 'behind' ? (
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-500" />
                    ) : (
                        <TrendingUp className="mt-0.5 h-5 w-5 text-green-500" />
                    )}
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                           {forecast.status === 'behind' 
                             ? `Estás un ${gapPercent.toFixed(0)}% debajo de tu meta.` 
                             : 'Vas por buen camino para superar tu meta.'}
                        </p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                           <div 
                             className={`h-1.5 rounded-full ${forecast.status === 'behind' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                             style={{ width: `${(forecast.projectedRevenue / forecast.goalRevenue) * 100}%` }}
                           ></div>
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                            <span>Actual: {forecast.projectedRevenue}</span>
                            <span>Meta: {forecast.goalRevenue}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Suggestion */}
            <div className="flex-[2]">
                 <p className="mb-3 text-sm text-gray-600 dark:text-gray-300 italic">
                    "{forecast.suggestion}"
                 </p>
                 <button 
                    onClick={() => alert("¡Campaña activada! Se han enviado mensajes de WhatsApp a 15 clientes potenciales.")}
                    className="group flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-500 shadow-lg shadow-purple-500/20"
                 >
                    <Zap className="h-3 w-3 fill-current" />
                    {forecast.actionLabel}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OracleCard;