import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Check, Copy, CheckCircle2, Moon, Sun, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaybookLanding: React.FC = () => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [isDark, setIsDark] = useState<boolean>(false); // Modo Light por defecto
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Playbook de Mensajes Activadores por WhatsApp (Anti-Spam)';
    window.scrollTo(0, 0);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 100);
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white' : 'bg-slate-100 text-slate-800 selection:bg-purple-200 selection:text-purple-900'
    } print:bg-white print:text-slate-900`}>
      
      {/* BARRA SUPERIOR MÓVIL (NO SE IMPRIME) */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between transition-colors print:hidden ${
        isDark ? 'bg-slate-950/80 border-slate-800/80 text-white' : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
      }`}>
        <button
          onClick={() => navigate('/soluciones')}
          className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer px-3 py-1.5 rounded-full border ${
            isDark ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Volver a Soluciones</span>
          <span className="sm:hidden">Volver</span>
        </button>

        <div className="flex items-center gap-2">
          {/* BOTÓN MODO LIGHT / DARK OPCIONAL */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-purple-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* BOTÓN DESCARGAR DIRECTO PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-md shadow-purple-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL - 100% FIRST MOBILE (HASTA MAX 794px PARA PDF PERFECTO) */}
      <main ref={contentRef} className={`max-w-[794px] mx-auto border-x shadow-2xl transition-colors print:shadow-none print:border-none print:bg-white print:max-w-none print:p-0 ${
        isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200/90 shadow-slate-200/60'
      }`}>
        
        {/* ═══════════════════════════════ 1. PORTADA ═══════════════════════════════ */}
        <section className={`relative overflow-hidden p-6 sm:p-10 border-b print:bg-gradient-to-br print:from-purple-900 print:to-indigo-950 print:text-white print:p-8 ${
          isDark 
            ? 'bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-950 border-purple-950/50' 
            : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white border-purple-800'
        }`}>
          {/* Luces decorativas fondo */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-[11px] font-semibold text-purple-100 mb-6">
              <span>📲</span> Recurso Gratuito · Edición 2026
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-2">
              Guía Práctica de WhatsApp Marketing
            </p>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1] mb-4">
              El Playbook de <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-indigo-200">
                Mensajes Activadores
              </span> <br />
              por WhatsApp
            </h1>

            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed mb-6 font-normal max-w-xl">
              Deja de enviar mensajes que se ignoran. Aprende la estructura de los mensajes que paran el scroll, generan respuesta y llenan tu agenda — sin sonar a spam.
            </p>

            {/* Rubros pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-purple-100 font-medium">✂️ Copys listos para usar</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-purple-100 font-medium">💆 Salones de belleza</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-purple-100 font-medium">🍽️ Restaurantes</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-purple-100 font-medium">🩺 Clínicas</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-purple-100 font-medium">🐾 Veterinarias</span>
            </div>

            {/* ESTADÍSTICAS PORTADA */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-center">
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-pink-300">40+</span>
                <span className="text-[11px] text-purple-100 font-semibold">Mensajes listos</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-purple-200">8</span>
                <span className="text-[11px] text-purple-100 font-semibold">Categorías</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-emerald-300">3x</span>
                <span className="text-[11px] text-purple-100 font-semibold">Más respuestas</span>
              </div>
            </div>
            
            <p className="text-[11px] text-center sm:text-right text-purple-200 font-medium mt-3 tracking-wide">
              Anti-Spam · Anti-Aburrido · Anti-Ignorado
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════ 2. EL PROBLEMA ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">El problema real</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Por qué tus mensajes <br />
              <span className="italic text-purple-600 dark:text-purple-400">no generan respuesta</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              No es que tus clientes no quieran volver. Es que tu mensaje suena igual al de todos — y el cerebro humano lo filtra en 0.3 segundos.
            </p>
          </div>

          {/* COMPARATIVA LADO A LADO EN MÓVIL / GRID EN TABLET */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Mensaje Aburrido */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50/60 border-rose-200'}`}>
              <div className="flex items-center gap-2 mb-3 text-rose-600 dark:text-rose-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Mensaje Aburrido (Spam mental)</span>
              </div>
              {/* WhatsApp Bubble Fake */}
              <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs leading-relaxed text-slate-900 dark:text-slate-200 shadow-inner">
                <p className="mb-2">
                  Hola! Te recordamos que hace tiempo que no nos visitas. Tenemos promociones especiales esta semana. ¡No te lo pierdas! Agenda ya tu cita llamando al 987654321.
                </p>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 text-right">10:42 ✓✓</div>
              </div>
              <span className="mt-3 inline-block px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-bold border border-rose-300 dark:border-rose-500/20">
                ❌ Ignorado al instante
              </span>
            </div>

            {/* Mensaje Activador */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-emerald-50/60 border-emerald-200'}`}>
              <div className="flex items-center gap-2 mb-3 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Activador (Para el scroll)</span>
              </div>
              {/* WhatsApp Bubble Fake */}
              <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs leading-relaxed text-slate-900 dark:text-slate-200 shadow-inner">
                <p className="mb-2">Las paredes de acá llevan semanas preguntando por ti. Francamente, yo también. 👀</p>
                <p className="mb-2">{"{nombre}"}, <strong className="text-emerald-950 dark:text-white font-bold">guardé un turno con tu nombre</strong> porque sé que cuando vienes, sales sintiéndote otra. 💅</p>
                <p>¿Coordinamos esta semana? 😌</p>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 text-right">10:42 ✓✓</div>
              </div>
              <span className="mt-3 inline-block px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-[11px] font-bold border border-emerald-300 dark:border-emerald-500/20">
                ✅ Para el scroll. Genera respuesta.
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-purple-900/20 border-purple-800/40' : 'bg-purple-50 border-purple-200'
          }`}>
            <span className="text-2xl shrink-0">🧠</span>
            <div className="text-xs leading-relaxed">
              <h4 className={`font-bold mb-1 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>La diferencia no es la oferta. Es la emoción.</h4>
              <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                El mensaje aburrido <em>informa</em>. El activador <em>provoca</em>. Uno habla del negocio, el otro habla de ella. Uno pide, el otro da primero. Tu cliente toma la decisión de leer en menos de un segundo — ese primer segundo lo gana el activador siempre.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ 3. ANATOMÍA ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">La estructura maestra</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Anatomía de un <span className="italic text-purple-600 dark:text-purple-400">Activador</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Todo mensaje activador tiene exactamente 3 párrafos. Cada uno tiene un trabajo único. Si uno falla, el mensaje muere.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {/* P1 */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark ? 'bg-gradient-to-b from-purple-900/30 to-purple-950/40 border-purple-800/40' : 'bg-purple-50/80 border-purple-200'
            }`}>
              <span className="absolute -top-2 -right-1 text-5xl font-black text-purple-500/10">P1</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 block mb-1">Párrafo 1</span>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>El Gancho</h3>
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Para el scroll en menos de 2 segundos. Una suposición atrevida, un regaño coqueto o una observación que la deja pensando. Sin saludo. Sin nombre. Sin oferta.
              </p>
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                isDark ? 'bg-purple-950/80 border-purple-800/60 text-purple-300' : 'bg-purple-100 border-purple-300 text-purple-900'
              }`}>
                🚫 Nunca empieces con "Hola"
              </div>
            </div>

            {/* P2 */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark ? 'bg-gradient-to-b from-pink-900/30 to-pink-950/40 border-pink-800/40' : 'bg-pink-50/80 border-pink-200'
            }`}>
              <span className="absolute -top-2 -right-1 text-5xl font-black text-pink-500/10">P2</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 dark:text-pink-400 block mb-1">Párrafo 2</span>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>La Confidencia</h3>
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Aquí va el beneficio, revelado como un privilegio personal — nunca como una promoción. Empieza SIEMPRE con {"{nombre}"}. Máximo 2 oraciones en primera persona singular.
              </p>
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                isDark ? 'bg-pink-950/80 border-pink-800/60 text-pink-300' : 'bg-pink-100 border-pink-300 text-pink-900'
              }`}>
                ✅ {"{nombre}"} siempre al inicio
              </div>
            </div>

            {/* P3 */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark ? 'bg-gradient-to-b from-emerald-900/30 to-emerald-950/40 border-emerald-800/40' : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <span className="absolute -top-2 -right-1 text-5xl font-black text-emerald-500/10">P3</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">Párrafo 3</span>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>El Cierre Suave</h3>
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Una sola pregunta de bajísima fricción. Invita, no presiona. Sin mencionar días específicos. Sin urgencia falsa. La clienta siente que puede decir que sí sin compromiso.
              </p>
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                isDark ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-900'
              }`}>
                🙅 Sin "¿te bloqueo el jueves?"
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
          }`}>
            <span className="text-2xl shrink-0">🎯</span>
            <div className="text-xs leading-relaxed">
              <h4 className={`font-bold mb-1 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>La regla de los emojis</h4>
              <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Entre 4 y 5 emojis por mensaje. Uno por uno — nunca dos juntos. Distribuidos a lo largo del texto, no agrupados al final. Al menos uno debe ser una carita expresiva (😏 👀 😌 😉 🥹). Si ves "¿Coordinamos? 😏🌿✨💅" al final — reescríbelo.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ 4. COPYS ORGANIZADOS EN 8 CATEGORÍAS ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Los mensajes listos</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              40+ Copys que puedes <span className="italic text-purple-600 dark:text-purple-400">copiar y adaptar</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Organizados por las 8 categorías clave. Toca cualquier plantilla para copiar el texto listo al portapapeles.
            </p>
          </div>

          {/* CAT 1: RETOQUES */}
          <CategorySection
            icon="✂️"
            title="1. Retoques y Mantenimientos"
            subtitle="Para clientas que ya vinieron y necesitan su próxima sesión"
            copys={[
              {
                id: 'ret-1',
                type: 'Salón de belleza',
                mech: 'Diagnóstico Cómplice',
                msg: `Hay algo que tu color nos está tratando de decir... y yo lo escucho claramente. 👀\n\n{nombre}, guardé un espacio de retoque con tu nombre antes de que el cabello tome decisiones por su cuenta. 😏\n\n¿Coordinamos esta semana? 💅`,
                tip: 'Funciona perfecto para color, balayage o mechas que ya llevan 6+ semanas.'
              },
              {
                id: 'ret-2',
                type: 'Clínica estética',
                mech: 'Tensión Positiva',
                msg: `Cuando los resultados de tu última sesión empiezan a pedir mantenimiento... solo las que saben lo notan a tiempo. 😌\n\n{nombre}, tengo un turno guardado para que no pierdas lo que logramos juntas. Prefiero decírtelo yo antes de que lo note el espejo. 🌿\n\n¿Pasamos? 😉`,
                tip: 'Ideal para tratamientos faciales, hifu, rellenos de mantenimiento.'
              },
              {
                id: 'ret-3',
                type: 'Uñas',
                mech: 'Humor Cómplice',
                msg: `Dime que tus uñas no están teniendo esa crisis de "ya me aguanté demasiado"... 😂\n\n{nombre}, aparté un huequito esta semana antes de que se lo lleve otra. Sé que no lo ves llegar hasta que ya no hay vuelta atrás. 💅\n\n¿Las rescatamos antes del fin de semana? 😏`,
                tip: 'Perfecto para semipermanente o acrílico que ya va por la semana 3-4.'
              },
              {
                id: 'ret-4',
                type: 'Pestañas / Cejas',
                mech: 'Efecto Espejo',
                msg: `Hay una versión tuya que camina diferente, habla diferente y se siente imparable. Esa versión tiene las cejas impecables. 👀\n\n{nombre}, moví un turno para que puedas venir esta semana sin apuros. 😌\n\n¿Lo tomamos? ✨`,
                tip: 'Activa la identidad, no la necesidad.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 2: RECORDATORIOS CITA */}
          <CategorySection
            icon="📅"
            title="2. Recordatorios de Cita Confirmada"
            subtitle="Para 24-48h antes de la cita agendada. Reduce las no-shows hasta un 60%."
            copys={[
              {
                id: 'rec-1',
                type: 'Recordatorio amable',
                mech: 'Reciprocidad',
                msg: `Ya dejé todo listo para mañana. Hasta el café mental te lo tengo guardado. ☕\n\n{nombre}, te confirmo tu cita de mañana — si necesitas mover algo, avísame hoy con tiempo así le doy el espacio a alguien más. 😌\n\n¡Te espero! 💅`,
                tip: 'El detalle de "le doy el espacio a alguien más" genera compromiso sin presionar.'
              },
              {
                id: 'rec-2',
                type: 'Recordatorio con prep',
                mech: 'Diagnóstico Cómplice',
                msg: `Para que mañana los resultados sean perfectos: llega con el cabello limpio y sin productos. Pequeños detalles, gran diferencia. 🌿\n\n{nombre}, tu cita de mañana está confirmada. Si hay algo que quieras ajustar del look, cuéntame ahora y lo tenemos listo. 😏\n\n¡Nos vemos! ✨`,
                tip: 'El consejo previo demuestra autoridad y reduce cancelaciones.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 3: GENERALES Y ESTACIONALES */}
          <CategorySection
            icon="💬"
            title="3. Recordatorios Generales y Estacionales"
            subtitle="Para activar la agenda en semanas flojas o con un contexto de temporada"
            copys={[
              {
                id: 'est-1',
                type: 'Semana floja',
                mech: 'FOMO Real',
                msg: `Esta semana tengo unos pocos turnos libres antes de que la agenda se cierre. No suelo tener esto disponible. 👀\n\n{nombre}, te cuento antes que a nadie porque sé que a veces los tiempos cuadran solos. 😌\n\n¿Esta semana te viene? 🌿`,
                tip: 'FOMO real, no falso. Lo dices como confidencia.'
              },
              {
                id: 'est-2',
                type: 'Temporada',
                mech: 'Efecto Espejo',
                msg: `El cambio de estación es la excusa favorita del cabello para hacer lo que le da la gana. Y honestamente, le da totalmente la razón. 😂\n\n{nombre}, guardé un espacio esta semana para que entremos a la nueva temporada con todo. 💅\n\n¿Coordinamos? 😏`,
                tip: 'Funciona para otoño/invierno (hidratación), primavera/verano (color).'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 4: PROMOCIONALES */}
          <CategorySection
            icon="🎁"
            title="4. Promocionales (Descuento, Combo, Regalo, Cumpleaños)"
            subtitle="El beneficio se revela como privilegio personal. Nunca como promoción anunciada."
            copys={[
              {
                id: 'pro-1',
                type: 'Descuento exclusivo',
                mech: 'Reciprocidad',
                msg: `Hay cosas que no se publican en el feed ni se mandan a todas. Esta es una de esas. 😏\n\n{nombre}, conseguí un 15% de descuento solo para ti en tu próxima visita — de las que más cuido, era lo mínimo que podía hacer. 💅\n\n¿Coordinamos esta semana? 😌`,
                tip: 'El "no se manda a todas" activa reciprocidad y FOMO real.'
              },
              {
                id: 'pro-2',
                type: 'Regalo cumpleaños',
                mech: 'Identidad + Reciprocidad',
                msg: `Solo las personas especiales merecen que el mes de su cumpleaños empiece bien. Desde el primero. 🎂\n\n{nombre}, guardé tu regalo de cumpleaños: 20% de descuento en todo este mes, solo para ti. Lo aparté el día 1. 😏\n\n¿Empezamos el mes como se merece? 🌿`,
                tip: 'Envíalo el primer día del mes de cumpleaños.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 5, 6, 7: RESCATES */}
          <div className={`my-6 p-4 rounded-2xl border ${
            isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
          }`}>
            <h3 className={`font-black text-sm mb-2 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>🎯 Niveles de Rescate por Días de Inactividad</h3>
            <div className="space-y-2 text-xs">
              <div className={`flex justify-between items-center p-2 rounded-lg ${isDark ? 'bg-slate-900/60' : 'bg-white border border-amber-200/60'}`}>
                <span className="text-amber-600 dark:text-amber-400 font-bold">30 Días (Enfriándose)</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tasa resp: 35-45% · Prioridad Media</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${isDark ? 'bg-slate-900/60' : 'bg-white border border-amber-200/60'}`}>
                <span className="text-orange-600 dark:text-orange-400 font-bold">60 Días (En riesgo)</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tasa resp: 20-30% · Prioridad Alta</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${isDark ? 'bg-slate-900/60' : 'bg-white border border-amber-200/60'}`}>
                <span className="text-rose-600 dark:text-rose-400 font-bold">90 Días (Perdida)</span>
                <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Tasa resp: 10-20% · Urgente</span>
              </div>
            </div>
          </div>

          <CategorySection
            icon="⏰"
            title="5. Rescate 30 Días"
            subtitle="Tono cómplice. Bajo esfuerzo. Alto resultado."
            copys={[
              {
                id: 'res-30-1',
                type: '30 días · Opción A',
                mech: 'Humor Cómplice',
                msg: `Las paredes de acá llevan semanas preguntando por ti. Francamente, yo también. 👀\n\n{nombre}, tengo tu espacio guardado y esperando — porque cada vez que vienes, sales siendo otra. 😌\n\n¿Esta semana te viene? 💅`,
                tip: 'Simple y directo. No menciona que "hace tiempo que no viene".'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          <CategorySection
            icon="⚠️"
            title="6. Rescate 60 Días"
            subtitle="Incluye un motivo concreto para volver. Sin él, el mensaje no compite."
            copys={[
              {
                id: 'res-60-1',
                type: '60 días · Opción A',
                mech: 'Reciprocidad',
                msg: `Hay algo que tenía guardado para ti y se me estaba acumulando el tiempo sin contártelo. 😏\n\n{nombre}, aparté un beneficio especial para tu vuelta: 20% menos en tu próxima visita. Sin vencimiento apretado, porque sé que los tiempos no siempre cuadran. 🌿\n\n¿Cuándo pasamos? 😌`,
                tip: '"Sin vencimiento apretado" elimina la presión.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          <CategorySection
            icon="🆘"
            title="7. Rescate 90 Días"
            subtitle="Máximo impacto, mínima fricción, beneficio irresistible."
            copys={[
              {
                id: 'res-90-1',
                type: '90 días · Opción A',
                mech: 'Pattern Interrupt',
                msg: `No te voy a preguntar dónde estuviste. Te voy a decir que te extrañamos y que tenemos algo para que vuelvas como reina. 🥹\n\n{nombre}, guardé un 30% de descuento para tu regreso — sin condiciones raras, sin letra chica. Solo para que la vuelta valga doble. 😌\n\n¿La hacemos esta semana? 💅`,
                tip: '"No te voy a preguntar dónde estuviste" rompe la expectativa.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 8: FIDELIZACIÓN PUNTOS */}
          <CategorySection
            icon="✨"
            title="8. Fidelización por Puntos"
            subtitle="La psicología de 'ya es tuyo' convierte más que cualquier descuento desde cero."
            copys={[
              {
                id: 'pts-1',
                type: 'Puntos acumulados',
                mech: 'FOMO Real',
                msg: `Hay algo tuyo que lleva semanas esperándote en mi sistema. No es poco. 👀\n\n{nombre}, acumulaste puntos suficientes para descontarlos en tu próxima visita — son tuyos, quiero que los uses tú antes de que se queden dormidos. 😌\n\n¿Cuándo venimos a usarlos? 💅`,
                tip: '"Son tuyos" activa el sentido de propiedad.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />
        </section>

        {/* ═══════════════════════════════ 5. REGLAS ANTI-SPAM ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Protege tu número</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Las Reglas Anti-Spam que <span className="italic text-purple-600 dark:text-purple-400">nadie te contó</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Un número bloqueado por WhatsApp es una agenda muerta. Estas son las reglas de oro para operar seguro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-purple-900/20 border-purple-800/40' : 'bg-purple-50 border-purple-200'}`}>
              <span className="text-2xl block mb-2">🕐</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Regla del Cooldown</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Mínimo 21 días entre mensajes al mismo contacto. Si mandas más seguido, tu número empieza a verse como spam.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-pink-900/20 border-pink-800/40' : 'bg-pink-50 border-pink-200'}`}>
              <span className="text-2xl block mb-2">🚪</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>El Comando BAJA</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Siempre incluye al final: <em>"Escribe BAJA si no quieres recibir más mensajes."</em> Las que no quieren se van solas y protegen tu número.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
              <span className="text-2xl block mb-2">📊</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Máximo 4 campañas/mes</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Una campaña por semana. Más de eso genera fatiga de audiencia; menos de eso pierde momentum.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className="text-2xl block mb-2">🎯</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Segmentar antes de enviar</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                El mensaje de rescate de 90 días no va a quien vino la semana pasada. Segmentar reduce bloqueos y multiplica ventas.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ 6. CHECKLIST DE 10 PUNTOS ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Antes de enviar</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Checklist del <span className="italic text-purple-600 dark:text-purple-400">Mensaje Perfecto</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Toca cada casilla para marcar los 10 puntos antes de lanzar tu campaña por WhatsApp.
            </p>
          </div>

          <div className="space-y-2">
            {[
              "P1 para el scroll — La primera línea no saluda, no informa y no menciona ninguna oferta.",
              "{nombre} al inicio de P2 — El nombre aparece una sola vez, al comienzo del segundo párrafo.",
              "Beneficio con número real — Si hay descuento, aparece el número exacto ('15%', 'S/30').",
              "Entre 4 y 5 emojis distribuidos — Uno por oración, nunca dos juntos, al menos una carita expresiva.",
              "P3 sin presión ni día específico — El cierre invita, no obliga. Sin '¿te bloqueo el jueves?'.",
              "Cero lenguaje comercial — Sin palabras como 'Aprovecha', 'Oferta', 'Promoción', 'Agenda ya'.",
              "Sin tiers del CRM — Evita 'Clienta Oro' / 'VIP Platino'. Usa emoción: 'de las que más cuido'.",
              "Cooldown respetado — Han pasado al menos 21 días desde el último mensaje a este contacto.",
              "BAJA incluido — Opción clara para salir de la lista disponible al final del texto.",
              "Test del scroll de las 11pm — Si ella lo lee a las 11pm, ¿para? ¿sonríe? ¿siente que le leyeron la mente?"
            ].map((text, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <button
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isChecked
                      ? isDark 
                        ? 'bg-purple-950/40 border-purple-700/60 text-purple-200' 
                        : 'bg-purple-50 border-purple-300 text-purple-900'
                      : isDark
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked 
                      ? 'bg-purple-600 border-purple-500 text-white' 
                      : isDark ? 'border-slate-600 bg-slate-950' : 'border-slate-300 bg-white'
                  }`}>
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs leading-relaxed font-medium">
                    <strong className={isDark ? 'text-white' : 'text-slate-900'}>Punto {idx + 1}:</strong> {text}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════ FOOTER & DESCARGA ═══════════════════════════════ */}
        <footer className={`p-6 sm:p-8 border-t text-center ${
          isDark ? 'bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 border-purple-900/40' : 'bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white border-purple-800'
        }`}>
          <p className="text-xs text-purple-200 font-medium mb-3">
            📲 Playbook de Mensajes Activadores por WhatsApp · Edición 2026
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 print:hidden">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando archivo PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar archivo PDF directo</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-purple-300/80">
            Recurso Gratuito · Creado por Martín Pestana · Todos los derechos reservados
          </p>
        </footer>

      </main>
    </div>
  );
};

// COMPONENTE AUXILIAR PARA RENDERIZAR CATEGORÍAS DE COPYS
interface CopyItem {
  id: string;
  type: string;
  mech: string;
  msg: string;
  tip: string;
}

const CategorySection: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  copys: CopyItem[];
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  isDark: boolean;
}> = ({ icon, title, subtitle, copys, copiedId, onCopy, isDark }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-2">
        <span className={`text-xl p-2 rounded-xl border shrink-0 ${
          isDark ? 'bg-purple-900/30 border-purple-700/40' : 'bg-purple-100 border-purple-200'
        }`}>{icon}</span>
        <div>
          <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
        {copys.map((c) => {
          const isCopied = copiedId === c.id;
          return (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 hover:border-purple-800/60' 
                  : 'bg-slate-50 border-slate-200/90 hover:border-purple-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isDark 
                      ? 'bg-purple-950/80 text-purple-300 border-purple-800/50' 
                      : 'bg-purple-100 text-purple-900 border-purple-200'
                  }`}>
                    {c.type}
                  </span>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.mech}</span>
                </div>

                <div className={`p-3 rounded-xl border text-xs leading-relaxed font-sans whitespace-pre-line border-l-4 border-l-purple-600 mb-3 ${
                  isDark ? 'bg-slate-950 border-slate-800/80 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
                }`}>
                  {c.msg}
                </div>

                <p className={`text-[11px] italic mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  💡 {c.tip}
                </p>
              </div>

              <button
                onClick={() => onCopy(c.msg, c.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-600 text-white'
                    : isDark
                      ? 'bg-slate-800 hover:bg-purple-900/60 text-slate-200 border border-slate-700/60'
                      : 'bg-white hover:bg-purple-50 text-purple-900 border border-slate-300 shadow-2xs'
                }`}
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-purple-600" />
                    <span>Copiar Copy de WhatsApp</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlaybookLanding;
