/**
 * GodMode — Overview: KPIs globales
 */
import React from 'react';
import {
  TrendingUp, Users, DollarSign, AlertTriangle,
  FileText, Link2, Zap, Store, BarChart2
} from 'lucide-react';
import type { NegocioAdmin } from '../../types/godmode';
import type { GlobalStats } from '../../services/godmode';

interface Props {
  negocios: NegocioAdmin[];
  stats: GlobalStats;
  onSelectCliente: (id: string) => void;
}

const PLAN_COLORS: Record<string, string> = {
  glow: 'from-sky-500 to-blue-600',
  glow_pro: 'from-violet-500 to-purple-600',
  glow_elite: 'from-cyan-500 to-blue-600',
};
const PLAN_LABELS: Record<string, string> = {
  glow: '✨ Glow',
  glow_pro: '⭐ Glow Pro',
  glow_elite: '💎 Glow Elite',
};

const KPICard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-start gap-4 hover:border-zinc-700 transition-colors`}>
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  </div>
);

const GodModeOverview: React.FC<Props> = ({ negocios, stats, onSelectCliente }) => {
  const mrrSoles = Math.round(stats.mrr_total);
  const arpuSoles = stats.total_clientes > 0
    ? Math.round((stats.mrr_total / stats.total_clientes))
    : 0;

  // Top 5 por "valor" (básico: plan copilot > korat > nilah)
  const planScore = (p: string) => p === 'glow_elite' ? 3 : p === 'glow_pro' ? 2 : 1;
  const topNegocios = [...negocios]
    .sort((a, b) => planScore(b.plan) - planScore(a.plan))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-bold text-white">Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="MRR Estimado"
          value={`S/. ${mrrSoles.toLocaleString('es-PE')}`}
          icon={<DollarSign className="w-5 h-5 text-white" />}
          color="bg-emerald-500/20"
          sub={`ingresos recurrentes mensuales`}
        />
        <KPICard
          label="Clientes activos"
          value={stats.activos}
          icon={<Store className="w-5 h-5 text-white" />}
          color="bg-sky-500/20"
          sub={`${stats.trial} en trial`}
        />
        <KPICard
          label="ARPU"
          value={`S/. ${arpuSoles.toLocaleString('es-PE')}`}
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          color="bg-violet-500/20"
          sub={`promedio por cliente/mes`}
        />
        <KPICard
          label="Onboarding pendientes"
          value={stats.onboarding_pendientes}
          icon={<Link2 className="w-5 h-5 text-white" />}
          color={stats.onboarding_pendientes > 0 ? "bg-amber-500/20" : "bg-zinc-700/50"}
          sub={`${stats.briefs_completados} briefs completados`}
        />
      </div>

      {/* Distribución de planes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-zinc-500" />
            Distribución de planes
          </h2>
          <div className="space-y-3">
            {(['glow', 'glow_pro', 'glow_elite'] as const).map(plan => {
              const count = stats.plan_distribution[plan] || 0;
              const pct = stats.total_clientes > 0 ? (count / stats.total_clientes) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">{PLAN_LABELS[plan]}</span>
                    <span className="text-zinc-500">{count} salones ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${PLAN_COLORS[plan]} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estado de salones */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            Estado de clientes
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Activos', value: stats.activos, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Trial', value: stats.trial, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Suspendidos', value: stats.suspendidos, color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Briefs completados</span>
              <span className="text-emerald-400">{stats.briefs_completados} / {stats.total_clientes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top negocios */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">
          Últimos clientes registrados
        </h2>
        <div className="space-y-2">
          {topNegocios.map(n => (
            <button
              key={n.id}
              onClick={() => onSelectCliente(n.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-800 transition-colors text-left group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${n.color_primario || '#10B981'}20` }}
              >
                {n.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{n.nombre}</p>
                <p className="text-[11px] text-zinc-500 truncate">
                  {(n.owner as any)?.email || 'Sin usuario'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  n.plan === 'glow_elite' ? 'bg-cyan-500/15 text-cyan-400' :
                  n.plan === 'glow_pro'   ? 'bg-violet-500/15 text-violet-400' :
                                         'bg-sky-500/15 text-sky-400'
                }`}>
                  {PLAN_LABELS[n.plan] || n.plan}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  n.estado === 'activo' ? 'bg-emerald-400' :
                  n.estado === 'trial'  ? 'bg-amber-400' : 'bg-red-400'
                }`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GodModeOverview;
