import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Check, Copy, Moon, Sun, Loader2, Sparkles, 
  BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText, 
  ChevronRight, Share2, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Users, Smartphone, Zap, Sparkle, Lightbulb, DollarSign,
  List, X, Compass, CheckSquare, HelpCircle, Flame, ShieldAlert, Award
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const EbookCuandoDarElSalto: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>('intro');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<boolean>(false);
  const [readProgress, setReadProgress] = useState<number>(0);
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = '¿Ya es tu momento? | La guía honesta para independizarte — Martín Pestana';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setReadProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }

      const chapters = [
        'intro', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7', 'cierre'
      ];
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

  const handleDownloadWord = () => {
    setIsGeneratingDocx(true);
    try {
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>¿Ya es tu momento? - Martín Pestana</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
            h1 { color: #d97706; font-size: 26pt; line-height: 1.2; margin-bottom: 6px; }
            h2 { color: #b45309; font-size: 17pt; margin-top: 24pt; border-bottom: 2px solid #fde68a; padding-bottom: 4pt; page-break-before: always; }
            h3 { color: #92400e; font-size: 13pt; margin-top: 14pt; }
            p { font-size: 11pt; margin-bottom: 10pt; text-align: justify; }
            blockquote { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin: 16px 0; font-style: italic; color: #78350f; }
            .badge { background: #fef3c7; color: #b45309; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 14px 0; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="badge">GUÍA ESTRATÉGICA OFICIAL · EDICIÓN 2026</p>
            <h1>¿Ya es tu momento?</h1>
            <p style="font-size: 14pt; color: #64748b; font-weight: bold;">La guía honesta para decidir cuándo dejar de trabajar para otros y empezar a construir lo tuyo</p>
            <p style="font-size: 10.5pt; color: #475569;">Por <strong>Martín Pestana</strong> — Ex-Administrador de Salón & Creador de Nilah IA</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>

          <h2>Introducción — La pregunta que te hacen mal</h2>
          <p>Hay una pregunta que le hacen a toda lashista o manicurista con algo de experiencia, tarde o temprano, casi siempre con buena intención: "¿Y para cuándo tu propio salón?" La hacen las amigas, las clientas que ya te tienen cariño, incluso tu propia familia — como si independizarte fuera el destino obvio y natural de cualquiera que sea buena en su oficio, y quedarte trabajando para otro fuera, de alguna forma, quedarte a mitad de camino.</p>
          <p>Yo vi esa pregunta de cerca durante los 3 años que administré mi salón. La escuché dirigida a mi socia, que se estaba formando como manicurista profesional en el instituto Mía Secret mientras trabajaba con nosotros. La escuché dirigida a la lashista, que hacía exactamente lo mismo con sus propios cursos de especialización. Y las vi, más de una vez, dudar en silencio después de que alguien se las hiciera — no porque no quisieran independizarse algún día, sino porque en el fondo sabían que la pregunta tenía una trampa: asumía que la respuesta correcta era "cuanto antes, mejor".</p>
          <p>No lo es. Independizarte no es un premio que ganas por ser buena técnicamente, ni una meta que hay que cumplir antes de cierta edad para no sentir que te quedaste atrás. Es una decisión de negocio, con su propio momento correcto — que puede ser mañana, en un año, o nunca, sin que eso diga absolutamente nada sobre tu talento.</p>
          <p>Esta guía no te va a decir "sí, ya estás lista" ni "no, todavía no". Te va a dar las señales reales para que tú misma respondas esa pregunta con información, y no con la presión de lo que los demás esperan escuchar.</p>

          <h2>Capítulo 1 — Por qué la pregunta está mal planteada desde el principio</h2>
          <p>El problema de "¿para cuándo tu propio salón?" es que compara dos cosas que no son comparables directamente: ser empleada y ser independiente no son un escalón hacia arriba y otro hacia abajo en la misma escalera. Son dos negocios completamente distintos, con riesgos y recompensas distintas, y ninguno de los dos es objetivamente mejor sin conocer tu situación particular.</p>
          <div class="box">
            <p><strong>Cuando trabajas para un salón ajeno:</strong> alguien más carga con el alquiler del local, con la compra de insumos en volumen, con conseguir clientas nuevas, con pagar servicios básicos aunque el mes venga flojo. A cambio, te quedas con una comisión menor por cada servicio (30% – 35%). Es un trato: menos ganancia por servicio, a cambio de menos riesgo y menos responsabilidades fuera de la técnica.</p>
            <p><strong>Cuando te independizas:</strong> ese trato se invierte por completo. Te quedas con el 100% de lo que cobras por cada servicio — pero también con el 100% del alquiler, los insumos, la publicidad, los meses flojos, y cada decisión de negocio que antes tomaba otra persona por ti. No es "ganar más" sin más. Es asumir un negocio completo a cambio de la posibilidad de ganar más.</p>
          </div>
          <p>Ninguna de las dos opciones es la versión "adulta" o "seria" de tu carrera. La única pregunta que realmente importa es: ¿tienes hoy lo que se necesita para sostener ese negocio completo, o todavía te conviene que alguien más cargue con esa parte mientras terminas de prepararte?</p>

          <h2>Capítulo 2 — Las señales de que probablemente ya estás lista</h2>
          <p>Ninguna señal por sí sola es suficiente. Pero cuando varias de estas aparecen juntas, es una buena indicación de que el salto tiene más de decisión estratégica que de apuesta a ciegas:</p>
          <ul>
            <li><strong>Tu velocidad técnica ya es estable, no ocasional:</strong> Tu nivel de calidad y tiempo por servicio ya son predecibles, cita tras cita, incluso en un día cansado.</li>
            <li><strong>Ya sabes calcular cuánto te cuesta realmente cada servicio:</strong> Insumos, tiempo, herramientas y proporción de espacio.</li>
            <li><strong>Tienes un colchón financiero para los primeros meses flojos:</strong> Fondos para cubrir 2 a 3 meses de gastos personales mínimos.</li>
            <li><strong>Ya tienes un plan concreto para conseguir tus primeras clientas propias:</strong> Una estrategia con anuncios locales pagados, no solo la esperanza de que te sigan.</li>
            <li><strong>Sientes curiosidad por el lado de negocio, no solo tolerancia:</strong> Interés por aprender precios, atención y marketing.</li>
          </ul>

          <h2>Capítulo 3 — Las señales de que conviene seguir ganando experiencia</h2>
          <p>Ninguna de estas señales significa que no vayas a lograrlo algún día. Significan, simplemente, que ese día todavía no es hoy — y quedarte un poco más de tiempo donde estás no es fracaso, es estrategia:</p>
          <ul>
            <li>Todavía estás construyendo velocidad y consistencia técnica.</li>
            <li>No tienes ningún ahorro para sostener un mes sin ingresos estables.</li>
            <li>Nunca calculaste el costo real de tus servicios.</li>
            <li>No tienes ningún plan, ni siquiera básico, para conseguir o retener clientas propias.</li>
            <li>Sientes que quieres irte por frustración, no por preparación.</li>
          </ul>

          <h2>Capítulo 4 — El error de saltar por frustración en vez de por preparación</h2>
          <p>Hay una diferencia enorme entre querer independizarte porque ya estás lista, y querer independizarte porque estás agotada de tu situación actual. Tomar la decisión más grande de tu carrera desde el cansancio o el enojo casi nunca sale bien.</p>
          <blockquote>"La pregunta que vale la pena hacerte es esta: si mañana mismo tu situación actual mejorara — mejor comisión, mejor ambiente, mejor horario — ¿seguirías queriendo independizarte con la misma fuerza? Si la respuesta es sí, tu deseo es real. Si la respuesta es 'probablemente no', lo que necesitas resolver ahora no es un negocio propio, sino esa situación específica."</blockquote>

          <h2>Capítulo 5 — Lo que nadie te dice sobre estar del otro lado</h2>
          <ul>
            <li><strong>La soledad de las decisiones:</strong> Cada precio, horario y cliente difícil recae 100% sobre ti.</li>
            <li><strong>El horario ya no protege tu descanso automáticamente:</strong> El trabajo invisible (responder WhatsApp, compras, cuentas) se multiplica.</li>
            <li><strong>Ahora eres marketing y contabilidad:</strong> Además de la técnica manual.</li>
            <li><strong>Variabilidad de ingresos al principio:</strong> Curva de arranque mientras estabilizas clientas recurrentes.</li>
          </ul>

          <h2>Capítulo 6 — El puente: cómo prepararte mientras sigues empleada</h2>
          <ol>
            <li><strong>1. Ahorra con un objetivo específico:</strong> Cubrir 2 a 3 meses de gastos personales mínimos.</li>
            <li><strong>2. Calcula el costo real de un servicio:</strong> Aunque todavía trabajes para otro salón.</li>
            <li><strong>3. Empieza a grabar tu trabajo:</strong> Construye tu portafolio en video antes de salir.</li>
            <li><strong>4. Piensa desde ya en la fidelización:</strong> WhatsApp, recordatorios y retención desde el día 1.</li>
          </ol>

          <h2>Capítulo 7 — El día que decidas dar el salto</h2>
          <p>No des el salto el mismo día que tomas la decisión emocional. Date una semana con la cabeza fría para revisar: 1) Colchón financiero separado, 2) Plan de primeras clientas (anuncios locales de $4/día), y 3) Sistema de retención en WhatsApp.</p>

          <h2>Cierre — No hay una edad ni un tiempo correcto</h2>
          <p>Independizarte no es una carrera contra nadie más. Es una decisión que se toma bien cuando se toma con información, colchón financiero y un plan. Cuando llegue tu momento, Nilah estará listo para acompañarte gratis desde el primer día.</p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Ya_es_tu_momento_Martin_Pestana.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error al exportar Word:', e);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const capitulosIndice = [
    { id: 'intro', num: '00', title: 'Introducción: La pregunta que te hacen mal' },
    { id: 'cap1', num: '01', title: 'Por qué la pregunta está mal planteada' },
    { id: 'cap2', num: '02', title: 'Señales de que ya estás lista' },
    { id: 'cap3', num: '03', title: 'Señales de seguir ganando experiencia' },
    { id: 'cap4', num: '04', title: 'Saltar por frustración vs. preparación' },
    { id: 'cap5', num: '05', title: 'Lo que nadie te dice del otro lado' },
    { id: 'cap6', num: '06', title: 'El puente: prepararte mientras eres empleada' },
    { id: 'cap7', num: '07', title: 'El día que decidas dar el salto' },
    { id: 'cierre', num: '🚀', title: 'Cierre: No hay edad ni tiempo correcto' },
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 pb-20 ${
      isDark 
        ? 'bg-[#0e0c08] text-slate-100 selection:bg-amber-500 selection:text-white' 
        : 'bg-slate-100/90 text-slate-900 selection:bg-amber-200 selection:text-amber-900'
    } print:bg-white print:text-black print:pb-0`}>

      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500 z-50 transition-all duration-150 print:hidden"
        style={{ width: `${readProgress}%` }}
      />

      {/* ── HEADER SUPERIOR MOBILE-FIRST COMPACTO ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2.5 sm:py-3 flex items-center justify-between transition-colors print:hidden ${
        isDark ? 'bg-[#15120c]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 shadow-2xs text-slate-900'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/soluciones')}
            className={`flex items-center justify-center w-8 h-8 rounded-full border transition-all cursor-pointer shrink-0 ${
              isDark 
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="Volver a Soluciones"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="truncate">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 truncate">Guía Estratégica</p>
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">¿Ya es tu momento?</h2>
          </div>
        </div>

        {/* ACCIONES TOP */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* BOTÓN ÍNDICE MÓVIL */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 active:scale-95 transition-transform"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px]">Índice</span>
          </button>

          {/* MODO OSCURO / CLARO */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-amber-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* DESCARGAR WORD */}
          <button
            onClick={handleDownloadWord}
            disabled={isGeneratingDocx}
            title="Descargar en Word"
            className={`hidden sm:inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-700/50 text-blue-300'
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
            }`}
          >
            {isGeneratingDocx ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3 text-blue-500" />}
            <span className="text-[11px]">Word</span>
          </button>

          {/* DESCARGAR PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md shadow-amber-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
          >
            {isGeneratingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span className="text-[11px]">PDF</span>
          </button>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL MOBILE-FIRST ── */}
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ══════════════════════════════════════════
            SIDEBAR LATERAL: ÍNDICE DE CAPÍTULOS (DESKTOP)
        ══════════════════════════════════════════ */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-20 print:hidden">
          <div className={`p-5 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#18140d]/90 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-200/50'
          }`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 font-black text-xs">
                🧭
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tabla de Contenido</h4>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">7 Capítulos Estratégicos</p>
              </div>
            </div>

            <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {capitulosIndice.map((cap) => {
                const isActive = activeChapter === cap.id;
                return (
                  <button
                    key={cap.id}
                    onClick={() => scrollToSection(cap.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-600 text-white font-black shadow-xs'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cap.num}
                    </span>
                    <span className="truncate">{cap.title}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                onClick={handleDownloadWord}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText size={13} />
                <span>Word</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Download size={13} />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ══════════════════════════════════════════
            CUERPO DEL EBOOK / LECTURA COMPLETA
        ══════════════════════════════════════════ */}
        <main ref={contentRef} className="w-full lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* ── PORTADA PRINCIPAL ── */}
          <section className={`relative overflow-hidden rounded-[2rem] p-5 sm:p-10 border transition-all ${
            isDark 
              ? 'bg-gradient-to-br from-[#241c0e] via-[#171209] to-[#0d0a05] border-amber-900/40 text-white' 
              : 'bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 text-white border-amber-700 shadow-xl shadow-amber-600/15'
          } print:bg-none print:border-none print:p-0 print:text-black`}>
            
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Guía Estratégica Oficial · Edición 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
                ¿Ya es tu momento?
              </h1>

              <p className="text-xs sm:text-base text-amber-100 font-medium leading-relaxed">
                La guía honesta para decidir cuándo dejar de trabajar para otros y empezar a construir lo tuyo
              </p>

              {/* AUTOR & CONTEXTO */}
              <div className="pt-3 border-t border-white/15 flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/assets/images/martin-founder.jpeg"
                    alt="Martín Pestana"
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div>
                    <p className="text-xs font-black text-white">Por Martín Pestana</p>
                    <p className="text-[10px] sm:text-[11px] text-amber-200">Ex-Administrador de salón & Creador de Nilah</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-100 font-medium bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Clock className="w-3 h-3" />
                  <span>Lectura: ~10 min</span>
                </div>
              </div>

              {/* BOTONES FIRST-MOBILE */}
              <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 print:hidden">
                <button
                  onClick={() => scrollToSection('intro')}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-amber-50 text-amber-900 font-black text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer col-span-2 sm:col-auto"
                >
                  <span>Empezar a leer</span>
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Download size={13} />
                  <span>PDF</span>
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="py-2 px-3 rounded-xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <FileText size={13} />
                  <span>Word</span>
                </button>
              </div>

            </div>
          </section>

          {/* ══════════════════════════════════════════
              INTRODUCCIÓN
          ══════════════════════════════════════════ */}
          <article id="intro" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#141009] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>00</span>
              <span>•</span>
              <span>Introducción</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              La pregunta que te hacen mal
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hay una pregunta que le hacen a toda lashista o manicurista con algo de experiencia, tarde o temprano, casi siempre con buena intención: <em>"¿Y para cuándo tu propio salón?"</em> La hacen las amigas, las clientas que ya te tienen cariño, incluso tu propia familia — como si independizarte fuera el destino obvio y natural de cualquiera que sea buena en su oficio, y quedarte trabajando para otro fuera, de alguna forma, quedarte a mitad de camino.
              </p>

              <p>
                Yo vi esa pregunta de cerca durante los 3 años que administré mi salón. La escuché dirigida a mi socia, que se estaba formando como manicurista profesional en el instituto <strong>Mía Secret</strong> mientras trabajaba con nosotros. La escuché dirigida a la lashista, que hacía exactamente lo mismo con sus propios cursos de especialización. Y las vi, más de una vez, dudar en silencio después de que alguien se las hiciera — no porque no quisieran independizarse algún día, sino porque en el fondo sabían que la pregunta tenía una trampa: <strong>asumía que la respuesta correcta era "cuanto antes, mejor".</strong>
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 text-amber-950 dark:text-amber-200 font-medium text-xs sm:text-sm leading-relaxed">
                No lo es. Independizarte no es un premio que ganas por ser buena técnicamente, ni una meta que hay que cumplir antes de cierta edad para no sentir que te quedaste atrás. Es una decisión de negocio, con su propio momento correcto — que puede ser mañana, en un año, o nunca, sin que eso diga absolutamente nada sobre tu talento.
              </div>

              <p>
                Esta guía no te va a decir "sí, ya estás lista" ni "no, todavía no". Te va a dar las señales reales para que tú misma respondas esa pregunta con información, y no con la presión de lo que los demás esperan escuchar.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 1
          ══════════════════════════════════════════ */}
          <article id="cap1" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#141009] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 01</span>
              <span>•</span>
              <span>El Trato Real</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Por qué la pregunta está mal planteada desde el principio
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                El problema de "¿para cuándo tu propio salón?" es que compara dos cosas que no son comparables directamente: ser empleada y ser independiente no son un escalón hacia arriba y otro hacia abajo en la misma escalera. Son dos negocios completamente distintos, con riesgos y recompensas distintas, y ninguno de los dos es objetivamente mejor sin conocer tu situación particular.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🏢</span> Trabajar para un salón ajeno
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                    Alguien más carga con el alquiler del local, con la compra de insumos en volumen, con conseguir clientas nuevas y pagar servicios básicos aunque el mes venga flojo. A cambio, comisionas un 30%–35%.
                  </p>
                  <span className="inline-block p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Menos margen = Cero riesgo fuera de la técnica.
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>🚀</span> Trabajar como independiente
                  </h4>
                  <p className="text-amber-950 dark:text-amber-200 text-xs leading-relaxed">
                    Te quedas con el 100% de lo que cobras — pero también con el 100% del alquiler, insumos, publicidad, meses flojos y decisiones de administración.
                  </p>
                  <span className="inline-block p-1.5 rounded-lg bg-amber-500/20 text-[11px] font-bold text-amber-900 dark:text-amber-300">
                    100% margen = 100% responsabilidad del negocio.
                  </span>
                </div>
              </div>

              <p>
                Ninguna de las dos opciones es la versión "adulta" o "seria" de tu carrera. La única pregunta que realmente importa es: ¿tienes hoy lo que se necesita para sostener ese negocio completo, o todavía te conviene que alguien más cargue con esa parte mientras terminas de prepararte?
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 2
          ══════════════════════════════════════════ */}
          <article id="cap2" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#141009] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Capítulo 02 · Checklist Verde</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Las señales de que probablemente ya estás lista
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Ninguna señal por sí sola es suficiente. Pero cuando varias de estas aparecen juntas, es una buena indicación de que el salto tiene más de decisión estratégica que de apuesta a ciegas:
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">✅</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">1. Tu velocidad técnica ya es estable, no ocasional</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Tu nivel de calidad y tu tiempo por servicio ya son predecibles, cita tras cita, incluso en un día cansado.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">✅</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">2. Ya sabes calcular cuánto te cuesta realmente cada servicio</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Insumos, tiempo, desgaste de herramientas y una parte proporcional de alquiler de espacio.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">✅</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">3. Tienes un colchón financiero para los primeros meses flojos</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Ahorros suficientes para cubrir de 2 a 3 meses de gastos personales mínimos sin depender de ingresos de arranque.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">✅</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">4. Ya tienes un plan concreto para tus primeras clientas propias</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Una estrategia de anuncios locales pagados ($4/día), en lugar de la sola esperanza de que tus clientas actuales te sigan.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">✅</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-200">5. Sientes curiosidad por el lado de negocio, no solo tolerancia</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Disposición real para aprender de administración, precios, retención y atención al cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 3
          ══════════════════════════════════════════ */}
          <article id="cap3" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#141009] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Capítulo 03 · Estrategia de Espera</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Las señales de que conviene seguir ganando experiencia
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Ninguna de estas señales significa que no vayas a lograrlo algún día. Significan, simplemente, que ese día todavía no es hoy — y quedarte un poco más de tiempo donde estás no es fracaso, es estrategia:
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⏳</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200">Todavía estás construyendo velocidad y consistencia técnica</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Practicar con el volumen de clientas de un salón ajeno — sin la presión de que el tiempo perdido salga de tu bolsillo — es la forma más segura de perfeccionar.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⏳</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200">No tienes ningún ahorro para sostener un mes sin ingresos estables</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Independizarte sin colchón convierte cada decisión en una decisión desesperada por miedo a no llegar a fin de mes.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⏳</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200">Nunca calculaste el costo real de tus servicios</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Cobrar "lo que cobra la competencia" sin conocer tus números reales es una apuesta a ciegas, no una estrategia de negocio.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⏳</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200">No tienes ningún plan para conseguir o retener clientas propias</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Si la respuesta a "¿cómo vas a conseguir tus primeras 20 clientas?" es silencio total, ese es el punto exacto donde conviene invertir tiempo antes del salto.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⏳</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-200">Sientes que quieres irte por frustración, no por preparación</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      La trampa más común y peligrosa de todas, abordada a detalle en el siguiente capítulo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 4
          ══════════════════════════════════════════ */}
          <article id="cap4" className={`p-5 sm:p-8 rounded-[2rem] border-2 transition-all ${
            isDark 
              ? 'bg-[#1a140b] border-amber-500/50 text-slate-200' 
              : 'bg-amber-50/70 border-amber-400 text-slate-800'
          }`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Capítulo 04 · Claridad Mental</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El error de saltar por frustración en vez de por preparación
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hay una diferencia enorme, aunque a veces se sienta parecida por dentro, entre querer independizarte porque ya estás lista, y querer independizarte porque estás agotada de tu situación actual. La segunda no es mala fe ni algo de lo que avergonzarse — es completamente humano. Pero tomar la decisión más grande de tu carrera desde el cansancio o el enojo casi nunca sale bien.
              </p>

              <p>
                Vi este patrón de cerca: profesionales que, después de un mal mes, una discusión con la dueña del salón, o una comisión que sintieron injusta, decidieron de un día para otro que "ya no aguantaban más" y que era momento de independizarse ya. La emoción del momento hacía que la decisión se sintiera clara y urgente. El problema es que ninguna de esas razones desaparece automáticamente por el simple hecho de trabajar para ti misma. De hecho, muchas veces se multiplican, porque ahora nadie más comparte esa carga contigo.
              </p>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700/60 space-y-2 text-xs sm:text-sm">
                <h4 className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🧠</span> El Test del Deseo Real:
                </h4>
                <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed">
                  "Si mañana mismo tu situación actual mejorara — mejor comisión, mejor ambiente, mejor horario — ¿seguirías queriendo independizarte con la misma fuerza?"
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                  • <strong>Si la respuesta es SÍ:</strong> Tu deseo de independencia es real y va más allá de la frustración puntual.<br/>
                  • <strong>Si la respuesta es "PROBABLEMENTE NO":</strong> Lo que necesitas resolver ahora mismo no es un negocio propio — es esa situación específica donde estás.
                </p>
              </div>

              <p>
                Esto no es una excusa para posponer para siempre. Es una invitación a separar dos preguntas distintas: <em>"¿estoy lista para tener mi propio negocio?"</em> y <em>"¿estoy cansada de mi situación actual?"</em>.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 5
          ══════════════════════════════════════════ */}
          <article id="cap5" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#141009] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 05</span>
              <span>•</span>
              <span>La Realidad</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Lo que nadie te dice sobre estar del otro lado
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Cuando por fin das el salto, hay una serie de cambios que casi nadie te cuenta de antemano, porque quienes ya lo hicieron suelen mostrar solo la parte bonita en redes sociales. Lo que queda fuera de esas publicaciones es igual de real:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300">1. La soledad de las decisiones</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Cada decisión sobre precios, horarios o clientas difíciles recae enteramente sobre tus hombros.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300">2. El horario no se apaga solo</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Terminar de atender citas no es terminar de trabajar: queda responder WhatsApp, inventario y cuentas.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300">3. Eres marketing y contabilidad</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Además de tu talento técnico, asumes la captación y los números de tu negocio.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300">4. Variabilidad de ingresos inicial</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Habrá meses altos y meses bajos mientras consolidas tu propia base de clientas fieles.
                  </p>
                </div>
              </div>

              <p>
                Nada de esto significa que independizarte sea una mala idea. Significa que es un cambio de reglas completo, no solo un cambio de nombre en la puerta del local.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 6
          ══════════════════════════════════════════ */}
          <article id="cap6" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#141009] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Capítulo 06 · Plan de Acción</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El puente: cómo prepararte mientras sigues empleada
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                La buena noticia es que casi todo lo que necesitas para reducir el riesgo del salto se puede construir mientras todavía trabajas para otro salón, sin tener que elegir entre "quedarme para siempre" o "saltar sin red":
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">1</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Empieza a ahorrar con un objetivo específico</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Calcula cuánto necesitarías para cubrir 2 o 3 meses de gastos personales mínimos sin depender de ingresos del negocio nuevo.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">2</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Calcula el costo real de un servicio</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Toma uno de tus servicios más pedidos y calcula insumos, tiempos y proporción de espacio para tener precios claros sin presión.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">3</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Empieza a grabar tu trabajo desde ahora</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Construye tu catálogo en video de antes y después para ahorrarte meses cuando armes tu cuenta publicitaria.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-xs mt-0.5">4</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Piensa desde ya en cómo vas a fidelizar</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Tener un sistema simple de recordatorios por WhatsApp te ahorra meses de aprender a los golpes una vez sola.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm">
                Este puente no tiene una duración fija. Para algunas son 6 meses, para otras 2 años. Lo que importa no es la velocidad con la que lo cruzas, sino que lo estés cruzando activamente con pasos concretos.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 7
          ══════════════════════════════════════════ */}
          <article id="cap7" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#141009] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wider mb-2">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Capítulo 07 · La Transición</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El día que decidas dar el salto
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Cuando por fin sientas que las señales del Capítulo 2 pesan más que las del Capítulo 3, hay una última recomendación antes de renunciar o cerrar esa etapa: <strong>no des el salto el mismo día que tomas la decisión emocional</strong>. Date una semana, aunque sea, para revisar con la cabeza fría lo siguiente:
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <p><strong>1. Tu colchón financiero:</strong> Ya calculado y separado en tu cuenta, no solo "en teoría disponible".</p>
                <p><strong>2. Tu plan concreto para las primeras clientas:</strong> Una inversión pequeña en anuncios segmentados por zona ($4/día), en lugar de esperar a que el contenido orgánico traiga resultados.</p>
                <p><strong>3. Tu sistema de retención ya pensado:</strong> Para que esas primeras clientas no se conviertan, meses después, en otro chat silencioso de WhatsApp.</p>
              </div>

              <p>
                Ninguno de estos tres elementos tiene que estar perfecto. Pero los tres tienen que existir, aunque sea en su versión más simple, antes de que renuncies a la estabilidad que tienes hoy.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CIERRE & CTA PRINCIPAL
          ══════════════════════════════════════════ */}
          <section id="cierre" className={`p-6 sm:p-10 rounded-[2rem] text-center space-y-4 sm:space-y-5 border transition-all relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#241b0b] via-[#141007] to-[#0a0803] border-amber-800/40 text-white' 
              : 'bg-gradient-to-b from-amber-600 via-orange-600 to-rose-700 text-white border-amber-700 shadow-2xl shadow-amber-600/20'
          }`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              <span>🚀</span> Tu propio ritmo
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight max-w-lg mx-auto leading-tight">
              No hay una edad ni un tiempo correcto
            </h2>

            <p className="text-xs sm:text-sm text-amber-100 max-w-md mx-auto leading-relaxed">
              Independizarte no es una carrera contra nadie más. Es una decisión que se toma bien cuando se toma con información, con un colchón financiero y con un plan.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href="/login?tab=register"
                className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Zap size={16} className="fill-amber-950" />
                <span>Prepárate con Nilah gratis</span>
              </a>

              <Link
                to="/ebooks/el-anuncio-de-4-dolares"
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <BookOpen size={14} />
                <span>Leer: El anuncio de $4</span>
              </Link>
            </div>

            <p className="text-[10px] sm:text-[11px] text-amber-200/80 pt-1">
              Sin tarjeta de crédito · Organiza tu cartera antes de dar el salto · Hasta 100 clientas gratis
            </p>
          </section>

          {/* ── FOOTER DE ARTÍCULO ── */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Nilah IA & Martín Pestana · Todos los derechos reservados.</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-amber-600 font-bold cursor-pointer"
            >
              Volver arriba ↑
            </button>
          </footer>

        </main>
      </div>

      {/* ══════════════════════════════════════════
          BOTÓN FLOTANTE MOBILE: ÍNDICE DE CAPÍTULOS
      ══════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40 print:hidden flex items-center gap-2">
        <button
          onClick={() => setShowMobileDrawer(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-xs py-2.5 px-4 rounded-full shadow-lg shadow-amber-600/30 active:scale-95 transition-all cursor-pointer"
        >
          <List size={16} />
          <span>Capítulos</span>
          <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
            {Math.round(readProgress)}%
          </span>
        </button>
      </div>

      {/* ══════════════════════════════════════════
          BOTTOM SHEET / DRAWER MÓVIL: ÍNDICE DE CAPÍTULOS
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showMobileDrawer && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className={`w-full max-w-lg rounded-t-3xl p-5 max-h-[80vh] flex flex-col shadow-2xl border-t ${
                isDark ? 'bg-[#141009] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-xs">
                    🧭
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400">Tabla de Contenido</h3>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">¿Ya es tu momento?</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-2 overflow-y-auto space-y-1 my-1 flex-1">
                {capitulosIndice.map((cap) => {
                  const isActive = activeChapter === cap.id;
                  return (
                    <button
                      key={cap.id}
                      onClick={() => scrollToSection(cap.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-amber-600 text-white font-black shadow-xs'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cap.num}
                      </span>
                      <span className="truncate">{cap.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    handleDownloadPDF();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-200 dark:border-amber-800/60"
                >
                  <Download size={14} />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    handleDownloadWord();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/60"
                >
                  <FileText size={14} />
                  <span>Word</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default EbookCuandoDarElSalto;
