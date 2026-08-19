import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Check, Copy, CheckCircle2, Moon, Sun, Loader2, Utensils, Coffee, Flame, Wine, ShieldCheck, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PlaybookRestaurantesLanding: React.FC = () => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [isDark, setIsDark] = useState<boolean>(false); // Modo Light por defecto
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Playbook de WhatsApp Marketing para Restaurantes & Gastronomía (Anti-Spam)';
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
      isDark ? 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950' : 'bg-slate-100 text-slate-800 selection:bg-amber-200 selection:text-amber-900'
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
              isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-amber-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* BOTÓN DESCARGAR DIRECTO PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-md shadow-amber-600/25 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
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
        <section className={`relative overflow-hidden p-6 sm:p-10 border-b print:bg-gradient-to-br print:from-amber-900 print:to-orange-950 print:text-white print:p-8 ${
          isDark 
            ? 'bg-gradient-to-br from-slate-950 via-amber-950/80 to-slate-950 border-amber-950/50' 
            : 'bg-gradient-to-br from-amber-900 via-orange-900 to-amber-950 text-white border-amber-800'
        }`}>
          {/* Luces decorativas fondo */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-[11px] font-semibold text-amber-100 mb-6">
              <span>🍕</span> Recurso Gastronómico Especial · Edición 2026
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-amber-300 mb-2">
              WhatsApp Marketing para Restauración
            </p>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.1] mb-4">
              El Playbook de <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-200 to-amber-100">
                Activadores Gastronómicos
              </span> <br />
              por WhatsApp
            </h1>

            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed mb-6 font-normal max-w-xl">
              Llena tus mesas en días flojos (martes y miércoles) y reactiva clientes de delivery. La guía paso a paso con copys de antojo que despiertan el apetito y paran el scroll en 1 segundo.
            </p>

            {/* Rubros pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-amber-100 font-medium">🍕 Restaurantes & Pizzerías</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-amber-100 font-medium">🍔 Restobares & Hamburgueserías</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-amber-100 font-medium">☕ Cafeterías & Brunch</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-amber-100 font-medium">🍣 Sushi & Comida Asiática</span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-xs text-amber-100 font-medium">🛵 Delivery Directo</span>
            </div>

            {/* ESTADÍSTICAS PORTADA */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-center">
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-amber-300">35+</span>
                <span className="text-[11px] text-amber-100 font-semibold">Copys de antojo</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-orange-200">7</span>
                <span className="text-[11px] text-amber-100 font-semibold">Gatillos sensoriales</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-emerald-300">+45%</span>
                <span className="text-[11px] text-amber-100 font-semibold">Pedidos en días flojos</span>
              </div>
            </div>
            
            <p className="text-[11px] text-center sm:text-right text-amber-200 font-medium mt-3 tracking-wide">
              Anti-Descuento Masivo · Anti-Menu Aburrido · 100% Antojo
            </p>
          </div>
        </section>

        {/* ═══════════════════════════════ 2. EL PROBLEMA GASTRONÓMICO ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">El dilema del restaurante</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Por qué difundir el menú del día <br />
              <span className="italic text-amber-600 dark:text-amber-400">ya no te llena el local</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Enviar un PDF pesado de 10MB o una lista aburrida de platos a la 1:00 pm no despierta hambre. Tu cliente ya está decidiendo dónde comer a las 11:30 am — y el cerebro gastronómico elige por **estímulo visual y sensorial primario**.
            </p>
          </div>

          {/* COMPARATIVA LADO A LADO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Mensaje Aburrido Gastronómico */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-rose-950/20 border-rose-800/40' : 'bg-rose-50/60 border-rose-200'}`}>
              <div className="flex items-center gap-2 mb-3 text-rose-600 dark:text-rose-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Difusión Aburrida (Spam de carta)</span>
              </div>
              <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs leading-relaxed text-slate-900 dark:text-slate-200 shadow-inner">
                <p className="mb-2">
                  Hola estimad@ cliente, adjuntamos la carta del día con nuestras promociones de almuerzo y cena. Atendemos de 12pm a 10pm. Delivery llamando al 987654321.
                </p>
                <div className="text-[10px] text-slate-500 text-right">12:15 ✓✓</div>
              </div>
              <span className="mt-3 inline-block px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-bold border border-rose-300 dark:border-rose-500/20">
                ❌ Ignorado. Nadie abre el PDF.
              </span>
            </div>

            {/* Activador Gastronómico */}
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/60 border-amber-200'}`}>
              <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Activador Gastronómico (Antojo Puro)</span>
              </div>
              <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs leading-relaxed text-slate-900 dark:text-slate-200 shadow-inner">
                <p className="mb-2">El olor a queso derretido y salsa crujiente recién salida del horno está inundando la cocina... 👀</p>
                <p className="mb-2">{"{nombre}"}, <strong className="text-amber-950 dark:text-white font-bold">te aparté una mesa pegada a la ventana</strong> (o te lo mandamos en 20 min antes del pico de pedidos). 🍕</p>
                <p>¿Te guardamos la mesa o marchamos el delivery? 🤤</p>
                <div className="text-[10px] text-slate-500 text-right">11:45 ✓✓</div>
              </div>
              <span className="mt-3 inline-block px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-400 text-[11px] font-bold border border-amber-300 dark:border-amber-500/20">
                ✅ Despierta apetito a las 11:45 am.
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'
          }`}>
            <span className="text-2xl shrink-0">👅</span>
            <div className="text-xs leading-relaxed">
              <h4 className={`font-bold mb-1 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>La regla del envío anticipado (11:30 am / 7:15 pm)</h4>
              <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                Nunca envíes un activador a las 1:30 pm cuando la persona ya está almorzando. El secreto de la restauración es enviar el mensaje **45 minutos antes del pico de hambre**, cuando la mente del cliente aún está vacía y buscando qué comer.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ 3. ESTRUCTURA DE 3 PASOS GASTRONÓMICA ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">La fórmula de plato servido</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Anatomía del <span className="italic text-amber-600 dark:text-amber-400">Activador de Antojo</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              3 párrafos diseñados para generar salivación y respuesta rápida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {/* P1 */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark ? 'bg-gradient-to-b from-amber-900/30 to-amber-950/40 border-amber-800/40' : 'bg-amber-50/80 border-amber-200'
            }`}>
              <span className="absolute -top-2 -right-1 text-5xl font-black text-amber-500/10">P1</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block mb-1">Párrafo 1</span>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>El Detonador Sensorial</h3>
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Describe una textura, aroma o sonido del plato (crujiente, humeante, helado, bañado). Cero saludos, cero listas de precios.
              </p>
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                isDark ? 'bg-amber-950/80 border-amber-800/60 text-amber-300' : 'bg-amber-100 border-amber-300 text-amber-900'
              }`}>
                🍳 Ej: "Ese sonido de la carne al fuego..."
              </div>
            </div>

            {/* P2 */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark ? 'bg-gradient-to-b from-orange-900/30 to-orange-950/40 border-orange-800/40' : 'bg-orange-50/80 border-orange-200'
            }`}>
              <span className="absolute -top-2 -right-1 text-5xl font-black text-orange-500/10">P2</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 block mb-1">Párrafo 2</span>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>La Mesa Guardada</h3>
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Empieza con {"{nombre}"}. Ofrece un privilegio (la mejor mesa, copa de cortesía, envío sin cola de espera).
              </p>
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                isDark ? 'bg-orange-950/80 border-orange-800/60 text-orange-300' : 'bg-orange-100 border-orange-300 text-orange-900'
              }`}>
                🥂 Ej: "{"{nombre}"}, te reservé la mesa 4..."
              </div>
            </div>

            {/* P3 */}
            <div className={`p-4 rounded-2xl border relative overflow-hidden ${
              isDark ? 'bg-gradient-to-b from-emerald-900/30 to-emerald-950/40 border-emerald-800/40' : 'bg-emerald-50/80 border-emerald-200'
            }`}>
              <span className="absolute -top-2 -right-1 text-5xl font-black text-emerald-500/10">P3</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">Párrafo 3</span>
              <h3 className={`font-bold text-sm mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Pregunta Dicotómica Suave</h3>
              <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Dale a elegir entre 2 buenas opciones (¿Salón o Delivery? ¿Vino tinto o cerveza bien helada?).
              </p>
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                isDark ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300' : 'bg-emerald-100 border-emerald-300 text-emerald-900'
              }`}>
                🍻 Ej: "¿Vienes al local o te lo enviamos?"
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ 4. COPYS LISTOS PARA GASTRONOMÍA ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Plantillas Gastronómicas Listas</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              35+ Copys de Antojo <span className="italic text-amber-600 dark:text-amber-400">para copiar y enviar</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Organizados por tipo de negocio gastronómico y momento de la semana.
            </p>
          </div>

          {/* CAT 1: DÍAS FLOJOS EN RESTAURANTES */}
          <CategorySection
            icon="🍕"
            title="1. Rescate de Días Flojos (Martes & Miércoles)"
            subtitle="Para llenar mesas o mover el delivery en los días de menor consumo"
            copys={[
              {
                id: 'g-flojos-1',
                type: 'Restaurante / Pizzería',
                mech: 'FOMO de Edición Limitada',
                msg: `Hoy el chef decidió sacar solo 12 porciones de esa lasagna de carne marinada 8 horas que tanto piden. No está en la carta regular. 👀\n\n{nombre}, separé 1 porción a tu nombre antes de anunciar en Instagram. 🍷\n\n¿Te la guardamos para cenar hoy o marchamos delivery? 🤤`,
                tip: 'Limitar la cantidad a 10-12 porciones genera un FOMO real e irresistible.'
              },
              {
                id: 'g-flojos-2',
                type: 'Restobar / Hamburguesas',
                mech: 'Antojo de Media Semana',
                msg: `Un martes por la noche sin papas crujientes y hamburguesa bañada en cheddar debió haber sido considerado ilegal desde hace tiempo... 😂\n\n{nombre}, te tengo una pinta helada de cortesía si te das una vuelta hoy por el local. 🍺\n\n¿Te separo una mesa en la terraza? 🍔`,
                tip: 'Ofrecer la bebida de cortesía tiene bajísimo costo para el local y atrae grupos.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 2: CAFETERÍAS & BRUNCH */}
          <CategorySection
            icon="☕"
            title="2. Cafeterías, Brunch & Pastelería"
            subtitle="Para antojos de mañana (9:30 am) y tardes de café (4:30 pm)"
            copys={[
              {
                id: 'g-cafe-1',
                type: 'Café de Especialidad',
                mech: 'Detonador Sensorial Aromático',
                msg: `Ese primer sorbo de espresso recién molido con el olor a croissants calientes saliendo del horno... no hay mejor forma de pausar el día. ☕✨\n\n{nombre}, aparté tu rincón favorito de la cafetería con el postre recién horneado esperándote. 🥐\n\n¿Te escapas 20 minutos hoy? 😌`,
                tip: 'Sugerir una "escapada de 20 min" reduce la resistencia de tiempo en horario de oficina.'
              },
              {
                id: 'g-cafe-2',
                type: 'Brunch & Postres',
                mech: 'Micro-Recompensa',
                msg: `Hoy el día pide a gritos un cheesecake bien cremoso y una bebida fría antes de seguir con las reuniones. 👀\n\n{nombre}, si pides hoy tu almuerzo o café, la porción del dulce te la mando por la casa. 🍰\n\n¿Te lo enviamos a la oficina o vienes? 😋`,
                tip: 'Perfecto para activar pedidos de ejecutivos a la oficina.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 3: RECTIVACIÓN DE CLIENTES DE DELIVERY */}
          <CategorySection
            icon="🛵"
            title="3. Reactivación de Clientes Inactivos (30 y 60 días)"
            subtitle="Para clientes que compraban por delivery y dejaron de pedir"
            copys={[
              {
                id: 'g-del-1',
                type: 'Delivery Inactivo 30d',
                mech: 'Humor Gastronómico',
                msg: `Tu mesa de centro y la cocina llevan semanas preguntando por qué ya no huele a comida rica por las noches. La verdad, nosotros también te extrañamos. 👀\n\n{nombre}, guardé un cupón de delivery 100% gratis en tu próximo pedido para que no tengas que cocinar hoy. 🛵\n\n¿Marchamos el pedido esta noche? 🤤`,
                tip: 'El delivery gratis elimina la fricción principal de volver a pedir.'
              },
              {
                id: 'g-del-2',
                type: 'Delivery Inactivo 60d',
                mech: 'Reciprocidad + Plato de Regalo',
                msg: `No te voy a preguntar qué cenaste estos dos meses. Te voy a decir que agregamos un entrada gratis a tu orden para tu regreso. 🥟\n\n{nombre}, tu plato favorito sigue saliendo igual de crujiente que siempre. 🥢\n\n¿Te lo llevamos hoy a casa? 😉`,
                tip: 'El plato de regalo de entrada genera sorpresa y compromiso inmediato.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />

          {/* CAT 4: FIN DE SEMANA & RESERVAS */}
          <CategorySection
            icon="🍷"
            title="4. Reservas de Fin de Semana (Viernes & Sábado)"
            subtitle="Para asegurar mesas llenas desde el jueves por la tarde"
            copys={[
              {
                id: 'g-finde-1',
                type: 'Restobar / Parrilla / Sushi',
                mech: 'Exclusividad de Mesa',
                msg: `Las mesas para este fin de semana se están volando desde hoy. Las mejores esquinas del salón siempre se van primero. 🍷\n\n{nombre}, antes de abrir la agenda pública en redes, guardé un espacio para ti y tus acompañantes. ✨\n\n¿Te reservo para el viernes o el sábado? 😌`,
                tip: 'Contactar el jueves al mediodía garantiza completar el 80% de reservas antes del viernes.'
              }
            ]}
            copiedId={copiedId}
            onCopy={handleCopy}
            isDark={isDark}
          />
        </section>

        {/* ═══════════════════════════════ 5. REGLAS ANTI-SPAM GASTRONÓMICAS ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Cero Bloqueos</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Reglas de Oro Anti-Spam <span className="italic text-amber-600 dark:text-amber-400">para Comida</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Protege el número de tu restaurante siguiendo estas 4 reglas estrictas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-amber-900/20 border-amber-800/40' : 'bg-amber-50 border-amber-200'}`}>
              <span className="text-2xl block mb-2">⏰</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Respetar los Horarios de Hambre</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Manda mensajes solo de 11:15 am a 12:15 pm (almuerzo) o de 6:45 pm a 7:45 pm (cena). Fuera de esos rangos se siente molesto e inoportuno.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-orange-900/20 border-orange-800/40' : 'bg-orange-50 border-orange-200'}`}>
              <span className="text-2xl block mb-2">📷</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Fotos Livianas (Menos de 300KB)</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Si envías una foto del plato, comprimela. Los archivos pesados tardan en descargar en WhatsApp móvil y el cliente pasa de largo.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-rose-900/20 border-rose-800/40' : 'bg-rose-50 border-rose-200'}`}>
              <span className="text-2xl block mb-2">🚪</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Salida Directa (Comando BAJA)</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Coloca al final: <em>"Responde BAJA si prefieres no recibir antojos por WhatsApp."</em> Mantiene la salud de tu cuenta al 100%.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-emerald-900/20 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200'}`}>
              <span className="text-2xl block mb-2">🍕</span>
              <h3 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Segmentar Salón vs Delivery</h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                No le ofrezcas reserva de mesa a quien vive a 15km y siempre pide a domicilio. Separa tus listas en el CRM.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ 6. CHECKLIST DE 10 PUNTOS GASTRONÓMICO ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 border-b ${isDark ? 'border-slate-800/80' : 'border-slate-200/90'}`}>
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Revisión previa</span>
            <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Checklist de la <span className="italic text-amber-600 dark:text-amber-400">Campaña Gastronómica</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Marca las 10 casillas antes de enviar cualquier mensaje de tu restaurante.
            </p>
          </div>

          <div className="space-y-2">
            {[
              "P1 despierta antojo — Describe aroma, textura o temperatura sin saludar ni poner listas.",
              "{nombre} al inicio de P2 — Personalización directa en la oferta de mesa o delivery.",
              "Enviado 45 min antes del pico — 11:30 am para almuerzos / 7:15 pm para cenas.",
              "Fotos comprimidas — Máximo 1 imagen o video corto liviano por envío.",
              "P3 con 2 opciones simples — ¿Comes aquí o te lo llevamos? ¿Cerveza o copa de vino?",
              "Sin PDFs adjuntos pesados — El menú debe estar en un enlace web limpio o menú QR.",
              "Beneficio en valor real — 'Copa gratis', 'Delivery sin costo' en lugar de 'Gran Oferta'.",
              "Máximo 1 envío semanal por cliente — Respeta la regla de 7 a 14 días entre envíos.",
              "Comando BAJA al final — Permite salir voluntariamente sin presionar el botón de reporte.",
              "Test de la salivación — Si lees el mensaje antes de almorzar, ¿se te hace agua la boca?"
            ].map((text, idx) => {
              const isChecked = !!checkedItems[idx];
              return (
                <button
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isChecked
                      ? isDark 
                        ? 'bg-amber-950/40 border-amber-700/60 text-amber-200' 
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                      : isDark
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isChecked 
                      ? 'bg-amber-600 border-amber-500 text-white' 
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
          isDark ? 'bg-gradient-to-r from-amber-950 via-slate-950 to-orange-950 border-amber-900/40' : 'bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-white border-amber-800'
        }`}>
          <p className="text-xs text-amber-200 font-medium mb-3">
            🍕 Playbook de Activadores Gastronómicos por WhatsApp · Edición 2026
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6 print:hidden">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-75"
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
          <p className="text-[11px] text-amber-300/80">
            Recurso Gratuito Gastronómico · Creado por Martín Pestana · Todos los derechos reservados
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
          isDark ? 'bg-amber-900/30 border-amber-700/40' : 'bg-amber-100 border-amber-200'
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
                  ? 'bg-slate-900/90 border-slate-800 hover:border-amber-800/60' 
                  : 'bg-slate-50 border-slate-200/90 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isDark 
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800/50' 
                      : 'bg-amber-100 text-amber-900 border-amber-200'
                  }`}>
                    {c.type}
                  </span>
                  <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.mech}</span>
                </div>

                <div className={`p-3 rounded-xl border text-xs leading-relaxed font-sans whitespace-pre-line border-l-4 border-l-amber-600 mb-3 ${
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
                      ? 'bg-slate-800 hover:bg-amber-900/60 text-slate-200 border border-slate-700/60'
                      : 'bg-white hover:bg-amber-50 text-amber-900 border border-slate-300 shadow-2xs'
                }`}
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    <span>¡Copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-600" />
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

export default PlaybookRestaurantesLanding;
