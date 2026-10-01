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
  cuposEjemplo?: string;
  gatilloPsicologico?: string;
}

const SWIPE_COPIES: SwipeCopy[] = [
  {
    id: 'cupos-flash-1',
    categoria: '🔥 Urgencia & Cupos Flash',
    servicio: 'Oferta Flash Diaria con Cupos Limitados (FOMO)',
    badge: 'Dopamina & Escasez',
    titulo: '⚡ ¡Solo 3 cupos para hoy! Tratamiento Capilar Reconstructivo al 30% OFF',
    copy: 'Liberamos únicamente 3 espacios VIP para nuestra sesión intensiva de nutrición molecular con sellado térmico. Una vez reservados los 3 cupos, el contador se cerrará automáticamente.',
    cta: 'Deseo reservar 1 de los 3 cupos flash de hoy antes que se agoten',
    consejo: 'Activa la barra de cupos (3 de 5 ocupados) para disparar la sensación de urgencia y velocidad de compra.',
    cuposEjemplo: '3 reservados de 5 totales (60%)',
    gatilloPsicologico: 'Aversión a la Pérdida + Prueba Social Inmediata'
  },
  {
    id: 'dia-martes-1',
    categoria: '🗓️ Días Temáticos Semanales',
    servicio: 'Ritual de Martes: Uñas & Glow (Llenar días lentos)',
    badge: 'Martes de Uñas',
    titulo: '💅 ¡Martes de Uñas & Glow! Manicura Rusa + Baño de Gel a S/. 49',
    copy: 'Convierte tus martes en tu momento sagrado de autocuidado ✨. Disfruta de manicura rusa profunda con esmaltado de alta duración y exfoliación hidratante de regalo con 35% de descuento exclusivo solo por agendar para los días martes.',
    cta: 'Quiero reservar mi espacio para este Martes de Uñas',
    consejo: 'Configúralo en "Días Temáticos" para los días martes con 5 cupos por semana para crear hábito.',
    cuposEjemplo: '3 de 5 cupos reservados para este martes',
    gatilloPsicologico: 'Anclaje de Hábito Semanal + Recompensa Anticipada'
  },
  {
    id: 'dia-miercoles-1',
    categoria: '🗓️ Días Temáticos Semanales',
    servicio: 'Ritual de Miércoles: Spa Capilar & Botox Molecular',
    badge: 'Miércoles Capilar',
    titulo: '💆‍♀️ Miércoles de Rescate Capilar: Botox + Brushing Pro a precio especial',
    copy: 'Recupera el brillo y elimina el frizz antes del fin de semana. Nuestro ritual de los miércoles incluye diagnóstico capilar, nutrición intensiva sellada con ozonoterapia y peinado profesional.',
    cta: 'Quiero agendar mi tratamiento para este Miércoles',
    consejo: 'Excelente para mover tratamientos de ticket alto a mitad de semana cuando el personal tiene tiempo disponible.',
    cuposEjemplo: '2 de 4 cupos reservados para el miércoles',
    gatilloPsicologico: 'Preparación para el Fin de Semana + Ticket Medio Elevado'
  },
  {
    id: 'cupos-semana-1',
    categoria: '🔥 Urgencia & Cupos Flash',
    servicio: 'Oferta Semanal con Cupos de Alta Demanda',
    badge: 'Cupos Semanales',
    titulo: '🎟️ Combo Glow Semanal: Lifting + Uñas Soft Gel (Solo 7 cupos esta semana)',
    copy: 'Diseñamos este combo de temporada para consentirte de pies a cabeza con precio preferencial. Para garantizar la máxima dedicación de nuestras especialistas, solo habilitamos 7 turnos por semana.',
    cta: 'Quiero asegurar 1 de los cupos de esta semana para el Combo Glow',
    consejo: 'Lánzalo los lunes por la mañana y ve subiendo los cupos ocupados cada día en el panel.',
    cuposEjemplo: '5 reservados de 7 totales (¡Quedan solo 2!)',
    gatilloPsicologico: 'Exclusividad y Calidad Percibida por Cupos Limitados'
  },
  {
    id: 'lash-1',
    categoria: 'Pestañas',
    servicio: 'Lifting de Pestañas con Keratina',
    badge: 'Mirada Natural',
    titulo: 'Despídete del rímel que se corre y despierta lista en 5 minutos',
    copy: '¿Cansada de luchar con el rizador todas las mañanas? ✨ Nuestro Lifting con infusión de Keratina y Botox eleva tus pestañas naturales desde la raíz con curvatura armónica que dura hasta 6 semanas. Waterproof, sin extensiones y con brillo intenso.',
    cta: 'Quiero mi sesión de Lifting con Keratina',
    consejo: 'Ideal para promocionar al inicio de mes y en temporada de verano/vacaciones.',
    gatilloPsicologico: 'Ahorro de Tiempo y Belleza sin Esfuerzo'
  },
  {
    id: 'lash-2',
    categoria: 'Pestañas',
    servicio: 'Extensiones Volumen Ruso 4D/5D',
    badge: 'Efecto Impacto',
    titulo: 'Densidad aterciopelada y mirada sofisticada sin peso',
    copy: 'Multiplica la densidad de tu mirada con abanicos artesanales ultralivianos. Diseñados a la medida de tu tipo de ojo (Fox Eye, Cat Eye o Wispy) sin dañar tu pestaña natural. Despierta todos los días con mirada de salón de lujo.',
    cta: 'Quiero agendar mi Full Set Volumen Ruso',
    consejo: 'Acompáñalo siempre con una foto macro de antes y después en la carta.',
    gatilloPsicologico: 'Estatus y Efecto Wow Inmediato'
  },
  {
    id: 'nails-1',
    categoria: 'Manos y Uñas',
    servicio: 'Manicura Rusa VIP + Soft Gel Nails',
    badge: 'Acabado Impecable',
    titulo: 'Cutículas limpias al milímetro y esmaltado intacto por 21 días',
    copy: 'Olvídate del esmalte despicado al tercer día 💅. Con la técnica de torno en seco limpiamos a fondo la cutícula para aplicar esmalte de alta fijación bajo la piel. Tus uñas crecen saludables y el crecimiento tarda mucho más en notarse.',
    cta: 'Quiero mi Manicura Rusa Soft Gel',
    consejo: 'El mejor servicio para lanzar en combos de inicio de semana (Martes y Miércoles).',
    gatilloPsicologico: 'Durabilidad y Perfección Técnica'
  },
  {
    id: 'cejas-1',
    categoria: 'Cejas y Rostro',
    servicio: 'Laminado de Cejas HD + Visagismo & Tinte',
    badge: 'Tendencia Orgánica',
    titulo: 'El marco que estiliza y rejuvenece tu rostro al instante',
    copy: '¿Vellos rebeldes o zonas despobladas? El laminado alinea cada pelito en la dirección ideal creando un efecto tupido, limpio y ordenado. Incluye visagismo según las proporciones de tu rostro y tinte de sombra natural.',
    cta: 'Quiero enmarcar mi mirada con Laminado HD',
    consejo: 'Combínalo con Lifting de Pestañas en el "Dúo Mirada" como Promo del Mes.',
    gatilloPsicologico: 'Rejuvenecimiento y Armonía Facial'
  },
  {
    id: 'hair-1',
    categoria: 'Cabello',
    servicio: 'Balayage Sunkissed & Gloss Nutritivo',
    badge: 'Color de Lujo',
    titulo: 'Luz multidimensional sin la esclavitud del retoque mensual',
    copy: 'Degradados suaves a mano alzada que iluminan tus facciones con tonos vainilla, caramelo o miel 💇‍♀️. Sin líneas marcadas y con sellado ácido que deja tu cabello suave como la seda.',
    cta: 'Quiero mi diagnóstico y Balayage personalizado',
    consejo: 'Coloca "Precio Desde" y activa el slider Antes/Después para justificar el ticket alto.',
    gatilloPsicologico: 'Mantenimiento Bajo y Sofisticación'
  },
  {
    id: 'spa-1',
    categoria: 'Pies & Spa',
    servicio: 'Spa Pedicure Detox & Jelly Relax',
    badge: 'Autocuidado Total',
    titulo: 'Un respiro para tus pies cansados: textura jelly y aromaterapia',
    copy: 'Sumérgete en una tina de gelatina relajante con sales minerales, exfoliación profunda de talones y masaje descontracturante con aceites esenciales 🦶✨. Termina con esmaltado pro de larga duración.',
    cta: 'Quiero consentirme con un Spa Pedicure',
    consejo: 'Perfecto para vender como "Add-on" complementario mientras se hacen las uñas.',
    gatilloPsicologico: 'Escape del Estrés y Mimo Sensorial'
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
  const [activeSection, setActiveSection] = useState<'matriz' | 'dopamina' | 'calendario' | 'swipes' | 'webapp' | 'rutina'>('matriz');
  const [selectedSwipeCategory, setSelectedSwipeCategory] = useState<string>('todos');

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
            Aprende cuándo prender ofertas flash, cómo activar los gatillos de dopamina y cupos limitados, y cómo hacer que tus clientas reserven al instante.
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
          { id: 'dopamina', label: '2. ⚡ Psicología & Cupos Dopamina', icon: <Flame size={14} /> },
          { id: 'calendario', label: '3. Calendario Festivo Anual', icon: <Calendar size={14} /> },
          { id: 'swipes', label: '4. Copys Listos para Copiar', icon: <Copy size={14} /> },
          { id: 'webapp', label: '5. Táctica "Guarda la Carta"', icon: <Smartphone size={14} /> },
          { id: 'rutina', label: '6. Rutina de 15 Min Semanal', icon: <Clock size={14} /> },
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

              {/* Rituales Semanales / Días Temáticos */}
              <div className="p-4 rounded-2xl border border-pink-200 dark:border-pink-900/30 bg-pink-50/40 dark:bg-pink-950/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-pink-700 dark:text-pink-400 flex items-center gap-1">
                    🗓️ DÍAS TEMÁTICOS (Rituales Fijos)
                  </span>
                  <span className="text-[10px] font-bold bg-pink-200/60 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200 px-2 py-0.5 rounded-full">
                    Llenar Días Lentos
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Cuándo prenderlo:</strong> Fijo cada semana para Lunes, Martes o Miércoles (ej: "Martes de Uñas", "Miércoles Capilar").
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  🎯 <strong>Objetivo:</strong> Crear un hábito psicológico semanal en tus clientas y permitir que reserven con días de anticipación.
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

            {/* ── NUEVA SUB-SECCIÓN: PSICOLOGÍA DE CUPOS Y DOPAMINA ── */}
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-300/40 dark:border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center font-black shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      Psicología de Escasez y Dopamina: El Poder de los Cupos Limitados
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Cómo activar el gatillo de FOMO (Miedo a Quedarse Fuera) sin sonar desesperada
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  Alta Conversión
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    🎟️ 1. Efecto Cupos Rellenos
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    Si pones "10 cupos y 0 reservados", parece que nadie lo quiere. Si pones <strong>"3 de 5 reservados"</strong>, la clienta siente que se está acabando y corre a pedirlo.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    🔥 2. Barra de Dopamina Visual
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    El ojo humano responde a colores de advertencia (ámbar ➔ rojo). La barra de progreso activa la necesidad psicológica de "completar la acción antes de perderla".
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-xs font-black text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    📲 3. WhatsApp Pre-redactado
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    Al dar click, el botón ya envía: <em>"Quiero asegurar 1 de los 2 cupos libres..."</em>. Elimina la fricción mental y hace que la venta esté prácticamente cerrada.
                  </p>
                </div>
              </div>
            </div>

            {/* ── SECCIÓN CONTENIDO VISUAL ESTRATÉGICO ── */}
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-rose-900/10 border border-indigo-200 dark:border-indigo-900/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
                    📸
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      Estrategia Visual: ¿Cuándo usar Sliders "Antes & Después"?
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Regla de experto: No abrumes a la clienta poniendo sliders a todos los servicios.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                  Criterio UX Pro
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    🎚️ Sliders (Antes vs Después)
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    Úsalos <strong>únicamente en 2 o 3 servicios de alto impacto/transformación</strong> (Balayage, Alisado Orgánico, Lifting de Pestañas). Justifican tickets altos (S/. 150 - S/. 300+).
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-xs font-black text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    💅 Foto HD Resultado Final
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    Ideal para <strong>Nail Art, Manicura Rusa o Peinados</strong>. Las clientas buscan inspiración estética y arte limpio, no cutículas secas del antes.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-neutral-800/80 rounded-xl border border-gray-100 dark:border-white/5 space-y-1">
                  <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    🎬 Videos / Experiencia Spa
                  </p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                    Para <strong>Faciales, Masajes y Tratamientos de Bienestar</strong>. Muestra el proceso envolvente, la relajación y el brillo natural final (Glow).
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* ── SECCIÓN 2: PSICOLOGÍA DE CUPOS & DOPAMINA (NUEVO) ── */}
      {activeSection === 'dopamina' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Ingeniería de Dopamina y Psicología de Escasez para Salones
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                El cerebro de una clienta no compra cuando tiene tiempo infinito para pensar. Compra cuando siente que <strong>otras mujeres están reservando y que si espera unas horas se quedará sin su turno</strong>.
              </p>
            </div>

            {/* Los 4 Pilares Neuro-Científicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">⏳</span>
                  <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    1. Aversión a la Pérdida (Kahneman)
                  </h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  Duele el doble perder un beneficio que la alegría de ganarlo. Por eso decir <em>"Solo quedan 2 cupos para hoy"</em> convierte <strong>300% más</strong> que decir <em>"Tenemos una promoción disponible"</em>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">👀</span>
                  <h4 className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                    2. Prueba Social Visual Dinámica
                  </h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  Ver la barra llena al 70% (3 de 4 cupos) valida la reputación del salón. La clienta piensa inconscientemente: <em>"Si tantas clientas ya reservaron hoy, el servicio debe ser impecable"</em>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-400/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌈</span>
                  <h4 className="text-xs font-black text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                    3. Gatillo Visual de Colores Calientes
                  </h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  El degradado cálido de Ámbar (`#f59e0b`) a Rosa (`#f43f5e`) y Rojo (`#ef4444`) estimula las zonas de urgencia visual en la retina. El usuario siente instintivamente que el tiempo se acaba.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎯</span>
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    4. Venta con Cero Fricción en WhatsApp
                  </h4>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  El botón de reserva pasa el texto exacto pre-escrito: <em>"Deseo asegurar 1 de los cupos..."</em>. La clienta no tiene que pensar qué decir, solo presiona Enviar y la cita queda asegurada.
                </p>
              </div>
            </div>

            {/* Simulador Interactivo de Conversión */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-3 border border-rose-500/30">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                  <Flame size={14} className="text-rose-500" /> Cómo ve tu clienta el banner en la carta
                </span>
                <span className="text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-500/40 px-2 py-0.5 rounded-full">
                  Vista Previa Interactiva
                </span>
              </div>

              {/* Mock Banner */}
              <div className="rounded-2xl p-3.5 bg-gradient-to-r from-neutral-950 via-rose-950 to-neutral-900 border border-rose-500/40 shadow-inner flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded-md">
                      OFERTA FLASH HOY
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-neutral-950 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                      🔥 ¡Solo 2 cupos para hoy!
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white/95 mt-1 truncate">Lifting de Pestañas + Hidratación de Keratina</p>
                  
                  {/* Progress bar */}
                  <div className="mt-1.5 pr-2">
                    <div className="flex items-center justify-between text-[9px] font-extrabold text-amber-300/90 mb-0.5">
                      <span>Cupos reservados hoy:</span>
                      <span className="text-white font-black">3 de 5 (60%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-rose-500/30">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 w-[60%]" />
                    </div>
                  </div>
                </div>

                <div className="bg-black/75 border border-rose-500/50 px-2.5 py-1.5 rounded-xl font-mono text-xs font-black text-rose-300 shrink-0">
                  <span>04:18:22</span>
                </div>
              </div>
            </div>

            {/* Plantillas de Copys de WhatsApp para Cupos */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Copy size={13} /> Mensajes de WhatsApp de Alta Conversión para Difundir Cupos
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">🚨 Estado de WhatsApp / Story</span>
                    <button
                      onClick={() => copyToClipboard(
                        `🚨 ¡ATENCIÓN CHICAS! 🚨\n\nLiberamos una *Oferta Flash de 24 Horas* en nuestra Carta Digital:\n\n✨ [NOMBRE_DEL_SERVICIO] con 25% OFF\n🎟️ *Solo habilitamos 4 cupos* (¡y ya reservaron 2!)\n\n👉 Mira los cupos disponibles en vivo aquí:\n[LINK_DE_TU_CARTA]\n\n¡La promo se cierra cuando el reloj llegue a 00:00! ⏳`,
                        'copy-story-cupos'
                      )}
                      className="px-2 py-0.8 rounded-lg text-[10px] font-bold bg-rose-500 text-white flex items-center gap-1"
                    >
                      {copiedId === 'copy-story-cupos' ? <Check size={11} /> : <Copy size={11} />} Copiar
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 font-mono leading-relaxed bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 whitespace-pre-line">
                    {`🚨 ¡ATENCIÓN CHICAS! 🚨\nLiberamos una *Oferta Flash* en nuestra Carta Digital...\n🎟️ *Solo habilitamos 4 cupos* (¡ya van 2!)\n👉 Mira los cupos en vivo: [LINK_DE_TU_CARTA]`}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">💬 Difusión Directa VIP a Clientas</span>
                    <button
                      onClick={() => copyToClipboard(
                        `¡Hola hermosa! 🌸 Te aviso antes que a nadie: acabamos de abrir la *Oferta Semanal* en la carta digital con el Combo [NOMBRE_COMBO].\n\nPor tiempo limitado solo dimos 5 cupos especiales con precio preferencial y quedan solo 2 libres. Si deseas consentirte esta semana, resérvalo directo desde la carta antes de que se agote:\n\n👉 [LINK_DE_TU_CARTA]`,
                        'copy-vip-cupos'
                      )}
                      className="px-2 py-0.8 rounded-lg text-[10px] font-bold bg-emerald-600 text-white flex items-center gap-1"
                    >
                      {copiedId === 'copy-vip-cupos' ? <Check size={11} /> : <Copy size={11} />} Copiar
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 font-mono leading-relaxed bg-white dark:bg-neutral-800 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 whitespace-pre-line">
                    {`¡Hola hermosa! 🌸 Acabamos de abrir la *Oferta Semanal* con precio preferencial.\nSolo dimos 5 cupos y quedan 2 libres...\n👉 [LINK_DE_TU_CARTA]`}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}

      {/* ── SECCIÓN 3: CALENDARIO FESTIVO DE TODO EL AÑO ── */}
      {activeSection === 'calendario' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="text-rose-500" size={19} /> Calendario Estratégico de Campañas para Salones
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Planifica tu facturación anual. Cada temporada festiva requiere una psicología, oferta y gatillo de urgencia específico en tu carta digital:
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                12 Meses de Estrategia
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CALENDARIO_FESTIVO.map((item, idx) => {
                const isMother = item.mes.includes('Mayo');
                const isSummer = item.mes.includes('Enero');
                const isPatrias = item.mes.includes('Julio');
                const isNavidad = item.mes.includes('Diciembre');

                const cardBg = isMother
                  ? 'from-rose-500/10 via-pink-500/5 to-purple-500/10 border-rose-200 dark:border-rose-900/40'
                  : isSummer
                  ? 'from-amber-500/10 via-orange-500/5 to-yellow-500/10 border-amber-200 dark:border-amber-900/40'
                  : isPatrias
                  ? 'from-red-500/10 via-rose-500/5 to-red-500/10 border-red-200 dark:border-red-900/40'
                  : isNavidad
                  ? 'from-emerald-500/10 via-teal-500/5 to-purple-500/10 border-emerald-200 dark:border-emerald-900/40'
                  : 'from-indigo-500/5 via-purple-500/5 to-pink-500/5 border-gray-100 dark:border-white/10';

                const badgeBg = isMother
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : isSummer
                  ? 'bg-amber-500 text-white shadow-amber-500/20'
                  : isPatrias
                  ? 'bg-red-600 text-white shadow-red-500/20'
                  : isNavidad
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-500/20';

                return (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4.5 bg-gradient-to-br ${cardBg} border shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs ${badgeBg}`}>
                          🗓️ {item.mes}
                        </span>
                        {isMother && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 px-2 py-0.5 rounded-full border border-rose-300">
                            👑 Pico Facturación
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        {item.temporada}
                      </h4>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                        💡 <strong>Estrategia:</strong> {item.estrategia}
                      </p>

                      <div className="space-y-2 pt-1">
                        <div className="p-2.5 rounded-xl bg-white/80 dark:bg-neutral-800/90 border border-gray-200/60 dark:border-white/10 space-y-1">
                          <p className="text-[11px] font-bold text-gray-900 dark:text-white flex items-center gap-1">
                            🎯 <span>Oferta a Configurar:</span>
                          </p>
                          <p className="text-[11px] text-gray-700 dark:text-gray-300">
                            {item.ofertaRecomendada}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/40 dark:border-amber-700/30 space-y-1">
                          <p className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                            ⚡ <span>Tip de Urgencia (FOMO):</span>
                          </p>
                          <p className="text-[11px] text-amber-950/90 dark:text-amber-200">
                            {item.fomoTip}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Copy Gancho:</p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-300 italic truncate">
                          "{item.copyGancho}"
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.copyGancho, `cal-${idx}`)}
                        className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-white dark:bg-neutral-800 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center gap-1.5 shrink-0 shadow-2xs"
                      >
                        {copiedId === `cal-${idx}` ? (
                          <><Check size={12} className="text-emerald-500" /> Copiado</>
                        ) : (
                          <><Copy size={12} /> Copiar Copy</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
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
                Toca "Copiar Copy" y pégalo directamente en la descripción de tus servicios o promos en la carta:
              </p>
            </div>

            {/* Categorías de Filtro */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'todos', label: 'Todos los Copys' },
                { id: '🗓️ Días Temáticos Semanales', label: '🗓️ Días Temáticos' },
                { id: '🔥 Urgencia & Cupos Flash', label: '⚡ Cupos & FOMO' },
                { id: 'Pestañas', label: 'Pestañas' },
                { id: 'Manos y Uñas', label: 'Uñas & Manos' },
                { id: 'Cejas y Rostro', label: 'Cejas' },
                { id: 'Cabello', label: 'Cabello' },
                { id: 'Pies & Spa', label: 'Spa' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedSwipeCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedSwipeCategory === cat.id
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="space-y-3.5">
              {SWIPE_COPIES.filter(sw => selectedSwipeCategory === 'todos' || sw.categoria === selectedSwipeCategory).map((sw) => (
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

                  {/* Gatillo Psicológico & Ejemplo de Cupos si aplica */}
                  {(sw.gatilloPsicologico || sw.cuposEjemplo) && (
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {sw.gatilloPsicologico && (
                        <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          🧠 Gatillo: {sw.gatilloPsicologico}
                        </span>
                      )}
                      {sw.cuposEjemplo && (
                        <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/30 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          🎟️ Cupos recomendados: {sw.cuposEjemplo}
                        </span>
                      )}
                    </div>
                  )}

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
                  dia: 'Lunes (9:00 AM) — 8 Minutos',
                  color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
                  titulo: 'Renovación del Combo Semanal + Días Temáticos',
                  desc: 'Entra a "Promos", ajusta el Combo de la Semana y verifica que tus Días Temáticos (ej: "Martes de Uñas" o "Miércoles Capilar") estén activos con sus cupos listos.'
                },
                {
                  dia: 'Martes o Miércoles — 2 Minutos',
                  color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40',
                  titulo: 'Recordatorio del Día Temático en Stories o WhatsApp',
                  desc: 'Publica en tus historias: "Hoy es Martes de Uñas en nuestra carta digital con cupos limitados". Las clientas tocan el link y reservan directamente para hoy o para el próximo martes.'
                },
                {
                  dia: 'Miércoles (2:00 PM) — 3 Minutos',
                  color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
                  titulo: 'Activación del Flash FOMO con Barra de Progreso',
                  desc: 'Revisa tu agenda del jueves y viernes. Si tienes huecos libres, prende el Flash FOMO con 24 horas y cupos diarios (ej: 3 reservados de 4 totales) para que vuelen los turnos restantes.'
                },
                {
                  dia: 'Viernes (7:00 PM) — 2 Minutos',
                  color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
                  titulo: 'Verificar Turnos de Fin de Semana & Agotados',
                  desc: 'Si el sábado está 100% lleno, apaga el Flash FOMO o marca los cupos como agotados para que tus clientas vean alta demanda y agenden con anticipación para la siguiente semana.'
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
