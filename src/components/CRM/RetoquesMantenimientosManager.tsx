import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock, Sparkles, Send, Settings, CheckCircle2, AlertCircle,
  Plus, Edit2, Trash2, Search, RefreshCw, MessageSquare,
  Users, ChevronRight, X, Phone, Check, ShieldCheck, Heart,
  Sliders, Calendar, ArrowRight, Zap, Bell, CheckCheck, Save,
  Layers, RotateCcw, CheckCircle, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardData } from '../../context/DashboardDataContext';
import { supabase } from '../../services/supabase';
import { fetchPlantillasGlobales, PlantillaGlobal } from '../../services/autopilot';

// ===========================================
// Tipos y Modelos de Retoque
// ===========================================

export interface ServiceRule {
  id: string;
  servicio: string;
  keywords: string;
  dias_min: number;
  dias_max: number;
  mensaje: string;
  emoji: string;
  activo: boolean;
}

export interface ClientRetoqueCandidate {
  citaId?: number;
  clienteId: number;
  nombre: string;
  telefono: string;
  servicio: string;
  tipoServicio: string;
  diasPasados: number;
  diasOptimosRestantes: number;
  mensajePersonalizado?: string;
  estadoSemaforo: 'optimo' | 'urgente' | 'vencido';
}

const PRESET_CATEGORIES: Record<string, { nombre: string; keywords: string; dias_min: number; dias_max: number; emoji: string }[]> = {
  '💅 Uñas': [
    { nombre: 'Retoque Acrílicas / Gel', keywords: 'acrilica, gel, kapping', dias_min: 15, dias_max: 21, emoji: '💅' },
    { nombre: 'Base Rubber / Nivelación', keywords: 'rubber, nivelacion', dias_min: 12, dias_max: 20, emoji: '✨' },
    { nombre: 'Esmaltado Semipermanente', keywords: 'semipermanente, esmalte', dias_min: 14, dias_max: 21, emoji: '🌸' }
  ],
  '👁️ Pestañas & Cejas': [
    { nombre: 'Lifting de Pestañas', keywords: 'lifting, ondulacion', dias_min: 30, dias_max: 45, emoji: '👁️' },
    { nombre: 'Extensiones de Pestañas (Retoque)', keywords: 'extensiones, volumen, punto por punto', dias_min: 14, dias_max: 21, emoji: '✨' },
    { nombre: 'Laminado & Diseño Cejas', keywords: 'laminado, diseno, cejas', dias_min: 25, dias_max: 40, emoji: '🤨' }
  ],
  '💇‍♀️ Cabello': [
    { nombre: 'Retoque de Raíz / Canas', keywords: 'tinte, raiz, color', dias_min: 20, dias_max: 30, emoji: '🎨' },
    { nombre: 'Terapia Capilar & Hidratación', keywords: 'davines, hidratacion, botox', dias_min: 20, dias_max: 35, emoji: '🧴' },
    { nombre: 'Alisado Orgánico / Keratina', keywords: 'alisado, organico, keratina', dias_min: 90, dias_max: 180, emoji: '💇‍♀️' }
  ],
  '🦶 Pies & Spa': [
    { nombre: 'Pedicura Spa Completa', keywords: 'pedicura, pedicure, spa pies', dias_min: 20, dias_max: 35, emoji: '🦶' }
  ]
};

export const RetoquesMantenimientosManager: React.FC = () => {
  const {
    engagementConfig,
    pendientesRetoque: contextPending,
    engagement,
    isLoading: contextLoading,
    refresh
  } = useDashboardData();

  // Sub-pestanas principales
  const [subTab, setSubTab] = useState<'radar' | 'reglas' | 'historial'>('radar');

  // Estados locales de reglas
  const [rules, setRules] = useState<ServiceRule[]>([]);
  const [filterService, setFilterService] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modales
  const [editingRule, setEditingRule] = useState<ServiceRule | null>(null);
  const [isNewRuleModalOpen, setIsNewRuleModalOpen] = useState<boolean>(false);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Formulario de edición / nueva regla
  const [formServicio, setFormServicio] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formDiasMin, setFormDiasMin] = useState<number>(15);
  const [formDiasMax, setFormDiasMax] = useState<number>(25);
  const [formMensaje, setFormMensaje] = useState('');
  const [formEmoji, setFormEmoji] = useState('✨');
  const [formActivo, setFormActivo] = useState(true);

  // Plantillas Globales del SuperAdmin
  const [globalTemplates, setGlobalTemplates] = useState<PlantillaGlobal[]>([]);
  const [loadingGlobalTemplates, setLoadingGlobalTemplates] = useState<boolean>(false);

  // Cargar plantillas maestras globales del SuperAdmin
  useEffect(() => {
    let isMounted = true;
    const loadGlobals = async () => {
      setLoadingGlobalTemplates(true);
      try {
        const templates = await fetchPlantillasGlobales();
        if (isMounted) {
          // Filtrar las que pertenecen a la familia de retoques o mantenimiento
          const retoqueTemplates = templates.filter(
            t => t.flujo?.startsWith('retoque') || t.flujo?.includes('mantenimiento')
          );
          setGlobalTemplates(retoqueTemplates.length > 0 ? retoqueTemplates : templates);
        }
      } catch (err) {
        console.error('Error cargando plantillas globales en RetoquesManager:', err);
      } finally {
        if (isMounted) setLoadingGlobalTemplates(false);
      }
    };
    loadGlobals();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper para verificar si un mensaje coincide con una plantilla oficial del SuperAdmin
  const findMatchingGlobalTemplate = useCallback(
    (mensajeTexto: string, servicioNombre?: string) => {
      if (!mensajeTexto || !globalTemplates.length) return null;
      // Normalizar texto para comparación robusta
      const cleanText = (txt: string) => txt.replace(/\s+/g, ' ').trim().toLowerCase();
      const target = cleanText(mensajeTexto);

      // Coincidencia exacta de contenido
      const matched = globalTemplates.find(gt => cleanText(gt.contenido) === target);
      if (matched) return matched;

      // Coincidencia por categoría o título si el texto es muy similar
      if (servicioNombre) {
        return (
          globalTemplates.find(
            gt =>
              gt.categoria_servicio?.toLowerCase() === servicioNombre.toLowerCase() ||
              gt.titulo?.toLowerCase().includes(servicioNombre.toLowerCase())
          ) || null
        );
      }
      return null;
    },
    [globalTemplates]
  );

  // Sincronizar reglas desde el contexto
  useEffect(() => {
    if (engagementConfig) {
      setRules(
        engagementConfig.map(c => ({
          id: String(c.id),
          servicio: c.servicio,
          keywords: c.keywords,
          dias_min: Number(c.dias_min) || 15,
          dias_max: Number(c.dias_max) || 30,
          mensaje: c.mensaje,
          emoji: c.emoji || '✨',
          activo: c.activo !== false
        }))
      );
    }
  }, [engagementConfig]);

  // Candidatos calculados con semáforo inteligente
  const candidates: ClientRetoqueCandidate[] = useMemo(() => {
    if (!contextPending) return [];
    return contextPending.map(p => {
      let estadoSemaforo: 'optimo' | 'urgente' | 'vencido' = 'optimo';
      if (p.diasOptimosRestantes <= 0) {
        estadoSemaforo = 'vencido';
      } else if (p.diasOptimosRestantes <= 3) {
        estadoSemaforo = 'urgente';
      }

      return {
        citaId: p.citaId,
        clienteId: p.clienteId,
        nombre: p.nombre,
        telefono: p.telefono,
        servicio: p.servicio,
        tipoServicio: p.tipoServicio,
        diasPasados: p.diasPasados,
        diasOptimosRestantes: p.diasOptimosRestantes,
        mensajePersonalizado: p.mensaje,
        estadoSemaforo
      };
    });
  }, [contextPending]);

  // Candidatos filtrados
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      const matchQuery =
        !searchQuery.trim() ||
        c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.telefono.includes(searchQuery) ||
        c.servicio.toLowerCase().includes(searchQuery.toLowerCase());

      const matchService =
        filterService === 'todos' ||
        c.tipoServicio?.toLowerCase().includes(filterService.toLowerCase()) ||
        c.servicio?.toLowerCase().includes(filterService.toLowerCase());

      return matchQuery && matchService;
    });
  }, [candidates, searchQuery, filterService]);

  // Guardar configuración en Supabase
  const persistRules = async (newRules: ServiceRule[]) => {
    setSaveLoading(true);
    try {
      const businessId = localStorage.getItem('korat_business_id');
      if (!businessId) throw new Error('No business_id activo');

      const jsonValue = JSON.stringify(
        newRules.map(s => ({
          nombre: s.servicio,
          servicio: s.servicio,
          keywords: s.keywords,
          dias_min: s.dias_min,
          dias_max: s.dias_max,
          mensaje: s.mensaje,
          emoji: s.emoji,
          activo: s.activo
        }))
      );

      const { error } = await supabase.rpc('upsert_negocio_info', {
        p_business_id: businessId,
        p_clave: 'recordatorios_retoque',
        p_valor_texto: jsonValue
      });

      if (error) throw error;
      setRules(newRules);
      await refresh(true);
    } catch (e: any) {
      console.error('Error guardando reglas de retoque:', e);
      alert('Error al guardar: ' + (e.message || 'Error desconocido'));
    } finally {
      setSaveLoading(false);
    }
  };

  // Abrir modal de edición
  const handleOpenEdit = (rule: ServiceRule) => {
    setEditingRule(rule);
    setFormServicio(rule.servicio);
    setFormKeywords(rule.keywords);
    setFormDiasMin(rule.dias_min);
    setFormDiasMax(rule.dias_max);
    setFormMensaje(rule.mensaje);
    setFormEmoji(rule.emoji);
    setFormActivo(rule.activo);
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    if (!editingRule) return;
    const updated = rules.map(r =>
      r.id === editingRule.id
        ? {
            ...r,
            servicio: formServicio.trim(),
            keywords: formKeywords.trim(),
            dias_min: Number(formDiasMin),
            dias_max: Number(formDiasMax),
            mensaje: formMensaje.trim(),
            emoji: formEmoji,
            activo: formActivo
          }
        : r
    );
    await persistRules(updated);
    setEditingRule(null);
  };

  // Crear nueva regla
  const handleCreateRule = async () => {
    if (!formServicio.trim()) {
      alert('Por favor ingresa el nombre del servicio.');
      return;
    }

    const newRule: ServiceRule = {
      id: `rule-${Date.now()}`,
      servicio: formServicio.trim(),
      keywords: formKeywords.trim() || formServicio.toLowerCase().trim(),
      dias_min: Number(formDiasMin) || 15,
      dias_max: Number(formDiasMax) || 30,
      mensaje:
        formMensaje.trim() ||
        `¡Hola {nombre}! ✨ Ya es momento de tu retoque de ${formServicio.trim()}. ¿Qué día de esta semana te gustaría agendar? 🗓️`,
      emoji: formEmoji || '✨',
      activo: true
    };

    await persistRules([...rules, newRule]);
    setIsNewRuleModalOpen(false);
  };

  // Toggle directo de activo/inactivo
  const handleToggleRule = async (ruleId: string) => {
    const updated = rules.map(r => (r.id === ruleId ? { ...r, activo: !r.activo } : r));
    await persistRules(updated);
  };

  // Eliminar regla
  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta regla técnica de retoque?')) return;
    const updated = rules.filter(r => r.id !== ruleId);
    await persistRules(updated);
  };

  // Enviar mensaje de retoque individual
  const handleSendReminder = async (candidate: ClientRetoqueCandidate) => {
    setSendingId(candidate.clienteId);
    try {
      const res = await engagement.sendReminder(
        candidate.clienteId,
        candidate.tipoServicio,
        candidate.diasPasados || 0,
        candidate.citaId || null
      );
      const ok = Array.isArray(res) ? res[0]?.success : res?.success;
      if (ok) {
        await refresh(true);
      } else {
        alert(res?.error || 'No se pudo enviar el mensaje.');
      }
    } catch (e: any) {
      alert('Error enviando recordatorio: ' + (e.message || 'Error'));
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── BARRA SUPERIOR SUB-MÓDULOS (Mobile-First) ── */}
      <div className="bg-white dark:bg-dark-card p-2 sm:p-2.5 rounded-2xl border border-gray-100 dark:border-dark-border shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSubTab('radar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              subTab === 'radar'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Clock size={15} />
            <span>Radar de Clientas</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${subTab === 'radar' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}>
              {candidates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('reglas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              subTab === 'reglas'
                ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Sliders size={15} />
            <span>Reglas por Servicio</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${subTab === 'reglas' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'}`}>
              {rules.length}
            </span>
          </button>
        </div>

        {subTab === 'reglas' && (
          <button
            type="button"
            onClick={() => {
              setFormServicio('');
              setFormKeywords('');
              setFormDiasMin(15);
              setFormDiasMax(25);
              setFormMensaje('');
              setFormEmoji('💅');
              setFormActivo(true);
              setIsNewRuleModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-black shadow-sm shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nueva Regla</span>
            <span className="sm:hidden">Crear</span>
          </button>
        )}
      </div>

      {/* ── 1. SUB-MÓDULO: RADAR OPERATIVO DE CLIENTAS ── */}
      {subTab === 'radar' && (
        <div className="space-y-4">
          {/* Tarjetas KPI Superiores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white dark:bg-dark-card p-3 rounded-2xl border border-gray-100 dark:border-dark-border shadow-2xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ventana Ideal</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {candidates.filter(c => c.estadoSemaforo === 'optimo').length}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Momento óptimo de retoque</p>
            </div>

            <div className="bg-white dark:bg-dark-card p-3 rounded-2xl border border-gray-100 dark:border-dark-border shadow-2xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Por Vencer</p>
              <p className="text-xl font-black text-amber-500 mt-0.5">
                {candidates.filter(c => c.estadoSemaforo === 'urgente').length}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Menos de 3 días para vencer</p>
            </div>

            <div className="bg-white dark:bg-dark-card p-3 rounded-2xl border border-gray-100 dark:border-dark-border shadow-2xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pasadas de Tiempo</p>
              <p className="text-xl font-black text-rose-500 mt-0.5">
                {candidates.filter(c => c.estadoSemaforo === 'vencido').length}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Superaron días máximos</p>
            </div>

            <div className="bg-white dark:bg-dark-card p-3 rounded-2xl border border-gray-100 dark:border-dark-border shadow-2xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reglas Activas</p>
              <p className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5">
                {rules.filter(r => r.activo).length}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">Servicios monitoreados</p>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros de Servicios */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Buscar por clienta, teléfono o servicio..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl text-xs font-medium text-gray-800 dark:text-white focus:outline-cyan-500 shadow-2xs"
              />
            </div>

            {/* Chips de filtro por servicio */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setFilterService('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  filterService === 'todos'
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400'
                }`}
              >
                Todos ({candidates.length})
              </button>
              {rules.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setFilterService(r.servicio)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                    filterService === r.servicio
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span>{r.servicio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Clientas en Radar (Mobile Cards / Desktop Grid) */}
          {filteredCandidates.length === 0 ? (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-8 text-center space-y-2">
              <Clock className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                No hay clientas en ventana de retoque para este filtro
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                El sistema monitorea automáticamente las citas completadas. Cuando una clienta cumpla los días mínimos de su servicio, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCandidates.map(c => (
                <div
                  key={`${c.clienteId}-${c.citaId || c.servicio}`}
                  className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-dark-border shadow-xs flex flex-col justify-between gap-3 hover:border-cyan-200 dark:hover:border-cyan-800 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                          {c.nombre}
                        </h4>
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-gray-400" />
                          <span>{c.telefono}</span>
                        </p>
                      </div>

                      {/* Semáforo Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                          c.estadoSemaforo === 'optimo'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : c.estadoSemaforo === 'urgente'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                        }`}
                      >
                        {c.estadoSemaforo === 'optimo'
                          ? `Día ${c.diasPasados} · Óptimo`
                          : c.estadoSemaforo === 'urgente'
                          ? `Día ${c.diasPasados} · Por Vencer`
                          : `Día ${c.diasPasados} · Pasado`}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1">
                      <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                        {c.servicio}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Regla técnica: <span className="font-semibold text-cyan-600 dark:text-cyan-400">{c.tipoServicio}</span>
                      </p>
                    </div>

                    {c.mensajePersonalizado && (
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 italic line-clamp-2 bg-cyan-50/50 dark:bg-cyan-950/20 p-2 rounded-lg border border-cyan-100 dark:border-cyan-900/50">
                        "{c.mensajePersonalizado}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
                    <button
                      type="button"
                      onClick={() => handleSendReminder(c)}
                      disabled={sendingId === c.clienteId}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {sendingId === c.clienteId ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Enviando WhatsApp...</span>
                        </>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Enviar Retoque WhatsApp</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. SUB-MÓDULO: GESTOR DE REGLAS POR SERVICIO ── */}
      {subTab === 'reglas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white">
                Catálogo de Reglas Técnicas de Retoque
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Define cada cuántos días se sugiere el mantenimiento para cada servicio de tu salón.
              </p>
            </div>
          </div>

          {/* Grid de Reglas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rules.map(r => (
              <div
                key={r.id}
                className={`bg-white dark:bg-dark-card p-4 rounded-2xl border transition-all shadow-xs flex flex-col justify-between gap-3 ${
                  r.activo
                    ? 'border-gray-200 dark:border-dark-border hover:border-cyan-400'
                    : 'border-gray-100 dark:border-dark-border/40 opacity-60 bg-gray-50/50 dark:bg-white/2'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1.5 rounded-xl bg-gray-100 dark:bg-white/5">{r.emoji}</span>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                          {r.servicio}
                        </h4>
                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                          kw: {r.keywords}
                        </p>
                      </div>
                    </div>

                    {/* Switch ON / OFF */}
                    <button
                      type="button"
                      onClick={() => handleToggleRule(r.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        r.activo ? 'bg-cyan-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          r.activo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Ventana de Tiempo (Badge visual) */}
                  <div className="p-2.5 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-300">
                      Ventana Técnica:
                    </span>
                    <span className="text-xs font-black text-cyan-900 dark:text-cyan-100">
                      {r.dias_min} a {r.dias_max} días
                    </span>
                  </div>

                  {/* Preview Mensaje & Badge de Plantilla Oficial vs Personalizada */}
                  {(() => {
                    const matchedGlobal = findMatchingGlobalTemplate(r.mensaje, r.servicio);
                    const isExactMatch = matchedGlobal && matchedGlobal.contenido.replace(/\s+/g, ' ').trim() === r.mensaje.replace(/\s+/g, ' ').trim();
                    return (
                      <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1.5">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Mensaje WhatsApp:
                          </p>
                          {isExactMatch ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Sparkles size={10} />
                              <span>Oficial SuperAdmin</span>
                            </span>
                          ) : matchedGlobal ? (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = rules.map(rule =>
                                  rule.id === r.id ? { ...rule, mensaje: matchedGlobal.contenido } : rule
                                );
                                persistRules(updated);
                              }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition cursor-pointer"
                              title="Restaurar al texto original de la plantilla global"
                            >
                              <RotateCcw size={9} />
                              <span>Restaurar Oficial</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                              ✏️ Personalizado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-3 italic">
                          "{r.mensaje}"
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100 dark:border-dark-border">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(r)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                  >
                    <Edit2 size={12} />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteRule(r.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Eliminar regla"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR REGLA TÉCNICA ── */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{formEmoji}</span>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Editar Regla: {editingRule.servicio}
                  </h3>
                  <p className="text-xs text-gray-500">Configura la ventana de días y el mensaje automático</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  value={formServicio}
                  onChange={e => setFormServicio(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-dark-border rounded-xl font-bold text-gray-900 dark:text-white focus:outline-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Palabras Clave (Separadas por coma para detectar en la agenda)
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={e => setFormKeywords(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-dark-border rounded-xl font-mono text-gray-800 dark:text-gray-200 focus:outline-cyan-500"
                />
              </div>

              {/* Slider o Inputs de Ventana de Días */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40">
                <div>
                  <label className="block text-[10px] font-black uppercase text-cyan-800 dark:text-cyan-300 mb-1">
                    Días Mínimos (Inicio Ventana)
                  </label>
                  <input
                    type="number"
                    value={formDiasMin}
                    onChange={e => setFormDiasMin(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-dark-card border border-cyan-200 dark:border-cyan-800 rounded-lg font-black text-cyan-900 dark:text-cyan-100 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-cyan-800 dark:text-cyan-300 mb-1">
                    Días Máximos (Límite Retoque)
                  </label>
                  <input
                    type="number"
                    value={formDiasMax}
                    onChange={e => setFormDiasMax(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-dark-card border border-cyan-200 dark:border-cyan-800 rounded-lg font-black text-cyan-900 dark:text-cyan-100 text-center"
                  />
                </div>
              </div>

              {/* Selector de Variaciones Globales del SuperAdmin */}
              {globalTemplates.length > 0 && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-cyan-500" />
                      Variaciones Globales SuperAdmin ({globalTemplates.length})
                    </span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">
                      Toca una para aplicar su copy
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {globalTemplates.map(gt => {
                      const isApplied = formMensaje.trim() === gt.contenido.trim();
                      return (
                        <button
                          key={gt.id}
                          type="button"
                          onClick={() => {
                            setFormMensaje(gt.contenido);
                            if (gt.categoria_servicio && !formServicio) {
                              setFormServicio(gt.categoria_servicio);
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer border ${
                            isApplied
                              ? 'bg-cyan-500 text-white border-cyan-600 shadow-xs'
                              : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-cyan-400'
                          }`}
                        >
                          {isApplied && <Check size={11} />}
                          <span>{gt.titulo || gt.tiempo}</span>
                          {gt.categoria_servicio && (
                            <span className="opacity-70 text-[9px]">({gt.categoria_servicio})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensaje de WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Mensaje de WhatsApp</label>
                  <span className="text-[9px] text-gray-400">Usa {"{nombre}"} para personalizar</span>
                </div>
                <textarea
                  rows={4}
                  value={formMensaje}
                  onChange={e => setFormMensaje(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-dark-border rounded-xl text-gray-800 dark:text-gray-200 leading-relaxed focus:outline-cyan-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={saveLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CREAR NUEVA REGLA (CON PLANTILLAS PREDEFINIDAS) ── */}
      {isNewRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-black">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900 dark:text-white">
                    Nueva Regla de Retoque
                  </h3>
                  <p className="text-xs text-gray-500">Crea o elige una plantilla recomendada de salón</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRuleModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Plantillas Rápidas Recomendadas */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-gray-400">
                ⚡ Plantillas Recomendadas de Salón (1 Clic):
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(PRESET_CATEGORIES).map(([cat, items]) =>
                  items.map(preset => (
                    <button
                      key={preset.nombre}
                      type="button"
                      onClick={() => {
                        setFormServicio(preset.nombre);
                        setFormKeywords(preset.keywords);
                        setFormDiasMin(preset.dias_min);
                        setFormDiasMax(preset.dias_max);
                        setFormEmoji(preset.emoji);
                        setFormMensaje(
                          `¡Hola {nombre}! ✨ Ya es momento de tu ${preset.nombre}. ¿Qué día de esta semana te gustaría agendar? 🗓️`
                        );
                      }}
                      className="px-2 py-1 bg-gray-50 dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-gray-200 dark:border-dark-border hover:border-cyan-400 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 transition cursor-pointer"
                    >
                      {preset.emoji} {preset.nombre} ({preset.dias_min}-{preset.dias_max}d)
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs pt-2 border-t border-gray-100 dark:border-dark-border">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre del Servicio</label>
                <input
                  type="text"
                  placeholder="Ej: Base Rubber o Retoque Acrílicas"
                  value={formServicio}
                  onChange={e => setFormServicio(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-dark-border rounded-xl font-bold text-gray-900 dark:text-white focus:outline-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                  Palabras Clave en Agenda (Separadas por comas)
                </label>
                <input
                  type="text"
                  placeholder="rubber, nivelacion, kapping..."
                  value={formKeywords}
                  onChange={e => setFormKeywords(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-dark-border rounded-xl font-mono text-gray-800 dark:text-gray-200 focus:outline-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40">
                <div>
                  <label className="block text-[10px] font-black uppercase text-cyan-800 dark:text-cyan-300 mb-1">
                    Días Mínimos
                  </label>
                  <input
                    type="number"
                    value={formDiasMin}
                    onChange={e => setFormDiasMin(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-dark-card border border-cyan-200 dark:border-cyan-800 rounded-lg font-black text-cyan-900 dark:text-cyan-100 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-cyan-800 dark:text-cyan-300 mb-1">
                    Días Máximos
                  </label>
                  <input
                    type="number"
                    value={formDiasMax}
                    onChange={e => setFormDiasMax(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-dark-card border border-cyan-200 dark:border-cyan-800 rounded-lg font-black text-cyan-900 dark:text-cyan-100 text-center"
                  />
                </div>
              </div>

              {/* Variaciones Globales del SuperAdmin (1 Clic) */}
              {globalTemplates.length > 0 && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-cyan-500" />
                      Variaciones Globales SuperAdmin ({globalTemplates.length})
                    </span>
                    <span className="text-[9px] text-gray-500 dark:text-gray-400">
                      Toca para autorellenar copy
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {globalTemplates.map(gt => {
                      const isApplied = formMensaje.trim() === gt.contenido.trim();
                      return (
                        <button
                          key={gt.id}
                          type="button"
                          onClick={() => {
                            setFormMensaje(gt.contenido);
                            if (gt.categoria_servicio && !formServicio) {
                              setFormServicio(gt.categoria_servicio);
                              setFormKeywords(gt.categoria_servicio.toLowerCase());
                            }
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition flex items-center gap-1 cursor-pointer border ${
                            isApplied
                              ? 'bg-cyan-500 text-white border-cyan-600 shadow-xs'
                              : 'bg-white dark:bg-dark-card text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-border hover:border-cyan-400'
                          }`}
                        >
                          {isApplied && <Check size={11} />}
                          <span>{gt.titulo || gt.tiempo}</span>
                          {gt.categoria_servicio && (
                            <span className="opacity-70 text-[9px]">({gt.categoria_servicio})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mensaje de WhatsApp</label>
                <textarea
                  rows={4}
                  value={formMensaje}
                  onChange={e => setFormMensaje(e.target.value)}
                  placeholder="¡Hola {nombre}! ✨ Ya es momento de tu retoque..."
                  className="w-full p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-dark-border rounded-xl text-gray-800 dark:text-gray-200 leading-relaxed focus:outline-cyan-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setIsNewRuleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreateRule}
                disabled={saveLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {saveLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Crear Regla</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetoquesMantenimientosManager;
