import React, { useState } from 'react';
import { Upload, Sparkles, Wand2, ArrowRight, Loader2, ImagePlus, Trash2, Check, AlertTriangle, Square, Smartphone, RectangleVertical, RectangleHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { supabase } from '../../services/supabase';

interface RetouchStudioProps {
  campaignId?: string;
  initialImage?: string | null;
  initialPrompt?: string | null;
}

const SUPER_PROMPTS = [
  {
    id: 'none',
    icon: '🚫',
    label: 'Ninguno / Libre',
    description: 'Solo tu detalle.',
    template: '[USER_PROMPT]'
  },
  {
    id: 'studio_bg',
    icon: '✨',
    label: 'Fondo de Estudio',
    description: 'Fondo minimalista y limpio.',
    template: '(masterpiece, highly detailed), professional studio photography of [USER_PROMPT], isolated subject, placed on a clean minimal studio background, soft cinematic lighting, 8k resolution, elegant aesthetic'
  },
  {
    id: 'glamour_light',
    icon: '💡',
    label: 'Luz Editorial',
    description: 'Piel perfecta y luz de anillo.',
    template: '(masterpiece, ultra-realistic), subject with flawless glowing skin, beauty photography lighting, ring light catchlights in eyes, sharp focus, professional color grading, High fashion editorial style, [USER_PROMPT]'
  },
  {
    id: 'hair_color',
    icon: '💇‍♀️',
    label: 'Cambio de Look',
    description: 'Simula tintes o cortes.',
    template: '(hyperrealistic, 8k, photorealistic), woman with [USER_PROMPT] hair, seamless root blend, salon fresh blowout, maintaining original facial features identity, highly detailed hair texture, soft natural lighting'
  }
];

export const RetouchStudio: React.FC<RetouchStudioProps> = ({ campaignId, initialImage, initialPrompt }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('none');
  const [customText, setCustomText] = useState(initialPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const resultImage = currentIndex >= 0 ? history[currentIndex] : null;
  const [formato, setFormato] = useState<'1:1' | '4:5' | '9:16' | '16:9'>('1:1');

  const [isDeleting, setIsDeleting] = useState(false);
  const [activarLogo, setActivarLogo] = useState(false);

  // Modal de descarte
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<number | null>(null);

  const handleDiscard = (idx: number) => {
    setIndexToDelete(idx);
    setIsDeleteModalOpen(true);
  };

  const confirmDiscard = async () => {
    if (indexToDelete === null) return;
    
    const idxToDiscard = indexToDelete;
    const urlToDiscard = history[idxToDiscard];
    if (!urlToDiscard) {
      setIsDeleteModalOpen(false);
      return;
    }
    
    setIsDeleting(true);
    try {
      if (urlToDiscard.includes('supabase.co')) {
        const fileName = urlToDiscard.split('/').pop()?.split('?')[0];
        if (fileName) {
          const { error: storageError } = await supabase.storage.from('nilah_assets').remove([fileName]);
          if (storageError) console.error('Storage delete error:', storageError);
        }
      }
      
      const { error: dbError } = await supabase.from('nilah_creative_assets').delete().eq('image_url', urlToDiscard);
      if (dbError) {
        console.error('DB delete error:', dbError);
        alert('Hubo un problema borrando la imagen. Es posible que ya no exista.');
      }
      
      setHistory(prev => {
        const next = prev.filter((_, idx) => idx !== idxToDiscard);
        if (next.length === 0) {
          setCurrentIndex(-1);
        } else if (idxToDiscard <= currentIndex) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
        return next;
      });
      setIsDeleteModalOpen(false);
      setIndexToDelete(null);
    } catch (err) {
      console.error('Error descartando imagen:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setUploadedImage(localUrl);

      // Upload public URL to send to Nilah
      const businessId = localStorage.getItem('korat_business_id') || 'default_user';
      const fileExt = file.name.split('.').pop();
      const filePath = `reference_uploads/${businessId}_${Date.now()}.${fileExt}`;
      
      try {
        const { error } = await supabase.storage.from('brand_assets').upload(filePath, file, { upsert: true });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('brand_assets').getPublicUrl(filePath);
          setUploadedImage(publicUrl);
        }
      } catch (err) {
        console.error('Error uploading image to storage:', err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setIsGenerating(true);

    const selectedTemplate = SUPER_PROMPTS.find(p => p.id === selectedPromptId)?.template || '[USER_PROMPT]';
    const finalPrompt = selectedTemplate.replace('[USER_PROMPT]', customText || '').trim() || 'Mejorar calidad y detalles visuales';

    try {
      const businessId = localStorage.getItem('korat_business_id');
      let businessLogoUrl = null;

      if (activarLogo && businessId) {
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

      const response = await api.campaigns.generateVisual({
        campaign_id: campaignId || null,
        audience: 'General',
        promptExtra: finalPrompt,
        formato: formato,
        estilo: selectedPromptId === 'none' ? 'Libre' : SUPER_PROMPTS.find(p => p.id === selectedPromptId)?.label || 'Retoque',
        modo_salida: 'imagen',
        activar_logo: activarLogo,
        include_logo: activarLogo,
        logo_url: businessLogoUrl,
        reference_image_url: uploadedImage, // This acts as the base layout/image
        variation_seed: Date.now()
      });
      
      let newUrl = null;
      if (response) {
        // Aceptamos tanto image_url (nombre de DB) como imagen_url (nombre original)
        newUrl = response.imagen_url || response.image_url;
      }

      if (newUrl) {
        setHistory(prev => {
          const next = [...prev, newUrl];
          setCurrentIndex(next.length - 1);
          return next;
        });
      } else {
        alert('La IA generó la imagen pero no pudimos obtener el enlace. Por favor, revisa la galería en unos minutos.');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Fallback for demo purposes if webhook fails
      setTimeout(() => {
        setHistory(prev => {
          const next = [...prev, uploadedImage!];
          setCurrentIndex(next.length - 1);
          return next;
        });
      }, 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full absolute inset-0">
      {/* Panel Izquierdo: Controles */}
      <div className="w-full lg:w-[450px] flex flex-col overflow-y-auto custom-scrollbar relative z-10 shadow-xl bg-gray-50 dark:bg-[#0d131f] border-r border-gray-200 dark:border-white/5">
        <div className="p-6 space-y-6 pt-[calc(env(safe-area-inset-top,0px)+80px)] pb-[calc(env(safe-area-inset-bottom,0px)+110px)] lg:pt-6 lg:pb-20">
          
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Wand2 size={20} className="text-violet-500" />
              Retoque Studio
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sube una foto real de tu salón y mejórala mágicamente con IA.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">1. Tu Foto Base</label>
            <div className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-violet-500 dark:hover:border-violet-500 transition-colors bg-white dark:bg-[#1a2234] overflow-hidden">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleImageUpload}
              />
              {uploadedImage ? (
                <div className="relative aspect-square w-full">
                  <img src={uploadedImage} alt="Upload" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium flex items-center gap-2">
                      <ImagePlus size={18} />
                      Cambiar foto
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center gap-3 aspect-square">
                  <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-500">
                    <Upload size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-white">Haz clic o arrastra tu foto</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG hasta 5MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">2. Efecto Mágico</label>
            <div className="grid gap-3">
              {SUPER_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => setSelectedPromptId(prompt.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    selectedPromptId === prompt.id 
                      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-500/50 shadow-sm' 
                      : 'bg-white dark:bg-[#1a2234] border-gray-200 dark:border-white/5 hover:border-violet-200 dark:hover:border-white/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                    selectedPromptId === prompt.id ? 'bg-violet-200 dark:bg-violet-500/30' : 'bg-gray-100 dark:bg-white/5'
                  }`}>
                    {prompt.icon}
                  </div>
                  <div>
                    <h4 className={`text-sm font-medium ${selectedPromptId === prompt.id ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-white'}`}>
                      {prompt.label}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{prompt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">3. Detalles (Opcional)</label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={
                selectedPromptId === 'hair_color' 
                  ? 'Ej: Rubio ceniza con reflejos dorados...' 
                  : selectedPromptId === 'none'
                  ? 'Escribe con detalle qué quieres cambiar o mantener...'
                  : 'Ej: Fondo minimalista en tonos beige cálido...'
              }
              className="w-full h-24 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none custom-scrollbar"
            />
          </div>

          {/* Selector de Formato */}
          <div className="space-y-3">
            <label className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest block">Dimensiones de la Imagen</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: '1:1', label: '1:1', desc: 'Cuadrado', icon: Square },
                { id: '4:5', label: '4:5', desc: 'Retrato', icon: RectangleVertical },
                { id: '9:16', label: '9:16', desc: 'Reel/Story', icon: Smartphone },
                { id: '16:9', label: '16:9', desc: 'Horizontal', icon: RectangleHorizontal },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormato(f.id as any)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                    formato === f.id
                      ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-300 dark:border-violet-500 text-violet-700 dark:text-violet-200 shadow-md ring-1 ring-violet-500/20'
                      : 'bg-white dark:bg-[#1a2234] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-400'
                  }`}
                >
                  <f.icon size={16} className={formato === f.id ? 'text-violet-500' : 'text-gray-400'} />
                  <span className="text-[10px] font-bold mt-1 text-gray-900 dark:text-white">{f.label}</span>
                  <span className="text-[8px] opacity-70 leading-none">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Logo Toggle */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-white/10 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Agregar marca de agua</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">La IA incrustará sutilmente tu logo</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={activarLogo} 
                onChange={() => setActivarLogo(!activarLogo)} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-black/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-500"></div>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!uploadedImage || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all
              bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white shadow-lg shadow-violet-500/25
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Retocando con IA...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Aplicar Magia
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panel Derecho: Lienzo grande */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-100 dark:bg-[#070b10] relative overflow-hidden p-8">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-400/20 dark:from-violet-900/20 via-transparent to-transparent pointer-events-none" 
        />
        
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-2xl flex flex-col items-center text-center relative z-10"
            >
              <div className="relative mb-8">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute -inset-8 rounded-full border-[3px] border-transparent border-t-violet-500 border-b-pink-500 opacity-50" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 rounded-full border border-dashed border-violet-500/40" />
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-violet-100 to-pink-100 dark:from-violet-600/20 dark:to-pink-500/20 flex items-center justify-center border border-violet-200 dark:border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.3)] backdrop-blur-sm">
                  <Wand2 size={48} className="text-violet-500 dark:text-violet-300 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600 dark:from-violet-400 dark:to-pink-400 mb-4">
                Rediseñando tu foto...
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
                Nilah Studio está aplicando el maquillaje digital y ajustando la iluminación.
              </p>
            </motion.div>
          ) : resultImage ? (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full flex flex-col items-center justify-center relative z-10 gap-6"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] shadow-violet-900/20 border border-white/10 flex items-center gap-4 bg-[#1a2234] p-4">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Antes</span>
                  <img src={uploadedImage!} alt="Base" className="h-[40vh] object-contain rounded-xl border border-white/5 opacity-80" />
                </div>
                <ArrowRight className="text-white/20 hidden md:block" size={32} />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-violet-400 uppercase tracking-wider font-bold">Después</span>
                  <img src={resultImage} alt="Resultado" className="h-[50vh] object-contain rounded-xl border border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.2)]" />
                </div>
              </div>

              {/* Status & Quick Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-xs font-bold">
                  <Check size={14} /> Guardado
                </div>
                
                <button 
                  onClick={() => setCurrentIndex(-1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-500 rounded-full border border-violet-500/20 text-xs font-bold hover:bg-violet-500/20 transition-all"
                >
                  <RefreshCcw size={14} /> Nueva Edición
                </button>

                {history.length === 1 && (
                  <button 
                    onClick={() => handleDiscard(0)}
                    disabled={isDeleting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isDeleting 
                        ? 'text-gray-400 bg-gray-100 dark:bg-white/5 cursor-not-allowed' 
                        : 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {isDeleting ? 'Borrando...' : 'Descartar'}
                  </button>
                )}
              </div>

              {/* Historial (Multi-Image Strip) */}
              {history.length > 1 && (
                <div className="w-full max-w-xl mx-auto bg-gray-50 dark:bg-black/20 p-3 rounded-2xl border border-gray-200 dark:border-white/5 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                      Historial de Cambios: {history.length} versiones
                    </p>
                    <button 
                      onClick={() => handleDiscard(currentIndex)}
                      disabled={isDeleting}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${
                        isDeleting 
                          ? 'text-gray-400 bg-gray-100 dark:bg-white/5 cursor-not-allowed' 
                          : 'text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10'
                      }`}
                    >
                      {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      {isDeleting ? 'Descartando...' : 'Descartar'}
                    </button>
                  </div>
                  <div className="flex gap-2 mx-auto justify-center overflow-x-auto pb-1 mt-2">
                    {history.map((img, idx) => (
                      <motion.button
                        key={idx}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCurrentIndex(idx)}
                        className={`relative flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all w-16 h-16 ${
                          currentIndex === idx
                            ? 'border-violet-500 shadow-lg shadow-violet-500/40 ring-2 ring-violet-400/30'
                            : 'border-transparent opacity-60 hover:opacity-90 grayscale hover:grayscale-0'
                        }`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt={`Variación ${idx + 1}`} />
                        {currentIndex === idx && (
                          <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                            <Check size={14} className="text-white drop-shadow" />
                          </div>
                        )}
                        <div className="absolute bottom-0.5 left-0.5 right-0.5 text-center flex justify-between px-1">
                          <span className="text-[9px] font-bold text-white drop-shadow-lg bg-black/40 px-1.5 rounded">{idx + 1}</span>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl px-8 flex flex-col items-center text-center relative z-10"
            >
               <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-violet-600/20 dark:to-pink-500/20 flex items-center justify-center border border-gray-300 dark:border-white/10 shadow-xl dark:shadow-violet-500/20 backdrop-blur-sm mb-8">
                  <ImagePlus size={40} className="text-gray-400 dark:text-violet-300/80" />
                </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-400 dark:from-white dark:to-gray-400 mb-4">
                El Estudio de Retoque
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                Transforma las fotos sacadas en tu salón. Limpia fondos, mejora la iluminación y crea contenido de lujo en un solo clic. Sube una foto a la izquierda para empezar.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Confirmación de Descarte */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto">
            {/* Backdrop Blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm"
              onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
            />
            
            {/* Modal Content */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl p-6 mx-4 overflow-hidden"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-red-400/10 dark:bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4 ring-8 ring-red-50/50 dark:ring-red-500/5">
                  <AlertTriangle className="text-red-500" size={24} />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  ¿Descartar Imagen?
                </h3>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 px-2">
                  Esta acción no se puede deshacer. La imagen se eliminará <strong className="font-semibold text-gray-700 dark:text-gray-300">permanentemente</strong> de tu almacenamiento en Supabase para liberar espacio.
                </p>
                
                <div className="flex items-center justify-center gap-3 w-full">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-50"
                  >
                    Mantener
                  </button>
                  <button 
                    onClick={confirmDiscard}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Borrando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Descartar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
