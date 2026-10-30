import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, Send, CheckCircle2, AlertTriangle, XCircle, Activity, Smartphone, Clock, Sparkles, Calendar, Users, Briefcase } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const GodModeCentinelaSRE: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'multitenant' | 'agenda_7am'>('multitenant');
  const [loading, setLoading] = useState(false);
  
  // Data barrido general
  const [data, setData] = useState<any>(null);
  const [lastDispatched, setLastDispatched] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  // Data auditoría agenda 7am
  const [agendaData, setAgendaData] = useState<any>(null);
  const [dispatchingAgenda, setDispatchingAgenda] = useState(false);
  const [lastAgendaDispatched, setLastAgendaDispatched] = useState<string | null>(null);

  const fetchBarrido = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc('centinela_ejecutar_barrido_general');
      if (error) throw error;
      setData(res);
    } catch (err: any) {
      console.error('Error fetching barrido SRE:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgendaHealth = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.rpc('centinela_auditar_salud_agenda_matutina');
      if (error) throw error;
      setAgendaData(res);
    } catch (err: any) {
      console.error('Error fetching agenda health 7am:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarrido();
    fetchAgendaHealth();
  }, []);

  const handleDispararManual = async () => {
    setDispatching(true);
    try {
      const { data: res, error } = await supabase.rpc('centinela_disparar_reporte_whatsapp');
      if (error) throw error;
      setLastDispatched(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      fetchBarrido();
    } catch (err) {
      console.error('Error disparando reporte SRE:', err);
    } finally {
      setDispatching(false);
    }
  };

  const handleDispararAgendaManual = async () => {
    setDispatchingAgenda(true);
    try {
      const { data: res, error } = await supabase.rpc('centinela_disparar_reporte_agenda_matutina');
      if (error) throw error;
      setLastAgendaDispatched(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      fetchAgendaHealth();
    } catch (err) {
      console.error('Error disparando auditoria agenda:', err);
    } finally {
      setDispatchingAgenda(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Centinela SRE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 text-emerald-400 flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Agente Autónomo SRE Centinela</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                Producción Activa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervisión de salud operativa y slots de agendamiento multitenant con alertas directas por WhatsApp.
            </p>
          </div>
        </div>

        {/* Selector de sub-vista */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('multitenant')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'multitenant'
                ? 'bg-white text-slate-900 shadow-2xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📊 Multitenant Pulse (Horas Punta)
          </button>
          <button
            onClick={() => setActiveTab('agenda_7am')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'agenda_7am'
                ? 'bg-white text-emerald-900 shadow-2xs font-black'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>🌅 Salud Agenda 7:00 AM</span>
          </button>
        </div>
      </div>

      {/* ─── VISTA 1: MULTITENANT PULSE (HORAS PUNTA) ─── */}
      {activeTab === 'multitenant' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Disparos automáticos programados: <strong>09:00 AM, 12:00 PM, 03:00 PM, 06:00 PM, 09:00 PM</strong> (Lima)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchBarrido}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Barrido en Vivo</span>
              </button>
              <button
                onClick={handleDispararManual}
                disabled={dispatching}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatching ? 'Enviando...' : 'Enviar Reporte a WhatsApp'}</span>
              </button>
            </div>
          </div>

          {lastDispatched && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Reporte Multitenant enviado exitosamente al 51981482289 a las {lastDispatched}.</span>
            </div>
          )}

          {/* Tarjetas métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Estado General</span>
              <span className="text-sm font-black text-slate-900 block truncate">
                {data?.estado_general || 'Auditando...'}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Salones Activos</span>
              <span className="text-xl font-black text-indigo-600">
                {data?.metricas?.salones_activos_hoy ?? 0}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Citas Hoy</span>
              <span className="text-xl font-black text-slate-900">
                {data?.metricas?.citas_completadas_hoy ?? 0}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Msgs Despachados</span>
              <span className="text-xl font-black text-emerald-600">
                {data?.metricas?.mensajes_enviados_hoy ?? 0}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">En Cola Activa</span>
              <span className="text-xl font-black text-amber-600">
                {data?.metricas?.mensajes_pendientes ?? 0}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Fallidos Hoy</span>
              <span className={`text-xl font-black ${(data?.metricas?.mensajes_fallidos_hoy ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {data?.metricas?.mensajes_fallidos_hoy ?? 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Desglose por Salón Activo */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  Desglose de Tenants Activos ({data?.desglose_salones?.length || 0})
                </h3>
                <span className="text-[11px] font-bold text-slate-400">Hoy</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {data?.desglose_salones && data.desglose_salones.length > 0 ? (
                  data.desglose_salones.map((s: any) => (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-black text-slate-900">{s.salon}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {s.citas} citas completadas • {s.enviados} mensajes enviados
                          {s.fallidos > 0 && <span className="text-rose-600 font-bold ml-1">({s.fallidos} fallidos)</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          s.whatsapp_status === 'conectado' || s.whatsapp_status === 'open'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {s.whatsapp_status === 'conectado' || s.whatsapp_status === 'open' ? '🟢 Conectado' : '🔴 Inactivo'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No hay actividad registrada en ningún tenant el día de hoy.
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa del mensaje de WhatsApp */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Payload WhatsApp Horas Punta
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Instancia: test_salon_1788638244
                  </span>
                </div>
                <pre className="mt-4 text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[300px] overflow-y-auto">
                  {data?.mensaje_whatsapp || 'Cargando payload...'}
                </pre>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Destino: <strong>51981482289</strong> (Martin Pestana)</span>
                <span>Horas: <strong>09:00, 12:00, 15:00, 18:00, 21:00</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── VISTA 2: AUDITORÍA MATUTINA DE AGENDA (07:00 AM) ─── */}
      {activeTab === 'agenda_7am' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Disparo automático diario programado: <strong>07:00 AM</strong> (Lima) antes de la apertura de salones.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAgendaHealth}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Auditar Agenda Ahora</span>
              </button>
              <button
                onClick={handleDispararAgendaManual}
                disabled={dispatchingAgenda}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{dispatchingAgenda ? 'Enviando...' : 'Enviar Reporte 7AM a WhatsApp'}</span>
              </button>
            </div>
          </div>

          {lastAgendaDispatched && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Diagnóstico de Apertura de Agenda enviado al 51981482289 a las {lastAgendaDispatched}.</span>
            </div>
          )}

          {/* Tarjetas métricas de agenda */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Diagnóstico Matutino</span>
              <span className="text-sm font-black text-slate-900 block truncate">
                {agendaData?.estado_general || 'Auditando...'}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Salones Auditados</span>
              <span className="text-xl font-black text-indigo-600">
                {agendaData?.metricas?.salones_operativos ?? 0}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Citas ya Agendadas Hoy</span>
              <span className="text-xl font-black text-emerald-600">
                {agendaData?.metricas?.citas_hoy ?? 0}
              </span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Bloqueos de Slots Pasados</span>
              <span className={`text-xl font-black ${(agendaData?.metricas?.bloqueos_pasados ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {agendaData?.metricas?.bloqueos_pasados ?? 0}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla de salud del modal por salón */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Salud del Modal de Agendamiento ({agendaData?.desglose_salones?.length || 0})
                </h3>
                <span className="text-[11px] font-bold text-slate-400">Slots & Catálogos</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto pr-1">
                {agendaData?.desglose_salones && agendaData.desglose_salones.length > 0 ? (
                  agendaData.desglose_salones.map((s: any) => (
                    <div key={s.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900">{s.salon}</h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            ({s.hora_apertura} - {s.hora_cierre})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {s.total_staff} miembros staff • {s.total_servicios} servicios activos • {s.citas_hoy} citas hoy
                        </p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        s.modal_ok
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {s.modal_ok ? '🟢 Modal OK' : '🔴 Incompleto'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No se encontraron salones activos en auditoría.
                  </div>
                )}
              </div>
            </div>

            {/* Vista previa WhatsApp 7AM */}
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Payload WhatsApp Apertura 7:00 AM
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Cron: 0 7 * * *
                  </span>
                </div>
                <pre className="mt-4 text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[300px] overflow-y-auto">
                  {agendaData?.mensaje_whatsapp || 'Cargando payload de apertura...'}
                </pre>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Destino: <strong>51981482289</strong> (Martin Pestana)</span>
                <span>Frecuencia: <strong>Diaria 07:00 AM (Lima)</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModeCentinelaSRE;
