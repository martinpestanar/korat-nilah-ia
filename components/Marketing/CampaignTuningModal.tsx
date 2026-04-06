/**
 * CampaignTuningModal — "Tuning Studio"
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal premium para revisar y generar variaciones de Copy (Nivel 2).
 * La audiencia ya viene heredada del planificador mensual (Nivel 1).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Send, Loader2, Check,
  ChevronRight, MessageSquare, RefreshCw, ArrowRight, Zap,
  ChevronLeft, Users
} from 'lucide-react';
import { campaigns } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useNavigate } from 'react-router-dom';

interface WeeklyIdea {
  id?: number | string;
  semana: number;
  titulo: string;
  objetivo: string;
  segmento: string;
  mensaje?: string;
  mensaje_sugerido?: string;
  audience_id?: string;
  audience_nombre?: string;
  audience_descripcion?: string;
  variaciones_copy?: string[];
  [key: string]: any;
}

interface CampaignTuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: WeeklyIdea | null;
  businessId: string;
  onLaunch: (params: LaunchParams) => Promise<void>;
  onGenerateAssets?: (params: { campaign_id: number | string | undefined; audience: any }) => Promise<any>;
}

interface LaunchParams {
  campaign_id: number | string | undefined;
  audience: any;
  message: string;
  scheduled_at?: string;
  image_url?: string;
  image_prompt?: string;
  origen_campana?: string | number;
}

// ─── WhatsApp Preview ─────────────────────────────────────────────────────────

const WhatsAppBubble: React.FC<{ message: string; salonName?: string }> = ({ message, salonName = 'Tu Salón' }) => (
  <div className="flex flex-col gap-2 p-4 rounded-2xl bg-[#0b141a] overflow-hidden">
    <div className="flex items-center gap-2 pb-2 border-b border-white/8">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
        {salonName.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-xs font-semibold text-white">{salonName}</p>
        <p className="text-[10px] text-green-400">En línea</p>
      </div>
    </div>
    <div className="flex justify-start">
      <div className="relative max-w-[85%]">
        <div className="absolute -left-1.5 top-2 w-2 h-2 bg-[#202c33] rotate-45" />
        <div className="bg-[#202c33] rounded-xl rounded-tl-sm px-3 py-2.5 shadow">
          <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-line">
            {message || 'El mensaje de la campaña aparecerá aquí...'}
          </p>
          <p className="text-[10px] text-gray-500 text-right mt-1">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─── Benefit Options Removed ───────────────────────────────────────────────────

// ─── Main Component ───────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;

const CampaignTuningModal: React.FC<CampaignTuningModalProps> = ({
  isOpen,
  onClose,
  idea,
  businessId,
  onLaunch,
  onGenerateAssets
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'preview' | 'schedule' | 'success'>('preview');
  const [message, setMessage] = useState('');
  
  // Variations State
  const [variations, setVariations] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [generateAttempts, setGenerateAttempts] = useState(0);

  const [isLaunching, setIsLaunching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  
  const [audienceDesc, setAudienceDesc] = useState('');
  const [audienceInsight, setAudienceInsight] = useState<string | null>(null);
  const [audienceCount, setAudienceCount] = useState<number>(0);
  const [audienceId, setAudienceId] = useState<string>('general');
  const [audienceName, setAudienceName] = useState<string>('');
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(true);
  const { clients } = useDashboardData();

  useEffect(() => {
    if (isOpen && idea) {
      setIsLaunching(false);
      setLaunched(false);
      setScheduleMode('now');
      setScheduledAt('');
      setIsGenerating(false);

      const loadedVariations = idea.variaciones_copy && idea.variaciones_copy.length > 0 
        ? idea.variaciones_copy 
        : [];
      
      setVariations(loadedVariations);
      setCurrentIndex(loadedVariations.length > 0 ? loadedVariations.length - 1 : 0);
      setGenerateAttempts(loadedVariations.length > 0 ? loadedVariations.length : 0);

      // Si hay variaciones, auto-selecciona la última
      if (loadedVariations.length > 0) {
        setMessage(loadedVariations[loadedVariations.length - 1]);
        setStep('preview');
      } else {
        setMessage(idea.mensaje || idea.mensaje_sugerido || '');
        setStep('preview');
      }

      // Set initial audience state from what the caller passes in
      const initId = idea.audience_id || idea.segmento || 'general';
      const initName = idea.audience_nombre || '';
      setAudienceId(initId);
      setAudienceName(initName);
      const ideaCount = idea.clientesObjetivo || idea.clientes_objetivo || 0;
      setAudienceCount(ideaCount);
      setIsLoadingCount(true);

      // Mapa de normalización: traduce cualquier ID que la IA genere al ID estándar del frontend
      const SEGMENT_ALIAS_MAP: Record<string, string> = {
        // srv-cabello aliases
        'cabello_alto_ticket_infrecuente': 'srv-cabello',
        'cabello_alto_ticket': 'srv-cabello',
        'cabello_infrecuente': 'srv-cabello',
        'cabello_ltv_alto': 'srv-cabello',
        'cabello_frecuentes': 'srv-cabello',
        'cabello_premium': 'srv-cabello',
        'clientas_cabello': 'srv-cabello',
        'clientas_de_cabello': 'srv-cabello',
        'cabello': 'srv-cabello',
        // srv-cejas aliases
        'cejas_frecuencia_alta': 'srv-cejas',
        'cejas_frecuentes': 'srv-cejas',
        'clientas_cejas': 'srv-cejas',
        'clientas_de_cejas': 'srv-cejas',
        'cejas': 'srv-cejas',
        // srv-facial aliases
        'facial_reenganche_verano': 'srv-facial',
        'facial_recurrentes': 'srv-facial',
        'reenganche_facial': 'srv-facial',
        'clientas_facial': 'srv-facial',
        'clientas_de_facial': 'srv-facial',
        'facial': 'srv-facial',
        // srv-pestanas aliases
        'pestañas_activas_recientes': 'srv-pestanas',
        'pestanas_activas_recientes': 'srv-pestanas',
        'pestanas_frecuentes': 'srv-pestanas',
        'lifting_frecuente': 'srv-pestanas',
        'clientas_pestanas': 'srv-pestanas',
        'clientas_de_pestanas': 'srv-pestanas',
        'pestanas': 'srv-pestanas',
        // srv-manos aliases
        'clientas_unas': 'srv-manos',
        'clientas_de_manos': 'srv-manos',
        'manicure': 'srv-manos',
        'unas': 'srv-manos',
        // srv-pies aliases
        'clientas_pies': 'srv-pies',
        'clientas_de_pedicure': 'srv-pies',
        'pedicure': 'srv-pies',
        // mkt aliases
        'reactivacion': 'mkt-overdue',
        'retoques_vencidos': 'mkt-overdue',
        'riesgo_fuga': 'mkt-churn',
        'en_riesgo': 'mkt-churn',
        'early_adopters': 'mkt-early',
        'cazadoras_ofertas': 'mkt-discount',
        'dias_lentos': 'mkt-slowdays',
        'flexibles': 'mkt-slowdays',
        'primera_vez_facial': 'mkt-primera-vez-facial',
        // crm aliases
        'clientes_vip': 'crm-vip',
        'clientes_fieles': 'crm-fiel',
        'clientes_fieles_alto_valor': 'crm-fiel',
        'fidelizadas': 'crm-fiel',
        'clientes_regulares': 'crm-regular',
        'regulares': 'crm-regular',
        'clientes_casuales': 'crm-casual',
        'casuales': 'crm-casual',
        'clientes_nuevos': 'crm-nuevas',
        'nuevas': 'crm-nuevas',
        'nuevas_recientes': 'crm-nuevas-recientes',
        'ausentes': 'crm-30',
        'ausentes_30': 'crm-30',
        'perdidas': 'crm-perdidas',
        'clientes_perdidos': 'crm-perdidas',
        'embajadoras': 'crm-resenas',
        'resenas': 'crm-resenas',
      };

      // Obtener descripción y count de la audiencia — SIEMPRE forceRefresh=true
      // para evitar leer el caché de Supabase que puede estar desactualizado.
      const fetchAudienceData = async () => {
        try {
          // ⚡ forceRefresh=true: garantiza conteos en vivo (el caché puede tener 0)
          const result = await campaigns.getSmartAudiences(clients.length, true) as any;
          const allAuds = [
            ...(result.crm || []),
            ...(result.crm_extra || []),
            ...(result.marketing || []),
            ...(result.servicios || []),
          ];

          let rawId = idea.audience_id || idea.segmento || '';
          // Normalize using alias map
          let normalizedId = SEGMENT_ALIAS_MAP[rawId.toLowerCase()] || rawId;

          // 🔍 Fallback: if rawId is generic ('todas','general','') OR no match,
          // scan the idea title for any known audience ID
          const isGenericId = !rawId || rawId === 'todas' || rawId === 'general' || rawId === 'all';
          if (isGenericId) {
            const titleLower = (idea.titulo || '').toLowerCase();
            const knownIds = allAuds.map((a: any) => a.id as string);
            const foundInTitle = knownIds.find(id => titleLower.includes(id));
            if (foundInTitle) {
              rawId = foundInTitle;
              normalizedId = foundInTitle;
            }
          }

          console.log('[TuningModal] audience lookup:', { rawId, normalizedId, totalAuds: allAuds.length });

          // Try to match by ID, then by nombre
          const found = allAuds.find((a: any) =>
            a.id === normalizedId ||
            a.id === rawId ||
            a.nombre === rawId ||
            a.nombre === idea.audience_nombre
          );

          console.log('[TuningModal] found audience:', found ? `${found.id} — count ${found.count}` : 'NOT FOUND');

          if (found) {
            // Update the canonical ID and name from the real audience object
            setAudienceId(found.id);
            setAudienceName(found.nombre);
            setAudienceCount(found.count);
            if (!idea.audience_descripcion) setAudienceDesc(found.descripcion);
            if (found.insight) setAudienceInsight(found.insight);
          }
        } catch (e) {
          console.error("No se pudo obtener datos de la audiencia", e);
        } finally {
          setIsLoadingCount(false);
        }
        // Fallback: set description from idea if still empty
        if (idea.audience_descripcion) setAudienceDesc(idea.audience_descripcion);
      };

      
      fetchAudienceData();
    }
  }, [isOpen, idea, clients.length]);

  if (!isOpen || !idea) return null;

  // derivedAudience uses reactive state (audienceId/audienceName) that resolves correctly
  // after the async getSmartAudiences() lookup completes.
  const derivedAudience = {
    id: audienceId,
    nombre: audienceName || (isLoadingCount ? 'Cargando...' : 'Audiencia seleccionada'),
    descripcion: audienceDesc || idea.audience_descripcion || '',
    insight: audienceInsight || undefined,
    count: audienceCount,
    icono: '👥',
    contexto_adicional: idea.contexto_adicional
  };

  const handleGenerateAssetsClick = async () => {
    if (!onGenerateAssets || generateAttempts >= MAX_ATTEMPTS) return;
    setIsGenerating(true);
    try {
      const response = await onGenerateAssets({
        campaign_id: idea.id,
        audience: derivedAudience
      });

      // Extraer mensaje de n8n
      const newCopy = response?.mensaje || response?.ai_analysis?.mensaje || response?.mensaje_sugerido;
      
      if (newCopy) {
        setVariations(prev => {
          const updated = [...prev, newCopy];
          setCurrentIndex(updated.length - 1);
          return updated;
        });
        setMessage(newCopy);
        setGenerateAttempts(prev => prev + 1);
      } else {
        console.warn('La IA no devolvió un nuevo copy en el campo esperado', response);
      }
    } catch (err) {
      console.error('Error al generar activos AI:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCyclePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setMessage(variations[currentIndex - 1]);
    }
  };

  const handleCycleNext = () => {
    if (currentIndex < variations.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setMessage(variations[currentIndex + 1]);
    }
  };

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      await onLaunch({
        campaign_id: idea.campaign_id || idea.id,
        audience: derivedAudience,
        message,
        scheduled_at: scheduleMode === 'later' ? scheduledAt : undefined,
        origen_campana: idea.origen_campana || idea.campaign_id || idea.id || 'campana_manual'
      });
      setLaunched(true);
      setStep('success');
    } catch (err) {
      console.error('Error lanzando campaña:', err);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex flex-col items-center justify-end md:justify-center pointer-events-none md:p-4">
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative w-full max-w-md pointer-events-auto flex flex-col rounded-t-3xl md:rounded-3xl max-h-[93vh] overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(170deg, #0d0f1a 0%, #111320 100%)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle bar (mobile) */}
          <div className="flex-shrink-0 flex justify-center pt-2.5 pb-1 md:hidden">
            <div className="w-10 h-1 rounded-full bg-white/15" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 flex items-start justify-between px-5 pt-3 pb-2 border-b border-white/5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                  <Zap size={11} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                  Tuning Studio
                </span>
              </div>
              <h2 className="text-base font-bold text-white leading-snug line-clamp-2">
                {idea.titulo}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="ml-3 mt-0.5 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/6 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 hide-scrollbar">
            <AnimatePresence mode="wait">
              
              {/* ── STEP: Preview + Edit Message ───────────────────── */}
              {step === 'preview' && (
                <motion.div
                  key="step-preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Audience Locked Chip */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Audiencia:</span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
                      <Users size={12} className="text-violet-400" />
                      {derivedAudience.nombre}
                      {derivedAudience.count > 0 && <span className="opacity-60 font-normal">({derivedAudience.count} clientes)</span>}
                    </span>
                  </div>

                  {/* Variation Controls */}
                  {variations.length > 1 && (
                    <div className="flex items-center justify-between bg-white/5 rounded-xl p-1.5">
                      <button 
                        onClick={handleCyclePrev} 
                        disabled={currentIndex === 0}
                        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={16} className="text-gray-300" />
                      </button>
                      <span className="text-xs font-medium text-violet-300">
                        Variación {currentIndex + 1} de {variations.length}
                      </span>
                      <button 
                        onClick={handleCycleNext} 
                        disabled={currentIndex === variations.length - 1}
                        className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={16} className="text-gray-300" />
                      </button>
                    </div>
                  )}

                  {/* WhatsApp preview */}
                  <div>
                    <WhatsAppBubble message={message} />
                  </div>

                  {/* Editable textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        Editar mensaje
                      </p>
                      {generateAttempts > 0 && (
                        <p className="text-[10px] font-bold text-violet-400">
                          Intentos restantes: {MAX_ATTEMPTS - generateAttempts}
                        </p>
                      )}
                    </div>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-violet-500/50"
                      placeholder="Escribe el mensaje final..."
                    />
                    
                    {generateAttempts < MAX_ATTEMPTS && (
                      <button
                        onClick={() => {
                          // Change step explicitly to benefit to select a new one, OR just generate again.
                          // Actually, they already chose the benefit. If they want to change it, they can go back.
                          // Let's add a "Back to benefit" button next to this.
                          handleGenerateAssetsClick();
                        }}
                        disabled={isGenerating}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-violet-300 text-xs font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-violet-400" />
                            Generando magia...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={13} className="text-violet-400" />
                            Generar otra variación de Nilah
                          </>
                        )}
                      </button>
                    )}
                    
                    <div className="mt-3">
                      <button
                        onClick={() => setStep('schedule')}
                        disabled={!message}
                        className="w-full flex items-center justify-center gap-1 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Continuar <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

                  // STEP IMAGE MOVED TO DECOUPLED MODULE

              {/* ── STEP: Schedule & Launch ─────────────────────────── */}
              {step === 'schedule' && (
                <motion.div
                  key="step-schedule"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5 pb-2"
                >
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-4 space-y-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resumen</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Campaña</span>
                      <span className="text-xs font-semibold text-white line-clamp-1 max-w-[60%] text-right">{idea.titulo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Audiencia</span>
                      <span className="text-xs font-semibold text-violet-300">
                        {derivedAudience.icono} {derivedAudience.nombre}
                        {derivedAudience.count > 0 && <span className="ml-1 opacity-60">({derivedAudience.count} clientes)</span>}
                      </span>
                    </div>
                  </div>

                  {/* ── Audience Reach Banner ─────────────────────────── */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                          <Users size={17} className="text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest">Alcance estimado</p>
                          <p className="text-sm font-bold text-white leading-tight">
                            {isLoadingCount
                              ? <span className="text-gray-500 text-xs">Calculando...</span>
                              : <><span className="text-2xl font-black text-emerald-300">{derivedAudience.count}</span> personas</>
                            }
                          </p>
                        </div>
                      </div>
                      {!isLoadingCount && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Recibirán tu mensaje
                          </span>
                        </div>
                      )}
                    </div>
                    {!isLoadingCount && (
                      <p className="text-[10px] text-emerald-400/60 mt-2 leading-relaxed">
                        📣 {derivedAudience.nombre} · {derivedAudience.count} {derivedAudience.count === 1 ? 'cliente' : 'clientes'} en este segmento
                      </p>
                    )}
                  </motion.div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">¿Cuándo enviar?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'now', label: 'Ahora mismo', icon: '⚡️' },
                        { id: 'later', label: 'Programar', icon: '🕐' },
                      ].map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setScheduleMode(opt.id as 'now' | 'later')}
                          className={`flex flex-col items-center gap-1 p-3 rounded-2xl border text-sm font-semibold transition-all ${
                            scheduleMode === opt.id
                              ? 'bg-violet-500/15 border-violet-500/50 text-white'
                              : 'bg-white/4 border-white/8 text-gray-500 hover:bg-white/8'
                          }`}
                        >
                          <span className="text-xl">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {scheduleMode === 'later' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={e => setScheduledAt(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-200 outline-none focus:border-violet-500/50"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleLaunch}
                    disabled={isLaunching || launched || (scheduleMode === 'later' && !scheduledAt)}
                    className="w-full relative overflow-hidden rounded-2xl py-4 text-sm font-bold text-white shadow-xl disabled:opacity-60 transition-all"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity" />
                    {launched ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check size={18} />
                        ¡Campaña Programada!
                      </span>
                    ) : isLaunching ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Enviando a n8n...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Send size={16} />
                        {scheduleMode === 'now' ? 'Lanzar Campaña Ahora' : 'Programar Campaña'}
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP: Success ─────────────────────────── */}
              {step === 'success' && (
                <motion.div
                  key="step-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-6 space-y-6 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                    <Check size={40} className="text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">¡Campaña Lista!</h3>
                    <p className="text-sm text-gray-400 max-w-[280px] mx-auto">
                      {scheduleMode === 'later' 
                        ? 'Tu campaña quedó programada exitosamente y se enviará en la fecha indicada.' 
                        : 'Tu campaña fue lanzada exitosamente a la audiencia seleccionada.'}
                    </p>
                  </div>

                  <div className="w-full space-y-3 pt-4">
                    <button
                      onClick={() => navigate(`/nilah/app/creative?campaignId=${idea.id}&audience=${encodeURIComponent(derivedAudience.nombre)}`)}
                      className="w-full relative overflow-hidden rounded-2xl py-4 text-sm font-bold text-white shadow-xl transition-all"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity" />
                      <span className="flex items-center justify-center gap-2">
                        <span>✨</span>
                        Diseñar Flyers en Nilah Creative
                      </span>
                    </button>
                    
                    <button
                      onClick={onClose}
                      className="w-full py-3 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                    >
                      Terminar por ahora
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer CTAs */}
          {step === 'preview' && (
            <div className="flex-shrink-0 flex gap-2 px-5 pb-5 pt-2 border-t border-white/5 bg-gray-900/40">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('schedule')}
                disabled={!message}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-violet-500/25 hover:opacity-95 disabled:opacity-40 transition-all"
              >
                Siguiente: Confirmar Envío
                <ChevronRight size={15} />
              </motion.button>
            </div>
          )}
          {step === 'schedule' && (
            <div className="flex-shrink-0 flex justify-center px-5 pb-3 pt-2 border-t border-white/5 bg-gray-900/40 mt-auto">
               <button
                 onClick={() => setStep('preview')}
                 disabled={isLaunching}
                 className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
               >
                 ← Volver a Editar Mensaje
               </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CampaignTuningModal;
