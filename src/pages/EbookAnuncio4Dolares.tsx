import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Check, Copy, Moon, Sun, Loader2, Sparkles, 
  BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText, 
  ChevronRight, Share2, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Users, Smartphone, Zap, Sparkle, Lightbulb, DollarSign,
  List, X, Video, Target, PlayCircle, Eye, Flame
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const EbookAnuncio4Dolares: React.FC = () => {
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
    document.title = 'El anuncio de $4 | Pierde el miedo, gana tus primeras clientas — Martín Pestana';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setReadProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }

      const chapters = [
        'intro', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cierre'
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
          <title>El anuncio de $4 - Martín Pestana</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
            h1 { color: #0284c7; font-size: 26pt; line-height: 1.2; margin-bottom: 6px; }
            h2 { color: #0369a1; font-size: 17pt; margin-top: 24pt; border-bottom: 2px solid #bae6fd; padding-bottom: 4pt; page-break-before: always; }
            h3 { color: #075985; font-size: 13pt; margin-top: 14pt; }
            p { font-size: 11pt; margin-bottom: 10pt; text-align: justify; }
            blockquote { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px; margin: 16px 0; font-style: italic; color: #0c4a6e; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 14px 0; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="badge">EBOOK OFICIAL · EDICIÓN 2026</p>
            <h1>El anuncio de $4</h1>
            <p style="font-size: 14pt; color: #64748b; font-weight: bold;">Pierde el miedo, gana tus primeras clientas</p>
            <p style="font-size: 10.5pt; color: #475569;">Por <strong>Martín Pestana</strong> — Creador de Nilah IA & Ex-Administrador de Salón</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>

          <h2>Introducción — El anuncio que nunca enciendes</h2>
          <p>Hay un anuncio que casi todas las lashistas y manicuristas que están empezando tienen guardado en la cabeza, pero nunca en la cuenta publicitaria. Lo piensan, lo posponen, encuentran una excusa nueva cada semana — "cuando tenga mejores fotos", "cuando aprenda bien la app", "cuando ya no dé tanta vergüenza" — y mientras tanto, la agenda sigue con los mismos 3 espacios vacíos del mes pasado.</p>
          <p>Este ebook no es sobre técnica de anuncios avanzada. Es sobre esa pausa. Sobre por qué existe, y sobre por qué encender tu primer anuncio con $4 al día (S/14 aprox.) es, casi siempre, mucho menos riesgoso de lo que tu cabeza te está diciendo ahora mismo.</p>
          <p>Si ya leíste mi ebook sobre el método completo, esto es el zoom total al Paso 1: cómo pasar de cero clientas a tus primeras 20 o 30, sin depender de que un video se haga viral por casualidad.</p>

          <h2>Capítulo 1 — Por qué el miedo es normal (y por qué no debería decidir por ti)</h2>
          <p>El miedo a mostrar tu trabajo en redes, o a "gastar" plata en un anuncio, casi nunca es miedo a la tecnología. Es miedo a la exposición. A que alguien conocido vea el video y opine. A invertir esos $4 y que "no pase nada". A sentir que estás vendiendo, cuando toda tu formación fue sobre la técnica, no sobre venderte a ti misma.</p>
          <p>Ese miedo es completamente normal y lo vi de cerca, muchas veces, en profesionales con manos brillantes que se congelaban frente a la cámara del celular. Pero fíjate en algo: ese miedo no aparece por practicar demasiado la técnica, aparece por practicar cero veces lo otro — mostrarte, cobrar por tu talento en voz alta, pedir que alguien confíe en ti sin haberte visto trabajar antes.</p>
          <p>Como cualquier técnica de tu oficio, mostrar tu trabajo y correr un anuncio también se practica. Nadie hizo el primer volumen ruso perfecto, y nadie graba su primer video sin sentir un poco de vergüenza. La diferencia entre la que ya tiene clientas nuevas llegando y la que sigue esperando el momento perfecto casi nunca es el talento — es que una encendió el anuncio con vergüenza y todo, y la otra sigue esperando sentirse lista.</p>
          <blockquote>"Antes de seguir: pregúntate con honestidad — ¿qué es lo peor que puede pasar si subes ese video y corres el anuncio hoy? Casi siempre, la respuesta real es 'que nadie escriba'. No es 'que pierda todo mi dinero' ni 'que arruine mi reputación'. Es, en el peor de los casos, gastar $4 en un día sin resultado. Eso es todo. Vale la pena releer esa frase."</blockquote>

          <h2>Capítulo 2 — Orgánico vs. pagado: la diferencia que nadie te explica bien</h2>
          <p>Todo el mundo te va a decir "sube contenido, sé constante, el algoritmo te va a premiar". Y es cierto, a largo plazo. El problema es el "a largo plazo" cuando lo que necesitas son clientas este mes, no en seis.</p>
          <div class="box">
            <p><strong>Contenido orgánico (TikTok, Instagram sin pago):</strong></p>
            <ul>
              <li>Depende de un algoritmo que no controlas y que cambia sin avisarte.</li>
              <li>Necesita constancia diaria, difícil de sostener si ya trabajas 8 horas paradas en la silla.</li>
              <li>El resultado tarda semanas o meses en llegar, si llega.</li>
              <li>Construye marca personal a largo plazo — esto sí es insustituible con el tiempo.</li>
            </ul>
          </div>
          <div class="box">
            <p><strong>Anuncios pagados (Meta Ads: Facebook e Instagram):</strong></p>
            <ul>
              <li>Tú decides exactamente a quién le aparece: por zona, por radio de kilómetros, por intereses.</li>
              <li>El resultado empieza a verse en días, no en meses.</li>
              <li>Controlas el presupuesto exacto: puedes empezar con $4 al día y parar cuando quieras.</li>
              <li>No construye "marca" a largo plazo por sí solo — para eso sigue sirviendo el contenido orgánico, después.</li>
            </ul>
          </div>
          <p>Ninguna de las dos es "mejor" en abstracto. Pero si estás empezando de cero y necesitas ingresos ahora, apostarlo todo al contenido orgánico es como sembrar una semilla y esperar la cosecha sin tener nada para comer mientras tanto. El anuncio pagado es el ingreso de corto plazo que te da el tiempo y la calma para, después, construir el contenido orgánico sin la presión de que tiene que funcionar ya mismo.</p>

          <h2>Capítulo 3 — El video que sí funciona (sin cámara profesional)</h2>
          <p>No necesitas un equipo caro ni un curso de edición. Necesitas tres cosas:</p>
          <ol>
            <li><strong>1. Tu celular:</strong> La cámara de cualquier celular de los últimos años es más que suficiente. Graba con buena luz — cerca de una ventana durante el día es gratis y funciona mejor que cualquier aro de luz.</li>
            <li><strong>2. Tus 2 o 3 mejores trabajos:</strong> No el primero que hiciste esta semana — el que de verdad muestra tu nivel. Un antes y después bien iluminado vale más que diez segundos de proceso confuso.</li>
            <li><strong>3. CapCut mobile (gratuita):</strong> No necesitas efectos, transiciones complicadas ni música con derechos de autor dudosos. Un corte limpio, texto simple con el servicio que ofreces, y tu ubicación o zona de atención visible en algún punto del video.</li>
          </ol>
          <p>El objetivo del video no es impresionar con edición. Es que alguien que nunca te vio trabajar, en 15 segundos, entienda qué haces y confíe en que lo haces bien.</p>

          <h2>Capítulo 4 — Tu primer anuncio, paso a paso</h2>
          <p>Esto suena más complicado de lo que es. Vas a necesitar tres cosas antes de empezar: una página de Facebook o Instagram de tu negocio (aunque sea nueva y con pocos seguidores, funciona igual), el video que ya editaste, y una tarjeta para cargar el presupuesto.</p>
          <div class="box">
            <ol>
              <li><strong>1. Crea tu cuenta publicitaria</strong> dentro del Administrador de Anuncios de Meta. Hay decenas de tutoriales gratuitos en video que te llevan clic por clic — no necesitas memorizar nada, solo seguir la guía una vez.</li>
              <li><strong>2. Sube tu video</strong> como la pieza principal del anuncio.</li>
              <li><strong>3. Enlaza tu WhatsApp directamente al anuncio.</strong> Así, cuando alguien vea el video y le interese, el botón de WhatsApp aparece justo debajo, listo para escribirte sin tener que buscar tu perfil ni tu número por su cuenta.</li>
              <li><strong>4. Define tu radio de ubicación:</strong> entre 3 y 5 kilómetros alrededor de tu zona de atención. No tiene sentido pagarle a alguien que vive a dos horas de ti.</li>
              <li><strong>5. Define tu presupuesto:</strong> $4 al día (S/14 aprox.) como mínimo para empezar a ver movimiento.</li>
              <li><strong>6. Define la duración:</strong> entre 7 y 15 días corridos, sin pausar el anuncio a mitad de camino — necesita ese tiempo para encontrar a las personas correctas.</li>
            </ol>
          </div>
          <p>Eso es todo. No hay un paso oculto ni un secreto que solo las agencias conocen. La diferencia entre quien lo hace y quien no, casi nunca es el conocimiento técnico — es haberse animado a completar estos 6 pasos una sola vez.</p>

          <h2>Capítulo 5 — Los primeros días: qué esperar de verdad</h2>
          <p>Ni el primer día ni el segundo vas a tener la agenda llena — y eso no significa que el anuncio esté fallando. Los primeros mensajes suelen llegar entre el día 2 y el día 5, y muchas veces empiezan como preguntas ("¿cuánto cuesta el servicio de uñas?", "¿atienden los sábados?") antes de convertirse en una cita agendada.</p>
          <p><strong>Responde rápido.</strong> Un mensaje de WhatsApp que se responde en minutos convierte mucho mejor que uno que se responde al día siguiente — recuerda que estás compitiendo con la inmediatez que la misma app entrena en todos nosotros.</p>
          <p>Si al día 7 todavía no llegó ningún mensaje, no es momento de apagar el anuncio con frustración — es momento de revisar el video: ¿se ve claro el trabajo?, ¿la iluminación ayuda o esconde el detalle?, ¿el radio de ubicación es demasiado amplio o demasiado chico para tu zona? Pequeños ajustes, no un cambio de estrategia completo.</p>

          <h2>Capítulo 6 — Y ahora, no dejes que se te escapen</h2>
          <p>Cada clienta nueva que te escribe gracias a este anuncio te costó ese presupuesto diario. Eso la convierte en algo valioso desde el primer mensaje — no la trates como una cita más y ya. Guarda su contacto, anota qué servicio hizo, y desde ese primer día empieza a pensar en cómo vas a lograr que esa clienta vuelva sin que tengas que invertir otros $4 al día para recuperarla si se pierde.</p>
          <p>Ese es exactamente el Paso 2 de mi método — la fidelización y retención — y es el tema completo de mi otro ebook. Este anuncio te da la primera cita. Lo que hagas después es lo que decide si esa clienta se vuelve recurrente, o si en 60 días vuelve a ser un chat silencioso más en tu WhatsApp.</p>

          <h2>Cierre — Enciende el anuncio hoy</h2>
          <p>No hace falta que el video sea perfecto. No hace falta que sientas que ya estás lista. Lo único que de verdad importa es que $4 al día es una inversión lo suficientemente chica como para que el miedo a perderla no valga más que las clientas que puede traerte.</p>
          <p>La lashista o manicurista que ya tiene su agenda llena hoy, en algún momento también sintió esa misma vergüenza de subir su primer video. La diferencia es que lo hizo con miedo y todo.</p>
          <p><strong>Empieza gratis con Nilah y prepárate para recibir a tus primeras clientas.</strong></p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'El_anuncio_de_4_dolares_Martin_Pestana.doc';
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
    { id: 'intro', num: '00', title: 'Introducción: El anuncio que nunca enciendes' },
    { id: 'cap1', num: '01', title: 'Por qué el miedo es normal' },
    { id: 'cap2', num: '02', title: 'Orgánico vs. Pagado' },
    { id: 'cap3', num: '03', title: 'El video que sí funciona' },
    { id: 'cap4', num: '04', title: 'Tu primer anuncio paso a paso' },
    { id: 'cap5', num: '05', title: 'Los primeros días: qué esperar' },
    { id: 'cap6', num: '06', title: 'Y ahora, no dejes que se te escapen' },
    { id: 'cierre', num: '🚀', title: 'Cierre: Enciende el anuncio hoy' },
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 pb-20 ${
      isDark 
        ? 'bg-[#080b11] text-slate-100 selection:bg-sky-500 selection:text-white' 
        : 'bg-slate-100/90 text-slate-900 selection:bg-sky-200 selection:text-sky-900'
    } print:bg-white print:text-black print:pb-0`}>

      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-sky-500 via-teal-400 to-indigo-500 z-50 transition-all duration-150 print:hidden"
        style={{ width: `${readProgress}%` }}
      />

      {/* ── HEADER SUPERIOR MOBILE-FIRST COMPACTO ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2.5 sm:py-3 flex items-center justify-between transition-colors print:hidden ${
        isDark ? 'bg-[#0b1017]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 shadow-2xs text-slate-900'
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 truncate">Ebook · Captación</p>
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">El anuncio de $4</h2>
          </div>
        </div>

        {/* ACCIONES TOP */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* BOTÓN ÍNDICE MÓVIL */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 border border-sky-500/20 active:scale-95 transition-transform"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px]">Índice</span>
          </button>

          {/* MODO OSCURO / CLARO */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-sky-700 hover:bg-slate-200'
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
            className="flex items-center gap-1 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
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
              ? 'bg-[#0f141f]/90 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-200/50'
          }`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-xl bg-sky-500/10 text-sky-600 font-black text-xs">
                🎯
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tabla de Contenido</h4>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Guía Práctica Paso a Paso</p>
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
                        ? 'bg-sky-600 text-white font-black shadow-xs'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-sky-50 hover:text-sky-900'
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
                className="flex-1 py-2 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
              ? 'bg-gradient-to-br from-[#0c192c] via-[#09111c] to-[#070b12] border-sky-900/40 text-white' 
              : 'bg-gradient-to-br from-sky-600 via-teal-600 to-indigo-800 text-white border-sky-700 shadow-xl shadow-sky-600/15'
          } print:bg-none print:border-none print:p-0 print:text-black`}>
            
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <Target className="w-3.5 h-3.5 text-amber-300" />
                <span>Paso 1 del Método · Edición 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
                El anuncio de $4
              </h1>

              <p className="text-xs sm:text-base text-sky-100 font-medium leading-relaxed">
                Pierde el miedo, gana tus primeras clientas
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
                    <p className="text-[10px] sm:text-[11px] text-sky-200">Ex-Administrador de salón & Creador de Nilah</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-sky-100 font-medium bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Clock className="w-3 h-3" />
                  <span>Lectura: ~7 min</span>
                </div>
              </div>

              {/* BOTONES FIRST-MOBILE */}
              <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 print:hidden">
                <button
                  onClick={() => scrollToSection('intro')}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-sky-50 text-sky-900 font-black text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer col-span-2 sm:col-auto"
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
            isDark ? 'bg-[#0d121c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>00</span>
              <span>•</span>
              <span>Introducción</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El anuncio que nunca enciendes
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hay un anuncio que casi todas las lashistas y manicuristas que están empezando tienen guardado en la cabeza, pero nunca en la cuenta publicitaria. Lo piensan, lo posponen, encuentran una excusa nueva cada semana — <em>"cuando tenga mejores fotos"</em>, <em>"cuando aprenda bien la app"</em>, <em>"cuando ya no dé tanta vergüenza"</em> — y mientras tanto, la agenda sigue con los mismos 3 espacios vacíos del mes pasado.
              </p>

              <p>
                Este ebook no es sobre técnica de anuncios avanzada. Es sobre esa pausa. Sobre por qué existe, y sobre por qué encender tu primer anuncio con <strong>$4 al día (S/14 aprox.)</strong> es, casi siempre, mucho menos riesgoso de lo que tu cabeza te está diciendo ahora mismo.
              </p>

              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border-l-4 border-sky-500 text-sky-950 dark:text-sky-200 font-medium text-xs sm:text-sm leading-relaxed">
                Si ya leíste mi ebook sobre el método completo, esto es el zoom total al <strong>Paso 1: cómo pasar de cero clientas a tus primeras 20 o 30</strong>, sin depender de que un video se haga viral por casualidad.
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 1
          ══════════════════════════════════════════ */}
          <article id="cap1" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#0d121c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 01</span>
              <span>•</span>
              <span>Mentalidad</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Por qué el miedo es normal (y por qué no debería decidir por ti)
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                El miedo a mostrar tu trabajo en redes, o a "gastar" plata en un anuncio, casi nunca es miedo a la tecnología. Es miedo a la exposición. A que alguien conocido vea el video y opine. A invertir esos $4 y que "no pase nada". A sentir que estás vendiendo, cuando toda tu formación fue sobre la técnica, no sobre venderte a ti misma.
              </p>

              <p>
                Ese miedo es completamente normal y lo vi de cerca, muchas veces, en profesionales con manos brillantes que se congelaban frente a la cámara del celular. Pero fíjate en algo: ese miedo no aparece por practicar demasiado la técnica, aparece por practicar cero veces lo otro — mostrarte, cobrar por tu talento en voz alta, pedir que alguien confíe en ti sin haberte visto trabajar antes.
              </p>

              <p>
                Como cualquier técnica de tu oficio, mostrar tu trabajo y correr un anuncio también se practica. Nadie hizo el primer volumen ruso perfecto, y nadie graba su primer video sin sentir un poco de vergüenza. La diferencia entre la que ya tiene clientas nuevas llegando y la que sigue esperando el momento perfecto casi nunca es el talento — es que una encendió el anuncio con vergüenza y todo, y la otra sigue esperando sentirse lista.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-medium space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                  <span>💡</span> Antes de seguir:
                </p>
                <p className="leading-relaxed">
                  Pregúntate con honestidad — ¿qué es lo peor que puede pasar si subes ese video y corres el anuncio hoy? Casi siempre, la respuesta real es <em>"que nadie escriba"</em>. No es "que pierda todo mi dinero" ni "que arruine mi reputación". Es, en el peor de los casos, gastar $4 en un día sin resultado. Eso es todo. Vale la pena releer esa frase.
                </p>
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 2
          ══════════════════════════════════════════ */}
          <article id="cap2" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#0d121c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 02</span>
              <span>•</span>
              <span>Estrategia de Canales</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Orgánico vs. pagado: la diferencia que nadie te explica bien
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Todo el mundo te va a decir <em>"sube contenido, sé constante, el algoritmo te va a premiar"</em>. Y es cierto, a largo plazo. El problema es el "a largo plazo" cuando lo que necesitas son clientas este mes, no en seis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <span>📱</span> Contenido orgánico (TikTok / IG)
                  </h4>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                    <li>• Depende de un algoritmo que no controlas.</li>
                    <li>• Necesita constancia diaria (difícil tras 8h paradas).</li>
                    <li>• El resultado tarda semanas o meses en llegar.</li>
                    <li>• Construye marca personal a largo plazo.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2">
                  <h4 className="font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <span>🎯</span> Anuncios pagados (Meta Ads)
                  </h4>
                  <ul className="space-y-1 text-sky-950 dark:text-sky-200 text-xs">
                    <li>• Tú decides a quién le aparece (radio de 3-5 km).</li>
                    <li>• El resultado empieza a verse en días, no meses.</li>
                    <li>• Controlas el presupuesto ($4/día y paras cuando quieras).</li>
                    <li>• Te da las clientas inmediatas para empezar.</li>
                  </ul>
                </div>
              </div>

              <p>
                Ninguna de las dos es "mejor" en abstracto. Pero si estás empezando de cero y necesitas ingresos ahora, apostarlo todo al contenido orgánico es como sembrar una semilla y esperar la cosecha sin tener nada para comer mientras tanto. El anuncio pagado es el ingreso de corto plazo que te da el tiempo y la calma para, después, construir el contenido orgánico sin la presión de que tiene que funcionar ya mismo.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 3
          ══════════════════════════════════════════ */}
          <article id="cap3" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#0d121c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 03</span>
              <span>•</span>
              <span>Creación de Video</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El video que sí funciona (sin cámara profesional)
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                No necesitas un equipo caro ni un curso de edición. Necesitas tres cosas:
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Tu celular</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      La cámara de cualquier celular de los últimos años es más que suficiente. Graba con buena luz — cerca de una ventana durante el día es gratis y funciona mejor que cualquier aro de luz.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">Tus 2 o 3 mejores trabajos</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      No el primero que hiciste esta semana — el que de verdad muestra tu nivel. Un antes y después bien iluminado vale más que diez segundos de proceso confuso.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">CapCut mobile (gratuita)</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      No necesitas efectos, transiciones complicadas ni música con derechos de autor dudosos. Un corte limpio, texto simple con el servicio que ofreces, y tu ubicación o zona de atención visible en algún punto del video.
                    </p>
                  </div>
                </div>
              </div>

              <p className="font-bold text-sky-700 dark:text-sky-300 text-xs sm:text-sm">
                El objetivo del video no es impresionar con edición. Es que alguien que nunca te vio trabajar, en 15 segundos, entienda qué haces y confíe en que lo haces bien.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 4
          ══════════════════════════════════════════ */}
          <article id="cap4" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#0d121c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 04</span>
              <span>•</span>
              <span>Paso a Paso</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Tu primer anuncio, paso a paso
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Esto suena más complicado de lo que es. Vas a necesitar tres cosas antes de empezar: una página de Facebook o Instagram de tu negocio (aunque sea nueva y con pocos seguidores, funciona igual), el video que ya editaste, y una tarjeta para cargar el presupuesto.
              </p>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs sm:text-sm">
                <ol className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-600">1.</span>
                    <span><strong>Crea tu cuenta publicitaria</strong> dentro del Administrador de Anuncios de Meta. Hay decenas de tutoriales gratuitos en video que te llevan clic por clic — no necesitas memorizar nada, solo seguir la guía una vez.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-600">2.</span>
                    <span><strong>Sube tu video</strong> como la pieza principal del anuncio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-600">3.</span>
                    <span><strong>Enlaza tu WhatsApp directamente al anuncio.</strong> Así, cuando alguien vea el video y le interese, el botón de WhatsApp aparece justo debajo, listo para escribirte sin tener que buscar tu perfil ni tu número por su cuenta.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-600">4.</span>
                    <span><strong>Define tu radio de ubicación:</strong> entre 3 y 5 kilómetros alrededor de tu zona de atención. No tiene sentido pagarle a alguien que vive a dos horas de ti.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-600">5.</span>
                    <span><strong>Define tu presupuesto:</strong> $4 al día (S/14 aprox.) como mínimo para empezar a ver movimiento.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-sky-600">6.</span>
                    <span><strong>Define la duración:</strong> entre 7 y 15 días corridos, sin pausar el anuncio a mitad de camino — necesita ese tiempo para encontrar a las personas correctas.</span>
                  </li>
                </ol>
              </div>

              <p>
                Eso es todo. No hay un paso oculto ni un secreto que solo las agencias conocen. La diferencia entre quien lo hace y quien no, casi nunca es el conocimiento técnico — es haberse animado a completar estos 6 pasos una sola vez.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 5
          ══════════════════════════════════════════ */}
          <article id="cap5" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#0d121c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 05</span>
              <span>•</span>
              <span>Métricas Reales</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Los primeros días: qué esperar de verdad
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Ni el primer día ni el segundo vas a tener la agenda llena — y eso no significa que el anuncio esté fallando. Los primeros mensajes suelen llegar entre el día 2 y el día 5, y muchas veces empiezan como preguntas (<em>"¿cuánto cuesta el servicio de uñas?"</em>, <em>"¿atienden los sábados?"</em>) antes de convertirse en una cita agendada.
              </p>

              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 text-teal-950 dark:text-teal-200 text-xs sm:text-sm font-medium">
                <strong>Responde rápido:</strong> Un mensaje de WhatsApp que se responde en minutos convierte mucho mejor que uno que se responde al día siguiente — recuerda que estás compitiendo con la inmediatez que la misma app entrena en todos nosotros.
              </div>

              <p>
                Si al día 7 todavía no llegó ningún mensaje, no es momento de apagar el anuncio con frustración — es momento de revisar el video: ¿se ve claro el trabajo?, ¿la iluminación ayuda o esconde el detalle?, ¿el radio de ubicación es demasiado amplio o demasiado chico para tu zona? Pequeños ajustes, no un cambio de estrategia completo.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 6
          ══════════════════════════════════════════ */}
          <article id="cap6" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#0d121c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 06</span>
              <span>•</span>
              <span>Retención</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Y ahora, no dejes que se te escapen
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Cada clienta nueva que te escribe gracias a este anuncio te costó ese presupuesto diario. Eso la convierte en algo valioso desde el primer mensaje — no la trates como una cita más y ya. Guarda su contacto, anota qué servicio hizo, y desde ese primer día empieza a pensar en cómo vas a lograr que esa clienta vuelva sin que tengas que invertir otros $4 al día para recuperarla si se pierde.
              </p>

              <p>
                Ese es exactamente el <strong>Paso 2 de mi método — la fidelización y retención</strong> — y es el tema completo de mi otro ebook. Este anuncio te da la primera cita. Lo que hagas después es lo que decide si esa clienta se vuelve recurrente, o si en 60 días vuelve a ser un chat silencioso más en tu WhatsApp.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CIERRE & CTA PRINCIPAL
          ══════════════════════════════════════════ */}
          <section id="cierre" className={`p-6 sm:p-10 rounded-[2rem] text-center space-y-4 sm:space-y-5 border transition-all relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#0c182c] via-[#09101c] to-[#060a10] border-sky-800/40 text-white' 
              : 'bg-gradient-to-b from-sky-600 via-teal-600 to-indigo-800 text-white border-sky-700 shadow-2xl shadow-sky-600/20'
          }`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              <span>🚀</span> Enciende el anuncio hoy
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight max-w-lg mx-auto leading-tight">
              No hace falta que el video sea perfecto. No hace falta que sientas que ya estás lista.
            </h2>

            <p className="text-xs sm:text-sm text-sky-100 max-w-md mx-auto leading-relaxed">
              Lo único que de verdad importa es que $4 al día es una inversión lo suficientemente chica como para que el miedo a perderla no valga más que las clientas que puede traerte.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href="/login?tab=register"
                className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-white hover:bg-sky-50 text-sky-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Zap size={16} className="fill-sky-950" />
                <span>Empezar gratis con Nilah</span>
              </a>

              <Link
                to="/ebooks/de-aprendiz-a-duena"
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <BookOpen size={14} />
                <span>Leer: De Aprendiz a Dueña</span>
              </Link>
            </div>

            <p className="text-[10px] sm:text-[11px] text-sky-200/80 pt-1">
              Sin tarjeta de crédito · Hasta 100 clientas gratis · Organiza tus citas desde hoy
            </p>
          </section>

          {/* ── FOOTER DE ARTÍCULO ── */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Nilah IA & Martín Pestana · Todos los derechos reservados.</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-sky-600 font-bold cursor-pointer"
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
          className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-teal-600 text-white font-black text-xs py-2.5 px-4 rounded-full shadow-lg shadow-sky-600/30 active:scale-95 transition-all cursor-pointer"
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
                isDark ? 'bg-[#0d121c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 font-bold text-xs">
                    🎯
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400">Tabla de Contenido</h3>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">El Anuncio de $4</p>
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
                          ? 'bg-sky-600 text-white font-black shadow-xs'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-slate-700 hover:bg-sky-50'
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
                  className="flex-1 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-sky-200 dark:border-sky-800/60"
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

export default EbookAnuncio4Dolares;
