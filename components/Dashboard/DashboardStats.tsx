/**
 * DashboardStats Component
 * 
 * Muestra las métricas principales del dashboard.
 * Ahora consume datos normalizados del DashboardDataContext.
 */

import React, { useMemo } from 'react';
import { DollarSign, Calendar, Users, ShieldCheck, CheckCircle2, AlertCircle, Gem } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from '../../context/DashboardDataContext';
import ComparisonBadge from '../UI/ComparisonBadge';

// ===========================================
// Skeleton Loader Component
// ===========================================

const SkeletonCard: React.FC = () => (
  <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card dark:shadow-none animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700"></div>
        <div className="h-8 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
      </div>
      <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    </div>
  </div>
);

// ===========================================
// Main Component
// ===========================================

const DashboardStats: React.FC = () => {
  const { isAdmin } = useAuth();
  const {
    financials,
    operational,
    engagement,
    clients,
    isLoading,
    error
  } = useDashboardData();

  // Calculate LTV on the fly from clients list
  const ltvMetrics = useMemo(() => {
    if (!clients.length) return { average: 0, atRiskVolume: 0 };

    const totalLTV = clients.reduce((sum, c) => sum + (c.ltv || 0), 0);
    const average = totalLTV / clients.length;

    const atRiskVolume = clients
      .filter(c => c.riesgo === 'Alto' || c.riesgo === 'Crítico')
      .reduce((sum, c) => sum + (c.ltv || 0), 0);

    return { average, atRiskVolume };
  }, [clients]);

  // ===========================================
  // Render Loading State
  // ===========================================

  if (isLoading && !financials) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  // ===========================================
  // Define Cards
  // ===========================================

  // --- ADMIN VIEW (Full Financials) ---
  const currentRevenue = financials?.ingresosMes ?? 0;
  // Simular mes anterior (12% menos) - TODO: Calcular real si tenemos historical data
  const previousRevenue = currentRevenue * 0.88;

  const adminCards = [
    {
      title: 'Ingresos del Mes',
      value: `S/ ${(currentRevenue).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${operational?.citasCompletadasMes ?? 0} citas completadas`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
      comparison: { current: currentRevenue, previous: previousRevenue }
    },
    {
      title: 'Ingresos de Hoy',
      value: `S/ ${(financials?.ingresosHoy ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${operational?.citasHoy ?? 0} citas hoy`,
      icon: ShieldCheck,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      comparison: null
    },
    {
      title: 'Citas Completadas',
      value: (operational?.citasCompletadasMes ?? 0).toString(),
      subtitle: `${(operational?.tasaCancelacion ?? 0).toFixed(0)}% cancelación`,
      icon: CheckCircle2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      comparison: null
    },
    {
      title: 'LTV Promedio',
      value: `S/ ${(ltvMetrics.average).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: ltvMetrics.atRiskVolume > 0 ? `⚠️ S/${ltvMetrics.atRiskVolume.toLocaleString('es-PE')} en riesgo` : 'Valor de vida del cliente',
      icon: Gem,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      comparison: null
    }
  ];

  // --- STAFF VIEW (Operational Metrics Only - NO MONEY) ---
  const staffCards = [
    {
      title: 'Citas Completadas',
      value: (operational?.citasCompletadasMes ?? 0).toString(),
      subtitle: 'Este mes',
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      comparison: null
    },
    {
      title: 'Citas para Hoy',
      value: (operational?.citasHoy ?? 0).toString(),
      subtitle: 'Programadas',
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      comparison: null
    },
    {
      title: 'Clientes Activos',
      value: (engagement?.clientesActivos ?? 0).toString(),
      subtitle: 'Total en base de datos',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      comparison: null
    },
    {
      title: 'Clientes en Riesgo',
      value: (engagement?.clientesEnRiesgo ?? 0).toString(),
      subtitle: 'Requieren atención',
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      comparison: null
    }
  ];

  const cardsToShow = isAdmin ? adminCards : staffCards;

  // ===========================================
  // Render
  // ===========================================

  return (
    <div className="space-y-4">
      {/* Error/Warning Banner */}
      {error && (
        <div className="col-span-full rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cardsToShow.map((card, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-dark-border dark:bg-dark-card dark:shadow-none"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
                  {card.comparison && (
                    <ComparisonBadge
                      currentValue={card.comparison.current}
                      previousValue={card.comparison.previous}
                      format="percent"
                      size="sm"
                    />
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{card.subtitle}</p>
              </div>
              <div className={`rounded-full p-3 ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
