/**
 * ================================================================
 * GOD MODE — AUDITORÍA & MONITOR DE ERRORES EN TIEMPO REAL
 * Monitorea y audita errores de n8n y Supabase Autopilot en vivo
 * ================================================================
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle, ShieldAlert, Activity, RefreshCw, Search,
  ExternalLink, Copy, Check, Filter, X, Clock, Store,
  Zap, Radio, ChevronRight, Info, AlertOctagon, Terminal
} from 'lucide-react';
import {
  fetchAllErrors, computeErrorStats, subscribeToErrors,
  type ErrorRecord, type ErrorStats
} from '../../services/errorAuditService';

interface Props {
  negocios?: { id: string; nombre: string }[];
}

export const GodModeErrores: React.FC<Props> = ({ negocios = [] }) => {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBiz, setSelectedBiz] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<'all' | 'n8n_bot' | 'autopilot'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newArrivalAlert, setNewArrivalAlert] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const alertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllErrors(selectedBiz || undefined);
      setErrors(data);
      setStats(computeErrorStats(data));
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading errors in GodMode:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBiz]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Suscripción Realtime
  useEffect(() => {
    const unsubscribe = subscribeToErrors((newErr) => {
      setErrors(prev => [newErr, ...prev]);
      setStats(prev => prev ? {
        ...prev,
        totalHoy: prev.totalHoy + 1,
        totalSemana: prev.totalSemana + 1,
        n8nErrors: newErr.source === 'n8n_bot' ? prev.n8nErrors + 1 : prev.n8nErrors,
        autopilotErrors: newErr.source === 'autopilot' ? prev.autopilotErrors + 1 : prev.autopilotErrors,
      } : null);

      setNewArrivalAlert(true);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = setTimeout(() => setNewArrivalAlert(false), 5000);
    });

    return () => {
      unsubscribe();
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredErrors = errors.filter(err => {
    const matchesSearch =
      err.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      err.mensaje_error.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (err.business_nombre && err.business_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (err.nodo_fallido && err.nodo_fallido.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (err.execution_id && err.execution_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource = selectedSource === 'all' || err.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
      {/* ── Header ── */}
      <div className="p-6 border-b border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Auditoría & Centro de Alertas de Error
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Supabase & n8n Realtime
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitoreo centralizado de fallos en ejecuciones, RPCs de base de datos y workflows
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <a
              href="https://n8n.koratflow.agency/workflows"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir n8n Engine
            </a>
          </div>
        </div>

        {/* ── Banner Alerta Realtime si entra nuevo error ── */}
        {newArrivalAlert && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs font-medium animate-bounce-short">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
              <span><strong>¡Nuevo error detectado en vivo!</strong> Se ha recibido un evento en tiempo real.</span>
            </div>
            <button onClick={() => setNewArrivalAlert(false)} className="text-rose-600 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Errores Hoy</div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
              {stats?.totalHoy ?? 0}
              <span className="text-xs font-medium text-slate-500 font-normal">registrados</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Últimos 7 Días</div>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {stats?.totalSemana ?? 0}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Salones Afectados</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {stats?.negociosAfectados ?? 0}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Origen de Fallos</div>
            <div className="text-xs font-semibold text-slate-700 mt-2 flex items-center justify-between">
              <span>n8n Workflows:</span>
              <span className="font-bold text-slate-900">{stats?.n8nErrors ?? 0}</span>
            </div>
            <div className="text-xs font-semibold text-slate-700 mt-0.5 flex items-center justify-between">
              <span>Autopilot Engine:</span>
              <span className="font-bold text-slate-900">{stats?.autopilotErrors ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filtros y Búsqueda ── */}
      <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Búsqueda */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por error, workflow, nodo o salón..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Filtro Salón */}
          <select
            value={selectedBiz}
            onChange={e => setSelectedBiz(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 text-slate-700 font-medium"
          >
            <option value="">Todos los Salones</option>
            {negocios.map(n => (
              <option key={n.id} value={n.id}>{n.nombre}</option>
            ))}
          </select>

          {/* Filtro Origen */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600">
            <button
              onClick={() => setSelectedSource('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${selectedSource === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedSource('n8n_bot')}
              className={`px-2.5 py-1 rounded-md transition-colors ${selectedSource === 'n8n_bot' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}`}
            >
              n8n Bot
            </button>
            <button
              onClick={() => setSelectedSource('autopilot')}
              className={`px-2.5 py-1 rounded-md transition-colors ${selectedSource === 'autopilot' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}`}
            >
              Autopilot
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Mostrando <strong>{filteredErrors.length}</strong> de {errors.length} incidencias
        </div>
      </div>

      {/* ── Lista / Tabla de Errores ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading && errors.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <p className="text-xs font-medium">Cargando bitácora de errores...</p>
          </div>
        ) : filteredErrors.length === 0 ? (
          <div className="h-64 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500 gap-3 shadow-xs">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
              <Check className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-slate-900">¡Todo en orden! Sin errores activos</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                No hay incidencias registradas con los filtros seleccionados. El motor está operando con normalidad.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredErrors.map((err) => {
              const isN8n = err.source === 'n8n_bot';
              const dateObj = new Date(err.created_at);
              const formattedDate = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const formattedTime = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div
                  key={err.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-xs transition-all hover:shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isN8n ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
                      {isN8n ? <Zap className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isN8n ? 'bg-rose-100 text-rose-800' : 'bg-purple-100 text-purple-800'}`}>
                          {isN8n ? 'n8n Workflow' : 'Supabase Autopilot'}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {err.workflow_name}
                        </span>
                        {err.nodo_fallido && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            Nodo: {err.nodo_fallido}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium ml-auto lg:ml-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formattedDate} {formattedTime}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-rose-700 font-mono bg-rose-50/60 p-2 rounded-lg border border-rose-100 break-words">
                        {err.mensaje_error}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400" />
                          Salón: <strong className="text-slate-700">{err.business_nombre}</strong>
                        </span>

                        {err.execution_id && (
                          <span className="font-mono">
                            Exec ID: <strong className="text-slate-700">#{err.execution_id}</strong>
                          </span>
                        )}

                        {err.mensaje_usuario && (
                          <span className="truncate max-w-xs text-slate-600 italic">
                            Contexto: "{err.mensaje_usuario}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => handleCopy(err.mensaje_error, String(err.id))}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors title='Copiar error'"
                    >
                      {copiedId === String(err.id) ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {err.execution_id && (
                      <a
                        href={`https://n8n.koratflow.agency/workflow/${err.workflow_name}/executions/${err.execution_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver en n8n
                      </a>
                    )}

                    <button
                      onClick={() => setSelectedError(err)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      Inspeccionar Detalle
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal de Detalle Completo ── */}
      {selectedError && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inspección de Incidencia</h3>
                  <p className="text-xs text-slate-500 font-mono">ID: {selectedError.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mensaje de Error</label>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-mono mt-1 select-all break-words">
                  {selectedError.mensaje_error}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Workflow / Flujo</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedError.workflow_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Nodo Fallido</span>
                  <p className="font-semibold text-slate-800 mt-0.5 font-mono">{selectedError.nodo_fallido || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Salón / Negocio</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedError.business_nombre}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Fecha / Hora de Registro</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{new Date(selectedError.created_at).toLocaleString('es-PE')}</p>
                </div>
              </div>

              {selectedError.output_original && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Output Original / Traza</label>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] mt-1 overflow-x-auto select-all max-h-40">
                    {selectedError.output_original}
                  </pre>
                </div>
              )}

              {selectedError.metadata && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metadata JSON</label>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] mt-1 overflow-x-auto select-all max-h-40">
                    {JSON.stringify(selectedError.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleCopy(JSON.stringify(selectedError, null, 2), 'modal')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5"
              >
                {copiedId === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar JSON de Incidencia
              </button>

              <button
                onClick={() => setSelectedError(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModeErrores;
