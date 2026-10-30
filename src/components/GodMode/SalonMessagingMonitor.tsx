import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase';
import {
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  RefreshCw,
  Search,
  Filter,
  Calendar as CalendarIcon,
  MessageSquare,
  Sparkles,
  Award,
  Loader2,
  X,
  Star
} from 'lucide-react';

interface MonitorRow {
  cita_id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_telefono: string;
  servicio: string;
  precio: number;
  hora_cita: string;
  estado_cita: string;
  calificacion: string | null;
  feedback: string | null;
  sellos_acumulados: number;
  cola_id: number | null;
  flujo: string;
  estado_mensaje: string;
  mensaje_texto: string | null;
  intentos: number;
  error_mensaje: string | null;
  error_legible: string | null;
  proximo_intento_at: string | null;
  enviado_at: string | null;
  created_at_mensaje: string | null;
  cant_servicios?: number;
}

interface Props {
  businessId: string;
  salonNombre: string;
}

export const SalonMessagingMonitor: React.FC<Props> = ({ businessId, salonNombre }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [rows, setRows] = useState<MonitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'fallido' | 'pendiente' | 'enviado' | 'sin_calificar'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para editar teléfono y reenviar
  const [editingRow, setEditingRow] = useState<MonitorRow | null>(null);
  const [newPhone, setNewPhone] = useState('');
  const [resending, setResending] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Modal para resolución manual (Aprobar nota, omitir sellos, o descartar)
  const [resolvingRow, setResolvingRow] = useState<MonitorRow | null>(null);
  const [manualNota, setManualNota] = useState<string>('5');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualFeedback, setManualFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleAprobarManual = async (nota: string) => {
    if (!resolvingRow) return;
    try {
      setManualLoading(true);
      const { data, error } = await supabase.rpc('superadmin_aprobar_calificacion_manual', {
        p_cita_id: resolvingRow.cita_id,
        p_nota: nota
      });
      if (error) throw error;
      setManualFeedback({ type: 'success', msg: `¡Nota ${nota}⭐ asignada y sellos despachados!` });
      setTimeout(() => {
        setResolvingRow(null);
        fetchMonitor();
      }, 1000);
    } catch (err: any) {
      setManualFeedback({ type: 'error', msg: err.message || 'Error al aprobar nota' });
    } finally {
      setManualLoading(false);
    }
  };

  const handleOmitirManual = async () => {
    if (!resolvingRow) return;
    try {
      setManualLoading(true);
      const { data, error } = await supabase.rpc('superadmin_omitir_calificacion_manual', {
        p_cita_id: resolvingRow.cita_id
      });
      if (error) throw error;
      setManualFeedback({ type: 'success', msg: '¡Encuesta omitida y tarjeta con sellos despachada!' });
      setTimeout(() => {
        setResolvingRow(null);
        fetchMonitor();
      }, 1000);
    } catch (err: any) {
      setManualFeedback({ type: 'error', msg: err.message || 'Error al omitir encuesta' });
    } finally {
      setManualLoading(false);
    }
  };

  const handleDescartarManual = async () => {
    if (!resolvingRow) return;
    try {
      setManualLoading(true);
      const { data, error } = await supabase.rpc('superadmin_descartar_caso_manual', {
        p_cita_id: resolvingRow.cita_id
      });
      if (error) throw error;
      setManualFeedback({ type: 'success', msg: 'Caso cerrado sin enviar mensajes.' });
      setTimeout(() => {
        setResolvingRow(null);
        fetchMonitor();
      }, 1000);
    } catch (err: any) {
      setManualFeedback({ type: 'error', msg: err.message || 'Error al descartar' });
    } finally {
      setManualLoading(false);
    }
  };

  const fetchMonitor = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('superadmin_get_monitor_mensajeria', {
        p_business_id: businessId,
        p_fecha: selectedDate
      });

      if (error) {
        console.error('Error fetching monitor:', error);
      } else {
        setRows((data as MonitorRow[]) || []);
      }
    } catch (err) {
      console.error('Exception fetching monitor:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchMonitor();
    }
  }, [businessId, selectedDate]);

  const handleOpenEdit = (row: MonitorRow) => {
    setEditingRow(row);
    setNewPhone(row.cliente_telefono);
    setActionFeedback(null);
  };

  const handleSaveAndResend = async () => {
    if (!editingRow || !editingRow.cola_id) return;
    try {
      setResending(true);
      setActionFeedback(null);

      const { data, error } = await supabase.rpc('superadmin_corregir_telefono_y_reenviar', {
        p_cola_id: editingRow.cola_id,
        p_nuevo_telefono: newPhone
      });

      if (error) {
        setActionFeedback({ type: 'error', msg: error.message });
      } else if (data && !data.ok) {
        setActionFeedback({ type: 'error', msg: data.error || 'Error al reenviar' });
      } else {
        setActionFeedback({ type: 'success', msg: '¡Mensaje reenviado y teléfono corregido con éxito!' });
        setTimeout(() => {
          setEditingRow(null);
          fetchMonitor();
        }, 1200);
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', msg: err.message || 'Error inesperado' });
    } finally {
      setResending(false);
    }
  };

  // KPIs
  const totalCitas = rows.length;
  const totalEnviados = rows.filter(r => r.estado_mensaje === 'enviado').length;
  const totalPendientes = rows.filter(r => r.estado_mensaje === 'pendiente' || r.estado_mensaje === 'procesando').length;
  const totalFallidos = rows.filter(r => r.estado_mensaje === 'fallido').length;
  const totalSinCalificar = rows.filter(r => r.estado_cita?.toLowerCase() === 'completada' && (!r.calificacion || r.calificacion === '0')).length;

  const filteredRows = rows.filter(r => {
    if (filterStatus === 'sin_calificar') {
      if (r.estado_cita?.toLowerCase() !== 'completada' || (r.calificacion && r.calificacion !== '0')) {
        return false;
      }
    } else if (filterStatus !== 'todos' && r.estado_mensaje !== filterStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.cliente_nombre.toLowerCase().includes(q);
      const matchPhone = r.cliente_telefono.includes(q);
      const matchService = r.servicio.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchService) return false;
    }
    return true;
  });

  const getFlujoBadge = (flujo: string) => {
    switch (flujo) {
      case 'calificacion_encuesta':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles className="w-3 h-3 text-amber-500" /> Encuesta Post-Cita
          </span>
        );
      case 'fidelizacion_recompensa':
      case 'club_glow_sellos':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Award className="w-3 h-3 text-purple-500" /> Club Glow Sellos
          </span>
        );
      case 'recordatorio_24h':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" /> Recordatorio 24h
          </span>
        );
      case 'recordatorio_3h':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-500" /> Recordatorio 3h
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
            {flujo}
          </span>
        );
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ENVIADO
          </span>
        );
      case 'pendiente':
      case 'procesando':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" /> EN COLA
          </span>
        );
      case 'fallido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> FALLIDO
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-400">
            Sin mensaje
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra superior de control y selector de fecha */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Monitor de Mensajería & Despacho Post-Cita
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Supervisión en tiempo real de citas, encuestas y club glow para {salonNombre}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={fetchMonitor}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Citas del Día</p>
          <p className="text-xl font-black text-slate-900 mt-0.5">{totalCitas}</p>
        </div>
        <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">✅ Enviados con Éxito</p>
          <p className="text-xl font-black text-emerald-800 mt-0.5">{totalEnviados}</p>
        </div>
        <div className="bg-sky-50/60 p-3.5 rounded-2xl border border-sky-100 shadow-2xs">
          <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">⏳ En Cola / Ventana</p>
          <p className="text-xl font-black text-sky-800 mt-0.5">{totalPendientes}</p>
        </div>
        <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-100 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">⚠️ Requieren Atención</p>
          <p className="text-xl font-black text-rose-800 mt-0.5">{totalFallidos}</p>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'sin_calificar', 'fallido', 'pendiente', 'enviado'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {st === 'todos' && 'Todos los estados'}
              {st === 'sin_calificar' && `🟡 Aprobación Manual (${totalSinCalificar})`}
              {st === 'fallido' && `⚠️ Fallidos / Rebotes (${totalFallidos})`}
              {st === 'pendiente' && `⏳ En Cola (${totalPendientes})`}
              {st === 'enviado' && `✅ Entregados (${totalEnviados})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            <span className="text-xs font-bold">Cargando monitor de mensajería...</span>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold text-slate-600">No hay citas registradas para esta fecha</p>
            <p className="text-xs text-slate-400 mt-0.5">Selecciona otra fecha en el calendario superior</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Hora / Cita</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Servicio & Monto</th>
                  <th className="py-3 px-4">Flujo</th>
                  <th className="py-3 px-4">Estado Mensaje</th>
                  <th className="py-3 px-4">Sellos</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRows.map(row => (
                  <tr key={`${row.cita_id}-${row.cola_id || 0}`} className="hover:bg-slate-50/80 transition-colors">
                    {/* Hora / Cita */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-black text-slate-900">{row.hora_cita}</div>
                      <div className="text-[10px] text-slate-400">Cita #{row.cita_id}</div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{row.cliente_nombre}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {row.cliente_telefono || 'Sin teléfono'}
                      </div>
                    </td>

                    {/* Servicio & Monto */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 line-clamp-1" title={row.servicio}>
                          {row.servicio}
                        </span>
                        {row.cant_servicios && row.cant_servicios > 1 ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {row.cant_servicios} servicios
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        S/ {Number(row.precio || 0).toFixed(2)} •{' '}
                        <span className={`font-bold ${row.estado_cita.toLowerCase() === 'completada' ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {row.estado_cita}
                        </span>
                      </div>
                    </td>

                    {/* Flujo */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getFlujoBadge(row.flujo)}
                    </td>

                    {/* Estado Mensaje */}
                    <td className="py-3.5 px-4">
                      <div>{getEstadoBadge(row.estado_mensaje)}</div>
                      {row.error_legible && (
                        <div className="text-[11px] font-bold text-rose-600 mt-1 flex items-start gap-1 max-w-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>{row.error_legible}</span>
                        </div>
                      )}
                    </td>

                    {/* Sellos */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                        👑 {row.sellos_acumulados} sellos
                      </span>
                    </td>

                    {/* Acción */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {row.estado_mensaje === 'fallido' && row.cola_id ? (
                        <button
                          onClick={() => handleOpenEdit(row)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> Corregir y Reenviar
                        </button>
                      ) : (row.estado_cita?.toLowerCase() === 'completada' && (!row.calificacion || row.calificacion === '0')) ? (
                        <button
                          onClick={() => {
                            setResolvingRow(row);
                            setManualNota('5');
                            setManualFeedback(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-2xs transition-all cursor-pointer active:scale-95 inline-flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-current" /> Resolver Manual
                        </button>
                      ) : row.estado_mensaje === 'pendiente' ? (
                        <span className="text-[11px] text-slate-400 font-semibold">Listo para envío</span>
                      ) : row.estado_mensaje === 'enviado' ? (
                        <span className="text-[11px] text-emerald-600 font-bold">Entregado</span>
                      ) : (
                        <span className="text-[11px] text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Quirúrgico: Corregir Teléfono y Reenviar */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-100">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Corregir Teléfono & Reenviar</h4>
                  <p className="text-xs text-slate-500 font-medium">Cita #{editingRow.cita_id} • {editingRow.cliente_nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-100 text-xs text-rose-800 font-medium">
              <span className="font-bold">Motivo de falla anterior:</span>{' '}
              {editingRow.error_legible || editingRow.error_mensaje || 'Error de envío'}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Nuevo Número de WhatsApp (Perú: 9 dígitos o con 51):
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="Ej: 930017570 o 51930017570"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-[11px] text-slate-400 font-medium">
                Al guardar, se actualizará la ficha de la clienta y el mensaje saldrá de inmediato vía Evolution API.
              </p>
            </div>

            {actionFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {actionFeedback.msg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAndResend}
                disabled={resending || !newPhone.trim()}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-black text-white shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Reenviando...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Guardar y Reenviar Ahora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Quirúrgico: Resolver Calificación / Omitir Manualmente */}
      {resolvingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Resolución Manual de Cita</h4>
                  <p className="text-xs text-slate-500 font-medium">Cita #{resolvingRow.cita_id} • {resolvingRow.cliente_nombre}</p>
                </div>
              </div>
              <button
                onClick={() => setResolvingRow(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <div><strong className="text-slate-800">Servicio:</strong> {resolvingRow.servicio} (S/ {Number(resolvingRow.precio || 0).toFixed(2)})</div>
              <div><strong className="text-slate-800">Teléfono:</strong> {resolvingRow.cliente_telefono}</div>
              {resolvingRow.feedback && (
                <div className="pt-1 text-slate-700 bg-amber-50/70 p-2 rounded-xl border border-amber-200">
                  💬 <strong className="text-amber-900">Mensaje de la clienta:</strong> "{resolvingRow.feedback}"
                </div>
              )}
            </div>

            {manualFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold border ${
                manualFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {manualFeedback.msg}
              </div>
            )}

            <div className="space-y-3 pt-1">
              {/* Opción 1: Asignar nota */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-black text-slate-800 block">Opción 1: Asignar Nota & Despachar Recompensa</label>
                <div className="flex items-center gap-1.5">
                  {(['1', '2', '3', '4', '5'] as const).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setManualNota(n)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                        manualNota === n
                          ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {n} ⭐
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => handleAprobarManual(manualNota)}
                  disabled={manualLoading}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {manualLoading ? 'Procesando...' : `Confirmar Nota ${manualNota}⭐ y Despachar Sellos`}
                </button>
              </div>

              {/* Opción 2: Omitir y solo sellos */}
              <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2">
                <label className="text-xs font-black text-purple-900 block">Opción 2: Omitir Encuesta & Enviar Sellos Limpios</label>
                <p className="text-[11px] text-slate-500 font-medium">Acredita sus sellos de visita y manda la tarjeta Club Glow con la plantilla de cortesía (sin registrar nota falsa).</p>
                <button
                  type="button"
                  onClick={handleOmitirManual}
                  disabled={manualLoading}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {manualLoading ? 'Procesando...' : 'Acreditar Sellos y Enviar Tarjeta Club Glow'}
                </button>
              </div>

              {/* Opción 3: Descartar */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDescartarManual}
                  disabled={manualLoading}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Descartar sin enviar ningún mensaje
                </button>
                <button
                  type="button"
                  onClick={() => setResolvingRow(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
