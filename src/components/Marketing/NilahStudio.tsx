import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Download, RotateCcw, Image as ImageIcon,
  Loader2, Check, ChevronRight, Send, RefreshCw, Save,
  Wand2, Zap, Heart, Crown, Leaf, Star
} from 'lucide-react';
import { campaigns } from '../../services/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface GeneratedAsset {
  imagen_url: string;
  prompt_usado?: string;
  creado_en?: string;
}

interface NilahStudioProps {
  isOpen: boolean;
  onClose: () => void;
  campanaId?: number;
  campanaTitle?: string;
  onSaved?: (imageUrl: string) => void;
}

// ─────────────────────────────────────────────
// Chip Options
// ─────────────────────────────────────────────
const ESTILOS = [
  { id: 'elegante', label: 'Elegante', icon: Crown, color: 'from-violet-500 to-purple-700' },
  { id: 'glamour', label: 'Glamour', icon: Star, color: 'from-pink-500 to-rose-600' },
  { id: 'organico', label: 'Orgánico', icon: Leaf, color: 'from-emerald-500 to-teal-600' },
  { id: 'vip_noche', label: 'VIP Noche', icon: Crown, color: 'from-amber-500 to-orange-600' },
  { id: 'romantico', label: 'Romántico', icon: Heart, color: 'from-red-400 to-rose-500' },
  { id: 'moderno', label: 'Moderno', icon: Zap, color: 'from-blue-500 to-cyan-600' },
];

const SERVICIOS = [
  { id: 'unas', label: '💅 Uñas', descripcion: 'nail art, manicura' },
  { id: 'cabello', label: '💇 Cabello', descripcion: 'balayage, coloración' },
  { id: 'spa', label: '💆 Spa Facial', descripcion: 'tratamiento facial' },
  { id: 'pestanas', label: '👁 Pestañas', descripcion: 'extensiones, lifting' },
  { id: 'cejas', label: '✨ Cejas', descripcion: 'microblading, diseño' },
  { id: 'maquillaje', label: '💄 Maquillaje', descripcion: 'makeup artístico' },
];

const FORMATOS = [
  { id: 'historia', label: 'Historia', ratio: '9:16', icon: '📱' },
  { id: 'post', label: 'Post Cuadrado', ratio: '1:1', icon: '🖼' },
];

const LOADING_MESSAGES = [
  'Mezclando los colores perfectos...',
  'Ajustando la iluminación...',
  'Pintando con acuarela digital...',
  'Estampando tu marca...',
  'Aplicando los toques finales...',
  '¡Casi lista la obra maestra!',
];

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const NilahStudio: React.FC<NilahStudioProps> = ({
  isOpen,
  onClose,
  campanaId,
  campanaTitle,
  onSaved,
}) => {
  const [selectedEstilo, setSelectedEstilo] = useState<string>('elegante');
  const [selectedServicio, setSelectedServicio] = useState<string>('unas');
  const [selectedFormato, setSelectedFormato] = useState<string>('historia');
  const [promptExtra, setPromptExtra] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  const [historial, setHistorial] = useState<GeneratedAsset[]>([]);
  const [iterPrompt, setIterPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const loadingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startLoadingMessages = () => {
    let index = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    loadingInterval.current = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[index]);
    }, 2500);
  };

  const stopLoadingMessages = () => {
    if (loadingInterval.current) clearInterval(loadingInterval.current);
    setLoadingMsg('');
  };

  const handleGenerate = useCallback(async (extraPrompt?: string) => {
    setIsGenerating(true);
    setSaved(false);
    startLoadingMessages();
    try {
      const result = await campaigns.generateVisual({
        estilo: selectedEstilo,
        servicio: selectedServicio,
        formato: selectedFormato,
        promptExtra: extraPrompt || promptExtra || undefined,
        campana_id: campanaId,
      });

      const asset: GeneratedAsset = {
        imagen_url: (result as any)?.imagen_url || (result as any)?.data?.imagen_url,
        prompt_usado: (result as any)?.prompt_usado,
        creado_en: new Date().toISOString(),
      };

      if (asset.imagen_url) {
        setHistorial(prev => [asset, ...prev].slice(0, 5));
        setCurrentAsset(asset);
        setIterPrompt('');
      }
    } catch (err) {
      console.error('Error generando imagen:', err);
    } finally {
      stopLoadingMessages();
      setIsGenerating(false);
    }
  }, [selectedEstilo, selectedServicio, selectedFormato, promptExtra, campanaId]);

  const handleIterate = async () => {
    if (!iterPrompt.trim()) return;
    await handleGenerate(iterPrompt);
  };

  const handleDownload = async () => {
    if (!currentAsset?.imagen_url) return;
    try {
      const response = await fetch(currentAsset.imagen_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nilah-studio-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(currentAsset.imagen_url, '_blank');
    }
  };

  const handleSaveToCampaign = async () => {
    if (!currentAsset?.imagen_url || !onSaved) return;
    setIsSaving(true);
    try {
      onSaved(currentAsset.imagen_url);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 flex flex-col overflow-hidden rounded-t-3xl md:rounded-2xl md:inset-4 md:inset-y-6"
            style={{ background: 'linear-gradient(165deg, #0f0f14 0%, #13111f 40%, #0d1117 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-pink-600/8 blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative flex shrink-0 items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg shadow-violet-500/30">
                  <Wand2 size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Nilah Estudio Creativo</h2>
                  {campanaTitle && (
                    <p className="text-xs text-gray-500">Para: {campanaTitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content - Two column on MD+ */}
            <div className="relative flex flex-1 flex-col overflow-hidden md:flex-row">

              {/* Left Panel: Controls */}
              <div className="flex w-full flex-col gap-5 overflow-y-auto border-r border-white/5 p-5 md:w-80">

                {/* Estilo */}
                <div>
                  <label className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Vibra del Arte ✨
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ESTILOS.map(e => {
                      const Icon = e.icon;
                      const isSelected = selectedEstilo === e.id;
                      return (
                        <motion.button
                          key={e.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setSelectedEstilo(e.id)}
                          className={`relative flex items-center gap-2 overflow-hidden rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                            isSelected
                              ? 'text-white shadow-lg'
                              : 'bg-white/4 text-gray-400 hover:bg-white/8 hover:text-gray-200'
                          }`}
                        >
                          {isSelected && (
                            <div className={`absolute inset-0 bg-gradient-to-r ${e.color} opacity-25`} />
                          )}
                          {isSelected && (
                            <div className={`absolute inset-0 rounded-xl border bg-gradient-to-r ${e.color} opacity-40`}
                              style={{ borderWidth: 1, mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'xor' }}
                            />
                          )}
                          <Icon size={14} className="relative shrink-0" />
                          <span className="relative">{e.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Servicio */}
                <div>
                  <label className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Servicio 💅
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICIOS.map(s => (
                      <motion.button
                        key={s.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedServicio(s.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                          selectedServicio === s.id
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                        }`}
                      >
                        {s.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Formato */}
                <div>
                  <label className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Formato 📐
                  </label>
                  <div className="flex gap-2">
                    {FORMATOS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFormato(f.id)}
                        className={`flex flex-1 flex-col items-center gap-1 rounded-xl p-3 text-center text-xs transition-all ${
                          selectedFormato === f.id
                            ? 'bg-white/10 text-white ring-1 ring-white/20'
                            : 'bg-white/4 text-gray-500 hover:bg-white/8'
                        }`}
                      >
                        <span className="text-lg">{f.icon}</span>
                        <span className="font-medium">{f.label}</span>
                        <span className="opacity-60">{f.ratio}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Extra */}
                <div>
                  <label className="mb-2.5 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                    Detalles Adicionales (Opcional)
                  </label>
                  <textarea
                    value={promptExtra}
                    onChange={e => setPromptExtra(e.target.value)}
                    placeholder="Ej: Usa tonos dorados, incluye flores, fondo minimalista..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 outline-none transition-colors focus:border-violet-500/50 focus:bg-white/8"
                  />
                </div>

                {/* Generate button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="relative overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-bold text-white shadow-xl disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-white/10 to-violet-600/0 opacity-0 transition-opacity hover:opacity-100" />
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Generando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles size={16} />
                      ✨ Crear con Nilah IA
                    </span>
                  )}
                </motion.button>

                {/* Historial miniaturas */}
                {historial.length > 1 && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500">
                      Variaciones anteriores
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {historial.slice(1).map((asset, i) => (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentAsset(asset)}
                          whileHover={{ scale: 1.05 }}
                          className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5"
                        >
                          <img src={asset.imagen_url} alt="" className="h-full w-full object-cover" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Canvas */}
              <div className="relative flex flex-1 flex-col items-center justify-center p-5">
                <AnimatePresence mode="wait">

                  {/* Empty state */}
                  {!isGenerating && !currentAsset && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 text-center"
                    >
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/5">
                        <ImageIcon size={40} className="text-gray-700" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-400">Tu obra maestra aparecerá aquí</p>
                        <p className="mt-1 text-sm text-gray-600">Elige un estilo y servicio, luego pulsa ✨</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Loading state */}
                  {isGenerating && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-6 text-center"
                    >
                      <div className="relative flex h-32 w-32 items-center justify-center">
                        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
                        <div className="absolute inset-4 animate-spin rounded-full border-2 border-transparent border-t-pink-500" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                        <Sparkles className="text-violet-400" size={32} />
                      </div>
                      <motion.p
                        key={loadingMsg}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-[200px] text-sm font-medium text-gray-400"
                      >
                        {loadingMsg}
                      </motion.p>
                    </motion.div>
                  )}

                  {/* Image result */}
                  {!isGenerating && currentAsset && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 24 }}
                      className="flex w-full max-w-md flex-col gap-4"
                    >
                      {/* Image */}
                      <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-black/50">
                        <img
                          src={currentAsset.imagen_url}
                          alt="Imagen generada por Nilah"
                          className="w-full object-cover"
                        />
                        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleDownload}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/8 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15"
                        >
                          <Download size={15} />
                          Descargar
                        </button>
                        <button
                          onClick={() => handleGenerate()}
                          className="flex items-center justify-center gap-2 rounded-xl bg-white/8 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/15"
                        >
                          <RefreshCw size={15} />
                          Nueva
                        </button>
                        {onSaved && (
                          <button
                            onClick={handleSaveToCampaign}
                            disabled={isSaving || saved}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-70"
                          >
                            {saved ? <><Check size={15} /> Guardada</> : isSaving ? <><Loader2 size={15} className="animate-spin" /> Guardando...</> : <><Save size={15} /> Usar en Campaña</>}
                          </button>
                        )}
                      </div>

                      {/* Iteration input */}
                      <div className="flex gap-2 rounded-2xl border border-white/8 bg-white/4 p-1.5">
                        <input
                          type="text"
                          value={iterPrompt}
                          onChange={e => setIterPrompt(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleIterate()}
                          placeholder="¿Qué quieres cambiar? Ej: más oscura, con rosas..."
                          className="flex-1 bg-transparent px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 outline-none"
                        />
                        <button
                          onClick={handleIterate}
                          disabled={!iterPrompt.trim() || isGenerating}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white transition-all hover:bg-violet-700 disabled:opacity-40"
                        >
                          <Send size={15} />
                        </button>
                      </div>

                      <p className="text-center text-xs text-gray-600">
                        💡 Esta imagen está optimizada para Historias de Instagram y Estados de WhatsApp
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NilahStudio;
