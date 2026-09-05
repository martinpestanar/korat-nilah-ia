import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Zap, Sparkles, ArrowRight, ShieldCheck, Tag, Download, Check, Star, ChevronRight, X, Info, Layers, CheckCircle2, XCircle, Sliders, Calendar, Sparkle, Laptop, BookOpen, FileText } from 'lucide-react';
import { getSoluciones, getCategorias, getHeaderConfig, trackSolucionClick, SolucionItem, CategoriaPersonalizada, SolucionesHeaderConfig, HEADER_DEFAULT } from '../services/solucionesService';
import { usePageTracker } from '../hooks/usePageTracker';

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
  tengo_salon: {
    bgGlow: 'bg-pink-300/30',
    cardActiveBg: 'bg-pink-600 text-white shadow-md shadow-pink-600/20',
    cardActiveBorder: 'border-pink-600',
    badgeBg: 'bg-pink-50',
    badgeText: 'text-pink-800',
    badgeBorder: 'border-pink-200/80',
    btnBg: 'bg-pink-600',
    btnHover: 'hover:bg-pink-700',
  },
  quiero_independizarme: {
    bgGlow: 'bg-purple-300/30',
    cardActiveBg: 'bg-purple-600 text-white shadow-md shadow-purple-600/20',
    cardActiveBorder: 'border-purple-600',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-200/80',
    btnBg: 'bg-purple-600',
    btnHover: 'hover:bg-purple-700',
  },
  guias_plantillas: {
    bgGlow: 'bg-emerald-300/30',
    cardActiveBg: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20',
    cardActiveBorder: 'border-emerald-600',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-200/80',
    btnBg: 'bg-emerald-600',
    btnHover: 'hover:bg-emerald-700',
  },
  modulos_addons: {
    bgGlow: 'bg-violet-300/30',
    cardActiveBg: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20',
    cardActiveBorder: 'border-violet-600',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-900',
    badgeBorder: 'border-violet-200/80',
    btnBg: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
    btnHover: 'hover:from-violet-700 hover:to-fuchsia-700',
  },
};

const BENTO_NICHOS = [
  { id: 'tengo_salon', label: 'Ya tengo mi salón', subtext: 'Dueñas de salón, spa o independientes con clientas', icon: '🏢' },
  { id: 'quiero_independizarme', label: 'Quiero independizarme', subtext: 'Lashistas y manicuristas en formación', icon: '🚀' },
  { id: 'guias_plantillas', label: 'Guías y plantillas gratis', subtext: 'Recursos por especialidad: uñas, pestañas y cejas', icon: '📚' },
  { id: 'modulos_addons', label: 'Módulos & Herramientas', subtext: 'Automatizaciones de WhatsApp a la carta y Plan PRO 360°', icon: '⚡' },
];

const Soluciones: React.FC = () => {
  const navigate = useNavigate();
  const { trackClick, trackCustomEvent } = usePageTracker({ pagePath: '/soluciones' });
  const [soluciones, setSoluciones] = useState<SolucionItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPersonalizada[]>([]);
  const [headerConfig, setHeaderConfig] = useState<SolucionesHeaderConfig>(HEADER_DEFAULT);
  const [activeTab, setActiveTab] = useState<string>('tengo_salon');
  const [loading, setLoading] = useState(true);

  // Modales
  const [selectedDetailItem, setSelectedDetailItem] = useState<SolucionItem | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState<boolean>(false);

  // Estado de Calculadora de No-Shows
  const [citasPerdidas, setCitasPerdidas] = useState<number>(4);
  const [ticketPromedio, setTicketPromedio] = useState<number>(45);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'Martín Pestana | Retención & Ventas por WhatsApp para Salones';
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

  const activeTheme = TEMAS_PALETA[activeTab] || TEMAS_PALETA.tengo_salon;

  // Filtrado estricto por categoría seleccionada
  const filteredSoluciones = soluciones.filter(item => {
    return item.categoria === activeTab;
  });

  const getSubtituloAdaptativo = () => {
    return headerConfig.subtituloPersona || '3 años dentro de un salón de belleza me enseñaron esto: no te faltan clientas nuevas, te faltan clientas que regresen. Construí Nilah para eso.';
  };

  const handleAction = async (item: SolucionItem) => {
    // 1. Telemetría de Alta Fidelidad
    const isWhatsApp = !item.url_demo && item.tipo_boton !== 'descarga';
    trackClick(
      item.id,
      item.titulo,
      isWhatsApp ? 'whatsapp' : item.subcategoria || 'solucion',
      { precio: item.precio, tipo_boton: item.tipo_boton, categoria: item.categoria }
    );
    await trackSolucionClick(item.id);

    if (item.id === 'calculadora-no-shows') {
      setShowCalculatorModal(true);
      trackCustomEvent('modal_open', 'calculadora-no-shows', 'Modal Calculadora No-Shows', 'calculator');
      return;
    }

    if (item.tipo_boton === 'descarga' && item.url_checkout) {
      window.location.href = item.url_checkout;
      return;
    }

    if (item.url_demo) {
      if (item.url_demo.startsWith('/')) {
        navigate(item.url_demo);
      } else {
        window.open(item.url_demo, '_blank');
      }
      return;
    }

    // Default: WhatsApp directo
    const text = encodeURIComponent(item.mensaje_whatsapp);
    window.open(`https://wa.me/${headerConfig.whatsappNumber || WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  // Render Markdown simplificado para el modal
  const renderMarkdown = (content: string) => {
    if (!content) return null;
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-black text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h4 key={idx} className="text-xs font-black uppercase tracking-wider text-pink-600 mt-3 mb-1">
            {line.replace('#### ', '')}
          </h4>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-2.5 p-3 bg-pink-50/80 border-l-4 border-pink-500 rounded-r-xl text-xs text-pink-950 font-medium leading-relaxed">
            {line.replace('> ', '').replace(/"/g, '')}
          </blockquote>
        );
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 text-xs text-slate-700 leading-normal">
            <span className="text-pink-600 font-bold text-sm">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      if (line.trim() === '') return <div key={idx} className="h-1" />;

      return <p key={idx} className="text-xs text-slate-600 leading-relaxed my-1">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center font-sans pb-24 overflow-x-hidden selection:bg-pink-500 selection:text-white">

      {/* ── LUZ DE FONDO ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          key={`glow-1-${activeTab}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] ${activeTheme.bgGlow} rounded-full blur-[100px]`} 
        />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 pt-4 flex flex-col items-center">

        {/* ════════════════════════════════
            1. HOOK PRINCIPAL
        ════════════════════════════════ */}
        <header className="w-full flex flex-col items-center text-center mb-4">
          {/* FOTO MARTÍN */}
          <div className="relative mb-2 cursor-pointer">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-pink-500 via-rose-400 to-purple-500 shadow-md">
              {!imgError ? (
                <img
                  src="/assets/images/martin-founder.jpeg"
                  alt="Martín Pestana - Creador de Nilah"
                  onError={() => setImgError(true)}
                  className="w-full h-full rounded-full object-cover object-top border-2 border-white"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-slate-900 via-purple-950 to-pink-900 flex items-center justify-center text-white font-black text-xl border-2 border-white">
                  MP
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-pink-600 text-white p-1 rounded-full border-2 border-white shadow-xs" title="Verificado">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>

          <h1 className="text-xl font-black tracking-tight text-slate-900">
            {headerConfig.nombrePersona || 'Martín Pestana'}
          </h1>
          <p className="text-xs text-slate-600 font-medium mt-1.5 max-w-[340px] leading-relaxed">
            {getSubtituloAdaptativo()}
          </p>

          {/* PILLS DEBAJO */}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-pink-200 text-[11px] font-bold text-pink-900 shadow-2xs">
              <Check className="w-3 h-3 text-pink-600 stroke-[3]" /> {headerConfig.trustBadge1 || 'Cero plantones en citas'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-purple-200 text-[11px] font-bold text-purple-900 shadow-2xs">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {headerConfig.trustBadge2 || 'Recordatorios de retoque automáticos'}
            </span>
          </div>
        </header>

        {/* ════════════════════════════════
            2. CARD FREEMIUM
        ════════════════════════════════ */}
        <section className="w-full mb-4">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full rounded-[2rem] bg-gradient-to-b from-[#16161f] via-[#111116] to-[#0d0d12] border border-white/10 p-5 sm:p-6 shadow-2xl text-white relative overflow-hidden"
          >
            {/* Glows de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header del Freemium */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <Zap size={12} className="fill-amber-400" />
                <span>{headerConfig.freemiumBadge || 'Sistema gratuito · hasta 100 clientas'}</span>
              </div>
              <span className="text-2xl p-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                📱
              </span>
            </div>

            <h2 className="text-lg font-black text-white tracking-tight leading-tight">
              {headerConfig.freemiumTitulo || 'Nilah App — Dile adiós al cuaderno y al Excel'}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              {headerConfig.freemiumSubtitulo || 'Todo el control de tu salón desde el celular: cuánto ganaste, quién es tu clienta VIP, quién no ha vuelto y cuánto le debes pagar a tu equipo. Gratis hasta 100 clientas, sin tarjeta.'}
            </p>

            {/* Grid 2x2 de Mini-cards */}
            <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">💰</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white leading-tight">
                    {headerConfig.freemiumFeature1Title || 'Tus números del día'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {headerConfig.freemiumFeature1Desc || 'Ventas, ticket promedio y ocupación, sin sacar la calculadora'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">📅</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white leading-tight">
                    {headerConfig.freemiumFeature2Title || 'Agenda a tu manera'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {headerConfig.freemiumFeature2Desc || 'Vista de mes, semana o día — elige cómo te acomoda organizarte'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">👥</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white leading-tight">
                    {headerConfig.freemiumFeature3Title || 'Sabe quién es quién'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {headerConfig.freemiumFeature3Desc || 'Identifica en un clic a tus clientas VIP, recurrentes y las que ya no vuelven'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/5 flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">💵</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white leading-tight">
                    {headerConfig.freemiumFeature4Title || 'Comisiones sin pelear'}
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {headerConfig.freemiumFeature4Desc || 'Registra gastos fijos y calcula el pago justo a tus colaboradoras'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de Registro Gratis */}
            <a
              href={headerConfig.freemiumBotonUrl || '/nilah/login?tab=register'}
              onClick={() => trackClick('freemium_hero_btn', 'Empezar gratis Nilah App (Hero)', 'freemium')}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-95 transition-all text-center uppercase tracking-wider"
            >
              <Zap size={15} className="fill-slate-950" />
              <span>{headerConfig.freemiumBotonTexto || 'Empezar gratis ahora'}</span>
            </a>

            {/* Micro-texto */}
            <p className="text-[10px] text-center text-slate-400 mt-2.5 leading-tight">
              {headerConfig.freemiumDisclaimer || 'Ideal para lashistas, manicuristas y salones. Sin tarjeta de crédito. Hasta 100 clientas 100% gratis.'}
            </p>
          </motion.div>
        </section>

        {/* ════════════════════════════════
            3. BLOQUE LEAD MAGNET (DESTACADO)
        ════════════════════════════════ */}
        <section className="w-full mb-4">
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-purple-700 p-4 sm:p-5 text-white shadow-xl shadow-pink-600/20 relative overflow-hidden group cursor-pointer"
            onClick={() => {
              trackClick('leadmagnet_banner_click', 'Ebook: De aprendiz a dueña (Banner)', 'educacion');
              navigate('/ebooks/de-aprendiz-a-duena');
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                🎁 Ebook Gratis · 10 Capítulos
              </span>
              <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">📖</span>
            </div>

            <h3 className="text-base font-black text-white leading-tight group-hover:text-pink-100 transition-colors">
              Ebook: de aprendiz a dueña de tu salón
            </h3>
            <p className="text-xs text-pink-100 font-medium mt-1 leading-relaxed">
              El método que uso para ayudar a lashistas y manicuristas a pasar de trabajar para otros a tener sus primeras clientas propias, sin quemarse en el intento.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
              <Link
                to="/ebooks/de-aprendiz-a-duena"
                onClick={() => trackClick('leadmagnet_btn_online', 'Ebook De Aprendiz: Leer online', 'educacion')}
                className="py-2.5 px-3 rounded-xl bg-white hover:bg-pink-50 text-pink-700 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center"
              >
                <BookOpen size={14} />
                <span>Leer online</span>
              </Link>
              <Link
                to="/ebooks/de-aprendiz-a-duena"
                onClick={() => trackClick('leadmagnet_btn_download', 'Ebook De Aprendiz: Descargar PDF', 'download')}
                className="py-2.5 px-3 rounded-xl bg-black/20 hover:bg-black/30 border border-white/30 text-white font-black text-xs flex items-center justify-center gap-1.5 backdrop-blur-xs active:scale-95 transition-all text-center"
              >
                <Download size={14} />
                <span>PDF & Word</span>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════
            4. SELECCIONA TU ÁREA DE INTERÉS (3 CATEGORÍAS)
        ════════════════════════════════ */}
        <section className="w-full mb-3">
          <div className="px-1 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-pink-500" /> Selecciona tu área de interés
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 w-full">
            {BENTO_NICHOS.map((nicho) => {
              const isActive = activeTab === nicho.id;
              const nichoTheme = TEMAS_PALETA[nicho.id] || TEMAS_PALETA.tengo_salon;

              return (
                <motion.button
                  key={nicho.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(nicho.id);
                    trackCustomEvent('tab_change', nicho.id, `Pestaña: ${nicho.label}`, 'navigation');
                  }}
                  className={`
                    relative text-left rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden p-3.5 flex items-center gap-3.5
                    ${isActive
                      ? `${nichoTheme.cardActiveBg} ${nichoTheme.cardActiveBorder} ring-2 ring-pink-400/40 shadow-md`
                      : 'bg-white border-slate-200/90 text-slate-900 hover:border-slate-300 shadow-2xs'
                    }
                  `}
                >
                  <span className={`text-2xl p-2 rounded-xl shrink-0 ${isActive ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {nicho.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-black leading-snug ${isActive ? 'text-white' : 'text-slate-900'}`}>
                      {nicho.label}
                    </h3>
                    <p className={`text-[11px] leading-normal mt-0.5 ${isActive ? 'text-white/90 font-medium' : 'text-slate-500'}`}>
                      {nicho.subtext}
                    </p>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/25 text-white backdrop-blur-xs shrink-0">
                      ✓ Ver
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════
            LISTA DE CARDS DE LA CATEGORÍA
        ════════════════════════════════ */}
        <main className="w-full space-y-3 mt-1 mb-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
              <p className="text-xs font-bold text-slate-500">Cargando recursos...</p>
            </div>
          ) : filteredSoluciones.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500 font-bold">No hay recursos en esta categoría.</p>
            </div>
          ) : (
            filteredSoluciones.map((item) => {
              const isCalc = item.id === 'calculadora-no-shows';

              return (
                <motion.article
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden shadow-xs hover:shadow-md ${
                    item.subcategoria === 'plan_pro'
                      ? 'bg-gradient-to-b from-purple-50/70 via-white to-pink-50/40 border-2 border-violet-500 shadow-violet-500/10'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Badge Superior & Precio */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xl p-1.5 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                        {item.icono}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.subcategoria === 'plan_pro'
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xs'
                          : 'bg-pink-50 text-pink-700 border border-pink-200/80'
                      }`}>
                        {item.badge}
                      </span>
                    </div>

                    {item.precio && item.precio !== 'Gratis' && (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-black shadow-xs">
                        {item.precio}
                      </span>
                    )}
                  </div>

                  {/* Título & Subtítulo */}
                  <h2 className="text-sm font-black text-slate-900 leading-snug">
                    {item.titulo}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-snug">
                    {item.subtitulo}
                  </p>

                  {/* Descripción */}
                  <p className="text-xs text-slate-700 leading-relaxed mt-2">
                    {item.descripcion}
                  </p>

                  {/* Botones de Acción */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleAction(item)}
                      className={`
                        flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer
                        ${isCalc 
                          ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' 
                          : item.subcategoria === 'plan_pro'
                          ? 'bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-600/25'
                          : 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/20'
                        }
                      `}
                    >
                      {isCalc ? <Sliders size={15} /> : <MessageCircle size={15} />}
                      <span>{item.texto_boton_personalizado || 'Descargar gratis'}</span>
                    </button>

                    {item.contenido_detalle_markdown && !isCalc && (
                      <button
                        onClick={() => setSelectedDetailItem(item)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        title="Ver detalle completo"
                      >
                        <Info size={16} />
                      </button>
                    )}
                  </div>
                </motion.article>
              );
            })
          )}
        </main>

        {/* ════════════════════════════════
            5. COMPARACIÓN DE PLANES (DESPUÉS DE LAS CATEGORÍAS)
        ════════════════════════════════ */}
        <section className="w-full mb-5">
          <div className="px-1 mb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkle className="w-3.5 h-3.5 text-pink-500" /> Comparación de Planes
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 w-full">
            {/* PLAN BÁSICO */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    ESENCIAL PARA EMPEZAR
                  </span>
                  <span className="text-xl">🌱</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">Plan Básico (Freemium)</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Orden, agenda y ficha técnica para profesionales independientes hasta 100 clientas registradas.
                </p>
                <div className="my-2.5 py-1.5 border-y border-slate-100">
                  <span className="text-xl font-black text-slate-900">$0 USD</span>
                  <span className="text-xs text-slate-500 font-medium"> /de por vida (Sin tarjeta)</span>
                </div>
              </div>
              <a
                href="/nilah/login?tab=register"
                onClick={() => trackClick('plan_basico_cta', 'Plan Básico $0 (Comparativa)', 'freemium')}
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs text-center block active:scale-95 transition-all"
              >
                Empezar gratis
              </a>
            </div>

            {/* PLAN PRO 360 */}
            <div className="rounded-2xl border-2 border-violet-500 bg-gradient-to-b from-purple-50/60 via-white to-pink-50/40 p-4 sm:p-5 shadow-md shadow-violet-500/10 flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-2xs">
                    TODO INCLUIDO · EL QUE SE PAGA SOLO
                  </span>
                  <span className="text-xl">💎</span>
                </div>
                <h3 className="text-sm font-black text-slate-900">Plan PRO 360°</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Todos los 5 módulos de WhatsApp + Kit QR Reseñas Google + Clientas ilimitadas + Instalación asistida con Martín.
                </p>
                <div className="my-2.5 py-1.5 border-y border-violet-200">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-slate-900">$100 USD</span>
                    <span className="text-xs text-violet-700 font-bold">/mes (~S/ 335 PEN)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Comprado por separado: $170 USD/mes · Ahorras $70/mes</p>
                </div>
              </div>
              <a
                href={`https://wa.me/${headerConfig.whatsappNumber || WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola Martín! Quiero activar el PLAN PRO 360° ($100 USD / S/ 335 PEN) con todas las automatizaciones de WhatsApp en mi salón.')}`}
                onClick={() => trackClick('plan_pro_whatsapp_cta', 'Activar Plan PRO 360 ($100/mes)', 'whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 hover:from-violet-700 hover:to-purple-700 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              >
                <MessageCircle size={14} />
                <span>🔥 Activar Plan PRO con Martín</span>
              </a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            6. CTA FINAL (PROYECTOS A MEDIDA)
        ════════════════════════════════ */}
        <section className="w-full mt-2 mb-4">
          <div className="w-full p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white border border-violet-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                {headerConfig.statusBadge || 'Cupos abiertos para salones y proyectos a medida'}
              </span>
            </div>

            <h3 className="text-sm font-black text-white leading-tight">
              {headerConfig.aMedidaTitulo || '¿Tienes una cadena de salones o necesitas algo hecho a tu medida? Hablemos.'}
            </h3>
            <p className="text-xs text-violet-200/80 mt-1 leading-relaxed">
              {headerConfig.aMedidaSubtitulo || 'Hablemos sobre flujos de WhatsApp, integraciones personalizadas o desarrollos a medida.'}
            </p>

            <div className="mt-3.5">
              <a
                href={`https://wa.me/${headerConfig.whatsappNumber || WHATSAPP_NUMBER}?text=${encodeURIComponent(headerConfig.aMedidaWhatsappMensaje || '¡Hola Martín! Tengo una cadena de salones / proyecto especial y me gustaría agendar una llamada.')}`}
                onClick={() => trackClick('cta_a_medida', 'Agenda una llamada a medida', 'whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center"
              >
                <span>{headerConfig.aMedidaBotonTexto || 'Agenda una llamada'}</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            FOOTER CON CONTACTO DIRECTO
        ════════════════════════════════ */}
        <footer className="w-full mt-4 text-center text-xs text-slate-500 space-y-2">
          <p className="font-bold text-slate-700">
            {headerConfig.footerPregunta || HEADER_DEFAULT.footerPregunta}
          </p>
          <a
            href={`https://wa.me/${headerConfig.whatsappNumber || WHATSAPP_NUMBER}?text=${encodeURIComponent(headerConfig.footerWhatsappMensaje || HEADER_DEFAULT.footerWhatsappMensaje)}`}
            onClick={() => trackClick('footer_whatsapp_direct', 'WhatsApp Footer Directo', 'whatsapp')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-pink-600 hover:underline"
          >
            <MessageCircle size={14} /> {headerConfig.footerBotonTexto || HEADER_DEFAULT.footerBotonTexto}
          </a>
          <p className="text-[10px] text-slate-400 pt-2">
            © {new Date().getFullYear()} Nilah IA & Martín Pestana · Todos los derechos reservados.
          </p>
        </footer>

      </div>

      {/* ════════════════════════════════
          MODAL: DETALLES DE SOLUCIÓN / RECURSO
      ════════════════════════════════ */}
      <AnimatePresence>
        {selectedDetailItem && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedDetailItem.icono}</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {selectedDetailItem.titulo}
                    </h3>
                    <span className="text-[10px] font-bold text-pink-600 uppercase">
                      {selectedDetailItem.badge}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="text-xs text-slate-700 space-y-2">
                {renderMarkdown(selectedDetailItem.contenido_detalle_markdown || selectedDetailItem.descripcion)}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => {
                    const item = selectedDetailItem;
                    setSelectedDetailItem(null);
                    handleAction(item);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <MessageCircle size={15} />
                  <span>{selectedDetailItem.texto_boton_personalizado || 'Descargar por WhatsApp'}</span>
                </button>
                <button
                  onClick={() => setSelectedDetailItem(null)}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════
          MODAL: CALCULADORA INTERACTIVA DE NO-SHOWS
      ════════════════════════════════ */}
      <AnimatePresence>
        {showCalculatorModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🧮</span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Calculadora de Pérdidas por No-Shows
                    </h3>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">
                      Diagnóstico Financiero en 1 Minuto
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalculatorModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-700">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Citas que te dejan plantada por semana: <span className="text-pink-600 font-extrabold">{citasPerdidas} citas</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={citasPerdidas}
                    onChange={(e) => setCitasPerdidas(Number(e.target.value))}
                    className="w-full accent-pink-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 cita/sem</span>
                    <span>20 citas/sem</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Precio promedio de tu servicio: <span className="text-pink-600 font-extrabold">S/ {ticketPromedio}</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={250}
                    step={5}
                    value={ticketPromedio}
                    onChange={(e) => setTicketPromedio(Number(e.target.value))}
                    className="w-full accent-pink-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>S/ 20</span>
                    <span>S/ 250</span>
                  </div>
                </div>

                {/* RESULTADOS */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border border-pink-200 text-center space-y-1">
                  <p className="text-[11px] font-bold text-rose-800">Estás perdiendo aproximadamente:</p>
                  <div className="text-2xl font-black text-rose-600">
                    S/ {citasPerdidas * ticketPromedio * 4} <span className="text-xs font-bold text-rose-500">/mes</span>
                  </div>
                  <p className="text-[10px] text-rose-700 font-medium">
                    (Es decir, más de S/ {(citasPerdidas * ticketPromedio * 4 * 12).toLocaleString()} al año que se van en turnos vacíos)
                  </p>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  💡 Con el <strong>Plan PRO 360°</strong> de Nilah, los recordatorios automáticos de WhatsApp 24h y 3h antes reducen hasta un 85% estas inasistencias.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex gap-2">
                <a
                  href={`https://wa.me/${headerConfig.whatsappNumber || WHATSAPP_NUMBER}?text=${encodeURIComponent(`¡Hola Martín! Hice el cálculo y mi salón pierde aprox. S/ ${citasPerdidas * ticketPromedio * 4} al mes por no-shows. Quiero implementar los recordatorios automáticos de Nilah.`)}`}
                  onClick={() => trackClick('calc_whatsapp_cta', 'Eliminar No-Shows (Calculadora WhatsApp)', 'whatsapp', { citasPerdidas, ticketPromedio, perdidaMensual: citasPerdidas * ticketPromedio * 4 })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center cursor-pointer"
                >
                  <MessageCircle size={15} />
                  <span>Eliminar No-Shows con Nilah</span>
                </a>
                <button
                  onClick={() => setShowCalculatorModal(false)}
                  className="py-3 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════
          MODAL: COMPARATIVA BÁSICO VS PRO (DUAL TIER MODERNO)
      ════════════════════════════════ */}
      <AnimatePresence>
        {showComparisonModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-2xl rounded-t-3xl sm:rounded-[2rem] bg-white p-5 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-5">
                <div>
                  <span className="text-[10px] font-black text-pink-600 uppercase tracking-wider">
                    Comparativa de Versiones
                  </span>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    ¿Plan Glow Básico o Glow PRO?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Elige el nivel de control y automatización para tu salón
                  </p>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              {/* DUAL CARDS SIDE BY SIDE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ── CARD 1: GLOW BÁSICO ── */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                        100% GRATIS
                      </span>
                      <span className="text-xl">🌱</span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">Plan Glow Básico</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                      Para dejar la libreta y organizar tu agenda y fichas desde tu celular.
                    </p>

                    <div className="my-3 py-2 border-y border-slate-200/80">
                      <span className="text-2xl font-black text-slate-900">S/ 0</span>
                      <span className="text-xs text-slate-500 font-medium"> /de por vida</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>Agenda digital móvil</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>Ficha técnica de clientas (alergias/tonos)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>Control de caja chica e ingresos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>Hasta 100 clientas registradas</span>
                      </li>
                      <li className="flex items-start gap-2 opacity-50">
                        <XCircle size={15} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>Sin recordatorios de WhatsApp</span>
                      </li>
                      <li className="flex items-start gap-2 opacity-50">
                        <XCircle size={15} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>Sin avisos de retoques automáticos</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="/nilah/login?tab=register"
                    className="mt-5 w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs text-center block active:scale-95 transition-all"
                  >
                    Empezar Gratis
                  </a>
                </div>

                {/* ── CARD 2: GLOW PRO ── */}
                <div className="rounded-2xl border-2 border-pink-500 bg-gradient-to-b from-pink-50/50 via-white to-pink-50/30 p-5 flex flex-col justify-between shadow-lg shadow-pink-500/10 relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-600 text-white shadow-xs">
                        AUTOMATIZACIÓN 360°
                      </span>
                      <span className="text-xl">⭐</span>
                    </div>

                    <h4 className="text-base font-black text-slate-900">Plan Glow PRO</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                      El motor de ventas y retención que llena tu salón sin esfuerzo manual.
                    </p>

                    <div className="my-3 py-2 border-y border-pink-200">
                      <span className="text-2xl font-black text-pink-600">S/ 149</span>
                      <span className="text-xs text-slate-500 font-medium"> /mes</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-800 font-medium">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-pink-600 shrink-0 mt-0.5" />
                        <span><strong>Todo lo del Plan Básico</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-pink-600 shrink-0 mt-0.5" />
                        <span>Recordatorios WhatsApp 24h y 3h antes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-pink-600 shrink-0 mt-0.5" />
                        <span>Aviso automático de retoques a los 21d</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-pink-600 shrink-0 mt-0.5" />
                        <span>Rescate de clientas dormidas (45d / 75d / 120d)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-pink-600 shrink-0 mt-0.5" />
                        <span>Campañas masivas para días flojos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-pink-600 shrink-0 mt-0.5" />
                        <span>Stand QR Acrílico Reseñas 5★ Google</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-pink-600 shrink-0 mt-0.5" />
                        <span>Club de Puntos y Clientas ILIMITADAS</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola Martín! Vi la comparativa y quiero activar el PLAN GLOW PRO 360° en mi salón.')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 w-full py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <MessageCircle size={15} />
                    <span>Activar Glow PRO por WhatsApp</span>
                  </a>
                </div>

              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-center">
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="py-2 px-6 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                >
                  Cerrar Comparativa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════
          BOTÓN FLOTANTE DE WHATSAPP (MOBILE-FIRST 100%)
      ════════════════════════════════ */}
      <motion.aside
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 pb-safe"
      >
        {/* Pill / Tooltip en Desktop y Mobile Compacto */}
        <div className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-slate-900/90 text-white text-xs font-bold shadow-lg backdrop-blur-xs border border-white/10 pointer-events-none transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>¿Tienes dudas? Escríbeme</span>
        </div>

        {/* Botón WhatsApp Touch Target Óptimo */}
        <motion.a
          href={`https://wa.me/${headerConfig.whatsappNumber || WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola Martín! Tengo una duda sobre las soluciones y planes para mi salón/negocio.')}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="relative h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da851] text-white flex items-center justify-center shadow-2xl shadow-emerald-600/40 transition-shadow duration-300 focus:outline-hidden touch-manipulation select-none"
          title="Soporte y dudas por WhatsApp directo"
          aria-label="Contactar soporte por WhatsApp"
        >
          {/* Efecto Glow / Ping */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

          {/* Logo Oficial de WhatsApp SVG */}
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current relative z-10" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>

          {/* Indicador de Estado En Línea */}
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
          </span>
        </motion.a>
      </motion.aside>

    </div>
  );
};

export default Soluciones;
