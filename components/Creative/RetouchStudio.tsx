import React, { useState } from 'react';
import { Upload, Sparkles, Wand2, ArrowRight, Loader2, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface RetouchStudioProps {
  campaignId?: string;
  initialImage?: string | null;
  initialPrompt?: string | null;
}

const SUPER_PROMPTS = [
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
  const [selectedPromptId, setSelectedPromptId] = useState<string>('studio_bg');
  const [customText, setCustomText] = useState(initialPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you might want to upload this to Supabase Storage first
      // and get a public URL to pass to n8n.
      // For now, we simulate with a local object URL or base64.
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;
    setIsGenerating(true);
    setResultImage(null);

    const selectedTemplate = SUPER_PROMPTS.find(p => p.id === selectedPromptId)?.template || '[USER_PROMPT]';
    const finalPrompt = selectedTemplate.replace('[USER_PROMPT]', customText || 'salon work');

    try {
      // Llamada al webhook de n8n para Image-to-Image
      const response = await api.campaigns.generateVisual({
        campaign_id: campaignId || 'manual',
        audience: 'General',
        promptExtra: finalPrompt,
        formato: '1:1',
        estilo: 'Fotográfico',
        reference_image: uploadedImage // Pasamos la imagen base como reference_image
      });
      
      if (response && response.visual) {
         setResultImage(response.visual.imageUrl);
      } else {
         // Fallback if the structure is nested differently
         setResultImage(response.imageUrl || response.data?.visual?.imageUrl);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // Fallback for demo purposes if webhook fails
      setTimeout(() => {
        setResultImage(uploadedImage); 
      }, 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full w-full absolute inset-0">
      {/* Panel Izquierdo: Controles */}
      <div className="w-full lg:w-[450px] flex flex-col overflow-y-auto custom-scrollbar relative z-10 shadow-xl bg-gray-50 dark:bg-[#0d131f] border-r border-gray-200 dark:border-white/5">
        <div className="p-6 space-y-6 pb-20">
          
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
                  : 'Ej: Fondo minimalista en tonos beige cálido...'
              }
              className="w-full h-24 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none custom-scrollbar"
            />
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
                  <img src={resultImage} alt="Resultado" className="h-[60vh] object-contain rounded-xl border border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.2)]" />
                </div>
              </div>
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
    </div>
  );
};
