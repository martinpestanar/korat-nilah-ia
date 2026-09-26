import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Check, Copy, Moon, Sun, Loader2, Sparkles,
  BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText,
  ChevronRight, Share2, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Users, Smartphone, Zap, Sparkle, Lightbulb, DollarSign,
  HelpCircle, Eye, Star, Flame, Scissors, List, X, ChevronUp, Layers,
  Phone, Calendar, Sliders, Play, Crown
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const MetodoNilahEbook: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>('intro');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<boolean>(false);
  const [readProgress, setReadProgress] = useState<number>(0);
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [interactiveCart, setInteractiveCart] = useState<string[]>(['Lifting de Pestañas']);

  useEffect(() => {
    document.title = 'El Método Nilah: La Biblia del Marketing y WhatsApp para Salones | Martín Pestana';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadProgress(progress);
      }

      const chapters = ['intro', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7', 'cap8', 'cap9', 'cap10', 'cierre'];
      for (let i = chapters.length - 1; i >= 0; i--) {
        const el = document.getElementById(chapters[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 240) {
            setActiveChapter(chapters[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const scrollToSection = (id: string) => {
    setShowMobileDrawer(false);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -75;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 200);
  };

  const toggleCartService = (srv: string) => {
    if (interactiveCart.includes(srv)) {
      setInteractiveCart(interactiveCart.filter(s => s !== srv));
    } else {
      setInteractiveCart([...interactiveCart, srv]);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-neutral-950 text-slate-100' : 'bg-[#faf9f6] text-slate-900'} pb-32`}>
      
      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gray-200/50 dark:bg-neutral-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* ── HEADER DE NAVEGACIÓN SUPERIOR ── */}
      <nav className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        isDark ? 'bg-neutral-950/90 border-neutral-800' : 'bg-white/90 border-slate-200/80'
      } px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/soluciones')}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'border-neutral-800 hover:bg-neutral-900 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
              PLAYBOOK SAAS
            </span>
            <h1 className="text-xs sm:text-sm font-black truncate max-w-[200px] sm:max-w-xs">
              El Método Nilah
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Drawer Capítulos (Mobile) */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white shadow-sm active:scale-95 transition-all"
          >
            <List size={14} />
            <span className="hidden sm:inline">Capítulos</span>
          </button>

          {/* Toggle Modo Oscuro */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'border-neutral-800 text-amber-400 bg-neutral-900' : 'border-slate-200 text-slate-600 bg-white'
            }`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Imprimir / PDF */}
          <button
            onClick={handleDownloadPDF}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'border-neutral-800 text-slate-300' : 'border-slate-200 text-slate-700'
            }`}
            title="Imprimir o guardar PDF"
          >
            {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          </button>
        </div>
      </nav>

      {/* ── MODAL DRAWER DE CAPÍTULOS (MOBILE & DESKTOP) ── */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMobileDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className={`relative z-10 w-80 max-w-[85vw] h-full p-5 overflow-y-auto ${
                isDark ? 'bg-neutral-900 text-white' : 'bg-white text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800">
                <span className="text-xs font-black uppercase tracking-wider text-rose-500">Índice del Libro</span>
                <button onClick={() => setShowMobileDrawer(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5 py-4">
                {[
                  { id: 'intro', label: 'Introducción: La Gran Mentira del Marketing' },
                  { id: 'cap1', label: 'Capítulo 1: El Colapso del Marketing Tradicional' },
                  { id: 'cap2', label: 'Capítulo 2: Psicología de la Clienta & 3 Miedos' },
                  { id: 'cap3', label: 'Capítulo 3: La Carta Interactiva Silenciosa' },
                  { id: 'cap4', label: 'Capítulo 4: El Arte del Cierre por WhatsApp' },
                  { id: 'cap5', label: 'Capítulo 5: Módulo Marketing & Las 5 Tribus' },
                  { id: 'cap6', label: 'Capítulo 6: Ofertas Flash FOMO vs. Promos del Día' },
                  { id: 'cap7', label: 'Capítulo 7: Estrategia de Paquetes VIP & Combos' },
                  { id: 'cap8', label: 'Capítulo 8: Calendario Anual de Picos de Demanda' },
                  { id: 'cap9', label: 'Capítulo 9: Automatización Total & Cero No-Shows' },
                  { id: 'cap10', label: 'Capítulo 10: De Empleada de tu Salón a CEO' },
                  { id: 'cierre', label: 'Cierre: Tu Plan de Acción & Manifiesto' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => scrollToSection(c.id)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all ${
                      activeChapter === c.id
                        ? 'bg-rose-500 text-white shadow-md'
                        : isDark ? 'hover:bg-neutral-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONTENIDO PRINCIPAL DEL EBOOK ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-16">

        {/* ════════════════════════════════════════════════════════════
            PORTADA HERO DEL LIBRO
        ════════════════════════════════════════════════════════════ */}
        <section className="text-center space-y-5 pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider">
            <Sparkles size={12} /> EDICIÓN EXCLUSIVA 2026 · POR MARTÍN PESTANA
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            EL MÉTODO NILAH
          </h1>
          <p className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400">
            La Biblia Definitiva del Marketing, WhatsApp y Conversión Visual para Salones de Belleza
          </p>

          <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Cómo llenar tu agenda con clientas recurrentes de alto valor sin depender de bailar en redes sociales ni regalar tus servicios con descuentos destructivos.
          </p>

          {/* Tarjeta de autor */}
          <div className={`p-4 rounded-3xl border inline-flex items-center gap-3 text-left max-w-md mx-auto ${
            isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200/90 shadow-sm'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
              MP
            </div>
            <div>
              <p className="text-xs font-black">Martín Pestana</p>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Creador de Nilah & Ex-Administrador de Salón Boutique (Perú)
              </p>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            INTRODUCCIÓN
        ════════════════════════════════════════════════════════════ */}
        <section id="intro" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Prólogo</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Introducción: La Gran Mentira del Marketing de Belleza
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              Si alguna vez has terminado un día de trabajo con la espalda destrozada, los ojos ardiendo tras 8 horas de aplicación milimétrica de pestañas o esculpido de uñas, y aún así has sentido esa punzada de angustia al ver la agenda de la próxima semana con huecos vacíos... déjame decirte algo que ningún "gurú" de marketing tradicional se atreve a decirte:
            </p>

            <blockquote className="p-4 rounded-2xl border-l-4 border-rose-500 bg-rose-500/5 dark:bg-rose-950/20 italic font-semibold text-rose-900 dark:text-rose-200">
              "El problema de tu salón no es que no seas talentosa. El problema es que te han hecho creer que para vender belleza tienes que convertirte en payasa de TikTok."
            </blockquote>

            <p>
              Durante 3 años administré en carne propia un salón de belleza boutique. Viví las mañanas de lunes silenciosas, los cuadernos de caja que no cuadraban, los mensajes de WhatsApp que morían con un frío *"precio"* y el doloroso hábito de bajar precios para intentar que la gente entrara por la puerta.
            </p>
            <p>
              Fue ahí donde descubrí la gran verdad que dio origen a <strong>Nilah</strong>: una mujer no escoge dónde ponerse pestañas, dónde hacerse las uñas o a quién entregarle su cabello viendo quién baila mejor en un reel de 15 segundos. <strong>La decisión de compra en estética es 100% emocional, visual y se basa en la CERTEZA</strong>. Y la certeza no se transmite en un reel; se transmite en el punto de contacto final: <strong>tu WhatsApp y tu Carta Digital Interactiva</strong>.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 1: EL COLAPSO DEL MARKETING TRADICIONAL
        ════════════════════════════════════════════════════════════ */}
        <section id="cap1" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Capítulo 1</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              El Colapso del Marketing Tradicional & La Tesis Nilah
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              Hablemos con sinceridad matemática. El modelo que te enseñaron en cursos genéricos de marketing digital dice:
              <em> "Crea 3 videos al día en TikTok, baila con los audios en tendencia, haz historias cada 2 horas y la gente llegará sola".</em>
            </p>
            <p>
              ¿Qué pasa en la vida real? Que eres manicurista, lashista, colorista o dueña. Tu tiempo operativo vale dinero. Si pasas 2 horas editando un video con subtítulos, transiciones y efectos para conseguir 1,200 vistas de personas de otros países o adolescentes que nunca van a pagar tus tarifas, <strong>acabas de perder 2 horas de facturación real</strong>.
            </p>

            {/* DIAGRAMA INTERACTIVO: EMBUDO TRADICIONAL VS MÉTODO NILAH */}
            <div className={`p-5 rounded-3xl border my-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="text-indigo-500" size={18} />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Comparativa de Modelos de Adquisición
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
                  <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase">
                    ❌ El Camino del Agotamiento (Tradicional)
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Redes Sociales ➔ Vistas Vacías ➔ Chat informal de WhatsApp ➔ "Dejado en Visto"
                  </p>
                  <p className="text-[11px] text-slate-500">
                    95% de energía invertida en crear contenido para audiencias frías que solo preguntan precio y se van con la competencia más barata.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    ✅ La Tesis Nilah (Conversión Visual)
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Tráfico Local Focalizado ➔ Carta Digital Interactiva ➔ Carrito Pre-armado ➔ WhatsApp Cerrador
                  </p>
                  <p className="text-[11px] text-slate-500">
                    La clienta ve fotos reales, juega con el Antes/Después, calcula su tiempo y llega a tu WhatsApp lista para pagar sin regatear.
                  </p>
                </div>
              </div>
            </div>

            <p>
              <strong>La Tesis Nilah se resume en una frase:</strong> <em>Las redes sociales son solo la vitrina de descubrimiento; WhatsApp es la caja registradora.</em> Quien domina la experiencia dentro de WhatsApp y su carta interactiva, domina el mercado local de su ciudad.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 2: PSICOLOGÍA DE LA CLIENTA & LOS 3 FRENOS
        ════════════════════════════════════════════════════════════ */}
        <section id="cap2" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Capítulo 2</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              Psicología Profunda de la Clienta de Estética & Los 3 Frenos Mentales
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              Comprender el negocio de la belleza exige entender algo vital: <strong>ninguna mujer te entrega su rostro, sus ojos o su cabello a la ligera</strong>. Cuando una mujer visita un restaurante nuevo, lo peor que puede pasar es que la comida esté desabrida; se levanta y se va. Pero si una clienta entra a un salón equivocado, el riesgo es catastrófico:
            </p>

            {/* CAJA DE LOS 3 MIEDOS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <span className="text-base">😱</span>
                <h4 className="text-xs font-black text-amber-700 dark:text-amber-400">1. Miedo a la Decepción Estética</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Que le quemen el pelo con decoloración barata, le corten la cutícula al punto de sangrar o le dejen pestañas postizas tiesas y artificiales.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                <span className="text-base">💸</span>
                <h4 className="text-xs font-black text-rose-700 dark:text-rose-400">2. Miedo a la Trampa del Precio</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Preguntar por un servicio de S/. 50 y que en el lavacabezas le agreguen ampollas, masajes y extras sin avisar, saliendo con una cuenta de S/. 200.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5">
                <span className="text-base">⏳</span>
                <h4 className="text-xs font-black text-purple-700 dark:text-purple-400">3. Miedo a la Pérdida de Tiempo</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Agendar a las 4:00 PM y que la sienten en la silla a las 4:50 PM porque el salón está desorganizado y atrasado.
                </p>
              </div>
            </div>

            <p>
              Cuando una clienta te escribe por WhatsApp preguntando <em>"¿Precio?"</em>, no está buscando el número más bajo; está midiendo tu nivel de profesionalismo. Si le respondes con un texto seco y sin fotos, confirmas su miedo. Si le envías una <strong>Carta Digital Interactiva</strong> con fotos en alta definición, duraciones exactas de cada servicio y un comparador transparente de <strong>Antes y Después</strong>, eliminas sus tres miedos de un solo golpe.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 3: LA CARTA DIGITAL INTERACTIVA COMO MOTOR SILENCIOSO
        ════════════════════════════════════════════════════════════ */}
        <section id="cap3" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Capítulo 3</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              La Carta Digital Interactiva como Motor de Conversión Silenciosa
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              ¿Por qué los salones tradicionales siguen enviando PDFs pesados o fotos borrosas de una lista de precios impresa en Canva? Porque nadie les explicó la psicología del <strong>micro-compromiso digital</strong>.
            </p>
            <p>
              Un PDF es frío, aburrido y pasivo. En cambio, cuando tu clienta abre tu Carta Digital de Nilah en su smartphone, experimenta algo completamente diferente:
            </p>

            {/* SIMULADOR INTERACTIVO DEL COMPONENTE ANTES Y DESPUÉS DENTRO DEL EBOOK */}
            <div className={`p-5 rounded-3xl border my-6 space-y-3 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-500 flex items-center gap-1.5 uppercase">
                  <Sliders size={14} /> Demostración Interactiva: Slider Antes / Después
                </span>
                <span className="text-[10px] font-bold text-slate-400">Arrastra para probar</span>
              </div>

              <div className="relative w-full h-56 rounded-2xl overflow-hidden select-none bg-neutral-100">
                {/* Imagen Después */}
                <img
                  src="https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=80"
                  alt="Después"
                  className="w-full h-full object-cover pointer-events-none"
                />
                <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                  DESPUÉS ✨
                </span>

                {/* Imagen Antes */}
                <div 
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80"
                    alt="Antes"
                    className="absolute inset-0 w-full h-full object-cover max-w-none"
                    style={{ width: '100%' }}
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                    ANTES
                  </span>
                </div>

                {/* Divisor */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-md text-slate-800 flex items-center justify-center -translate-x-1/2 translate-y-24 text-[10px] font-black">
                    ↔
                  </div>
                </div>

                <input 
                  type="range" min="0" max="100" value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic text-center">
                Al ver el resultado real con sus propios dedos, la objeción de precio desaparece. Ya no compra un servicio; compra una transformación visible.
              </p>
            </div>

            <p>
              Además, el <strong>Carrito de Preselección</strong> genera un efecto psicológico probado en e-commerce: al tocar <em>"Agregar"</em> en Lifting de Pestañas y luego en Manicura Rusa, la clienta ya se imaginó viviendo la experiencia completa. Cuando pulsa <em>"Reservar por WhatsApp"</em>, el mensaje llega con el cálculo exacto de tiempo y monto, ahorrándole 15 minutos de preguntas y respuestas a tu recepcionista.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 4: EL ARTE DEL CIERRE POR WHATSAPP
        ════════════════════════════════════════════════════════════ */}
        <section id="cap4" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Capítulo 4</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              El Arte del Cierre por WhatsApp (WhatsApp Commerce para Salones)
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              El 90% del dinero que pierden los salones de belleza ocurre en los primeros 10 minutos de conversación por WhatsApp. Veamos el error típico:
            </p>

            {/* COMPARATIVA DE CHAT: MAL VS BIEN */}
            <div className="space-y-3 my-4">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                <span className="text-[10px] font-black text-rose-600 uppercase">❌ Conversación Típica que Mata la Venta:</span>
                <div className="space-y-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                  <p><strong>Clienta:</strong> "Hola, cuánto cuesta el balayage?"</p>
                  <p><strong>Salón:</strong> "Hola linda, desde S/ 180 a S/ 300 dependiendo del largo."</p>
                  <p className="text-slate-400 italic">➔ [Clienta deja en Visto y jamás vuelve a responder]</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-600 uppercase">✅ El Protocolo Nilah en 3 Pasos:</span>
                  <button
                    onClick={() => handleCopy(
                      `¡Hola hermosa! ✨ Qué gusto saludarte. Para darte el presupuesto exacto y recomendarte la técnica ideal (Balayage Sunkissed o Morena Iluminada sin maltratar tu cabello):\n\n1️⃣ ¿Tienes tinte negro/rojo previo o es tu cabello natural?\n2️⃣ Te comparto aquí nuestra Carta Digital para que veas los tonos reales de nuestras transformaciones con fotos de Antes y Después:\n👉 [LINK_DE_TU_CARTA]\n\nCuéntame y te separo un diagnóstico personalizado sin costo 🌸`,
                      'script-balayage'
                    )}
                    className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs hover:bg-emerald-700"
                  >
                    {copiedId === 'script-balayage' ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar Guion</>}
                  </button>
                </div>
                <div className="space-y-1 font-mono text-xs text-slate-700 dark:text-slate-300">
                  <p><strong>Paso 1: Validación & Empatía</strong> (Nunca responder el precio seco).</p>
                  <p><strong>Paso 2: Diagnóstico Profesional</strong> (Hacer una pregunta técnica para demostrar autoridad).</p>
                  <p><strong>Paso 3: Envío de la Carta Interactiva</strong> (Para que explore el menú mientras tú le respondes).</p>
                </div>
              </div>
            </div>

            <p>
              Cuando invitas a la clienta a explorar la carta, deja de comparar números fríos y empieza a enamorarse del acabado visual. <strong>La conversión pasa del 12% habitual a más del 40% de cierre de citas.</strong>
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 5: EL MÓDULO MARKETING & LAS 5 TRIBUS
        ════════════════════════════════════════════════════════════ */}
        <section id="cap5" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Capítulo 5</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              El Módulo de Marketing y la Ciencia de la Segmentación (Las 5 Tribus)
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              El error más destructivo en WhatsApp es comprar una herramienta de envíos masivos y mandar el mismo mensaje a tus 800 contactos. ¿El resultado? Bloqueos de cuenta, quejas y clientas que te silencian para siempre.
            </p>
            <p>
              En Nilah desarrollamos el concepto de <strong>Las 5 Tribus</strong>. Cada clienta está en un momento de vida diferente con tu negocio y necesita un mensaje hecho a su medida:
            </p>

            {/* TABLA DE LAS 5 TRIBUS */}
            <div className="space-y-3 my-4">
              {[
                {
                  tribu: '1. Monotemáticas de Uñas',
                  emoji: '💅',
                  quienes: 'Clientas que se hacen Soft Gel o Manicura Rusa cada 15 días, pero jamás han probado pestañas ni tratamientos faciales.',
                  estrategia: 'Cross-selling con regalo: "En tu cita de uñas este jueves, te regalamos un diseño y visagismo de cejas para que pruebes el servicio".'
                },
                {
                  tribu: '2. Mirada Fiel (Lash & Brow)',
                  emoji: '👁️',
                  quienes: 'Clientas sagradas de extensiones o lifting que necesitan retoque entre el día 18 y el día 24.',
                  estrategia: 'Disparador de retoque preventivo antes de que se caiga el set completo. "Separa tu cupo de mantenimiento esta semana y asegura tu horario preferido".'
                },
                {
                  tribu: '3. Ballenas VIP',
                  emoji: '👑',
                  quienes: 'El 20% de tus clientas que consumen uñas, cabello y pestañas. Dejan el 80% de tus ganancias.',
                  estrategia: 'Trato preferencial exclusivo. Acceso prioritario a turnos de fin de semana y degustación de nuevos servicios antes del lanzamiento oficial.'
                },
                {
                  tribu: '4. Clientas de 1era Vez',
                  emoji: '✨',
                  quienes: 'Vinieron solo 1 vez en los últimos 30 días. Aún no son leales; están evaluando si quedarse contigo o volver a su salón anterior.',
                  estrategia: 'Mensaje de agradecimiento post-cita a las 48 horas con encuesta de satisfacción y un bono de S/. 20 aplicable en su segunda visita.'
                },
                {
                  tribu: '5. Inactivas / Durmientes (+60 días)',
                  emoji: '⏳',
                  quienes: 'Clientas que dejaron de venir por olvido, falta de tiempo o cambio de rutina (no necesariamente por una mala experiencia).',
                  estrategia: 'Mensaje de nostalgia cálido: "Te extrañamos en el salón. Diseñamos un tratamiento especial de hidratación para tu regreso".'
                }
              ].map((t, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-2xs'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{t.emoji}</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{t.tribu}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{t.quienes}</p>
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 text-[11px] text-purple-900 dark:text-purple-300 font-medium">
                    🎯 <strong>Mensaje Clave:</strong> {t.estrategia}
                  </div>
                </div>
              ))}
            </div>

            <p>
              Al utilizar el <strong>Módulo de Marketing de Nilah</strong>, puedes filtrar tu base de datos por estas categorías y enviar mensajes hiper-personalizados. La tasa de respuesta pasa de un mísero 3% en envíos masivos a más de un <strong>35% de agendamiento real</strong>.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 6: OFERTAS FLASH FOMO VS. PROMOS DEL DÍA
        ════════════════════════════════════════════════════════════ */}
        <section id="cap6" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Capítulo 6</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              La Alquimia de las Ofertas Flash: Cuándo Encender la Cuenta Regresiva vs. Promociones del Día
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              Uno de los dolores de cabeza más comunes de toda dueña de salón es: <em>"¿Con qué frecuencia debo poner descuentos sin acostumbrar a mis clientas a pagar barato y sin destruir mi margen?"</em>.
            </p>
            <p>
              La respuesta radica en comprender que <strong>no todas las promociones tienen el mismo objetivo psicológico ni se activan en los mismos momentos de la semana</strong>. En Nilah categorizamos las ofertas de tu Carta Digital en dos tipos de motores de conversión:
            </p>

            {/* TABLA COMPARATIVA: FLASH FOMO VS PROMO HOY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-amber-500 animate-bounce" />
                  <h3 className="font-black text-sm">Ofertas Flash (Con Cuenta Regresiva)</h3>
                </div>
                <ul className="text-xs space-y-2">
                  <li><strong>Objetivo:</strong> Rescate relámpago de sillas vacías e hiper-urgencia psicológica.</li>
                  <li><strong>Cuándo encender:</strong> Días lentos (Lunes y Martes) o franjas muertas (11:00 AM a 3:00 PM).</li>
                  <li><strong>Duración ideal:</strong> Solo 4 a 6 horas máximo, con reloj regresivo activo.</li>
                  <li><strong>Límite:</strong> Máximo 3 a 5 cupos por día para activar el principio de escasez real.</li>
                </ul>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-950'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-black text-sm">Promociones del Día (Pilar Semanal)</h3>
                </div>
                <ul className="text-xs space-y-2">
                  <li><strong>Objetivo:</strong> Hábito recurrente y previsibilidad de caja.</li>
                  <li><strong>Cuándo encender:</strong> De Miércoles a Jueves (preparación para el fin de semana).</li>
                  <li><strong>Duración ideal:</strong> Todo el día comercial hasta las 8:00 PM.</li>
                  <li><strong>Estructura:</strong> No rebajes el precio, añade valor (Ej: "Acrílicas Esculpidas + Esmaltado Semipermanente en Pies de Regalo").</li>
                </ul>
              </div>
            </div>

            <p>
              <strong>Regla de Oro de Nilah:</strong> <em>Nunca dejes una Oferta Flash encendida los Viernes por la tarde o los Sábados</em>. Esos son días de demanda orgánica natural donde tus clientas pagan tarifa completa. Encender una oferta con descuento un sábado solo te hace perder dinero en turnos que ya se llenarían solos.
            </p>

            {/* MINI SIMULADOR INTERACTIVO DE MODAL FLASH */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase text-rose-500 flex items-center gap-1.5">
                  <Flame size={14} /> Vista Previa: Modal de Oferta Flash en Carta Digital
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold">
                  Cuenta Regresiva: 02h : 14m : 09s
                </span>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider bg-white/20 px-2 py-0.5 rounded">
                    SÓLO 3 CUPOS HOY
                  </span>
                  <h4 className="text-base font-black mt-1">Soft Gel Glam + Hidratación de Cutículas</h4>
                  <p className="text-xs text-rose-100">Válido exclusivamente hoy de 2:00 PM a 5:00 PM.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs line-through text-rose-200">S/. 120</span>
                    <p className="text-xl font-black">S/. 79</p>
                  </div>
                  <button
                    onClick={() => handleCopy('Hola chicas de Brilla Studio! Vi su oferta flash de Soft Gel Glam a S/. 79 en la carta interactiva y quiero agendar mi cupo para hoy antes de que venza.', 'flash-script')}
                    className="px-3.5 py-2 rounded-xl bg-white text-rose-600 font-black text-xs hover:bg-rose-50 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                  >
                    {copiedId === 'flash-script' ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === 'flash-script' ? 'Copiado' : 'Copiar Mensaje'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 7: ESTRATEGIA DE PAQUETES VIP & COMBOS
        ════════════════════════════════════════════════════════════ */}
        <section id="cap7" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Capítulo 7</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              La Psicología del Peeking Effect: Cómo Diseñar Paquetes VIP y Subir tu Ticket Promedio un 45%
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              ¿Por qué las clientas piden sólo un corte de puntas o una manicura básica y se niegan a servicios adicionales cuando la manicurista se los ofrece en persona? Porque en frío, <em>se siente como una venta forzada</em>.
            </p>
            <p>
              Sin embargo, en el diseño de interfaces móviles existe un patrón visual fascinante conocido como el <strong>"Peeking Carousel" (Efecto Asomo)</strong>. Cuando una clienta desliza la pantalla en su teléfono y nota que una tarjeta está parcialmente visible en el margen derecho, su curiosidad visual activa un impulso biológico inconsciente: deslizar el dedo para descubrir qué hay allí.
            </p>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className="text-xs font-black uppercase text-indigo-600 mb-2">
                Fórmula de los 3 Niveles de Paquete Nilah:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-slate-200'}`}>
                  <p className="font-bold text-slate-500 text-[10px] uppercase">Nivel 1: El Gancho (Básico)</p>
                  <p className="font-black text-slate-900 dark:text-white mt-1">Manicura Rusa Express</p>
                  <p className="text-xs text-emerald-600 font-bold mt-1">S/. 45</p>
                  <p className="text-[11px] text-slate-500 mt-2">Sirve solo para romper el hielo y traer a la clienta a la puerta.</p>
                </div>
                <div className={`p-3 rounded-xl border-2 border-rose-500 ${isDark ? 'bg-neutral-950' : 'bg-white shadow-md'}`}>
                  <p className="font-bold text-rose-500 text-[10px] uppercase">Nivel 2: El Ancla (Más Vendido)</p>
                  <p className="font-black text-slate-900 dark:text-white mt-1">Full Glam: Soft Gel + Pedicura Spa</p>
                  <p className="text-xs text-rose-600 font-bold mt-1">S/. 129</p>
                  <p className="text-[11px] text-slate-500 mt-2">El 60% de tus clientas elegirán esta opción por la relación valor/precio.</p>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-white border-slate-200'}`}>
                  <p className="font-bold text-purple-500 text-[10px] uppercase">Nivel 3: Experiencia VIP</p>
                  <p className="font-black text-slate-900 dark:text-white mt-1">Día de Reina Total Nilah</p>
                  <p className="text-xs text-purple-600 font-bold mt-1">S/. 260</p>
                  <p className="text-[11px] text-slate-500 mt-2">Incluye uñas, pestañas volumen ruso, cejas y copa de mimosa.</p>
                </div>
              </div>
            </div>

            <p>
              Al colocar la <strong>Experiencia VIP</strong> visible con efecto asomo, haces que el paquete de S/. 129 se sienta extremadamente accesible y razonable, elevando tu ticket promedio de S/. 45 a S/. 129 de manera completamente automatizada.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 8: CALENDARIO ANUAL DE PICOS DE DEMANDA
        ════════════════════════════════════════════════════════════ */}
        <section id="cap8" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Capítulo 8</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              El Calendario Maestro de 12 Meses: Estrategias Estacionales de Enero a Diciembre
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              Uno de los mayores errores financieros de las dueñas de salón es festejar en Diciembre por tener el salón lleno hasta la madrugada y luego entrar en pánico en Febrero cuando la caja cae a mínimos históricos.
            </p>
            <p>
              Los salones de belleza operan bajo <strong>ondas estacionales predecibles</strong>. Con el Método Nilah aprendes a anticiparte a cada pico y valle con semanas de margen:
            </p>

            <div className="space-y-3 my-3">
              {[
                {
                  mes: 'Enero & Febrero: La Temporada de Rescate Post-Fiestas',
                  icono: '🏖️',
                  tactica: 'Campaña "Detox Capilar y Retiro de Set". La gente gastó todo en Navidad y vacaciones. Lanza paquetes económicos de recuperación y mantenimiento preventivo.'
                },
                {
                  mes: 'Mayo: El Mes de las Madres (El Mayor Pico del Primer Semestre)',
                  icono: '💐',
                  tactica: 'Preventa de Gift Cards Digitales y Paquetes Dúo "Mamá e Hija". Activa el módulo marketing desde el 20 de Abril; no esperes al día antes del Día de la Madre.'
                },
                {
                  mes: 'Julio: Fiestas Patrias & Gratificaciones',
                  icono: '🇵🇪',
                  tactica: 'El momento perfecto para vender tratamientos de alto ticket (Balayage, Keratinas Alisadoras, Sets Rusos). Las clientas disponen de liquidez extra.'
                },
                {
                  mes: 'Septiembre & Octubre: Primavera & Halloween Glam',
                  icono: '🎃',
                  tactica: 'Lanzamiento de nuevas cartas con nail art temático y lifting de pestañas. Campaña de preparación para eventos sociales y bodas de fin de año.'
                },
                {
                  mes: 'Noviembre: El Black Week de Citas Anticipadas',
                  icono: '🖤',
                  tactica: 'Nunca rebajes tus turnos de Diciembre. En el Black Week de Noviembre, vende pases VIP con reserva asegurada para las últimas dos semanas del año a precio regular con un obsequio premium.'
                },
                {
                  mes: 'Diciembre: Cosecha Máxima & Turnos Blindados con Seña',
                  icono: '🎄',
                  tactica: 'Regla inquebrantable de Nilah: Cita de Diciembre que no tenga seña del 50% NO existe en tu calendario. Blindaje absoluto contra inasistencias.'
                }
              ].map((item, idx) => (
                <div key={idx} className={`p-3.5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{item.icono}</span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.mes}</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">{item.tactica}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 9: AUTOMATIZACIÓN TOTAL & CERO NO-SHOWS
        ════════════════════════════════════════════════════════════ */}
        <section id="cap9" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Capítulo 9</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              El Fin de los No-Shows: Recordatorios Automatizados a 24h y 3h que Salvan tu Caja
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              Tener un turno reservado a las 4:00 PM y que la clienta no llegue, ni conteste el WhatsApp, ni avise, es la pérdida más dolorosa en nuestro rubro: pierdes el pago de la clienta, tienes a la especialista parada perdiendo comisiones y dejaste fuera a otra clienta que sí deseaba atenderse.
            </p>
            <p>
              Los salones promedio intentan resolver esto con la recepcionista mandando mensajes manuales a las 11:00 de la noche o olvidándose por completo. El <strong>Protocolo Anti No-Show de Nilah</strong> opera mediante un sistema de dos disparos con botones de confirmación:
            </p>

            {/* PROTOCOLO DE 2 DISPAROS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-purple-600 uppercase bg-purple-500/10 px-2 py-0.5 rounded">
                    Disparo 1: 24 Horas Antes
                  </span>
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-neutral-950 p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800">
                  "¡Hola [Nombre]! ✨ Te recordamos con mucha ilusión tu cita mañana a las [Hora] en Brilla Studio para [Servicio]. Por favor pulsa para confirmar tu asistencia o avísanos si necesitas reprogramar con tiempo."
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-500/10 px-2 py-0.5 rounded">
                    Disparo 2: 3 Horas Antes
                  </span>
                  <Zap className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-neutral-950 p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800">
                  "¡Ya casi es tu momento de brillar! 💅 Tu especialista [Especialista] ya tiene tu mesa preparada. Te esperamos a las [Hora]. Aquí tienes la ubicación exacta en Google Maps: [Link]."
                </p>
              </div>
            </div>

            <p>
              Este sistema reduce la tasa de inasistencias en salones de belleza de un <strong>24% promedio a menos del 2.8%</strong>.
            </p>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CAPÍTULO 10: DE EMPLEADA DE TU SALÓN A CEO
        ════════════════════════════════════════════════════════════ */}
        <section id="cap10" className="space-y-6">
          <div className="border-b pb-3 border-gray-200 dark:border-neutral-800">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Capítulo 10</span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
              De Autoempleada a CEO: La Transformación de tu Salón en un Activo Independiente
            </h2>
          </div>

          <div className={`space-y-4 text-xs sm:text-sm leading-relaxed text-justify ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <p>
              Si tienes que estar sentada en la mesa limando uñas 12 horas al día, respondiendo los mensajes de WhatsApp en tus descansos para almorzar y contando el dinero de la caja a las 10:00 PM con dolor de espalda, <strong>no eres dueña de un salón de belleza; compraste un empleo muy demandante</strong>.
            </p>
            <p>
              El verdadero propósito del Método Nilah no es simplemente vender más citas de uñas o pestañas. Es construir un <strong>sistema operativo predecible</strong> donde el marketing, la carta digital, la atención por WhatsApp y los recordatorios funcionen con precisión suiza aunque tú estés de viaje, descansando o enfocada en abrir tu segunda sucursal.
            </p>

            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-neutral-900 to-purple-950/40 border-purple-800/40' : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'}`}>
              <h4 className="text-sm font-black text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" /> Los 4 Pilares del Salón Escalable:
              </h4>
              <ol className="text-xs space-y-2 text-slate-700 dark:text-slate-300 list-decimal pl-4">
                <li><strong>Carta Digital Autónoma:</strong> Tu carta vende las 24 horas del día sin que una persona tenga que mandar fotos por chat.</li>
                <li><strong>Protocolo Estandarizado de WhatsApp:</strong> Respuestas con guiones científicos que cualquier recepcionista puede ejecutar a la perfección.</li>
                <li><strong>Módulo Marketing de Retoque Activo:</strong> El software avisa a las clientas cuando les toca volver, garantizando ingresos predecibles mes a mes.</li>
                <li><strong>Auditoría & Datos en Tiempo Real:</strong> Conocer tu ARPU, tu porcentaje de no-shows y el rendimiento de cada una de tus colaboradoras.</li>
              </ol>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════
            CIERRE Y MANIFIESTO FINAL
        ════════════════════════════════════════════════════════════ */}
        <section id="cierre" className={`p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-2xl ${
          isDark ? 'bg-gradient-to-br from-neutral-900 via-purple-950 to-neutral-900 border border-purple-500/30' : 'bg-gradient-to-br from-indigo-950 via-purple-900 to-rose-900'
        }`}>
          <div className="relative z-10 space-y-4 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-3 py-1 rounded-full shadow-sm">
              BIBLIA COMPLETA DE 10 CAPÍTULOS
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight">
              ¡Tienes en tus manos el sistema más poderoso para salones de belleza!
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl mx-auto leading-relaxed">
              Ahora tu misión es implementarlo: abre tu carta interactiva, configura tus ofertas flash, segmenta a tus clientas en el Módulo Marketing y muestra al mundo el valor inigualable de tu negocio.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/soluciones"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-indigo-950 font-black text-xs shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Volver al Directorio de Soluciones
              </Link>
              <button
                onClick={() => handleCopy(window.location.href, 'share-book')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-xs hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                {copiedId === 'share-book' ? <Check size={14} /> : <Share2 size={14} />}
                {copiedId === 'share-book' ? 'Enlace Copiado' : 'Compartir Biblia con tu Equipo'}
              </button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default MetodoNilahEbook;
