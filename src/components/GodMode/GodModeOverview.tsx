/**
 * GodMode — Overview: KPIs globales (Clean Light Emerald Edition)
 */
import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Users, DollarSign, AlertTriangle,
  FileText, Link2, Zap, Store, BarChart2, ShieldAlert,
  Power, RefreshCw, Clock, History, CheckCircle2, XCircle
} from 'lucide-react';
import type { NegocioAdmin } from '../../types/godmode';
import {
  type GlobalStats,
  getKillSwitchStatus,
  setKillSwitchStatus,
  fetchSuperadminAuditLogs,
  type KillSwitchConfig,
  type AuditLogItem
} from '../../services/godmode';
import { supabase } from '../../services/supabase';

interface Props {
  negocios: NegocioAdmin[];
  stats: GlobalStats;
  onSelectCliente: (id: string) => void;
}

const PLAN_COLORS: Record<string, string> = {
  glow: 'from-emerald-500 to-teal-600',
  glow_pro: 'from-violet-500 to-purple-600',
};
const PLAN_LABELS: Record<string, string> = {
  glow: '✨ Glow (Básico Gratis)',
  glow_pro: '⭐ Glow Pro (Automatizado)',
};

const KPICard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <div className="bg-white border border-emerald-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm shadow-emerald-900/5 hover:border-emerald-200 transition-all">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{value}</p>
      <p className="text-xs text-slate-500 font-bold mt-1">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const GodModeOverview: React.FC<Props> = ({ negocios, stats, onSelectCliente }) => {
  const mrrSoles = Math.round(stats.mrr_total);
  const arpuSoles = stats.total_clientes > 0
    ? Math.round((stats.mrr_total / stats.total_clientes))
    : 0;

  // Kill Switch state
  const [killSwitch, setKillSwitch] = useState<KillSwitchConfig>({
    activo: false,
    motivo: '',
    fecha: null,
    detener_whatsapp: false,
    detener_autopilot: false,
  });
  const [loadingKillSwitch, setLoadingKillSwitch] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    loadKillSwitch();
    loadAuditLogs();
  }, []);

  const loadKillSwitch = async () => {
    try {
      const ks = await getKillSwitchStatus();
      setKillSwitch(ks);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const logs = await fetchSuperadminAuditLogs(10);
      setAuditLogs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const toggleKillSwitch = async () => {
    const nuevoEstado = !killSwitch.activo;
    const confirmMsg = nuevoEstado
      ? '🚨 ¿DESEAS ACTIVAR EL KILL SWITCH GLOBAL?\nEsto suspenderá inmediatamente los disparos automáticos de WhatsApp y recordatorios en todos los salones.'
      : '✅ ¿Reanudar envíos automáticos globales?';
    if (!window.confirm(confirmMsg)) return;

    setLoadingKillSwitch(true);
    try {
      const { data } = await supabase.auth.getUser();
      const updated: KillSwitchConfig = {
        activo: nuevoEstado,
        motivo: nuevoEstado ? 'Pausa de emergencia iniciada por SuperAdmin' : '',
        fecha: nuevoEstado ? new Date().toISOString() : null,
        detener_whatsapp: nuevoEstado,
        detener_autopilot: nuevoEstado,
      };
      await setKillSwitchStatus(updated, data?.user?.email || 'superadmin');
      setKillSwitch(updated);
      loadAuditLogs();
    } catch (e: any) {
      alert('Error al modificar Kill Switch: ' + e.message);
    } finally {
      setLoadingKillSwitch(false);
    }
  };

  // Top 5 por valor
  const planScore = (p: string) => p === 'glow_pro' ? 2 : 1;
  const topNegocios = [...negocios]
    .sort((a, b) => planScore(b.plan) - planScore(a.plan))
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Kill Switch Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        killSwitch.activo
          ? 'bg-rose-50 border-rose-300 shadow-md shadow-rose-900/10'
          : 'bg-emerald-50/60 border-emerald-200 shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
              killSwitch.activo ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-600 text-white'
            }`}>
              {killSwitch.activo ? <ShieldAlert className="w-6 h-6" /> : <Power className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {killSwitch.activo ? 'KILL-SWITCH GLOBAL ACTIVADO' : 'Sistema de Despachos: Operativo'}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  killSwitch.activo ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {killSwitch.activo ? 'En Pausa Crítica' : 'En Línea'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {killSwitch.activo
                  ? `Todos los envíos de WhatsApp, recordatorios y rescates están PAUSADOS en toda la plataforma desde ${new Date(killSwitch.fecha || '').toLocaleTimeString('es-PE')}.`
                  : 'Las automatizaciones de recordatorios 24h/3h, retoques, rescates y WhatsApp están funcionando con normalidad.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleKillSwitch}
            disabled={loadingKillSwitch}
            className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-xs whitespace-nowrap self-end sm:self-center ${
              killSwitch.activo
                ? 'bg-white hover:bg-rose-100 text-rose-700 border border-rose-300'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            {loadingKillSwitch ? 'Procesando...' : killSwitch.activo ? 'Reanudar Plataforma' : 'Activar Kill-Switch'}
          </button>
        </div>
      </div>
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Resumen Ejecutivo (Overview)</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KPICard
          label="MRR Estimado"
          value={`S/. ${mrrSoles.toLocaleString('es-PE')}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-700" />}
          color="bg-emerald-50 border border-emerald-200"
          sub="ingresos mensuales recurrentes"
        />
        <KPICard
          label="Clientes activos"
          value={stats.activos}
          icon={<Store className="w-5 h-5 text-teal-700" />}
          color="bg-teal-50 border border-teal-200"
          sub={`${stats.trial} en prueba`}
        />
        <KPICard
          label="ARPU Promedio"
          value={`S/. ${arpuSoles.toLocaleString('es-PE')}`}
          icon={<TrendingUp className="w-5 h-5 text-purple-700" />}
          color="bg-purple-50 border border-purple-200"
          sub="ingreso promedio x salón"
        />
        <KPICard
          label="Onboardings"
          value={stats.onboarding_pendientes}
          icon={<Link2 className="w-5 h-5 text-amber-700" />}
          color={stats.onboarding_pendientes > 0 ? "bg-amber-50 border border-amber-200" : "bg-slate-100 border border-slate-200"}
          sub={`${stats.briefs_completados} briefs listos`}
        />
      </div>

      {/* Distribución de planes & Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            Distribución de planes
          </h2>
          <div className="space-y-3.5">
            {(['glow', 'glow_pro'] as const).map(plan => {
              const count = stats.plan_distribution[plan] || 0;
              const pct = stats.total_clientes > 0 ? (count / stats.total_clientes) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">{PLAN_LABELS[plan]}</span>
                    <span className="text-slate-500 font-mono">{count} salones ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
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
        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Estado de clientes
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: 'Activos', value: stats.activos, color: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200' },
                { label: 'Trial', value: stats.trial, color: 'text-amber-700', bg: 'bg-amber-50 border border-amber-200' },
                { label: 'Suspendidos', value: stats.suspendidos, color: 'text-rose-700', bg: 'bg-rose-50 border border-rose-200' },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center shadow-2xs`}>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-slate-600 font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-600">
              <span>Briefs completados</span>
              <span className="text-emerald-700 font-black">{stats.briefs_completados} / {stats.total_clientes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top negocios */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <h2 className="text-sm font-black text-slate-900 mb-3.5">
          Últimos clientes registrados
        </h2>
        <div className="divide-y divide-slate-100">
          {topNegocios.map(n => (
            <button
              key={n.id}
              onClick={() => onSelectCliente(n.id)}
              className="w-full flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black text-emerald-900 bg-emerald-100 border border-emerald-200 flex-shrink-0"
              >
                {n.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{n.nombre}</p>
                <p className="text-[11px] text-slate-500 truncate">
                  {(n.owner as any)?.email || 'Sin usuario asignado'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  n.plan === 'glow_pro'   ? 'bg-violet-50 text-violet-800 border-violet-200' :
                  n.plan === 'glow'       ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                            'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {PLAN_LABELS[n.plan] || n.plan}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  n.estado === 'activo' ? 'bg-emerald-500' :
                  n.estado === 'trial'  ? 'bg-amber-500' : 'bg-rose-500'
                }`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bitácora de Auditoría SuperAdmin */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900">
              Registro de Auditoría (Últimas Acciones de SuperAdmin)
            </h2>
          </div>
          <button
            onClick={loadAuditLogs}
            disabled={loadingAudit}
            className="text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 font-medium">
            No hay registros de auditoría aún. Las modificaciones a salones y kill-switch aparecerán aquí.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Fecha y Hora</th>
                  <th className="pb-2">Admin</th>
                  <th className="pb-2">Acción</th>
                  <th className="pb-2">Salón Afectado</th>
                  <th className="pb-2">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('es-PE', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-700 max-w-[140px] truncate">
                      {log.admin_email}
                    </td>
                    <td className="py-2.5 font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        log.accion.includes('kill') ? 'bg-rose-100 text-rose-800' :
                        log.accion.includes('update') ? 'bg-indigo-100 text-indigo-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-800 font-medium truncate max-w-[140px]">
                      {log.negocio_nombre || log.negocio_id?.substring(0, 8) || 'Global / Sistema'}
                    </td>
                    <td className="py-2.5 text-slate-500 font-mono text-[11px] truncate max-w-[200px]">
                      {JSON.stringify(log.detalles || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GodModeOverview;
