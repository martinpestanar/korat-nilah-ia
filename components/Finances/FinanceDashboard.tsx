import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus,
  ArrowUpRight, ArrowDownRight,
  Sparkles, Activity, Bot,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useCurrency } from '../../hooks/useCurrency';
import { useCopilot } from '../../context/CopilotContext';

/* ── Types ──────────────────────────────────────────────────── */
interface Metrics {
  totalIncome:    number;
  totalExpenses:  number;
  netProfit:      number;
  profitMargin:   number;
}

/* ── Skeleton card ─────────────────────────────────────────── */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10 ${className}`} />
);

/* ── Component ─────────────────────────────────────────────── */
export default function FinanceDashboard() {
  const { formatMoney } = useCurrency();
  const { toggleCopilot } = useCopilot();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<Metrics>({
    totalIncome: 0, totalExpenses: 0, netProfit: 0, profitMargin: 0,
  });

  const businessId = localStorage.getItem('korat_business_id');

  useEffect(() => {
    if (businessId) calculateMetrics();
    // eslint-disable-next-line
  }, [businessId]);

  const calculateMetrics = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const [{ data: expData }, { data: citData }] = await Promise.all([
        supabase.from('finances_expenses').select('amount')
          .eq('business_id', businessId)
          .gte('expense_date', startOfMonth).lte('expense_date', endOfMonth),
        supabase.from('citas').select('precio')
          .eq('business_id', businessId).eq('estado', 'Completada')
          .gte('fecha', startOfMonth).lte('fecha', endOfMonth),
      ]);

      const totalExpenses = (expData || []).reduce((s, i) => s + Number(i.amount), 0);
      const totalIncome   = (citData  || []).reduce((s, i) => s + Number(i.precio || 0), 0);
      const netProfit     = totalIncome - totalExpenses;
      const profitMargin  = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      setMetrics({ totalIncome, totalExpenses, netProfit, profitMargin });
    } catch (err) {
      console.error('Error calculating metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const { totalIncome, totalExpenses, netProfit, profitMargin } = metrics;

  /* status */
  const isLoss       = netProfit < 0;
  const isBreakeven  = !isLoss && profitMargin < 10;
  const statusLabel  = isLoss ? 'Pérdida Neta' : isBreakeven ? 'Punto de equilibrio' : 'Saludable';
  const StatusIcon   = isLoss ? TrendingDown : isBreakeven ? Minus : TrendingUp;
  const statusColors = isLoss
    ? { pill: 'bg-rose-100 dark:bg-rose-500/15', icon: 'text-rose-500', badge: 'bg-rose-500/10 text-rose-500 border-rose-500/20' }
    : isBreakeven
    ? { pill: 'bg-amber-100 dark:bg-amber-500/15', icon: 'text-amber-500', badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
    : { pill: 'bg-emerald-100 dark:bg-emerald-500/15', icon: 'text-emerald-500', badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };

  const copilotMsg = isLoss
    ? `⚠️ ALERTA: Pérdida de ${formatMoney(Math.abs(netProfit))} este mes. Revisa tus egresos e inicia una campaña Flash para recuperar flujo de caja.`
    : netProfit > 2000
    ? `🎉 ¡Excelente! Margen neto del ${profitMargin.toFixed(1)}%. El excedente de ${formatMoney(netProfit)} puede reinvertirse en publicidad para escalar captación.`
    : `✅ Tu negocio está en verde con ${formatMoney(netProfit)} de ganancia. Monitorea tus insumos para no salir del rango saludable.`;

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-28 space-y-4">

      {/* ── Resumen Hero Card ─────────────────────────────── */}
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.07] shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusColors.pill}`}>
                  <StatusIcon size={18} className={statusColors.icon} />
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColors.badge}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider mb-1">
                Ganancia Neta — Este mes
              </p>
              <p
                className={`text-3xl sm:text-4xl font-black tracking-tight whitespace-nowrap truncate ${isLoss ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}
              >
                {formatMoney(netProfit)}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Margen</p>
              <p className={`text-3xl font-black ${statusColors.icon}`}>
                {profitMargin.toFixed(0)}<span className="text-lg">%</span>
              </p>
            </div>
          </div>

          {/* Mini bar visual */}
          {totalIncome > 0 && (
            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-1.5 font-medium">
                <span>Egresos</span>
                <span>Ingresos</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` }}
                  transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: isLoss ? '#f43f5e' : isBreakeven ? '#f59e0b'
                      : 'linear-gradient(90deg,#f43f5e 0%,#10b981 100%)',
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Ingresos / Egresos Cards ──────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          <><Skeleton className="h-28" /><Skeleton className="h-28" /></>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-4 bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.07] shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100/70 dark:bg-emerald-500/15 flex items-center justify-center mb-3">
                <ArrowUpRight size={18} className="text-emerald-500" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Ingresos
              </p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight whitespace-nowrap truncate">
                {formatMoney(totalIncome)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Citas completadas</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-4 bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.07] shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-100/70 dark:bg-rose-500/15 flex items-center justify-center mb-3">
                <ArrowDownRight size={18} className="text-rose-500" />
              </div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                Egresos
              </p>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight whitespace-nowrap truncate">
                {formatMoney(totalExpenses)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Gastos del mes</p>
            </motion.div>
          </>
        )}
      </div>

      {/* ── Copilot Insight Card ──────────────────────────── */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 60%, #2563eb 100%)' }}
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">Nilah Copilot</span>
                <Sparkles size={12} className="text-violet-300" />
              </div>
            </div>
            <p className="text-sm text-violet-100 leading-relaxed mb-4">
              {copilotMsg}
            </p>
            <button 
              onClick={toggleCopilot}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-violet-700 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-transform"
            >
              <Bot size={13} /> Hablar con Nilah
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Quick health metrics ───────────────────────────── */}
      {!isLoading && totalIncome > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-5 bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.07] shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-gray-400" />
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Ratios del mes
            </span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Ratio gastos / ingresos', value: `${((totalExpenses / totalIncome) * 100).toFixed(1)}%`, ok: totalExpenses / totalIncome < 0.7 },
              { label: 'Margen operativo', value: `${profitMargin.toFixed(1)}%`, ok: profitMargin >= 10 },
            ].map(({ label, value, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className={`text-sm font-bold ${ok ? 'text-emerald-500' : 'text-rose-500'}`}>{value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
