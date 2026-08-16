import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Sparkles, ArrowRight, ShieldCheck, Tag, ExternalLink, Download, Check, Star, ChevronRight, X, Info, HelpCircle } from 'lucide-react';
import { getSoluciones, getCategorias, getHeaderConfig, trackSolucionClick, SolucionItem, CategoriaPersonalizada, SolucionesHeaderConfig, HEADER_DEFAULT } from '../services/solucionesService';

const WHATSAPP_NUMBER = '51926285289';

export interface CategoriaConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  bgGlow: string;
  tabActiveBg: string;
  cardBorderHover: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  btnBg: string;
  btnHover: string;
}

const TEMAS_PALETA: Record<string, Omit<CategoriaConfig, 'id' | 'label' | 'shortLabel' | 'icon'>> = {
  todos: {
    bgGlow: 'bg-emerald-200/50',
    tabActiveBg: 'bg-emerald-600 text-white shadow-emerald-600/25',
    cardBorderHover: 'hover:border-emerald-500/50',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    btnBg: 'bg-emerald-600',
    btnHover: 'hover:bg-emerald-700',
  },
  infoproductos: {
    bgGlow: 'bg-indigo-200/50',
    tabActiveBg: 'bg-indigo-600 text-white shadow-indigo-600/25',
    cardBorderHover: 'hover:border-indigo-500/50',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    btnBg: 'bg-indigo-600',
    btnHover: 'hover:bg-indigo-700',
  },
  salones: {
    bgGlow: 'bg-pink-200/60',
    tabActiveBg: 'bg-pink-500 text-white shadow-pink-500/25',
    cardBorderHover: 'hover:border-pink-300',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-700',
    badgeBorder: 'border-pink-200',
    btnBg: 'bg-pink-500',
    btnHover: 'hover:bg-pink-600',
  },
  restaurantes: {
    bgGlow: 'bg-amber-200/50',
    tabActiveBg: 'bg-amber-600 text-white shadow-amber-600/25',
    cardBorderHover: 'hover:border-amber-400/50',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    btnBg: 'bg-amber-600',
    btnHover: 'hover:bg-amber-700',
  },
  servicios: {
    bgGlow: 'bg-cyan-200/50',
    tabActiveBg: 'bg-cyan-600 text-white shadow-cyan-600/25',
    cardBorderHover: 'hover:border-cyan-400/50',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-800',
    badgeBorder: 'border-cyan-200',
    btnBg: 'bg-cyan-600',
    btnHover: 'hover:bg-cyan-700',
  },
};

const Soluciones: React.FC = () => {
  const [soluciones, setSoluciones] = useState<SolucionItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPersonalizada[]>([]);
  const [headerConfig, setHeaderConfig] = useState<SolucionesHeaderConfig>(HEADER_DEFAULT);
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  // Estado para controlar la sobre-pantalla / Modal BottomSheet de detalle
  const [selectedDetailItem, setSelectedDetailItem] = useState<SolucionItem | null>(null);

  useEffect(() => {
    document.title = 'Korat Flow | Sistemas, Ebooks & Recursos';
    window.scrollTo(0, 0);

    const load = async () => {
      setLoading(true);
      const [dataSoluciones, dataCategorias, dataHeader] = await Promise.all([
        getSoluciones(),
        getCategorias(),
        getHeaderConfig(),
      ]);

      setSoluciones(dataSoluciones.filter(item => item.activo));
      setCategorias(dataCategorias.filter(cat => cat.activo).sort((a, b) => a.orden - b.orden));
      setHeaderConfig(dataHeader);
      setLoading(false);
    };
    load();
  }, []);

  const tieneInfoproductos = soluciones.some(item => item.categoria === 'infoproductos');

  const categoriasVisibles = categorias.filter(cat => {
    if (cat.id === 'infoproductos' && !tieneInfoproductos) return false;
    return true;
  });

  const activeTheme = TEMAS_PALETA[activeTab] || TEMAS_PALETA.todos;

  const filteredSoluciones = activeTab === 'todos'
    ? soluciones
    : soluciones.filter(item => item.categoria === activeTab || (activeTab === 'servicios' && item.categoria === 'transversales'));

  const buildWaUrl = (customText: string) => {
    const encoded = encodeURIComponent(customText || 'Hola Martín! Vi tu perfil de TikTok y me interesan tus soluciones de automatización.');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  };

  const handleActionClick = (id: string) => {
    trackSolucionClick(id);
  };

  const getButtonCopyText = (item: SolucionItem) => {
    if (item.texto_boton_personalizado && item.texto_boton_personalizado.trim() !== '') {
      return item.texto_boton_personalizado;
    }

    if (item.tipo_boton === 'descarga') {
      return `Obtener Gratis (${item.precio || 'PDF'})`;
    }

    if (item.categoria === 'salones') {
      return `💬 Ver Demo o Consultar (${item.precio || 'WhatsApp'})`;
    }

    if (item.categoria === 'restaurantes') {
      return `💬 Solicitar Sistema (${item.precio || 'WhatsApp'})`;
    }

    if (item.categoria === 'infoproductos') {
      return `📚 Ver Detalles & Acceso (${item.precio || 'Acceder'})`;
    }

    return `💬 Consultar Disponibilidad (${item.precio || 'WhatsApp'})`;
  };

  /**
   * Parser simple de Markdown estilizado para la sobre-pantalla
   */
  const renderMarkdownFormatted = (content?: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-extrabold text-slate-900 mt-3 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-sm font-bold text-emerald-700 mt-2 mb-1 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-2 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-xs text-emerald-800 italic font-medium">
            {line.replace('> ', '').replace(/"/g, '')}
          </blockquote>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs text-slate-700">
            <span className="text-emerald-500 font-bold">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      if (line.trim() === '') return <div key={idx} className="h-1" />;

      return <p key={idx} className="text-xs text-slate-600 leading-relaxed my-1">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center selection:bg-emerald-500 selection:text-white font-sans pb-28 overflow-x-hidden transition-colors duration-500">

      {/* ── AMBIENT LIGHT BACKGROUND GLOWS ANIMADOS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          key={`glow-1-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] ${activeTheme.bgGlow} rounded-full blur-[100px]`} 
        />
        <motion.div 
          key={`glow-2-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={`absolute top-1/3 -right-20 w-[360px] h-[360px] ${activeTheme.bgGlow} rounded-full blur-[90px]`} 
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-5 flex flex-col items-center">

        {/* ════════════════════════════════
            1. HEADER CON TEXTOS PERSONALIZADOS
        ════════════════════════════════ */}
        <header className="w-full flex flex-col items-center text-center mb-4">
          {headerConfig.statusBadge && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold shadow-sm mb-3 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{headerConfig.statusBadge}</span>
            </motion.div>
          )}

          {/* FOTO DE MARTÍN PESTANA */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="relative mb-2.5 cursor-pointer"
          >
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 blur-sm opacity-60"
            />
            <div className="relative w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 shadow-xl shadow-emerald-500/20">
              <img
                src="/assets/images/martin-founder.jpg"
                alt="Martín Pestana - Korat Flow"
                className="w-full h-full rounded-full object-cover object-top border-2 border-white shadow-inner"
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-md" title="Verificado">
              <ShieldCheck className="w-3.5 h-3.5 font-bold" />
            </div>
          </motion.div>

          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
            {headerConfig.nombrePersona}
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5 max-w-[300px]">
            {headerConfig.subtituloPersona}
          </p>

          {/* TRUST BADGES PERSONALIZABLES */}
          <div className="mt-2.5 flex items-center justify-center gap-2">
            {headerConfig.trustBadge1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[10px] font-semibold text-slate-600">
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> {headerConfig.trustBadge1}
              </span>
            )}
            {headerConfig.trustBadge2 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-[10px] font-semibold text-slate-600">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {headerConfig.trustBadge2}
              </span>
            )}
          </div>
        </header>

        {/* ════════════════════════════════
            2. TABBAR HORIZONTAL CON CATEGORÍAS PERSONALIZADAS
        ════════════════════════════════ */}
        <div className="w-full relative mb-4">
          <div className="relative flex items-center">
            <div 
              className="w-full flex gap-1.5 overflow-x-auto py-1 px-0.5 scrollbar-none snap-x snap-mandatory touch-pan-x pr-8"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {categoriasVisibles.map(cat => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`
                      flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300 active:scale-95 snap-start select-none cursor-pointer whitespace-nowrap
                      ${isActive
                        ? `${activeTheme.tabActiveBg} shadow-md scale-[1.02] font-bold`
                        : 'bg-white text-slate-600 border border-slate-200/90 hover:text-slate-900 hover:border-slate-300'
                      }
                    `}
                  >
                    <span className="text-xs">{cat.icon}</span>
                    <span>{cat.shortLabel || cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent pointer-events-none flex items-center justify-end pr-0.5">
              <ChevronRight className="w-4 h-4 text-slate-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════
            3. CATÁLOGO DE MÓDULOS CON TOUCH INTERACTIVO & VER MÁS
        ════════════════════════════════ */}
        <main className="w-full flex flex-col gap-3.5">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Cargando catálogo...</p>
            </div>
          ) : filteredSoluciones.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200 p-6">
              No se encontraron opciones en esta categoría.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredSoluciones.map((item, index) => {
                const waMessageBuy = item.mensaje_whatsapp || `Hola Martín! Me interesa conocer más detalles sobre "${item.titulo}" (${item.precio || ''}). ¿Me das información?`;
                
                const itemTheme = TEMAS_PALETA[item.categoria] || TEMAS_PALETA.todos;
                const buttonText = getButtonCopyText(item);

                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.99 }}
                    className={`group relative bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm ${itemTheme.cardBorderHover} transition-all duration-300`}
                  >
                    {/* Header Card Flex Layout */}
                    <div className="flex items-start justify-between gap-2.5 mb-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span className={`text-xl p-2 rounded-xl ${itemTheme.badgeBg} border ${itemTheme.badgeBorder} flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform`}>
                          {item.icono || '🚀'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[10px] font-bold ${itemTheme.badgeText} uppercase tracking-wider block truncate`}>
                            {item.subtitulo}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {item.titulo}
                          </h3>
                        </div>
                      </div>

                      {/* Badges & Precio */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${itemTheme.badgeBg} ${itemTheme.badgeText} border ${itemTheme.badgeBorder} shadow-sm whitespace-nowrap`}>
                            {item.badge}
                          </span>
                        )}
                        {item.precio && (
                          <span className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-md border whitespace-nowrap shadow-2xs ${item.precio.toLowerCase().includes('gratis') || item.precio.toLowerCase().includes('free') ? 'bg-emerald-600 text-white border-emerald-700' : `${itemTheme.badgeBg} ${itemTheme.badgeText} ${itemTheme.badgeBorder}`}`}>
                            {item.precio}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-2 font-normal">
                      {item.descripcion}
                    </p>

                    {/* BOTÓN SECUNDARIO: "VER DETALLES COMPLETOS & CÓMO FUNCIONA" */}
                    <button
                      onClick={() => {
                        handleActionClick(`detail-${item.id}`);
                        setSelectedDetailItem(item);
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1 px-2 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-all mb-3 border border-dashed border-slate-200"
                    >
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Ver detalles completos & cómo funciona</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>

                    {/* Acciones principales de baja fricción */}
                    <div className="flex flex-col gap-2">
                      {item.tipo_boton === 'descarga' ? (
                        <motion.a
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleActionClick(item.id)}
                          href={item.url_checkout || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl ${itemTheme.btnBg} ${itemTheme.btnHover} active:scale-[0.98] text-white font-bold text-xs shadow-md transition-all`}
                        >
                          <Download className="w-4 h-4 animate-bounce" />
                          <span>{buttonText}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
                        </motion.a>
                      ) : item.url_checkout ? (
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <motion.a
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleActionClick(item.id)}
                            href={item.url_checkout}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl ${itemTheme.btnBg} ${itemTheme.btnHover} text-white font-bold text-xs shadow-md transition-all`}
                          >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Comprar en Línea ({item.precio || 'Ver Precio'})</span>
                          </motion.a>
                          <motion.a
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleActionClick(item.id)}
                            href={buildWaUrl(waMessageBuy)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl ${itemTheme.badgeBg} ${itemTheme.badgeText} font-semibold text-xs border ${itemTheme.badgeBorder} transition-all`}
                            title="Preguntar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Más Info en WA</span>
                          </motion.a>
                        </div>
                      ) : (
                        <motion.a
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleActionClick(item.id)}
                          href={buildWaUrl(waMessageBuy)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl ${itemTheme.btnBg} ${itemTheme.btnHover} text-white font-bold text-xs shadow-md transition-all`}
                        >
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>{buttonText}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70 group-hover:translate-x-1 transition-transform" />
                        </motion.a>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </main>

        {/* ════════════════════════════════
            4. SOBRE MARTÍN & GARANTÍA DE EJECUCIÓN
        ════════════════════════════════ */}
        <section className={`w-full mt-6 p-4 ${activeTheme.badgeBg} border ${activeTheme.badgeBorder} rounded-2xl text-center shadow-sm transition-colors duration-500`}>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5 flex items-center justify-center gap-1.5">
            <Sparkles className={`w-3.5 h-3.5 ${activeTheme.badgeText}`} />
            La Filosofía Korat Flow
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sin formularios aburridos ni esperas. Conversamos directamente por WhatsApp para adaptar la solución a tu negocio en tiempo récord.
          </p>
        </section>

      </div>

      {/* ════════════════════════════════
          5. MODAL SOBRE-PANTALLA (BOTTOM SHEET DE ALTA CONVERSIÓN CON MARKDOWN ESTILIZADO)
      ════════════════════════════════ */}
      <AnimatePresence>
        {selectedDetailItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border border-slate-200"
            >
              {/* Header Modal */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedDetailItem.icono || '🚀'}</span>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                      {selectedDetailItem.subtitulo}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {selectedDetailItem.titulo}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 rounded-full bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenido Markdown Estilizado */}
              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {renderMarkdownFormatted(selectedDetailItem.contenido_detalle_markdown || selectedDetailItem.descripcion)}
              </div>

              {/* Footer Modal con Call To Action Directo */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 sticky bottom-0 z-10">
                <a
                  href={buildWaUrl(selectedDetailItem.mensaje_whatsapp || `Hola Martín! Quiero consultar sobre "${selectedDetailItem.titulo}"`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    handleActionClick(`modal-wa-${selectedDetailItem.id}`);
                    setSelectedDetailItem(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Conversar con Martín por WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════
          6. BARRA FIJA INFERIOR ADAPTATIVA
      ════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 flex justify-center shadow-lg">
        <div className="w-full max-w-md">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleActionClick('sticky-footer')}
            href={buildWaUrl('Hola Martín! Vengo de tu TikTok y necesito una solución a medida para mi negocio.')}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl ${activeTheme.btnBg} ${activeTheme.btnHover} text-white font-extrabold text-xs shadow-lg transition-all relative overflow-hidden`}
          >
            <Zap className="w-4 h-4 fill-white animate-bounce" />
            <span>⚡ ¿Solución a medida? Conversa conmigo por WhatsApp</span>
          </motion.a>
        </div>
      </div>

    </div>
  );
};

export default Soluciones;
