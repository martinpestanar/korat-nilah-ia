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
import { useCurrency } from '../../hooks/useCurrency';
import ComparisonBadge from '../UI/ComparisonBadge';
import WidgetHelper from '../UI/WidgetHelper';

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
  const { formatValue, moneda } = useCurrency();

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      value: formatValue(currentRevenue),
      subtitle: `${operational?.citasCompletadasMes ?? 0} citas completadas`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
      comparison: { current: currentRevenue, previous: previousRevenue },
      helper: { what: 'El total de dinero que entró a tu salón este mes por todos los servicios realizados.', why: 'Te permite saber si vas en camino a tu meta mensual y comparar con meses anteriores.', tip: 'Si está en rojo, revisa los días con pocas citas y lanza una promo rápida de WhatsApp.' }
    },
    {
      title: 'Ingresos de Hoy',
      value: formatValue(financials?.ingresosHoy ?? 0),
      subtitle: `${operational?.citasHoy ?? 0} citas hoy`,
      icon: ShieldCheck,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      comparison: null,
      helper: { what: 'El dinero generado solo hoy. Se actualiza en tiempo real conforme se completan citas.', why: 'Te da visibilidad inmediata de cómo va el día, sin esperar al cierre.', tip: `Si es bajo, aún puedes intentar llenar huecos con una oferta de último momento.` }
    },
    {
      title: 'Citas Completadas',
      value: (operational?.citasCompletadasMes ?? 0).toString(),
      subtitle: `${(operational?.tasaCancelacion ?? 0).toFixed(0)}% cancelación`,
      icon: CheckCircle2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      comparison: null,
      helper: { what: 'Número de citas que se realizaron exitosamente este mes (excluyendo cancelaciones y no-shows).', why: 'Indica la productividad real de tu salón. Más citas completadas = más oportunidad de ingreso y recomendaciones.', tip: 'Un porcentaje de cancelación alto (+15%) suele reducirse activando recordatorios automáticos.' }
    },
    {
      title: 'LTV Promedio',
      value: formatValue(ltvMetrics.average),
      subtitle: ltvMetrics.atRiskVolume > 0 ? `⚠️ ${formatValue(ltvMetrics.atRiskVolume)} en riesgo` : 'Valor de vida del cliente',
      icon: Gem,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      comparison: null,
      helper: { what: 'LTV (Lifetime Value) = cuánto dinero ha gastado una clienta en tu salón desde que llegó.', why: 'Te ayuda a saber cuáles clientas son más valiosas para tu negocio y a quiénes debes priorizar al rescatar.', tip: 'Si tienes clientas VIP con LTV alto que no han venido en más de 30 días, ¡rescátalas ahora!' }
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
      comparison: null,
      helper: { what: 'Número de citas realizadas exitosamente este mes.', why: 'Muestra qué tan activo está el salón y ayuda a medir tu progreso mensual.', tip: undefined }
    },
    {
      title: 'Citas para Hoy',
      value: (operational?.citasHoy ?? 0).toString(),
      subtitle: 'Programadas',
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      comparison: null,
      helper: { what: 'Total de citas que tienes agendadas para hoy.', why: 'Te permite prepararte con anticipación y asegurarte de que el equipo está listo.', tip: 'Si hay huecos, lanza una promo de WhatsApp para llenarlos.' }
    },
    {
      title: 'Clientes Activos',
      value: (engagement?.clientesActivos ?? 0).toString(),
      subtitle: 'Total en base de datos',
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
      comparison: null,
      helper: { what: 'Clientas que han visitado el salón al menos una vez en los últimos 90 días.', why: 'Tu base activa es tu fuente de ingresos más segura. Mantenerla grande reduce la dependencia de clientes nuevas.', tip: undefined }
    },
    {
      title: 'Clientes en Riesgo',
      value: (engagement?.clientesEnRiesgo ?? 0).toString(),
      subtitle: 'Requieren atención',
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      comparison: null,
      helper: { what: 'Clientas que llevan más de 45 días sin visitar el salón y están en riesgo de perderse.', why: 'Recuperar una clienta existente cuesta 5x menos que conseguir una nueva. Actúa antes de perderlas.', tip: 'Usa la función de Rescate para enviarles un WhatsApp personalizado con Nilah IA.' }
    }
  ];

  const cardsToShow = isAdmin ? adminCards : staffCards;

  // ===========================================
  // Render
  // ===========================================

  return (
    <div className="space-y-3">
      {/* Error/Warning Banner */}
      {error && (
        <div className="col-span-full rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">{error}</span>
          </div>
        </div>
      )}

      {/* Stats Grid — 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cardsToShow.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm tap-feedback dark:border-dark-border dark:bg-dark-card"
          >
            {/* Top: ícono + helper */}
            <div className="flex items-start justify-between mb-2">
              <div className={`inline-flex rounded-xl p-2 ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              {card.helper && (
                <WidgetHelper
                  title={card.title}
                  what={card.helper.what}
                  why={card.helper.why}
                  tip={card.helper.tip}
                />
              )}
            </div>
            {/* Valor y Comparación */}
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white leading-none whitespace-nowrap">
                {card.value}
              </h3>
              {card.comparison && (
                <div className="flex-shrink-0">
                  <ComparisonBadge
                    currentValue={card.comparison.current}
                    previousValue={card.comparison.previous}
                    format="percent"
                    size="sm"
                  />
                </div>
              )}
            </div>
            {/* Label */}
            <p className="mt-1 text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-tight">{card.title}</p>
            {/* Subtitle */}
            <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500 leading-tight truncate">{card.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
