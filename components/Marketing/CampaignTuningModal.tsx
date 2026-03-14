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
  const [step, setStep] = useState<'preview' | 'schedule'>('preview');
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
  const { clients } = useDashboardData();

  useEffect(() => {
    if (isOpen && idea) {
      setStep('preview');
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
      } else {
        setMessage(idea.mensaje || idea.mensaje_sugerido || '');
      }

      // Obtener descripción de la audiencia si hace falta
      const fetchDesc = async () => {
        if (!idea.audience_descripcion) {
          try {
            const result = await campaigns.getSmartAudiences(clients.length);
            const allAuds = [...result.crm, ...result.marketing];
            const targetId = idea.audience_id || idea.segmento;
            const found = allAuds.find((a: any) => a.id === targetId);
            if (found) {
              setAudienceDesc(found.descripcion);
            }
          } catch (e) {
            console.error("No se pudo obtener la descripcion de la audiencia", e);
          }
        } else {
          setAudienceDesc(idea.audience_descripcion);
        }
      };
      
      fetchDesc();
    }
  }, [isOpen, idea, clients.length]);

  if (!isOpen || !idea) return null;

  const derivedAudience = {
    id: idea.audience_id || idea.segmento || 'general',
    nombre: idea.audience_nombre || idea.segmento || 'General',
    descripcion: audienceDesc || idea.audience_descripcion || '',
    count: idea.clientesObjetivo || idea.clientes_objetivo || 0,
    icono: '👥'
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
        campaign_id: idea.id,
        audience: derivedAudience,
        message,
        scheduled_at: scheduleMode === 'later' ? scheduledAt : undefined,
      });
      setLaunched(true);
      setTimeout(() => {
        onClose();
        setLaunched(false);
      }, 1800);
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
                        onClick={handleGenerateAssetsClick}
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
                  </div>
                </motion.div>
              )}

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
                      <span className="text-xs text-gray-500">Segmento</span>
                      <span className="text-xs font-semibold text-violet-300">
                        {derivedAudience.icono} {derivedAudience.nombre}
                      </span>
                    </div>
                  </div>

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
                Decidir Envío
                <ChevronRight size={15} />
              </motion.button>
            </div>
          )}
          {step === 'schedule' && (
            <div className="flex-shrink-0 flex justify-center px-5 pb-3">
              <button
                onClick={() => setStep('preview')}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Volver al Mensaje
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CampaignTuningModal;
