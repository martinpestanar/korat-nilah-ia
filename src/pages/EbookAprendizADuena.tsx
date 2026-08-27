import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Download, Check, Copy, Moon, Sun, Loader2, Sparkles, 
  BookOpen, Clock, ShieldCheck, Heart, MessageCircle, FileText, 
  ChevronRight, Share2, CheckCircle2, AlertCircle, ArrowUpRight,
  TrendingUp, Users, Smartphone, Zap, Sparkle, Lightbulb, DollarSign,
  HelpCircle, Eye, Star, Flame, Scissors, List, X, ChevronUp
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const EbookAprendizADuena: React.FC = () => {
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
    document.title = 'De aprendiz a dueña de tu salón | Ebook de Martín Pestana';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadProgress(progress);
      }

      // Update active chapter based on scroll position
      const chapters = [
        'intro', 'cap1', 'cap2', 'cap3', 'cap4', 
        'cap5', 'cap6', 'cap7', 'cap8', 'cap9', 'cap10', 'cierre'
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
          <title>De aprendiz a dueña de tu salón - Martín Pestana</title>
          <style>
            body { font-family: 'Calibri', 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
            h1 { color: #be185d; font-size: 26pt; line-height: 1.2; margin-bottom: 6px; }
            h2 { color: #831843; font-size: 17pt; margin-top: 24pt; border-bottom: 2px solid #fbcfe8; padding-bottom: 4pt; page-break-before: always; }
            h3 { color: #9d174d; font-size: 13pt; margin-top: 14pt; }
            p { font-size: 11pt; margin-bottom: 10pt; text-align: justify; }
            blockquote { background: #fdf2f8; border-left: 4px solid #db2777; padding: 12px; margin: 16px 0; font-style: italic; color: #701a75; }
            .badge { background: #fce7f3; color: #9d174d; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 9pt; }
            .part-header { font-size: 12pt; font-weight: bold; color: #be185d; text-transform: uppercase; letter-spacing: 1px; margin-top: 30pt; }
            .source { font-size: 9pt; color: #64748b; font-style: italic; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin: 14px 0; }
            .script-box { background: #faf5ff; border: 1px solid #d8b4fe; border-left: 4px solid #9333ea; padding: 12px; margin: 12px 0; font-family: 'Segoe UI', sans-serif; }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="badge">EBOOK COMPLETO · EDICIÓN OFICIAL 2026</p>
            <h1>De aprendiz a dueña de tu salón</h1>
            <p style="font-size: 14pt; color: #64748b; font-weight: bold;">El método para vivir de tus uñas, pestañas o cejas sin quemarte</p>
            <p style="font-size: 10.5pt; color: #475569;">Por <strong>Martín Pestana</strong> — Ex-Administrador de Salón & Creador de Nilah</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          </div>

          <h2>Introducción — Lo que nunca te dicen en el instituto</h2>
          <p>Ser lashista o manicurista, sea que trabajes de forma independiente yendo a domicilio o que tengas tu propio espacio, no se trata solo de ser la mejor poniendo pestañas o dejando las cejas perfectas. Hay algo igual de importante, y casi nadie te lo enseña: conocer tu negocio. Y lo más importante de todo no es conseguir clientas nuevas. Es lograr que las que ya tienes vuelvan.</p>
          <p>Durante 3 años administré un salón de belleza. Éramos solo tres personas: yo, una manicurista y una lashista. Nada de un equipo grande, nada de sucursales — un local pequeño donde cada peso que entraba o dejaba de entrar se sentía de inmediato.</p>
          <p>A las dos las vi estudiar y trabajar al mismo tiempo. Mi socia se estaba formando como manicurista profesional en el instituto Mía Secret, llegando algunas noches directo de clase a terminar un turno. La lashista hacía lo mismo con sus cursos de especialización. Vi de cerca lo que cuesta pagar esos cursos, estudiar de noche y trabajar de día — y también vi lo injusto que era que, después de tanto esfuerzo, el negocio siguiera sin ser predecible.</p>
          <p>Porque teníamos algo que a cualquiera le suena familiar: una libreta escrita a mano donde se cuadraba la caja del día. Y más de una vez, esa libreta no cuadraba. Un servicio que se nos había pasado anotar, un descuento que no quedó registrado, un vuelto que nadie recordaba haber dado. Nada grave, pero suficiente para terminar el día sin saber con exactitud cuánto habíamos ganado de verdad.</p>
          <p>Esa fue la escena que se repitió, con distintas variantes, durante los tres años completos: dos profesionales cada vez más hábiles con las manos, y un sistema de control que seguía siendo, en el fondo, un cuaderno y buena memoria.</p>
          <p>La técnica de las dos mejoraba mes a mes. Pero eso solo no bastaba para saber, con certeza, si el negocio realmente estaba creciendo o si solo se sentía ocupado.</p>
          <p>La respuesta no está en tus pestañas ni en tu limado. Está en que las academias de belleza te enseñan técnica, pero nadie te enseña a construir un sistema que te permita vivir de esto con calma mental.</p>
          <p><strong>Este ebook es esa otra mitad que nunca nos dieron en el instituto.</strong></p>

          <p class="part-header">PARTE 1 — EL DIAGNÓSTICO</p>

          <h2>Capítulo 1 — El ciclo que casi nadie rompe</h2>
          <p>Hablemos sin rodeos de la famosa trampa de la comisión.</p>
          <p>Cuando recién comienzas, lo normal — y está perfectamente bien — es entrar a trabajar como colaboradora en un salón comercial. Ahí aprendes ritmo, manejo de clientas difíciles, tiempos reales de servicio. Nada de eso se aprende en un curso de fin de semana.</p>
          <p>Pero hay una matemática que casi nunca se dice en voz alta:</p>
          <div class="box">
            <p><strong>Ejemplo real de matemática de salón:</strong></p>
            <ul>
              <li>Comisión: 35%</li>
              <li>Servicio cobrado: $29 (S/100 aprox.)</li>
              <li>Te queda a ti: $8 – $10 (S/30 – 35 aprox.)</li>
              <li>Para llegar al sueldo mínimo en Perú, $323 (S/1,130 aprox.): <strong>~38 servicios al mes</strong></li>
            </ul>
          </div>
          <p>Hacer 38 servicios al mes suena razonable en un papel. Hasta que te sientas en la silla. Un set bien puesto de pestañas o de uñas acrílicas toma de 2 a 3 horas de concentración absoluta — no de "estar presente", de concentración real, de esas que dejan el cuello tieso y los ojos ardiendo.</p>
          <p>Físicamente, un cuerpo humano puede sostener máximo 3 servicios de alta calidad al día antes de que la vista se nuble, el cuello arda y la precisión empiece a fallar. Si tienes que meter 5 clientas al día a presión para que las cuentas te cuadren, terminas agotada y quemada en menos de un año. Y lo peor: la calidad de tu trabajo, la misma que te costó tanto perfeccionar, empieza a bajar justo cuando más necesitas que se mantenga alta.</p>
          <blockquote>"Esto no significa que estés haciendo algo mal. Significa que nadie te enseñó la otra mitad del oficio: cómo retener a las clientas para trabajar con menos desgaste físico y cobrar lo justo."</blockquote>
          <p><strong>Antes de seguir:</strong> piensa en tu mejor semana del último mes. ¿Cuántas de esas citas fueron con clientas que ya conocías, y cuántas fueron caras nuevas que nunca habías visto? Guarda ese número, lo vamos a usar más adelante.</p>

          <h2>Capítulo 2 — Por qué "estar ocupada" no es lo mismo que "ser rentable"</h2>
          <p>Hay una mentira peligrosa en las redes sociales: la de mostrar una agenda repleta de papelitos de colores como si eso fuera éxito automático. Estar corriendo de 9 de la mañana a 9 de la noche no significa que estés ganando dinero real. Solo significa que estás cansada, y eso cualquiera lo puede confirmar sin necesidad de ver tu agenda.</p>
          <p>Vi este patrón una y otra vez en el salón: la profesional más ocupada del mes casi nunca era la que más terminaba ganando. Porque estar ocupada mezclaba clientas nuevas que negociaban precio, clientas de una sola vez que nunca volvían, y esa minoría fiel que sí volvía cada mes, pagaba sin quejarse y encima recomendaba.</p>
          <p>Esa minoría es la que sostiene el negocio de verdad. Y los números lo confirman:</p>
          <ul>
            <li>Conseguir una clienta nueva cuesta <strong>5 veces más</strong>, en tiempo, descuentos y publicidad, que retener a una que ya confía en ti. <span class="source">(Fuente: SalonWOP, Estrategias de Retención 2025)</span></li>
            <li>El <strong>42%</strong> de clientas leales genera el <strong>80%</strong> de los ingresos totales de un salón saludable. <span class="source">(Fuente: Zenoti Benchmark Report 2025)</span></li>
          </ul>
          <p>Una clienta recurrente tiene tres ventajas que ninguna clienta nueva te da el primer día: no te pide rebajas porque ya conoce el valor de tu trabajo, llega puntual porque ya sabe dónde queda tu local, y te recomienda de boca en boca con sus compañeras de trabajo y amigas — la publicidad más barata que existe, y la única que no se paga en dinero sino en buen servicio.</p>
          <p>La pregunta que de verdad importa no es "¿cuántas clientas atendí este mes?". Es "¿cuántas de esas clientas van a volver sin que yo tenga que rogarles?"</p>

          <h2>Capítulo 3 — El dinero que duerme en tu WhatsApp</h2>
          <p>Este es el capítulo más incómodo del ebook, y también el más importante. Léelo despacio.</p>
          <p>Abre tu WhatsApp ahora mismo. No después de terminar el capítulo — ahora. Ve a los chats de hace 2 o 3 meses. ¿Cuántas personas te escribieron, se atendieron contigo una sola vez, quedaron fascinadas con el resultado, y nunca más volvieron a agendar?</p>
          <p><strong>El dato que debes conocer:</strong> solo entre el 30% y el 40% de los clientes nuevos regresa por su cuenta a una segunda visita. En México y Perú, el 60% de los salones tiene una tasa de retención menor al 40%. <span class="source">(Fuente: SalonWOP, Estrategias de Retención 2025)</span></p>
          <p>Cada uno de esos chats silenciosos es una clienta que ya sacó dinero real de su bolsillo y confió en ti con su cara, sus manos o sus pestañas — que es, seamos honestas, una confianza bastante más grande que comprar cualquier otro producto. Si no volvió, en la gran mayoría de los casos no es porque no le haya gustado tu trabajo. Es porque entre el trabajo, los hijos, el tráfico y el día a día, se le pasó el tiempo y nadie le facilitó el camino de vuelta.</p>
          <p><strong>Tú no perdiste esa clienta por mala técnica. La perdiste por silencio.</strong></p>
          <p><strong>Ejercicio antes de continuar:</strong> cuenta cuántas conversaciones de hace 60 días o más quedaron sin ningún mensaje de tu parte después de la cita. Escribe ese número en un papel o en las notas de tu celular. Vas a necesitarlo más adelante en este ebook, cuando hablemos de cuánto vale, en dinero real, cada una de esas conversaciones dormidas.</p>
          <blockquote>"Subir la retención de tus clientas solo un 5% puede aumentar tus utilidades netas hasta en un 95%." <span class="source">— Principio de Bain & Company, citado por SalonWOP 2025.</span></blockquote>
          <p>No es una exageración de marketing. Es lo que pasa cuando dejas de gastar tiempo y plata en atraer gente nueva constantemente, y en cambio inviertes ese mismo esfuerzo en las personas que ya demostraron que quieren volver.</p>

          <h2>Capítulo 4 — Por qué WhatsApp y no otro canal</h2>
          <p>Muchos "gurús" de marketing te van a decir que mandes boletines por correo electrónico, que abras una página de Facebook institucional, o que publiques cinco veces al día en TikTok para que el algoritmo te premie. Pero la realidad de la mayoría de las mujeres en Latinoamérica es mucho más simple y directa que todo eso.</p>
          <div class="box">
            <p><strong>Correo electrónico:</strong> Apertura: 20% – 21% | Respuesta: 1% – 5%</p>
            <p><strong>WhatsApp Business directo:</strong> Apertura: ~98% | Respuesta: 40% – 60%</p>
            <p class="source">(Fuentes: Meta / Blip 2026 y WPChat Benchmark 2026)</p>
          </div>
          <p>El mejor mensaje del mundo, escrito con el copy más brillante que existe, no compite nunca contra un mensaje simple, cercano y respetuoso enviado por el canal que tu clienta abre cada 15 minutos por costumbre. El canal no es un detalle técnico: es la mitad de la ecuación. La otra mitad, la que sí depende de ti, es qué le dices cuando abre ese mensaje. De eso habla el siguiente capítulo.</p>

          <p class="part-header">PARTE 2 — EL MÉTODO, PASO 2: FIDELIZACIÓN</p>
          <p><em>(El Paso 1 de mi método — cómo conseguir tus primeras clientas si todavía no tienes suficientes — está en el Capítulo 8. Empiezo por este paso porque, sin importar en qué etapa estés, esto es lo que sostiene todo lo demás.)</em></p>

          <h2>Capítulo 5 — El método de los activadores</h2>
          <p>¿Por qué cuando mandas un mensaje como "Hola hermosa, tenemos 20% de descuento este mes en uñas acrílicas" la gente te deja en visto, o directamente te bloquea?</p>
          <p>Porque suena a anuncio masivo impersonal. Suena a que se lo mandaste a 500 personas a la vez — lo cual, probablemente, hiciste. Eso te devalúa como profesional y le pone a tu clienta la carga de tener que tomar una decisión de compra en frío, sin ganas y sin contexto.</p>
          <p>Yo le llamo a mi método los <strong>activadores</strong>, porque eso es exactamente lo que hacen: no piden, activan las ganas de volver. Y siguen siempre esta estructura de tres párrafos:</p>
          <ol>
            <li><strong>1. Gancho — detiene el scroll en 2 segundos:</strong> Habla de ella, de su ausencia, o de algo que ya comparten. Nunca de ti, nunca del negocio, y nunca con un saludo acartonado tipo "Buenas tardes estimada clienta".</li>
            <li><strong>2. Confidencia — el beneficio como privilegio personal:</strong> Comienza siempre con su nombre de pila. Presenta el beneficio como un detalle exclusivo porque la extrañas, no como una liquidación pública de fin de temporada. Máximo dos oraciones.</li>
            <li><strong>3. Cierre suave — una pregunta de baja fricción:</strong> Una sola pregunta corta, directa, que se responda con un simple "sí" o "dale". Cero urgencias falsas del tipo "¡Solo por hoy!" — ella tiene que sentir que puede decir que no sin que se rompa nada entre ustedes.</li>
          </ol>
          <p><strong>La regla de los emojis:</strong> usa entre 4 y 5 emojis por mensaje, uno por uno, nunca dos juntos, distribuidos a lo largo del texto. Incluye siempre al menos una carita expresiva (👀, 😉, 🙈, 😌) para transmitir el tono de voz exacto que tendrías si se lo dijeras en persona.</p>

          <h3>Ejemplos reales por emoción activada:</h3>
          <div class="script-box">
            <p><strong>1. Urgencia física (recordatorio de servicio / retoque):</strong></p>
            <p>Tus uñas ya están en esa etapa incómoda donde el esmaltado empieza a crecer raro y lo notas cada vez que agarras el celular. 👀<br/>
            María, ya te tengo separado tu diseño favorito para que no pierdas el molde. 💅<br/>
            ¿Coordinamos tu retoque esta semana?</p>
          </div>

          <div class="script-box">
            <p><strong>2. Ausencia y nostalgia (retención a los 30, 60 o 90 días):</strong></p>
            <p>No voy a decir que llevo semanas mirando tu espacio vacío... pero lo estoy diciendo. 👀<br/>
            Pero como soy buena gente, te guardé un regalito — y tu espacio favorito también. 😉🎁<br/>
            Sofía, ¿coordinamos esta semana?</p>
          </div>

          <div class="script-box">
            <p><strong>3. Reconocimiento y celebración (mensaje post-visita inmediato):</strong></p>
            <p>Todavía estoy mirando las fotos de tu set de hoy, quedó demasiado lindo. 🥹<br/>
            Gracias por confiar en mí una vez más, Camila — de verdad se nota lo bien que las cuidas después. 💕<br/>
            ¿Me dejas usar una foto para mis redes, aunque sea sin mostrar tu cara?</p>
          </div>

          <div class="script-box">
            <p><strong>4. FOMO social (campañas de fechas festivas):</strong></p>
            <p>Ya casi todas mis clientas de siempre me escribieron para separar su cita de fin de año. 😳<br/>
            Andrea, todavía queda un espacio libre esta semana antes de que se llene del todo. ✨<br/>
            ¿Te lo aparto?</p>
          </div>

          <div class="script-box">
            <p><strong>5. Privilegio y exclusividad (promocional general):</strong></p>
            <p>Esto no lo estoy mandando a todo mi WhatsApp, solo a un grupo chiquito de clientas. 🤫<br/>
            Valentina, quiero que seas de las primeras en probar el nuevo diseño antes de sacarlo al público. 😌<br/>
            ¿Te animas a ser la primera?</p>
          </div>

          <h2>Capítulo 6 — Cero fricción: recordatorios que evitan que pierdas plata</h2>
          <p>Tener un turno vacío porque la clienta "se olvidó" no solo te hace perder el dinero directo de ese servicio. Te arruina el estado de ánimo del día, te deja esperando con la mesa ya desinfectada y los productos listos, y te quita un tiempo que podrías haber usado para descansar, para tu familia, o simplemente para ti.</p>
          <p>El protocolo que funciona tiene dos pasos automáticos, no uno:</p>
          <ul>
            <li><strong>Recordatorio 24 horas antes:</strong> una confirmación suave, de un solo toque, que compromete su asistencia sin sonar a interrogatorio.</li>
            <li><strong>Recordatorio 3 horas antes:</strong> un mensaje de cortesía con la ubicación exacta y alguna recomendación previa (llegar sin rímel, uñas limpias, etc.).</li>
          </ul>
          <p>Tener este flujo automatizado <strong>reduce las inasistencias en al menos un 25%</strong>. <span class="source">(Fuente: SalonWOP 2025)</span> Y lo mejor de todo: profesionaliza tu imagen al 100% sin que tengas que andar llamando por teléfono, ni pasando la vergüenza de cobrar una confirmación como si desconfiaras de tu propia clienta.</p>

          <h2>Capítulo 7 — Segmentar no es de negocios grandes</h2>
          <p>Muchas manicuristas y lashistas me han dicho lo mismo con distintas palabras: "Me da miedo escribirles porque siento que las estoy fastidiando".</p>
          <p>Y tienen toda la razón — si mandan el mismo mensaje genérico a los 500 contactos de golpe. Pero fíjate en la diferencia entre hacerlo así y hacerlo bien:</p>
          <p><strong>Sin segmentación (molesto):</strong> mandar una promo de extensiones de pestañas a los 500 contactos completos, incluyendo a la clienta que se hizo cejas ayer y a la que solo se hace manicure clásica una vez al año.</p>
          <p><strong>Con segmentación (atención VIP):</strong> filtrar solo a las 80 clientas que se hicieron uñas acrílicas hace exactamente tres semanas. Para ellas, el mismo mensaje deja de sentirse como publicidad — se siente como un recordatorio salvador para evitar que la uña natural se quiebre.</p>

          <p class="part-header">PARTE 3 — EL DESPEGUE</p>

          <h2>Capítulo 8 — Paso 1: cómo conseguir tus primeras clientas si estás empezando de cero</h2>
          <p>Si estás empezando de cero, quiero ser muy honesto contigo: está perfecto trabajar para un salón ajeno mientras ganas velocidad. Te permite practicar con clientas reales, cometer errores sin arriesgar tu propio capital, y entender los tiempos reales de cada servicio — algo que ningún curso te enseña del todo bien.</p>
          <p>Lo que sí funciona, rápido y con presupuesto mínimo, es esto:</p>
          <div class="box">
            <p><strong>El método de 4 pasos para tus primeras clientas:</strong></p>
            <ol>
              <li><strong>1. Graba tus mejores trabajos.</strong> No necesitas equipo profesional — tu celular alcanza. Elige tus 2 o 3 trabajos donde el resultado se ve mejor.</li>
              <li><strong>2. Edita en CapCut mobile</strong> (la app es gratuita) — un video simple, claro, sin efectos innecesarios, que muestre bien el antes y el después.</li>
              <li><strong>3. Sube el video a una cuenta publicitaria de Meta</strong> (Facebook e Instagram Ads). Enlaza tu WhatsApp directamente al video.</li>
              <li><strong>4. Invierte un mínimo de $4 al día</strong> (S/14 aprox.) durante 7 a 15 días, segmentando el anuncio solo en un radio de 3 a 5 kilómetros alrededor de tu zona de atención.</li>
            </ol>
          </div>
          <blockquote>"Invertir en publicidad para traer gente nueva a tu WhatsApp, sin tener después un sistema de retención para que esas personas vuelvan, es exactamente igual que gastar dinero en llenar un balde que tiene un hueco en el fondo."</blockquote>

          <h2>Capítulo 9 — Antes era solo para las grandes empresas</h2>
          <p>Hoy esa tecnología cabe en tu bolsillo. Desarrollamos Nilah para que cualquier profesional independiente tenga las mismas herramientas de retención que las grandes cadenas, con una capa 100% gratuita para hasta 100 clientas.</p>

          <h2>Capítulo 10 — El mismo miércoles, distinto</h2>
          <p>El WhatsApp ya no es una lista de conversaciones sueltas donde todo se mezcla. Es una base ordenada que sabe quién se hizo qué, cuándo, y cuánto hace que no vuelve. Los recordatorios ya salieron solos, la caja está registrada al segundo y nadie tiene miedo de mirar el WhatsApp.</p>
          <p>Ese es el punto de partida. Lo demás — el sistema completo, gratis, listo para usar — lo tienes en Nilah.</p>
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'De_aprendiz_a_duena_de_tu_salon_Martin_Pestana.doc';
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
    { id: 'intro', num: '00', title: 'Introducción: Lo que nunca te dicen', part: 'Inicio' },
    { id: 'cap1', num: '01', title: 'El ciclo que casi nadie rompe', part: 'Parte 1' },
    { id: 'cap2', num: '02', title: 'Estar ocupada vs. Ser rentable', part: 'Parte 1' },
    { id: 'cap3', num: '03', title: 'El dinero que duerme en tu WhatsApp', part: 'Parte 1' },
    { id: 'cap4', num: '04', title: 'Por qué WhatsApp y no otro canal', part: 'Parte 1' },
    { id: 'cap5', num: '05', title: 'El método de los activadores', part: 'Parte 2' },
    { id: 'cap6', num: '06', title: 'Cero fricción: Recordatorios automáticos', part: 'Parte 2' },
    { id: 'cap7', num: '07', title: 'Segmentar no es de negocios grandes', part: 'Parte 2' },
    { id: 'cap8', num: '08', title: 'Paso 1: Conseguir tus primeras clientas', part: 'Parte 3' },
    { id: 'cap9', num: '09', title: 'Antes era solo para grandes empresas', part: 'Parte 3' },
    { id: 'cap10', num: '10', title: 'El mismo miércoles, distinto', part: 'Parte 3' },
    { id: 'cierre', num: '🚀', title: 'Empezar gratis en Nilah', part: 'Cierre' },
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 pb-20 ${
      isDark 
        ? 'bg-[#090a0f] text-slate-100 selection:bg-pink-500 selection:text-white' 
        : 'bg-slate-100/90 text-slate-900 selection:bg-pink-200 selection:text-pink-900'
    } print:bg-white print:text-black print:pb-0`}>

      {/* ── BARRA DE PROGRESO DE LECTURA ── */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-pink-500 via-rose-400 to-purple-600 z-50 transition-all duration-150 print:hidden"
        style={{ width: `${readProgress}%` }}
      />

      {/* ── HEADER SUPERIOR MOBILE-FIRST COMPACTO ── */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-3.5 py-2.5 sm:py-3 flex items-center justify-between transition-colors print:hidden ${
        isDark ? 'bg-[#0e1017]/95 border-slate-800/80 text-white' : 'bg-white/95 border-slate-200 shadow-2xs text-slate-900'
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-pink-600 truncate">Ebook · Nilah</p>
            <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">De aprendiz a dueña</h2>
          </div>
        </div>

        {/* ACCIONES TOP */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* BOTÓN ÍNDICE MÓVIL */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-pink-500/10 text-pink-600 border border-pink-500/20 active:scale-95 transition-transform"
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
            className="flex items-center gap-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-md shadow-pink-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-75"
          >
            {isGeneratingPdf ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span className="text-[11px]">PDF</span>
          </button>
        </div>
      </header>

      {/* ── CONTENEDOR PRINCIPAL MOBILE-FIRST (MAX 768px PARA LECTURA PERFECTA) ── */}
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ══════════════════════════════════════════
            SIDEBAR LATERAL: ÍNDICE DE CAPÍTULOS (DESKTOP)
        ══════════════════════════════════════════ */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-20 print:hidden">
          <div className={`p-5 rounded-3xl border transition-all ${
            isDark 
              ? 'bg-[#12141c]/90 border-slate-800 shadow-xl' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-200/50'
          }`}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="p-2 rounded-xl bg-pink-500/10 text-pink-600 font-black text-xs">
                📖
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Tabla de Contenido</h4>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">10 Capítulos Completos</p>
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
                        ? 'bg-pink-600 text-white font-black shadow-xs'
                        : isDark
                          ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                          : 'text-slate-600 hover:bg-pink-50 hover:text-pink-900'
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
                className="flex-1 py-2 px-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 hover:bg-pink-100 dark:hover:bg-pink-900/60 font-black text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
          
          {/* ── PORTADA PRINCIPAL FIRST-MOBILE ── */}
          <section className={`relative overflow-hidden rounded-[2rem] p-5 sm:p-10 border transition-all ${
            isDark 
              ? 'bg-gradient-to-br from-[#181124] via-[#12121a] to-[#0d0d12] border-purple-900/40 text-white' 
              : 'bg-gradient-to-br from-pink-600 via-rose-600 to-purple-800 text-white border-pink-700 shadow-xl shadow-pink-600/15'
          } print:bg-none print:border-none print:p-0 print:text-black`}>
            
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Ebook Oficial · Edición 2026</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
                De aprendiz a dueña de tu salón
              </h1>

              <p className="text-xs sm:text-base text-pink-100 font-medium leading-relaxed">
                El método para vivir de tus uñas, pestañas o cejas sin quemarte
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
                    <p className="text-[10px] sm:text-[11px] text-pink-200">Ex-Administrador de salón & Creador de Nilah</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-pink-100 font-medium bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                  <Clock className="w-3 h-3" />
                  <span>Lectura: ~14 min</span>
                </div>
              </div>

              {/* BOTONES FIRST-MOBILE */}
              <div className="pt-2 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 print:hidden">
                <button
                  onClick={() => scrollToSection('intro')}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-pink-50 text-pink-800 font-black text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer col-span-2 sm:col-auto"
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
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>00</span>
              <span>•</span>
              <span>Introducción</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Lo que nunca te dicen en el instituto
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Ser lashista o manicurista, sea que trabajes de forma independiente yendo a domicilio o que tengas tu propio espacio, no se trata solo de ser la mejor poniendo pestañas o dejando las cejas perfectas. Hay algo igual de importante, y casi nadie te lo enseña: <strong>conocer tu negocio</strong>. Y lo más importante de todo no es conseguir clientas nuevas. <strong>Es lograr que las que ya tienes vuelvan.</strong>
              </p>

              <p>
                Durante 3 años administré un salón de belleza. Éramos solo tres personas: yo, una manicurista y una lashista. Nada de un equipo grande, nada de sucursales — un local pequeño donde cada peso que entraba o dejaba de entrar se sentía de inmediato.
              </p>

              <p>
                A las dos las vi estudiar y trabajar al mismo tiempo. Mi socia se estaba formando como manicurista profesional en el instituto <strong>Mía Secret</strong>, llegando algunas noches directo de clase a terminar un turno. La lashista hacía lo mismo con sus cursos de especialización. Vi de cerca lo que cuesta pagar esos cursos, estudiar de noche y trabajar de día — y también vi lo injusto que era que, después de tanto esfuerzo, el negocio siguiera sin ser predecible.
              </p>

              <p>
                Porque teníamos algo que a cualquiera le suena familiar: <strong>una libreta escrita a mano donde se cuadraba la caja del día</strong>. Y más de una vez, esa libreta no cuadraba. Un servicio que se nos había pasado anotar, un descuento que no quedó registrado, un vuelto que nadie recordaba haber dado. Nada grave, pero suficiente para terminar el día sin saber con exactitud cuánto habíamos ganado de verdad.
              </p>

              <p>
                Esa fue la escena que se repitió, con distintas variantes, durante los tres años completos: dos profesionales cada vez más hábiles con las manos, y un sistema de control que seguía siendo, en el fondo, un cuaderno y buena memoria.
              </p>

              <p>
                La técnica de las dos mejoraba mes a mes. Pero eso solo no bastaba para saber, con certeza, si el negocio realmente estaba creciendo o si solo se sentía ocupado.
              </p>

              <div className="p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border-l-4 border-pink-500 text-pink-950 dark:text-pink-200 font-medium italic text-xs sm:text-sm">
                La respuesta no está en tus pestañas ni en tu limado. Está en que las academias de belleza te enseñan técnica, pero nadie te enseña a construir un sistema que te permita vivir de esto con calma mental.
              </div>

              <p className="font-bold text-pink-600 dark:text-pink-400">
                Este ebook es esa otra mitad que nunca nos dieron en el instituto.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              PARTE 1 — ENCABEZADO DE SECCIÓN
          ══════════════════════════════════════════ */}
          <div className="px-1 pt-1">
            <span className="px-3.5 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[11px] font-black uppercase tracking-wider border border-pink-200 dark:border-pink-800/60">
              PARTE 1 — EL DIAGNÓSTICO
            </span>
          </div>

          {/* ══════════════════════════════════════════
              CAPÍTULO 1
          ══════════════════════════════════════════ */}
          <article id="cap1" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 01</span>
              <span>•</span>
              <span>Diagnóstico Real</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El ciclo que casi nadie rompe
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hablemos sin rodeos de la famosa <strong>trampa de la comisión</strong>.
              </p>

              <p>
                Cuando recién comienzas, lo normal — y está perfectamente bien — es entrar a trabajar como colaboradora en un salón comercial. Ahí aprendes ritmo, manejo de clientas difíciles, tiempos reales de servicio. Nada de eso se aprende en un curso de fin de semana.
              </p>

              <p>
                Pero hay una matemática que casi nunca se dice en voz alta:
              </p>

              {/* MATEMÁTICA DE SALÓN RESPONSIVE */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                  <span>Ejemplo real de matemática de salón:</span>
                  <span className="text-pink-600 font-mono font-bold">Comisión 35%</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">Comisión</p>
                    <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mt-0.5">35%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">Cobro Servicio</p>
                    <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mt-0.5">$29 (S/100)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">Te queda a ti</p>
                    <p className="text-xs sm:text-sm font-black text-pink-600 mt-0.5">$8 – $10</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">Sueldo Mínimo Perú</p>
                    <p className="text-xs sm:text-sm font-black text-purple-600 mt-0.5">~38 servicios</p>
                  </div>
                </div>
              </div>

              <p>
                Hacer 38 servicios al mes suena razonable en un papel. Hasta que te sientas en la silla. Un set bien puesto de pestañas o de uñas acrílicas toma de <strong>2 a 3 horas de concentración absoluta</strong> — no de "estar presente", de concentración real, de esas que dejan el cuello tieso y los ojos ardiendo.
              </p>

              <p>
                Físicamente, un cuerpo humano puede sostener máximo <strong>3 servicios de alta calidad al día</strong> antes de que la vista se nuble, el cuello arda y la precisión empiece a fallar. Si tienes que meter 5 clientas al día a presión para que las cuentas te cuadren, terminas agotada y quemada en menos de un año. Y lo peor: la calidad de tu trabajo, la misma que te costó tanto perfeccionar, empieza a bajar justo cuando más necesitas que se mantenga alta.
              </p>

              <blockquote className="p-3.5 sm:p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border-l-4 border-pink-500 text-pink-950 dark:text-pink-200 font-medium italic text-xs sm:text-sm">
                "Esto no significa que estés haciendo algo mal. Significa que nadie te enseñó la otra mitad del oficio: cómo retener a las clientas para trabajar con menos desgaste físico y cobrar lo justo."
              </blockquote>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium flex items-start gap-2.5">
                <span className="text-base shrink-0 mt-0.5">💡</span>
                <p>
                  <strong>Antes de seguir:</strong> piensa en tu mejor semana del último mes. ¿Cuántas de esas citas fueron con clientas que ya conocías, y cuántas fueron caras nuevas que nunca habías visto? Guarda ese número, lo vamos a usar más adelante.
                </p>
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 2
          ══════════════════════════════════════════ */}
          <article id="cap2" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 02</span>
              <span>•</span>
              <span>Economía de Belleza</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Por qué "estar ocupada" no es lo mismo que "ser rentable"
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hay una mentira peligrosa en las redes sociales: la de mostrar una agenda repleta de papelitos de colores como si eso fuera éxito automático. Estar corriendo de 9 de la mañana a 9 de la noche no significa que estés ganando dinero real. Solo significa que estás cansada, y eso cualquiera lo puede confirmar sin necesidad de ver tu agenda.
              </p>

              <p>
                Vi este patrón una y otra vez en el salón: la profesional más ocupada del mes casi nunca era la que más terminaba ganando. Porque estar ocupada mezclaba clientas nuevas que negociaban precio, clientas de una sola vez que nunca volvían, y esa minoría fiel que sí volvía cada mes, pagaba sin quejarse y encima recomendaba.
              </p>

              <p>
                Esa minoría es la que sostiene el negocio de verdad. Y los números lo confirman:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-rose-700 dark:text-rose-400">COSTO 5X MAYOR</span>
                    <span className="text-base">💸</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Adquisición vs. Retención</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Conseguir una clienta nueva cuesta <strong>5 veces más</strong>, en tiempo, descuentos y publicidad, que retener a una que ya confía en ti.
                  </p>
                  <span className="inline-block text-[10px] text-slate-400 font-mono mt-1.5">Fuente: SalonWOP, Estrategias de Retención 2025</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">EL 80% DEL INGRESO</span>
                    <span className="text-base">💎</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Clientas Leales</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    El <strong>42%</strong> de clientas leales genera el <strong>80%</strong> de los ingresos totales de un salón saludable.
                  </p>
                  <span className="inline-block text-[10px] text-slate-400 font-mono mt-1.5">Fuente: Zenoti Benchmark Report 2025</span>
                </div>
              </div>

              <p>
                Una clienta recurrente tiene tres ventajas que ninguna clienta nueva te da el primer día: no te pide rebajas porque ya conoce el valor de tu trabajo, llega puntual porque ya sabe dónde queda tu local, y te recomienda de boca en boca con sus compañeras de trabajo y amigas — la publicidad más barata que existe, y la única que no se paga en dinero sino en buen servicio.
              </p>

              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-xs sm:text-sm font-bold text-purple-950 dark:text-purple-200">
                La pregunta que de verdad importa no es «¿cuántas clientas atendí este mes?». Es «¿cuántas de esas clientas van a volver sin que yo tenga que rogarles?»
              </div>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 3
          ══════════════════════════════════════════ */}
          <article id="cap3" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 03</span>
              <span>•</span>
              <span>El Tesoro Oculto</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El dinero que duerme en tu WhatsApp
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Este es el capítulo más incómodo del ebook, y también el más importante. Léelo despacio.
              </p>

              <p>
                Abre tu WhatsApp ahora mismo. No después de terminar el capítulo — ahora. Ve a los chats de hace 2 o 3 meses. ¿Cuántas personas te escribieron, se atendieron contigo una sola vez, quedaron fascinadas con el resultado, y nunca más volvieron a agendar?
              </p>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-black text-xs">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>EL DATO QUE DEBES CONOCER:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Solo entre el <strong>30% y el 40%</strong> de los clientes nuevos regresa por su cuenta a una segunda visita. En México y Perú, el <strong>60% de los salones</strong> tiene una tasa de retención menor al 40%. (Fuente: SalonWOP, Estrategias de Retención 2025)
                </p>
              </div>

              <p>
                Cada uno de esos chats silenciosos es una clienta que ya sacó dinero real de su bolsillo y confió en ti con su cara, sus manos o sus pestañas — que es, seamos honestas, una confianza bastante más grande que comprar cualquier otro producto. Si no volvió, en la gran mayoría de los casos no es porque no le haya gustado tu trabajo. Es porque entre el trabajo, los hijos, el tráfico y el día a día, se le pasó el tiempo y nadie le facilitó el camino de vuelta.
              </p>

              <p className="font-black text-rose-600 dark:text-rose-400">
                Tú no perdiste esa clienta por mala técnica. La perdiste por silencio.
              </p>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <span>✍️</span> Ejercicio antes de continuar:
                </p>
                <p>
                  Cuenta cuántas conversaciones de hace 60 días o más quedaron sin ningún mensaje de tu parte después de la cita. Escribe ese número en un papel o en las notas de tu celular. Vas a necesitarlo más adelante en este ebook, cuando hablemos de cuánto vale, en dinero real, cada una de esas conversaciones dormidas.
                </p>
              </div>

              <blockquote className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-950 dark:text-emerald-200 font-medium italic text-xs sm:text-sm">
                "Subir la retención de tus clientas solo un 5% puede aumentar tus utilidades netas hasta en un 95%." <br/>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 not-italic font-mono">— Principio de Bain & Company, citado por SalonWOP 2025</span>
              </blockquote>

              <p>
                No es una exageración de marketing. Es lo que pasa cuando dejas de gastar tiempo y plata en atraer gente nueva constantemente, y en cambio inviertes ese mismo esfuerzo en las personas que ya demostraron que quieren volver.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 4
          ══════════════════════════════════════════ */}
          <article id="cap4" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 04</span>
              <span>•</span>
              <span>Canales & Efectividad</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Por qué WhatsApp y no otro canal
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Muchos "gurús" de marketing te van a decir que mandes boletines por correo electrónico, que abras una página de Facebook institucional, o que publiques cinco veces al día en TikTok para que el algoritmo te premie. Pero la realidad de la mayoría de las mujeres en Latinoamérica es mucho más simple y directa que todo eso.
              </p>

              {/* COMPARATIVA VISUAL MOBILE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</span>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="flex justify-between">
                      <span className="text-slate-500">Apertura:</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">20% – 21%</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">Respuesta:</span>
                      <strong className="text-rose-600 font-mono font-bold">1% – 5%</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200">
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">WhatsApp Business Directo</span>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className="flex justify-between">
                      <span className="text-emerald-800 dark:text-emerald-300">Apertura:</span>
                      <strong className="text-emerald-600 font-black font-mono">~98%</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-emerald-800 dark:text-emerald-300">Respuesta:</span>
                      <strong className="text-emerald-600 font-black font-mono">40% – 60%</strong>
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono text-center">Fuentes: Meta / Blip 2026 y WPChat Benchmark 2026</p>

              <p>
                El mejor mensaje del mundo, escrito con el copy más brillante que existe, no compite nunca contra un mensaje simple, cercano y respetuoso enviado por el canal que tu clienta abre cada 15 minutos por costumbre. El canal no es un detalle técnico: es la mitad de la ecuación. La otra mitad, la que sí depende de ti, es qué le dices cuando abre ese mensaje. De eso habla el siguiente capítulo.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              PARTE 2 — ENCABEZADO DE SECCIÓN
          ══════════════════════════════════════════ */}
          <div className="px-1 pt-1 space-y-1">
            <span className="px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-black uppercase tracking-wider border border-purple-200 dark:border-purple-800/60">
              PARTE 2 — EL MÉTODO, PASO 2: FIDELIZACIÓN
            </span>
            <p className="text-xs text-slate-500 italic">
              (El Paso 1 de mi método — cómo conseguir tus primeras clientas si todavía no tienes suficientes — está en el Capítulo 8. Empiezo por este paso porque, sin importar en qué etapa estés, esto es lo que sostiene todo lo demás.)
            </p>
          </div>

          {/* ══════════════════════════════════════════
              CAPÍTULO 5 (EL CORAZÓN DEL EBOOK)
          ══════════════════════════════════════════ */}
          <article id="cap5" className={`p-5 sm:p-8 rounded-[2rem] border-2 transition-all ${
            isDark 
              ? 'bg-[#151221] border-pink-500/50 text-slate-200 shadow-xl shadow-pink-900/20' 
              : 'bg-gradient-to-b from-pink-50/60 via-white to-pink-50/30 border-pink-400 text-slate-800 shadow-lg shadow-pink-500/10'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Capítulo 05 · El Corazón del Ebook</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El método de los activadores
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                ¿Por qué cuando mandas un mensaje como <em>"Hola hermosa, tenemos 20% de descuento este mes en uñas acrílicas"</em> la gente te deja en visto, o directamente te bloquea?
              </p>
              <p>
                Porque suena a anuncio masivo impersonal. Suena a que se lo mandaste a 500 personas a la vez — lo cual, probablemente, hiciste. Eso te devalúa como profesional y le pone a tu clienta la carga de tener que tomar una decisión de compra en frío, sin ganas y sin contexto.
              </p>
              <p>
                Yo le llamo a mi método los <strong>activadores</strong>, porque eso es exactamente lo que hacen: no piden, activan las ganas de volver. Y siguen siempre esta estructura de tres párrafos:
              </p>

              {/* ESTRUCTURA 3 PÁRRAFOS */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-pink-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">1. Gancho — detiene el scroll en 2 segundos</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Habla de ella, de su ausencia, o de algo que ya comparten. Nunca de ti, nunca del negocio, y nunca con un saludo acartonado tipo "Buenas tardes estimada clienta".
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">2. Confidencia — el beneficio como privilegio personal</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Comienza siempre con su nombre de pila. Presenta el beneficio como un detalle exclusivo porque la extrañas, no como una liquidación pública de fin de temporada. Máximo dos oraciones.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">3. Cierre suave — una pregunta de baja fricción</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Una sola pregunta corta, directa, que se responda con un simple "sí" o "dale". Cero urgencias falsas del tipo "¡Solo por hoy!" — ella tiene que sentir que puede decir que no sin que se rompa nada entre ustedes.
                    </p>
                  </div>
                </div>
              </div>

              {/* REGLA DE EMOJIS */}
              <div className="p-3.5 rounded-2xl bg-pink-100/60 dark:bg-pink-950/40 border border-pink-300 dark:border-pink-800 text-xs text-pink-950 dark:text-pink-200 space-y-1">
                <p className="font-bold">✨ La regla de los emojis:</p>
                <p>
                  Usa entre <strong>4 y 5 emojis por mensaje</strong>, uno por uno, nunca dos juntos, distribuidos a lo largo del texto. Incluye siempre al menos una carita expresiva (👀, 😉, 🙈, 😌) para transmitir el tono de voz exacto que tendrías si se lo dijeras en persona.
                </p>
              </div>

              <p>
                No todos los mensajes activadores buscan lo mismo. Según el momento en el que le escribes a tu clienta, el mensaje debe apoyarse en una emoción distinta. Aquí tienes un ejemplo real de cada una:
              </p>

              {/* LOS 5 EJEMPLOS REALES */}
              <div className="space-y-3.5 pt-1">
                
                {/* 1. Urgencia física */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-pink-300 block">1. Urgencia física (recordatorio de servicio / retoque)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed font-sans select-all">
                    <p>Tus uñas ya están en esa etapa incómoda donde el esmaltado empieza a crecer raro y lo notas cada vez que agarras el celular. 👀</p>
                    <p className="mt-2">María, ya te tengo separado tu diseño favorito para que no pierdas el molde. 💅</p>
                    <p className="mt-2">¿Coordinamos tu retoque esta semana?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("Tus uñas ya están en esa etapa incómoda donde el esmaltado empieza a crecer raro y lo notas cada vez que agarras el celular. 👀\n\nMaría, ya te tengo separado tu diseño favorito para que no pierdas el molde. 💅\n\n¿Coordinamos tu retoque esta semana?", "act-1")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "act-1" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "act-1" ? '¡Copiado al portapapeles!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 2. Ausencia y nostalgia */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-pink-300 block">2. Ausencia y nostalgia (retención a los 30, 60 o 90 días)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed font-sans select-all">
                    <p>No voy a decir que llevo semanas mirando tu espacio vacío... pero lo estoy diciendo. 👀</p>
                    <p className="mt-2">Pero como soy buena gente, te guardé un regalito — y tu espacio favorito también. 😉🎁</p>
                    <p className="mt-2">Sofía, ¿coordinamos esta semana?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("No voy a decir que llevo semanas mirando tu espacio vacío... pero lo estoy diciendo. 👀\n\nPero como soy buena gente, te guardé un regalito — y tu espacio favorito también. 😉🎁\n\nSofía, ¿coordinamos esta semana?", "act-2")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "act-2" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "act-2" ? '¡Copiado al portapapeles!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 3. Reconocimiento y celebración */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-pink-300 block">3. Reconocimiento y celebración (mensaje post-visita inmediato)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed font-sans select-all">
                    <p>Todavía estoy mirando las fotos de tu set de hoy, quedó demasiado lindo. 🥹</p>
                    <p className="mt-2">Gracias por confiar en mí una vez más, Camila — de verdad se nota lo bien que las cuidas después. 💕</p>
                    <p className="mt-2">¿Me dejas usar una foto para mis redes, aunque sea sin mostrar tu cara?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("Todavía estoy mirando las fotos de tu set de hoy, quedó demasiado lindo. 🥹\n\nGracias por confiar en mí una vez más, Camila — de verdad se nota lo bien que las cuidas después. 💕\n\n¿Me dejas usar una foto para mis redes, aunque sea sin mostrar tu cara?", "act-3")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "act-3" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "act-3" ? '¡Copiado al portapapeles!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 4. FOMO social */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-pink-300 block">4. FOMO social (campañas de fechas festivas)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed font-sans select-all">
                    <p>Ya casi todas mis clientas de siempre me escribieron para separar su cita de fin de año. 😳</p>
                    <p className="mt-2">Andrea, todavía queda un espacio libre esta semana antes de que se llene del todo. ✨</p>
                    <p className="mt-2">¿Te lo aparto?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("Ya casi todas mis clientas de siempre me escribieron para separar su cita de fin de año. 😳\n\nAndrea, todavía queda un espacio libre esta semana antes de que se llene del todo. ✨\n\n¿Te lo aparto?", "act-4")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "act-4" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "act-4" ? '¡Copiado al portapapeles!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

                {/* 5. Privilegio y exclusividad */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white space-y-2">
                  <span className="text-xs font-bold text-pink-300 block">5. Privilegio y exclusividad (promocional general)</span>
                  <div className="p-3 rounded-xl bg-slate-800 text-xs text-slate-200 leading-relaxed font-sans select-all">
                    <p>Esto no lo estoy mandando a todo mi WhatsApp, solo a un grupo chiquito de clientas. 🤫</p>
                    <p className="mt-2">Valentina, quiero que seas de las primeras en probar el nuevo diseño antes de sacarlo al público. 😌</p>
                    <p className="mt-2">¿Te animas a ser la primera?</p>
                  </div>
                  <button
                    onClick={() => handleCopy("Esto no lo estoy mandando a todo mi WhatsApp, solo a un grupo chiquito de clientas. 🤫\n\nValentina, quiero que seas de las primeras en probar el nuevo diseño antes de sacarlo al público. 😌\n\n¿Te animas a ser la primera?", "act-5")}
                    className="w-full sm:w-auto py-2 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {copiedId === "act-5" ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === "act-5" ? '¡Copiado al portapapeles!' : 'Copiar plantilla'}</span>
                  </button>
                </div>

              </div>

              <p className="pt-2">
                Fíjate en algo: ninguno de estos cinco mensajes menciona un porcentaje de descuento como primera línea. El descuento, si existe, siempre va escondido dentro de la confidencia, nunca gritado en el gancho. Eso es lo que separa a un activador de un anuncio.
              </p>

            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 6
          ══════════════════════════════════════════ */}
          <article id="cap6" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 06</span>
              <span>•</span>
              <span>Puntualidad & Control</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Cero fricción: recordatorios que evitan que pierdas plata
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Tener un turno vacío porque la clienta "se olvidó" no solo te hace perder el dinero directo de ese servicio. Te arruina el estado de ánimo del día, te deja esperando con la mesa ya desinfectada y los productos listos, y te quita un tiempo que podrías haber usado para descansar, para tu familia, o simplemente para ti.
              </p>

              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                  El protocolo que funciona tiene dos pasos automáticos, no uno:
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 font-bold">•</span>
                    <span><strong>Recordatorio 24 horas antes:</strong> una confirmación suave, de un solo toque, que compromete su asistencia sin sonar a interrogatorio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-600 font-bold">•</span>
                    <span><strong>Recordatorio 3 horas antes:</strong> un mensaje de cortesía con la ubicación exacta y alguna recomendación previa (llegar sin rímel, uñas limpias, etc.).</span>
                  </li>
                </ul>
              </div>

              <p>
                Tener este flujo automatizado <strong>reduce las inasistencias en al menos un 25%</strong>. (Fuente: SalonWOP 2025) Y lo mejor de todo: profesionaliza tu imagen al 100% sin que tengas que andar llamando por teléfono, ni pasando la vergüenza de cobrar una confirmación como si desconfiaras de tu propia clienta.
              </p>

              <p>
                Recuerda algo importante: el recordatorio no reemplaza una política de cancelación clara si es que la necesitas. Lo que hace es evitarte la mayoría de los olvidos genuinos — que son, en la práctica, la causa más común de un turno vacío.
              </p>

              <p>
                Además de los recordatorios, el mismo sistema de activadores puede encargarse de los recordatorios de mantenimiento (cuando toca retoque según el ciclo del servicio) y de los mensajes de fidelización post-cita — ese "gracias por confiar en mí" que casi ninguna profesional manda porque, seamos honestas, después de un día completo de citas ya no queda energía para escribirle a cada una.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 7
          ══════════════════════════════════════════ */}
          <article id="cap7" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 07</span>
              <span>•</span>
              <span>Relevancia</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Segmentar no es de negocios grandes
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Muchas manicuristas y lashistas me han dicho lo mismo con distintas palabras: <em>"Me da miedo escribirles porque siento que las estoy fastidiando"</em>.
              </p>
              <p>
                Y tienen toda la razón — si mandan el mismo mensaje genérico a los 500 contactos de golpe. Pero fíjate en la diferencia entre hacerlo así y hacerlo bien:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                  <p className="font-bold text-rose-800 dark:text-rose-300 mb-1">❌ Sin segmentación (molesto)</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Mandar una promo de extensiones de pestañas a los 500 contactos completos, incluyendo a la clienta que se hizo cejas ayer y a la que solo se hace manicure clásica una vez al año.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">✅ Con segmentación (atención VIP)</p>
                  <p className="text-slate-600 dark:text-slate-400 text-xs">
                    Filtrar solo a las <strong>80 clientas que se hicieron uñas acrílicas hace exactamente tres semanas</strong>. Para ellas, el mismo mensaje deja de sentirse como publicidad — se siente como un recordatorio salvador para evitar que la uña natural se quiebre.
                  </p>
                </div>
              </div>

              <p>
                La diferencia no está en el descuento que ofreces. Está en que a la persona correcta le llega el mensaje correcto, en el momento correcto. Eso no es tecnología de empresa grande — es simplemente conocer a tu clienta lo suficiente como para no tratarla como un número más en una lista.
              </p>

              <p>
                Esta misma lógica de segmentación es la que se usa para identificar a tus clientas ausentes, a tus VIP, y a las que solo se hacen un servicio específico — audiencias que puedes activar por separado, cada una con el mensaje que le corresponde.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              PARTE 3 — ENCABEZADO DE SECCIÓN
          ══════════════════════════════════════════ */}
          <div className="px-1 pt-1">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/60">
              PARTE 3 — EL DESPEGUE
            </span>
          </div>

          {/* ══════════════════════════════════════════
              CAPÍTULO 8
          ══════════════════════════════════════════ */}
          <article id="cap8" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 08</span>
              <span>•</span>
              <span>El Despegue</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Paso 1: cómo conseguir tus primeras clientas si estás empezando de cero
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Si estás empezando de cero, quiero ser muy honesto contigo: está perfecto trabajar para un salón ajeno mientras ganas velocidad. Te permite practicar con clientas reales, cometer errores sin arriesgar tu propio capital, y entender los tiempos reales de cada servicio — algo que ningún curso te enseña del todo bien. Yo lo vi de cerca en mi propio salón: mi socia y la lashista que trabajaron conmigo mientras estudiaban su especialización en el instituto no perdieron el tiempo — ganaron algo que ningún curso da: horas reales de silla.
              </p>

              <p>
                Cuando sientas que ya tienes esa confianza técnica para dar el salto, viene la pregunta que más me hacen: <em>"¿publico contenido en redes hasta que lleguen clientas, o hago algo distinto?"</em>
              </p>

              <p className="font-bold">
                Mi respuesta, con la que probablemente no vas a estar de acuerdo al principio, es esta: <strong>no</strong>. No te recomiendo empezar generando contenido orgánico mientras trabajas y todavía no tienes base de clientas propia. Y te explico por qué, sin rodeos.
              </p>

              <p>
                El contenido orgánico depende de un algoritmo que no controlas, de constancia diaria que es carísima en tiempo cuando ya estás agotada de estar 8 horas parada en la silla, y de meses de espera antes de ver un resultado real. Si estás empezando de cero y necesitas ingresos ahora, no puedes darte el lujo de apostar todo a que un video se vuelva viral.
              </p>

              <p>
                Lo que sí funciona, rápido y con presupuesto mínimo, es esto:
              </p>

              {/* MÉTODO DE 4 PASOS RESPONSIVE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-3">
                <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                  El método de 4 pasos para tus primeras clientas:
                </h4>
                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">1</span>
                    <span><strong>Graba tus mejores trabajos.</strong> No necesitas equipo profesional — tu celular alcanza. Elige tus 2 o 3 trabajos donde el resultado se ve mejor.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">2</span>
                    <span><strong>Edita en CapCut mobile</strong> (la app es gratuita) — un video simple, claro, sin efectos innecesarios, que muestre bien el antes y el después.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">3</span>
                    <span><strong>Sube el video a una cuenta publicitaria de Meta</strong> (Facebook e Instagram Ads). Crear la cuenta es más fácil de lo que suena — hay decenas de tutoriales gratuitos que te llevan paso a paso. Enlaza tu WhatsApp directamente al video, de forma que cuando alguien lo vea y le interese, tenga el botón de WhatsApp justo debajo, listo para escribirte sin buscar nada más.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">4</span>
                    <span><strong>Invierte un mínimo de $4 al día</strong> (S/14 aprox.) <strong>durante 7 a 15 días</strong>, segmentando el anuncio solo en un radio de 3 a 5 kilómetros alrededor de tu zona de atención. Ese es el presupuesto y el tiempo con el que empiezas a ver tus primeras clientas nuevas — no es una promesa de resultado garantizado, es la inversión mínima con la que arrancamos a ver movimiento real.</span>
                  </li>
                </ol>
              </div>

              <p>
                Esto no significa que el contenido orgánico esté prohibido — al contrario. Una vez que ya tienes tus primeras clientas y algo de tiempo libre, sí te recomiendo subir contenido a TikTok o Instagram, aunque sea de forma secundaria, para que tu marca personal no se vea vacía cuando alguien nueva llegue a buscarte. Pero como estrategia principal para arrancar desde cero, los anuncios pagados te dan velocidad; el contenido orgánico te da construcción de marca a largo plazo. Son dos herramientas distintas, para dos momentos distintos.
              </p>

              <p>
                Y una cosa más, porque la he escuchado demasiadas veces: nunca tengas miedo o vergüenza de grabar tu propio trabajo y subirlo. Esa vergüenza inicial es normal — a mí también me costó al principio mostrar el negocio hacia afuera — pero es exactamente lo que te está costando las clientas que ese video sí podría haberte traído.
              </p>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-1 text-xs sm:text-sm">
                <p className="font-black flex items-center gap-1.5">
                  <AlertCircle size={15} className="text-amber-500" />
                  <span>ADVERTENCIA CRUCIAL DE INVERSIÓN:</span>
                </p>
                <p className="leading-relaxed">
                  Invertir en publicidad para traer gente nueva a tu WhatsApp, sin tener después un sistema de retención para que esas personas vuelvan, es exactamente igual que <strong>gastar dinero en llenar un balde que tiene un hueco en el fondo</strong>. Vas a seguir echando agua para siempre, y el balde nunca se va a llenar.
                </p>
              </div>

              <p>
                Por eso el orden de mi método importa tanto: <strong>Paso 1</strong>, el que acabas de leer, es cómo llenar el balde. <strong>Paso 2</strong> — la fidelización y retención que viste en la Parte 2 de este ebook — es cómo tapar el hueco para que lo que entra, se quede.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 9
          ══════════════════════════════════════════ */}
          <article id="cap9" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 09</span>
              <span>•</span>
              <span>Democratización</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              Antes era solo para las grandes empresas
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Hace apenas algunos años, tener un software de CRM, seguimiento de clientes, control de ingresos diarios y recordatorios automáticos costaba miles de dólares y requería contratar programadores a tiempo completo. Era, literalmente, terreno exclusivo de cadenas grandes con departamentos de sistemas propios.
              </p>
              <p>
                Hoy esa tecnología cabe en tu bolsillo. Y esa es la razón exacta por la que construí Nilah: para darle a cualquier lashista, manicurista o dueña de salón independiente las mismas herramientas de retención que usan las cadenas de salones más grandes del mundo, sin necesitar un departamento de sistemas ni una inversión inicial de miles de dólares.
              </p>
              <p>
                Por eso existe la <strong>capa 100% gratuita de Nilah</strong> — Dashboard, CRM y Agenda, para hasta 100 clientas — para que puedas ordenar tu negocio sin que te cueste un solo centavo de entrada.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CAPÍTULO 10
          ══════════════════════════════════════════ */}
          <article id="cap10" className={`p-5 sm:p-8 rounded-[2rem] border transition-all ${
            isDark ? 'bg-[#12141c] border-slate-800/80 text-slate-200' : 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-2 text-pink-600 font-black text-xs uppercase tracking-wider mb-2">
              <span>Capítulo 10</span>
              <span>•</span>
              <span>La Transformación</span>
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-4 leading-snug">
              El mismo miércoles, distinto
            </h2>

            <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <p>
                Volvamos a la escena del principio de este ebook: un salón pequeño, tres personas, y una libreta escrita a mano donde, más de una vez, los números no cuadraban al final del día.
              </p>

              <p>
                Ahora imagina ese mismo miércoles, pero con el sistema funcionando detrás.
              </p>

              <p>
                El WhatsApp ya no es una lista de conversaciones sueltas donde todo se mezcla. Es una base ordenada que sabe quién se hizo qué, cuándo, y cuánto hace que no vuelve. Los recordatorios de 24 y 3 horas ya salieron solos esa mañana, así que no hubo ningún hueco de agenda por un olvido. La caja del día no depende de una libreta ni de la memoria de nadie — está registrada al segundo. Y en algún momento de la tarde, sin que nadie tuviera que sentarse a escribir nada desde cero, salió un mensaje activador para las clientas que llevan 60 días sin aparecer — con el tono exacto, la estructura correcta, y los emojis en su lugar.
              </p>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 text-xs sm:text-sm font-medium leading-relaxed">
                Ese miércoles se sigue trabajando duro, porque el oficio cansa y eso no lo cambia ningún sistema. Pero ya nadie tiene miedo de mirar el WhatsApp, ni de cuadrar la caja al cierre. Y esa diferencia, multiplicada por cada mes que pasa, es la que separa a la que sobrevive del oficio de la que de verdad vive de él.
              </div>

              <p className="font-bold text-sm sm:text-base">
                Ese es el punto de partida. Lo demás — el sistema completo, gratis, listo para usar — lo tienes en Nilah.
              </p>
            </div>
          </article>

          {/* ══════════════════════════════════════════
              CIERRE & CTA PRINCIPAL MOBILE-FIRST
          ══════════════════════════════════════════ */}
          <section id="cierre" className={`p-6 sm:p-10 rounded-[2rem] text-center space-y-4 sm:space-y-5 border transition-all relative overflow-hidden ${
            isDark 
              ? 'bg-gradient-to-b from-[#181226] via-[#100e17] to-[#08080c] border-purple-800/40 text-white' 
              : 'bg-gradient-to-b from-pink-600 via-rose-600 to-purple-800 text-white border-pink-700 shadow-2xl shadow-pink-600/20'
          }`}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider">
              <span>🚀</span> Tu próximo paso
            </div>

            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight max-w-lg mx-auto leading-tight">
              Y esto que acabas de leer no es teoría. Es lo que te doy gratis, listo para usar, en Nilah.
            </h2>

            <p className="text-xs sm:text-sm text-pink-100 max-w-md mx-auto leading-relaxed">
              Dile adiós a la libreta a mano. Registra tus clientas, agenda tus citas y activa recordatorios desde tu celular.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <a
                href="/login?tab=register"
                className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-white hover:bg-pink-50 text-pink-700 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/20 active:scale-95 transition-all text-center uppercase tracking-wider cursor-pointer"
              >
                <Zap size={16} className="fill-pink-700" />
                <span>Empezar gratis ahora</span>
              </a>

              <a
                href="https://wa.me/51926285289?text=%C2%A1Hola%20Mart%C3%ADn!%20Acabo%20de%20leer%20tu%20Ebook%20de%20Aprendiz%20a%20Due%C3%B1a%20y%20quiero%20hacerte%20una%20consulta."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
              >
                <MessageCircle size={14} />
                <span>Hablar con Martín por WhatsApp</span>
              </a>
            </div>

            <p className="text-[10px] sm:text-[11px] text-pink-200/80 pt-1">
              Sin tarjeta de crédito · Hasta 100 clientas gratis · Configuración en 2 minutos
            </p>
          </section>

          {/* ── FOOTER DE ARTÍCULO ── */}
          <footer className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Nilah IA & Martín Pestana · Todos los derechos reservados.</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-pink-600 font-bold cursor-pointer"
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
          className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-black text-xs py-2.5 px-4 rounded-full shadow-lg shadow-pink-600/30 active:scale-95 transition-all cursor-pointer"
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
                isDark ? 'bg-[#12141c] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-pink-500/10 text-pink-600 font-bold text-xs">
                    📖
                  </span>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400">Tabla de Contenido</h3>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">10 Capítulos Prácticos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lista Scrollable */}
              <div className="py-2 overflow-y-auto space-y-1 my-1 flex-1">
                {capitulosIndice.map((cap) => {
                  const isActive = activeChapter === cap.id;
                  return (
                    <button
                      key={cap.id}
                      onClick={() => scrollToSection(cap.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-pink-600 text-white font-black shadow-xs'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-800'
                            : 'text-slate-700 hover:bg-pink-50'
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

              {/* Acciones del Drawer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    handleDownloadPDF();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-pink-200 dark:border-pink-800/60"
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

export default EbookAprendizADuena;
