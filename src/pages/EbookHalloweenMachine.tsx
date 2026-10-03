import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Download, Check, Copy, Moon, Sun, Loader2, Sparkles, 
  BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText, 
  ChevronRight, Share2, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Users, Smartphone, Zap, Sparkle, Lightbulb, DollarSign,
  List, X, Gift, Award, Repeat, Eye, Star, Calendar, Flame, Ghost,
  Layers, Lock, CheckCheck, Sparkles as SparklesIcon
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface CopyMessage {
  id: string;
  categoria: string;
  categoryKey: 'unas' | 'pestanas' | 'cejas' | 'combos' | 'reactivacion';
  titulo: string;
  subtitulo: string;
  tag: string;
  headerStyle: {
    color: string;
    bgBadge: string;
    borderBadge: string;
    glowBorder: string;
    accentColor: string;
  };
  burbuja1: string;
  burbuja2: string;
  explicacion: string;
}

const COPYS_HALLOWEEN: CopyMessage[] = [
  // ──────────────────────────────────────────
  // 💅 SERVICIO: UÑAS & MANICURA (3 COPYS)
  // ──────────────────────────────────────────
  {
    id: 'copy-unas-1',
    categoria: '💅 PARA CLIENTAS DE UÑAS',
    categoryKey: 'unas',
    titulo: 'Manos sobrias & neutras para salir de fiesta',
    subtitulo: 'Para asegurar las citas de la tarde antes de que se llenen por el 31',
    tag: 'Tonos Sobrios & Elegantes',
    headerStyle: {
      color: 'text-lime-500 dark:text-lime-400',
      bgBadge: 'bg-lime-500/10 dark:bg-lime-950/40',
      borderBadge: 'border-lime-500/30',
      glowBorder: 'border-lime-500/30 shadow-lime-500/5',
      accentColor: 'text-lime-600 dark:text-lime-400'
    },
    burbuja1: 'Resolver el look de fiesta a última hora siempre termina en uñas a medio hacer o sin cita 🪩',
    burbuja2: 'Camila, varias ya están asegurando sus manos en tonos neutros o sobrios para bailar el 31 y seguir impecables el fin de semana 🖤 ¿Te guardo un espacio antes de que se llenen los turnos de la tarde? ✨',
    explicacion: 'Toca el dolor del apuro a última hora y usa prueba social sutil ("varias ya están asegurando sus manos").'
  },
  {
    id: 'copy-unas-2',
    categoria: '💅 PARA CLIENTAS DE UÑAS',
    categoryKey: 'unas',
    titulo: 'Otoño Chic (Burdeos, carey & calabaza quemada)',
    subtitulo: 'Para clientas que aman la temporada otoñal sin disfraces infantiles',
    tag: 'Temporada Otoñal',
    headerStyle: {
      color: 'text-lime-500 dark:text-lime-400',
      bgBadge: 'bg-lime-500/10 dark:bg-lime-950/40',
      borderBadge: 'border-lime-500/30',
      glowBorder: 'border-lime-500/30 shadow-lime-500/5',
      accentColor: 'text-lime-600 dark:text-lime-400'
    },
    burbuja1: 'No voy a decir que tus manos ya están pidiendo cambio de temporada... pero casi 🍂💅',
    burbuja2: 'Camila, llegaron los esmaltes borgoña profundo y carey para este mes y me acordé de tu estilo al toque. 🍷 ¿Te reservo tu espacio de esta semana para dejártelas impecables antes del fin de mes? ✨',
    explicacion: 'Efecto Zeigarnik en la primera burbuja y trato de confidencia exclusiva en la segunda.'
  },
  {
    id: 'copy-unas-3',
    categoria: '💅 PARA CLIENTAS DE UÑAS',
    categoryKey: 'unas',
    titulo: 'Nail Art Temático / Micro-fantasmas & French Dark',
    subtitulo: 'Edición limitada de 6 cupos exclusivos con diseño para la noche de brujas',
    tag: 'Nail Art Exclusivo',
    headerStyle: {
      color: 'text-lime-500 dark:text-lime-400',
      bgBadge: 'bg-lime-500/10 dark:bg-lime-950/40',
      borderBadge: 'border-lime-500/30',
      glowBorder: 'border-lime-500/30 shadow-lime-500/5',
      accentColor: 'text-lime-600 dark:text-lime-400'
    },
    burbuja1: 'Si vas a tener evento este fin de semana largo de Halloween, esto te interesa antes de que se cope la agenda 🎃👻',
    burbuja2: 'Camila, abrimos solo 6 turnos especiales para diseño temático (french dark, micro-telas de araña y efecto cromado). ¿Quieres que te asegure uno de los cupos antes de que vuelen? 🕸️🖤',
    explicacion: 'Escasez estricta (6 cupos) que despierta urgencia de respuesta inmediata.'
  },

  // ──────────────────────────────────────────
  // 👁️ SERVICIO: PESTAÑAS (3 COPYS)
  // ──────────────────────────────────────────
  {
    id: 'copy-pestanas-1',
    categoria: '👁️ PARA CLIENTAS DE PESTAÑAS',
    categoryKey: 'pestanas',
    titulo: 'Mirada intacta toda la fiesta (Cero rímel ni postizas)',
    subtitulo: 'Para salir a bailar el 31 sin preocuparse por maquillaje corrido',
    tag: 'Efecto Fiesta Intacto',
    headerStyle: {
      color: 'text-purple-500 dark:text-purple-400',
      bgBadge: 'bg-purple-500/10 dark:bg-purple-950/40',
      borderBadge: 'border-purple-500/30',
      glowBorder: 'border-purple-500/30 shadow-purple-500/5',
      accentColor: 'text-purple-600 dark:text-purple-400'
    },
    burbuja1: 'Maquillarse los ojos para salir a bailar y que dure intacto toda la noche casi nunca pasa 👁️🪩',
    burbuja2: 'Valentina, varias ya están asegurando sus pestañas para salir de fiesta el 31 con la mirada lista y sin preocuparse por el rímel o postizas que se despegan 🥂 ¿Te reservo un espacio antes del feriado? ✨',
    explicacion: 'Ataca un dolor real y universal: el rímel manchado y el estrés de las pestañas despegadas en plena fiesta.'
  },
  {
    id: 'copy-pestanas-2',
    categoria: '👁️ PARA CLIENTAS DE PESTAÑAS',
    categoryKey: 'pestanas',
    titulo: 'Retoque preventivo de mantenimiento (Día 16 a 21)',
    subtitulo: 'Para llegar a las celebraciones con volumen tupido y sin huecos',
    tag: 'Mantenimiento Preventivo',
    headerStyle: {
      color: 'text-purple-500 dark:text-purple-400',
      bgBadge: 'bg-purple-500/10 dark:bg-purple-950/40',
      borderBadge: 'border-purple-500/30',
      glowBorder: 'border-purple-500/30 shadow-purple-500/5',
      accentColor: 'text-purple-600 dark:text-purple-400'
    },
    burbuja1: 'No quiero que te pase lo de siempre cuando todas quieren cita de retoque el mismo día 29... ⏳👀',
    burbuja2: 'Valentina, tus pestañas ya están en sus días ideales de mantenimiento. Para que llegues al 31 con efecto súper tupido y sin prisas, abrí agenda anticipada. 🪄 ¿Qué día de esta semana te acomoda mejor?',
    explicacion: 'Marco de pérdida suave: previene quedarse sin horario y llegar con pestañas deterioradas.'
  },
  {
    id: 'copy-pestanas-3',
    categoria: '👁️ PARA CLIENTAS DE PESTAÑAS',
    categoryKey: 'pestanas',
    titulo: 'Lifting de Pestañas + Tinte Negro Intenso',
    subtitulo: 'Para clientas naturales que quieren efecto máscara de pestañas 24/7',
    tag: 'Lifting Natural & Tinte',
    headerStyle: {
      color: 'text-purple-500 dark:text-purple-400',
      bgBadge: 'bg-purple-500/10 dark:bg-purple-950/40',
      borderBadge: 'border-purple-500/30',
      glowBorder: 'border-purple-500/30 shadow-purple-500/5',
      accentColor: 'text-purple-600 dark:text-purple-400'
    },
    burbuja1: 'Un secretito rápido para olvidarte del rizador durante todas las salidas de este mes... 🤫✨',
    burbuja2: 'Valentina, abrimos turnos para Lifting + Baño de color negro noche para que te despiertes con las pestañas arqueadas e intensas todo octubre. 🖤 ¿Te gustaría coordinar tu sesión para esta semana?',
    explicacion: 'Vende el beneficio del "cero esfuerzo al arreglarse" durante semanas completas.'
  },

  // ──────────────────────────────────────────
  // ✨ SERVICIOS CRUZADOS / COMBOS (3 COPYS)
  // ──────────────────────────────────────────
  {
    id: 'copy-combos-1',
    categoria: '✨ COMBO COMPLETO (UÑAS + PESTAÑAS)',
    categoryKey: 'combos',
    titulo: 'El turno doble "Todo en Una Sola Visita"',
    subtitulo: 'Para salir con todo listo sin perder dos tardes diferentes',
    tag: 'Combo Uñas + Pestañas',
    headerStyle: {
      color: 'text-amber-500 dark:text-amber-400',
      bgBadge: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderBadge: 'border-amber-500/30',
      glowBorder: 'border-amber-500/30 shadow-amber-500/5',
      accentColor: 'text-amber-600 dark:text-amber-400'
    },
    burbuja1: 'El 31 los planes salen solos, pero encontrar turno para arreglarse el mismo día es casi imposible 🍸👗',
    burbuja2: 'Sofía, casi todos los turnos previos al fin de semana de fiesta ya se están llenando con citas dobles de uñas y pestañas para salir a celebrar con todo listo en una sola visita 💃 ¿Te aparto uno de esos cupos? 💫',
    explicacion: 'El copy rey de la conversión: resuelve la falta de tiempo y duplica tu ticket promedio.'
  },
  {
    id: 'copy-combos-2',
    categoria: '✨ COMBO COMPLETO (UÑAS + PESTAÑAS)',
    categoryKey: 'combos',
    titulo: 'Upgrade a clienta de pestañas para sumar manos con mimo de regalo',
    subtitulo: 'Ofrece el servicio secundario sumando una exfoliación express gratis',
    tag: 'Cross-Selling + Mimo',
    headerStyle: {
      color: 'text-amber-500 dark:text-amber-400',
      bgBadge: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderBadge: 'border-amber-500/30',
      glowBorder: 'border-amber-500/30 shadow-amber-500/5',
      accentColor: 'text-amber-600 dark:text-amber-400'
    },
    burbuja1: 'Te tengo un plan para ahorrarte dos salidas al salón antes de Halloween... 🎃🍁',
    burbuja2: 'Sofía, como ya tienes tu turno de pestañas, te bloqueé el horario continuo para hacerte manicura y te incluimos de regalo el spa de hidratación de miel. 🍯 ¿Te sumamos las uñas para que salgas 100% lista?',
    explicacion: 'Muestra proactividad ("ya te bloqueé el horario continuo") y añade un detalle de regalo.'
  },
  {
    id: 'copy-combos-3',
    categoria: '✨ COMBO COMPLETO (UÑAS + PESTAÑAS)',
    categoryKey: 'combos',
    titulo: 'Duo Festivo Manicura + Pedicura Spa',
    subtitulo: 'Para eventos donde usarán sandalias, tacones abiertos o vestimentas completas',
    tag: 'Duo Manos & Pies Spa',
    headerStyle: {
      color: 'text-amber-500 dark:text-amber-400',
      bgBadge: 'bg-amber-500/10 dark:bg-amber-950/40',
      borderBadge: 'border-amber-500/30',
      glowBorder: 'border-amber-500/30 shadow-amber-500/5',
      accentColor: 'text-amber-600 dark:text-amber-400'
    },
    burbuja1: 'A veces nos enfocamos solo en las manos y los pies quedan en el olvido para la fiesta... 🦶✨',
    burbuja2: 'Sofía, armamos el paquete Manos & Pies Spa con sales relajantes de lavanda para que tus pies descansen antes de bailar el 31. Quedan 4 turnos dobles. ¿Te reservo uno para este fin de semana? 🕯️🤍',
    explicacion: 'Despierta una necesidad olvidada antes de eventos con calzado de fiesta.'
  },

  // ──────────────────────────────────────────
  // 🧙‍♀️ SERVICIO: CEJAS & MIRADA (3 COPYS)
  // ──────────────────────────────────────────
  {
    id: 'copy-cejas-1',
    categoria: '🧙‍♀️ PARA CLIENTAS DE CEJAS',
    categoryKey: 'cejas',
    titulo: 'Laminado + Perfilado HD para fotos impecables',
    subtitulo: 'Cejas peinadas, definidas y simétricas para destacar en cualquier iluminación',
    tag: 'Laminado HD',
    headerStyle: {
      color: 'text-fuchsia-500 dark:text-fuchsia-400',
      bgBadge: 'bg-fuchsia-500/10 dark:bg-fuchsia-950/40',
      borderBadge: 'border-fuchsia-500/30',
      glowBorder: 'border-fuchsia-500/30 shadow-fuchsia-500/5',
      accentColor: 'text-fuchsia-600 dark:text-fuchsia-400'
    },
    burbuja1: 'El marco de la cara para las fotos del 31 no se improvisa 10 minutos antes de salir... 📸🕯️',
    burbuja2: 'Luciana, abrimos citas para Laminado de Cejas + Perfilado orgánico para que enmarques tu mirada sin tener que pintarte todos los días. 🪄 ¿Te aseguro tu lugar antes de que se acaben los turnos?',
    explicacion: 'Enfocado en el resultado fotográfico del fin de semana festivo.'
  },
  {
    id: 'copy-cejas-2',
    categoria: '🧙‍♀️ PARA CLIENTAS DE CEJAS',
    categoryKey: 'cejas',
    titulo: 'Sombreado semipermanente con Henna / Tinte Híbrido',
    subtitulo: 'Para clientas con cejas poco pobladas que quieren densidad durante las fiestas',
    tag: 'Henna & Definición',
    headerStyle: {
      color: 'text-fuchsia-500 dark:text-fuchsia-400',
      bgBadge: 'bg-fuchsia-500/10 dark:bg-fuchsia-950/40',
      borderBadge: 'border-fuchsia-500/30',
      glowBorder: 'border-fuchsia-500/30 shadow-fuchsia-500/5',
      accentColor: 'text-fuchsia-600 dark:text-fuchsia-400'
    },
    burbuja1: 'Un dato para no estar rellenando las cejas con sombra en medio de la fiesta... ⏳👁️',
    burbuja2: 'Luciana, nos llegaron los nuevos pigmentos de tinte híbrido que dan efecto sombreado natural y duran impecables más de 10 días. 🤎 ¿Te aparto una cita para definírtelas esta semana?',
    explicacion: 'Destaca la novedad del producto y la comodidad de duración.'
  },
  {
    id: 'copy-cejas-3',
    categoria: '🧙‍♀️ PARA CLIENTAS DE CEJAS',
    categoryKey: 'cejas',
    titulo: 'Combo Total Mirada: Pestañas + Cejas HD',
    subtitulo: 'La combinación perfecta para transformar el rostro por completo',
    tag: 'Mirada 360°',
    headerStyle: {
      color: 'text-fuchsia-500 dark:text-fuchsia-400',
      bgBadge: 'bg-fuchsia-500/10 dark:bg-fuchsia-950/40',
      borderBadge: 'border-fuchsia-500/30',
      glowBorder: 'border-fuchsia-500/30 shadow-fuchsia-500/5',
      accentColor: 'text-fuchsia-600 dark:text-fuchsia-400'
    },
    burbuja1: 'Si vas a producirte para este fin de mes, tu mirada tiene que ser el centro de atención 👑✨',
    burbuja2: 'Luciana, preparamos el Combo Mirada de Impacto: extensión o lifting + diseño de cejas en una sola sesión express de 1 hora y media. ¿Te gustaría coordinar un turno para esta semana? 👁️💅',
    explicacion: 'Menciona el tiempo exacto (1h 30m) para derribar la objeción de "no tengo tiempo".'
  },

  // ──────────────────────────────────────────
  // 🧟‍♀️ REACTIVACIÓN (+45 A +90 DÍAS AUSENTES)
  // ──────────────────────────────────────────
  {
    id: 'copy-reactivacion-1',
    categoria: '🧟‍♀️ REACTIVACIÓN DE CLIENTAS (+45 DÍAS)',
    categoryKey: 'reactivacion',
    titulo: 'La nostalgia del espacio vacío & reconexión sincera',
    subtitulo: 'Para clientas queridas que se alejaron simplemente por la rutina diaria',
    tag: 'Nostalgia & Cariño',
    headerStyle: {
      color: 'text-rose-500 dark:text-rose-400',
      bgBadge: 'bg-rose-500/10 dark:bg-rose-950/40',
      borderBadge: 'border-rose-500/30',
      glowBorder: 'border-rose-500/30 shadow-rose-500/5',
      accentColor: 'text-rose-600 dark:text-rose-400'
    },
    burbuja1: 'No voy a decir que llevo semanas mirando tu espacio vacío en el salón... pero sí 🥹🤍',
    burbuja2: 'Mariana, hace tiempito que no nos vemos y con el movimiento de octubre me acordé mucho de tus visitas. Te guardé un detalle especial de bienvenida si pasas este mes. ☕ ¿Cómo has estado? ¿Te gustaría pasar a consentirte?',
    explicacion: 'Cero reclamo, máxima empatía: reconoce el tiempo transcurrido sin sonar demandante.'
  },
  {
    id: 'copy-reactivacion-2',
    categoria: '🧟‍♀️ REACTIVACIÓN DE CLIENTAS (+45 DÍAS)',
    categoryKey: 'reactivacion',
    titulo: 'Prioridad VIP antes de abrir la agenda general de fin de año',
    subtitulo: 'Posiciona la reactivación como un privilegio exclusivo de horario',
    tag: 'Prioridad de Horario',
    headerStyle: {
      color: 'text-rose-500 dark:text-rose-400',
      bgBadge: 'bg-rose-500/10 dark:bg-rose-950/40',
      borderBadge: 'border-rose-500/30',
      glowBorder: 'border-rose-500/30 shadow-rose-500/5',
      accentColor: 'text-rose-600 dark:text-rose-400'
    },
    burbuja1: 'Octubre es el mes perfecto para retomar los mimos que dejamos en pausa... 🎃🍂',
    burbuja2: 'Mariana, vi que hace unos meses no venías y quise escribirte antes de lanzar los cupos generales de Halloween para darte prioridad de horario si quieres consentirte esta semana. ¿Te gustaría retomar tus citas? 💆‍♀️✨',
    explicacion: 'Crea valor al ofrecer preferencia de horario antes del colapso de fechas festivas.'
  },
  {
    id: 'copy-reactivacion-3',
    categoria: '🧟‍♀️ REACTIVACIÓN DE CLIENTAS (+45 DÍAS)',
    categoryKey: 'reactivacion',
    titulo: 'Micro-compromiso sin presión (Respuesta con un Emoji)',
    subtitulo: 'Para clientas muy frías que llevan más de 3 meses sin responder',
    tag: 'Cero Fricción · Emoji',
    headerStyle: {
      color: 'text-rose-500 dark:text-rose-400',
      bgBadge: 'bg-rose-500/10 dark:bg-rose-950/40',
      borderBadge: 'border-rose-500/30',
      glowBorder: 'border-rose-500/30 shadow-rose-500/5',
      accentColor: 'text-rose-600 dark:text-rose-400'
    },
    burbuja1: 'Pregunta rápida y sin compromiso para este mes de brujitas... 🧙‍♀️🔮',
    burbuja2: 'Mariana, ¿este mes tienes ganas de consentirte con uñas o pestañas para salir, o andas a full con el trabajo? Respóndeme solo con un "💅" o un "☕" y te cuento qué horarios tranquilos tengo. 😊',
    explicacion: 'Baja la barrera de respuesta a un solo toque en pantalla.'
  }
];

export const EbookHalloweenMachine: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<string>('intro');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isGeneratingDocx, setIsGeneratingDocx] = useState<boolean>(false);
  const [readProgress, setReadProgress] = useState<number>(0);
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'La Máquina de Halloween | Guía de 4 Semanas para Llenar tu Salón — Martín Pestana';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setReadProgress(Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100)));
      }

      const chapters = ['intro', 'cap1', 'cap2', 'cap3', 'cap4', 'cierre'];
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
          <title>La Máquina de Halloween - Martín Pestana</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
            h1 { color: #ea580c; font-size: 26pt; line-height: 1.2; margin-bottom: 6px; }
            h2 { color: #c2410c; font-size: 17pt; margin-top: 24pt; border-bottom: 2px solid #fed7aa; padding-bottom: 4pt; page-break-before: always; }
            h3 { color: #9a3412; font-size: 13pt; margin-top: 14pt; }
            p { font-size: 11pt; margin-bottom: 10pt; text-align: justify; }
            blockquote { background: #fff7ed; border-left: 4px solid #ea580c; padding: 12px; margin: 16px 0; font-style: italic; color: #7c2d12; }
            .badge { background: #ffedd5; color: #c2410c; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 14px 0; }
            .script-box { background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #d97706; padding: 12px; margin: 12px 0; font-family: 'Segoe UI', sans-serif; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="badge">LEAD MAGNET ESTRATÉGICO · EDICIÓN HALLOWEEN</p>
            <h1>La Máquina de Halloween: La Guía de 4 Semanas para Llenar tu Salón sin Bajar Precios</h1>
            <p style="font-size: 13pt; color: #64748b; font-weight: bold;">Estrategia de ofertas, calendario de mensajes y Biblioteca de Copys de WhatsApp</p>
            <p style="font-size: 10.5pt; color: #475569;">Por <strong>Martín Pestana</strong> — Ex-Administrador de Salón & Creador de Nilah IA</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>

          <h2>Capítulo 1: El Gran Error de Octubre (La psicología de la clienta)</h2>
          <p>Llega el 1ero de octubre y el 90% de los salones cometen el error de mandar descuentos del 20% en todo. Destruyen su margen y atraen clientas que no vuelven. La clave es vender <em>Combos de Alto Valor</em> que resuelvan la necesidad de verse impecable en sus eventos sin bajar tarifas.</p>

          <h2>Capítulo 2: El Calendario Estratégico de Octubre (Semana a Semana)</h2>
          <p><strong>Semana 1 (1 al 7):</strong> Calentamiento y apertura de cupos limitados.<br/>
          <strong>Semana 2 (8 al 15):</strong> Campaña de Reactivación a clientas con +45 días.<br/>
          <strong>Semana 3 (16 al 23):</strong> Ofertas de Combos Cruzados (Pestañas + Uñas).<br/>
          <strong>Semana 4 (24 al 31):</strong> Urgencia y FOMO de últimos 4 turnos.</p>

          <h2>Capítulo 3: Biblioteca de Copys de WhatsApp (Método de los Activadores)</h2>
          ${COPYS_HALLOWEEN.map(c => `
            <div class="script-box">
              <p><strong>${c.categoria} — ${c.titulo}</strong></p>
              <p><em>Burbuja 1 (Gancho):</em> ${c.burbuja1}</p>
              <p><em>Burbuja 2 (Confidencia + Cierre):</em> ${c.burbuja2}</p>
              <p><small style="color: #64748b;">${c.explicacion}</small></p>
            </div>
          `).join('')}

          <h2>Capítulo 4: Manual vs. Automático con Nilah IA</h2>
          <p>Prueba Nilah IA gratis hasta 100 clientas para enviar estos mensajes segmentados sin perder 5 horas al día copiando y pegando.</p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'La_Maquina_de_Halloween_Playbook_Martin_Pestana.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  const filteredCopys = filterCategory === 'all' 
    ? COPYS_HALLOWEEN 
    : COPYS_HALLOWEEN.filter(c => c.categoryKey === filterCategory);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? 'bg-[#0b0b0f] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-orange-100 dark:bg-orange-950/40 z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 shadow-[0_0_12px_rgba(249,115,22,0.5)]"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* ── HEADER SUPERIOR DE NAVEGACIÓN ── */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-[#0b0b0f]/90 border-white/10' : 'bg-white/90 border-slate-200'
      }`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/soluciones')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isDark ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-orange-500" />
              <span className="hidden sm:inline">Volver a Soluciones</span>
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5 text-xs font-black text-orange-600 dark:text-orange-400">
              <Ghost className="w-4 h-4 animate-bounce" />
              <span className="hidden md:inline">Especial Campaña Octubre</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* BOTÓN DESCARGA DOCX */}
            <button
              onClick={handleDownloadWord}
              disabled={isGeneratingDocx}
              title="Descargar en Word (.doc)"
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isDark 
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200' 
                  : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs'
              }`}
            >
              {isGeneratingDocx ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-blue-500" />
              )}
              <span className="hidden sm:inline">Word</span>
            </button>

            {/* BOTÓN DESCARGA PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              title="Descargar / Imprimir en PDF"
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shadow-orange-600/20"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Descargar PDF</span>
            </button>

            {/* TOGGLE MODO OSCURO */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-xl border text-xs transition-all ${
                isDark ? 'border-white/10 bg-white/5 text-amber-400' : 'border-slate-200 bg-white text-slate-600'
              }`}
              title={isDark ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── SIDEBAR DE ÍNDICE Y NAVEGACIÓN (Desktop) ── */}
        <aside className="hidden lg:block lg:col-span-4 space-y-4">
          <div className={`sticky top-20 rounded-3xl p-5 border transition-all ${
            isDark ? 'bg-[#12121a] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-white/10">
              <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500 font-bold">
                <BookOpen className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Índice del Playbook
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">4 Capítulos + 15 Copys</p>
              </div>
            </div>

            <nav className="space-y-1.5 text-xs font-bold">
              {[
                { id: 'intro', label: '🎃 Portada & Introducción' },
                { id: 'cap1', label: '📌 Cap 1: El Gran Error de Octubre' },
                { id: 'cap2', label: '📅 Cap 2: Calendario de 4 Semanas' },
                { id: 'cap3', label: '💬 Cap 3: Swipe File (Biblioteca de Copys)' },
                { id: 'cap4', label: '⚡ Cap 4: Manual vs. Nilah IA' },
                { id: 'cierre', label: '🚀 Plan de Acción Inmediato' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between ${
                    activeChapter === item.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                      : isDark
                      ? 'text-slate-300 hover:bg-white/5'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {activeChapter === item.id && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </nav>

            {/* MINI CARD CTA SAAS EN SIDEBAR */}
            <div className={`mt-6 p-4 rounded-2xl border text-center ${
              isDark ? 'bg-orange-950/20 border-orange-500/30' : 'bg-orange-50 border-orange-200'
            }`}>
              <span className="text-2xl mb-2 inline-block">⚡</span>
              <h4 className="text-xs font-black text-orange-900 dark:text-orange-200">
                ¿No quieres copiar a mano?
              </h4>
              <p className="text-[11px] text-orange-800/80 dark:text-orange-300/80 mt-1 leading-relaxed">
                Nilah IA segmenta tus clientas y manda estos mensajes por WhatsApp con 1 clic.
              </p>
              <Link
                to="/nilah/login?tab=register"
                className="mt-3 inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-sm transition-all"
              >
                Probar Gratis Ahora
              </Link>
            </div>
          </div>
        </aside>

        {/* ── CONTENIDO PRINCIPAL DEL EBOOK ── */}
        <main className="lg:col-span-8 space-y-12" ref={contentRef}>

          {/* ══════════════════════════════════════════════
              SECCIÓN INTRODUCCIÓN / HERO HALLOWEEN
          ══════════════════════════════════════════════ */}
          <section id="intro" className="space-y-6 pt-2">
            
            {/* BADGES & FECHA */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-black tracking-wider uppercase">
                <Ghost className="w-3.5 h-3.5" />
                PLAYBOOK TEMÁTICO DE OCTUBRE
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Lectura: 8 min · Edición 2026
              </span>
            </div>

            {/* TÍTULO PRINCIPAL */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
                La Máquina de Halloween: <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600">La Guía de 4 Semanas para Llenar tu Salón sin Bajar Precios</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Estrategia de ofertas de alto valor, calendario semana a semana y Mini Biblioteca de Copys de WhatsApp con el Método de los Activadores listos para copiar con 1 toque.
              </p>
            </div>

            {/* AUTOR & AUTORIDAD */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
              isDark ? 'bg-[#161622] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-orange-500 via-amber-400 to-purple-600 shrink-0">
                <img
                  src="/assets/images/martin-founder.jpeg"
                  alt="Martín Pestana"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full rounded-full object-cover object-top"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Martín Pestana</h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Ex-Administrador de salón durante 3 años · Creador de Nilah IA
                </p>
              </div>
            </div>

            {/* BANNER DESTACADO DE CONTEXTO */}
            <div className={`p-5 rounded-3xl border-l-4 border-orange-500 relative overflow-hidden ${
              isDark ? 'bg-orange-950/15 border-y border-r border-white/5 text-orange-200' : 'bg-orange-50/70 border-y border-r border-orange-200 text-orange-950'
            }`}>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                💡 <span className="font-bold">Octubre no es un mes para regalar tu trabajo:</span> Las clientas no buscan el servicio más barato; buscan verse espectaculares para sus compromisos del 31 y tener la seguridad de que su manicura o pestañas no se arruinarán a mitad de fiesta. Aquí tienes la estrategia exacta para capturar esa demanda.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              CAPÍTULO 1: EL GRAN ERROR DE OCTUBRE
          ══════════════════════════════════════════════ */}
          <section id="cap1" className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500 text-white font-black text-xs">
                CAP 01
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                El Gran Error de Octubre (La psicología de la clienta)
              </h2>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Cada año, al llegar el 1ero de octubre, veo a cientos de dueñas de salones cometer el mismo error reflejo: armar un banner con murciélagos y poner en grande: <strong className="text-red-500">"¡20% DE DESCUENTO EN TODO POR HALLOWEEN!"</strong>.
              </p>

              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-red-950/20 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  Por qué mandar descuentos masivos destruye tu negocio:
                </h4>
                <ul className="text-xs space-y-1.5 list-disc list-inside mt-2 font-medium">
                  <li><strong>Quema a tus clientas fieles:</strong> La clienta recurrente que te iba a pagar precio completo ahora paga menos por lo mismo.</li>
                  <li><strong>Destruye tu margen neto:</strong> Si tu margen era del 35%, un descuento del 20% te quita casi el 60% de tu ganancia neta.</li>
                  <li><strong>Atrae clientas "golondrina":</strong> Personas que solo compran por precio y que nunca volverán cuando cobres tu tarifa normal.</li>
                </ul>
              </div>

              <h3 className="text-base font-black text-slate-900 dark:text-white pt-2">
                🧠 El Cambio de Mentalidad
              </h3>
              <p>
                A la clienta de salón <strong>no le importa Halloween como fiesta temática infantil</strong>. Lo que realmente le importa son dos cosas muy puntuales:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#151520] border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-xl mb-1 inline-block">🛡️</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">1. Cero Estrés de Última Hora</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    No quedarse sin cita el fin de semana del 31 cuando todos los salones de la ciudad están saturados.
                  </p>
                </div>
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#151520] border-white/10' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-xl mb-1 inline-block">📸</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">2. Verse Impecable en sus Fotos</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Saber que sus uñas o sus pestañas aguantarán intactas toda la fiesta sin caerse ni descascararse.
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border-l-4 border-amber-500 ${
                isDark ? 'bg-amber-950/20 border-white/10 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                  El Secreto de Oro: Combos de Alto Valor
                </h4>
                <p className="text-xs font-medium leading-relaxed mt-1">
                  En vez de restar dinero, <strong>suma valor percibido</strong>:
                  <br />• <em>Uñas temáticas / tonos otoñales</em> + Exfoliación profunda de miel y coco de regalo.
                  <br />• <em>Pestañas volumen</em> + Retoque prioritario asegurado antes del día 31.
                  <br />• <em>Turno doble Pestañas + Uñas</em> el mismo día con prioridad de horario VIP.
                </p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              CAPÍTULO 2: EL CALENDARIO ESTRATÉGICO
          ══════════════════════════════════════════════ */}
          <section id="cap2" className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500 text-white font-black text-xs">
                CAP 02
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                El Calendario Estratégico de Octubre (Semana a Semana)
              </h2>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300">
              No dispares todos tus mensajes a fin de mes. El éxito de una campaña radica en guiar la atención de tu clientela en 4 fases progresivas:
            </p>

            {/* TIMELINE DE 4 SEMANAS */}
            <div className="space-y-4">
              
              {/* SEMANA 1 */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-[#151520] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-wider">
                    Semana 1 · Del 1 al 7 de Octubre
                  </span>
                  <span className="text-xs font-black text-slate-400">FASE 1</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  🔥 Fase de Calentamiento & Apertura de Agenda
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  <strong>Objetivo:</strong> Avisar que la agenda para el fin de semana del 31 ya está abierta y que los cupos son estrictamente limitados, <em>sin vender de manera agresiva</em>.
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  🎯 <strong>Acción:</strong> Enviar mensajes de intriga a clientas frecuentes y publicar en estados de WhatsApp los nuevos tonos otoñales.
                </div>
              </div>

              {/* SEMANA 2 */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-[#151520] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-black uppercase tracking-wider">
                    Semana 2 · Del 8 al 15 de Octubre
                  </span>
                  <span className="text-xs font-black text-slate-400">FASE 2</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  🧟‍♀️ Campaña de Clientas Antiguas (Reactivación +45 días)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  <strong>Objetivo:</strong> Despertar a todas las clientas que llevan más de 45 días sin agendar usando el gancho emocional del cambio de estación y la reconexión cordial.
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  🎯 <strong>Acción:</strong> Disparar los copys de reactivación (Copys de la categoría Reactivación) para llenar los días flojos de mitad de mes (martes a jueves).
                </div>
              </div>

              {/* SEMANA 3 */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-[#151520] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black uppercase tracking-wider">
                    Semana 3 · Del 16 al 23 de Octubre
                  </span>
                  <span className="text-xs font-black text-slate-400">FASE 3</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  ⚡ Ofertas de Combos Cruzados (Cross-Selling)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  <strong>Objetivo:</strong> Duplicar el ticket promedio ofreciendo a las clientas que ya tienen cita de pestañas que sumen uñas (o viceversa) en una sola sentada.
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  🎯 <strong>Acción:</strong> Mandar los copys de combos completos a todas las que ya tienen cita reservada para ofrecerles el upgrade "Todo en Uno".
                </div>
              </div>

              {/* SEMANA 4 */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-[#151520] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-black uppercase tracking-wider">
                    Semana 4 · Del 24 al 31 de Octubre
                  </span>
                  <span className="text-xs font-black text-slate-400">FASE 4</span>
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  🚨 Urgencia y FOMO Total (Últimos Cupos)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                  <strong>Objetivo:</strong> Cerrar los últimos 3 a 5 turnos libres restantes para los días 29, 30 y 31 jugando con la escasez real.
                </p>
                <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  🎯 <strong>Acción:</strong> Anunciar horarios específicos exactos: "Solo queda libre jueves 4:00 PM y viernes 11:00 AM".
                </div>
              </div>

            </div>
          </section>

          {/* ══════════════════════════════════════════════
              CAPÍTULO 3: EL SWIPE FILE (BIBLIOTECA DE COPYS)
          ══════════════════════════════════════════════ */}
          <section id="cap3" className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-500 text-white font-black text-xs">
                  CAP 03
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    El Swipe File: Biblioteca de Copys de WhatsApp
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Estructura de 2 Burbujas · Listos para Copiar & Pegar
                  </p>
                </div>
              </div>
            </div>

            {/* GUÍA DE COLOR DE LAS TARJETAS (GLOWING HEADERS) */}
            <div className={`p-4 rounded-3xl border ${
              isDark ? 'bg-orange-950/20 border-orange-500/30' : 'bg-orange-50/70 border-orange-200'
            }`}>
              <h4 className="text-xs font-black text-orange-900 dark:text-orange-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Colección por Especialidad & Glowing Headers:
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold">
                <div className="p-2 rounded-xl bg-lime-500/10 border border-lime-500/30 text-lime-700 dark:text-lime-300">
                  💅 Uñas (3 Copys)
                </div>
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300">
                  👁️ Pestañas (3 Copys)
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                  ✨ Combos (3 Copys)
                </div>
                <div className="p-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300">
                  🧙‍♀️ Cejas (3 Copys)
                </div>
              </div>
            </div>

            {/* FILTROS RÁPIDOS POR CATEGORÍA */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'Todos (15)' },
                { id: 'unas', label: '💅 Uñas (3)' },
                { id: 'pestanas', label: '👁️ Pestañas (3)' },
                { id: 'combos', label: '✨ Combos (3)' },
                { id: 'cejas', label: '🧙‍♀️ Cejas (3)' },
                { id: 'reactivacion', label: '🧟‍♀️ Reactivación (3)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterCategory(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    filterCategory === f.id
                      ? 'bg-orange-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* LISTADO DE COPYS CON HEADER GLOWING & SIMULADOR WHATSAPP */}
            <div className="space-y-6">
              {filteredCopys.map((copy) => (
                <div
                  key={copy.id}
                  className={`p-5 rounded-3xl border transition-all relative overflow-hidden ${
                    isDark ? 'bg-[#151522] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                  } ${copy.headerStyle.glowBorder}`}
                >
                  {/* GLOWING HEADER BADGE */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${copy.headerStyle.bgBadge} ${copy.headerStyle.borderBadge} ${copy.headerStyle.color} shadow-xs`}>
                        {copy.categoria}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                        isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {copy.tag}
                      </span>
                    </div>

                    {/* BOTÓN RÁPIDO COPIAR TODO DESDE EL HEADER */}
                    <button
                      onClick={() => handleCopy(`${copy.burbuja1}\n\n${copy.burbuja2}`, `${copy.id}-all`)}
                      className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shrink-0 ${
                        copiedId === `${copy.id}-all`
                          ? 'bg-emerald-600 text-white'
                          : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {copiedId === `${copy.id}-all` ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Todo</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {copy.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
                    {copy.subtitulo}
                  </p>

                  {/* SIMULADOR DE CHAT DE WHATSAPP REALISTA */}
                  <div className={`p-4 rounded-2xl border space-y-3 relative ${
                    isDark ? 'bg-[#0b141a] border-white/10' : 'bg-[#e5ddd5]/40 border-slate-300/80'
                  }`}>
                    
                    {/* BURBUJA 1 */}
                    <div className="flex justify-end">
                      <div className={`max-w-[92%] sm:max-w-[80%] rounded-2xl rounded-tr-xs p-3.5 shadow-2xs relative ${
                        isDark ? 'bg-[#005c4b] text-white' : 'bg-[#d9fdd3] text-slate-900'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[9px] font-black uppercase opacity-75 tracking-wider flex items-center gap-1">
                            <span>Burbuja 1</span>
                            <span className="opacity-50">·</span>
                            <span>Gancho / Intriga</span>
                          </span>
                          <button
                            onClick={() => handleCopy(copy.burbuja1, `${copy.id}-b1`)}
                            className="px-2 py-0.5 rounded-md bg-black/10 hover:bg-black/20 text-[10px] font-bold flex items-center gap-1 transition-all"
                            title="Copiar burbuja 1"
                          >
                            {copiedId === `${copy.id}-b1` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs sm:text-[13px] leading-relaxed font-normal">
                          {copy.burbuja1}
                        </p>
                        <div className="flex justify-end items-center gap-1 mt-1 text-[9px] opacity-60">
                          <span>10:42 AM</span>
                          <CheckCheck className="w-3 h-3 text-blue-400" />
                        </div>
                      </div>
                    </div>

                    {/* BURBUJA 2 */}
                    <div className="flex justify-end">
                      <div className={`max-w-[92%] sm:max-w-[80%] rounded-2xl rounded-tr-xs p-3.5 shadow-2xs relative ${
                        isDark ? 'bg-[#005c4b] text-white' : 'bg-[#d9fdd3] text-slate-900'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[9px] font-black uppercase opacity-75 tracking-wider flex items-center gap-1">
                            <span>Burbuja 2</span>
                            <span className="opacity-50">·</span>
                            <span>Confidencia + Cierre</span>
                          </span>
                          <button
                            onClick={() => handleCopy(copy.burbuja2, `${copy.id}-b2`)}
                            className="px-2 py-0.5 rounded-md bg-black/10 hover:bg-black/20 text-[10px] font-bold flex items-center gap-1 transition-all"
                            title="Copiar burbuja 2"
                          >
                            {copiedId === `${copy.id}-b2` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs sm:text-[13px] leading-relaxed font-normal">
                          {copy.burbuja2}
                        </p>
                        <div className="flex justify-end items-center gap-1 mt-1 text-[9px] opacity-60">
                          <span>10:43 AM</span>
                          <CheckCheck className="w-3 h-3 text-blue-400" />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* EXPLICACIÓN ESTRATÉGICA DE NEUROMARKETING */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-start gap-2">
                    <span className="text-xs shrink-0 mt-0.5">🧠</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                      <strong>Estrategia:</strong> {copy.explicacion}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              CAPÍTULO 4: MANUAL VS. NILAH IA
          ══════════════════════════════════════════════ */}
          <section id="cap4" className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-orange-500 text-white font-black text-xs">
                CAP 04
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Cómo Aplicarlo (A Mano vs. En Automático con Nilah IA)
              </h2>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300">
              Ahora tienes los 15 mensajes probados. Tienes exactamente dos caminos para ejecutarlos en tu salón este mes:
            </p>

            {/* COMPARATIVA DE LOS 2 MÉTODOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* MÉTODO MANUAL */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between ${
                isDark ? 'bg-[#151520] border-white/10' : 'bg-white border-slate-200 shadow-2xs'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase">
                      Opción 1
                    </span>
                    <span className="text-xs font-bold text-slate-400">100% Gratis</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    ✍️ El Método Manual
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Copias los textos de este ebook, abres tu libreta o WhatsApp, buscas una por una quién se hace uñas y quién pestañas, y mandas los mensajes a mano.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>Cero costo económico.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>Pierdes de 3 a 5 horas diarias pegada al teléfono.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>Riesgo de equivocarte de nombre o servicio.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <X className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                      <span>Si te saturas en cabina, dejas de enviar mensajes y se caen las citas.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* MÉTODO AUTOMÁTICO (NILAH IA) */}
              <div className={`p-5 rounded-3xl border-2 border-orange-500 relative flex flex-col justify-between overflow-hidden shadow-lg shadow-orange-500/10 ${
                isDark ? 'bg-gradient-to-b from-orange-950/20 to-[#12121a]' : 'bg-gradient-to-b from-orange-50/70 to-white'
              }`}>
                <div className="absolute top-0 right-0 px-3 py-1 bg-orange-600 text-white text-[10px] font-black uppercase rounded-bl-xl tracking-wider">
                  Recomendado
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase">
                      Opción 2
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    ⚡ El Método Inteligente (Nilah IA)
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Nilah IA clasifica a tus clientas por servicio y días de inactividad, personaliza cada mensaje con su nombre real y llena tu agenda automáticamente.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span>Filtro en 1 clic de clientas de Uñas, Pestañas o Inactivas (+45d).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span>Disparos automáticos sin que tengas que soltar la pinza o el torno.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span>Recordatorios 24h y 3h antes que eliminan los plantones del 31.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                      <span>Plan gratuito hasta 100 clientas (sin tarjeta de crédito).</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-5 pt-4 border-t border-orange-200 dark:border-white/10">
                  <Link
                    to="/nilah/login?tab=register"
                    className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-600/20"
                  >
                    <span>Probar Nilah IA Gratis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SECCIÓN CIERRE: PLAN DE ACCIÓN INMEDIATO
          ══════════════════════════════════════════════ */}
          <section id="cierre" className={`p-6 sm:p-8 rounded-3xl border text-center space-y-4 relative overflow-hidden ${
            isDark ? 'bg-[#151522] border-white/10' : 'bg-white border-slate-200 shadow-md'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto text-2xl">
              🎃
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Activa tu Campaña de Halloween Hoy Mismo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              No esperes al 28 de octubre cuando tus clientas ya hayan agendado en otro lugar. Empieza hoy 1ero de octubre con la Fase 1 y asegura el mes más rentable del año.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Link
                to="/nilah/login?tab=register"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Prueba Nilah IA Gratis</span>
              </Link>
              <button
                onClick={handleDownloadPDF}
                className={`w-full sm:w-auto px-5 py-3 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  isDark ? 'border-white/10 hover:bg-white/5 text-slate-200' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Download className="w-4 h-4 text-orange-500" />
                <span>Guardar Playbook en PDF</span>
              </button>
            </div>
          </section>

        </main>
      </div>

    </div>
  );
};

export default EbookHalloweenMachine;
