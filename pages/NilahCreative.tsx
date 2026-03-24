import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Search, ChevronDown, X, Check, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageGenerator } from '../components/Marketing/ImageGenerator';
import { RetouchStudio } from '../components/Creative/RetouchStudio';
import { FreeStudio } from '../components/Creative/FreeStudio';
import { CreativeGallery } from '../components/Creative/CreativeGallery';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

type CreativeSubmodule = 'magic' | 'retouch' | 'free' | 'gallery';

interface NilahCreativeProps {
  isEmbedded?: boolean;
}

const NilahCreative: React.FC<NilahCreativeProps> = ({ isEmbedded = false }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialCampaignId = searchParams.get('campaignId') || undefined;
  const initialAudience = searchParams.get('audience') || 'General';

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<any | null>(null);

  const [activeSubmodule, setActiveSubmodule] = useState<CreativeSubmodule>('magic');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  
  // Shared state for transferring image between modules
  const [sharedImageUrl, setSharedImageUrl] = useState<string | null>(null);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);

  // States for the layout when using Magic Generator
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [formato, setFormato] = useState<'1:1' | '9:16'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);

  const submodules = [
    { id: 'magic', label: 'Magia Nilah', icon: '✨' },
    { id: 'retouch', label: 'Retoque Studio', icon: '📸' },
    { id: 'free', label: 'Estudio Libre', icon: '🎛️' },
    { id: 'gallery', label: 'Galería Nilah', icon: '🖼️' },
  ] as const;

  const handleTransferToStudio = (url: string, prompt: string, targetModule: CreativeSubmodule) => {
     setSharedImageUrl(url);
     setSharedPrompt(prompt);
     setActiveSubmodule(targetModule);
  };

  // Group campaigns by month for the selector
  const groupedCampaigns = useMemo(() => {
    const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const filtered = campaigns.filter(c =>
      !campaignSearch || c.title?.toLowerCase().includes(campaignSearch.toLowerCase())
    );
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(c => {
      const key = 'Mis Campañas'; // Simple grouping — can add month later if date is available
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return Object.entries(groups);
  }, [campaigns, campaignSearch]);

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    activa:     { label: 'Activa',    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    enviada:    { label: 'Enviada',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    programada: { label: 'Program.', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    borrador:   { label: 'Borrador', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  };

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const businessId = localStorage.getItem('korat_business_id') 
          || user?.business_id 
          || '';
        
        if (!businessId) {
          console.warn('[NilahCreative] No businessId found, skipping campaign load');
          return;
        }

        // Consulta directa a Supabase — igual que CreativeGallery.tsx
        const { data, error } = await supabase
          .from('campanas')
          .select('id, titulo, mensaje, segmento, estado')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('[NilahCreative] Supabase error:', error);
          return;
        }

        const mapped = (data || []).map((c: any) => ({
          id: c.id?.toString(),
          title: c.titulo || `Campaña #${c.id}`,
          copyText: c.mensaje || '',
          audience: c.segmento || 'General',
          estado: c.estado,
        }));

        setCampaigns(mapped);

        if (initialCampaignId) {
          const found = mapped.find((c: any) => c.id === initialCampaignId);
          setActiveCampaign(found || { id: initialCampaignId, title: `Campaña #${initialCampaignId}`, copyText: '', audience: initialAudience });
        }
      } catch (err) {
        console.error('[NilahCreative] Error loading campaigns:', err);
      }
    };
    loadCampaigns();
  }, [initialCampaignId, initialAudience, user]);

  return (
    <div className={`flex flex-col relative text-gray-900 dark:text-white ${
      isEmbedded 
        ? 'w-full h-full flex-1 bg-white dark:bg-[#0a0f16]' 
        : '-mx-4 -my-5 sm:-mx-6 sm:-my-6 min-h-[calc(100vh-64px)] bg-white dark:bg-[#0a0f16]'
    }`}>
      {/* Header Premium */}
      {!isEmbedded && (
        <header className="flex-shrink-0 relative items-start lg:items-center bg-[#0d131f] border-b border-white/5 flex justify-between px-5 py-4 z-20">
        <div className="flex items-center gap-4">
          {activeCampaign?.id && (
            <button 
              onClick={() => navigate('/nilah/app/marketing')}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
              title="Volver a Marketing"
            >
              <ArrowLeft size={18} className="text-gray-400" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-violet-400" />
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-500">
                Nilah Creative
              </h1>
            </div>
            
            <div className="mt-1">
              <p className="text-xs text-gray-400">Creación visual para tus estrategias</p>
            </div>
          </div>
        </div>
        
        {/* Destellos Balance (To be implemented fully later) */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 shadow-sm shadow-yellow-500/5">
          <Sparkles size={14} className="text-yellow-400" />
          <span className="text-sm font-bold text-yellow-100">Destellos</span>
        </div>
      </header>
      )}

      {/* Sub-Navigation Bar */}
      <div className={`flex items-center gap-1 p-2 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#070b10] overflow-x-auto custom-scrollbar ${isEmbedded ? 'rounded-t-2xl' : ''}`}>
        {submodules.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveSubmodule(m.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 ${
              activeSubmodule === m.id
                ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white'
            }`}
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeSubmodule === 'magic' && (
          <div className="flex flex-col lg:flex-row h-full w-full absolute inset-0">
            {/* Panel Izquierdo: Controles del Generador */}
            <div className={`w-full lg:w-[450px] flex flex-col overflow-y-auto custom-scrollbar relative z-10 shadow-xl bg-gray-50 dark:bg-[#0d131f] border-r border-gray-200 dark:border-white/5`}>
              <div className="p-6 pb-20">
                 <ImageGenerator 
                    campaignId={activeCampaign?.id}
                    copyText={activeCampaign?.copyText || ''}
                    audienceName={activeCampaign?.audience || 'General'}
                    activeCampaign={activeCampaign}
                    onOpenCampaignSelector={() => { setIsSelectorOpen(true); setCampaignSearch(''); }}
                    onImageSelected={(url, prompt) => setSelectedImage(url)}
                    onGeneratingStateChange={(generating) => setIsGenerating(generating)}
                    onSkip={() => setSelectedImage(null)}
                 />
              </div>
            </div>

            {/* Panel Derecho: Lienzo grande */}
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-100 dark:bg-[#070b10] relative overflow-hidden p-8">
              {/* Subtle breathing aura */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.1, 0.3, 0.1]
                }}
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
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-8 rounded-full border-[3px] border-transparent border-t-violet-500 border-b-pink-500 opacity-50"
                      />
                      <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-4 rounded-full border border-dashed border-violet-500/40"
                      />
                      <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-violet-100 to-pink-100 dark:from-violet-600/20 dark:to-pink-500/20 flex items-center justify-center border border-violet-200 dark:border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.3)] backdrop-blur-sm">
                        <Sparkles size={48} className="text-violet-500 dark:text-violet-300 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600 dark:from-violet-400 dark:to-pink-400 mb-4">
                      El Estudio está trabajando...
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
                      Aplicando la magia de Nilah IA en tu diseño maestro.
                    </p>
                  </motion.div>
                ) : selectedImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full h-full flex items-center justify-center relative z-10 p-8"
                  >
                    <div className="relative max-h-full flex items-center justify-center">
                      <img 
                        src={selectedImage} 
                        alt="Campaña Generada" 
                        className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-white/10"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-2xl px-8 flex flex-col items-center text-center relative z-10"
                  >
                    <div className="relative mb-8">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-4 rounded-full border border-dashed border-violet-500/20"
                      />
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-gray-200 to-gray-100 dark:from-violet-600/20 dark:to-pink-500/20 flex items-center justify-center border border-gray-300 dark:border-white/10 shadow-xl dark:shadow-violet-500/20 backdrop-blur-sm">
                        <ImageIcon size={40} className="text-gray-400 dark:text-violet-300/80" />
                      </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-400 dark:from-white dark:to-gray-400 mb-4">
                      El Lienzo Creativo
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                      Configura los detalles en el panel interactivo de la izquierda. Cierra los ojos y mira cómo las ideas se materializan aquí mismo.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Other Submodules (Placeholder until components are built) */}
        {activeSubmodule === 'retouch' && (
          <RetouchStudio 
            campaignId={activeCampaign?.id} 
             initialImage={sharedImageUrl}
             initialPrompt={sharedPrompt}
          />
        )}

        {activeSubmodule === 'free' && (
          <FreeStudio 
             initialImage={sharedImageUrl}
             initialPrompt={sharedPrompt}
          />
        )}

        {activeSubmodule === 'gallery' && (
          <CreativeGallery onTransfer={handleTransferToStudio} />
        )}

      </div>
      {/* =============================================
          CAMPAIGN SELECTOR — BOTTOM SHEET / POPOVER
          ============================================= */}
      <AnimatePresence>
        {isSelectorOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectorOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Panel — slides up on mobile, appears from top on desktop */}
            <motion.div
              key="panel"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 lg:absolute lg:top-20 lg:left-4 lg:right-auto lg:bottom-auto lg:w-[420px] z-50 bg-[#0d131f] border border-white/10 rounded-t-3xl lg:rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[80vh] lg:max-h-[520px]"
            >
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 lg:hidden shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-3 lg:pt-5 pb-4 border-b border-white/5 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white">Elegir Contexto de Campaña</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{campaigns.length} campañas disponibles</p>
                </div>
                <button
                  onClick={() => setIsSelectorOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X size={15} className="text-gray-400" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-4 py-3 shrink-0">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-violet-500/50 transition-colors">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={campaignSearch}
                    onChange={e => setCampaignSearch(e.target.value)}
                    placeholder="Buscar campaña..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none min-w-0"
                  />
                  {campaignSearch && (
                    <button onClick={() => setCampaignSearch('')}>
                      <X size={13} className="text-gray-500 hover:text-white transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-4">
                {/* Divider + grouped campaigns */}
                {groupedCampaigns.length > 0 && (
                  <>
                    <div className="px-2 pt-3 pb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Campañas Guardadas</span>
                    </div>
                    {groupedCampaigns.map(([group, list]) =>
                      list.map(c => {
                        const status = STATUS_CONFIG[c.estado] || STATUS_CONFIG.borrador;
                        const isActive = activeCampaign?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => { setActiveCampaign(c); setIsSelectorOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all mb-1 text-left ${
                              isActive
                                ? 'bg-violet-500/15 border border-violet-500/30'
                                : 'hover:bg-white/5 border border-transparent'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-base shrink-0">📃</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{c.title}</p>
                              <p className="text-[11px] text-gray-400 truncate">{c.audience}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.color}`}>
                                {status.label}
                              </span>
                              {isActive && <Check size={14} className="text-violet-400" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </>
                )}

                {groupedCampaigns.length === 0 && campaignSearch && (
                  <div className="flex flex-col items-center text-center py-10 text-gray-500">
                    <Search size={24} className="mb-3 opacity-40" />
                    <p className="text-sm">Sin resultados para <strong className="text-white">"{campaignSearch}"</strong></p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NilahCreative;
