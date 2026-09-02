import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Star, Bell, Clock, Gift, HeartHandshake, Sparkles,
  CheckCircle2, Plus, Edit3, Trash2, Smartphone, Copy, Check,
  AlertCircle, ShieldCheck, HelpCircle, Save, Loader2, ArrowRight,
  SlidersHorizontal, ToggleLeft, ToggleRight, MessageSquare, RefreshCw,
  Send, X, Info, Lock, Crown
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { BottomSheet } from '../components/UI/BottomSheet';
import { ProUpgradeModal, TriggerContext } from '../components/UI/ProUpgradeModal';

// Tipos de Flujo
export type FlujoId = 'fidelizacion' | 'recordatorios' | 'retoques' | 'cumpleanos' | 'rescate';

export interface FlujoInfo {
  id: FlujoId;
  nombre: string;
  subtitulo: string;
  tag: string;
  icon: any;
  tiempo1Nombre: string;
  tiempo1FlujoKey: string;
  tiempo2Nombre?: string;
  tiempo2FlujoKey?: string;
  tiempo3Nombre?: string;
  tiempo3FlujoKey?: string;
  variables: { key: string; label: string; ejemplo: string }[];
  descripcion: string;
  frecuencia: string;
  tooltips?: Record<string, string>;
}

export interface PlantillaItem {
  id: string;
  business_id: string;
  flujo: string;
  tiempo: string;
  titulo: string;
  contenido: string;
  activo: boolean;
  es_default: boolean;
  servicio_regla_id?: number | null;
}

const FLUJOS_CATALOGO: FlujoInfo[] = [
  {
    id: 'fidelizacion',
    nombre: 'Calificación & Premios',
    subtitulo: 'Feedback post-cita + Sistema de puntos',
    tag: 'Fidelización',
    icon: Star,
    tiempo1Nombre: '1. Encuesta (1 a 5)',
    tiempo1FlujoKey: 'fidelizacion_encuesta',
    tiempo2Nombre: '2. Puntos & Premios (4-5 ⭐)',
    tiempo2FlujoKey: 'fidelizacion_recompensa',
    tiempo3Nombre: '3. Recuperación Quejas (1-3 ⭐)',
    tiempo3FlujoKey: 'fidelizacion_queja',
    frecuencia: '1.5h después de terminar la cita',
    descripcion: 'Pide una nota del 1 al 5. Si es 4-5 entrega puntos y premio afín; si es 1-3 envía mensaje empático humano y pausa el bot para la recepcionista.',
    variables: [
      { key: '{nombre_cliente}', label: 'Nombre', ejemplo: 'Sofia' },
      { key: '{servicio}', label: 'Servicio', ejemplo: 'Lifting de Pestañas' },
      { key: '{nombre_negocio}', label: 'Salón', ejemplo: 'Paola Chau Beauty' },
      { key: '{tiempo_relativo}', label: 'Hoy / Ayer', ejemplo: 'hoy' },
      { key: '{puntos_ganados}', label: 'Pts Ganados', ejemplo: '+10' },
      { key: '{puntos_actuales}', label: 'Pts Totales', ejemplo: '120' },
      { key: '{costo_premio}', label: 'Meta Premio', ejemplo: '250' },
      { key: '{premio_sugerido}', label: 'Premio Afín', ejemplo: 'Laminado de Cejas' }
    ]
  },
  {
    id: 'recordatorios',
    nombre: 'Recordatorio Anti No-Show',
    subtitulo: 'Confirmación 24h y aviso 3h antes',
    tag: 'Puntualidad',
    icon: Bell,
    tiempo1Nombre: 'Tiempo 1: Recordatorio 24h antes',
    tiempo1FlujoKey: 'recordatorio_24h',
    tiempo2Nombre: 'Tiempo 2: Alerta 3h antes',
    tiempo2FlujoKey: 'recordatorio_3h',
    frecuencia: 'Automático 24 horas y 3 horas antes',
    descripcion: 'Reduce inasistencias recordando la cita con fecha, hora, especialista y link de confirmación/reprogramación.',
    variables: [
      { key: '{nombre_cliente}', label: 'Nombre', ejemplo: 'Camila' },
      { key: '{servicio}', label: 'Servicio', ejemplo: 'Uñas Acrílicas' },
      { key: '{fecha_cita}', label: 'Fecha', ejemplo: 'Mañana 29 de Agosto' },
      { key: '{hora_cita}', label: 'Hora', ejemplo: '04:30 PM' },
      { key: '{especialista}', label: 'Especialista', ejemplo: 'Paola' },
      { key: '{nombre_negocio}', label: 'Salón', ejemplo: 'Paola Chau Beauty' }
    ]
  },
  {
    id: 'retoques',
    nombre: 'Retoque & Mantenimiento',
    subtitulo: 'Aviso a los 20 días para cuidar su servicio',
    tag: 'Recurrencia',
    icon: Sparkles,
    tiempo1Nombre: 'Mensaje de Mantenimiento Sugerido',
    tiempo1FlujoKey: 'retoque_mantenimiento',
    frecuencia: 'A los 20 - 25 días de su última visita',
    descripcion: 'Fomenta la recurrencia avisando que es momento del retoque de uñas, pestañas o raíz para mantener el resultado impecable.',
    variables: [
      { key: '{nombre_cliente}', label: 'Nombre', ejemplo: 'Valeria' },
      { key: '{servicio}', label: 'Servicio', ejemplo: 'Set de Acrílicas' },
      { key: '{dias_pasados}', label: 'Días Pasados', ejemplo: '21' },
      { key: '{dia_preferido}', label: 'Día Favorito', ejemplo: 'los sábados' },
      { key: '{turno_preferido}', label: 'Turno', ejemplo: 'por las tardes' },
      { key: '{horario_preferido}', label: 'Horario Habitual', ejemplo: 'los sábados por las tardes' },
      { key: '{nombre_negocio}', label: 'Salón', ejemplo: 'Paola Chau Beauty' }
    ]
  },
  {
    id: 'cumpleanos',
    nombre: 'Cumpleaños & Regalo',
    subtitulo: 'Felicítala en su día con un detalle',
    tag: 'Fidelidad VIP',
    icon: Gift,
    tiempo1Nombre: 'Mensaje de Felicitación con Bono',
    tiempo1FlujoKey: 'cumpleanos',
    frecuencia: 'El día de su cumpleaños a las 09:00 AM',
    descripcion: 'Genera amor por la marca regalándole puntos extra, descuento o un tratamiento express en su semana de cumpleaños.',
    variables: [
      { key: '{nombre_cliente}', label: 'Nombre', ejemplo: 'Luciana' },
      { key: '{regalo_cumple}', label: 'Regalo', ejemplo: '+50 Pts de Regalo' },
      { key: '{nombre_negocio}', label: 'Salón', ejemplo: 'Paola Chau Beauty' }
    ]
  },
  {
    id: 'rescate',
    nombre: 'Rescate de Inactivas',
    subtitulo: 'Reactivación progresiva a los 45, 75 y 120 días',
    tag: 'Reactivación',
    icon: HeartHandshake,
    tiempo1Nombre: '🌸 Etapa 1 — 45 días (Tono Cálido)',
    tiempo1FlujoKey: 'rescate_45d',
    tiempo2Nombre: '🎁 Etapa 2 — 75 días (Incentivo Real)',
    tiempo2FlujoKey: 'rescate_75d',
    tiempo3Nombre: '⚡ Etapa 3 — 120 días (Última Oportunidad)',
    tiempo3FlujoKey: 'rescate_120d',
    frecuencia: 'Diario 11:30 AM · Clientas sin visita desde los 45 días',
    descripcion: 'Sistema progresivo de reactivación: cercanía a los 45 días, incentivo real a los 75 días, y oferta exclusiva a los 120 días. Si no responde al último intento, se pausa su marketing para no saturarla.',
    variables: [
      { key: '{nombre_cliente}', label: 'Nombre', ejemplo: 'Mariana' },
      { key: '{ultimo_servicio}', label: 'Último Servicio', ejemplo: 'Balayage' },
      { key: '{dias_sin_visita}', label: 'Días Ausente', ejemplo: '78' },
      { key: '{nombre_negocio}', label: 'Salón', ejemplo: 'Paola Chau Beauty' }
    ],
    tooltips: {
      'rescate_45d': 'Tono empático y cercano. NO incluyas descuentos aquí — aún no los necesita. Solo hazle saber que la extrañas y que la esperas. Ej: "¿Cómo ha estado tu balayage? Ya son 45 días y queremos que estés impecable 🌸"',
      'rescate_75d': 'Aquí sí vale un incentivo concreto: un extra gratuito (crema hidratante, brillo de puntas, mascarilla express) o un pequeño upgrade incluido. Que sienta que viene a algo especial, no a un descuento genérico.',
      'rescate_120d': 'Última oportunidad. Puedes usar un cupón de descuento real (10-20%), acceso a un servicio premium, o una propuesta de paquete especial. Si no responde en 15 días, el sistema la marcará como inactiva automáticamente para no molestarla más.'
    }
  }
];

export interface ReglaRetoqueItem {
  id: number;
  business_id: string;
  servicio: string;
  keywords: string;
  dias_min: number;
  dias_max: number;
  activo: boolean;
}

const Automatizaciones: React.FC = () => {
  const { user, isPro } = useAuth();
  const businessId = user?.business_id || localStorage.getItem('korat_business_id') || '';

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState<TriggerContext>('recordatorios_whatsapp');

  const [flujoActivo, setFlujoActivo] = useState<FlujoId>('fidelizacion');
  const [tiempoSeleccionado, setTiempoSeleccionado] = useState<string>('tiempo_1');
  const [subPestanaRetoque, setSubPestanaRetoque] = useState<'copys' | 'reglas'>('copys');
  const [plantillas, setPlantillas] = useState<PlantillaItem[]>([]);
  const [reglasRetoque, setReglasRetoque] = useState<ReglaRetoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReglas, setLoadingReglas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoRoiStats, setAutoRoiStats] = useState<any>(null);
  const [loadingRoi, setLoadingRoi] = useState(false);
  const [flujosConfig, setFlujosConfig] = useState<Record<string, boolean>>({
    fidelizacion: true,
    recordatorios: true,
    retoques: true,
    cumpleanos: true,
    rescate: true
  });
  const [savingFlujoState, setSavingFlujoState] = useState(false);

  // Cargar Configuración de Flujos Activos desde negocios
  const loadFlujosConfig = async () => {
    if (!businessId) return;
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select('bot_config, recursos_saas')
        .eq('id', businessId)
        .maybeSingle();

      if (!error && data) {
        const botConfig = (data.bot_config as any) || {};
        const saas = (data.recursos_saas as any) || {};
        const savedFlujos = botConfig.flujos_activos || {};
        const autoSaas = saas.automatizaciones || {};

        setFlujosConfig({
          fidelizacion: savedFlujos.fidelizacion ?? autoSaas.post_cita_activo ?? true,
          recordatorios: savedFlujos.recordatorios ?? autoSaas.recordatorios_activos ?? true,
          retoques: savedFlujos.retoques ?? autoSaas.mantenimiento_activo ?? true,
          cumpleanos: savedFlujos.cumpleanos ?? true,
          rescate: savedFlujos.rescate ?? autoSaas.rescate_activo ?? true
        });
      }
    } catch (err) {
      console.warn('Error cargando configuración de flujos:', err);
    }
  };

  // Guardar cambio de estado de un flujo en la base de datos
  const toggleFlujoActivo = async (flujoId: string) => {
    if (!businessId || savingFlujoState) return;
    const nuevoValor = !flujosConfig[flujoId];
    const nuevaConfig = { ...flujosConfig, [flujoId]: nuevoValor };
    
    // Optimistic update
    setFlujosConfig(nuevaConfig);
    setSavingFlujoState(true);

    try {
      const { data: negData } = await supabase
        .from('negocios')
        .select('bot_config, recursos_saas')
        .eq('id', businessId)
        .maybeSingle();

      const botConfig = (negData?.bot_config as any) || {};
      const updatedBotConfig = {
        ...botConfig,
        flujos_activos: nuevaConfig
      };

      const recursosSaas = (negData?.recursos_saas as any) || {};
      const automatizaciones = recursosSaas.automatizaciones || {};
      const updatedAutomatizaciones = {
        ...automatizaciones,
        post_cita_activo: nuevaConfig.fidelizacion,
        recordatorios_activos: nuevaConfig.recordatorios,
        mantenimiento_activo: nuevaConfig.retoques,
        rescate_activo: nuevaConfig.rescate
      };

      const { error } = await supabase
        .from('negocios')
        .update({
          bot_config: updatedBotConfig,
          recursos_saas: {
            ...recursosSaas,
            automatizaciones: updatedAutomatizaciones
          }
        })
        .eq('id', businessId);

      if (error) {
        console.error('Error guardando estado del flujo:', error);
        // Rollback on error
        setFlujosConfig(flujosConfig);
      }
    } catch (err) {
      console.error('Error al actualizar estado del flujo:', err);
      setFlujosConfig(flujosConfig);
    } finally {
      setSavingFlujoState(false);
    }
  };

  // Cargar Métricas de Conversión y ROI de Automatizaciones
  const loadAutoRoi = async () => {
    if (!businessId) return;
    setLoadingRoi(true);
    try {
      const { data, error } = await supabase.rpc('get_marketing_roi_stats', {
        p_business_id: businessId,
        p_filtro_rango: 'mes'
      });
      if (!error && data) {
        setAutoRoiStats(data);
      }
    } catch (err) {
      console.warn('Error al cargar ROI de automatizaciones:', err);
    } finally {
      setLoadingRoi(false);
    }
  };

  // Modal / BottomSheet de Edición & Vista Previa de Copys
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState<PlantillaItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState<{ titulo: string; contenido: string; servicio_regla_id: number | string }>({
    titulo: '',
    contenido: '',
    servicio_regla_id: ''
  });
  const [copiedVar, setCopiedVar] = useState<string | null>(null);

  // Modal / BottomSheet de Reglas de Retoque
  const [isReglaModalOpen, setIsReglaModalOpen] = useState(false);
  const [editingRegla, setEditingRegla] = useState<ReglaRetoqueItem | null>(null);
  const [formRegla, setFormRegla] = useState({
    servicio: '',
    keywords: '',
    dias_min: 18,
    dias_max: 24,
    activo: true
  });

  // Cargar Reglas de Retoque desde configuracion_recordatorios
  const loadReglasRetoque = async () => {
    if (!businessId) return;
    setLoadingReglas(true);
    try {
      const { data, error } = await supabase
        .from('configuracion_recordatorios')
        .select('*')
        .eq('business_id', businessId)
        .order('id', { ascending: true });

      if (!error && data) {
        setReglasRetoque(data as ReglaRetoqueItem[]);
      }
    } catch (err) {
      console.error('Error cargando reglas de retoque:', err);
    } finally {
      setLoadingReglas(false);
    }
  };

  // Cargar Plantillas desde Supabase
  const loadPlantillas = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('plantillas_automatizacion')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setPlantillas(data as PlantillaItem[]);
      }
    } catch (err) {
      console.error('Error cargando plantillas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlantillas();
    loadReglasRetoque();
    loadAutoRoi();
    loadFlujosConfig();
  }, [businessId]);

  // Handlers para Reglas de Retoque
  const toggleReglaActiva = async (regla: ReglaRetoqueItem) => {
    try {
      const nuevoEstado = !regla.activo;
      const { error } = await supabase
        .from('configuracion_recordatorios')
        .update({ activo: nuevoEstado })
        .eq('id', regla.id);

      if (!error) {
        setReglasRetoque(prev => prev.map(r => r.id === regla.id ? { ...r, activo: nuevoEstado } : r));
      }
    } catch (err) {
      console.error('Error alternando estado de regla:', err);
    }
  };

  const openCreateReglaModal = () => {
    setEditingRegla(null);
    setFormRegla({
      servicio: '',
      keywords: '',
      dias_min: 18,
      dias_max: 24,
      activo: true
    });
    setIsReglaModalOpen(true);
  };

  const openEditReglaModal = (regla: ReglaRetoqueItem) => {
    setEditingRegla(regla);
    setFormRegla({
      servicio: regla.servicio || '',
      keywords: regla.keywords || '',
      dias_min: regla.dias_min || 18,
      dias_max: regla.dias_max || (regla.dias_min ? regla.dias_min + 6 : 24),
      activo: regla.activo ?? true
    });
    setIsReglaModalOpen(true);
  };

  const handleSaveRegla = async () => {
    if (!formRegla.servicio.trim() || !businessId) return;
    setSaving(true);
    try {
      const diasMin = Number(formRegla.dias_min) || 15;
      const diasMax = Number(formRegla.dias_max) || diasMin + 6;

      if (editingRegla) {
        const { error } = await supabase
          .from('configuracion_recordatorios')
          .update({
            servicio: formRegla.servicio.trim(),
            keywords: formRegla.keywords.trim() || formRegla.servicio.trim().toLowerCase(),
            dias_min: diasMin,
            dias_max: diasMax,
            activo: formRegla.activo
          })
          .eq('id', editingRegla.id);

        if (!error) {
          setReglasRetoque(prev => prev.map(r => r.id === editingRegla.id ? {
            ...r,
            servicio: formRegla.servicio.trim(),
            keywords: formRegla.keywords.trim() || formRegla.servicio.trim().toLowerCase(),
            dias_min: diasMin,
            dias_max: diasMax,
            activo: formRegla.activo
          } : r));
          setIsReglaModalOpen(false);
        }
      } else {
        const { data, error } = await supabase
          .from('configuracion_recordatorios')
          .insert({
            business_id: businessId,
            servicio: formRegla.servicio.trim(),
            keywords: formRegla.keywords.trim() || formRegla.servicio.trim().toLowerCase(),
            dias_min: diasMin,
            dias_max: diasMax,
            mensaje: 'Recordatorio automático de retoque',
            activo: formRegla.activo
          })
          .select()
          .single();

        if (!error && data) {
          setReglasRetoque(prev => [...prev, data as ReglaRetoqueItem]);
          setIsReglaModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error guardando regla de retoque:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegla = async (id: number) => {
    if (!window.confirm('¿Segura que deseas eliminar esta regla de recordatorio?')) return;
    try {
      const { error } = await supabase
        .from('configuracion_recordatorios')
        .delete()
        .eq('id', id);

      if (!error) {
        setReglasRetoque(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Error eliminando regla de retoque:', err);
    }
  };

  const currentFlujo = useMemo(() => {
    return FLUJOS_CATALOGO.find(f => f.id === flujoActivo) || FLUJOS_CATALOGO[0];
  }, [flujoActivo]);

  const currentFlujoKey = useMemo(() => {
    if (tiempoSeleccionado === 'tiempo_3' && currentFlujo.tiempo3FlujoKey) {
      return currentFlujo.tiempo3FlujoKey;
    }
    if (tiempoSeleccionado === 'tiempo_2' && currentFlujo.tiempo2FlujoKey) {
      return currentFlujo.tiempo2FlujoKey;
    }
    return currentFlujo.tiempo1FlujoKey;
  }, [currentFlujo, tiempoSeleccionado]);

  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter(p => p.flujo === currentFlujoKey);
  }, [plantillas, currentFlujoKey]);

  // Manejador para insertar variables
  const handleInsertVariable = (variableKey: string) => {
    setFormData(prev => ({
      ...prev,
      contenido: prev.contenido + (prev.contenido.endsWith(' ') ? '' : ' ') + variableKey
    }));
    setCopiedVar(variableKey);
    setTimeout(() => setCopiedVar(null), 1500);
  };

  // Toggle Activo en Plantilla
  const togglePlantillaActiva = async (plantilla: PlantillaItem) => {
    try {
      const nuevoEstado = !plantilla.activo;
      const { error } = await supabase
        .from('plantillas_automatizacion')
        .update({ activo: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', plantilla.id);

      if (!error) {
        setPlantillas(prev => prev.map(p => p.id === plantilla.id ? { ...p, activo: nuevoEstado } : p));
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  // Abrir Modal de Edición / Creación
  const openCreateModal = () => {
    setEditingPlantilla(null);
    setFormData({
      titulo: `Variación ${plantillasFiltradas.length + 1}`,
      contenido: '',
      servicio_regla_id: ''
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (plantilla: PlantillaItem) => {
    setEditingPlantilla(plantilla);
    setFormData({
      titulo: plantilla.titulo,
      contenido: plantilla.contenido,
      servicio_regla_id: plantilla.servicio_regla_id || ''
    });
    setIsEditorOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSavePlantilla = async () => {
    if (!formData.titulo.trim() || !formData.contenido.trim() || !businessId) return;
    setSaving(true);
    const selectedServiceId = formData.servicio_regla_id ? Number(formData.servicio_regla_id) : null;
    try {
      if (editingPlantilla) {
        // Actualizar
        const { error } = await supabase
          .from('plantillas_automatizacion')
          .update({
            titulo: formData.titulo,
            contenido: formData.contenido,
            servicio_regla_id: selectedServiceId,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPlantilla.id);

        if (!error) {
          setPlantillas(prev => prev.map(p => p.id === editingPlantilla.id ? { 
            ...p, 
            titulo: formData.titulo, 
            contenido: formData.contenido,
            servicio_regla_id: selectedServiceId
          } : p));
          setIsEditorOpen(false);
        }
      } else {
        // Crear
        const nueva: Partial<PlantillaItem> = {
          business_id: businessId,
          flujo: currentFlujoKey,
          tiempo: tiempoSeleccionado,
          titulo: formData.titulo,
          contenido: formData.contenido,
          servicio_regla_id: selectedServiceId,
          activo: true,
          es_default: false
        };

        const { data, error } = await supabase
          .from('plantillas_automatizacion')
          .insert([nueva])
          .select();

        if (!error && data && data[0]) {
          setPlantillas(prev => [...prev, data[0] as PlantillaItem]);
          setIsEditorOpen(false);
        }
      }
    } catch (err) {
      console.error('Error guardando plantilla:', err);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar Plantilla
  const handleDeletePlantilla = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta variación?')) return;
    try {
      const { error } = await supabase
        .from('plantillas_automatizacion')
        .delete()
        .eq('id', id);

      if (!error) {
        setPlantillas(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Error eliminando plantilla:', err);
    }
  };

  // Generar vista previa reemplazando variables
  const renderPreviewText = (rawContent: string) => {
    let preview = rawContent;
    currentFlujo.variables.forEach(v => {
      preview = preview.replaceAll(v.key, v.ejemplo);
    });
    return preview;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white p-3 sm:p-5 md:p-6 pb-36 sm:pb-12">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        {/* ── HEADER NATIVO NILAH ── */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span>Automatizaciones</span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Piloto automático y copys con protección anti-baneo
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botón Vista Previa Móvil */}
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all shadow-xs active:scale-95 lg:hidden"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Simulador</span>
            </button>

            {/* Refresh */}
            <button
              onClick={loadPlantillas}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-dark-border transition-all disabled:opacity-50 active:scale-95 shrink-0"
              title="Actualizar datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── CONDICIONAL: SI NO ES PRO, MOSTRAR PAYWALL ULTRA-PREMIUM ── */}
        {!isPro ? (
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/10 dark:via-[#121212] dark:to-[#0a0a0a] p-6 sm:p-10 text-center shadow-xl">
            {/* Glow decorativo de fondo */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black tracking-wide uppercase shadow-xs">
                <Crown className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>Módulo Exclusivo Plan PRO</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                  Desbloquea el Piloto Automático 24/7 por WhatsApp
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  Elimina el 30% de plantones con <strong>Recordatorios 24h y 3h</strong>, activa el <strong>Retoque automático a los 21 días</strong>, rescata clientas ausentes y automatiza la fidelización sin tocar un botón.
                </p>
              </div>

              {/* Grid de Beneficios PRO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {[
                  { title: '⏰ Anti No-Shows 24h & 3h', desc: 'Confirmación y recordatorio automático para no perder huecos.' },
                  { title: '💅 Retoques 18-24 Días', desc: 'Le recuerda el mantenimiento de uñas o pestañas en su día ideal.' },
                  { title: '🫀 Rescate Progresivo', desc: 'Reactivación automática a los 45, 75 y 120 días con ofertas inteligentes.' },
                  { title: '⭐ Encuestas & Premios', desc: 'Captura feedback 1 a 5 ⭐ y entrega puntos por cada visita.' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shadow-2xs backdrop-blur-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setUpgradeContext('recordatorios_whatsapp');
                    setIsUpgradeModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Subir a Plan PRO — Activar Robots</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Tu plan actual es <strong>Básico (Gratis)</strong>. Paga solo por los robots cuando quieras que trabajen por ti.
              </p>
            </div>
          </div>
        ) : (
        /* ── VISTA COMPLETA PARA USUARIOS PRO ── */
        <>
        {/* ── BARRA HORIZONTAL DE FLUJOS (Mobile-First Pill Tabs) ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x -mx-3 px-3 sm:mx-0 sm:px-0">
          {FLUJOS_CATALOGO.map(flujo => {
            const Icon = flujo.icon;
            const isSelected = flujoActivo === flujo.id;
            return (
              <button
                key={flujo.id}
                onClick={() => {
                  setFlujoActivo(flujo.id);
                  setTiempoSeleccionado('tiempo_1');
                }}
                className={`snap-start shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white dark:bg-dark-card border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{flujo.nombre}</span>
              </button>
            );
          })}
        </div>

        {/* ── CARD PRINCIPAL DEL FLUJO ── */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-2xl p-4 sm:p-5 md:p-6 shadow-xs space-y-5">
          
          {/* Header del Flujo & Switch On/Off */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-dark-border">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <currentFlujo.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {currentFlujo.nombre}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                    {currentFlujo.tag}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {currentFlujo.descripcion}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{currentFlujo.frecuencia}</span>
                </div>
              </div>
            </div>

            {/* Switch On/Off Flujo */}
            <div className="flex items-center justify-between sm:justify-end gap-3 bg-gray-50 dark:bg-dark-bg p-2.5 sm:px-3 sm:py-2 rounded-xl border border-gray-200/80 dark:border-dark-border shrink-0">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                {savingFlujoState && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                {flujosConfig[flujoActivo] ? 'Flujo Activo' : 'Pausado'}
              </span>
              <button
                onClick={() => toggleFlujoActivo(flujoActivo)}
                disabled={savingFlujoState}
                className={`transition-colors active:scale-95 disabled:opacity-50 cursor-pointer ${flujosConfig[flujoActivo] ? 'text-primary' : 'text-gray-400'}`}
                title={flujosConfig[flujoActivo] ? 'Haz clic para pausar este flujo' : 'Haz clic para activar este flujo'}
              >
                {flujosConfig[flujoActivo] ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
              </button>
            </div>
          </div>

          {/* ── KPI REALES ATRIBUIDOS A ESTE FLUJO ── */}
          {autoRoiStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-gradient-to-r from-primary/5 via-violet-500/5 to-pink-500/5 border border-primary/15">
              <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">📤 Avisos Enviados</p>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">
                  {flujoActivo === 'retoques' && (autoRoiStats.retoques?.enviados || 0)}
                  {flujoActivo === 'recordatorios' && (autoRoiStats.no_shows?.enviados || 0)}
                  {flujoActivo === 'rescate' && (autoRoiStats.rescate?.enviados || 0)}
                  {flujoActivo === 'fidelizacion' && (autoRoiStats.fidelizacion?.enviados || 0)}
                  {flujoActivo === 'cumpleanos' && 0}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">💬 Respondieron</p>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {flujoActivo === 'retoques' && `${autoRoiStats.retoques?.respondidos || 0} clientas`}
                  {flujoActivo === 'recordatorios' && `${autoRoiStats.no_shows?.confirmados || 0} confirmados`}
                  {flujoActivo === 'rescate' && `${autoRoiStats.rescate?.respondidos || 0} clientas`}
                  {flujoActivo === 'fidelizacion' && `${autoRoiStats.fidelizacion?.respondidos || 0} respuestas`}
                  {flujoActivo === 'cumpleanos' && '0'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">📅 Citas Generadas</p>
                <p className="text-base font-extrabold text-violet-600 dark:text-violet-400 mt-0.5">
                  {flujoActivo === 'retoques' && `${autoRoiStats.retoques?.agendados || 0} agendadas`}
                  {flujoActivo === 'recordatorios' && `${autoRoiStats.no_shows?.citas_salvadas || 0} asistidas`}
                  {flujoActivo === 'rescate' && `${autoRoiStats.rescate?.agendados || 0} rescatadas`}
                  {flujoActivo === 'fidelizacion' && `${autoRoiStats.fidelizacion?.promedio_csat || 5.0} ⭐ CSAT`}
                  {flujoActivo === 'cumpleanos' && '0'}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border shadow-2xs">
                <p className="text-[10px] uppercase font-bold text-pink-600 dark:text-pink-400 tracking-wider">💰 Facturación Atribuida</p>
                <p className="text-base font-extrabold text-pink-600 dark:text-pink-400 mt-0.5">
                  {flujoActivo === 'retoques' && `S/. ${(autoRoiStats.retoques?.ingresos || 0).toLocaleString('es-PE')}`}
                  {flujoActivo === 'recordatorios' && `S/. ${(autoRoiStats.no_shows?.dinero_protegido || 0).toLocaleString('es-PE')}`}
                  {flujoActivo === 'rescate' && `S/. ${(autoRoiStats.rescate?.ingresos || 0).toLocaleString('es-PE')}`}
                  {flujoActivo === 'fidelizacion' && `${autoRoiStats.fidelizacion?.positivos || 0} Promotoras`}
                  {flujoActivo === 'cumpleanos' && 'S/. 0'}
                </p>
              </div>
            </div>
          )}

          {/* ── BANNER INTERACTIVO DE VARIABLES DISPONIBLES ── */}
          <div className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-200/80 dark:border-dark-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Variables Dinámicas Disponibles</span>
              </span>
              {copiedVar && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full animate-fade-in">
                  <Check className="w-3 h-3" /> ¡Copiado al portapapeles!
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Haz clic en cualquier variable para copiarla o insertarla en tus copys:
            </p>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {currentFlujo.variables.map(v => (
                <button
                  key={v.key}
                  onClick={() => {
                    navigator.clipboard?.writeText(v.key);
                    setCopiedVar(v.key);
                    setTimeout(() => setCopiedVar(null), 2000);
                  }}
                  title={`Ejemplo en vivo: "${v.ejemplo}". Haz clic para copiar.`}
                  className="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border hover:border-primary text-gray-800 dark:text-gray-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <code className="text-primary font-mono font-bold">{v.key}</code>
                  <span className="text-[10px] text-gray-400">→</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{v.ejemplo}</span>
                  <Copy className="w-2.5 h-2.5 text-gray-300 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Selector de Tiempos (Pills) */}
          {currentFlujo.tiempo2FlujoKey && (
            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1 bg-gray-100 dark:bg-dark-bg rounded-xl max-w-xl">
              <button
                onClick={() => setTiempoSeleccionado('tiempo_1')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  tiempoSeleccionado === 'tiempo_1'
                    ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {currentFlujo.tiempo1Nombre}
              </button>
              <button
                onClick={() => setTiempoSeleccionado('tiempo_2')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  tiempoSeleccionado === 'tiempo_2'
                    ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {currentFlujo.tiempo2Nombre}
              </button>
              {currentFlujo.tiempo3Nombre && (
                <button
                  onClick={() => setTiempoSeleccionado('tiempo_3')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                    tiempoSeleccionado === 'tiempo_3'
                      ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {currentFlujo.tiempo3Nombre}
                </button>
              )}
            </div>
          )}

          {/* Sub-Pestañas exclusivas para Retoques: Mensajes vs Reglas de Días */}
          {flujoActivo === 'retoques' && (
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-dark-border pb-3">
              <button
                onClick={() => setSubPestanaRetoque('copys')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  subPestanaRetoque === 'copys'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                📝 Mensajes & Variaciones
              </button>
              <button
                onClick={() => setSubPestanaRetoque('reglas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  subPestanaRetoque === 'reglas'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                ⚙️ Reglas por Servicio ({reglasRetoque.length})
              </button>
            </div>
          )}

          {/* Si estamos en retoques y pestaña Reglas, mostrar el CRUD de Servicios & Frecuencias */}
          {flujoActivo === 'retoques' && subPestanaRetoque === 'reglas' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-primary" />
                    Frecuencias de Mantenimiento por Servicio
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Define cuántos días deben pasar desde su última cita para invitar a la clienta a su retoque.
                  </p>
                </div>

                <button
                  onClick={openCreateReglaModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Regla</span>
                </button>
              </div>

              {loadingReglas ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Cargando reglas...
                </div>
              ) : reglasRetoque.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-dark-bg rounded-xl border border-dashed border-gray-200 dark:border-dark-border">
                  <p className="text-xs text-gray-500 mb-2.5">No tienes reglas configuradas para este salón.</p>
                  <button
                    onClick={openCreateReglaModal}
                    className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                  >
                    + Configurar Primera Regla
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reglasRetoque.map((regla) => (
                    <div
                      key={regla.id}
                      className={`p-4 rounded-xl border transition-all ${
                        regla.activo
                          ? 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border'
                          : 'bg-gray-100/60 dark:bg-dark-bg/40 border-gray-200/50 dark:border-dark-border/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-gray-900 dark:text-white">
                              {regla.servicio}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                              {regla.dias_min} a {regla.dias_max} días
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            <span className="font-semibold text-gray-500">Palabras clave:</span> {regla.keywords}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => toggleReglaActiva(regla)}
                            title={regla.activo ? 'Desactivar regla' : 'Activar regla'}
                            className={`p-1 rounded-lg transition-colors ${
                              regla.activo ? 'text-primary' : 'text-gray-400'
                            }`}
                          >
                            {regla.activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => openEditReglaModal(regla)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/10"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRegla(regla.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
          /* ── GRID: VARIACIONES & SIMULADOR ── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Columna Izquierda: Variaciones de Copys (7 Cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Variaciones ({plantillasFiltradas.filter(p => p.activo).length} activas)
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Rotación aleatoria para que Meta no detecte mensajes repetitivos.
                  </p>
                </div>

                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Copy</span>
                </button>
              </div>

              {/* Tooltip de Estrategia para Rescate de Inactivas */}
              {flujoActivo === 'rescate' && currentFlujo.tooltips?.[currentFlujoKey] && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">💡</span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-0.5">
                      Guía de Estrategia para esta Etapa
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                      {currentFlujo.tooltips[currentFlujoKey]}
                    </p>
                  </div>
                </div>
              )}
              {/* Lista de Tarjetas de Variaciones */}
              <div className="space-y-2.5">
                {loading ? (
                  <div className="p-6 text-center text-gray-400 text-xs">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Cargando variaciones...
                  </div>
                ) : plantillasFiltradas.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 dark:bg-dark-bg rounded-xl border border-dashed border-gray-200 dark:border-dark-border">
                    <p className="text-xs text-gray-500 mb-2.5">No hay variaciones para este tiempo.</p>
                    <button
                      onClick={openCreateModal}
                      className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold"
                    >
                      + Crear Primera Variación
                    </button>
                  </div>
                ) : (
                  plantillasFiltradas.map((plantilla, idx) => (
                    <div
                      key={plantilla.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        plantilla.activo
                          ? 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border'
                          : 'bg-gray-100/60 dark:bg-dark-bg/40 border-gray-200/50 dark:border-dark-border/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-5 h-5 rounded-md bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {plantilla.titulo}
                          </span>
                          {plantilla.es_default && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary shrink-0">
                              Nilah
                            </span>
                          )}
                          {flujoActivo === 'retoques' && plantilla.servicio_regla_id && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                              🎯 {reglasRetoque.find(r => r.id === plantilla.servicio_regla_id)?.servicio || 'Servicio Específico'}
                            </span>
                          )}
                          {flujoActivo === 'retoques' && !plantilla.servicio_regla_id && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gray-500/10 text-gray-500 dark:text-gray-400 shrink-0">
                              🌍 General (Todos)
                            </span>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => togglePlantillaActiva(plantilla)}
                            title={plantilla.activo ? 'Desactivar' : 'Activar'}
                            className={`p-1 rounded-lg transition-colors ${
                              plantilla.activo ? 'text-primary' : 'text-gray-400'
                            }`}
                          >
                            {plantilla.activo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => openEditModal(plantilla)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-white/10"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {!plantilla.es_default && (
                            <button
                              onClick={() => handleDeletePlantilla(plantilla.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Texto del mensaje */}
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-sans whitespace-pre-line bg-white dark:bg-dark-card p-2.5 rounded-lg border border-gray-200/70 dark:border-dark-border leading-relaxed">
                        {plantilla.contenido}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Columna Derecha: Simulador de WhatsApp en Desktop (5 Cols) */}
            <div className="hidden lg:block lg:col-span-5">
              <div className="sticky top-6 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-primary" />
                    Simulador en Vivo
                  </h3>
                  <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                    Negritas & Variables
                  </span>
                </div>

                {/* Mockup WhatsApp Estilo Nilah */}
                <div className="w-full rounded-2xl p-2.5 bg-gray-900 shadow-lg border border-gray-800 text-white">
                  {/* Top bar */}
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-800/80 rounded-xl">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-[11px]">
                      PC
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">Paola Chau Beauty ✨</div>
                      <div className="text-[9px] text-emerald-400">en línea</div>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div className="p-3 my-2 min-h-[220px] max-h-[300px] overflow-y-auto bg-[#0b141a] rounded-xl flex flex-col justify-end">
                    <div className="self-end max-w-[95%] bg-[#005c4b] text-white p-2.5 rounded-xl rounded-tr-none text-xs shadow-xs leading-relaxed">
                      <p className="whitespace-pre-line font-sans">
                        {renderPreviewText(
                          plantillasFiltradas[0]?.contenido ?? 'Configura una plantilla para ver la simulación.'
                        )}
                      </p>
                      <div className="text-[9px] text-emerald-200/60 text-right mt-1 flex items-center justify-end gap-0.5">
                        <span>09:42</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    Usa <code>*texto*</code> para negritas. La base de datos calculará automáticamente el tiempo de digitación humana antes de enviar.
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
        </div>
        </>
        )}

      </div>

      {/* ── BOTTOM SHEET: MODAL DE CREAR/EDITAR REGLA DE RETOQUE ── */}
      <BottomSheet
        isOpen={isReglaModalOpen}
        onClose={() => setIsReglaModalOpen(false)}
        title={editingRegla ? 'Editar Regla de Retoque' : 'Nueva Regla de Retoque'}
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Servicio
            </label>
            <input
              type="text"
              value={formRegla.servicio}
              onChange={e => setFormRegla({ ...formRegla, servicio: e.target.value })}
              placeholder="Ej. Uñas Acrílicas / Gel"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Palabras Clave en la Cita (separadas por comas)
            </label>
            <input
              type="text"
              value={formRegla.keywords}
              onChange={e => setFormRegla({ ...formRegla, keywords: e.target.value })}
              placeholder="Ej. acrilica, gel, kapping, esculpido"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Si la cita contiene alguna de estas palabras, se le aplicará esta frecuencia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Día Ideal (Mínimo)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={formRegla.dias_min}
                  onChange={e => setFormRegla({ ...formRegla, dias_min: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400 font-semibold">días</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Ventana Límite (Máximo)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={formRegla.dias_min || 1}
                  max={365}
                  value={formRegla.dias_max}
                  onChange={e => setFormRegla({ ...formRegla, dias_max: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-gray-400 font-semibold">días</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-200/70 dark:border-dark-border">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {formRegla.activo ? 'Regla Activada' : 'Regla Pausada'}
            </span>
            <button
              type="button"
              onClick={() => setFormRegla({ ...formRegla, activo: !formRegla.activo })}
              className={`transition-colors ${formRegla.activo ? 'text-primary' : 'text-gray-400'}`}
            >
              {formRegla.activo ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReglaModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving || !formRegla.servicio.trim()}
              onClick={handleSaveRegla}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Guardar Regla</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── BOTTOM SHEET MÓVIL: EDITOR DE VARIACIÓN ── */}
      <BottomSheet
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingPlantilla ? 'Editar Variación' : 'Nueva Variación de Copy'}
      >
        <div className="p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la Variación
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej. Variación 4 — Tono Cercano"
              className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          {/* Chips de Variables */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Toca para insertar variable:
              </label>
              {copiedVar && (
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> ¡Insertada!
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {currentFlujo.variables.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleInsertVariable(v.key)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-dark-border hover:border-primary text-gray-800 dark:text-gray-200 active:scale-95 transition-all flex items-center gap-1"
                >
                  <span className="text-primary font-bold">+</span>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

           {/* Selección de Servicio Obligatoria para Retoques */}
          {flujoActivo === 'retoques' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                ¿A qué Servicio Específico pertenece este Copy? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.servicio_regla_id}
                onChange={e => setFormData({ ...formData, servicio_regla_id: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              >
                <option value="">Selecciona el servicio correspondiente...</option>
                {reglasRetoque.map(r => (
                  <option key={r.id} value={r.id}>
                    🎯 {r.servicio} ({r.dias_min} a {r.dias_max} días)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-primary/80 font-medium mt-1">
                🔒 Por seguridad, solo se enviarán recordatorios a clientas cuyo servicio tenga al menos un copy activo asignado.
              </p>
            </div>
          )}

          {/* Cuerpo del Mensaje */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Texto del Mensaje
            </label>
            <textarea
              rows={5}
              value={formData.contenido}
              onChange={e => setFormData({ ...formData, contenido: e.target.value })}
              placeholder="Escribe el mensaje aquí..."
              className="w-full p-3 rounded-xl text-xs font-sans bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white resize-y"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditorOpen(false)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-bg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={
                saving || 
                !formData.titulo.trim() || 
                !formData.contenido.trim() || 
                (flujoActivo === 'retoques' && !formData.servicio_regla_id)
              }
              onClick={handleSavePlantilla}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Guardar Copy</span>
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── BOTTOM SHEET MÓVIL: VISTA PREVIA SIMULADOR ── */}
      <BottomSheet
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Simulador WhatsApp"
      >
        <div className="p-4 space-y-3">
          <div className="w-full rounded-2xl p-2.5 bg-gray-900 shadow-lg text-white">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-800 rounded-xl mb-2">
              <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-[11px]">
                PC
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">Paola Chau Beauty ✨</div>
                <div className="text-[9px] text-emerald-400">en línea</div>
              </div>
            </div>

            <div className="p-3 bg-[#0b141a] rounded-xl flex flex-col justify-end min-h-[220px]">
              <div className="self-end max-w-[95%] bg-[#005c4b] text-white p-3 rounded-xl rounded-tr-none text-xs leading-relaxed">
                <p className="whitespace-pre-line font-sans">
                  {renderPreviewText(
                    plantillasFiltradas[0]?.contenido ?? 'No hay plantillas activas para mostrar.'
                  )}
                </p>
                <div className="text-[9px] text-emerald-200/60 text-right mt-1 flex items-center justify-end gap-0.5">
                  <span>09:42</span>
                  <span>✓✓</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsPreviewOpen(false)}
            className="w-full py-2.5 bg-gray-100 dark:bg-dark-bg text-gray-800 dark:text-gray-200 font-bold rounded-xl text-xs"
          >
            Cerrar Simulador
          </button>
        </div>
      </BottomSheet>

      {/* ── MODAL PRO UPGRADE ── */}
      <ProUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        context={upgradeContext}
      />

    </div>
  );
};

export default Automatizaciones;
