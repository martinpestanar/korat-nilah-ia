import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Copy, Check, Sparkles, Flame, Tag, Calendar, Smartphone,
  Clock, ArrowUpRight, HelpCircle, Layers, CheckCircle2, AlertTriangle,
  Lightbulb, Heart, Zap, Download, Share2, Compass, Award, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface SwipeCopy {
  id: string;
  categoria: string;
  servicio: string;
  badge: string;
  titulo: string;
  copy: string;
  cta: string;
  consejo: string;
}

const SWIPE_COPIES: SwipeCopy[] = [
  {
    id: 'lash-1',
    categoria: 'Pestañas',
    servicio: 'Lifting de Pestañas con Keratina',
    badge: 'Mirada Natural',
    titulo: 'Despídete del rímel que se corre y despierta lista en 5 minutos',
    copy: '¿Cansada de luchar con el rizador todas las mañanas? ✨ Nuestro Lifting con infusión de Keratina y Botox eleva tus pestañas naturales desde la raíz con curvatura armónica que dura hasta 6 semanas. Waterproof, sin extensiones y con brillo intenso.',
    cta: 'Quiero mi sesión de Lifting con Keratina',
    consejo: 'Ideal para promocionar al inicio de mes y en temporada de verano/vacaciones.'
  },
  {
    id: 'lash-2',
    categoria: 'Pestañas',
    servicio: 'Extensiones Volumen Ruso 4D/5D',
    badge: 'Efecto Impacto',
    titulo: 'Densidad aterciopelada y mirada sofisticada sin peso',
    copy: 'Multiplica la densidad de tu mirada con abanicos artesanales ultralivianos. Diseñados a la medida de tu tipo de ojo (Fox Eye, Cat Eye o Wispy) sin dañar tu pestaña natural. Despierta todos los días con mirada de salón de lujo.',
    cta: 'Quiero agendar mi Full Set Volumen Ruso',
    consejo: 'Acompáñalo siempre con una foto macro de antes y después en la carta.'
  },
  {
    id: 'nails-1',
    categoria: 'Manos y Uñas',
    servicio: 'Manicura Rusa VIP + Soft Gel Nails',
    badge: 'Acabado Impecable',
    titulo: 'Cutículas limpias al milímetro y esmaltado intacto por 21 días',
    copy: 'Olvídate del esmalte despicado al tercer día 💅. Con la técnica de torno en seco limpiamos a fondo la cutícula para aplicar esmalte de alta fijación bajo la piel. Tus uñas crecen saludables y el crecimiento tarda mucho más en notarse.',
    cta: 'Quiero mi Manicura Rusa Soft Gel',
    consejo: 'El mejor servicio para lanzar en combos de inicio de semana (Martes y Miércoles).'
  },
  {
    id: 'cejas-1',
    categoria: 'Cejas y Rostro',
    servicio: 'Laminado de Cejas HD + Visagismo & Tinte',
    badge: 'Tendencia Orgánica',
    titulo: 'El marco que estiliza y rejuvenece tu rostro al instante',
    copy: '¿Vellos rebeldes o zonas despobladas? El laminado alinea cada pelito en la dirección ideal creando un efecto tupido, limpio y ordenado. Incluye visagismo según las proporciones de tu rostro y tinte de sombra natural.',
    cta: 'Quiero enmarcar mi mirada con Laminado HD',
    consejo: 'Combínalo con Lifting de Pestañas en el "Dúo Mirada" como Promo del Mes.'
  },
  {
    id: 'hair-1',
    categoria: 'Cabello',
    servicio: 'Balayage Sunkissed & Gloss Nutritivo',
    badge: 'Color de Lujo',
    titulo: 'Luz multidimensional sin la esclavitud del retoque mensual',
    copy: 'Degradados suaves a mano alzada que iluminan tus facciones con tonos vainilla, caramelo o miel 💇‍♀️. Sin líneas marcadas y con sellado ácido que deja tu cabello suave como la seda.',
    cta: 'Quiero mi diagnóstico y Balayage personalizado',
    consejo: 'Coloca "Precio Desde" y activa el slider Antes/Después para justificar el ticket alto.'
  },
  {
    id: 'spa-1',
    categoria: 'Pies & Spa',
    servicio: 'Spa Pedicure Detox & Jelly Relax',
    badge: 'Autocuidado Total',
    titulo: 'Un respiro para tus pies cansados: textura jelly y aromaterapia',
    copy: 'Sumérgete en una tina de gelatina relajante con sales minerales, exfoliación profunda de talones y masaje descontracturante con aceites esenciales 🦶✨. Termina con esmaltado pro de larga duración.',
    cta: 'Quiero consentirme con un Spa Pedicure',
    consejo: 'Perfecto para vender como "Add-on" complementario mientras se hacen las uñas.'
  }
];

const CALENDARIO_FESTIVO = [
  {
    mes: 'Enero & Febrero',
    temporada: '☀️ Verano, Vacaciones & San Valentín',
    estrategia: 'Servicios waterproof y combos en pareja o pre-viaje.',
    ofertaRecomendada: 'Combo "Verano Sin Maquillaje" (Lifting + Pedicure Jelly + Soft Gel)',
    fomoTip: 'Activar Flash FOMO los 10 días previos al 14 de Febrero con cuenta regresiva de 48h.',
    copyGancho: 'Luce radiante en la playa o piscina sin preocuparte por tu maquillaje. ¡Solo 5 cupos con 20% OFF!'
  },
  {
    mes: 'Marzo',
    temporada: '🌸 Mes de la Mujer & Vuelta a la Rutina',
    estrategia: 'Paquetes de renovación express para dueñas de negocio y profesionales ocupadas.',
    ofertaRecomendada: 'Promo "Semana de la Mujer": Manicura Rusa + Limpieza Facial Express',
    fomoTip: 'Flash Sale el 7 y 8 de Marzo con regalo sorpresa en su cita.',
    copyGancho: 'Te mereces este momento solo para ti. Ven a consentirte y renovar tu energía.'
  },
  {
    mes: 'Mayo',
    temporada: '👑 Día de la Madre (Pico Máximo de Facturación)',
    estrategia: 'Experiencias Dúo (Mamá + Hija) o Gift Cards para regalar.',
    ofertaRecomendada: 'Combo VIP "Consintiendo a Mamá": Spa Facial + Masaje Podal + Uñas Gel',
    fomoTip: 'Cuenta regresiva fija del 1 al 10 de Mayo: "Asegura el cupo de Mamá antes de que se agote".',
    copyGancho: 'El mejor regalo para mamá no es algo material, es hacerla sentir como una reina.'
  },
  {
    mes: 'Julio',
    temporada: '🇵🇪 Fiestas Patrias & Gratificaciones',
    estrategia: 'Servicios de ticket alto aprovechando el dinero extra de mitad de año.',
    ofertaRecomendada: 'Balayage Premium + Tratamiento Olaplex / Alisados Orgánicos',
    fomoTip: 'Flash FOMO de 72 horas para reservar fechas de vacaciones.',
    copyGancho: 'Invierte tu gratificación en ti misma. Luce una melena de revista en tus vacaciones.'
  },
  {
    mes: 'Octubre & Noviembre',
    temporada: '🍂 Primavera & Pre-Fiestas (Black Friday)',
    estrategia: 'Pre-venta de citas para Diciembre con descuentos exclusivos anticipados.',
    ofertaRecomendada: 'Black Beauty Pass: Reserva tu cupo de Diciembre y llévate 25% OFF en Noviembre',
    fomoTip: 'Flash Sale con reloj de 24h durante el fin de semana de Black Friday.',
    copyGancho: '¡No te quedes sin turno en Navidad! Asegura tu espacio hoy y llévate un beneficio extra.'
  },
  {
    mes: 'Diciembre',
    temporada: '✨ Navidad & Año Nuevo (Máxima Demanda)',
    estrategia: 'NO bajes precios en Diciembre. Ofrece Combos con Regalo o Valor Agregado.',
    ofertaRecomendada: 'Full Glow Party: Uñas Esculpidas + Volumen Ruso + Cejas HD',
    fomoTip: 'Banner FOMO anunciando: "Solo quedan 8 turnos libres para antes del 31 de Diciembre".',
    copyGancho: 'Recibe el Año Nuevo impecable y deslumbrante. Los turnos de fin de año vuelan.'
  }
];

export const CartaPlaybook: React.FC<{ businessId?: string }> = ({ businessId }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'matriz' | 'calendario' | 'swipes' | 'webapp' | 'rutina'>('matriz');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* ── HEADER BANNER DEL PLAYBOOK ── */}
      <div className="rounded-3xl p-6 text-white relative overflow-hidden shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Sparkles size={11} /> GUÍA DE CRECIMIENTO SAAS
            </span>
            <span className="text-[10px] font-bold text-indigo-200 bg-white/10 px-2 py-0.5 rounded-full">
              Mobile-First Edition
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Manual de Marketing, Publicidad y Conversión para tu Carta Digital
          </h2>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
            Tu carta no es solo un menú de precios: es tu <strong>vendedora digital silenciosa las 24 horas</strong>. 
            Aprende cuándo prender ofertas flash, cómo redactar copys que cierren citas al instante y cómo hacer que tus clientas guarden tu carta en su pantalla de inicio.
          </p>

          <div className="pt-2 flex flex-wrap gap-2.5">
            <Link
              to="/ebooks/de-aprendiz-a-duena"
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-white text-indigo-950 font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-indigo-50 transition-all"
            >
              <BookOpen size={14} /> Ver Ebook Completo de Salones <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── BOTONERA NAVEGACIÓN SECCIONES ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'matriz', label: '1. ¿Qué Oferta Activar y Cuándo?', icon: <Layers size={14} /> },
          { id: 'calendario', label: '2. Calendario Festivo Anual', icon: <Calendar size={14} /> },
          { id: 'swipes', label: '3. Copys Listos para Copiar', icon: <Copy size={14} /> },
          { id: 'webapp', label: '4. Táctica "Guarda la Carta"', icon: <Smartphone size={14} /> },
          { id: 'rutina', label: '5. Rutina de 15 Min Semanal', icon: <Clock size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
              activeSection === tab.id
                ? 'bg-rose-500 text-white border-rose-500 shadow-md scale-100'
                : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SECCIÓN 1: MATRIZ DE OFERTAS Y PSICOLOGÍA DE COMPRA ── */}
      {activeSection === 'matriz' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Flame className="text-rose-500" size={18} /> La Matriz Estratégica: ¿Cuándo activar cada sección?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El peor error de un salón es dejar descuentos permanentes porque devalúan tu marca. Sigue esta regla para combinar las herramientas:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Flash FOMO */}
              <div className="p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/40 dark:bg-rose-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    ⚡ FLASH FOMO (Reloj en Vivo)
                  </span>
                  <span className="text-[10px] font-bold bg-rose-200/60 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full">
                    Urgencia Alta
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Cuándo prenderlo:</strong> Martes y Miércoles (días de baja afluencia), quincenas (días 15 y 30), o cuando un cliente cancela a última hora.
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  ⏱️ <strong>Duración:</strong> Máximo 24 a 48 horas. Siempre debe expirar de verdad para educar a tus clientas a actuar rápido.
                </p>
              </div>

              {/* Combo de la Semana */}
              <div className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    🎁 COMBO ESPECIAL DE LA SEMANA
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/60 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                    Ticket Promedio
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Cuándo prenderlo:</strong> De Lunes a Domingo. Rómpelo cada lunes por la mañana combinando 2 servicios complementarios (Cross-Selling).
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  💡 <strong>Fórmula de éxito:</strong> Servicio Estrella + Servicio Rápido (Ej: Uñas Gel + Spa Pedicure con descuento en el segundo).
                </p>
              </div>

              {/* Promo del Mes */}
              <div className="p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30 bg-purple-50/40 dark:bg-purple-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-700 dark:text-purple-400 flex items-center gap-1">
                    🌸 PROMO DEL MES (Inspiracional)
                  </span>
                  <span className="text-[10px] font-bold bg-purple-200/60 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                    Branding & Posicionamiento
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Cuándo prenderlo:</strong> Todo el mes sin precio directo. Enfocado en el beneficio emocional (Ej: "Glow de Temporada: Mirada de Impacto").
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  ✨ <strong>Objetivo:</strong> Generar deseo en clientas indecisas invitándolas a consultar vía WhatsApp.
                </p>
              </div>

              {/* Ofertas de Hoy */}
              <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    🔥 OFERTAS DEL DÍA (En Catálogo)
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200/60 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    Impulso Inmediato
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Cuándo prenderlo:</strong> Selecciona de 2 a 4 servicios como "Destacados" en el administrador. Aparecerán en carrusel con el badge PROMO HOY.
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  🎯 <strong>Objetivo:</strong> Ayudar a la clienta a decidir rápidamente si es su primera visita al salón.
                </p>
              </div>

            </div>
          </div>
        </motion.div>
      )}

      {/* ── SECCIÓN 2: CALENDARIO FESTIVO DE TODO EL AÑO ── */}
      {activeSection === 'calendario' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-indigo-500" size={18} /> Calendario de Campañas para Salones de Belleza
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Planifica tu año con antelación. Cada fecha festiva requiere un mensaje y una oferta distinta en tu carta digital:
              </p>
            </div>

            <div className="space-y-3.5">
              {CALENDARIO_FESTIVO.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-xl">
                      {item.mes}
                    </span>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {item.temporada}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 pt-1">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">🎯 Oferta a configurar:</p>
                      <p>{item.ofertaRecomendada}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">⚡ Tip FOMO:</p>
                      <p>{item.fomoTip}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 dark:border-white/10 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-500 italic truncate flex-1">
                      "{item.copyGancho}"
                    </p>
                    <button
                      onClick={() => copyToClipboard(item.copyGancho, `cal-${idx}`)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:text-rose-500 flex items-center gap-1 shrink-0"
                    >
                      {copiedId === `cal-${idx}` ? <><Check size={11} className="text-emerald-500" /> Copiado</> : <><Copy size={11} /> Copiar Copy</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SECCIÓN 3: SWIPE FILE DE COPYS CON 1-CLICK COPY ── */}
      {activeSection === 'swipes' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Copy className="text-rose-500" size={18} /> Swipe File: Copys de Alta Conversión por Servicio
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Toca "Copiar Copy" y pégalo directamente en la descripción de tus servicios en la pestaña <strong>Servicios & Menú</strong>:
              </p>
            </div>

            <div className="space-y-3.5">
              {SWIPE_COPIES.map((sw) => (
                <div key={sw.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md">
                        {sw.categoria}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">{sw.servicio}</h4>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400">
                      {sw.badge}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    "{sw.titulo}"
                  </p>

                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-800/80 border border-gray-200/70 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {sw.copy}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      💡 {sw.consejo}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${sw.titulo}\n\n${sw.copy}`, sw.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white shadow-xs hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      {copiedId === sw.id ? <><Check size={13} /> ¡Copiado!</> : <><Copy size={13} /> Copiar Copy</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SECCIÓN 4: CÓMO HACER QUE GUARDEN LA CARTA COMO WEB APP ── */}
      {activeSection === 'webapp' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Smartphone className="text-emerald-500" size={18} /> La Táctica "Guarda Nuestra App en tu Celular"
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                La Carta Digital está construida con tecnología PWA (Progressive Web App). Las clientas pueden tenerla como un ícono de aplicación en su iPhone o Android sin pasar por App Store.
              </p>
            </div>

            {/* Script de WhatsApp */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  💬 Mensaje automático para enviar por WhatsApp
                </span>
                <button
                  onClick={() => copyToClipboard(
                    `¡Hola hermosa! ✨ Te comparto nuestra Carta Digital interactiva para que veas todos nuestros servicios, precios actualizados y fotos de Antes y Después en vivo:\n\n👉 [LINK_DE_TU_CARTA]\n\n📲 *Tip VIP:* Cuando abras el link, dale a "Compartir" y luego a *"Agregar a pantalla de inicio"*. Así se guardará como una app en tu celular y podrás consultar turnos libres y promociones flash cada semana con 1 solo toque. ¡Te esperamos! 🌸`,
                    'msg-whatsapp'
                  )}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 flex items-center gap-1"
                >
                  {copiedId === 'msg-whatsapp' ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar Mensaje</>}
                </button>
              </div>

              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-mono leading-relaxed whitespace-pre-line border border-emerald-100 dark:border-emerald-900/30">
                {`¡Hola hermosa! ✨ Te comparto nuestra Carta Digital interactiva para que veas todos nuestros servicios, precios actualizados y fotos de Antes y Después en vivo:\n\n👉 [LINK_DE_TU_CARTA]\n\n📲 *Tip VIP:* Cuando abras el link, dale a "Compartir" y luego a *"Agregar a pantalla de inicio"*. Así se guardará como una app en tu celular y podrás consultar turnos libres y promociones flash cada semana con 1 solo toque. ¡Te esperamos! 🌸`}
              </div>
            </div>

            {/* Pasos visuales para las clientas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1.5">
                <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  🍎 En iPhone (Safari):
                </p>
                <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal pl-4">
                  <li>Abre el link de la carta en Safari.</li>
                  <li>Toca el botón <strong>Compartir</strong> (ícono de caja con flecha arriba).</li>
                  <li>Desliza y selecciona <strong>"Agregar a pantalla de inicio"</strong>.</li>
                </ol>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1.5">
                <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  🤖 En Android (Chrome):
                </p>
                <ol className="text-xs text-gray-500 dark:text-gray-400 space-y-1 list-decimal pl-4">
                  <li>Abre el link de la carta en Google Chrome.</li>
                  <li>Toca los <strong>3 puntos</strong> de arriba a la derecha.</li>
                  <li>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a pantalla principal".</li>
                </ol>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── SECCIÓN 5: RUTINA DE 15 MINUTOS SEMANAL ── */}
      {activeSection === 'rutina' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="text-amber-500" size={18} /> La Rutina Semanal de 15 Minutos (Sin Sobrecargarte)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                No tienes que cambiar tu carta todos los días. Dedica solo 15 minutos a la semana siguiendo este cronograma:
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  dia: 'Lunes (9:00 AM) — 10 Minutos',
                  color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
                  titulo: 'Renovación del Combo de la Semana',
                  desc: 'Entra a la pestaña "Promos", apaga el combo anterior y escribe el nuevo combo que quieres mover durante la semana. Coloca fecha de expiración para el domingo.'
                },
                {
                  dia: 'Miércoles (2:00 PM) — 3 Minutos',
                  color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
                  titulo: 'Activación del Flash FOMO (Si hay huecos)',
                  desc: 'Revisa tu agenda del jueves y viernes. Si tienes huecos libres, prende el Flash FOMO con 24 horas de reloj y 20% de descuento en el servicio que quieras llenar.'
                },
                {
                  dia: 'Viernes (7:00 PM) — 2 Minutos',
                  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
                  titulo: 'Verificar Turnos de Fin de Semana',
                  desc: 'Si el sábado está 100% lleno, apaga el Flash FOMO para que tus clientas vean que tu salón está en alta demanda y reserven para la siguiente semana.'
                }
              ].map((r, i) => (
                <div key={i} className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${r.color}`}>
                    {r.dia}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white pt-1">{r.titulo}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default CartaPlaybook;
