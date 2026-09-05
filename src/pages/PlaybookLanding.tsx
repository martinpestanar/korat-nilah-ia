import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Check, Copy, Moon, Sun, Loader2, Sparkles, 
  Sparkle, BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText, 
  ChevronRight, Share2, CheckCircle2, AlertCircle, Eye, Scissors, 
  Smile, Flame, Star, Zap, Layers, RefreshCw
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface CopyTemplate {
  id: string;
  rubro: 'pestanas' | 'unas' | 'salon' | 'general';
  category: string;
  type: string;
  mech: string;
  msg: string;
  tip: string;
  badge?: string;
}

export const PlaybookLanding: React.FC = () => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pestanas' | 'unas' | 'salon'>('all');
  const [readProgress, setReadProgress] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Playbook WhatsApp para Salones: Pestañas, Uñas & Belleza | Nilah';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setReadProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 150);
  };

  const handleDownloadWord = () => {
    setIsGeneratingDocx(true);
    try {
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Playbook WhatsApp Salones - Pestañas, Uñas y Belleza - Nilah</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
            h1 { color: #9333ea; font-size: 26pt; line-height: 1.2; margin-bottom: 8px; }
            h2 { color: #7e22ce; font-size: 18pt; margin-top: 24pt; border-bottom: 2px solid #e9d5ff; padding-bottom: 4pt; page-break-before: always; }
            h3 { color: #6b21a8; font-size: 14pt; margin-top: 14pt; }
            p { font-size: 11pt; margin-bottom: 8pt; }
            blockquote { background: #faf5ff; border-left: 4px solid #a855f7; padding: 12px; margin: 14px 0; font-style: italic; color: #581c87; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 12px 0; }
            .badge { background: #f3e8ff; color: #7e22ce; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .tip { font-size: 9.5pt; color: #64748b; font-style: italic; margin-top: 4pt; }
            pre { background: #f1f5f9; padding: 10px; border-radius: 6px; font-family: 'Courier New', monospace; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="badge">GUÍA OFICIAL 2026 · NILAH IA</p>
            <h1>El Playbook de Mensajes Activadores por WhatsApp</h1>
            <p style="font-size: 13pt; color: #6b7280; font-weight: bold;">Especializado 100% para Salones de Pestañas, Manicuristas y Salones de Belleza</p>
            <p style="font-size: 10pt; color: #475569;">Por <strong>Martín Pestana</strong> · Creador de Nilah</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>

          <h2>1. LA REGLA DE ORO DE LOS SALONES DE BELLEZA</h2>
          <p>En el rubro de pestañas, uñas y estética, el 80% de la facturación proviene de <strong>la recurrencia y los retoques a tiempo</strong>. Cuando una clienta se pasa del día 21 en acrílico o de la 3ª semana en extensiones de pestañas:</p>
          <ul>
            <li>En pestañas: el peso de la extensión crecida desbalancea el folículo y se cae el set completo.</li>
            <li>En uñas: el ápice de la estructura se mueve hacia la punta y la uña natural se quiebra con dolor.</li>
            <li>En color / balayage: la raíz se marca y el tono se oxida.</li>
          </ul>
          <p>Un mensaje activador no es una venta insistente: es un <strong>acto de cuidado estético</strong> que tu clienta agradece y que llena tu agenda sin invertir un solo centavo en publicidad.</p>

          <h2>2. ANATOMÍA DEL MENSAJE ACTIVADOR ANTI-SPAM</h2>
          <p><strong>Párrafo 1 (Gancho):</strong> Detiene el scroll en 2 segundos hablando de su estado, de sus pestañas o de sus uñas. Nunca con "Hola, tenemos ofertas".</p>
          <p><strong>Párrafo 2 (La Confidencia):</strong> Empieza siempre por su nombre: <em>"{nombre}"</em>. Presenta el cupo o beneficio como un privilegio VIP.</p>
          <p><strong>Párrafo 3 (Cierre Suave):</strong> Una pregunta de baja fricción que se responda con un "sí".</p>
          <p><strong>Regla de Emojis:</strong> 4 a 5 emojis bien distribuidos con al menos una carita cómplice (👀, 😉, 💅, 🌿, ✨).</p>

          <h2>3. COPYS LISTOS POR ESPECIALIDAD</h2>
          
          <h3>A) PESTAÑAS & LASHISTAS (Retoque 2-3 semanas, Cuidados y Rescate)</h3>
          <div class="box">
            <p><strong>Retoque de Pestañas (Día 16-20):</strong></p>
            <pre>Esos abanicos hermosos están en su punto exacto para retoque... antes de que la gravedad decida por nosotras. 👀\n\n{nombre}, aparté un turno esta semana para rellenar tus extensiones y que sigan viéndose tupidas y simétricas sin pagar un set nuevo. 💅\n\n¿Coordinamos tu espacio? ✨</pre>
            <p class="tip">Tip: Ahorra dinero a la clienta y asegura tu horario antes de que se caiga el 50% del set.</p>
          </div>

          <div class="box">
            <p><strong>Lifting de Pestañas / Cejas (Semana 5-6):</strong></p>
            <pre>Hay una mirada tuya que abre puertas sin decir una sola palabra... y ya está pidiendo renovación. 😌\n\n{nombre}, guardé un espacio especial para tu laminado/lifting antes de que se llenen los fines de semana. 🌿\n\n¿Te aparto este turno? 😉</pre>
          </div>

          <h3>B) UÑAS & MANICURISTAS (Acrílicas, Soft Gel, Semipermanente)</h3>
          <div class="box">
            <p><strong>Retoque de Uñas (Semana 3 / Día 21):</strong></p>
            <pre>Dime que tus uñas no están teniendo esa pequeña crisis de "ya crecí demasiado y me puedo quebrar"... 😂\n\n{nombre}, aparté un huequito esta semana antes de que el crecimiento debilite tu uña natural. Prefiero dejártelas como nuevas antes del finde. 💅\n\n¿Las rescatamos esta semana? 😏</pre>
            <p class="tip">Tip: Habla de salud de la uña natural, no de venderle esmalte.</p>
          </div>

          <div class="box">
            <p><strong>Rescate de Uñas Dormidas (+45 días sin venir):</strong></p>
            <pre>No voy a decir que mis limas y colores extrañan tus manos... pero lo están diciendo. 👀\n\n{nombre}, tengo un regalito sorpresa de spa en cutículas esperándote para cuando vengas a renovar tu set. 🎁\n\n¿Nos vemos esta semana? 💅</pre>
          </div>

          <h3>C) SALONES DE BELLEZA EN GENERAL, COLOR & PELUQUERÍA</h3>
          <div class="box">
            <p><strong>Colorimetría / Balayage / Raíz (Semana 6):</strong></p>
            <pre>Hay algo que tu tono nos está intentando decir... y en el salón lo escuchamos clarito. 👀\n\n{nombre}, guardé un espacio de matiz y nutrición para que ese color vuelva a brillar como el primer día. ✨\n\n¿Pasamos esta semana? 💆‍♀️</pre>
          </div>

          <div class="box">
            <p><strong>Huecos Libres en Días Lentos (Martes / Miércoles):</strong></p>
            <pre>Se acaba de liberar un espacio de oro este miércoles por la tarde que casi nunca tengo disponible. ⚡\n\n{nombre}, te escribo a ti primero porque sé que estabas esperando un momento tranquilo para atenderte sin apuros. 😌\n\n¿Te lo guardo? 🌿</pre>
          </div>

          <h2>4. AUTOMATIZACIÓN CON NILAH</h2>
          <p>No tienes que escribir estos mensajes uno por uno a mano. Con <strong>Nilah IA</strong>, el sistema detecta automáticamente cuándo tu clienta cumple 18 días de pestañas o 21 días de uñas y te prepara el mensaje activador personalizado con un solo clic.</p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Playbook_WhatsApp_Salones_Pestanas_Unas_Martin_Pestana.doc';
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

  // BASE DE COPYS 100% ADAPTADA A SALONES DE BELLEZA, UÑAS Y PESTAÑAS
  const COPYS_SALON: CopyTemplate[] = [
    // ══════════════════════════════════════════
    // 1. RETOQUES Y MANTENIMIENTOS
    // ══════════════════════════════════════════
    {
      id: 'ret-pes-1',
      rubro: 'pestanas',
      category: '1. Retoques y Mantenimientos',
      type: 'Pestañas · Retoque Día 16-21',
      mech: 'Diagnóstico Cómplice',
      msg: `Esos abanicos hermosos están en su punto exacto para retoque... antes de que la gravedad decida por nosotras. 👀\n\n{nombre}, aparté un turno esta semana para rellenar tus extensiones y que sigan viéndose tupidas y simétricas sin pagar un set nuevo. 💅\n\n¿Coordinamos tu espacio? ✨`,
      tip: 'Envíalo entre los días 16 y 19. Ahorra dinero a la clienta y evita que pierda más del 50% de las extensiones.',
      badge: '👁️ Pestañas'
    },
    {
      id: 'ret-una-1',
      rubro: 'unas',
      category: '1. Retoques y Mantenimientos',
      type: 'Uñas · Acrílico / Soft Gel (Día 21)',
      mech: 'Salud & Estructura',
      msg: `Dime que tus uñas no están teniendo esa pequeña crisis de "ya crecí demasiado y me puedo quebrar"... 😂\n\n{nombre}, aparté un huequito esta semana antes de que el peso del crecimiento debilite tu uña natural. Prefiero dejártelas como nuevas antes del finde. 💅\n\n¿Las rescatamos esta semana? 😏`,
      tip: 'Funciona porque apela a la prevención del dolor y quiebre de la uña natural.',
      badge: '💅 Uñas'
    },
    {
      id: 'ret-sal-1',
      rubro: 'salon',
      category: '1. Retoques y Mantenimientos',
      type: 'Salón · Matiz / Color / Balayage (Semana 5-6)',
      mech: 'Efecto Espejo',
      msg: `Hay algo que tu tono nos está tratando de decir... y en el salón lo escuchamos clarito. 👀\n\n{nombre}, guardé un espacio de matiz y nutrición para que ese color vuelva a brillar como el primer día, antes de que el sol oxide los reflejos. 🌿\n\n¿Coordinamos esta semana? 💆‍♀️`,
      tip: 'Ideal para balayage, mechas y rubios que necesitan neutralizar amarillos o hidratar puntas.',
      badge: '💇‍♀️ Salón'
    },
    {
      id: 'ret-cej-1',
      rubro: 'pestanas',
      category: '1. Retoques y Mantenimientos',
      type: 'Cejas & Lifting · Semana 5',
      mech: 'Identidad & Autoestima',
      msg: `Hay una versión tuya que camina diferente, habla diferente y se come el mundo. Esa versión tiene las cejas y pestañas impecables. 😌\n\n{nombre}, moví un turno de lifting/laminado para que puedas venir tranquila esta semana sin apuros. 🌿\n\n¿Lo tomamos? ✨`,
      tip: 'Activa la identidad y la comodidad de despertar lista por las mañanas.',
      badge: '👁️ Pestañas & Cejas'
    },

    // ══════════════════════════════════════════
    // 2. RECORDATORIOS DE CITA & PREPARACIÓN
    // ══════════════════════════════════════════
    {
      id: 'rec-pes-1',
      rubro: 'pestanas',
      category: '2. Recordatorios de Cita 24h & 3h Antes',
      type: 'Pestañas · Recordatorio 24h con Prep',
      mech: 'Autoridad & Preparación',
      msg: `Para que tus extensiones duren semanas y el adhesivo pegue perfecto: recuerda venir sin rímel, sin sombras y con los ojitos limpios. 🌿\n\n{nombre}, tu cita de mañana está confirmada. Si necesitas mover algo avísame hoy temprano así puedo darle el lugar a otra chica. 😌\n\n¡Te espero mañana lista para consentirte! ✨`,
      tip: 'Reduce inasistencias en un 25% y asegura que el servicio comience puntual sin perder tiempo desmaquillando.',
      badge: '👁️ Pestañas'
    },
    {
      id: 'rec-una-1',
      rubro: 'unas',
      category: '2. Recordatorios de Cita 24h & 3h Antes',
      type: 'Uñas · Recordatorio 24h + Cuidado',
      mech: 'Reciprocidad & Compromiso',
      msg: `Ya tengo la mesa desinfectada y los colores listos para tu set de mañana. Hasta el cafecito mental te lo tengo guardado. ☕\n\n{nombre}, te confirmo tu turno de manicura. Si traes una foto de referencia del diseño que te gustó, mándamela ahora así gano tiempo con los materiales. 💅\n\n¡Nos vemos mañana! 🥰`,
      tip: 'Pedir la foto de referencia genera entusiasmo y confirma el compromiso mental de asistir.',
      badge: '💅 Uñas'
    },
    {
      id: 'rec-sal-1',
      rubro: 'salon',
      category: '2. Recordatorios de Cita 24h & 3h Antes',
      type: 'Salón · Aviso 3 Horas Antes',
      mech: 'Cortesía & Ubicación',
      msg: `¡Hola {nombre}! En 3 horitas nos vemos en el salón para tu cambio de look. 💇‍♀️\n\nTe recuerdo que contamos con 10 minutos de tolerancia para no retrasar a la siguiente clienta. La dirección exacta es {direccion}. 📍\n\n¡Ven con tiempo para relajarte! 💆‍♀️`,
      tip: 'Envío automático 3 horas antes. Evita retrasos y refuerza la política de tolerancia con amabilidad.',
      badge: '💇‍♀️ Salón'
    },

    // ══════════════════════════════════════════
    // 3. REACTIVACIÓN DE CLIENTAS INACTIVAS
    // ══════════════════════════════════════════
    {
      id: 'res-pes-45',
      rubro: 'pestanas',
      category: '3. Reactivación y Rescate (45, 75 y 120 Días)',
      type: 'Pestañas · Rescate 45 Días',
      mech: 'Humor Cómplice',
      msg: `No voy a decir que llevo semanas mirando tu sillón vacío... pero lo estoy diciendo. 👀\n\n{nombre}, te guardé un cepillito especial y un espacio preferencial esta semana para renovar tu mirada. 😉🎁\n\n¿Coordinamos esta semana? 💅`,
      tip: 'No hace reclamos de tiempo ni suena necesitado. Es fresco y divertido.',
      badge: '👁️ Pestañas'
    },
    {
      id: 'res-una-75',
      rubro: 'unas',
      category: '3. Reactivación y Rescate (45, 75 y 120 Días)',
      type: 'Uñas · Rescate 75 Días (En riesgo)',
      mech: 'Regalo VIP de Retorno',
      msg: `Hay algo que tenía apartado para ti y se me estaba acumulando el tiempo sin avisarte. 😏\n\n{nombre}, aparté un detalle especial para tu regreso: exfoliación e hidratación profunda de manos gratis en tu próximo set completo. 🎁\n\n¿Cuándo nos consentimos? 💅`,
      tip: 'Ofrece un servicio complementario (spa/hidratación) en lugar de canibalizar tu precio con descuentos agresivos.',
      badge: '💅 Uñas'
    },
    {
      id: 'res-sal-120',
      rubro: 'salon',
      category: '3. Reactivación y Rescate (45, 75 y 120 Días)',
      type: 'Salón · Rescate 120+ Días',
      mech: 'Pattern Interrupt',
      msg: `No te voy a preguntar dónde estuviste. Te voy a decir que en el salón te extrañamos y que te tengo algo para que vuelvas como reina. 🥹\n\n{nombre}, te reservé un 20% de descuento especial en cualquier servicio de cabello o spa este mes. Sin letras chicas, solo para que la vuelta valga doble. 😌\n\n¿La hacemos esta semana? 💇‍♀️`,
      tip: 'Rompe la frialdad tras 4 meses de inactividad con empatía total.',
      badge: '💇‍♀️ Salón'
    },

    // ══════════════════════════════════════════
    // 4. HUECOS LIBRES & DÍAS FLOJOS
    // ══════════════════════════════════════════
    {
      id: 'hue-mar-1',
      rubro: 'general',
      category: '4. Llenar Huecos Libres (Martes & Miércoles)',
      type: 'Martes / Miércoles · Slot Liberado',
      mech: 'FOMO Real & Confidencia',
      msg: `Se acaba de liberar un espacio de oro este miércoles por la tarde que casi nunca tengo disponible. ⚡\n\n{nombre}, te escribo a ti primero antes de publicarlo en historias porque sé que te gusta atenderte con calma y sin ruido en el estudio. 😌\n\n¿Te lo guardo para ti? 💅`,
      tip: 'Hacer sentir a la clienta que tiene prioridad absoluta sobre las redes sociales multiplica la tasa de respuesta.',
      badge: '⚡ Días Flojos'
    },
    {
      id: 'hue-can-1',
      rubro: 'general',
      category: '4. Llenar Huecos Libres (Martes & Miércoles)',
      type: 'Cancelación de Último Minuto (Mismo Día)',
      mech: 'Oportunidad Relámpago',
      msg: `¡Alerta de turno sorpresa! Una clienta tuvo una emergencia y me quedó un hueco libre hoy a las 4:00 PM. 👀\n\n{nombre}, si estabas pensando en hacerte las uñas/pestañas hoy mismo, este turno tiene tu nombre escrito. 🎁\n\n¿Te vienes hoy? 😌`,
      tip: 'Mándalo solo a 3 o 4 clientas frecuentes de confianza para llenarlo en 10 minutos.',
      badge: '⚡ Mismo Día'
    },

    // ══════════════════════════════════════════
    // 5. PROMOCIONALES VIP, COMBOS & CUMPLEAÑOS
    // ══════════════════════════════════════════
    {
      id: 'pro-cum-1',
      rubro: 'general',
      category: '5. Cumpleaños & Combos de Alto Ticket',
      type: 'Cumpleaños · Mes Completo',
      mech: 'Identidad + Celebración',
      msg: `Solo las reinas merecen que su mes de cumpleaños empiece con mimos desde el primer día. 🎂👑\n\n{nombre}, guardé tu regalo de cumpleaños del salón: 20% de descuento en tu servicio favorito durante todo tu mes. Lo aparté desde hoy para ti. 🎁✨\n\n¿Empezamos tu mes como te mereces? 🥳`,
      tip: 'Envíalo el día 1 del mes del cumpleaños para que agende con anticipación.',
      badge: '🎂 Cumpleaños'
    },
    {
      id: 'pro-com-1',
      rubro: 'pestanas',
      category: '5. Cumpleaños & Combos de Alto Ticket',
      type: 'Combo Dúo: Pestañas + Cejas',
      mech: 'Upgrade de Ticket',
      msg: `Hay una combinación que te ahorra 40 minutos frente al espejo todas las mañanas: cejas laminadas + volumen en pestañas. 😌\n\n{nombre}, este mes abrí solo 5 cupos para el combo completo con el perfilado de regalo. Te guardé uno a ti. ✨\n\n¿Nos vemos esta semana? 💅`,
      tip: 'Eleva el ticket promedio hasta un 45% sin duplicar el tiempo de atención.',
      badge: '👁️ Pestañas + Cejas'
    },

    // ══════════════════════════════════════════
    // 6. POST-SERVICIO & CUIDADO EN CASA
    // ══════════════════════════════════════════
    {
      id: 'pos-pes-1',
      rubro: 'pestanas',
      category: '6. Post-Servicio & Cuidado en Casa',
      type: 'Pestañas · 24h Después del Set',
      mech: 'Servicio 5 Estrellas',
      msg: `¡Hola {nombre}! Paso rápido a recordarte los 3 mandamientos de tus pestañas hoy: 1️⃣ No mojarlas en 24h, 2️⃣ Cepillarlas en seco de medios a puntas, 3️⃣ Dormir boca arriba como reina. 👑✨\n\nCualquier duda que tengas me escribes aquí directo. ¡Disfruta tu mirada! 💅`,
      tip: 'Enviarlo 2 horas después de la cita fideliza a la clienta y reduce quejas por mala retención.',
      badge: '👁️ Pestañas'
    },
    {
      id: 'pos-una-1',
      rubro: 'unas',
      category: '6. Post-Servicio & Cuidado en Casa',
      type: 'Uñas · 48h Después del Servicio',
      mech: 'Cuidado & Fidelización',
      msg: `¡Hola {nombre}! ¿Cómo se sienten esas uñitas hermosas hoy? 💅\n\nRecuerda usar aceite de cutículas por las noches y no usarlas como herramientas para abrir latas 😂. ¡Cuídalas que quedaron soñadas!\n\nUn abrazo inmenso. ✨`,
      tip: 'Genera cercanía humana y demuestra que te importa la durabilidad del trabajo.',
      badge: '💅 Uñas'
    }
  ];

  const filteredCopys = COPYS_SALON.filter(copy => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'pestanas') return copy.rubro === 'pestanas' || copy.rubro === 'general';
    if (activeFilter === 'unas') return copy.rubro === 'unas' || copy.rubro === 'general';
    if (activeFilter === 'salon') return copy.rubro === 'salon' || copy.rubro === 'general';
    return true;
  });

  // Agrupación por categoría
  const categories = Array.from(new Set(filteredCopys.map(c => c.category)));

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      isDark 
        ? 'bg-[#0a0a10] text-slate-100 selection:bg-purple-500 selection:text-white' 
        : 'bg-slate-100/90 text-slate-900 selection:bg-purple-200 selection:text-purple-900'
    } print:bg-white print:text-black`}>

      {/* ── BARRA DE PROGRESO ── */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 z-50 transition-all duration-150 print:hidden"
        style={{ width: `${readProgress}%` }}
      />

      {/* ── HEADER DE NAVEGACIÓN SUPERIOR MOBILE-FIRST (FIJO) ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2.5 sm:py-3 flex items-center justify-between transition-colors print:hidden ${
        isDark ? 'bg-[#0f111a]/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 shadow-2xs text-slate-900'
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 truncate">Playbook Salones</p>
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">Mensajes Activadores</h2>
          </div>
        </div>

        {/* ACCIONES DE DESCARGA & TEMA */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isDark ? 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-slate-800' : 'bg-slate-100 border-slate-300 text-purple-700 hover:bg-slate-200'
            }`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownloadWord}
            disabled={isGeneratingDocx}
            title="Descargar en formato Word (.doc)"
            className={`hidden sm:inline-flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-blue-950/40 hover:bg-blue-900/60 border-blue-700/50 text-blue-300'
                : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
            }`}
          >
            {isGeneratingDocx ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3 text-blue-500" />}
            <span className="text-[11px]">Word</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
          >
            {isGeneratingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span className="text-[11px]">PDF</span>
          </button>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <main ref={contentRef} className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        
        {/* ═══════════════════════════════ 1. PORTADA ═══════════════════════════════ */}
        <section className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 border transition-all ${
          isDark 
            ? 'bg-gradient-to-br from-[#1a102a] via-[#120d1c] to-[#0a0812] border-purple-900/40 text-white' 
            : 'bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-950 text-white border-purple-800 shadow-2xl shadow-purple-900/20'
        } print:bg-none print:border-none print:p-0 print:text-black`}>
          
          <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Especial Salones · Uñas · Pestañas · Cejas</span>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
              Guía Práctica de WhatsApp Marketing
            </p>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
              El Playbook de <br />
              <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-200 to-amber-200">
                Mensajes Activadores
              </span> <br />
              para Salones de Belleza
            </h1>

            <p className="text-sm sm:text-base text-purple-100 font-medium leading-relaxed max-w-2xl">
              Deja de mandar <em>«Hola hermosa, tenemos 20% de descuento»</em> y quedar en visto. Aprende los guiones exactos que paran el scroll, aseguran los retoques a tiempo y llenan tu agenda sin sonar a spam.
            </p>

            {/* Rubros pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-purple-100 font-semibold flex items-center gap-1.5">
                <span>👁️</span> Lashistas & Extensiones
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-purple-100 font-semibold flex items-center gap-1.5">
                <span>💅</span> Manicuristas & Nail Art
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-purple-100 font-semibold flex items-center gap-1.5">
                <span>💇‍♀️</span> Peluquería, Color & Cejas
              </span>
            </div>

            {/* Estadísticas clave */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm text-center mt-4">
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-pink-300">~98%</span>
                <span className="text-[11px] text-purple-100 font-bold">Apertura en WhatsApp</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-purple-200">Día 21</span>
                <span className="text-[11px] text-purple-100 font-bold">Momento de Oro Retoque</span>
              </div>
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-emerald-300">40-60%</span>
                <span className="text-[11px] text-purple-100 font-bold">Tasa de Respuesta</span>
              </div>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════ 2. FILTROS POR ESPECIALIDAD ═══════════════════════════════ */}
        <section className="space-y-3 print:hidden">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-500" /> Filtra por tu especialidad
            </span>
            <span className="text-xs text-slate-500 font-bold">{filteredCopys.length} plantillas disponibles</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                activeFilter === 'all'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
                  : isDark
                    ? 'bg-[#12141c] border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-purple-50'
              }`}
            >
              🌟 Todos los mensajes
            </button>
            <button
              onClick={() => setActiveFilter('pestanas')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                activeFilter === 'pestanas'
                  ? 'bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-600/20'
                  : isDark
                    ? 'bg-[#12141c] border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-pink-50'
              }`}
            >
              👁️ Solo Pestañas & Cejas
            </button>
            <button
              onClick={() => setActiveFilter('unas')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                activeFilter === 'unas'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                  : isDark
                    ? 'bg-[#12141c] border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50'
              }`}
            >
              💅 Solo Uñas & Manicura
            </button>
            <button
              onClick={() => setActiveFilter('salon')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                activeFilter === 'salon'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : isDark
                    ? 'bg-[#12141c] border-slate-800 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50'
              }`}
            >
              💇‍♀️ Salón de Belleza & Color
            </button>
          </div>
        </section>

        {/* ═══════════════════════════════ 3. COMPARATIVA ANTI-SPAM ═══════════════════════════════ */}
        <section className={`p-6 sm:p-8 rounded-3xl border transition-all ${
          isDark ? 'bg-[#12141c] border-slate-800 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
        }`}>
          <div className="mb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-600">Diagnóstico Real</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
              Por qué tus mensajes en WhatsApp terminaban en "Visto"
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              El cerebro de tu clienta detecta un mensaje promocional en 0.3 segundos. Si suena a publicidad masiva, te ignora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MENSAJE SPAM */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                <span>❌ El mensaje típico de salón (Spam):</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/30 text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                «Hola hermosa! 👋 Tenemos 20% de descuento en uñas acrílicas y pestañas por este mes. No te quedes sin tu cita, agenda ya al 987654321. Te esperamos! 💅✨💖»
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                ⚠️ Resultado: Visto, te devalúa como profesional y parece enviado a 500 personas a la vez.
              </p>
            </div>

            {/* MENSAJE ACTIVADOR */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>✅ El Mensaje Activador Nilah:</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                «Esos abanicos hermosos están en su punto exacto para retoque... antes de que la gravedad decida por nosotras. 👀<br/><br/>
                Sofía, aparté un turno esta semana para rellenar tus extensiones y que sigan viéndose tupidas sin pagar un set nuevo. 💅<br/><br/>
                ¿Coordinamos tu espacio? ✨»
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                ✨ Resultado: Abre conversación, habla de su beneficio real y genera respuesta en minutos.
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════ 4. LISTA DE COPYS AGRUPADOS ═══════════════════════════════ */}
        <section className="space-y-8">
          {categories.map((catTitle, idx) => {
            const copysInCat = filteredCopys.filter(c => c.category === catTitle);
            if (copysInCat.length === 0) return null;

            return (
              <div key={idx} className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2 border-slate-200 dark:border-slate-800">
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 font-black text-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {catTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Toca el botón para copiar la plantilla lista con un clic.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {copysInCat.map((copy) => (
                    <motion.div
                      key={copy.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-5 rounded-3xl border flex flex-col justify-between transition-all ${
                        isDark 
                          ? 'bg-[#12141c] border-slate-800 hover:border-purple-800/80 shadow-md' 
                          : 'bg-white border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                            {copy.badge || copy.rubro}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 font-mono">
                            {copy.mech}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2">
                          {copy.type}
                        </h4>

                        {/* WhatsApp Bubble Preview */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-sans whitespace-pre-line select-all">
                          {copy.msg}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-2.5 leading-snug">
                          💡 <strong>Consejo:</strong> {copy.tip}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => handleCopy(copy.msg, copy.id)}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                            copiedId === copy.id
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20'
                          }`}
                        >
                          {copiedId === copy.id ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-200" />
                              <span>¡Plantilla copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar mensaje activador</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* ═══════════════════════════════ 5. CTA DE AUTOMATIZACIÓN ═══════════════════════════════ */}
        <section className={`p-8 sm:p-10 rounded-3xl text-center space-y-5 border transition-all relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-b from-[#1c122c] via-[#120e1a] to-[#0a0810] border-purple-800/40 text-white' 
            : 'bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-950 text-white border-purple-800 shadow-2xl shadow-purple-900/20'
        }`}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-black uppercase tracking-wider">
            <span>✨</span> No los mandes a mano uno por uno
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight max-w-xl mx-auto leading-tight">
            Nilah automatiza estos mensajes según la fecha de servicio de cada clienta.
          </h2>

          <p className="text-xs sm:text-sm text-purple-100 max-w-md mx-auto leading-relaxed">
            El sistema detecta cuándo tu clienta llega al día 18 de pestañas o 21 de acrílico y te deja el mensaje activador listo con su nombre para enviarlo en un toque.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/login?tab=register"
              className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
            >
              <Zap size={16} className="fill-slate-950" />
              <span>Probar gratis en mi salón</span>
            </a>

            <Link
              to="/ebooks/de-aprendiz-a-duena"
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all text-center"
            >
              <BookOpen size={15} />
              <span>Leer también: Ebook De Aprendiz a Dueña</span>
            </Link>
          </div>

          <p className="text-[11px] text-purple-200/80 pt-2">
            Gratis hasta 100 clientas · Sin tarjeta · Hecho para lashistas y manicuristas
          </p>
        </section>

        {/* ── FOOTER ── */}
        <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Nilah IA · Martín Pestana · WhatsApp Marketing para Salones.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="hover:text-purple-600 font-bold cursor-pointer"
          >
            Volver arriba ↑
          </button>
        </footer>

      </main>

    </div>
  );
};

export default PlaybookLanding;
