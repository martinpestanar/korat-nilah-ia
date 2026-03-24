import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Loader2, Image as ImageIcon, Sparkles, X, Wand2, Maximize2, Hash, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreativeAsset {
  id: string;
  business_id: string;
  campaign_id: string | null;
  image_url: string;
  prompt_usado: string | null;
  copy_text: string | null;
  formato: string | null;
  estilo: string | null;
  emocion: string | null;
  campaign_title: string | null;
  copy_redes: string | null;
  flyer_precio: string | null;
  created_at: string;
}

interface CreativeGalleryProps {
  onTransfer: (url: string, prompt: string, targetModule: 'retouch' | 'free') => void;
}

export const CreativeGallery: React.FC<CreativeGalleryProps> = ({ onTransfer }) => {
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'campaigns' | 'standalone'>('all');
  const [selectedAsset, setSelectedAsset] = useState<CreativeAsset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [filter]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('nilah_creative_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'campaigns') {
        query = query.not('campaign_id', 'is', null);
      } else if (filter === 'standalone') {
        query = query.is('campaign_id', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching gallery assets:', error);
      // For demo purposes if table is empty or error occurs
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets;

  return (
    <div className="absolute inset-0 bg-gray-50 dark:bg-[#070b10] flex flex-col pt-6">
      
      {/* Header and Filters */}
      <div className="px-8 pb-6 border-b border-gray-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600 dark:from-violet-400 dark:to-pink-400 flex items-center gap-2">
             <ImageIcon size={24} className="text-violet-500" />
             Galería Nilah
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Explora tu bóveda de creaciones visuales pasadas.</p>
        </div>

        <div className="flex p-1 bg-white dark:bg-[#1a2234] border border-gray-200 dark:border-white/5 rounded-xl self-start md:self-auto">
          {(['all', 'campaigns', 'standalone'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f 
                  ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todas' : f === 'campaigns' ? 'Campañas' : 'Sueltas'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-violet-500 mb-4" size={32} />
            <p className="text-gray-500 dark:text-gray-400">Pincelando recuerdos...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6">
                 <ImageIcon size={32} className="text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aún no hay creaciones</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Las imágenes que generes con Magia Nilah o que modifiques en el Estudio aparecerán en esta galería automática.
              </p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                layoutId={`card-${asset.id}`}
                onClick={() => setSelectedAsset(asset)}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm shadow-black/5 hover:shadow-xl hover:shadow-violet-500/20 transition-all border border-gray-200 dark:border-white/5 bg-white dark:bg-[#1a2234]"
              >
                <img 
                  src={asset.image_url} 
                  alt={asset.id} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                   {(asset.campaign_title || asset.campaign_id) && (
                     <span className="text-xs font-bold text-white bg-violet-500/80 px-2 py-0.5 rounded-md w-max mb-1">
                       📃 {asset.campaign_title || `Campaña #${asset.campaign_id}`}
                     </span>
                   )}
                   {asset.emocion && (
                     <p className="text-[10px] text-violet-200 italic truncate mt-0.5 max-w-full">"{asset.emocion}"</p>
                   )}
                   <div className="flex items-center gap-2 mt-2">
                     <span className="text-white font-medium text-sm flex items-center gap-1">
                       <Maximize2 size={14} /> Ver Detalle
                     </span>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-gray-900/80 dark:bg-black/80 backdrop-blur-sm"
          >
             <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedAsset(null)} />
             
             <motion.div 
               layoutId={`card-${selectedAsset.id}`}
               className="relative w-full max-w-6xl max-h-full flex flex-col md:flex-row bg-white dark:bg-[#0d131f] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 z-10"
             >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white backdrop-blur-md transition-colors"
                >
                  <X size={20} />
                </button>

                {/* Left: Image */}
                <div className="w-full md:w-3/5 bg-gray-100 dark:bg-black flex items-center justify-center min-h-[40vh] md:min-h-0 relative">
                  <img 
                    src={selectedAsset.image_url} 
                    alt="Asset Output" 
                    className="max-w-full max-h-[85vh] object-contain"
                  />
                  {(selectedAsset.campaign_title || selectedAsset.campaign_id) && (
                     <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/10">
                       <Hash size={12} className="text-violet-400" /> 
                       {selectedAsset.campaign_title || `Campaña #${selectedAsset.campaign_id}`}
                     </div>
                   )}
                </div>

                {/* Right: Info & Actions */}
                <div className="w-full md:w-2/5 flex flex-col overflow-y-auto custom-scrollbar p-6 lg:p-8">
                   <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Detalles de la Creación</h3>
                   
                   <div className="space-y-6 flex-1">
                     
                     {selectedAsset.emocion && (
                       <div className="rounded-2xl overflow-hidden border border-violet-200/50 dark:border-violet-500/20 mb-2">
                         <div className="bg-gradient-to-r from-violet-500/15 via-pink-500/10 to-amber-400/10 px-4 py-3">
                           <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">✨ Emoción que evoca</p>
                           <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed font-medium italic">"{selectedAsset.emocion}"</p>
                         </div>
                       </div>
                     )}

                     {selectedAsset.prompt_usado && (
                       <div>
                         <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                           <Wand2 size={14} /> Prompt (Ingeniería)
                         </label>
                         <div className="bg-gray-50 dark:bg-[#1a2234] border border-gray-200 dark:border-white/5 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 font-mono">
                           {selectedAsset.prompt_usado}
                         </div>
                       </div>
                     )}

                      {selectedAsset.copy_text && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                            Contexto de Campaña
                          </label>
                          <p className="text-gray-800 dark:text-white text-sm bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
                            {selectedAsset.copy_text}
                          </p>
                        </div>
                      )}

                      {selectedAsset.copy_redes && (
                        <div className="rounded-2xl overflow-hidden border border-sky-200/50 dark:border-sky-500/20">
                          <div className="bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-teal-400/10 px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">💬 Copy para Redes</p>
                              <button
                                onClick={() => navigator.clipboard.writeText(selectedAsset.copy_redes!)}
                                className="text-[9px] font-bold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/20 px-2 py-1 rounded-full hover:bg-sky-200 dark:hover:bg-sky-500/40 transition-colors"
                              >
                                Copiar 📋
                              </button>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{selectedAsset.copy_redes}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 py-4 border-y border-gray-200 dark:border-white/5">
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Estilo</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{selectedAsset.estilo || 'N/A'}</span>
                         </div>
                         <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Formato</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase">{selectedAsset.formato || '1:1'}</span>
                         </div>
                         {selectedAsset.flyer_precio && (
                           <>
                             <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                             <div className="flex flex-col">
                               <span className="text-xs text-gray-500 dark:text-gray-400">Precio</span>
                               <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{selectedAsset.flyer_precio}</span>
                             </div>
                           </>
                         )}
                        <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                        <div className="flex flex-col">
                           <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Calendar size={12}/> Creado</span>
                           <span className="text-sm font-semibold text-gray-900 dark:text-white">
                             {new Date(selectedAsset.created_at).toLocaleDateString()}
                           </span>
                        </div>
                     </div>
                   </div>

                   {/* Main Actions */}
                   <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/5 space-y-3">
                     <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
                       ¿Te gusta esta imagen pero quieres ajustar los colores, cambiar el fondo o la modelo?
                     </p>
                     
                     <div className="grid grid-cols-2 gap-3">
                       <button
                         onClick={() => {
                           onTransfer(selectedAsset.image_url, selectedAsset.prompt_usado || '', 'retouch');
                           setSelectedAsset(null);
                         }}
                         className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                       >
                         <Sparkles size={20} className="text-pink-500 group-hover:scale-110 transition-transform" />
                         <span className="text-sm font-bold text-center">Variar en<br/>Retoque Studio</span>
                       </button>

                       <button
                         onClick={() => {
                           onTransfer(selectedAsset.image_url, selectedAsset.prompt_usado || '', 'free');
                           setSelectedAsset(null);
                         }}
                         className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors group shadow-lg"
                       >
                         <Wand2 size={20} className="text-violet-400 dark:text-violet-600 group-hover:scale-110 transition-transform" />
                         <span className="text-sm font-bold text-center">Avanzado en<br/>Estudio Libre</span>
                       </button>
                     </div>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
