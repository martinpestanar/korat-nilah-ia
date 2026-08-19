import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Sparkles, ArrowRight, ShieldCheck, Tag, ExternalLink, Download, Check, Star, ChevronRight, X, Info, HelpCircle, Layers, CheckCircle2, XCircle, Sliders } from 'lucide-react';
import { getSoluciones, getCategorias, getHeaderConfig, trackSolucionClick, SolucionItem, CategoriaPersonalizada, SolucionesHeaderConfig, HEADER_DEFAULT } from '../services/solucionesService';

const WHATSAPP_NUMBER = '51926285289';

export interface CategoriaConfig {
  id: string;
  label: string;
  shortLabel: string;
  subtext: string;
  icon: string;
  bgGlow: string;
  cardActiveBg: string;
  cardActiveBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  btnBg: string;
  btnHover: string;
}

const TEMAS_PALETA: Record<string, Omit<CategoriaConfig, 'id' | 'label' | 'shortLabel' | 'subtext' | 'icon'>> = {
  todos: {
    bgGlow: 'bg-emerald-200/40',
    cardActiveBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
    cardActiveBorder: 'border-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200/80',
    btnBg: 'bg-emerald-600',
    btnHover: 'hover:bg-emerald-700',
  },
  salones: {
    bgGlow: 'bg-pink-200/40',
    cardActiveBg: 'bg-pink-600 text-white shadow-md shadow-pink-600/20',
    cardActiveBorder: 'border-pink-600',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-800',
    badgeBorder: 'border-pink-200/80',
    btnBg: 'bg-pink-600',
    btnHover: 'hover:bg-pink-700',
  },
  restaurantes: {
    bgGlow: 'bg-amber-200/40',
    cardActiveBg: 'bg-amber-600 text-white shadow-md shadow-amber-600/20',
    cardActiveBorder: 'border-amber-600',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-200/80',
    btnBg: 'bg-amber-600',
    btnHover: 'hover:bg-amber-700',
  },
  servicios: {
    bgGlow: 'bg-cyan-200/40',
    cardActiveBg: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20',
    cardActiveBorder: 'border-cyan-600',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-900',
    badgeBorder: 'border-cyan-200/80',
    btnBg: 'bg-cyan-600',
    btnHover: 'hover:bg-cyan-700',
  },
  infoproductos: {
    bgGlow: 'bg-indigo-200/40',
    cardActiveBg: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20',
    cardActiveBorder: 'border-indigo-600',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-900',
    badgeBorder: 'border-indigo-200/80',
    btnBg: 'bg-indigo-600',
    btnHover: 'hover:bg-indigo-700',
  },
};

const BENTO_NICHOS = [
  { id: 'todos', label: 'Todos los Nichos', subtext: 'Ver todo el catálogo', icon: '⚡' },
  { id: 'restaurantes', label: 'Restaurantes & Cafés', subtext: 'Carta QR, Pedidos, Stock & Caja', icon: '🍕' },
  { id: 'salones', label: 'Salones & Estética', subtext: 'Citas, Fidelización & Reactivación', icon: '💇‍♀️' },
  { id: 'servicios', label: 'Otros Negocios & A Medida', subtext: 'Bots y automatizaciones a medida', icon: '🚀' },
  { id: 'infoproductos', label: 'Recursos & Guías Gratis', subtext: 'Ebooks, guías PDF y plantillas n8n', icon: '🎁' },
];

const Soluciones: React.FC = () => {
  const [soluciones, setSoluciones] = useState<SolucionItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPersonalizada[]>([]);
  const [headerConfig, setHeaderConfig] = useState<SolucionesHeaderConfig>(HEADER_DEFAULT);
  const [activeTab, setActiveTab] = useState<string>('todos');
  const [restSubtab, setRestSubtab] = useState<'todos' | 'planes' | 'addons'>('planes');
  const [loading, setLoading] = useState(true);

  // Modales
  const [selectedDetailItem, setSelectedDetailItem] = useState<SolucionItem | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Korat Flow | Soluciones & Automatización';
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

  const activeTheme = TEMAS_PALETA[activeTab] || TEMAS_PALETA.todos;

  // Estado de sub-pestañas para Restaurantes y Salones
  const [nichoSubtab, setNichoSubtab] = useState<'planes' | 'addons'>('planes');

  // Filtrado
  const filteredSoluciones = soluciones.filter(item => {
    if (activeTab === 'todos') return true;
    if (item.categoria !== activeTab && !(activeTab === 'servicios' && item.categoria === 'transversales')) {
      return false;
    }
    if (activeTab === 'restaurantes' || activeTab === 'salones') {
      if (nichoSubtab === 'planes') {
        return item.subcategoria === 'plan_basico' || item.subcategoria === 'plan_pro';
      }
      if (nichoSubtab === 'addons') {
        return item.subcategoria === 'addon';
      }
    }
    return true;
  });

  const getSubtituloAdaptativo = () => {
    switch (activeTab) {
      case 'restaurantes':
        return '🍕 Automatización integral para Pedidos, Carta QR, Stock y Caja Chica';
      case 'salones':
        return '💇‍♀️ Agendamiento de citas, fidelización y recuperación de clientas inactivas';
      case 'servicios':
        return '🚀 Bots informativos 24/7 y automatizaciones a medida para clínicas, inmobiliarias y más';
      case 'infoproductos':
        return '🎁 Descarga recursos gratuitos, guías en PDF y plantillas n8n para potenciar tu negocio';
      default:
        return headerConfig.subtituloPersona;
    }
  };

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

    if (item.subcategoria === 'plan_basico') {
      return `💬 Consultar Plan Básico (WhatsApp)`;
    }

    if (item.subcategoria === 'plan_pro') {
      return `🔥 Probar Plan PRO en WhatsApp`;
    }

    if (item.subcategoria === 'addon') {
      return `💬 Consultar Add-On (${item.precio || 'WhatsApp'})`;
    }

    return `💬 Consultar por WhatsApp (${item.precio || 'WhatsApp'})`;
  };

  const renderMarkdownFormatted = (content?: string) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-sm font-black text-slate-900 mt-3 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-xs font-bold text-amber-800 mt-2 mb-1 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-600" />{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-2.5 p-3 bg-amber-50/80 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-950 font-medium leading-relaxed">
            {line.replace('> ', '').replace(/"/g, '')}
          </blockquote>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs text-slate-700 leading-normal">
            <span className="text-amber-600 font-bold text-sm">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      if (line.trim() === '') return <div key={idx} className="h-1" />;

      return <p key={idx} className="text-xs text-slate-600 leading-relaxed my-1">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center font-sans pb-24 overflow-x-hidden selection:bg-amber-500 selection:text-white">

      {/* ── LUZ DE FONDO ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          key={`glow-1-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[400px] h-[400px] ${activeTheme.bgGlow} rounded-full blur-[90px]`} 
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-4 flex flex-col items-center">

        {/* ════════════════════════════════
            1. HEADER CON FOTO & BRANDING
        ════════════════════════════════ */}
        <header className="w-full flex flex-col items-center text-center mb-5">
          {headerConfig.statusBadge && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold shadow-2xs mb-3"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="truncate">{headerConfig.statusBadge}</span>
            </motion.div>
          )}

          {/* FOTO MARTÍN */}
          <div className="relative mb-2 cursor-pointer">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-emerald-400 to-teal-500 shadow-md">
              <img
                src="/assets/images/martin-founder.jpg"
                alt="Martín Pestana - Korat Flow"
                className="w-full h-full rounded-full object-cover object-top border-2 border-white"
              />
            </div>
            <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1 rounded-full border-2 border-white shadow-xs" title="Verificado">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-lg font-black tracking-tight text-slate-900">
            {headerConfig.nombrePersona}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1 max-w-[320px] leading-relaxed">
            {getSubtituloAdaptativo()}
          </p>

          <div className="mt-2.5 flex items-center justify-center gap-2">
            {headerConfig.trustBadge1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100/90 border border-slate-200 text-[10px] font-bold text-slate-700">
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" /> {headerConfig.trustBadge1}
              </span>
            )}
            {headerConfig.trustBadge2 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100/90 border border-slate-200 text-[10px] font-bold text-slate-700">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {headerConfig.trustBadge2}
              </span>
            )}
          </div>
        </header>

        {/* ════════════════════════════════
            2. SELECTOR DE NICHOS (BENTO GRID 2x2 AMPLIO)
        ════════════════════════════════ */}
        <section className="w-full mb-4">
          <div className="px-1 mb-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" /> Elige tu tipo de negocio
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            {BENTO_NICHOS.map((nicho) => {
              const isActive = activeTab === nicho.id;
              const isLarge = nicho.id === 'todos';
              const nichoTheme = TEMAS_PALETA[nicho.id] || TEMAS_PALETA.todos;

              return (
                <motion.button
                  key={nicho.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setActiveTab(nicho.id);
                    if (nicho.id === 'restaurantes') setRestSubtab('planes');
                  }}
                  className={`
                    relative text-left rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden
                    ${isLarge 
                      ? 'col-span-2 flex items-center gap-3.5 p-3.5' 
                      : 'p-3 flex flex-col justify-between min-h-[108px]'
                    }
                    ${isActive
                      ? `${nichoTheme.cardActiveBg} ${nichoTheme.cardActiveBorder} ring-2 ring-amber-400/40 shadow-md`
                      : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300 shadow-2xs'
                    }
                  `}
                >
                  {isLarge ? (
                    <>
                      <span className={`text-2xl p-2.5 rounded-xl shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100 text-amber-600'}`}>
                        {nicho.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-black leading-snug ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {nicho.label}
                        </h3>
                        <p className={`text-xs leading-normal mt-0.5 ${isActive ? 'text-white/90 font-medium' : 'text-slate-500'}`}>
                          {nicho.subtext}
                        </p>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/25 text-white backdrop-blur-xs shrink-0">
                          ✓ Ver todo
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xl p-2 rounded-xl shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                          {nicho.icon}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-white backdrop-blur-xs">
                            ✓ Ver
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5">
                        <h3 className={`text-xs font-black leading-snug ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {nicho.label}
                        </h3>
                        <p className={`text-[10px] leading-tight mt-0.5 line-clamp-2 ${isActive ? 'text-white/90 font-medium' : 'text-slate-500'}`}>
                          {nicho.subtext}
                        </p>
                      </div>
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════
            3. SUB-TOGGLE DE PLANES VS ADD-ONS (RESTAURANTES Y SALONES)
        ════════════════════════════════ */}
        {(activeTab === 'restaurantes' || activeTab === 'salones') && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-2"
          >
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setNichoSubtab('planes')}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  nichoSubtab === 'planes'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>2 Planes (Básico vs PRO)</span>
              </button>

              <button
                onClick={() => setNichoSubtab('addons')}
                className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  nichoSubtab === 'addons'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Add-Ons Extras</span>
              </button>
            </div>

            {nichoSubtab === 'planes' && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="w-full py-2 px-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-700" />
                <span>Ver Tabla Comparativa (Básico vs PRO)</span>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
              </button>
            )}
          </motion.div>
        )}

        {/* ════════════════════════════════
            4. LISTADO Y CARDS DEL CATÁLOGO
        ════════════════════════════════ */}
        <main className="w-full flex flex-col gap-3.5">
          {/* HERO BANNER: KORAT POS EXPRESS (SAAS GRATUITO) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950 text-white rounded-3xl p-6 border-2 border-amber-500/40 shadow-xl relative overflow-hidden flex flex-col gap-4"
          >
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-black tracking-widest uppercase bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
                  ⚡ SISTEMA GRATUITO (FREEMIUM)
                </span>
                <h2 className="text-lg font-black mt-2 leading-tight">
                  Korat POS Express
                </h2>
                <p className="text-[11px] text-slate-300 font-bold mt-1">
                  ¡Dile adiós al cuaderno y al Excel! Controla tus ventas, deudas, stock y agenda desde tu celular.
                </p>
              </div>
              <span className="text-3xl shrink-0">📱</span>
            </div>

            {/* Grid of features */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-base shrink-0">📊</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-100">Caja Chica & Ventas</p>
                  <p className="text-[8px] text-slate-400 font-medium">Controla ingresos y egresos</p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-base shrink-0">📦</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-100">Inventario Auto-Descontable</p>
                  <p className="text-[8px] text-slate-400 font-medium">Alertas de stock crítico</p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-base shrink-0">🪑</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-100">Mesas & Personal</p>
                  <p className="text-[8px] text-slate-400 font-medium">Asigna mozos/personal</p>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <span className="text-base shrink-0">📅</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-slate-100">Agenda & Citas</p>
                  <p className="text-[8px] text-slate-400 font-medium">Historial y reservas</p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="flex flex-col gap-2.5 mt-2">
              <a
                href="/pos"
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer active:scale-95 text-center"
              >
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>⚡ EMPEZAR A USAR GRATIS AHORA</span>
              </a>
              <p className="text-[8px] text-center text-slate-400 font-medium">
                Ideal para Gastronomía, Estética, Veterinarias y Retail. Funciona offline y desde celulares.
              </p>
            </div>
          </motion.div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-7 h-7 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500">Cargando catálogo...</p>
            </div>
          ) : filteredSoluciones.length === 0 ? (
            <div className="py-10 text-center text-slate-600 text-xs bg-white rounded-2xl border border-slate-200 p-6 font-medium">
              No hay ítems registrados en este apartado.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredSoluciones.map((item) => {
                const waMessageBuy = item.mensaje_whatsapp || `Hola Martín! Vi tu perfil de TikTok y me interesa solicitar "${item.titulo}". ¿Me das información?`;
                const itemTheme = TEMAS_PALETA[item.categoria] || TEMAS_PALETA.todos;
                const buttonText = getButtonCopyText(item);
                const isProPlan = item.subcategoria === 'plan_pro';

                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={`
                      group relative bg-white border rounded-2xl p-4 shadow-2xs transition-all duration-150 flex flex-col justify-between
                      ${isProPlan 
                        ? 'border-amber-400 ring-2 ring-amber-400/30 bg-gradient-to-b from-amber-50/30 via-white to-white shadow-md' 
                        : 'border-slate-200/90 hover:border-slate-300'
                      }
                    `}
                  >
                    {/* BANDEROLA DESTACADA DE PLAN PRO */}
                    {isProPlan && (
                      <div className="mb-2 self-start bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1 uppercase tracking-wider">
                        <Sparkles className="w-3 h-3 fill-white" /> Recomendado TikTok (El más vendido)
                      </div>
                    )}

                    {/* ENCABEZADO CON ICONO + TITULOS */}
                    <div className="flex items-start gap-3 mb-2.5">
                      <span className={`text-2xl p-2 rounded-xl ${itemTheme.badgeBg} border ${itemTheme.badgeBorder} flex items-center justify-center shrink-0`}>
                        {item.icono || '🚀'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider block truncate ${itemTheme.badgeText}`}>
                          {item.subtitulo}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 leading-snug mt-0.5">
                          {item.titulo}
                        </h3>
                      </div>
                    </div>

                    {/* DESCRIPCIÓN CLARA */}
                    <p className="text-xs text-slate-600 leading-relaxed mb-3 font-normal">
                      {item.descripcion}
                    </p>

                    {/* BOTÓN SECUNDARIO: DETALLES EN MARKDOWN */}
                    <button
                      onClick={() => {
                        handleActionClick(`detail-${item.id}`);
                        setSelectedDetailItem(item);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-100/80 hover:bg-slate-100 transition-colors mb-2.5 border border-slate-200/80 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ver detalles completos & lo que incluye</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* BOTÓN PRINCIPAL ACCIÓN */}
                    <div className="w-full">
                      {item.tipo_boton === 'descarga' ? (
                        <motion.a
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleActionClick(item.id)}
                          href={item.url_checkout || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>{buttonText}</span>
                        </motion.a>
                      ) : (
                        <motion.a
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleActionClick(item.id)}
                          href={buildWaUrl(waMessageBuy)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-black text-xs shadow-xs transition-all cursor-pointer ${
                            isProPlan 
                              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' 
                              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4 fill-white" />
                          <span>{buttonText}</span>
                        </motion.a>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* ════════════════════════════════
          5. MODAL BOTTOMSHEET: TABLA COMPARATIVA
      ════════════════════════════════ */}
      <AnimatePresence>
        {showComparisonModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowComparisonModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeTab === 'salones' ? '💇‍♀️' : '🍕'}</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Cuadro Comparativo de Planes</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {activeTab === 'salones' ? 'Salones de Belleza & Estética (Nilah IA)' : 'Restaurantes & Cafeterías'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 mb-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="p-2.5 font-bold">Característica</th>
                      <th className="p-2.5 font-bold text-center bg-emerald-50 text-emerald-900">🟢 Básico</th>
                      <th className="p-2.5 font-bold text-center bg-amber-50 text-amber-900">🔥 PRO 360</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] text-slate-700">
                    {activeTab === 'salones' ? (
                      <>
                        <tr>
                          <td className="p-2.5 font-medium">Agenda Interactiva & Portal Móvil de Citas</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Bot Informativo 24/7 (Enlace de Citas)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Recordatorios Anti-Plantones (24h y 3h antes)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Ficha Técnica & Registro de Fórmulas/Tintes</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Recordatorio Automático de Retoque (Uñas/Tinte)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Club de Puntos VIP & Fidelización por WhatsApp</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Reactivación Automática (35/60/90 días)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Mensajes Masivos Promocionales (4/mes)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Finanzas del Día & Arqueo de Caja Chica</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Control de Insumos (Tintes, esmaltes, etc.)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Nilah Creative (Generador Redes/TikTok)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Notas Ocultas ("Whisper") en Chat de Equipo</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td className="p-2.5 font-medium">Menú Digital QR + Webapp PWA</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Bot WhatsApp 24/7 (Voz & Texto)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Auditoría IA Yape/Plin (Anti-Estafas)</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Alertas de Cocina a WhatsApp</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Control de Inventario & Receta por plato</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Alertas de Stock Bajo en WhatsApp</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Arqueo de Caja Chica & Utilidad</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium">Club de Puntos & Fidelización CRM</td>
                          <td className="p-2.5 text-center bg-emerald-50/40"><XCircle className="w-4 h-4 text-slate-300 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-amber-50/40"><CheckCircle2 className="w-4 h-4 text-amber-600 mx-auto" /></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              <a
                href={buildWaUrl(
                  activeTab === 'salones'
                    ? 'Hola Martín! Quisiera consultar la diferencia entre el Plan Básico Nilah Starter y el Plan PRO Glow Pro para mi salón de belleza.'
                    : 'Hola Martín! Quisiera consultar la diferencia entre el Plan Básico y el Plan PRO para mi restaurante.'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Consultar por WhatsApp</span>
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════
          6. MODAL BOTTOMSHEET: DETALLES EN MARKDOWN
      ════════════════════════════════ */}
      <AnimatePresence>
        {selectedDetailItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setSelectedDetailItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl p-2 rounded-xl bg-amber-50 border border-amber-200/80 shrink-0">
                    {selectedDetailItem.icono || '🚀'}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 leading-snug">{selectedDetailItem.titulo}</h3>
                    <p className="text-[11px] text-amber-800 font-bold truncate">{selectedDetailItem.subtitulo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-2 leading-relaxed">
                {renderMarkdownFormatted(selectedDetailItem.contenido_detalle_markdown || selectedDetailItem.descripcion)}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <a
                  href={buildWaUrl(selectedDetailItem.mensaje_whatsapp || `Hola Martín! Quisiera información sobre ${selectedDetailItem.titulo}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Consultar por WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Soluciones;
