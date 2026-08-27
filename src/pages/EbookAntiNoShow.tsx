import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Check, Copy, Moon, Sun, Loader2, Sparkles, 
  BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText, 
  ChevronRight, Share2, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Users, Smartphone, Zap, Sparkle, Lightbulb, DollarSign,
  List, X, ShieldAlert, Calendar, Bell, Scissors, Eye, ThumbsUp
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const EbookAntiNoShow: React.FC = () => {
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
    document.title = 'Guía Anti No-Show | Reduce inasistencias y citas olvidadas — Martín Pestana';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setReadProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }

      const chapters = [
        'intro', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cierre'
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
          <title>Guía Anti No-Show - Martín Pestana</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
            h1 { color: #059669; font-size: 26pt; line-height: 1.2; margin-bottom: 6px; }
            h2 { color: #047857; font-size: 17pt; margin-top: 24pt; border-bottom: 2px solid #a7f3d0; padding-bottom: 4pt; page-break-before: always; }
            h3 { color: #065f46; font-size: 13pt; margin-top: 14pt; }
            p { font-size: 11pt; margin-bottom: 10pt; text-align: justify; }
            blockquote { background: #ecfdf5; border-left: 4px solid #059669; padding: 12px; margin: 16px 0; font-style: italic; color: #064e3b; }
            .badge { background: #d1fae5; color: #047857; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 14px 0; }
            .script-box { background: #f0fdf4; border: 1px solid #86efac; border-left: 4px solid #16a34a; padding: 12px; margin: 12px 0; font-family: 'Segoe UI', sans-serif; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="badge">GUÍA PRÁCTICA OFICIAL · EDICIÓN 2026</p>
            <h1>Guía Anti No-Show</h1>
            <p style="font-size: 14pt; color: #64748b; font-weight: bold;">Reduce inasistencias y citas olvidadas</p>
            <p style="font-size: 10.5pt; color: #475569;">Por <strong>Martín Pestana</strong> — Ex-Administrador de Salón & Creador de Nilah IA</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>

          <h2>Introducción — La silla vacía cuesta más de lo que parece</h2>
          <p>Hay un tipo de pérdida que no aparece en ninguna hoja de cálculo, pero que cualquier lashista o manicurista reconoce de inmediato: la silla vacía a la hora exacta en la que debería estar sentada una clienta. No es solo el dinero de ese servicio. Es el tiempo que ya reservaste, los productos que dejaste listos, y el ánimo del día completo, que empieza torcido desde la primera hora.</p>
          <p>Lo primero que hay que soltar es la idea de que una clienta que no llega lo hizo con mala intención. Casi nunca es así. Entre el trabajo, los hijos, el tráfico y la vida diaria, agendar una cita con tres semanas de anticipación es fácil de olvidar — no porque no le importe, sino porque nadie se lo volvió a recordar a tiempo.</p>
          <p>Esta guía te da el protocolo exacto para que eso deje de pasarte, y las plantillas de mensaje listas para copiar y usar hoy mismo.</p>

          <h2>Capítulo 1 — El protocolo de los dos toques</h2>
          <p>Un solo recordatorio no alcanza. La mayoría de los negocios manda un mensaje el mismo día de la cita, cuando ya es tarde para que la clienta reorganice su agenda si se había olvidado por completo. El protocolo que sí funciona tiene dos momentos distintos, con dos objetivos distintos:</p>
          <div class="box">
            <p><strong>Recordatorio de 24 horas antes — el de confirmación:</strong><br/>
            Su objetivo es simple: que la clienta confirme su asistencia con un solo toque, mientras todavía tiene tiempo de avisar si necesita reprogramar. Este mensaje no debe sonar a interrogatorio ni a desconfianza — debe sonar a cortesía.</p>
            <p><strong>Recordatorio de 3 horas antes — el de cortesía final:</strong><br/>
            Su objetivo ya no es confirmar, es asegurar que llegue en buenas condiciones: con la ubicación exacta a mano, y alguna recomendación previa según el servicio (uñas limpias, sin rímel, sin esmalte de otro color puesto).</p>
          </div>
          <blockquote>"Tener este flujo de dos toques automatizado reduce las inasistencias en al menos un 25%. (Fuente: SalonWOP, Estrategias de Retención 2025) Y como efecto secundario, profesionaliza tu imagen: la clienta siente que está tratando con un negocio organizado, no con alguien que improvisa cita por cita."</blockquote>

          <h2>Capítulo 2 — Plantillas listas para copiar: recordatorio de 24 horas</h2>
          <p>El tono correcto acá es cálido, no burocrático. Evita sonar a mensaje de sistema — debe sentirse como si tú misma lo escribiste, aunque salga automático.</p>

          <div class="script-box">
            <p><strong>Plantilla estándar:</strong></p>
            <p>¡Hola, [nombre]! 😊 Te escribo para confirmar tu cita de mañana [día] a las [hora] para [servicio].<br/>
            Si por algo no puedes venir, avísame con tiempo así lo reprogramamos sin problema. 💅<br/>
            ¿Confirmamos?</p>
          </div>

          <div class="script-box">
            <p><strong>Plantilla con toque de urgencia física (para servicios de mantenimiento):</strong></p>
            <p>[Nombre], mañana ya te toca tu cita de [servicio] a las [hora] — justo cuando el efecto empieza a bajar. 👀<br/>
            Te dejo tu espacio reservado como siempre.<br/>
            ¿Nos vemos mañana?</p>
          </div>

          <div class="script-box">
            <p><strong>Plantilla para clienta nueva (primera cita):</strong></p>
            <p>¡Hola [nombre]! Qué lindo que vengas mañana a tu primera cita de [servicio] a las [hora]. 🥹<br/>
            Te dejo la dirección exacta por si la necesitas: [ubicación].<br/>
            ¿Todo confirmado de tu lado?</p>
          </div>
          <p>Nota que ninguna de las tres plantillas suena a "sistema automático de confirmación". Todas hablan en primera persona, como si tú misma la hubieras escrito esa mañana — eso es justamente lo que evita que se sienta fría o corporativa.</p>

          <h2>Capítulo 3 — Plantillas listas para copiar: recordatorio de 3 horas</h2>
          <p>Este mensaje es más corto, más práctico, y no necesita pregunta de confirmación — ya se confirmó 21 horas antes. Su función es logística y de cortesía.</p>

          <div class="script-box">
            <p><strong>Plantilla estándar:</strong></p>
            <p>[Nombre], nos vemos en un rato para tu cita de las [hora]. 📍 Te dejo la ubicación: [dirección/link de mapa].<br/>
            Cualquier imprevisto de último momento, avísame por acá. 💕</p>
          </div>

          <div class="script-box">
            <p><strong>Plantilla con recomendación previa (uñas):</strong></p>
            <p>[Nombre], ya casi es tu hora — te espero a las [hora]. 💅<br/>
            Si puedes, ven con las uñas limpias, sin esmalte de otro color, así aprovechamos mejor el tiempo. 😉<br/>
            ¡Nos vemos pronto!</p>
          </div>

          <div class="script-box">
            <p><strong>Plantilla con recomendación previa (pestañas):</strong></p>
            <p>[Nombre], falta poco para tu cita de las [hora]. 👀<br/>
            Recuerda venir sin rímel ni maquillaje en el ojo, para que el resultado quede perfecto desde el primer minuto. 🙈<br/>
            ¡Te espero!</p>
          </div>

          <h2>Capítulo 4 — Si igual no llega: cómo retomar sin incomodidad</h2>
          <p>Incluso con el protocolo de dos toques, alguna clienta va a fallar de vez en cuando — es parte normal de tener un negocio con personas reales. Lo importante es cómo retomas el contacto después, sin sonar a reclamo ni generar vergüenza que la aleje para siempre.</p>

          <div class="script-box">
            <p><strong>Plantilla de seguimiento post no-show:</strong></p>
            <p>¡Hola [nombre]! Vi que no pudiste llegar ayer a tu cita — espero que esté todo bien de tu lado. 🙏<br/>
            Sin ningún problema, te dejo un par de horarios para esta semana si quieres reprogramar: [opciones].<br/>
            ¿Cuál te queda mejor?</p>
          </div>
          <p>Este mensaje evita cualquier tono de reproche ("no llegaste", "perdiste tu cita") y en cambio asume buena fe — la mayoría de las veces, eso es exactamente lo que pasó. Un tono defensivo o de queja en este mensaje es la forma más rápida de convertir un simple olvido en una clienta perdida para siempre.</p>

          <h2>Capítulo 5 — Bonus: una política de cancelación clara, sin sonar estricta</h2>
          <p>El recordatorio automático ayuda muchísimo, pero no reemplaza tener una política simple y clara si las inasistencias se repiten con la misma persona. No hace falta que suene a contrato legal — con una línea basta, comunicada una sola vez, por ejemplo al agendar la primera cita:</p>
          <div class="script-box">
            <p><em>"Si necesitas cancelar o mover tu cita, te pido avisarme con al menos [X horas] de anticipación para poder ofrecerle ese espacio a otra clienta. ¡Gracias por entenderlo! 💕"</em></p>
          </div>
          <p>Esto no es sobre castigar — es sobre dejar una expectativa clara desde el principio, para que el recordatorio automático tenga, además, un contexto que todas tus clientas ya conocen.</p>

          <h2>Cierre — El protocolo que trabaja mientras tú atiendes</h2>
          <p>La ventaja real de automatizar estos dos recordatorios no es solo el 25% menos de inasistencias. Es que dejas de tener que acordarte tú misma de escribirle a cada clienta un día antes, en medio de un día ya lleno de citas. El mensaje sale solo, con el tono correcto, a la hora correcta — y tú simplemente encuentras la agenda más llena de lo que estaba antes.</p>
          <p><strong>Activa los recordatorios automáticos de 24h y 3h en Nilah, gratis.</strong></p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Guia_Anti_No_Show_Martin_Pestana.doc';
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
    { id: 'intro', num: '00', title: 'Introducción: La silla vacía cuesta' },
    { id: 'cap1', num: '01', title: 'El protocolo de los dos toques' },
    { id: 'cap2', num: '02', title: 'Plantillas 24 horas antes' },
    { id: 'cap3', num: '03', title: 'Plantillas 3 horas antes' },
    { id: 'cap4', num: '04', title: 'Si igual no llega: Post No-Show' },
    { id: 'cap5', num: '05', title: 'Política de cancelación clara' },
    { id: 'cierre', num: '🚀', title: 'Cierre: El protocolo en piloto automático' },
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 pb-20 ${
      isDark 
        ? 'bg-[#06100c] text-slate-100 selection:bg-emerald-500 selection:text-white' 
        : 'bg-slate-100/90 text-slate-900 selection:bg-emerald-200 selection:text-emerald-900'
    } print:bg-white print:text-black print:pb-0`}>

      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 z-50 transition-all duration-150 print:hidden"
        style={{ width: `${readProgress}%` }}
      />

      {/* ── HEADER SUPERIOR MOBILE-FIRST COMPACTO ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2.5 sm:py-3 flex items-center justify-between transition-colors print:hidden ${
        isDark ? 'bg-[#0a1612]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 shadow-2xs text-slate-900'
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 truncate">Guía Práctica</p>
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">Anti No-Show</h2>
          </div>
        </div>

        {/* ACCIONES TOP */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* BOTÓN ÍNDICE MÓVIL */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 active:scale-95 transition-transform"
          >
            <List className="w-3.5 h-3.5" />
            <span className="text-[11px]">Índice</span>
          </button>

          {/* MODO OSCURO / CLARO */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-emerald-700 hover:bg-slate-200'
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
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
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
              ? 'bg-[#0b1c16]/90 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-200/50'
          }`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 font-black text-xs">
                🛡️
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tabla de Contenido</h4>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Protocolo de 2 Toques</p>
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
                        ? 'bg-emerald-600 text-white font-black shadow-xs'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
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
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
              ? 'bg-gradient-to-br from-[#0c261e] via-[#091a14] to-[#040e0b] border-emerald-900/40 text-white' 
              : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800 text-white border-emerald-700 shadow-xl shadow-emerald-600/15'
          } print:bg-none print:border-none print:p-0 print:text-black`}>
            
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Protocolo Oficial · Edición 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
                Guía Anti No-Show
              </h1>

              <p className="text-xs sm:text-base text-emerald-100 font-medium leading-relaxed">
                Reduce inasistencias y citas olvidadas
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
                    <p className="text-[10px] sm:text-[11px] text-emerald-200">Ex-Administrador de salón & Creador de Nilah</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-emerald-100 font-medium bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Clock className="w-3 h-3" />
                  <span>Lectura: ~6 min</span>
                </div>
              </div>

              {/* BOTONES FIRST-MOBILE */}
              <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 print:hidden">
                <button
                  onClick={() => scrollToSection('intro')}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer col-span-2 sm:col-auto"
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
            isDark ? 'bg-[#091712] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>00</span>
              <span>•</span>
              <span>Introducción</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              La silla vacía cuesta más de lo que parece
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hay un tipo de pérdida que no aparece en ninguna hoja de cálculo, pero que cualquier lashista o manicurista reconoce de inmediato: la silla vacía a la hora exacta en la que debería estar sentada una clienta. No es solo el dinero de ese servicio. Es el tiempo que ya reservaste, los productos que dejaste listos, y el ánimo del día completo, que empieza torcido desde la primera hora.
              </p>

              <p>
                Lo primero que hay que soltar es la idea de que una clienta que no llega lo hizo con mala intención. Casi nunca es así. Entre el trabajo, los hijos, el tráfico y la vida diaria, agendar una cita con tres semanas de anticipación es fácil de olvidar — no porque no le importe, sino porque nadie se lo volvió a recordar a tiempo.
              </p>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-medium text-xs sm:text-sm leading-relaxed">
                Esta guía te da el protocolo exacto para que eso deje de pasarte, y las plantillas de mensaje listas para copiar y usar hoy mismo.
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 1
          ══════════════════════════════════════════ */}
          <article id="cap1" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#091712] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 01</span>
              <span>•</span>
              <span>Estrategia de 2 Pasos</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El protocolo de los dos toques
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Un solo recordatorio no alcanza. La mayoría de los negocios manda un mensaje el mismo día de la cita, cuando ya es tarde para que la clienta reorganice su agenda si se había olvidado por completo. El protocolo que sí funciona tiene dos momentos distintos, con dos objetivos distintos:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-black text-xs text-emerald-700 dark:text-emerald-400">
                    <span>RECORDATORIO 24H ANTES</span>
                    <span>⏰</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">El de confirmación</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Su objetivo es simple: que la clienta confirme su asistencia con un solo toque, mientras todavía tiene tiempo de avisar si necesita reprogramar. Debe sonar a cortesía, nunca a interrogatorio.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between font-black text-xs text-teal-700 dark:text-teal-400">
                    <span>RECORDATORIO 3H ANTES</span>
                    <span>📍</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">El de cortesía final</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Su objetivo ya no es confirmar, es asegurar que llegue en buenas condiciones: con la ubicación exacta a mano y recomendaciones previas según el servicio.
                  </p>
                </div>
              </div>

              <blockquote className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-medium italic text-xs sm:text-sm">
                Tener este flujo de dos toques automatizado <strong>reduce las inasistencias en al menos un 25%</strong>. (Fuente: SalonWOP, Estrategias de Retención 2025) Y como efecto secundario, profesionaliza tu imagen: la clienta siente que está tratando con un negocio organizado, no con alguien que improvisa cita por cita.
              </blockquote>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 2
          ══════════════════════════════════════════ */}
          <article id="cap2" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#091712] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 02</span>
              <span>•</span>
              <span>24 Horas Antes</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Plantillas listas para copiar: recordatorio de 24 horas
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                El tono correcto acá es cálido, no burocrático. Evita sonar a mensaje de sistema — debe sentirse como si tú misma lo escribiste, aunque salga automático.
              </p>

              {/* PLANTILLAS 24H */}
              <div className="space-y-3 pt-1">
                {/* 1. Estándar */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-emerald-300 block">Plantilla estándar</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                    <p>¡Hola, [nombre]! 😊 Te escribo para confirmar tu cita de mañana [día] a las [hora] para [servicio].</p>
                    <p className="mt-1.5">Si por algo no puedes venir, avísame con tiempo así lo reprogramamos sin problema. 💅</p>
                    <p className="mt-1.5">¿Confirmamos?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("¡Hola, [nombre]! 😊 Te escribo para confirmar tu cita de mañana [día] a las [hora] para [servicio].\n\nSi por algo no puedes venir, avísame con tiempo así lo reprogramamos sin problema. 💅\n\n¿Confirmamos?", "24h-std")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "24h-std" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "24h-std" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 2. Urgencia física */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-emerald-300 block">Plantilla con toque de urgencia física (para servicios de mantenimiento)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                    <p>[Nombre], mañana ya te toca tu cita de [servicio] a las [hora] — justo cuando el efecto empieza a bajar. 👀</p>
                    <p className="mt-1.5">Te dejo tu espacio reservado como siempre.</p>
                    <p className="mt-1.5">¿Nos vemos mañana?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("[Nombre], mañana ya te toca tu cita de [servicio] a las [hora] — justo cuando el efecto empieza a bajar. 👀\n\nTe dejo tu espacio reservado como siempre.\n\n¿Nos vemos mañana?", "24h-urg")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "24h-urg" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "24h-urg" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 3. Clienta nueva */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-emerald-300 block">Plantilla para clienta nueva (primera cita)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                    <p>¡Hola [nombre]! Qué lindo que vengas mañana a tu primera cita de [servicio] a las [hora]. 🥹</p>
                    <p className="mt-1.5">Te dejo la dirección exacta por si la necesitas: [ubicación].</p>
                    <p className="mt-1.5">¿Todo confirmado de tu lado?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("¡Hola [nombre]! Qué lindo que vengas mañana a tu primera cita de [servicio] a las [hora]. 🥹\n\nTe dejo la dirección exacta por si la necesitas: [ubicación].\n\n¿Todo confirmado de tu lado?", "24h-new")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "24h-new" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "24h-new" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm">
                Nota que ninguna de las tres plantillas suena a "sistema automático de confirmación". Todas hablan en primera persona, como si tú misma la hubieras escrito esa mañana — eso es justamente lo que evita que se sienta fría o corporativa.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 3
          ══════════════════════════════════════════ */}
          <article id="cap3" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#091712] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 03</span>
              <span>•</span>
              <span>3 Horas Antes</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Plantillas listas para copiar: recordatorio de 3 horas
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Este mensaje es más corto, más práctico, y no necesita pregunta de confirmación — ya se confirmó 21 horas antes. Su función es logística y de cortesía.
              </p>

              {/* PLANTILLAS 3H */}
              <div className="space-y-3 pt-1">
                {/* 1. Estándar 3h */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-emerald-300 block">Plantilla estándar</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                    <p>[Nombre], nos vemos en un rato para tu cita de las [hora]. 📍 Te dejo la ubicación: [dirección/link de mapa].</p>
                    <p className="mt-1.5">Cualquier imprevisto de último momento, avísame por acá. 💕</p>
                  </div>
                  <button
                    onClick={() => handleCopy("[Nombre], nos vemos en un rato para tu cita de las [hora]. 📍 Te dejo la ubicación: [dirección/link de mapa].\n\nCualquier imprevisto de último momento, avísame por acá. 💕", "3h-std")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "3h-std" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "3h-std" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 2. Uñas 3h */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-emerald-300 block">Plantilla con recomendación previa (uñas)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                    <p>[Nombre], ya casi es tu hora — te espero a las [hora]. 💅</p>
                    <p className="mt-1.5">Si puedes, ven con las uñas limpias, sin esmalte de otro color, así aprovechamos mejor el tiempo. 😉</p>
                    <p className="mt-1.5">¡Nos vemos pronto!</p>
                  </div>
                  <button
                    onClick={() => handleCopy("[Nombre], ya casi es tu hora — te espero a las [hora]. 💅\n\nSi puedes, ven con las uñas limpias, sin esmalte de otro color, así aprovechamos mejor el tiempo. 😉\n\n¡Nos vemos pronto!", "3h-unas")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "3h-unas" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "3h-unas" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 3. Pestañas 3h */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-emerald-300 block">Plantilla con recomendación previa (pestañas)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                    <p>[Nombre], falta poco para tu cita de las [hora]. 👀</p>
                    <p className="mt-1.5">Recuerda venir sin rímel ni maquillaje en el ojo, para que el resultado quede perfecto desde el primer minuto. 🙈</p>
                    <p className="mt-1.5">¡Te espero!</p>
                  </div>
                  <button
                    onClick={() => handleCopy("[Nombre], falta poco para tu cita de las [hora]. 👀\n\nRecuerda venir sin rímel ni maquillaje en el ojo, para que el resultado quede perfecto desde el primer minuto. 🙈\n\n¡Te espero!", "3h-pest")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "3h-pest" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "3h-pest" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 4
          ══════════════════════════════════════════ */}
          <article id="cap4" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#091712] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 04</span>
              <span>•</span>
              <span>Recuperación</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Si igual no llega: cómo retomar sin incomodidad
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Incluso con el protocolo de dos toques, alguna clienta va a fallar de vez en cuando — es parte normal de tener un negocio con personas reales. Lo importante es cómo retomas el contacto después, sin sonar a reclamo ni generar vergüenza que la aleje para siempre.
              </p>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <span className="text-xs font-bold text-emerald-300 block">Plantilla de seguimiento post no-show</span>
                <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                  <p>¡Hola [nombre]! Vi que no pudiste llegar ayer a tu cita — espero que esté todo bien de tu lado. 🙏</p>
                  <p className="mt-1.5">Sin ningún problema, te dejo un par de horarios para esta semana si quieres reprogramar: [opciones].</p>
                  <p className="mt-1.5">¿Cuál te queda mejor?</p>
                </div>
                <button
                  onClick={() => handleCopy("¡Hola [nombre]! Vi que no pudiste llegar ayer a tu cita — espero que esté todo bien de tu lado. 🙏\n\nSin ningún problema, te dejo un par de horarios para esta semana si quieres reprogramar: [opciones].\n\n¿Cuál te queda mejor?", "post-noshow")}
                  className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  {copiedId === "post-noshow" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === "post-noshow" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm">
                Este mensaje evita cualquier tono de reproche (<em>"no llegaste"</em>, <em>"perdiste tu cita"</em>) y en cambio asume buena fe — la mayoría de las veces, eso es exactamente lo que pasó. Un tono defensivo o de queja en este mensaje es la forma más rápida de convertir un simple olvido en una clienta perdida para siempre.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 5
          ══════════════════════════════════════════ */}
          <article id="cap5" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#091712] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Capítulo 05 · Política Amable</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Bonus: una política de cancelación clara, sin sonar estricta
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                El recordatorio automático ayuda muchísimo, pero no reemplaza tener una política simple y clara si las inasistencias se repiten con la misma persona. No hace falta que suene a contrato legal — con una línea basta, comunicada una sola vez, por ejemplo al agendar la primera cita:
              </p>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                <span className="text-xs font-bold text-emerald-300 block">Texto para comunicar política de cancelación:</span>
                <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed select-all font-sans">
                  <p>"Si necesitas cancelar o mover tu cita, te pido avisarme con al menos [X horas] de anticipación para poder ofrecerle ese espacio a otra clienta. ¡Gracias por entenderlo! 💕"</p>
                </div>
                <button
                  onClick={() => handleCopy('"Si necesitas cancelar o mover tu cita, te pido avisarme con al menos [X horas] de anticipación para poder ofrecerle ese espacio a otra clienta. ¡Gracias por entenderlo! 💕"', "policy-cancel")}
                  className="w-full sm:w-auto py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  {copiedId === "policy-cancel" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === "policy-cancel" ? '¡Copiado!' : 'Copiar plantilla'}</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm">
                Esto no es sobre castigar — es sobre dejar una expectativa clara desde el principio, para que el recordatorio automático tenga, además, un contexto que todas tus clientas ya conocen.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CIERRE & CTA PRINCIPAL
          ══════════════════════════════════════════ */}
          <section id="cierre" className={`p-6 sm:p-10 rounded-[2rem] text-center space-y-4 sm:space-y-5 border transition-all relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#0c241c] via-[#081813] to-[#040c09] border-emerald-800/40 text-white' 
              : 'bg-gradient-to-b from-emerald-600 via-teal-600 to-cyan-800 text-white border-emerald-700 shadow-2xl shadow-emerald-600/20'
          }`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              <span>🚀</span> En piloto automático
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight max-w-lg mx-auto leading-tight">
              El protocolo que trabaja mientras tú atiendes
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto leading-relaxed">
              La ventaja real de automatizar estos dos recordatorios no es solo el 25% menos de inasistencias. Es que dejas de tener que acordarte tú misma de escribirle a cada clienta un día antes.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href="/login?tab=register"
                className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Zap size={16} className="fill-emerald-950" />
                <span>Activar recordatorios en Nilah</span>
              </a>

              <Link
                to="/ebooks/como-hacer-que-tus-clientas-regresen"
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <BookOpen size={14} />
                <span>Ebook: Cómo hacer que regresen</span>
              </Link>
            </div>

            <p className="text-[10px] sm:text-[11px] text-emerald-200/80 pt-1">
              Sin tarjeta de crédito · Recordatorios de 24h y 3h automáticos · Hasta 100 clientas gratis
            </p>
          </section>

          {/* ── FOOTER DE ARTÍCULO ── */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Nilah IA & Martín Pestana · Todos los derechos reservados.</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-emerald-600 font-bold cursor-pointer"
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
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs py-2.5 px-4 rounded-full shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
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
                isDark ? 'bg-[#091712] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                    🛡️
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400">Tabla de Contenido</h3>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Guía Anti No-Show</p>
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
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-slate-700 hover:bg-emerald-50'
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800/60"
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

export default EbookAntiNoShow;
