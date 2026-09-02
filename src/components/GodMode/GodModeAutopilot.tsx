/**
 * ================================================================
 * GOD MODE — NILAH AUTOPILOT MISSION CONTROL (Clean Light Emerald Edition)
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
  { id: 'recordatorio_24h', label: 'Recordatorio 24h', emoji: '⏰' },
  { id: 'recordatorio_3h',  label: 'Recordatorio 3h',  emoji: '⚡' },
  { id: 'retoque',          label: 'Retoque (18-24d)', emoji: '💅' },
  { id: 'fidelizacion',     label: 'Calificación & Premios', emoji: '⭐' },
  { id: 'cumpleanos',       label: 'Cumpleaños',       emoji: '🎂' },
  { id: 'rescate_45d',      label: 'Rescate (45d)',    emoji: '🫀' },
  { id: 'rescate_75d',      label: 'Rescate (75d)',    emoji: '🔥' },
  { id: 'rescate_120d',     label: 'Rescate Final (120d)', emoji: '🚨' },
  { id: 'campana_marketing', label: 'Campañas Masivas', emoji: '📢' },
];

const ESTADO_META: Record<EstadoLog, { label: string; color: string; dot: string }> = {
  pendiente:          { label: 'Pendiente',       color: 'text-amber-700',  dot: 'bg-amber-500' },
  enviado:            { label: 'Enviado ✓',       color: 'text-emerald-700', dot: 'bg-emerald-500' },
  bloqueado_cooldown: { label: 'Cooldown',         color: 'text-blue-700',   dot: 'bg-blue-500' },
  bloqueado_ia:       { label: 'Bloq. IA',         color: 'text-purple-700', dot: 'bg-purple-500' },
  bloqueado_config:   { label: 'Bloq. Config',     color: 'text-orange-700', dot: 'bg-orange-500' },
  error:              { label: 'Error',            color: 'text-rose-700',    dot: 'bg-rose-500' },
  simulacion:         { label: '🧪 Test',          color: 'text-cyan-700',   dot: 'bg-cyan-500' },
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
}

// ─── Componente principal ─────────────────────────────────────

interface Props {
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
    timerRef.current = setInterval(load, 15000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoRefresh, load]);

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

  const logsFiltrados = logs.filter(l => {
    if (filterFlujo  && l.flujo_origen !== filterFlujo)  return false;
    if (filterEstado && l.estado       !== filterEstado)  return false;
    if (searchTel    && !(l.telefono || '').includes(searchTel)) return false;
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-emerald-600 font-bold">
      <RefreshCw className="w-6 h-6 animate-spin mr-2" />
      <span className="text-xs">Conectando a Nilah Autopilot...</span>
    </div>
  );

  const sistemaPausado = config?.pausa_global ?? false;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto font-sans text-slate-900">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <Radio className="w-5 h-5 text-emerald-600" />
            Nilah Autopilot — Mission Control
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {businessNombre ? `Vista filtrada: ${businessNombre}` : 'Vista global — todos los salones'}
            {' · '}Actualizado {lastUpdate.toLocaleTimeString('es-PE')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAutoRefresh(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-bold transition-all shadow-2xs ${
              autoRefresh ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-100 text-slate-500'
            }`}>
            {autoRefresh ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5" />}
            {autoRefresh ? 'En Vivo' : 'Pausado'}
          </button>
          <button onClick={load} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 shadow-2xs hover:bg-slate-50 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-2xs">
        {([['monitor','📊 Monitor en Vivo'],['test','🧪 Modo Prueba'],['schedule','⏰ Horarios Cron']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 text-xs font-black py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === id ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}>{label}</button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Tab: Monitor ── */}
      {activeTab === 'monitor' && (<>

      {/* ── KILL SWITCH GLOBAL ── */}
      <div className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
        sistemaPausado
          ? 'bg-rose-50 border-rose-200'
          : 'bg-white border-emerald-100'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {sistemaPausado
              ? <ZapOff className="w-7 h-7 text-rose-600" />
              : <Zap className="w-7 h-7 text-emerald-600" />
            }
            <div>
              <p className="font-black text-slate-900 text-sm">
                {sistemaPausado ? '🛑 Sistema Global PAUSADO' : '✅ Autopilot ACTIVO y Operando'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {sistemaPausado
                  ? 'Todos los flujos de n8n están detenidos. No se están enviando mensajes.'
                  : 'Todos los flujos operativos. Los mensajes se envían según horario y reglas.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleGlobalToggle}
            disabled={saving === 'global'}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              sistemaPausado
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
            } disabled:opacity-50`}
          >
            {saving === 'global'
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : sistemaPausado ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />
            }
            {sistemaPausado ? 'Reactivar Todo el Sistema' : 'Pausa de Emergencia'}
          </button>
        </div>
      </div>

      {/* ── Stats del día ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total hoy',   value: stats.total_hoy,      color: 'text-slate-900', icon: <Activity className="w-4 h-4 text-slate-600" />, bg: 'bg-white border-slate-200' },
            { label: 'Enviados',    value: stats.enviados_hoy,    color: 'text-emerald-700', icon: <Send className="w-4 h-4 text-emerald-600" />, bg: 'bg-emerald-50/50 border-emerald-200' },
            { label: 'Bloqueados',  value: stats.bloqueados_hoy,  color: 'text-blue-700', icon: <Shield className="w-4 h-4 text-blue-600" />, bg: 'bg-blue-50/50 border-blue-200' },
            { label: 'Errores',     value: stats.errores_hoy,     color: 'text-rose-700', icon: <XCircle className="w-4 h-4 text-rose-600" />, bg: 'bg-rose-50/50 border-rose-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border rounded-2xl p-4 shadow-2xs`}>
              <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 font-bold">
                {s.icon}
                <span className="text-[11px]">{s.label}</span>
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tasa de éxito ── */}
      {stats && stats.total_hoy > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-600">Tasa de éxito global hoy</span>
            <span className={`text-sm font-black ${stats.tasa_exito >= 70 ? 'text-emerald-700' : stats.tasa_exito >= 40 ? 'text-amber-700' : 'text-rose-700'}`}>
              {stats.tasa_exito}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${stats.tasa_exito >= 70 ? 'bg-emerald-600' : stats.tasa_exito >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${stats.tasa_exito}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Toggles por flujo ── */}
      <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Control por flujo individual</p>
          <button
            onClick={handleSimulacion}
            disabled={saving === 'simulacion'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-bold transition-all shadow-2xs ${
              config?.modo_simulacion
                ? 'border-purple-300 bg-purple-50 text-purple-800'
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{config?.modo_simulacion ? 'Simulación ACTIVA' : 'Modo Simulación'}</span>
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {FLUJOS.map(flujo => {
            const key = `pausa_${flujo.id}` as keyof AutopilotConfig;
            const pausado = (config?.[key] as boolean) ?? false;
            const flujoStats = stats?.por_flujo[flujo.id];
            const isSaving = saving === flujo.id;

            return (
              <div key={flujo.id} className="flex items-center gap-3.5 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                <span className="text-lg w-7 text-center">{flujo.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900">{flujo.label}</p>
                  {flujoStats ? (
                    <p className="text-[11px] text-slate-500 font-medium">
                      {flujoStats.enviados} env · {flujoStats.bloqueados} bloq · {flujoStats.errores} err
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-medium">Sin actividad hoy</p>
                  )}
                </div>

                <div className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  (sistemaPausado || pausado)
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  {sistemaPausado ? 'global off' : pausado ? 'pausado' : 'activo'}
                </div>

                <button
                  onClick={() => handleFlujoToggle(flujo.id)}
                  disabled={isSaving || sistemaPausado}
                  title={sistemaPausado ? 'Sistema globalmente pausado' : ''}
                  className="disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving
                    ? <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                    : pausado
                      ? <ToggleLeft className="w-8 h-8 text-slate-400 hover:text-slate-600 transition-colors" />
                      : <ToggleRight className="w-8 h-8 text-emerald-600 hover:text-emerald-700 transition-colors" />
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Log en tiempo real ── */}
      <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Actividad de hoy
            <span className="ml-2 text-xs text-slate-500 font-bold lowercase">({logsFiltrados.length} eventos)</span>
          </p>
          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                placeholder="Teléfono..."
                value={searchTel}
                onChange={e => setSearchTel(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 w-32 shadow-2xs"
              />
            </div>
            <select
              value={filterFlujo}
              onChange={e => setFilterFlujo(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none shadow-2xs font-bold"
            >
              <option value="">Todos los flujos</option>
              {FLUJOS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 focus:outline-none shadow-2xs font-bold"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {logsFiltrados.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs font-bold">
            <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No hay actividad registrada con estos filtros
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
            {logsFiltrados.map(log => {
              const meta = ESTADO_META[log.estado] || ESTADO_META.error;
              const flujoMeta = FLUJOS.find(f => f.id === log.flujo_origen);
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => setShowPreview(log)}
                >
                  {/* Dot estado */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {flujoMeta?.emoji} {flujoMeta?.label ?? log.flujo_origen}
                      </span>
                      <span className={`text-[11px] font-black ${meta.color}`}>{meta.label}</span>
                      {log.telefono && (
                        <span className="text-[11px] text-slate-500 font-mono font-medium">{log.telefono}</span>
                      )}
                    </div>
                    {log.mensaje_preview && (
                      <p className="text-[11px] text-slate-600 truncate mt-0.5 font-medium">{log.mensaje_preview}</p>
                    )}
                  </div>

                  {/* Hora */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-slate-400 font-mono font-medium">{fmtTime(log.created_at)}</p>
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors ml-auto mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal preview de mensaje ── */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowPreview(null)}>
          <div className="bg-white border border-slate-200 rounded-3xl p-5 w-full max-w-lg space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <p className="font-black text-slate-900 text-sm">Detalle del intento de envío</p>
              <button onClick={() => setShowPreview(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X className="w-4 h-4" />
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
                <div key={k} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">{k}</p>
                  <p className="text-slate-900 font-black truncate">{v}</p>
                </div>
              ))}
            </div>
            {showPreview.mensaje_preview && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Preview del mensaje</p>
                <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-medium">{showPreview.mensaje_preview}</p>
              </div>
            )}
            {showPreview.razon_bloqueo && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs font-bold">
                ⚠️ {showPreview.razon_bloqueo}
              </div>
            )}
          </div>
        </div>
      )}

      </>)}

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
