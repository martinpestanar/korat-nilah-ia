import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Image as ImageIcon, Check, AlertCircle, Heart, MessageCircle, Send, Plus, Minus, Shield, ChevronDown, BookmarkCheck, Zap, FlipHorizontal } from 'lucide-react';
import api from '../../services/api';
import { supabase } from '../../services/supabase';

interface ImageGeneratorProps {
  campaignId?: string | number;
  copyText: string;
  audienceName: string;
  activeCampaign?: any;
  onOpenCampaignSelector?: () => void;
  onImageSelected: (imageUrl: string, prompt: string) => void;
  onGeneratingStateChange?: (isGenerating: boolean) => void;
  onSkip: () => void;
}

const MAX_VARIATIONS = 3;

const ESTILOS = [
  { id: 'Realista y Premium', label: 'Realista', icon: '📸' },
  { id: 'Minimalista', label: 'Minimal', icon: '✨' },
  { id: 'Ilustración Moderna', label: 'Ilustración', icon: '🎨' },
  { id: '3D y Vibrante', label: '3D Vibra', icon: '🧊' },
  { id: 'Editorial Glamour', label: 'Glamour', icon: '👠' }
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  campaignId,
  copyText,
  audienceName,
  activeCampaign,
  onOpenCampaignSelector,
  onImageSelected,
  onGeneratingStateChange,
  onSkip
}) => {
  // Core state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{url: string, prompt: string, emocion?: string, copyRedes?: string}[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);
  const [generatingProgress, setGeneratingProgress] = useState<{current: number; total: number} | null>(null);
  const [variationCount, setVariationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  // Business info
  const [businessName, setBusinessName] = useState<string>('Tu Salón');
  const [businessPhone, setBusinessPhone] = useState<string | null>(null);
  const [businessAddress, setBusinessAddress] = useState<string | null>(null);
  const [businessHours, setBusinessHours] = useState<string | null>(null);

  // Token System State
  const [destellos, setDestellos] = useState<number | null>(null);
  const [numImages, setNumImages] = useState<number>(1);

  // Creative State
  const [formato, setFormato] = useState<'1:1' | '9:16'>('1:1');
  const [modoSalida, setModoSalida] = useState<'imagen' | 'flyer'>('flyer');
  const [estilo, setEstilo] = useState<string>('Realista y Premium');
  const [promptExtra, setPromptExtra] = useState('');
  const [includeLogo, setIncludeLogo] = useState(false);

  // Structured Flyer State
  const [flyerTitulo, setFlyerTitulo] = useState('');
  const [flyerServicio, setFlyerServicio] = useState('');
  const [flyerPromo, setFlyerPromo] = useState('');
  const [flyerUrgencia, setFlyerUrgencia] = useState('');
  const [flyerCta, setFlyerCta] = useState('');
  const [flyerPrecio, setFlyerPrecio] = useState('');

  // Toggles
  const [includePhone, setIncludePhone] = useState(false);
  const [includeAddress, setIncludeAddress] = useState(false);
  const [includeHours, setIncludeHours] = useState(false);

  // Tuning
  const [magicInput, setMagicInput] = useState('');

  // ─── Fetch business name + destellos on mount ───
  useEffect(() => {
    const init = async () => {
      try {
        const businessId = localStorage.getItem('korat_business_id');
        const userStr = localStorage.getItem('korat_user');

        // Business name via brand-wizard (it returns full negocio data)
        if (businessId) {
          try {
            const bwData = await api.negocios.getBrandWizardAnswers();
            if (bwData?.nombre) setBusinessName(bwData.nombre);
          } catch {
            // fallback to localStorage if available
            const storedUser = userStr ? JSON.parse(userStr) : null;
            if (storedUser?.business_name) setBusinessName(storedUser.business_name);
          }
        }

        // Destellos balance
        if (userStr) {
          const user = JSON.parse(userStr);
          const balance = await api.tokens.getBalance(user.id);
          setDestellos(balance);
        }
      } catch (err) {
        console.error('[ImageGenerator] Init error:', err);
      }
    };
    init();
  }, []);

  // ─── Fetch contact info when flyer mode ───
  useEffect(() => {
    const fetchBusinessContact = async () => {
      try {
        const infoItems = await api.negocioInfo.getAll();
        if (infoItems && infoItems.length > 0) {
          const dataMap: Record<string, string> = {};
          infoItems.forEach((item: any) => { dataMap[item.clave] = item.valor_texto || ''; });

          if (dataMap.whatsapp) {
            setBusinessPhone(dataMap.whatsapp.replace(/^\+51\s*/, ''));
          }
          if (dataMap.ubicacion_contacto) setBusinessAddress(dataMap.ubicacion_contacto);
          if (dataMap.horarios) {
            setBusinessHours(dataMap.horarios);
          } else {
            const w = dataMap.horario_semana ? `Lun-Vie: ${dataMap.horario_semana}` : '';
            const s = dataMap.horario_sabado ? `Sáb: ${dataMap.horario_sabado}` : '';
            const d = dataMap.horario_domingo ? `Dom: ${dataMap.horario_domingo}` : '';
            const combined = [w, s, d].filter(Boolean).join(' | ');
            if (combined) setBusinessHours(combined);
          }
          // Also try to get business name from negocio_info
          if (dataMap.nombre_negocio) setBusinessName(dataMap.nombre_negocio);
        }
      } catch (err) {
        console.error('[ImageGenerator] Error fetching business contact:', err);
      }
    };
    if (modoSalida === 'flyer') fetchBusinessContact();
  }, [modoSalida]);

  const cost = numImages * 5;

  // ─── SAVE IMAGE TO GALLERY ───
  const saveToGallery = async (images: {url: string, prompt: string, emocion?: string, copyRedes?: string}[]) => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId || images.length === 0) return;
    setSavingImage(true);
    try {
      for (const img of images) {
        await supabase.rpc('save_creative_asset', {
          p_business_id: businessId,
          p_campaign_id: campaignId ? String(campaignId) : null,
          p_campaign_title: activeCampaign?.title || null,
          p_image_url: img.url,
          p_prompt_usado: img.prompt,
          p_copy_text: copyText || null,
          p_formato: formato,
          p_estilo: estilo,
          p_emocion: img.emocion || null,
          p_copy_redes: img.copyRedes || null,
          p_flyer_precio: modoSalida === 'flyer' ? flyerPrecio || null : null,
        });
      }
    } catch (err) {
      console.error('[ImageGenerator] Error saving to gallery:', err);
    } finally {
      setSavingImage(false);
    }
  };

  // ─── GENERATE IMAGE ───
  const generateImage = async (isVariation = false) => {
    if (variationCount >= MAX_VARIATIONS && isVariation) return;

    if (destellos !== null && destellos < cost) {
      setError(`No tienes suficientes Destellos. Necesitas ${cost} ✨ y tienes ${destellos} ✨.`);
      return;
    }

    setIsGenerating(true);
    if (onGeneratingStateChange) onGeneratingStateChange(true);
    setGeneratingProgress({ current: 0, total: numImages });
    setError(null);

    try {
      const userStr = localStorage.getItem('korat_user');
      const userId = userStr ? JSON.parse(userStr).id : null;

      if (userId) {
        const newBalance = await api.tokens.deduct(userId, cost);
        setDestellos(newBalance);
      }

      const finalPromptExtra = magicInput
        ? `${promptExtra ? promptExtra + '. ' : ''}Instrucción de la Directora de Arte: ${magicInput}`
        : promptExtra;

      // Get logo via SECURITY DEFINER RPC
      let businessLogoUrl: string | null = null;
      if (includeLogo) {
        try {
          const businessId = localStorage.getItem('korat_business_id');
          if (businessId) {
            const { data: logoFromRpc } = await supabase.rpc('get_negocio_logo', { p_business_id: businessId });
            if (logoFromRpc) {
              businessLogoUrl = logoFromRpc;
            } else {
              const { data: infoLogo } = await supabase
                .from('negocio_info').select('valor_texto')
                .eq('clave', 'logo_url').eq('business_id', businessId).maybeSingle();
              businessLogoUrl = infoLogo?.valor_texto || null;
            }
          }
          console.log('[ImageGenerator] logo_url resolved:', businessLogoUrl);
        } catch (err) {
          console.error('[ImageGenerator] Error fetching logo_url:', err);
        }
      }

      const newImages: {url: string, prompt: string, emocion?: string, copyRedes?: string}[] = [];

      for (let i = 0; i < numImages; i++) {
        setGeneratingProgress({ current: i + 1, total: numImages });
        const payload = {
          campaign_id: campaignId || null,
          copy_text: copyText,
          audience: audienceName,
          formato,
          modo_salida: modoSalida,
          estilo,
          flyer_titulo: modoSalida === 'flyer' ? flyerTitulo : '',
          flyer_servicio: modoSalida === 'flyer' ? flyerServicio : '',
          flyer_precio: modoSalida === 'flyer' ? flyerPrecio : '',
          flyer_promo: modoSalida === 'flyer' ? flyerPromo : '',
          flyer_urgencia: modoSalida === 'flyer' ? flyerUrgencia : '',
          flyer_cta: modoSalida === 'flyer' ? flyerCta : '',
          flyer_telefono: (modoSalida === 'flyer' && includePhone) ? businessPhone || '' : '',
          flyer_direccion: (modoSalida === 'flyer' && includeAddress) ? businessAddress || '' : '',
          flyer_horarios: (modoSalida === 'flyer' && includeHours) ? businessHours || '' : '',
          promptExtra: modoSalida === 'imagen' ? `${finalPromptExtra} --no text, no words, no fonts, no logos` : finalPromptExtra,
          variation_seed: Date.now() + i,
          include_logo: includeLogo,
          logo_url: businessLogoUrl,
          reference_image_url: isVariation && generatedImages.length > 0 ? generatedImages[selectedImageIdx].url : null,
        };
        try {
          const response = await api.campaigns.generateVisual(payload);
          if (response && response.imagen_url) {
            const imgEntry = {
              url: response.imagen_url,
              prompt: response.prompt_usado || '',
              emocion: response.emocion || undefined,
              copyRedes: response.copy_redes || undefined,
            };
            newImages.push(imgEntry);
            setGeneratedImages(prev => [...(i === 0 ? [] : prev), ...newImages.slice(i)]);
            if (i === 0) {
              setSelectedImageIdx(0);
              onImageSelected(response.imagen_url, response.prompt_usado || '');
            }
          }
        } catch (innerErr) {
          console.warn(`Imagen ${i + 1} falló, continuando...`, innerErr);
        }
      }

      if (newImages.length > 0) {
        setGeneratedImages(newImages);
        setSelectedImageIdx(0);
        setMagicInput('');
        if (isVariation) setVariationCount(prev => prev + 1);
        // Auto-save to gallery
        await saveToGallery(newImages);
      } else {
        throw new Error('No se pudo generar ninguna imagen. Revisa tu flujo de n8n.');
      }
    } catch (err: any) {
      console.error('Error al generar imagen:', err);
      setError(err.message || 'Ocurrió un error al generar la imagen. Intenta de nuevo.');
    } finally {
      setIsGenerating(false);
      if (onGeneratingStateChange) onGeneratingStateChange(false);
      setGeneratingProgress(null);
    }
  };

  const handleConfirm = async () => {
    const currentImage = generatedImages[selectedImageIdx];
    if (currentImage) {
      onImageSelected(currentImage.url, currentImage.prompt);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  // ─── INSTAGRAM PREVIEW MOCKUP — Dynamic salon name & format-aware ───
  const renderInstagramMockup = (imageUrl: string | null, isLocalGenerating: boolean = false) => {
    const isStory = formato === '9:16';
    const emocion = generatedImages[selectedImageIdx]?.emocion;

    return (
      <div className={`bg-white dark:bg-[#1a1f2e] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 transition-all duration-300 ${isStory ? 'max-w-[220px]' : 'max-w-sm'} w-full mx-auto`}>
        {/* IG Header */}
        <div className="flex items-center p-2.5 border-b border-gray-100 dark:border-white/5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px] flex-shrink-0">
            <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-full border border-white dark:border-black" />
          </div>
          <div className="ml-2 min-w-0">
            <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate leading-tight">
              {businessName.toLowerCase().replace(/\s+/g, '_')}
            </p>
            <p className="text-[9px] text-gray-400 leading-tight">Publicidad · hace 2m</p>
          </div>
        </div>

        {/* Image / Skeleton */}
        <div className={`relative bg-gray-100 dark:bg-black/50 flex items-center justify-center ${isStory ? 'aspect-[9/16]' : 'aspect-square'} w-full overflow-hidden`}>
          {isLocalGenerating || !imageUrl ? (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-pink-900/20 animate-pulse flex flex-col items-center justify-center text-center p-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 mb-3"
              />
              <p className="text-[10px] font-bold text-violet-300">Diseñando para Instagram...</p>
              <p className="text-[9px] text-gray-500 mt-1">Nilah IA está aplicando la magia ✨</p>
            </div>
          ) : (
            <img src={imageUrl} alt="Preview IG" className="w-full h-full object-cover" />
          )}
        </div>

        {/* IG Actions + Caption */}
        <div className="p-2.5 bg-white dark:bg-[#1a1f2e]">
          <div className="flex gap-3 mb-1.5">
            <Heart size={17} className="text-gray-700 dark:text-white" />
            <MessageCircle size={17} className="text-gray-700 dark:text-white" />
            <Send size={17} className="text-gray-700 dark:text-white" />
          </div>
          <p className="text-[10px] text-gray-900 dark:text-white line-clamp-2">
            <span className="font-bold">{businessName.toLowerCase().replace(/\s+/g, '_')}</span>{' '}
            {flyerTitulo ? `${flyerTitulo} — ` : ''}{copyText || 'Tu campaña aquí'}
          </p>
        </div>

      </div>
    );
  };

  // ─── MAIN RENDER ───
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">

      {/* ─── PREVIEW AREA ─── */}
      <div className="relative flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-[#111320] dark:to-[#0a0a0f] min-h-[320px]">
        {/* Token Balance */}
        <div className="absolute top-3 right-3 bg-white/80 dark:bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 dark:border-white/20 flex items-center gap-1.5 z-10 shadow-sm">
          <Sparkles size={12} className="text-yellow-500 dark:text-yellow-400" />
          <span className="text-[11px] font-bold text-gray-800 dark:text-white">{destellos !== null ? destellos : '...'} Destellos</span>
        </div>

        {/* Save Success Toast */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/30 border border-emerald-400/30"
            >
              <BookmarkCheck size={16} />
              <span className="text-sm font-bold">¡Imagen guardada en tu Galería!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center pt-4"
            >
              {renderInstagramMockup(null, true)}
              {generatingProgress && generatingProgress.total > 1 && (
                <div className="mt-3 text-center">
                  <p className="text-xs font-bold text-violet-300">
                    Creando imagen {generatingProgress.current} de {generatingProgress.total}...
                  </p>
                  <div className="flex gap-1.5 justify-center mt-2">
                    {Array.from({ length: generatingProgress.total }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all ${i < generatingProgress.current ? 'bg-violet-500 w-8' : 'bg-white/20 w-6'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : generatedImages.length > 0 ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center pb-2"
            >
              {/* Main IG Mockup */}
              {renderInstagramMockup(generatedImages[selectedImageIdx].url, false)}

              {/* Emocion Card (standalone) — shows below the mockup if emocion exists */}
              {generatedImages[selectedImageIdx]?.emocion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-3 w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-violet-200/50 dark:border-violet-500/20"
                >
                  <div className="bg-gradient-to-r from-violet-500/15 via-pink-500/10 to-amber-400/10 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-500 to-pink-500 flex items-center justify-center">
                        <Zap size={12} className="text-white" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Emoción que evoca en tu audiencia</p>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed font-medium italic pl-8">
                      "{generatedImages[selectedImageIdx].emocion}"
                    </p>
                  </div>
                </motion.div>
              )}

              {/* copy_redes Card — listo para pegar en redes sociales */}
              {generatedImages[selectedImageIdx]?.copyRedes && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mt-3 w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-sky-200/50 dark:border-sky-500/20"
                >
                  <div className="bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-teal-400/10 px-4 py-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center">
                          <MessageCircle size={12} className="text-white" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Copy para Redes</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedImages[selectedImageIdx].copyRedes!);
                        }}
                        className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/20 px-2 py-1 rounded-full hover:bg-sky-200 dark:hover:bg-sky-500/40 transition-colors"
                      >
                        Copiar 📋
                      </button>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-100 leading-relaxed pl-8 whitespace-pre-wrap">
                      {generatedImages[selectedImageIdx].copyRedes}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Multi-Image Strip (Modern UI) */}
              {generatedImages.length > 1 && (
                <div className="mt-3 w-full max-w-sm mx-auto">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2 text-center">
                    {generatedImages.length} variaciones — elige la mejor
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
                    {generatedImages.map((img, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          setSelectedImageIdx(idx);
                          onImageSelected(img.url, img.prompt);
                        }}
                        className={`relative flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedImageIdx === idx
                            ? 'border-violet-500 shadow-lg shadow-violet-500/40 ring-2 ring-violet-400/30'
                            : 'border-gray-200 dark:border-white/10 opacity-60 hover:opacity-90'
                        } ${formato === '9:16' ? 'w-12 h-20' : 'w-16 h-16'}`}
                      >
                        <img src={img.url} className="w-full h-full object-cover" alt={`Variación ${idx + 1}`} />
                        {selectedImageIdx === idx && (
                          <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                            <Check size={14} className="text-white drop-shadow" />
                          </div>
                        )}
                        <div className="absolute bottom-0.5 left-0.5 right-0.5 text-center">
                          <span className="text-[8px] font-bold text-white drop-shadow-lg bg-black/40 px-1 rounded">{idx + 1}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center max-w-[260px] py-10"
            >
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-100 to-pink-100 dark:from-violet-500/10 dark:to-pink-500/10 flex items-center justify-center mb-4 border border-violet-200 dark:border-white/5 shadow-sm">
                <Sparkles size={24} className="text-violet-500 dark:text-violet-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">Editor Listo</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-widest font-semibold">
                Configura tu primer diseño abajo
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-2 items-start shrink-0">
          <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* ─── EDITOR & CONTROLS ─── */}
      <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a0a0f] shrink-0">

        {/* ═══ PRE-GENERATION ═══ */}
        {generatedImages.length === 0 && !isGenerating ? (
          <div className="space-y-4">

            {/* 1. Campaign Selector */}
            <div>
              <label className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-2 block animate-pulse">
                1. Contexto de la Campaña (Requerido)
              </label>
              <button
                onClick={onOpenCampaignSelector}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  activeCampaign
                    ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500/50 shadow-md shadow-violet-500/10'
                    : 'bg-white dark:bg-black/20 border-violet-300 dark:border-violet-500/40 border-dashed hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${activeCampaign ? 'bg-violet-200 dark:bg-violet-500/30' : 'bg-gray-100 dark:bg-white/5'}`}>
                    {activeCampaign ? '📃' : '🎯'}
                  </div>
                  <div className="text-left min-w-0">
                    {activeCampaign ? (
                      <>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{activeCampaign.title}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">Audiencia: {activeCampaign.audience}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-violet-700 dark:text-violet-300">Vincular a una Campaña</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">Obligatorio para dar contexto al asistente</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {activeCampaign && <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-white/10 px-2 py-1 rounded-md">Cambiar</span>}
                  <ChevronDown size={15} className={activeCampaign ? 'text-violet-500' : 'text-gray-400'} />
                </div>
              </button>
            </div>

            {/* 2. Format */}
            <div className={`transition-opacity duration-300 ${!activeCampaign ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2 block">2. Formato de Imagen</label>
              <div className="flex gap-2">
                {[
                  { id: '1:1', label: 'Post Cuadrado', subtitle: 'Instagram Feed', icon: '📱' },
                  { id: '9:16', label: 'Story / Reel', subtitle: 'Formato vertical', icon: '📏' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormato(f.id as any)}
                    className={`flex-1 flex flex-col items-center p-2.5 rounded-2xl border transition-all ${
                      formato === f.id
                        ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500/50 shadow-md shadow-violet-500/10'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl mb-1">{f.icon}</span>
                    <span className={`text-xs font-bold ${formato === f.id ? 'text-violet-700 dark:text-violet-200' : 'text-gray-600 dark:text-gray-300'}`}>{f.label}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{f.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Estilo */}
            <div className={`transition-opacity duration-300 ${!activeCampaign ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2 block">3. Estilo Visual</label>
              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {ESTILOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setEstilo(s.id)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border transition-all ${
                      estilo === s.id
                        ? 'border-pink-500/50 bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300 shadow-md shadow-pink-500/10'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-xs font-bold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Propósito Visual */}
            <div className={`transition-opacity duration-300 ${!activeCampaign ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-2 block">4. Propósito Visual</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setModoSalida('imagen')}
                  className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
                    modoSalida === 'imagen'
                      ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500/50'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🖼️</span>
                    <span className={`text-xs font-bold leading-tight ${modoSalida === 'imagen' ? 'text-violet-700 dark:text-violet-200' : 'text-gray-600 dark:text-gray-300'}`}>Solo Imagen</span>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Limpia, alta calidad estética (sin texto).</span>
                </button>
                <button
                  onClick={() => setModoSalida('flyer')}
                  className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
                    modoSalida === 'flyer'
                      ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500/50'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🏷️</span>
                    <span className={`text-xs font-bold leading-tight ${modoSalida === 'flyer' ? 'text-violet-700 dark:text-violet-200' : 'text-gray-600 dark:text-gray-300'}`}>Promocional</span>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Espacio diseñado para texto publicitario.</span>
                </button>
              </div>

              {/* Flyer Builder */}
              <AnimatePresence>
                {modoSalida === 'flyer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-500/10 dark:to-pink-500/5 rounded-2xl border border-violet-100 dark:border-violet-500/20 p-4 mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-violet-500 dark:text-violet-400" />
                        <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300">Estructura del Flyer</h4>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                        Si dejas vacíos los campos, Nilah IA creará los textos por ti basándose en tu campaña.
                      </p>
                      <div className="space-y-2.5">
                        {[
                          { label: 'Titular (Hook)', val: flyerTitulo, set: setFlyerTitulo, ph: 'Ej. TU MEJOR VERSIÓN' },
                          { label: 'Servicio / Oferta', val: flyerServicio, set: setFlyerServicio, ph: 'Ej. Pestañas Volumen 2D' },
                        ].map(f => (
                          <div key={f.label}>
                            <label className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1 block">{f.label}</label>
                            <input type="text" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-xs text-gray-800 dark:text-white outline-none focus:border-violet-500/50"
                            />
                          </div>
                        ))}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1 block">Promo</label>
                            <input type="text" value={flyerPromo} onChange={e => setFlyerPromo(e.target.value)} placeholder="Ej. 50% OFF"
                              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-xs text-gray-800 dark:text-white outline-none focus:border-violet-500/50"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1 block">Urgencia</label>
                            <input type="text" value={flyerUrgencia} onChange={e => setFlyerUrgencia(e.target.value)} placeholder="Ej. Solo este mes"
                              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-xs text-gray-800 dark:text-white outline-none focus:border-violet-500/50"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-1 block">CTA</label>
                          <input type="text" value={flyerCta} onChange={e => setFlyerCta(e.target.value)} placeholder="Ej. Reserva por WhatsApp"
                            className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-xs text-gray-800 dark:text-white outline-none focus:border-violet-500/50"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1 block">
                            <span>💰</span> Precio (Opcional)
                          </label>
                          <input type="text" value={flyerPrecio} onChange={e => setFlyerPrecio(e.target.value)} placeholder="Ej. S/ 89 · Antes: S/ 120"
                            className="w-full rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-white dark:bg-black/20 px-3 py-2 text-xs text-gray-800 dark:text-white outline-none focus:border-emerald-500/50 font-semibold"
                          />
                          <p className="text-[9px] text-gray-400 mt-1 pl-1">Nilah IA lo resaltará visualmente en el flyer.</p>
                        </div>
                      </div>

                      {/* Contact Toggles */}
                      <div className="mt-3 pt-3 border-t border-violet-200/50 dark:border-white/10">
                        <label className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest mb-2.5 block">Datos de Contacto</label>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Teléfono / WhatsApp', val: businessPhone, checked: includePhone, set: setIncludePhone },
                            { label: 'Dirección', val: businessAddress, checked: includeAddress, set: setIncludeAddress },
                            { label: 'Horarios de Atención', val: businessHours, checked: includeHours, set: setIncludeHours },
                          ].map(t => (
                            <label key={t.label} className="flex items-center gap-3 p-2 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-violet-200 dark:hover:border-violet-500/30">
                              <input type="checkbox" checked={t.checked} onChange={e => t.set(e.target.checked)} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block truncate">{t.label}</span>
                                <span className="text-[10px] text-gray-500 block truncate">{t.val || 'No configurado'}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quantity */}
            <div className={`flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 ${!activeCampaign ? 'opacity-40 pointer-events-none' : ''}`}>
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Cantidad a generar</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Más opciones para elegir la mejor.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setNumImages(Math.max(1, numImages - 1))} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-colors">
                  <Minus size={13} />
                </button>
                <span className="text-base font-bold text-gray-800 dark:text-white w-4 text-center">{numImages}</span>
                <button onClick={() => setNumImages(Math.min(3, numImages + 1))} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white transition-colors">
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Logo Option */}
            <button
              onClick={() => setIncludeLogo(!includeLogo)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${!activeCampaign ? 'opacity-40 pointer-events-none ' : ''}${
                includeLogo
                  ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500/50 text-violet-700 dark:text-violet-300'
                  : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="text-left">
                <p className={`text-xs font-bold ${includeLogo ? 'text-violet-700 dark:text-violet-200' : 'text-gray-600 dark:text-gray-300'}`}>
                  🏢 Añadir Logo del Salón
                </p>
                <p className="text-[10px] mt-0.5 opacity-70">
                  {includeLogo ? 'Logo superpuesto en la imagen (vía n8n)' : 'El logo se pondrá sobre la imagen'}
                </p>
              </div>
              <div className={`w-10 h-5 rounded-full flex items-center transition-all ${includeLogo ? 'bg-violet-500 justify-end' : 'bg-gray-300 dark:bg-white/10 justify-start'} p-0.5`}>
                <div className="w-4 h-4 rounded-full bg-white shadow" />
              </div>
            </button>

            {/* Generate Button */}
            <button
              onClick={() => generateImage(false)}
              disabled={!activeCampaign}
              className={`w-full py-3.5 mt-1 rounded-2xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
                activeCampaign
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-violet-500/25 hover:opacity-90 active:scale-[0.98]'
                  : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed shadow-none'
              }`}
            >
              <Sparkles size={16} />
              {activeCampaign ? `Generar (${cost} ✨)` : 'Selecciona una campaña primero'}
            </button>
            <button onClick={onSkip} className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              Omitir imagen (usaré una propia)
            </button>
          </div>
        ) : null}

        {/* ═══ POST-GENERATION TUNING ═══ */}
        {generatedImages.length > 0 && !isGenerating ? (
          <div className="space-y-4">

            {/* Magic Chat */}
            <div className="border-b border-gray-200 dark:border-white/10 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-violet-600 dark:text-violet-300 flex items-center gap-2">
                  <Sparkles size={14} /> Afinamiento Mágico
                </h4>
                <span className="bg-violet-100/50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Modo Edición ✨</span>
              </div>

              <div className="relative mb-4 bg-gray-50/50 dark:bg-black/40 p-3.5 rounded-2xl border border-violet-200 dark:border-violet-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg border border-white/20">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">Nilah (Directora de Arte)</span>
                    <span className="text-[10px] text-green-500 dark:text-green-400 font-medium">En línea</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-[#111320]/80 p-3 rounded-xl rounded-tl-none border border-gray-100 dark:border-white/5 mb-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    ¡Quedó genial! ¿Quieres cambiar algo? Dime el color, el fondo, o cualquier elemento.
                  </p>
                </div>

                {/* Quick Chips */}
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2 mb-2">
                  {[
                    { label: '👩‍🦰 Cabello Rojo', val: 'Haz el cabello rojo' },
                    { label: '🛋️ Fondo Lujo', val: 'Cambia el fondo a un living de lujo' },
                    { label: `📐 ${formato === '1:1' ? 'Story (9:16)' : 'Post (1:1)'}`, action: () => setFormato(formato === '1:1' ? '9:16' : '1:1') },
                  ].map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => chip.action ? chip.action() : setMagicInput(chip.val!)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-600 dark:text-violet-200 hover:bg-violet-500/30 transition-all"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={magicInput}
                    onChange={e => setMagicInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && generateImage(true)}
                    placeholder="Escribe tu petición mágica..."
                    className="flex-1 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-violet-500 transition-all"
                  />
                  <button
                    onClick={() => generateImage(true)}
                    disabled={variationCount >= MAX_VARIATIONS}
                    className="w-11 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={15} className="text-white ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Style Switcher */}
              <div>
                <label className="text-[10px] text-gray-500 dark:text-gray-400 block mb-2 font-bold uppercase">Probar otro Estilo</label>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {ESTILOS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setEstilo(s.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                        estilo === s.id
                          ? 'border-violet-500/50 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                          : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs">{s.icon}</span>
                      <span className="text-[10px] font-bold">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rounds counter */}
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Rondas Mágicas: {variationCount} de {MAX_VARIATIONS}</span>
              <div className="flex gap-1">
                {Array.from({ length: MAX_VARIATIONS }).map((_, i) => (
                  <div key={i} className={`w-6 h-1 rounded-full ${i < variationCount ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'}`} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                onClick={handleConfirm}
                disabled={savingImage}
                className={`w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white text-sm font-bold shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] ${savingImage ? 'opacity-60' : ''}`}
              >
                {savingImage ? (
                  <><RefreshCw size={16} className="animate-spin" /> Guardando...</>
                ) : (
                  <><BookmarkCheck size={16} /> Guardar en Galería</>
                )}
              </button>
              <button
                onClick={() => {
                  setGeneratedImages([]);
                  setSelectedImageIdx(0);
                  setVariationCount(0);
                  setMagicInput('');
                  setError(null);
                }}
                className="w-full text-center py-1.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                ← Cancelar y crear otra imagen
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
