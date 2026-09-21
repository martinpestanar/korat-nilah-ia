/**
 * ================================================================
 * GESTOR DE PLANTILLAS GLOBALES POR DEFECTO (Superadmin)
 * Permite modificar las plantillas de automatización maestras
 * y propagarlas con 1 clic a todos los negocios / salones del sistema.
 * ================================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Save, RefreshCw, Send, CheckCircle2, AlertTriangle,
  Copy, Sparkles, Filter, Check, Eye, Search, Layers, ChevronRight, HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  fetchPlantillasGlobales,
  sincronizarPlantillaGlobal,
  propagarTodasPlantillasGlobales,
  type PlantillaGlobal
} from '../../services/autopilot';

const CATEGORIAS_FILTRO = [
  { id: 'todos', label: 'Todos los Flujos', icon: '🌐' },
  { id: 'recordatorio', label: 'Recordatorios (24h / 3h)', icon: '⏰' },
  { id: 'fidelizacion', label: 'Fidelización & Premios', icon: '⭐' },
  { id: 'cuidados', label: 'Cuidados Post-Cita', icon: '✨' },
  { id: 'retoque', label: 'Retoques & Mantenimiento', icon: '💅' },
  { id: 'rescate', label: 'Rescate de Inactivas', icon: '🫀' },
];

const VARIABLES_DISPONIBLES: Record<string, { key: string; label: string; ejemplo: string }[]> = {
  recordatorio: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Camila' },
    { key: '{servicio}', label: 'Servicio', ejemplo: 'Lifting de Pestañas' },
    { key: '{fecha_cita}', label: 'Fecha Cita', ejemplo: 'Viernes 25 de Octubre' },
    { key: '{hora_cita}', label: 'Hora Cita', ejemplo: '04:30 PM' },
    { key: '{especialista}', label: 'Especialista', ejemplo: 'Paola' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ],
  fidelizacion: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Sofía' },
    { key: '{servicio}', label: 'Servicio', ejemplo: 'Manicura Rusa' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
    { key: '{puntos_ganados}', label: 'Puntos Ganados', ejemplo: '50' },
    { key: '{puntos_actuales}', label: 'Puntos Totales', ejemplo: '150' },
    { key: '{costo_premio}', label: 'Meta de Puntos', ejemplo: '200' },
    { key: '{premio_sugerido}', label: 'Premio Sugerido', ejemplo: 'Laminado de Cejas' },
  ],
  cuidados: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Mariana' },
    { key: '{dias_pasados}', label: 'Días Transcurridos', ejemplo: '4' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ],
  retoque: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Valeria' },
    { key: '{servicio}', label: 'Servicio', ejemplo: 'Set Acrílico' },
    { key: '{dias_pasados}', label: 'Días desde visita', ejemplo: '21' },
    { key: '{dia_preferido}', label: 'Día habitual', ejemplo: 'los sábados' },
    { key: '{turno_preferido}', label: 'Turno', ejemplo: 'por las tardes' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ],
  rescate: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Claudia' },
    { key: '{ultimo_servicio}', label: 'Último Servicio', ejemplo: 'Balayage' },
    { key: '{dias_sin_visita}', label: 'Días de Ausencia', ejemplo: '45' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ]
};

export const GodModePlantillasGlobales: React.FC = () => {
  const [plantillas, setPlantillas] = useState<PlantillaGlobal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Editor State
  const [editTitulo, setEditTitulo] = useState('');
  const [editContenido, setEditContenido] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [propagarATodos, setPropagarATodos] = useState(true);
  
  // Actions Feedback
  const [saving, setSaving] = useState(false);
  const [propagatingAll, setPropagatingAll] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; mensaje: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPlantillasGlobales();
      setPlantillas(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
        setEditTitulo(data[0].titulo);
        setEditContenido(data[0].contenido);
        setEditActivo(data[0].activo);
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', mensaje: e.message || 'Error cargando plantillas globales' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedPlantilla = useMemo(() => {
    return plantillas.find(p => p.id === selectedId) || null;
  }, [plantillas, selectedId]);

  useEffect(() => {
    if (selectedPlantilla) {
      setEditTitulo(selectedPlantilla.titulo);
      setEditContenido(selectedPlantilla.contenido);
      setEditActivo(selectedPlantilla.activo);
    }
  }, [selectedPlantilla]);

  // Filtrado
  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter(p => {
      const matchCat =
        filtroCategoria === 'todos' ? true :
        filtroCategoria === 'recordatorio' ? p.flujo.startsWith('recordatorio') :
        filtroCategoria === 'fidelizacion' ? p.flujo.startsWith('fidelizacion') :
        filtroCategoria === 'cuidados' ? p.flujo.startsWith('cuidados') :
        filtroCategoria === 'retoque' ? p.flujo.startsWith('retoque') :
        filtroCategoria === 'rescate' ? p.flujo.startsWith('rescate') : true;

      const matchSearch =
        searchQuery.trim() === '' ||
        p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.flujo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.contenido.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCat && matchSearch;
    });
  }, [plantillas, filtroCategoria, searchQuery]);

  const handleCopyVar = (v: string) => {
    navigator.clipboard.writeText(v);
    setCopiedVar(v);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleInsertVar = (v: string) => {
    setEditContenido(prev => prev + ' ' + v);
    setCopiedVar(v);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  const handleGuardar = async () => {
    if (!selectedPlantilla) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await sincronizarPlantillaGlobal({
        global_id: selectedPlantilla.id,
        titulo: editTitulo,
        contenido: editContenido,
        activo: editActivo,
        propagar_a_todos: propagarATodos
      });

      if (res.success) {
        setFeedback({
          tipo: 'success',
          mensaje: propagarATodos
            ? `✅ Plantilla guardada y propagada a ${res.actualizados_negocios} cuentas de negocio (+${res.insertados_negocios} nuevas).`
            : `✅ Plantilla global guardada sin modificar los salones.`
        });
        // Actualizar en el estado local
        setPlantillas(prev => prev.map(p => p.id === selectedPlantilla.id ? {
          ...p,
          titulo: editTitulo,
          contenido: editContenido,
          activo: editActivo
        } : p));
      } else {
        setFeedback({ tipo: 'error', mensaje: res.error || 'Error al guardar la plantilla' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', mensaje: e.message || 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const handlePropagarTodas = async () => {
    const confirm = window.confirm(
      '⚠️ ¿Estás seguro de sincronizar TODAS las plantillas globales por defecto a TODOS los salones del sistema?\n\nEsto sobrescribirá los textos de todas las cuentas registradas con las versiones maestras.'
    );
    if (!confirm) return;

    setPropagatingAll(true);
    setFeedback(null);
    try {
      const res = await propagarTodasPlantillasGlobales();
      if (res.success) {
        setFeedback({
          tipo: 'success',
          mensaje: `🚀 Sincronización masiva completada: ${res.total_plantillas_procesadas} plantillas maestras propagadas a todos los salones (${res.negocios_actualizados} registros actualizados, ${res.negocios_insertados} creados).`
        });
      } else {
        setFeedback({ tipo: 'error', mensaje: res.error || 'Error en propagación masiva' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', mensaje: e.message || 'Error de conexión' });
    } finally {
      setPropagatingAll(false);
    }
  };

  const catActualKey = useMemo(() => {
    if (!selectedPlantilla) return 'recordatorio';
    if (selectedPlantilla.flujo.startsWith('recordatorio')) return 'recordatorio';
    if (selectedPlantilla.flujo.startsWith('fidelizacion')) return 'fidelizacion';
    if (selectedPlantilla.flujo.startsWith('cuidados')) return 'cuidados';
    if (selectedPlantilla.flujo.startsWith('retoque')) return 'retoque';
    if (selectedPlantilla.flujo.startsWith('rescate')) return 'rescate';
    return 'recordatorio';
  }, [selectedPlantilla]);

  const varsDisponibles = VARIABLES_DISPONIBLES[catActualKey] || [];

  return (
    <div className="space-y-4">
      {/* ── Banner Superior Informativo ── */}
      <div className="bg-emerald-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              Plantillas Maestras de Automatización (Global Superadmin)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-200 mt-1 max-w-2xl">
            Edita los textos por defecto para cada uno de los flujos de n8n. Al guardar con la opción de propagación activada, se actualizarán automáticamente en <strong>todas las cuentas de salones activas</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-700 transition cursor-pointer"
            title="Recargar plantillas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePropagarTodas}
            disabled={propagatingAll || loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Layers className={`w-4 h-4 ${propagatingAll ? 'animate-spin' : ''}`} />
            {propagatingAll ? 'Propagando a todos...' : 'Propagar TODO a Salones'}
          </button>
        </div>
      </div>

      {/* ── Feedback Banner ── */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between border ${
          feedback.tipo === 'success'
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.tipo === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.mensaje}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-4">✕</button>
        </div>
      )}

      {/* ── Filtros y Categorías ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIAS_FILTRO.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                filtroCategoria === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título o contenido..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 transition"
          />
        </div>
      </div>

      {/* ── Grid Principal: Lista lateral + Editor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lista Lateral de Plantillas */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Plantillas ({plantillasFiltradas.length})
            </span>
            <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
              40 Maestras
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-600 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                Cargando plantillas...
              </div>
            ) : plantillasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-600">
                No hay plantillas que coincidan con la búsqueda.
              </div>
            ) : (
              plantillasFiltradas.map(p => {
                const isSelected = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      setFeedback(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-xs font-bold text-slate-800 truncate block">
                          {p.titulo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded">
                          {p.flujo}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {p.tiempo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-1 font-normal">
                        {p.contenido}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${isSelected ? 'text-emerald-700' : 'text-slate-300'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Editor Central / Vista Previa */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-[650px] overflow-y-auto">
          {selectedPlantilla ? (
            <div className="space-y-4">
              {/* Encabezado del Editor */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {selectedPlantilla.flujo}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      ⏱ {selectedPlantilla.tiempo}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {selectedPlantilla.titulo}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={editActivo}
                      onChange={e => setEditActivo(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Activa</span>
                  </label>
                </div>
              </div>

              {/* Título de la Plantilla */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Título Identificador
                </label>
                <input
                  type="text"
                  value={editTitulo}
                  onChange={e => setEditTitulo(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 font-semibold text-slate-800"
                />
              </div>

              {/* Variables de Reemplazo para Click / Copiar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Variables Dinámicas (Haz clic para insertar al final)
                  </span>
                  {copiedVar && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> ¡Insertado {copiedVar}!
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {varsDisponibles.map(v => (
                    <button
                      key={v.key}
                      onClick={() => handleInsertVar(v.key)}
                      title={`Ejemplo: "${v.ejemplo}". Clic para insertar en el texto.`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 transition cursor-pointer"
                    >
                      <span>{v.key}</span>
                      <span className="text-[10px] text-slate-600 font-sans font-normal">({v.label})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido / Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Contenido del Mensaje de WhatsApp
                  </label>
                  <span className="text-[11px] text-slate-600 font-mono">
                    {editContenido.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={editContenido}
                  onChange={e => setEditContenido(e.target.value)}
                  className="w-full p-3.5 text-sm font-sans bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 text-slate-800 leading-relaxed shadow-inner"
                  placeholder="Escribe aquí el texto que se enviará por WhatsApp..."
                />
              </div>

              {/* Preview Dinámica con Variables simuladas */}
              <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1.5 text-xs font-black text-emerald-900">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Vista Previa Simulada (WhatsApp)</span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                  {editContenido
                    .replace(/\{nombre_cliente\}/g, 'Camila')
                    .replace(/\{servicio\}/g, 'Lifting de Pestañas')
                    .replace(/\{fecha_cita\}/g, 'Mañana 29 de Agosto')
                    .replace(/\{hora_cita\}/g, '04:30 PM')
                    .replace(/\{especialista\}/g, 'Paola')
                    .replace(/\{nombre_negocio\}/g, 'Paola Chau Beauty')
                    .replace(/\{dias_pasados\}/g, '21')
                    .replace(/\{puntos_ganados\}/g, '50')
                    .replace(/\{puntos_actuales\}/g, '150')
                    .replace(/\{costo_premio\}/g, '200')
                    .replace(/\{premio_sugerido\}/g, 'Laminado de Cejas')
                    .replace(/\{tiempo_relativo\}/g, 'hoy')
                  }
                </p>
              </div>

              {/* Barra de Acciones y Propagación */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs font-black text-slate-800 cursor-pointer bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={propagarATodos}
                    onChange={e => setPropagarATodos(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Actualizar y propagar inmediatamente a todas las cuentas de salones</span>
                </label>

                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                  {saving ? 'Guardando...' : 'Guardar Plantilla'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-600">
              <FileText className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-bold">Selecciona una plantilla del listado para editar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GodModePlantillasGlobales;
