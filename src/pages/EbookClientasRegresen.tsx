import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Check, Copy, Moon, Sun, Loader2, Sparkles, 
  BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText, 
  ChevronRight, Share2, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Users, Smartphone, Zap, Sparkle, Lightbulb, DollarSign,
  List, X, Gift, Award, Repeat, Eye, Star
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const EbookClientasRegresen: React.FC = () => {
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
    document.title = 'Cómo hacer que tus clientas regresen | Ebook de Martín Pestana';
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
          <title>Cómo hacer que tus clientas regresen - Martín Pestana</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
            h1 { color: #8b5cf6; font-size: 26pt; line-height: 1.2; margin-bottom: 6px; }
            h2 { color: #6d28d9; font-size: 17pt; margin-top: 24pt; border-bottom: 2px solid #ddd6fe; padding-bottom: 4pt; page-break-before: always; }
            h3 { color: #5b21b6; font-size: 13pt; margin-top: 14pt; }
            p { font-size: 11pt; margin-bottom: 10pt; text-align: justify; }
            blockquote { background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 12px; margin: 16px 0; font-style: italic; color: #4c1d95; }
            .badge { background: #ede9fe; color: #6d28d9; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 14px 0; }
            .script-box { background: #faf5ff; border: 1px solid #d8b4fe; border-left: 4px solid #9333ea; padding: 12px; margin: 12px 0; font-family: 'Segoe UI', sans-serif; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="badge">EBOOK COMPLETO · EDICIÓN OFICIAL 2026</p>
            <h1>Cómo hacer que tus clientas regresen</h1>
            <p style="font-size: 14pt; color: #64748b; font-weight: bold;">Para dueñas de salón, spa o independientes con clientas activas</p>
            <p style="font-size: 10.5pt; color: #475569;">Por <strong>Martín Pestana</strong> — Ex-Administrador de Salón & Creador de Nilah IA</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>

          <h2>Introducción — El club que ya tienes, sin saberlo</h2>
          <p>Si ya tienes clientas activas, felicidades — ya pasaste la parte más difícil, que es que alguien confíe en ti la primera vez. El problema que casi nadie te dice en voz alta no es que te falten clientas nuevas. Es que ya tienes, ahora mismo, un club de personas que confiaron en ti al menos una vez, y ese club se está vaciando en silencio sin que nadie se dé cuenta hasta que un mes llega más flojo de lo normal.</p>
          <p>Yo administré un salón durante 3 años. Y lo que más se repetía no era que perdiéramos clientas por mal servicio — el trabajo era bueno, mi socia y la lashista sabían lo que hacían. Lo que se repetía era esto: una clienta venía, quedaba encantada, decía "vengo el próximo mes sin falta" con toda la sinceridad del mundo... y ese próximo mes nunca llegaba. No porque cambiara de opinión. Porque nadie, de nuestro lado, volvió a aparecer en su vida hasta que ella misma decidiera acordarse.</p>
          <p>Este ebook es sobre esa clienta. La que no se fue enojada. La que simplemente se perdió en el ruido de su propia vida, esperando una señal de vuelta que nunca llegó.</p>

          <h2>Capítulo 1 — El club invisible que ya tienes</h2>
          <p>Piensa en tu WhatsApp ahora mismo como si fuera una sala de espera. En ella están sentadas todas las personas que alguna vez confiaron en ti lo suficiente como para sentarse en tu silla, pagar por tu trabajo, y salir contentas. Algunas de ellas llevan ahí, en esa sala invisible, 30, 60 o 90 días — y tú ni siquiera lo sabes, porque están mezcladas entre cientos de otros chats de la vida diaria.</p>
          <p>Ese club ya existe. No tienes que construirlo desde cero ni gastar en publicidad para crearlo. Ya está ahí, esperando. Lo único que falta es que alguien, de tu lado, camine hasta esa sala de espera y le hable a cada una.</p>
          <blockquote>"Antes de seguir: abre tu WhatsApp y cuenta, aunque sea aproximadamente, cuántas clientas tienes ahí que no visitas ni escribes hace más de 60 días. Ese número es tu club invisible. Vuelve a él más adelante en este ebook."</blockquote>

          <h2>Capítulo 2 — Por qué una clienta viene dos veces y nunca más regresa</h2>
          <p>Hay una creencia que le hace daño a casi todas las profesionales del rubro: pensar que si una clienta no vuelve, es porque algo salió mal con el servicio. La mayoría de las veces, no es así.</p>
          <p>Las razones reales por las que una clienta se aleja casi nunca tienen que ver con la calidad de tu trabajo:</p>
          <ul>
            <li>Se le pasó el tiempo entre el trabajo, los hijos y el día a día, y nadie le recordó que ya tocaba retoque.</li>
            <li>Sintió que, si volvía a escribir, iba a sonar como si estuviera "rogando" por una cita, y prefirió no hacerlo.</li>
            <li>Genuinamente se olvidó — no por desinterés, sino porque tu negocio no tiene un espacio fijo en su rutina como sí lo tiene, por ejemplo, su gimnasio o su peluquería de toda la vida.</li>
            <li>Probó otro lugar por cercanía o por casualidad, sin ninguna intención de "reemplazarte", y ese nuevo lugar sí volvió a escribirle después.</li>
          </ul>
          <p>Fíjate en el patrón: en casi ningún caso la clienta decidió activamente "no volver nunca más contigo". Simplemente nadie le dio una razón concreta, en el momento correcto, para volver a pensar en ti. El silencio, no el mal servicio, es la causa más común de una clienta perdida.</p>

          <h2>Capítulo 3 — El costo real de no fidelizar</h2>
          <p>Esto no es una sensación ni una intuición de negocio. Son datos documentados de la industria de belleza:</p>
          <div class="box">
            <ul>
              <li>Conseguir una clienta nueva cuesta <strong>5 veces más</strong>, en tiempo y en dinero, que retener a una que ya te conoce. (Fuente: SalonWOP, Estrategias de Retención 2025)</li>
              <li>El <strong>42%</strong> de las clientas leales de un salón genera el <strong>80%</strong> de sus ingresos totales. (Fuente: Zenoti Benchmark Report 2025)</li>
              <li>El <strong>60%</strong> de los salones en México y Perú tiene una tasa de retención por debajo del <strong>40%</strong> — es decir, la mayoría del mercado está dejando pasar exactamente esto. (Fuente: SalonWOP 2025)</li>
              <li>Subir la retención de tus clientas solo un <strong>5%</strong> puede aumentar tus utilidades netas hasta en un <strong>95%</strong>. (Principio de Bain & Company, citado por SalonWOP 2025)</li>
            </ul>
          </div>
          <p>Traduce esto a tu propio negocio por un segundo: si tienes 100 clientas en tu base y hoy retienes al 35% de ellas, estás justo en el promedio del mercado — un promedio que, según estos datos, deja sobre la mesa una cantidad enorme de dinero que ya trabajaste para ganar una vez, y que se te está escapando por no volver a aparecer en la vida de esa persona.</p>
          <p><strong>No necesitas más clientas nuevas este mes. Necesitas menos clientas que se te escapen en silencio.</strong></p>

          <h2>Capítulo 4 — El seguimiento simple que cambia todo</h2>
          <p>Aquí es donde la mayoría comete el mismo error: cuando finalmente deciden "hacer seguimiento", mandan un mensaje genérico de campaña — "Hola, tenemos 20% de descuento este mes" — a todos sus contactos de golpe. Ese mensaje se siente frío, impersonal, y en el fondo comunica exactamente lo contrario de lo que se busca: que esa clienta es un número más en una lista.</p>
          <p>Un mensaje de seguimiento que funciona sigue una estructura simple de tres partes, algo que yo llamo un mensaje activador:</p>
          <ol>
            <li><strong>1. Gancho</strong> — habla de ella o de su ausencia, nunca de tu negocio ni con un saludo acartonado.</li>
            <li><strong>2. Confidencia</strong> — empieza con su nombre, presenta el motivo del mensaje como algo pensado especialmente para ella, en máximo dos oraciones.</li>
            <li><strong>3. Cierre suave</strong> — una sola pregunta de baja fricción, sin urgencia falsa, que se responda con un simple "sí" o "dale".</li>
          </ol>
          <div class="script-box">
            <p><strong>Ejemplo real de mensaje de rescate:</strong></p>
            <p>No voy a decir que llevo semanas mirando tu espacio vacío... pero lo estoy diciendo. 👀<br/>
            Pero como soy buena gente, te guardé un regalito — y tu espacio favorito también. 😉🎁<br/>
            Sofía, ¿coordinamos esta semana?</p>
          </div>
          <p>Nota que este mensaje no menciona ningún descuento como primera línea, y aun así invita a responder. Ese es el tipo de seguimiento que convierte el silencio en una cita agendada, sin sonar a spam ni a desesperación.</p>

          <h2>Capítulo 5 — Puntos y premios: por qué funcionan de verdad</h2>
          <p>Hay una razón por la que un programa de puntos funciona incluso cuando la clienta sabe, racionalmente, que el premio no vale tanto dinero: no está comprando el premio. Está jugando un juego donde ella va ganando, y a nadie le gusta dejar un juego a la mitad.</p>
          <p>Cuando una clienta sabe que le faltan 2 visitas para su servicio gratis, esas 2 visitas dejan de depender solo de que "se acuerde" de ti — ahora hay una razón concreta, casi como una cuenta pendiente con ella misma, para volver antes de que se le pase el tiempo. El punto acumulado es un recordatorio silencioso que trabaja para ti incluso los días que no le escribes nada.</p>
          <div class="box">
            <p><strong>Un programa de puntos y premios simple no necesita ser complicado para funcionar:</strong></p>
            <ul>
              <li><strong>Qué premiar:</strong> cada visita completada, sin importar el servicio. Empezar simple es mejor que empezar perfecto.</li>
              <li><strong>Cuánto pedir:</strong> un umbral alcanzable en pocos meses — si el premio tarda un año en llegar, deja de sentirse real y la clienta pierde el interés en el camino.</li>
              <li><strong>Qué ofrecer como premio:</strong> no siempre tiene que ser un servicio gratis completo. Un upgrade, un producto de regalo, o un descuento especial también generan el mismo efecto de "me falta poco".</li>
              <li><strong>Cómo comunicarlo:</strong> cada vez que sume un punto, que se entere — un mensaje corto después de la cita que le muestre cuántos puntos lleva mantiene el juego activo en su cabeza, no solo en un papel guardado en un cajón.</li>
            </ul>
          </div>
          <p>En Nilah, este sistema de puntos y premios ya está integrado, así que las visitas de tus clientas se acumulan automáticamente sin que tengas que llevar la cuenta a mano ni acordarte de avisarle a cada una por separado.</p>

          <h2>Capítulo 6 — Las tres audiencias que ya tienes, sin saberlo</h2>
          <p>No todas tus clientas necesitan el mismo mensaje. Dentro de tu propio WhatsApp ya existen, sin que las hayas separado todavía, al menos tres grupos distintos:</p>
          <ul>
            <li><strong>Las recién atendidas:</strong> Acaban de salir de tu silla. Aquí el mensaje correcto es de reconocimiento y celebración — un simple "gracias por confiar en mí" que la haga sentir vista, no otro mensaje de venta apenas se fue.</li>
            <li><strong>Las que ya tocan retoque:</strong> Según el ciclo de tu servicio (2-3 semanas para uñas, 3-4 para pestañas, por ejemplo), este grupo necesita un recordatorio con urgencia física real — algo que está pasando en su cuerpo ahora mismo, no una promoción genérica.</li>
            <li><strong>Las ausentes de 30, 60 o 90 días:</strong> Este es tu club invisible del Capítulo 1. Aquí el mensaje correcto juega con la ausencia y la nostalgia — el espacio vacío, el tiempo que pasó, sin culpa ni reproche.</li>
          </ul>
          <p>Tratar a estos tres grupos con el mismo mensaje genérico es la forma más rápida de que ninguno de los tres sienta que el mensaje era para él. Separarlos, aunque sea con una lista simple al principio, ya es fidelización real — no necesitas tecnología sofisticada para empezar, necesitas dejar de mandarle a todos lo mismo.</p>

          <h2>Cierre — La clienta que todavía puede volver</h2>
          <p>Vuelve al número que anotaste en el Capítulo 1 — esas clientas que llevan más de 60 días sin aparecer. Ninguna de ellas te odia. Ninguna decidió activamente reemplazarte. La mayoría, en el fondo, solo está esperando una señal de tu parte para volver a acordarse de ti.</p>
          <p>No necesitas gastar en publicidad para recuperarlas. No necesitas ofrecerles un descuento enorme que devalúe tu trabajo. Necesitas, simplemente, dejar de dejarlas en silencio.</p>
          <p>Esa es la diferencia real entre un negocio que sobrevive mes a mes dependiendo de caras nuevas, y uno que crece con calma porque las personas que ya confiaron en él, vuelven.</p>
          <p><strong>Activa el sistema de fidelización y puntos en Nilah, gratis.</strong></p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Como_hacer_que_tus_clientas_regresen_Martin_Pestana.doc';
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
    { id: 'intro', num: '00', title: 'Introducción: El club que ya tienes' },
    { id: 'cap1', num: '01', title: 'El club invisible que ya tienes' },
    { id: 'cap2', num: '02', title: 'Por qué no regresan' },
    { id: 'cap3', num: '03', title: 'El costo real de no fidelizar' },
    { id: 'cap4', num: '04', title: 'El seguimiento simple que cambia todo' },
    { id: 'cap5', num: '05', title: 'Puntos y premios: Por qué funcionan' },
    { id: 'cap6', num: '06', title: 'Las tres audiencias que ya tienes' },
    { id: 'cierre', num: '🚀', title: 'Cierre: La clienta que puede volver' },
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 pb-20 ${
      isDark 
        ? 'bg-[#090714] text-slate-100 selection:bg-purple-500 selection:text-white' 
        : 'bg-slate-100/90 text-slate-900 selection:bg-purple-200 selection:text-purple-900'
    } print:bg-white print:text-black print:pb-0`}>

      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-500 z-50 transition-all duration-150 print:hidden"
        style={{ width: `${readProgress}%` }}
      />

      {/* ── HEADER SUPERIOR MOBILE-FIRST COMPACTO ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2.5 sm:py-3 flex items-center justify-between transition-colors print:hidden ${
        isDark ? 'bg-[#0e0b1f]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 shadow-2xs text-slate-900'
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 truncate">Ebook · Fidelización</p>
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">Cómo hacer que regresen</h2>
          </div>
        </div>

        {/* ACCIONES TOP */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* BOTÓN ÍNDICE MÓVIL */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 active:scale-95 transition-transform"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px]">Índice</span>
          </button>

          {/* MODO OSCURO / CLARO */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-purple-700 hover:bg-slate-200'
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
            className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
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
              ? 'bg-[#120f24]/90 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-200/50'
          }`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 font-black text-xs">
                📖
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tabla de Contenido</h4>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Guía de Retención Real</p>
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
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900'
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
                className="flex-1 py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
              ? 'bg-gradient-to-br from-[#1c1033] via-[#120b22] to-[#080611] border-purple-900/40 text-white' 
              : 'bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-700 text-white border-purple-700 shadow-xl shadow-purple-600/15'
          } print:bg-none print:border-none print:p-0 print:text-black`}>
            
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-fuchsia-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <Repeat className="w-3.5 h-3.5 text-amber-300" />
                <span>Ebook Oficial · Edición 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
                Cómo hacer que tus clientas regresen
              </h1>

              <p className="text-xs sm:text-base text-purple-100 font-medium leading-relaxed">
                Para dueñas de salón, spa o independientes con clientas activas
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
                    <p className="text-[10px] sm:text-[11px] text-purple-200">Ex-Administrador de salón & Creador de Nilah</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-purple-100 font-medium bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Clock className="w-3 h-3" />
                  <span>Lectura: ~9 min</span>
                </div>
              </div>

              {/* BOTONES FIRST-MOBILE */}
              <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 print:hidden">
                <button
                  onClick={() => scrollToSection('intro')}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-purple-50 text-purple-900 font-black text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer col-span-2 sm:col-auto"
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
            isDark ? 'bg-[#100d20] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>00</span>
              <span>•</span>
              <span>Introducción</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El club que ya tienes, sin saberlo
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Si ya tienes clientas activas, felicidades — ya pasaste la parte más difícil, que es que alguien confíe en ti la primera vez. El problema que casi nadie te dice en voz alta no es que te falten clientas nuevas. Es que ya tienes, ahora mismo, un club de personas que confiaron en ti al menos una vez, y ese club se está vaciando en silencio sin que nadie se dé cuenta hasta que un mes llega más flojo de lo normal.
              </p>

              <p>
                Yo administré un salón durante 3 años. Y lo que más se repetía no era que perdiéramos clientas por mal servicio — el trabajo era bueno, mi socia y la lashista sabían lo que hacían. Lo que se repetía era esto: una clienta venía, quedaba encantada, decía <em>"vengo el próximo mes sin falta"</em> con toda la sinceridad del mundo... y ese próximo mes nunca llegaba. No porque cambiara de opinión. Porque nadie, de nuestro lado, volvió a aparecer en su vida hasta que ella misma decidiera acordarse.
              </p>

              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-500 text-purple-950 dark:text-purple-200 font-medium text-xs sm:text-sm leading-relaxed">
                Este ebook es sobre esa clienta. La que no se fue enojada. La que simplemente se perdió en el ruido de su propia vida, esperando una señal de vuelta que nunca llegó.
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 1
          ══════════════════════════════════════════ */}
          <article id="cap1" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#100d20] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 01</span>
              <span>•</span>
              <span>Diagnóstico</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El club invisible que ya tienes
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Piensa en tu WhatsApp ahora mismo como si fuera una sala de espera. En ella están sentadas todas las personas que alguna vez confiaron en ti lo suficiente como para sentarse en tu silla, pagar por tu trabajo, y salir contentas. Algunas de ellas llevan ahí, en esa sala invisible, 30, 60 o 90 días — y tú ni siquiera lo sabes, porque están mezcladas entre cientos de otros chats de la vida diaria.
              </p>

              <p>
                Ese club ya existe. No tienes que construirlo desde cero ni gastar en publicidad para crearlo. Ya está ahí, esperando. Lo único que falta es que alguien, de tu lado, camine hasta esa sala de espera y le hable a cada una.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-medium space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                  <span>💡</span> Antes de seguir:
                </p>
                <p className="leading-relaxed">
                  Abre tu WhatsApp y cuenta, aunque sea aproximadamente, cuántas clientas tienes ahí que no visitas ni escribes hace más de 60 días. Ese número es tu club invisible. Vuelve a él más adelante en este ebook.
                </p>
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 2
          ══════════════════════════════════════════ */}
          <article id="cap2" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#100d20] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 02</span>
              <span>•</span>
              <span>Psicología de la Clienta</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Por qué una clienta viene dos veces y nunca más regresa
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hay una creencia que le hace daño a casi todas las profesionales del rubro: pensar que si una clienta no vuelve, es porque algo salió mal con el servicio. La mayoría de las veces, no es así.
              </p>

              <p>
                Las razones reales por las que una clienta se aleja casi nunca tienen que ver con la calidad de tu trabajo:
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <strong>Se le pasó el tiempo</strong> entre el trabajo, los hijos y el día a día, y nadie le recordó que ya tocaba retoque.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <strong>Sintió pena de escribir:</strong> Pensó que iba a sonar como si estuviera "rogando" por un espacio, y prefirió no hacerlo.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <strong>Genuinamente se olvidó:</strong> No por desinterés, sino porque tu negocio aún no tiene un espacio fijo en su rutina mensual.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    <strong>Probó otro lugar por cercanía</strong> sin intención de reemplazarte, y ese nuevo lugar sí volvió a escribirle después.
                  </p>
                </div>
              </div>

              <blockquote className="p-3.5 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border-l-4 border-purple-500 text-purple-950 dark:text-purple-200 font-medium italic text-xs sm:text-sm">
                Fíjate en el patrón: en casi ningún caso la clienta decidió activamente "no volver nunca más contigo". Simplemente nadie le dio una razón concreta, en el momento correcto, para volver a pensar en ti. El silencio, no el mal servicio, es la causa más común de una clienta perdida.
              </blockquote>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 3
          ══════════════════════════════════════════ */}
          <article id="cap3" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#100d20] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 03</span>
              <span>•</span>
              <span>Datos & Métricas Reales</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El costo real de no fidelizar
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Esto no es una sensación ni una intuición de negocio. Son datos documentados de la industria de belleza:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1">
                  <div className="flex justify-between items-center text-rose-700 dark:text-rose-400 font-black text-xs">
                    <span>5X MÁS CARO</span>
                    <span>💸</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    Conseguir una clienta nueva cuesta <strong>5 veces más</strong>, en tiempo y en dinero, que retener a una que ya te conoce.
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">Fuente: SalonWOP, Estrategias de Retención 2025</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 font-black text-xs">
                    <span>80% DE INGRESOS</span>
                    <span>💎</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    El <strong>42% de las clientas leales</strong> de un salón genera el <strong>80% de sus ingresos totales</strong>.
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">Fuente: Zenoti Benchmark Report 2025</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                  <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-black text-xs">
                    <span>MERCADO LATAM</span>
                    <span>📉</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    El <strong>60% de los salones en México y Perú</strong> tiene una tasa de retención por debajo del <strong>40%</strong>.
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">Fuente: SalonWOP 2025</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-1">
                  <div className="flex justify-between items-center text-purple-700 dark:text-purple-400 font-black text-xs">
                    <span>+95% UTILIDADES</span>
                    <span>📈</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    Subir la retención solo un <strong>5%</strong> puede aumentar tus utilidades netas hasta en un <strong>95%</strong>.
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-1">Principio de Bain & Company, SalonWOP 2025</span>
                </div>
              </div>

              <p>
                Traduce esto a tu propio negocio por un segundo: si tienes 100 clientas en tu base y hoy retienes al 35% de ellas, estás justo en el promedio del mercado — un promedio que, según estos datos, deja sobre la mesa una cantidad enorme de dinero que ya trabajaste para ganar una vez, y que se te está escapando por no volver a aparecer en la vida de esa persona.
              </p>

              <p className="font-black text-purple-700 dark:text-purple-300 text-sm sm:text-base">
                No necesitas más clientas nuevas este mes. Necesitas menos clientas que se te escapen en silencio.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 4
          ══════════════════════════════════════════ */}
          <article id="cap4" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#100d20] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 04</span>
              <span>•</span>
              <span>El Mensaje Activador</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El seguimiento simple que cambia todo
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Aquí es donde la mayoría comete el mismo error: cuando finalmente deciden <em>"hacer seguimiento"</em>, mandan un mensaje genérico de campaña — <em>"Hola, tenemos 20% de descuento este mes"</em> — a todos sus contactos de golpe. Ese mensaje se siente frío, impersonal, y en el fondo comunica exactamente lo contrario de lo que se busca: que esa clienta es un número más en una lista.
              </p>

              <p>
                Un mensaje de seguimiento que funciona sigue una estructura simple de tres partes, algo que yo llamo un <strong>mensaje activador</strong>:
              </p>

              <div className="space-y-2">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Gancho</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Habla de ella o de su ausencia, nunca de tu negocio ni con un saludo acartonado.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Confidencia</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Empieza con su nombre, presenta el motivo del mensaje como algo pensado especialmente para ella, en máximo dos oraciones.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Cierre suave</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Una sola pregunta de baja fricción, sin urgencia falsa, que se responda con un simple "sí" o "dale".</p>
                  </div>
                </div>
              </div>

              {/* SCRIPT REAL INTERACTIVO */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2 pt-2">
                <span className="text-xs font-bold text-purple-300 block">Ejemplo real de mensaje para rescatar clientas de +60 días:</span>
                <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all">
                  <p>No voy a decir que llevo semanas mirando tu espacio vacío... pero lo estoy diciendo. 👀</p>
                  <p className="mt-2">Pero como soy buena gente, te guardé un regalito — y tu espacio favorito también. 😉🎁</p>
                  <p className="mt-2">Sofía, ¿coordinamos esta semana?</p>
                </div>
                <button
                  onClick={() => handleCopy("No voy a decir que llevo semanas mirando tu espacio vacío... pero lo estoy diciendo. 👀\n\nPero como soy buena gente, te guardé un regalito — y tu espacio favorito también. 😉🎁\n\nSofía, ¿coordinamos esta semana?", "copy-rescate")}
                  className="w-full sm:w-auto py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  {copiedId === "copy-rescate" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === "copy-rescate" ? '¡Copiado al portapapeles!' : 'Copiar plantilla'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm">
                Nota que este mensaje no menciona ningún descuento como primera línea, y aun así invita a responder. Ese es el tipo de seguimiento que convierte el silencio en una cita agendada, sin sonar a spam ni a desesperación.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 5
          ══════════════════════════════════════════ */}
          <article id="cap5" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#100d20] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Capítulo 05 · Mecánica de Fidelización</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Puntos y premios: por qué funcionan de verdad
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hay una razón por la que un programa de puntos funciona incluso cuando la clienta sabe, racionalmente, que el premio no vale tanto dinero: no está comprando el premio. Está jugando un juego donde ella va ganando, y a nadie le gusta dejar un juego a la mitad.
              </p>

              <p>
                Cuando una clienta sabe que le faltan 2 visitas para su servicio gratis, esas 2 visitas dejan de depender solo de que "se acuerde" de ti — ahora hay una razón concreta, casi como una cuenta pendiente con ella misma, para volver antes de que se le pase el tiempo. El punto acumulado es un recordatorio silencioso que trabaja para ti incluso los días que no le escribes nada.
              </p>

              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2.5 text-xs sm:text-sm">
                <h4 className="font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider text-xs">
                  Un programa de puntos y premios simple no necesita ser complicado para funcionar:
                </h4>
                <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span><strong>Qué premiar:</strong> cada visita completada, sin importar el servicio. Empezar simple es mejor que empezar perfecto.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span><strong>Cuánto pedir:</strong> un umbral alcanzable en pocos meses — si el premio tarda un año en llegar, deja de sentirse real y la clienta pierde el interés en el camino.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span><strong>Qué ofrecer como premio:</strong> no siempre tiene que ser un servicio gratis completo. Un upgrade, un producto de regalo, o un descuento especial también generan el mismo efecto de "me falta poco".</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span><strong>Cómo comunicarlo:</strong> cada vez que sume un punto, que se entere — un mensaje corto después de la cita que le muestre cuántos puntos lleva mantiene el juego activo en su cabeza, no solo en un papel guardado en un cajón.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm font-medium">
                En Nilah, este sistema de puntos y premios ya está integrado, así que las visitas de tus clientas se acumulan automáticamente sin que tengas que llevar la cuenta a mano ni acordarte de avisarle a cada una por separado.
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 6
          ══════════════════════════════════════════ */}
          <article id="cap6" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#100d20] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-xs uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Capítulo 06 · Segmentación</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Las tres audiencias que ya tienes, sin saberlo
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                No todas tus clientas necesitan el mismo mensaje. Dentro de tu propio WhatsApp ya existen, sin que las hayas separado todavía, al menos tres grupos distintos:
              </p>

              <div className="space-y-3 my-2 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-pink-700 dark:text-pink-300 flex items-center gap-1.5">
                    <span>✨</span> 1. Las recién atendidas
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Acaban de salir de tu silla. Aquí el mensaje correcto es de reconocimiento y celebración — un simple "gracias por confiar en mí" que la haga sentir vista, no otro mensaje de venta apenas se fue.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <span>⏳</span> 2. Las que ya tocan retoque
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Según el ciclo de tu servicio (2-3 semanas para uñas, 3-4 para pestañas, por ejemplo), este grupo necesita un recordatorio con urgencia física real — algo que está pasando en su cuerpo ahora mismo, no una promoción genérica.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <span>🎁</span> 3. Las ausentes de 30, 60 o 90 días
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Este es tu club invisible del Capítulo 1. Aquí el mensaje correcto juega con la ausencia y la nostalgia — el espacio vacío, el tiempo que pasó, sin culpa ni reproche.
                  </p>
                </div>
              </div>

              <p>
                Tratar a estos tres grupos con el mismo mensaje genérico es la forma más rápida de que ninguno de los tres sienta que el mensaje era para él. Separarlos, aunque sea con una lista simple al principio, ya es fidelización real — no necesitas tecnología sofisticada para empezar, necesitas dejar de mandarle a todos lo mismo.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CIERRE & CTA PRINCIPAL
          ══════════════════════════════════════════ */}
          <section id="cierre" className={`p-6 sm:p-10 rounded-[2rem] text-center space-y-4 sm:space-y-5 border transition-all relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#1b1030] via-[#110b20] to-[#07050e] border-purple-800/40 text-white' 
              : 'bg-gradient-to-b from-purple-600 via-fuchsia-600 to-pink-700 text-white border-purple-700 shadow-2xl shadow-purple-600/20'
          }`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              <span>🚀</span> La clienta que todavía puede volver
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight max-w-lg mx-auto leading-tight">
              Vuelve al número que anotaste en el Capítulo 1. Esas clientas que llevan más de 60 días sin aparecer.
            </h2>

            <p className="text-xs sm:text-sm text-purple-100 max-w-md mx-auto leading-relaxed">
              Ninguna de ellas te odia. Ninguna decidió activamente reemplazarte. La mayoría, en el fondo, solo está esperando una señal de tu parte para volver a acordarse de ti.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href="/login?tab=register"
                className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-white hover:bg-purple-50 text-purple-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Zap size={16} className="fill-purple-950" />
                <span>Activar fidelización en Nilah gratis</span>
              </a>

              <Link
                to="/ebooks/playbook-whatsapp"
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <BookOpen size={14} />
                <span>Ver Playbook de Copys</span>
              </Link>
            </div>

            <p className="text-[10px] sm:text-[11px] text-purple-200/80 pt-1">
              Sin tarjeta de crédito · Sistema de puntos automático · Hasta 100 clientas gratis
            </p>
          </section>

          {/* ── FOOTER DE ARTÍCULO ── */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Nilah IA & Martín Pestana · Todos los derechos reservados.</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-purple-600 font-bold cursor-pointer"
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
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs py-2.5 px-4 rounded-full shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
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
                isDark ? 'bg-[#100d20] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 font-bold text-xs">
                    📖
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400">Tabla de Contenido</h3>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Cómo hacer que regresen</p>
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
                          ? 'bg-purple-600 text-white font-black shadow-xs'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-slate-700 hover:bg-purple-50'
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
                  className="flex-1 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-200 dark:border-purple-800/60"
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

export default EbookClientasRegresen;
