/**
 * ================================================================
 * GOD MODE — NILAH AUTOPILOT MISSION CONTROL
 * Panel de control centralizado de los 5 flujos de n8n
 * Multi-tenant: puede filtrar por negocio o ver todo el sistema
 * ================================================================
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, ZapOff, RefreshCw, AlertTriangle, CheckCircle2,
  XCircle, Clock, Filter, Activity,
  Send, Shield, FlaskConical, Eye, Search, X,
  Wifi, WifiOff, ToggleLeft, ToggleRight, Radio
} from 'lucide-react';
import {
  fetchAutopilotConfig, fetchLogsHoy,
  updateAutopilotConfig, togglePausaGlobal, togglePausaFlujo,
  calcularStatsAutopilot,
  type AutopilotConfig, type AutopilotLog,
  type FlujoOrigen, type EstadoLog, type AutopilotStats
} from '../../services/autopilot';
import AutopilotTestRunner from './AutopilotTestRunner';
import AutopilotScheduler from './AutopilotScheduler';

// ─── Constantes de UI ─────────────────────────────────────────

const FLUJOS: { id: FlujoOrigen; label: string; emoji: string }[] = [
  { id: 'retencion',        label: 'Retención',       emoji: '🎯' },
  { id: 'recordatorio_24h', label: 'Recordatorio 24h', emoji: '⏰' },
  { id: 'recordatorio_3h',  label: 'Recordatorio 3h',  emoji: '⚡' },
  { id: 'retoque',          label: 'Retoque',          emoji: '✂️' },
  { id: 'fidelizacion',     label: 'Fidelización',     emoji: '🎖️' },
];

const ESTADO_META: Record<EstadoLog, { label: string; color: string; dot: string }> = {
  pendiente:          { label: 'Pendiente',       color: 'text-amber-400',  dot: 'bg-amber-400' },
  enviado:            { label: 'Enviado ✓',       color: 'text-emerald-400', dot: 'bg-emerald-400' },
  bloqueado_cooldown: { label: 'Cooldown',         color: 'text-blue-400',   dot: 'bg-blue-400' },
  bloqueado_ia:       { label: 'Bloq. IA',         color: 'text-purple-400', dot: 'bg-purple-400' },
  bloqueado_config:   { label: 'Bloq. Config',     color: 'text-orange-400', dot: 'bg-orange-400' },
  error:              { label: 'Error',            color: 'text-red-400',    dot: 'bg-red-400' },
  simulacion:         { label: '🧪 Test',          color: 'text-cyan-400',   dot: 'bg-cyan-400' },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
}

// ─── Componente principal ─────────────────────────────────────

interface Props {
  /** Si se pasa, filtra por negocio (vista desde GodModeSalonPanel) */
  businessId?: string;
  businessNombre?: string;
}

const GodModeAutopilot: React.FC<Props> = ({ businessId, businessNombre }) => {
  const [config, setConfig]   = useState<AutopilotConfig | null>(null);
  const [logs, setLogs]       = useState<AutopilotLog[]>([]);
  const [stats, setStats]     = useState<AutopilotStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterFlujo, setFilterFlujo] = useState<FlujoOrigen | ''>('');
  const [filterEstado, setFilterEstado] = useState<EstadoLog | ''>('');
  const [searchTel, setSearchTel] = useState('');
  const [showPreview, setShowPreview] = useState<AutopilotLog | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'monitor' | 'test' | 'schedule'>('monitor');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Carga de datos ─────────────────────────────────────────

  const load = useCallback(async () => {
    try {
      const [cfg, rawLogs] = await Promise.all([
        fetchAutopilotConfig(),
        fetchLogsHoy(businessId),
      ]);
      setConfig(cfg);
      setLogs(rawLogs);
      setStats(calcularStatsAutopilot(rawLogs));
      setLastUpdate(new Date());
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(load, 15000); // refresca cada 15s
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, load]);

  // ─── Toggles ─────────────────────────────────────────────────

  const handleGlobalToggle = async () => {
    if (!config) return;
    setSaving('global');
    try {
      await togglePausaGlobal(!config.pausa_global);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(null); }
  };

  const handleFlujoToggle = async (flujo: FlujoOrigen) => {
    if (!config) return;
    const key = `pausa_${flujo}` as keyof AutopilotConfig;
    const actual = config[key] as boolean;
    setSaving(flujo);
    try {
      await togglePausaFlujo(flujo, !actual);
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(null); }
  };

  const handleSimulacion = async () => {
    if (!config) return;
    setSaving('simulacion');
    try {
      await updateAutopilotConfig({ modo_simulacion: !config.modo_simulacion });
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(null); }
  };

  // ─── Filtros de logs ─────────────────────────────────────────

  const logsFiltrados = logs.filter(l => {
    if (filterFlujo  && l.flujo_origen !== filterFlujo)  return false;
    if (filterEstado && l.estado       !== filterEstado)  return false;
    if (searchTel    && !(l.telefono || '').includes(searchTel)) return false;
    return true;
  });

  // ─── Loading ──────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-500">
      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm">Conectando al sistema nervioso...</span>
    </div>
  );

  const sistemaPausado = config?.pausa_global ?? false;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            Nilah Autopilot — Mission Control
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {businessNombre ? `Vista filtrada: ${businessNombre}` : 'Vista global — todos los salones'}
            {' · '}Actualizado {lastUpdate.toLocaleTimeString('es-PE')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              autoRefresh ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-500'
            }`}>
            {autoRefresh ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button onClick={load} className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {([['monitor','📊 Monitor'],['test','🧪 Test Run'],['schedule','⏰ Schedule']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
              activeTab === id ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}>{label}</button>
        ))}
      </div>

      {/* ── Error banner (siempre visible) ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Tab: Monitor ── */}
      {activeTab === 'monitor' && (<>

      {/* ── KILL SWITCH GLOBAL ── */}
      <div className={`rounded-2xl border p-5 transition-all ${
        sistemaPausado
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-zinc-900 border-zinc-800'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {sistemaPausado
              ? <ZapOff className="w-6 h-6 text-red-400" />
              : <Zap className="w-6 h-6 text-emerald-400" />
            }
            <div>
              <p className="font-bold text-white text-sm">
                {sistemaPausado ? '🛑 Sistema PAUSADO' : '✅ Sistema ACTIVO'}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {sistemaPausado
                  ? 'Todos los flujos están detenidos. Ningún mensaje se enviará.'
                  : 'Todos los flujos operativos. Los mensajes se envían con normalidad.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleGlobalToggle}
            disabled={saving === 'global'}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
              sistemaPausado
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-red-500/80 hover:bg-red-500 text-white'
            } disabled:opacity-50`}
          >
            {saving === 'global'
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : sistemaPausado ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />
            }
            {sistemaPausado ? 'Reactivar Todo' : 'Pausar Todo'}
          </button>
        </div>
      </div>

      {/* ── Stats del día ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total hoy',   value: stats.total_hoy,      color: 'text-zinc-300', icon: <Activity className="w-4 h-4" /> },
            { label: 'Enviados',    value: stats.enviados_hoy,    color: 'text-emerald-400', icon: <Send className="w-4 h-4" /> },
            { label: 'Bloqueados',  value: stats.bloqueados_hoy,  color: 'text-blue-400', icon: <Shield className="w-4 h-4" /> },
            { label: 'Errores',     value: stats.errores_hoy,     color: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                {s.icon}
                <span className="text-xs">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tasa de éxito ── */}
      {stats && stats.total_hoy > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400">Tasa de éxito global hoy</span>
            <span className={`text-sm font-bold ${stats.tasa_exito >= 70 ? 'text-emerald-400' : stats.tasa_exito >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
              {stats.tasa_exito}%
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${stats.tasa_exito >= 70 ? 'bg-emerald-500' : stats.tasa_exito >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${stats.tasa_exito}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Toggles por flujo ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Control por flujo</p>
          <button
            onClick={handleSimulacion}
            disabled={saving === 'simulacion'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              config?.modo_simulacion
                ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                : 'border-zinc-700 bg-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            {config?.modo_simulacion ? 'Modo Simulación ON' : 'Activar Simulación'}
          </button>
        </div>
        <div className="divide-y divide-zinc-800/60">
          {FLUJOS.map(flujo => {
            const key = `pausa_${flujo.id}` as keyof AutopilotConfig;
            const pausado = (config?.[key] as boolean) ?? false;
            const flujoStats = stats?.por_flujo[flujo.id];
            const isSaving = saving === flujo.id;

            return (
              <div key={flujo.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-lg w-7 text-center">{flujo.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{flujo.label}</p>
                  {flujoStats ? (
                    <p className="text-[11px] text-zinc-500">
                      {flujoStats.enviados} env · {flujoStats.bloqueados} bloq · {flujoStats.errores} err
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-600">Sin actividad hoy</p>
                  )}
                </div>

                <div className={`text-xs px-2 py-0.5 rounded-full ${
                  (sistemaPausado || pausado)
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {sistemaPausado ? 'global off' : pausado ? 'pausado' : 'activo'}
                </div>

                <button
                  onClick={() => handleFlujoToggle(flujo.id)}
                  disabled={isSaving || sistemaPausado}
                  title={sistemaPausado ? 'Sistema globalmente pausado' : ''}
                  className="disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving
                    ? <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
                    : pausado
                      ? <ToggleLeft className="w-8 h-8 text-zinc-600 hover:text-zinc-400 transition-colors" />
                      : <ToggleRight className="w-8 h-8 text-emerald-400 hover:text-emerald-300 transition-colors" />
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Log en tiempo real ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-semibold text-white">
            Actividad de hoy
            <span className="ml-2 text-xs text-zinc-500 font-normal">({logsFiltrados.length} registros)</span>
          </p>
          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
              <input
                placeholder="Teléfono..."
                value={searchTel}
                onChange={e => setSearchTel(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg pl-7 pr-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 w-32"
              />
            </div>
            <select
              value={filterFlujo}
              onChange={e => setFilterFlujo(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="">Todos los flujos</option>
              {FLUJOS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value as any)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {logsFiltrados.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-sm">
            <Activity className="w-8 h-8 mx-auto mb-3 opacity-30" />
            No hay actividad registrada con estos filtros
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/40 max-h-[480px] overflow-y-auto">
            {logsFiltrados.map(log => {
              const meta = ESTADO_META[log.estado] || ESTADO_META.error;
              const flujoMeta = FLUJOS.find(f => f.id === log.flujo_origen);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                  onClick={() => setShowPreview(log)}
                >
                  {/* Dot estado */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-zinc-300">
                        {flujoMeta?.emoji} {flujoMeta?.label ?? log.flujo_origen}
                      </span>
                      <span className={`text-[11px] ${meta.color}`}>{meta.label}</span>
                      {log.telefono && (
                        <span className="text-[11px] text-zinc-600 font-mono">{log.telefono}</span>
                      )}
                    </div>
                    {log.mensaje_preview && (
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{log.mensaje_preview}</p>
                    )}
                  </div>

                  {/* Hora */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-zinc-500 font-mono">{fmtTime(log.created_at)}</p>
                    <Eye className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 transition-colors ml-auto mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal preview de mensaje ── */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowPreview(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-lg space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <p className="font-semibold text-white text-sm">Detalle del intento</p>
              <button onClick={() => setShowPreview(null)}>
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Flujo', FLUJOS.find(f => f.id === showPreview.flujo_origen)?.label ?? showPreview.flujo_origen],
                ['Estado', ESTADO_META[showPreview.estado]?.label ?? showPreview.estado],
                ['Teléfono', showPreview.telefono ?? '—'],
                ['Tipo', showPreview.tipo_mensaje ?? '—'],
                ['Fecha', `${fmtDate(showPreview.created_at)} ${fmtTime(showPreview.created_at)}`],
                ['Cliente ID', showPreview.cliente_id?.toString() ?? '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-zinc-800/60 rounded-lg px-3 py-2">
                  <p className="text-zinc-500 mb-0.5">{k}</p>
                  <p className="text-zinc-200 font-medium truncate">{v}</p>
                </div>
              ))}
            </div>
            {showPreview.mensaje_preview && (
              <div className="bg-zinc-800/40 rounded-xl p-3">
                <p className="text-zinc-500 text-[11px] mb-1">Preview del mensaje</p>
                <p className="text-zinc-300 text-xs leading-relaxed whitespace-pre-wrap">{showPreview.mensaje_preview}</p>
              </div>
            )}
            {showPreview.razon_bloqueo && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-400 text-xs">
                ⚠️ {showPreview.razon_bloqueo}
              </div>
            )}
          </div>
        </div>
      )}

      </>)} {/* end activeTab === 'monitor' */}
      {/* ── Tab: Test Run ── */}
      {activeTab === 'test' && <AutopilotTestRunner />}

      {/* ── Tab: Schedule ── */}
      {activeTab === 'schedule' && config && (
        <AutopilotScheduler config={config} onSaved={load} />
      )}

    </div>
  );
};

export default GodModeAutopilot;
