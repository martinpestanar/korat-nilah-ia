import { supabase } from './supabase';

export interface SolucionesHeaderConfig {
  // 1. Cabecera & Perfil
  statusBadge: string;
  nombrePersona: string;
  subtituloPersona: string;
  trustBadge1: string;
  trustBadge2: string;
  whatsappNumber: string;

  // 2. Banner Filosofía Core
  filosofiaTexto: string;

  // 3. Card Freemium Hero
  freemiumBadge: string;
  freemiumTitulo: string;
  freemiumSubtitulo: string;
  freemiumFeature1Title: string;
  freemiumFeature1Desc: string;
  freemiumFeature2Title: string;
  freemiumFeature2Desc: string;
  freemiumFeature3Title: string;
  freemiumFeature3Desc: string;
  freemiumFeature4Title: string;
  freemiumFeature4Desc: string;
  freemiumBotonTexto: string;
  freemiumBotonUrl: string;
  freemiumDisclaimer: string;

  // 4. Banner Software a Medida
  aMedidaTitulo: string;
  aMedidaSubtitulo: string;
  aMedidaBotonTexto: string;
  aMedidaWhatsappMensaje: string;

  // 5. Textos Footer
  footerPregunta: string;
  footerBotonTexto: string;
  footerWhatsappMensaje: string;
}

export interface CategoriaPersonalizada {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  orden: number;
  activo: boolean;
}

export interface SolucionItem {
  id: string;
  categoria: string;
  subcategoria?: 'plan_basico' | 'plan_pro' | 'addon' | 'standard' | 'a_medida' | 'educacion';
  titulo: string;
  subtitulo: string;
  descripcion: string;
  badge: string;
  icono: string;
  mensaje_whatsapp: string;
  precio?: string;
  url_demo?: string;
  tipo_boton?: 'whatsapp' | 'enlace' | 'descarga';
  texto_boton_personalizado?: string;
  url_checkout?: string;
  contenido_detalle_markdown?: string; // Contenido enriquecido para modal
  clics_count?: number;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export const HEADER_DEFAULT: SolucionesHeaderConfig = {
  statusBadge: '🟢 Cupos abiertos para salones & proyectos a medida',
  nombrePersona: 'Martín Pestana',
  subtituloPersona: '3 años dentro de un salón de belleza me enseñaron esto: no te faltan clientas nuevas, te faltan clientas que regresen. Construí Nilah para eso.',
  trustBadge1: 'Cero plantones en citas',
  trustBadge2: 'Recordatorios de retoque automáticos',
  whatsappNumber: '51926285289',

  filosofiaTexto: 'No te faltan clientas nuevas, te faltan clientas que regresen. El seguimiento automático por WhatsApp se encarga de que vuelvan cada mes.',

  freemiumBadge: 'Sistema gratuito · hasta 100 clientas',
  freemiumTitulo: 'Nilah App — Dile adiós al cuaderno y al Excel',
  freemiumSubtitulo: 'Todo el control de tu salón desde el celular: cuánto ganaste, quién es tu clienta VIP, quién no ha vuelto y cuánto le debes pagar a tu equipo. Gratis hasta 100 clientas, sin tarjeta.',
  freemiumFeature1Title: 'Tus números del día',
  freemiumFeature1Desc: 'Ventas, ticket promedio y ocupación, sin sacar la calculadora',
  freemiumFeature2Title: 'Agenda a tu manera',
  freemiumFeature2Desc: 'Vista de mes, semana o día — elige cómo te acomoda organizarte',
  freemiumFeature3Title: 'Sabe quién es quién',
  freemiumFeature3Desc: 'Identifica en un clic a tus clientas VIP, recurrentes y las que ya no vuelven',
  freemiumFeature4Title: 'Comisiones sin pelear',
  freemiumFeature4Desc: 'Registra gastos fijos y calcula el pago justo a tus colaboradoras',
  freemiumBotonTexto: 'Empezar gratis ahora',
  freemiumBotonUrl: '/login?tab=register',
  freemiumDisclaimer: 'Ideal para lashistas, manicuristas y salones. Sin tarjeta. Hasta 100 clientas — después, planes desde S/ 149 /mes.',

  aMedidaTitulo: '¿Tienes una cadena de salones o necesitas algo hecho a tu medida?',
  aMedidaSubtitulo: 'Hablemos sobre flujos de WhatsApp, integraciones personalizadas o desarrollos a medida.',
  aMedidaBotonTexto: 'Agenda una llamada',
  aMedidaWhatsappMensaje: '¡Hola Martín! Tengo una cadena de salones / proyecto especial y me gustaría agendar una llamada para evaluar una solución a medida.',

  footerPregunta: '¿Tienes dudas o necesitas una recomendación para tu salón?',
  footerBotonTexto: 'Escríbeme directo al WhatsApp (+51 926 285 289)',
  footerWhatsappMensaje: '¡Hola Martín! Tengo una duda sobre las soluciones y recursos de Nilah para mi negocio.',
};

export const CATEGORIAS_DEFAULT: CategoriaPersonalizada[] = [
  { id: 'tengo_salon', label: 'Ya tengo mi salón', shortLabel: '🏢 Mi Salón', icon: '🏢', orden: 1, activo: true },
  { id: 'quiero_independizarme', label: 'Quiero independizarme', shortLabel: '🚀 Independizarme', icon: '🚀', orden: 2, activo: true },
  { id: 'guias_plantillas', label: 'Guías y plantillas gratis', shortLabel: '📚 Guías Gratis', icon: '📚', orden: 3, activo: true },
];

export const MODULOS_DEFAULT: Omit<SolucionItem, 'created_at' | 'updated_at'>[] = [
  // ══════════════════════════════════════════
  // CATEGORÍA A: "YA TENGO MI SALÓN"
  // ══════════════════════════════════════════
  {
    id: 'ebook-clientas-regresen',
    categoria: 'tengo_salon',
    subcategoria: 'educacion',
    titulo: 'Ebook: Cómo hacer que tus clientas regresen',
    subtitulo: 'Para dueñas de salón, spa o independientes con clientas activas',
    descripcion: 'Por qué una clienta viene dos veces y nunca más regresa, y cómo evitarlo con seguimiento simple por WhatsApp.',
    badge: '📖 EBOOK GRATIS',
    icono: '📖',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero descargar el Ebook: Cómo hacer que tus clientas regresen.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Descargar gratis',
    contenido_detalle_markdown: `### 📖 Ebook: Cómo hacer que tus clientas regresen
> 💡 *"El secreto de los salones llenos no es gastar más en publicidad, sino lograr que el 80% de tus clientas regresen solas cada mes sin tener que perseguirlas."*

#### 📦 Lo que descubrirás:
* 🔍 **La fuga invisible:** Por qué el 60% de clientas que salen felices no vuelven a agendar.
* 💬 **El timing de WhatsApp:** Cuándo escribirle exactamente a una clienta después de su servicio sin ser invasiva.
* 🎁 **La oferta de reactivación:** La estructura de mensaje para recuperar clientas con más de 45 días de inactividad.`,
    clics_count: 0,
    orden: 1,
    activo: true,
  },
  {
    id: 'guia-anti-no-show',
    categoria: 'tengo_salon',
    subcategoria: 'educacion',
    titulo: 'Guía: Anti no-show',
    subtitulo: 'Reduce inasistencias y citas olvidadas',
    descripcion: 'El guión de recordatorio de 24 horas y 3 horas antes que usamos para reducir las inasistencias.',
    badge: '🛡️ GUÍA PRÁCTICA',
    icono: '🛡️',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Me gustaría ver la Guía Anti no-show con los guiones de recordatorio.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Ver guía gratis',
    contenido_detalle_markdown: `### 🛡️ Guía: Anti no-show
> 🎯 *"Un turno vacío no es solo tiempo perdido, es dinero que nunca vas a recuperar."*

#### 📦 Lo que incluye esta guía:
* ⏰ **El mensaje de 24 horas antes:** Confirmación con un toque que compromete a la clienta.
* ⚡ **El aviso de 3 horas antes:** Mensaje de cortesía con ubicación y recomendaciones previas.
* 🔄 **Política de cancelación amable:** Cómo comunicar cancelaciones con tiempo para reasignar el horario.`,
    clics_count: 0,
    orden: 2,
    activo: true,
  },
  {
    id: 'plantillas-reactivar-clientas',
    categoria: 'tengo_salon',
    subcategoria: 'educacion',
    titulo: 'Plantillas de WhatsApp para reactivar clientas',
    subtitulo: 'Recupera clientas inactivas en 1 clic',
    descripcion: 'Mensajes listos para recuperar a las que no regresan hace 60 días.',
    badge: '💬 PLANTILLAS LISTAS',
    icono: '💬',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero descargar las Plantillas de WhatsApp para reactivar clientas dormidas.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Descargar plantillas',
    contenido_detalle_markdown: `### 💬 Plantillas de WhatsApp para reactivar clientas
> 🎯 *"Es 5 veces más fácil y barato hacer que vuelva una clienta que ya te conoce que conseguir una nueva."*

#### 📦 Las plantillas que recibirás:
* 🌟 **Plantilla 'Te extrañamos':** Mensaje cariñoso con beneficio especial para clientas de +60 días.
* 💅 **Plantilla 'Retoque vencido':** Aviso cordial para manicuristas y lashistas.
* 📢 **Plantilla 'Cupos de última hora':** Para llenar huecos en días lentos como martes y miércoles.`,
    clics_count: 0,
    orden: 3,
    activo: true,
  },
  {
    id: 'calculadora-no-shows',
    categoria: 'tengo_salon',
    subcategoria: 'standard',
    titulo: 'Calculadora: ¿cuánto pierdes por no-shows?',
    subtitulo: 'Diagnóstico financiero en 1 minuto',
    descripcion: 'Calcula en un minuto cuánto dinero se te escapa al mes por inasistencias sin aviso.',
    badge: '🧮 HERRAMIENTA GRATIS',
    icono: '🧮',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero calcular cuánto dinero pierde mi salón al mes por inasistencias y no-shows.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Calcular ahora',
    contenido_detalle_markdown: `### 🧮 Calculadora de Pérdidas por No-Shows
> 💡 *"Si tienes 4 inasistencias por semana con un ticket promedio de S/ 40, estás perdiendo S/ 640 al mes y más de S/ 7,600 al año."*

#### 📊 ¿Cómo solucionarlo?
* Con un sistema de recordatorios automáticos de 24h y 3h por WhatsApp puedes reducir las inasistencias hasta en un 85%.
* Escríbeme y te ayudo a calcular el impacto exacto para tu salón.`,
    clics_count: 0,
    orden: 4,
    activo: true,
  },

  // ══════════════════════════════════════════
  // CATEGORÍA B: "QUIERO INDEPENDIZARME"
  // ══════════════════════════════════════════
  {
    id: 'ebook-flagship-independizarse',
    categoria: 'quiero_independizarme',
    subcategoria: 'educacion',
    titulo: 'Ebook: Método completo — de aprendiz a dueña',
    subtitulo: 'Para lashistas y manicuristas listas para su propio negocio',
    descripcion: 'El método que uso para ayudar a lashistas y manicuristas a pasar de trabajar para otros a tener sus primeras clientas propias, sin quemarse en el intento.',
    badge: '⭐ FLAGSHIP',
    icono: '👑',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero descargar el Ebook completo: De aprendiz a dueña de tu salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Descargar gratis',
    contenido_detalle_markdown: `### 👑 Ebook: Método completo — De aprendiz a dueña
> 🚀 *"No necesitas miles de dólares para independizarte, necesitas un método claro para conseguir y retener a tus primeras 30 clientas fieles."*

#### 📦 En este Ebook aprenderás:
* 🪜 **La escalera de independencia:** De comisionar en salón ajeno a montar tu propio estudio.
* 💰 **Presupuesto mínimo viable:** Qué materiales comprar primero y qué gastos evitar.
* 📅 **Organización desde el día 1:** Cómo llevar agenda y fichas desde tu celular sin depender de libretas.`,
    clics_count: 0,
    orden: 5,
    activo: true,
  },
  {
    id: 'tutorial-primeras-clientas-4dolares',
    categoria: 'quiero_independizarme',
    subcategoria: 'educacion',
    titulo: 'Tutorial: tus primeras clientas con $4 al día',
    subtitulo: 'Estrategia de captación local para principiantes',
    descripcion: 'Cómo armar tu primer anuncio en redes sociales para conseguir tus primeras clientas cerca de tu zona.',
    badge: '🎯 TUTORIAL PASO A PASO',
    icono: '🎯',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero ver el Tutorial: Cómo conseguir mis primeras clientas con $4 al día.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Ver tutorial gratis',
    contenido_detalle_markdown: `### 🎯 Tutorial: Tus primeras clientas con $4 al día
> 💡 *"No necesitas presupuestos gigantes de publicidad, solo un buen video de tu trabajo mostrado a mujeres en un radio de 3km a la redonda."*

#### 📦 Qué incluye el tutorial:
* 📱 **Grabación con celular:** Cómo mostrar el antes y después de pestañas o uñas con buena iluminación.
* 📍 **Segmentación local:** Configura tu anuncio para que solo lo vean personas que viven cerca de ti.
* 💬 **Respuesta rápida en WhatsApp:** El mensaje inicial para cerrar la cita en los primeros 5 minutos.`,
    clics_count: 0,
    orden: 6,
    activo: true,
  },
  {
    id: 'guia-cuando-dar-el-salto',
    categoria: 'quiero_independizarme',
    subcategoria: 'educacion',
    titulo: 'Guía: cuándo dar el salto',
    subtitulo: 'Toma la decisión en el momento correcto',
    descripcion: 'Las señales para saber si ya estás lista para independizarte, o si conviene seguir ganando experiencia.',
    badge: '🧭 GUÍA ESTRATÉGICA',
    icono: '🧭',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero leer la Guía: Cuándo dar el salto e independizarme de mi trabajo actual.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Leer guía',
    contenido_detalle_markdown: `### 🧭 Guía: Cuándo dar el salto
> 🎯 *"Independizarse antes de tiempo genera estrés; hacerlo en el momento justo genera libertad y estabilidad."*

#### 📦 Las 5 señales clave:
1. Tienes al menos 15-20 clientas que te piden cita a ti directamente.
2. Tu velocidad y técnica ya alcanzan estándares profesionales.
3. Tienes un fondo de ahorro para 2 meses de materiales.
4. Conoces tus costos por servicio al centavo.
5. Cuentas con un canal directo de WhatsApp organizado.`,
    clics_count: 0,
    orden: 7,
    activo: true,
  },

  // ══════════════════════════════════════════
  // CATEGORÍA C: "GUÍAS Y PLANTILLAS GRATIS"
  // ══════════════════════════════════════════
  {
    id: 'pack-mensajes-whatsapp',
    categoria: 'guias_plantillas',
    subcategoria: 'educacion',
    titulo: 'Pack de mensajes de WhatsApp',
    subtitulo: 'El kit esencial para tu atención diaria',
    descripcion: 'Fidelización, recordatorios y seguimiento post-cita: el paquete completo de plantillas.',
    badge: '📦 PACK COMPLETO',
    icono: '💬',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero descargar el Pack completo de mensajes de WhatsApp para salones.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Descargar pack',
    contenido_detalle_markdown: `### 💬 Pack de Mensajes de WhatsApp
> 🎁 *"Copia y pega estos mensajes listos para brindar una experiencia 5 estrellas a tus clientas."*

#### 📦 Contenido del pack:
* 🌟 **Mensaje de bienvenida & primera cita**
* ⏰ **Recordatorio 24h con confirmación**
* 💖 **Seguimiento post-cita a las 48h**
* 🔔 **Aviso de retoque o mantenimiento**
* 🎂 **Felicitación por cumpleaños con descuento**`,
    clics_count: 0,
    orden: 8,
    activo: true,
  },
  {
    id: 'catalogo-disenos-suben-ticket',
    categoria: 'guias_plantillas',
    subcategoria: 'educacion',
    titulo: 'Catálogo de diseños que suben tu ticket',
    subtitulo: 'Uñas, pestañas y combos de alto valor',
    descripcion: 'Los diseños y combos más solicitados según especialidad, con cómo presentarlos.',
    badge: '🎨 CATÁLOGO VISUAL',
    icono: '🎨',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero ver el Catálogo de diseños y combos que suben el ticket promedio.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Ver catálogo',
    contenido_detalle_markdown: `### 🎨 Catálogo de Diseños que Suben tu Ticket
> 💡 *"No compitas por precio: ofrece combos y servicios complementarios que tus clientas quieran agregar a su cita."*

#### 📦 Qué incluye:
* 💅 **Técnicas de Nail Art con mayor margen:** Efectos, 3D y encapsulados.
* 👁️ **Efectos de pestañas en tendencia:** Efecto Wispy, Foxy y Wet Look.
* 📋 **Guía para estructurar tu menú de precios:** Cómo presentar suplementos de forma clara.`,
    clics_count: 0,
    orden: 9,
    activo: true,
  },
  {
    id: 'guion-mantenimiento-retoque',
    categoria: 'guias_plantillas',
    subcategoria: 'educacion',
    titulo: 'Guión de mantenimiento y retoque',
    subtitulo: 'Según especialidad (pestañas, uñas, cejas)',
    descripcion: 'El mensaje exacto para recordar el retoque sin sonar repetitivo, según tu especialidad.',
    badge: '📝 GUIONES LISTOS',
    icono: '📝',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero copiar las plantillas del Guión de mantenimiento y retoque.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Copiar plantilla',
    contenido_detalle_markdown: `### 📝 Guión de Mantenimiento y Retoque
> 🎯 *"Recuérdale su retoque como un cuidado personal indispensable, no como una venta insistente."*

#### 📦 Guiones por especialidad:
* 👁️ **Pestañas (Día 16):** Para asegurar que el set se mantenga tupido y simétrico.
* 💅 **Uñas (Día 20):** Para evitar desprendimientos y cuidar la uña natural.
* 🪞 **Cejas / Microblading (Día 30):** Para sellar el color y perfilado perfecto.`,
    clics_count: 0,
    orden: 10,
    activo: true,
  },
];

const LOCAL_STORAGE_KEY_SOLUCIONES = 'korat_soluciones_catalog_v6';
const LOCAL_STORAGE_KEY_CATEGORIAS = 'korat_soluciones_categorias_v6';
const LOCAL_STORAGE_KEY_HEADER = 'korat_soluciones_header_v6';

export async function getHeaderConfig(): Promise<SolucionesHeaderConfig> {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_HEADER);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && parsed.nombrePersona && !parsed.nombrePersona.includes('Ã')) {
        return parsed;
      }
    } catch { /* ignore */ }
  }

  try {
    const { data, error } = await supabase
      .from('soluciones_header_config')
      .select('*')
      .eq('id', 'main')
      .single();

    if (!error && data && data.nombre_persona && !data.nombre_persona.includes('Ã')) {
      const config = {
        statusBadge: data.status_badge || HEADER_DEFAULT.statusBadge,
        nombrePersona: data.nombre_persona || HEADER_DEFAULT.nombrePersona,
        subtituloPersona: data.subtitulo_persona || HEADER_DEFAULT.subtituloPersona,
        trustBadge1: data.trust_badge1 || HEADER_DEFAULT.trustBadge1,
        trustBadge2: data.trust_badge2 || HEADER_DEFAULT.trustBadge2,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_HEADER, JSON.stringify(config));
      return config;
    }
  } catch (e) {
    /* ignore fallback */
  }

  localStorage.setItem(LOCAL_STORAGE_KEY_HEADER, JSON.stringify(HEADER_DEFAULT));
  return HEADER_DEFAULT;
}

export async function saveHeaderConfig(config: SolucionesHeaderConfig): Promise<void> {
  try {
    await supabase
      .from('soluciones_header_config')
      .upsert({
        id: 'main',
        status_badge: config.statusBadge,
        nombre_persona: config.nombrePersona,
        subtitulo_persona: config.subtituloPersona,
        trust_badge1: config.trustBadge1,
        trust_badge2: config.trustBadge2,
        updated_at: new Date().toISOString(),
      });
  } catch (e) { /* ignore fallback */ }

  localStorage.setItem(LOCAL_STORAGE_KEY_HEADER, JSON.stringify(config));
}

export async function getCategorias(): Promise<CategoriaPersonalizada[]> {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIAS);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && !JSON.stringify(parsed).includes('Ã')) {
        return parsed;
      }
    } catch { /* ignore */ }
  }

  try {
    const { data, error } = await supabase
      .from('soluciones_categorias')
      .select('*')
      .order('orden', { ascending: true });

    if (!error && data && data.length > 0 && !JSON.stringify(data).includes('Ã')) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIAS, JSON.stringify(data));
      return data as CategoriaPersonalizada[];
    }
  } catch (e) {
    /* ignore fallback */
  }

  localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIAS, JSON.stringify(CATEGORIAS_DEFAULT));
  return CATEGORIAS_DEFAULT;
}

export async function saveCategorias(categorias: CategoriaPersonalizada[]): Promise<void> {
  try {
    await supabase
      .from('soluciones_categorias')
      .upsert(categorias);
  } catch (e) { /* ignore */ }

  localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIAS, JSON.stringify(categorias));
}

export async function getSoluciones(): Promise<SolucionItem[]> {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_SOLUCIONES);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && !JSON.stringify(parsed).includes('Ã') && parsed.some(i => i.id === 'software-desarrollo-a-medida')) {
        return parsed;
      }
    } catch { /* ignore */ }
  }

  try {
    const { data, error } = await supabase
      .from('soluciones_catalog')
      .select('*')
      .order('orden', { ascending: true });

    if (!error && data && data.length > 0 && !JSON.stringify(data).includes('Ã')) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(data));
      return data as SolucionItem[];
    }
  } catch (e) {
    /* ignore */
  }

  localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(MODULOS_DEFAULT));
  return MODULOS_DEFAULT as SolucionItem[];
}

export async function trackSolucionClick(id: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('soluciones_catalog')
      .select('clics_count')
      .eq('id', id)
      .single();

    const currentCount = data?.clics_count || 0;

    await supabase
      .from('soluciones_catalog')
      .update({ clics_count: currentCount + 1 })
      .eq('id', id);
  } catch (e) {
    console.warn('Fallback local click tracking:', e);
  }

  const current = await getSoluciones();
  const index = current.findIndex(i => i.id === id);
  if (index >= 0) {
    current[index].clics_count = (current[index].clics_count || 0) + 1;
    localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(current));
  }
}

export async function saveSolucion(solucion: Partial<SolucionItem>): Promise<void> {
  try {
    await supabase
      .from('soluciones_catalog')
      .upsert({
        ...solucion,
        updated_at: new Date().toISOString(),
      });
  } catch (e) {
    console.warn('Fallback saving solucion locally:', e);
  }

  const current = await getSoluciones();
  const index = current.findIndex(i => i.id === solucion.id);
  if (index >= 0) {
    current[index] = { ...current[index], ...solucion } as SolucionItem;
  } else {
    current.push(solucion as SolucionItem);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(current));
}

export async function deleteSolucion(id: string): Promise<void> {
  try {
    await supabase
      .from('soluciones_catalog')
      .delete()
      .eq('id', id);
  } catch (e) {
    console.warn('Fallback deleting solucion locally:', e);
  }

  const current = await getSoluciones();
  const filtered = current.filter(i => i.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(filtered));
}

