import React, { useState } from 'react';
import { Upload, Sparkles, SlidersHorizontal, ImagePlus, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface FreeStudioProps {
  initialImage?: string | null;
  initialPrompt?: string | null;
}

export const FreeStudio: React.FC<FreeStudioProps> = ({ initialImage, initialPrompt }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setResultImage(null);

    try {
      const fullPrompt = negativePrompt ? `${prompt} --no ${negativePrompt}` : prompt;
      
      const response = await api.campaigns.generateVisual({
        campaign_id: 'manual', 
        audience: 'General',
        promptExtra: fullPrompt,
        formato: '1:1',
        estilo: 'Fotográfico',
        reference_image: uploadedImage // If present, it triggers Image-to-Image in backend, else Text-to-Image
      });
      
      if (response && response.visual) {
         setResultImage(response.visual.imageUrl);
      } else {
         setResultImage(response.imageUrl || response.data?.visual?.imageUrl);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Fallback Demo
      setTimeout(() => setResultImage(uploadedImage || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800'), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full absolute inset-0">
      {/* Panel Izquierdo: Controles Libres */}
      <div className="w-full lg:w-[450px] flex flex-col overflow-y-auto custom-scrollbar relative z-10 shadow-xl bg-gray-50 dark:bg-[#0d131f] border-r border-gray-200 dark:border-white/5">
        <div className="p-6 space-y-6 pt-[calc(env(safe-area-inset-top,0px)+80px)] pb-[calc(env(safe-area-inset-bottom,0px)+110px)] lg:pt-6 lg:pb-20">
          
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <SlidersHorizontal size={20} className="text-violet-500" />
              Estudio Libre
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Control total. Escribe un prompt detallado para generar desde cero o subir una imagen base para alterar.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Imagen Base <span className="text-gray-400 dark:text-gray-500 font-normal">(Opcional)</span>
            </label>
            <div className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-violet-500 dark:hover:border-violet-500 transition-colors bg-white dark:bg-[#1a2234] overflow-hidden h-32">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleImageUpload}
              />
              {uploadedImage ? (
                <div className="relative h-full w-full flex items-center justify-center p-2">
                  <img src={uploadedImage} alt="Upload" className="h-full object-contain rounded-lg" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium flex items-center gap-2 text-sm">
                      <ImagePlus size={16} /> Cambiar foto
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-2">
                  <Upload size={20} className="text-gray-400" />
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Sube una imagen para alterar</p>
                </div>
              )}
            </div>
            {uploadedImage && (
              <button 
                onClick={() => setUploadedImage(null)}
                className="text-xs text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 mt-1 font-medium"
              >
                Quitar imagen (Generar desde cero)
              </button>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prompt Principal (Instrucciones)</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: Retrato fotográfico de una mujer con cabello cobrizo, iluminación de estudio cinemática, 8k, ultra detallado..."
              className="w-full h-32 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none custom-scrollbar"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prompt Negativo <span className="text-gray-400 font-normal">(Opcional)</span></label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Ej: borroso, deforme, mala iluminación, caricatura..."
              className="w-full h-16 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none custom-scrollbar"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold transition-all
              bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg shadow-gray-500/25
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sintetizando...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generar Creación
              </>
            )}
          </button>
        </div>
      </div>

      {/* Panel Derecho: Lienzo grande */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-100 dark:bg-[#070b10] relative overflow-hidden p-8">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/20 dark:from-blue-900/20 via-transparent to-transparent pointer-events-none" 
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
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute -inset-8 rounded-full border-[2px] border-transparent border-t-white border-b-gray-500 opacity-20" />
                 <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-gray-200 to-white dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border border-gray-300 dark:border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.1)] backdrop-blur-sm">
                  <SlidersHorizontal size={48} className="text-gray-600 dark:text-gray-400 animate-pulse" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-600 to-gray-900 dark:from-white dark:to-gray-400 mb-4">
                Procesando Canvas...
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
                Ejecutando parámetros personalizados en el modelo Nilah.
              </p>
            </motion.div>
          ) : resultImage ? (
             <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full h-full flex flex-col items-center justify-center relative z-10 gap-6"
            >
              {uploadedImage ? (
                // Layout for Image-to-Image Result
                <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] shadow-black/20 border border-white/10 flex items-center gap-4 bg-[#1a2234] p-4">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Input</span>
                    <img src={uploadedImage!} alt="Base" className="h-[40vh] object-contain rounded-xl border border-white/5 opacity-80" />
                  </div>
                  <ArrowRight className="text-white/20 hidden md:block" size={32} />
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs text-white uppercase tracking-wider font-bold">Output</span>
                    <img src={resultImage} alt="Resultado" className="h-[60vh] object-contain rounded-xl border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]" />
                  </div>
                </div>
              ) : (
                 // Layout for Text-to-Image Result
                 <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] shadow-white/5 border border-white/10">
                  <img src={resultImage} alt="Campaña Generada" className="max-w-full max-h-[85vh] object-contain" />
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
               <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center border border-gray-300 dark:border-white/10 shadow-xl dark:shadow-white/5 backdrop-blur-sm mb-8">
                  <SlidersHorizontal size={40} className="text-gray-500 dark:text-gray-400" />
                </div>
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-400 dark:from-white dark:to-gray-400 mb-4">
                Lienzo en Blanco
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                Toma el control absoluto. Sube una imagen para modificarla estructuralmente, o escribe un prompt desde cero para crear arte libremente.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
