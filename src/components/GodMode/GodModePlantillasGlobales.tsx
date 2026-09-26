/**
 * ================================================================
 * GESTOR DE PLANTILLAS GLOBALES POR DEFECTO (Superadmin)
 * Permite modificar las plantillas de automatización maestras,
 * agregar nuevas variaciones a cualquier flujo y propagarlas
 * con 1 clic a todos los negocios / salones del sistema.
 * ================================================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText, Save, RefreshCw, CheckCircle2, AlertTriangle,
  Sparkles, Check, Eye, Search, Layers, ChevronRight,
  Plus, X, Copy
} from 'lucide-react';
import {
  fetchPlantillasGlobales,
  sincronizarPlantillaGlobal,
  crearPlantillaGlobal,
  propagarTodasPlantillasGlobales,
  type PlantillaGlobal
} from '../../services/autopilot';

// Categorías principales de automatización
const CATEGORIAS_FILTRO = [
  { id: 'todos', label: 'Todos los Flujos', icon: '🌐' },
  { id: 'fidelizacion', label: 'Calificación & Fidelización', icon: '⭐', badge: 'CSAT & Premios' },
  { id: 'cuidados', label: 'Cuidados Post-Servicio', icon: '✨', badge: '24h / 4d / 10d' },
  { id: 'recordatorio', label: 'Recordatorios Citas', icon: '⏰', badge: '24h / 3h' },
  { id: 'retoque', label: 'Retoques & Mantenimiento', icon: '💅', badge: '18-24 días' },
  { id: 'rescate', label: 'Rescate de Inactivas', icon: '🫀', badge: '45d / 75d / 120d' },
];

// Opciones disponibles de flujo al crear una nueva variación
const FLUJOS_DISPONIBLES = [
  // Calificación & Fidelización
  { flujo: 'fidelizacion_encuesta', tiempo: 'tiempo_1', categoria: 'fidelizacion', label: 'Fidelización — Etapa 1: Encuesta Calificación (1-5 ⭐)' },
  { flujo: 'fidelizacion_recompensa', tiempo: 'tiempo_2', categoria: 'fidelizacion', label: 'Fidelización — Etapa 2: Agradecimiento & Recompensa / Puntos' },
  { flujo: 'fidelizacion_queja', tiempo: 'tiempo_3', categoria: 'fidelizacion', label: 'Fidelización — Etapa 3: Recuperación de Quejas (1-3 ⭐)' },

  // Cuidados Post-Servicio
  { flujo: 'cuidados_24h', tiempo: 'tiempo_1', categoria: 'cuidados', label: 'Cuidados — Paso 1: Primeras 24 Horas (Sellado & Cuidados)' },
  { flujo: 'cuidados_dia4', tiempo: 'tiempo_2', categoria: 'cuidados', label: 'Cuidados — Paso 2: Día 4 (Check-in & Rutina)' },
  { flujo: 'cuidados_dia10', tiempo: 'tiempo_3', categoria: 'cuidados', label: 'Cuidados — Paso 3: Día 10 (Acompañamiento & Biología)' },

  // Recordatorios
  { flujo: 'recordatorio_24h', tiempo: 'tiempo_1', categoria: 'recordatorio', label: 'Recordatorio — 24 Horas Antes de la Cita' },
  { flujo: 'recordatorio_3h', tiempo: 'tiempo_2', categoria: 'recordatorio', label: 'Recordatorio — 3 Horas Antes de la Cita (Alerta Inmediata)' },

  // Retoques
  { flujo: 'retoque_mantenimiento', tiempo: 'tiempo_1', categoria: 'retoque', label: 'Retoque & Mantenimiento Preventivo (18-24 Días)' },

  // Rescate de Inactivas
  { flujo: 'rescate_inactivas_t1', tiempo: 'tiempo_1', categoria: 'rescate', label: 'Rescate de Inactivas — Fase 1 (45 Días sin visita)' },
  { flujo: 'rescate_inactivas_t2', tiempo: 'tiempo_2', categoria: 'rescate', label: 'Rescate de Inactivas — Fase 2 (75 Días sin visita)' },
  { flujo: 'rescate_inactivas_t3', tiempo: 'tiempo_3', categoria: 'rescate', label: 'Rescate de Inactivas — Fase 3 (120 Días sin visita)' },
];

// Sub-etapas especializadas para Fidelización
const SUB_ETAPAS_FIDELIZACION = [
  { id: 'todos', label: 'Todas las etapas', icon: '📋' },
  { id: 'fidelizacion_encuesta', label: 'Etapa 1: Encuesta Calificación (1-5 ⭐)', icon: '⭐', desc: 'Disparada 1-2h post-servicio' },
  { id: 'fidelizacion_recompensa', label: 'Etapa 2: Agradecimiento & Puntos', icon: '🎁', desc: 'Metas alcanzadas o progreso de puntos' },
  { id: 'fidelizacion_queja', label: 'Etapa 3: Recuperación de Quejas (1-3 ⭐)', icon: '🛡️', desc: 'Contención inmediata y contacto' },
];

// Sub-etapas especializadas para Cuidados Post-Servicio
const SUB_ETAPAS_CUIDADOS = [
  { id: 'todos', label: 'Todos los momentos', icon: '📋' },
  { id: 'cuidados_24h', label: 'Paso 1: Primeras 24 Horas', icon: '⏱️', desc: 'Sellado y cuidados críticos inmediatos' },
  { id: 'cuidados_dia4', label: 'Paso 2: Día 4 (Check-in & Rutina)', icon: '🧼', desc: 'Mantenimiento y peinado / cutículas' },
  { id: 'cuidados_dia10', label: 'Paso 3: Día 10 (Acompañamiento)', icon: '🌿', desc: 'Ciclo biológico y nutrición' },
];

// Variables disponibles contextuales por subflujo específico
const VARIABLES_POR_SUBFLUJO: Record<string, { key: string; label: string; ejemplo: string }[]> = {
  // Fidelización - Encuesta
  fidelizacion_encuesta: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Sofía' },
    { key: '{servicio}', label: 'Servicio', ejemplo: 'Manicura Rusa' },
    { key: '{especialista}', label: 'Especialista', ejemplo: 'Paola' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
    { key: '{tiempo_relativo}', label: 'Tiempo Relativo', ejemplo: 'hoy' },
  ],
  // Fidelización - Recompensa
  fidelizacion_recompensa: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Sofía' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
    { key: '{puntos_ganados}', label: 'Puntos Ganados', ejemplo: '50' },
    { key: '{puntos_actuales}', label: 'Puntos Totales', ejemplo: '150' },
    { key: '{costo_premio}', label: 'Meta de Puntos', ejemplo: '200' },
    { key: '{premio_sugerido}', label: 'Premio Sugerido', ejemplo: 'Laminado de Cejas' },
  ],
  // Fidelización - Queja / Reclamo
  fidelizacion_queja: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Sofía' },
    { key: '{servicio}', label: 'Servicio Realizado', ejemplo: 'Lifting de Pestañas' },
    { key: '{especialista}', label: 'Especialista', ejemplo: 'Paola' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ],
  // Cuidados Post-Servicio (24h, Día 4, Día 10)
  cuidados: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Mariana' },
    { key: '{servicio}', label: 'Servicio', ejemplo: 'Lifting de Pestañas' },
    { key: '{dias_pasados}', label: 'Días Transcurridos', ejemplo: '4' },
    { key: '{especialista}', label: 'Especialista', ejemplo: 'Paola' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ],
  // Recordatorios
  recordatorio: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Camila' },
    { key: '{servicio}', label: 'Servicio', ejemplo: 'Lifting de Pestañas' },
    { key: '{fecha_cita}', label: 'Fecha Cita', ejemplo: 'Viernes 25 de Octubre' },
    { key: '{hora_cita}', label: 'Hora Cita', ejemplo: '04:30 PM' },
    { key: '{especialista}', label: 'Especialista', ejemplo: 'Paola' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ],
  // Retoque
  retoque: [
    { key: '{nombre_cliente}', label: 'Nombre del Cliente', ejemplo: 'Valeria' },
    { key: '{servicio}', label: 'Servicio', ejemplo: 'Set Acrílico' },
    { key: '{dias_pasados}', label: 'Días desde visita', ejemplo: '21' },
    { key: '{dia_preferido}', label: 'Día habitual', ejemplo: 'los sábados' },
    { key: '{turno_preferido}', label: 'Turno', ejemplo: 'por las tardes' },
    { key: '{nombre_negocio}', label: 'Nombre del Salón', ejemplo: 'Paola Chau Beauty' },
  ],
  // Rescate
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
  const [filtroCategoria, setFiltroCategoria] = useState<string>('fidelizacion');
  const [subFiltro, setSubFiltro] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Editor State
  const [editTitulo, setEditTitulo] = useState('');
  const [editContenido, setEditContenido] = useState('');
  const [editActivo, setEditActivo] = useState(true);
  const [propagarATodos, setPropagarATodos] = useState(true);
  
  // Modal Nueva Variación State
  const [modalNuevaOpen, setModalNuevaOpen] = useState(false);
  const [nuevaFlujoKey, setNuevaFlujoKey] = useState<string>('fidelizacion_encuesta');
  const [nuevaTitulo, setNuevaTitulo] = useState('');
  const [nuevaContenido, setNuevaContenido] = useState('');
  const [nuevaCategoriaServicio, setNuevaCategoriaServicio] = useState('');
  const [nuevaPropagar, setNuevaPropagar] = useState(true);
  const [creating, setCreating] = useState(false);

  // Feedback & Actions
  const [saving, setSaving] = useState(false);
  const [propagatingAll, setPropagatingAll] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; mensaje: string } | null>(null);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  const loadData = async (preserveSelectedId?: string) => {
    setLoading(true);
    try {
      const data = await fetchPlantillasGlobales();
      setPlantillas(data);
      if (data.length > 0) {
        const targetId = preserveSelectedId || selectedId;
        const exists = targetId ? data.find(p => p.id === targetId) : null;
        if (exists) {
          setSelectedId(exists.id);
          setEditTitulo(exists.titulo);
          setEditContenido(exists.contenido);
          setEditActivo(exists.activo);
        } else {
          const initial = data.find(p => p.flujo.startsWith('fidelizacion')) || data[0];
          setSelectedId(initial.id);
          setEditTitulo(initial.titulo);
          setEditContenido(initial.contenido);
          setEditActivo(initial.activo);
        }
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

  // Al cambiar la categoría principal, reiniciar subfiltro
  const handleCambioCategoria = (catId: string) => {
    setFiltroCategoria(catId);
    setSubFiltro('todos');
  };

  // Filtrado de plantillas
  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter(p => {
      // 1. Filtro por categoría principal
      let matchCat = true;
      if (filtroCategoria === 'recordatorio') matchCat = p.flujo.startsWith('recordatorio');
      else if (filtroCategoria === 'fidelizacion') matchCat = p.flujo.startsWith('fidelizacion');
      else if (filtroCategoria === 'cuidados') matchCat = p.flujo.startsWith('cuidados');
      else if (filtroCategoria === 'retoque') matchCat = p.flujo.startsWith('retoque');
      else if (filtroCategoria === 'rescate') matchCat = p.flujo.startsWith('rescate');

      if (!matchCat) return false;

      // 2. Sub-filtro si aplica
      if (subFiltro !== 'todos') {
        if (p.flujo !== subFiltro) return false;
      }

      // 3. Búsqueda de texto libre
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const inTitulo = p.titulo.toLowerCase().includes(query);
        const inFlujo = p.flujo.toLowerCase().includes(query);
        const inContenido = p.contenido.toLowerCase().includes(query);
        if (!inTitulo && !inFlujo && !inContenido) return false;
      }

      return true;
    });
  }, [plantillas, filtroCategoria, subFiltro, searchQuery]);

  // Agrupamiento por etapa / sección para la lista lateral
  const gruposPlantillas = useMemo(() => {
    const grupos: { titulo: string; icono: string; badge: string; items: PlantillaGlobal[] }[] = [];

    if (filtroCategoria === 'fidelizacion') {
      const encuestas = plantillasFiltradas.filter(p => p.flujo === 'fidelizacion_encuesta');
      const recompensas = plantillasFiltradas.filter(p => p.flujo === 'fidelizacion_recompensa');
      const quejas = plantillasFiltradas.filter(p => p.flujo === 'fidelizacion_queja');

      if (encuestas.length > 0) {
        grupos.push({
          titulo: 'Etapa 1: Calificación Inicial (1 a 5 ⭐)',
          icono: '⭐',
          badge: 'Disparo 1-2h',
          items: encuestas
        });
      }
      if (recompensas.length > 0) {
        grupos.push({
          titulo: 'Etapa 2: Agradecimiento & Recompensa / Puntos',
          icono: '🎁',
          badge: 'Meta / Puntos',
          items: recompensas
        });
      }
      if (quejas.length > 0) {
        grupos.push({
          titulo: 'Etapa 3: Recuperación de Quejas (1 a 3 ⭐)',
          icono: '🛡️',
          badge: 'Alerta Roja',
          items: quejas
        });
      }
    } else if (filtroCategoria === 'cuidados') {
      const p24h = plantillasFiltradas.filter(p => p.flujo === 'cuidados_24h');
      const pdia4 = plantillasFiltradas.filter(p => p.flujo === 'cuidados_dia4');
      const pdia10 = plantillasFiltradas.filter(p => p.flujo === 'cuidados_dia10');

      if (p24h.length > 0) {
        grupos.push({
          titulo: 'Paso 1: Primeras 24 Horas (Sellado & Cuidados)',
          icono: '⏱️',
          badge: '24 Horas',
          items: p24h
        });
      }
      if (pdia4.length > 0) {
        grupos.push({
          titulo: 'Paso 2: Día 4 (Check-in & Rutina de Limpieza)',
          icono: '🧼',
          badge: 'Día 4',
          items: pdia4
        });
      }
      if (pdia10.length > 0) {
        grupos.push({
          titulo: 'Paso 3: Día 10 (Acompañamiento & Biología)',
          icono: '🌿',
          badge: 'Día 10',
          items: pdia10
        });
      }
    } else {
      // Otros flujos o vista 'todos': agrupar por flujo
      const flujosMap = new Map<string, PlantillaGlobal[]>();
      plantillasFiltradas.forEach(p => {
        const arr = flujosMap.get(p.flujo) || [];
        arr.push(p);
        flujosMap.set(p.flujo, arr);
      });

      flujosMap.forEach((items, flujoKey) => {
        let titulo = flujoKey;
        let icono = '📁';
        if (flujoKey.startsWith('recordatorio_24h')) { titulo = 'Recordatorio Cita (24 Horas Antes)'; icono = '⏰'; }
        else if (flujoKey.startsWith('recordatorio_3h')) { titulo = 'Recordatorio Cita (3 Horas Antes - Alerta)'; icono = '⚡'; }
        else if (flujoKey.startsWith('retoque')) { titulo = 'Retoque & Mantenimiento (18-24 Días)'; icono = '💅'; }
        else if (flujoKey.startsWith('rescate')) { titulo = 'Rescate de Inactivas (45d / 75d / 120d)'; icono = '🫀'; }

        grupos.push({
          titulo,
          icono,
          badge: `${items.length} var.`,
          items
        });
      });
    }

    return grupos;
  }, [plantillasFiltradas, filtroCategoria]);

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

  // Abrir modal de nueva variación con flujo predeterminado
  const handleOpenModalNueva = () => {
    // Si estamos en un filtro específico, pre-seleccionar un flujo correspondiente
    if (filtroCategoria === 'fidelizacion') {
      setNuevaFlujoKey(subFiltro !== 'todos' ? subFiltro : 'fidelizacion_encuesta');
    } else if (filtroCategoria === 'cuidados') {
      setNuevaFlujoKey(subFiltro !== 'todos' ? subFiltro : 'cuidados_24h');
    } else if (filtroCategoria === 'recordatorio') {
      setNuevaFlujoKey('recordatorio_24h');
    } else if (filtroCategoria === 'retoque') {
      setNuevaFlujoKey('retoque_mantenimiento');
    } else if (filtroCategoria === 'rescate') {
      setNuevaFlujoKey('rescate_inactivas_t1');
    } else {
      setNuevaFlujoKey('fidelizacion_encuesta');
    }

    setNuevaTitulo('');
    setNuevaContenido('');
    setNuevaCategoriaServicio('');
    setNuevaPropagar(true);
    setModalNuevaOpen(true);
  };

  const handleCrearNuevaVariacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTitulo.trim() || !nuevaContenido.trim()) {
      alert('Por favor completa el título y el contenido de la variación.');
      return;
    }

    const cfgFlujo = FLUJOS_DISPONIBLES.find(f => f.flujo === nuevaFlujoKey) || {
      flujo: nuevaFlujoKey,
      tiempo: 'tiempo_1',
      categoria: 'fidelizacion'
    };

    setCreating(true);
    setFeedback(null);
    try {
      const res = await crearPlantillaGlobal({
        flujo: cfgFlujo.flujo,
        tiempo: cfgFlujo.tiempo,
        titulo: nuevaTitulo.trim(),
        contenido: nuevaContenido.trim(),
        categoria_servicio: nuevaCategoriaServicio.trim() || null,
        activo: true,
        propagar_a_todos: nuevaPropagar
      });

      if (res.success && res.global_id) {
        setModalNuevaOpen(false);
        setFeedback({
          tipo: 'success',
          mensaje: nuevaPropagar
            ? `🎉 ¡Nueva variación "${nuevaTitulo}" creada y propagada exitosamente a ${res.insertados_negocios} salones!`
            : `🎉 ¡Nueva variación "${nuevaTitulo}" agregada a las plantillas maestras globales!`
        });

        // Asegurar que la categoría del filtro coincida para verla de inmediato
        if (cfgFlujo.categoria) {
          setFiltroCategoria(cfgFlujo.categoria);
          setSubFiltro('todos');
        }

        await loadData(res.global_id);
      } else {
        setFeedback({ tipo: 'error', mensaje: res.error || 'No se pudo crear la variación' });
      }
    } catch (e: any) {
      setFeedback({ tipo: 'error', mensaje: e.message || 'Error de conexión al crear variación' });
    } finally {
      setCreating(false);
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

  // Determinar conjunto exacto de variables disponibles
  const varsDisponibles = useMemo(() => {
    if (!selectedPlantilla) return VARIABLES_POR_SUBFLUJO.fidelizacion_encuesta;
    const flujo = selectedPlantilla.flujo;

    if (VARIABLES_POR_SUBFLUJO[flujo]) {
      return VARIABLES_POR_SUBFLUJO[flujo];
    }
    if (flujo.startsWith('cuidados')) {
      return VARIABLES_POR_SUBFLUJO.cuidados;
    }
    if (flujo.startsWith('recordatorio')) {
      return VARIABLES_POR_SUBFLUJO.recordatorio;
    }
    if (flujo.startsWith('retoque')) {
      return VARIABLES_POR_SUBFLUJO.retoque;
    }
    if (flujo.startsWith('rescate')) {
      return VARIABLES_POR_SUBFLUJO.rescate;
    }
    return VARIABLES_POR_SUBFLUJO.fidelizacion_encuesta;
  }, [selectedPlantilla]);

  return (
    <div className="space-y-4">
      {/* ── Banner Superior Informativo ── */}
      <div className="bg-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-emerald-100">
              Plantillas Maestras de Automatización (Global Superadmin)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-300/90 mt-1 max-w-2xl leading-relaxed">
            Gestiona o agrega nuevas variaciones de mensajes para cualquier automatización. Al propagar, se sincronizan instantáneamente en todas las cuentas de salones.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={handleOpenModalNueva}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer"
            title="Crear una nueva variación de plantilla para cualquier flujo"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Agregar Variación</span>
          </button>

          <button
            onClick={() => loadData()}
            disabled={loading}
            className="p-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/80 transition cursor-pointer"
            title="Recargar plantillas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePropagarTodas}
            disabled={propagatingAll || loading}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-black rounded-xl text-xs border border-emerald-800 shadow-md transition cursor-pointer"
          >
            <Layers className={`w-4 h-4 ${propagatingAll ? 'animate-spin' : ''}`} />
            {propagatingAll ? 'Propagando a todos...' : 'Propagar TODO'}
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

      {/* ── Filtros Principales (Sub-módulos Claramente Separados) ── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Fila 1: Pestañas de Automatización */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIAS_FILTRO.map(cat => {
              const isSelected = filtroCategoria === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCambioCategoria(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  {cat.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isSelected ? 'bg-emerald-700/60 text-emerald-100' : 'bg-slate-200/80 text-slate-500'
                    }`}>
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar variación o texto..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 transition"
            />
          </div>
        </div>

        {/* Fila 2: Sub-Filtros / Etapas específicas (Si es Fidelización o Cuidados) */}
        {filtroCategoria === 'fidelizacion' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex-shrink-0">
              Etapas del Flujo:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SUB_ETAPAS_FIDELIZACION.map(etapa => (
                <button
                  key={etapa.id}
                  onClick={() => setSubFiltro(etapa.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    subFiltro === etapa.id
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title={etapa.desc}
                >
                  <span>{etapa.icon}</span>
                  <span>{etapa.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {filtroCategoria === 'cuidados' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex-shrink-0">
              Momentos de Cuidado:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SUB_ETAPAS_CUIDADOS.map(etapa => (
                <button
                  key={etapa.id}
                  onClick={() => setSubFiltro(etapa.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    subFiltro === etapa.id
                      ? 'bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title={etapa.desc}
                >
                  <span>{etapa.icon}</span>
                  <span>{etapa.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Grid Principal: Lista lateral Agrupada + Editor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Lista Lateral de Plantillas Agrupada por Etapas */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex flex-col h-[700px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Variaciones ({plantillasFiltradas.length})
            </span>
            <button
              onClick={handleOpenModalNueva}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-black bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition cursor-pointer"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
              <span>Nueva Variación</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                Cargando plantillas...
              </div>
            ) : plantillasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-3">
                <p>No hay plantillas que coincidan con la búsqueda o etapa seleccionada.</p>
                <button
                  onClick={handleOpenModalNueva}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-500 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Variación aquí</span>
                </button>
              </div>
            ) : (
              gruposPlantillas.map((grupo, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  {/* Encabezado del Grupo / Etapa */}
                  <div className="flex items-center justify-between bg-slate-50/90 px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{grupo.icono}</span>
                      <span className="text-[11px] font-black text-slate-700 truncate">
                        {grupo.titulo}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200 flex-shrink-0">
                      {grupo.badge}
                    </span>
                  </div>

                  {/* Tarjetas de Variaciones */}
                  <div className="space-y-1">
                    {grupo.items.map(p => {
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
                              ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs ring-1 ring-emerald-400/40'
                              : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  p.activo ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                                title={p.activo ? 'Plantilla activa' : 'Plantilla inactiva'}
                              />
                              <span className="text-xs font-bold text-slate-900 truncate block">
                                {p.titulo}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                                {p.flujo}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {p.tiempo}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-600 line-clamp-1 mt-1 font-normal">
                              {p.contenido}
                            </p>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 flex-shrink-0 mt-1 ${
                              isSelected ? 'text-emerald-700' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Editor Central / Vista Previa */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between h-[700px] overflow-y-auto">
          {selectedPlantilla ? (
            <div className="space-y-4">
              {/* Encabezado del Editor */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {selectedPlantilla.flujo}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      ⏱ {selectedPlantilla.tiempo}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {selectedPlantilla.titulo}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 transition">
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
                  Título Identificador de la Variación
                </label>
                <input
                  type="text"
                  value={editTitulo}
                  onChange={e => setEditTitulo(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 font-semibold text-slate-800"
                />
              </div>

              {/* Variables de Reemplazo Contextuales */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Variables Aplicables a este Mensaje (Clic para insertar)
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
                      <span className="text-[10px] text-slate-500 font-sans font-normal">({v.label})</span>
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
                  <span className="text-[11px] text-slate-500 font-mono">
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
                <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans bg-white p-3 rounded-lg border border-emerald-100 shadow-2xs">
                  {editContenido
                    .replace(/\{nombre_cliente\}/g, 'Camila')
                    .replace(/\{servicio\}/g, 'Lifting de Pestañas')
                    .replace(/\{fecha_cita\}/g, 'Mañana 29 de Agosto')
                    .replace(/\{hora_cita\}/g, '04:30 PM')
                    .replace(/\{especialista\}/g, 'Paola')
                    .replace(/\{nombre_negocio\}/g, 'Paola Chau Beauty')
                    .replace(/\{dias_pasados\}/g, '4')
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
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-bold">Selecciona una plantilla del listado para editar</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Crear Nueva Variación ── */}
      {modalNuevaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Nueva Variación de Mensaje
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea una plantilla maestra para cualquier flujo de automatización.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNuevaOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearNuevaVariacion} className="space-y-4">
              {/* Selector de Flujo y Etapa */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Flujo y Etapa de Automatización
                </label>
                <select
                  value={nuevaFlujoKey}
                  onChange={e => setNuevaFlujoKey(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 font-bold text-slate-800"
                >
                  {FLUJOS_DISPONIBLES.map(f => (
                    <option key={f.flujo} value={f.flujo}>
                      {f.label} ({f.tiempo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Título Identificador */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Título de la Variación (Ej: "Variación 4 — Enfoque Amistoso" o "Pestañas — Tip Sellado C")
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Variación 4 — Confirmación Exclusiva..."
                  value={nuevaTitulo}
                  onChange={e => setNuevaTitulo(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 font-semibold text-slate-800"
                />
              </div>

              {/* Categoría de Servicio Opcional (para cuidados o retoques) */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Categoría de Servicio (Opcional, ej: "Pestañas", "Uñas", "Alisados")
                </label>
                <input
                  type="text"
                  placeholder="Dejar vacío si aplica para todos los servicios"
                  value={nuevaCategoriaServicio}
                  onChange={e => setNuevaCategoriaServicio(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 font-medium text-slate-800"
                />
              </div>

              {/* Contenido WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Contenido del Mensaje de WhatsApp
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {nuevaContenido.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={6}
                  required
                  value={nuevaContenido}
                  onChange={e => setNuevaContenido(e.target.value)}
                  placeholder="¡Hola {nombre_cliente}! Te recordamos tu cita de {servicio} mañana en {nombre_negocio}..."
                  className="w-full p-3 text-xs font-sans bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-500 text-slate-800 leading-relaxed"
                />
              </div>

              {/* Checkbox de Propagar inmediatamente */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-bold text-emerald-950 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nuevaPropagar}
                  onChange={e => setNuevaPropagar(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 w-4 h-4"
                />
                <div>
                  <span>Propagar inmediatamente a todos los salones registrados</span>
                  <p className="text-[11px] font-normal text-emerald-800 mt-0.5">
                    Se insertará esta variación en el panel de todos los clientes activos del sistema.
                  </p>
                </div>
              </label>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevaOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  <Plus className={`w-4 h-4 ${creating ? 'animate-spin' : ''}`} />
                  {creating ? 'Guardando...' : 'Crear y Guardar Variación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GodModePlantillasGlobales;
