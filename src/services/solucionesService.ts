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
  subtituloPersona: 'Te enseño a multiplicar las ventas y retención de tu salón por WhatsApp con automatización inteligente.',
  trustBadge1: 'Cero Plantones en Citas',
  trustBadge2: 'Retoques Automáticos a los 21d',
  whatsappNumber: '51926285289',

  filosofiaTexto: 'El 60% de tus clientas no regresan porque nadie les escribe a tiempo. La automatización por WhatsApp te asegura que vuelvan cada mes.',

  freemiumBadge: 'SISTEMA GRATUITO (FREEMIUM)',
  freemiumTitulo: 'Nilah App — Sistema para Salones',
  freemiumSubtitulo: '¡Dile adiós al cuaderno y al Excel! Controla tus citas, fichas de clientas, finanzas y servicios desde tu celular.',
  freemiumFeature1Title: 'Caja Chica & Ventas',
  freemiumFeature1Desc: 'Controla ingresos y egresos',
  freemiumFeature2Title: 'Fichas de Clientas',
  freemiumFeature2Desc: 'Curvaturas, esmaltes y alergias',
  freemiumFeature3Title: 'Agenda & Citas',
  freemiumFeature3Desc: 'Historial y reservas',
  freemiumFeature4Title: '100% en tu Celular',
  freemiumFeature4Desc: 'Funciona en cualquier móvil',
  freemiumBotonTexto: 'EMPEZAR A USAR GRATIS AHORA',
  freemiumBotonUrl: '/login?tab=register',
  freemiumDisclaimer: 'Ideal para Lashistas, Manicuristas y Salones. Sin tarjeta de crédito.',

  aMedidaTitulo: '¿Buscas Software o Bots con IA a Medida?',
  aMedidaSubtitulo: 'Para academias, clínicas estéticas o empresas de otros rubros.',
  aMedidaBotonTexto: 'Cotizar en WhatsApp',
  aMedidaWhatsappMensaje: '¡Hola Martín! Vi tus videos en TikTok y me gustaría cotizar un desarrollo de software / automatización a medida para mi empresa/proyecto.',

  footerPregunta: '¿Tienes dudas o necesitas una recomendación para tu salón?',
  footerBotonTexto: 'Escríbeme directo al WhatsApp (+51 926 285 289)',
  footerWhatsappMensaje: 'Hola Martín! Vi tu perfil en TikTok y me gustaría consultarte cuál es el mejor plan o módulo para mi negocio.',
};

export const CATEGORIAS_DEFAULT: CategoriaPersonalizada[] = [
  { id: 'todos', label: '✨ Todo el Catálogo', shortLabel: '✨ Todos', icon: '✨', orden: 1, activo: true },
  { id: 'lashistas', label: '👁️ Lashistas (Pestañas)', shortLabel: '👁️ Lashistas', icon: '👁️', orden: 2, activo: true },
  { id: 'manicuristas', label: '💅 Manicuristas (Nails)', shortLabel: '💅 Nails', icon: '💅', orden: 3, activo: true },
  { id: 'salones', label: '💇‍♀️ Salones & Spas', shortLabel: '💇‍♀️ Salones', icon: '💇‍♀️', orden: 4, activo: true },
  { id: 'educacion', label: '📚 Guías & Plantillas Gratis', shortLabel: '📚 Gratis', icon: '📚', orden: 5, activo: true },
];

export const MODULOS_DEFAULT: Omit<SolucionItem, 'created_at' | 'updated_at'>[] = [
  // ── 1. PLAN GLOW PRO 360° (EL MOTOR DE RETENCIÓN POR WHATSAPP) ──
  {
    id: 'salon-plan-pro',
    categoria: 'salones',
    subcategoria: 'plan_pro',
    titulo: 'PLAN GLOW PRO 360° (⭐ Automatización WhatsApp)',
    subtitulo: 'Recordatorios WhatsApp, Retoques 21d, Rescate de clientas dormidas & Stand QR 5★',
    descripcion: 'El sistema automático completo para salones y estudios: envía recordatorios 24h y 3h antes para eliminar plantones, avisa solas a las clientas a los 21 días para su retoque, recupera clientas inactivas y junta reseñas de 5 estrellas en Google.',
    badge: '⭐ AUTOMATIZACIÓN 360°',
    icono: '💎',
    precio: 'Glow PRO 360°',
    mensaje_whatsapp: '¡Hola Martín! Vi tu video en TikTok y me gustaría implementar el PLAN GLOW PRO 360° en mi salón/estudio para automatizar los recordatorios y retoques por WhatsApp.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '🔥 Probar Plan PRO en WhatsApp',
    contenido_detalle_markdown: `### ⭐ PLAN GLOW PRO 360° — "El que se Paga Solo"
> 💡 *"El secreto de los salones llenos no es gastar más en publicidad, sino lograr que el 80% de tus clientas regresen solas cada mes sin que tengas que perseguirlas por WhatsApp."*

Diseñado para dueñas de salón, lashistas y manicuristas que quieren dejar de perder dinero por inasistencias y turnos vacíos.

#### 📦 Lo que automatiza en tu salón:
* ⚡ **Recordatorios Anti-Plantones (24h y 3h antes):** Envía un WhatsApp automático y formal con los datos de la cita. La clienta confirma con 1 solo toque y se actualiza tu agenda.
* ⏰ **Aviso Automático de Retoques (15 a 21 días):** El sistema calcula cuándo vence el servicio de pestañas o uñas y le escribe una invitación personalizada para asegurar su mantenimiento.
* 🔄 **Rescate Inteligente de Clientas Inactivas (+30d y +45d):** Envía ofertas amigables y exclusivas a clientas que dejaron de venir para reactivarlas automáticamente.
* 📢 **Campañas Masivas de WhatsApp para Días Flojos:** Envía promociones relámpago a toda tu base en 1 clic para llenar los martes y miércoles con protección anti-spam.
* 🌟 **Stand QR Acrílico de Reseñas 5★ Google:** Stand físico para tu mostrador que convierte clientas felices en calificaciones de 5 estrellas en Google Maps.
* 👑 **Club de Puntos & Fidelización VIP:** Tarjeta de puntos digital que premia a tus clientas frecuentes por WhatsApp.
* 👥 **Clientas y Citas ILIMITADAS** + Soporte prioritario directo.`,
    clics_count: 0,
    orden: 1,
    activo: true,
  },

  // ── 2. PLAN GLOW BÁSICO (ORDEN & AGENDA DIGITAL) ──
  {
    id: 'salon-plan-basico',
    categoria: 'salones',
    subcategoria: 'plan_basico',
    titulo: 'PLAN GLOW BÁSICO (🌱 Orden, Agenda & Ficha Técnica)',
    subtitulo: 'Para profesionales independientes que quieren dejar el cuaderno y ordenar su negocio',
    descripcion: 'Tu salón en tu bolsillo: Agenda interactiva con horarios, Ficha técnica digital de clientas (curvaturas, esmaltes, fórmulas, alergias), control de ingresos del día y catálogo de servicios.',
    badge: '🌱 ESENCIAL PARA EMPEZAR',
    icono: '📅',
    precio: 'Plan Glow Básico',
    mensaje_whatsapp: '¡Hola Martín! Vi tu perfil en TikTok y me gustaría empezar con el PLAN GLOW BÁSICO para organizar mi agenda y las fichas de mis clientas.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Plan Básico',
    contenido_detalle_markdown: `### 🌱 PLAN GLOW BÁSICO — "Orden & Agenda Digital"
> 🎯 *"Despídete del cuaderno de papel, los audios perdidos de WhatsApp y el desorden en tus cobros diarios."*

Ideal para lashistas y manicuristas que atienden solas o están empezando y necesitan una herramienta limpia y rápida para su día a día.

#### 📦 Lo que incluye el Plan Básico:
* 📅 **Agenda Móvil Rápida:** Visualiza tus citas por día, semana o especialista con tiempos de atención definidos.
* 📋 **Ficha Técnica Digital de Clientas:** Guarda qué curvatura, grosor de pestañas, tono de esmalte o alergias tiene cada clienta para atenderla siempre como una reina.
* 💰 **Finanzas del Día & Arqueo:** Registro simple de ingresos por servicio, gastos y balance diario de caja.
* 🛍️ **Tienda & Módulos a la Carta:** Posibilidad de desbloquear funciones adicionales cuando tu salón lo necesite.
* 👥 **Hasta 100 clientas registradas** en tu base de datos.`,
    clics_count: 0,
    orden: 2,
    activo: true,
  },

  // ── 3. LASHISTAS: ESPECIALIDAD PESTAÑAS ──
  {
    id: 'lash-modulo-mapeo-retoques',
    categoria: 'lashistas',
    subcategoria: 'addon',
    titulo: '👁️ Protocolo Lashista: Mapeo de Ojos & Retoques 15-21d',
    subtitulo: 'Especial para Lashistas Independientes y Estudios de Miradas',
    descripcion: 'Aprende a registrar el mapeo técnico de cada clienta (curvatura C/D/L/M, largos 8-15mm, adhesivo y alergias) y automatiza el recordatorio de retoque antes de que se caiga el set.',
    badge: '👁️ ESPECIAL LASHISTAS',
    icono: '👁️',
    precio: 'Módulo Lashista',
    mensaje_whatsapp: '¡Hola Martín! Me interesa implementar el Módulo Especial Lashista para registro de curvaturas y avisos de retoques automáticos.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Ver Módulo para Lashistas',
    contenido_detalle_markdown: `### 👁️ Especial Lashistas: Retención & Mapeo Digital
> 🎯 *"Una clienta de pestañas que no regresa a su retoque a los 21 días es una clienta que terminas perdiendo. Con este sistema aseguras su cita de mantenimiento a tiempo."*

#### 📦 Herramientas especializadas para Lashistas:
* 👁️ **Mapeo Técnico de Miradas:** Registro por ojo de estilo (Clásicas, Híbridas, Volumen Ruso, Foxy, Efecto Rímel).
* 📐 **Ficha de Curvatura & Grosor:** Control de curvaturas (C, CC, D, L, M), grosores (0.05 a 0.15) y longitudes por cuadrante.
* 🧪 **Historial de Adhesivos & Parches:** Fecha de apertura del adhesivo y registro de alergias o sensibilidades oculares.
* ⏰ **WhatsApp Automático de Retoque:** Mensaje automático al día 16 para reservar su hora antes de que su set pierda forma.`,
    clics_count: 0,
    orden: 3,
    activo: true,
  },

  // ── 4. MANICURISTAS: ESPECIALIDAD NAILS ──
  {
    id: 'nails-modulo-catalogo-mantenimiento',
    categoria: 'manicuristas',
    subcategoria: 'addon',
    titulo: '💅 Protocolo Nails: Catálogo de Diseños & Mantenimiento a 20d',
    subtitulo: 'Especial para Manicuristas, Nail Artists y Salones de Uñas',
    descripcion: 'Permite que la clienta escoja técnica y diseño antes de sentarse en tu mesa. Envía aviso automático de mantenimiento a los 20 días antes de que la uña crezca de más o se quiebre.',
    badge: '💅 ESPECIAL NAILS',
    icono: '💅',
    precio: 'Módulo Nails',
    mensaje_whatsapp: '¡Hola Martín! Me interesa el Módulo Nails para catálogo de diseños de uñas y avisos de mantenimiento a los 20 días.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Ver Módulo para Nails',
    contenido_detalle_markdown: `### 💅 Especial Manicuristas & Nails: Mantenimiento & Ventas
> 🎯 *"Ahorra hasta 15 minutos por cita haciendo que la clienta defina técnica y suplementos de Nail Art con anticipación."*

#### 📦 Herramientas especializadas para Manicuristas:
* 💅 **Ficha de Técnica & Preferencias:** Acrílicas, Gel, Polygel, Rubber, Kapping o Semipermanente.
* 🎨 **Galería Visual de Suplementos:** Precios claros para efectos (Cromo, 3D, Pedrería, Mano alzada).
* ⏰ **Disparo de Mantenimiento a los 20 Días:** WhatsApp cordial que le recuerda cuidar sus uñas naturales y agendar su retiro/mantenimiento.
* 📢 **Plantillas de Ofertas Flash:** Copys probados para llenar horas libres cuando llueve o en días con huecos en la agenda.`,
    clics_count: 0,
    orden: 4,
    activo: true,
  },

  // ── 5. DUEÑAS DE SALÓN & SPAS ──
  {
    id: 'salon-modulo-multistaff-comisiones',
    categoria: 'salones',
    subcategoria: 'addon',
    titulo: '👑 Protocolo Dueñas de Salón: Multiestilista, Comisiones & Stand QR',
    subtitulo: 'Para Salones de Belleza, Spas y Centros con Múltiples Colaboradoras',
    descripcion: 'Agendas independientes para cada especialista, cálculo automático de comisiones por porcentaje, arqueo de caja chica por método de pago y Stand QR para reseñas de 5 estrellas en Google.',
    badge: '👑 ESPECIAL SALONES',
    icono: '👑',
    precio: 'Módulo Salón',
    mensaje_whatsapp: '¡Hola Martín! Me interesa el Módulo de Salón con gestión Multiestilista, Comisiones y Stand QR de Google.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar para Salones',
    contenido_detalle_markdown: `### 👑 Módulo Dueña de Salón: Control de Equipo & Google 5★
> 🎯 *"Ten el control total de tu negocio sin depender de estar pegada todo el día en la recepción."*

#### 📦 Beneficios para Dueñas de Salón:
* 👥 **Vistas Separadas para Colaboradoras:** Cada manicurista, lashista o estilista ve solo sus citas sin tocar la administración general.
* 💰 **Liquidación Automática de Comisiones:** Olvídate de calcular a mano al final de la semana; el sistema calcula los porcentajes acordados al instante.
* 🌟 **Stand QR Físico de Google Maps:** Colócalo en caja para que cada clienta feliz deje su reseña de 5 estrellas al terminar su servicio.
* 📊 **Control de Caja Chica:** Arqueo diario exacto de Yape, Plin, Efectivo y Tarjeta.`,
    clics_count: 0,
    orden: 5,
    activo: true,
  },

  // ── 6. SECCIÓN ESPECIAL: SOFTWARE & AUTOMATIZACIONES A MEDIDA ──
  {
    id: 'software-desarrollo-a-medida',
    categoria: 'a_medida',
    subcategoria: 'a_medida',
    titulo: '⚡ Software & Automatizaciones a Medida para tu Negocio',
    subtitulo: 'Para Academias, Cadenas de Salones, Clínicas o Empresas de Otros Rubros',
    descripcion: '¿Tienes un proyecto especial, academia de cursos, clínica estética o negocio fuera de belleza? Desarrollo bots de WhatsApp personalizados con IA, integraciones con CRM, pasarelas de pago y sistemas a la medida de tu empresa.',
    badge: '🚀 PROYECTOS A MEDIDA',
    icono: '⚡',
    precio: 'Cotización Personalizada',
    mensaje_whatsapp: '¡Hola Martín! Vi tus videos en TikTok y busco una cotización para un desarrollo de software / automatización a medida para mi empresa.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '⚡ Agendar Diagnóstico con Martín',
    contenido_detalle_markdown: `### ⚡ Desarrollo de Software & Automatizaciones a Medida
> 👨‍💻 **TRABAJO DIRECTO CON MARTÍN PESTANA:** *"Si tu modelo de negocio requiere una lógica especial, flujos avanzados de WhatsApp o una plataforma web completa, diseñamos una solución tecnológica a tu medida."*

#### 🛠️ ¿Qué podemos desarrollar para tu empresa?
* 🤖 **Chatbots Inteligentes de WhatsApp con IA:** Calificación de leads, cotización automática y agendamiento 24/7.
* 🔗 **Integraciones con tus Sistemas Actuales:** Conexión con hojas de Google Sheets, CRM, ERPs o pasarelas de pago (Mercado Pago, Stripe, Culqi).
* 🎓 **Sistemas para Academias & Cursos:** Plataformas de inscripción, entrega automática de diplomas digitales y recordatorios de clases por WhatsApp.
* 📱 **Web Apps & Paneles Administrativos:** Paneles de control para gestión de sedes, inventarios y equipos comerciales.

#### 🤝 ¿Cómo es el proceso?
1. Conversamos por WhatsApp sobre lo que necesita tu negocio.
2. Realizamos una llamada de diagnóstico técnico para definir el alcance exacto.
3. Te presento una propuesta con tiempos de entrega y presupuesto cerrado.`,
    clics_count: 0,
    orden: 6,
    activo: true,
  },

  // ── 7. EDUCACIÓN & PLANTILLAS GRATIS (CORE WHATSAPP) ──
  {
    id: 'playbook-mensajes-activadores-whatsapp',
    categoria: 'educacion',
    subcategoria: 'educacion',
    titulo: '📚 Playbook de Mensajes por WhatsApp para Salones & Lashistas',
    subtitulo: 'Aprende la anatomía del mensaje de alta conversión (PDF + Vista Digital)',
    descripcion: 'Más de 40 copys listos para adaptar en tu salón. Aprende la diferencia entre un mensaje que suena a spam y uno que genera citas inmediatas en WhatsApp.',
    badge: '🎁 100% GRATIS',
    icono: '📚',
    precio: 'GRATIS',
    mensaje_whatsapp: '¡Hola Martín! Vi tu video en TikTok y quiero leer el Playbook de Mensajes de WhatsApp para Salones de Belleza.',
    url_checkout: '/playbook-whatsapp',
    tipo_boton: 'descarga',
    texto_boton_personalizado: '📚 Leer Playbook / Descargar',
    contenido_detalle_markdown: `### 📚 Playbook de Mensajes Activadores por WhatsApp
> 🎯 *"El error número 1 de las dueñas de salón es enviar mensajes largos, aburridos o que parecen publicidad masiva. Aprende la fórmula de los mensajes cortos que generan respuestas inmediatas."*

#### 📝 Lo que aprenderás en este Playbook:
* 👁️ **Fórmula de Retoque de Pestañas (Día 16):** Cómo invitar a la clienta a mantener su set antes de que se caiga sin parecer desesperada.
* 💅 **Fórmula de Días Flojos (Martes & Miércoles):** La técnica de los "4 cupos exclusivos" para llenar huecos en la agenda.
* 🔄 **Protocolo de Rescate de Clientas Dormidas:** El mensaje de 3 líneas que reactiva clientas que no te escribían hace 2 meses.
* 🛡️ **Las 3 Reglas de Oro Anti-Spam:** Cómo cuidar tu número de WhatsApp para que nunca te bloqueen.`,
    clics_count: 0,
    orden: 7,
    activo: true,
  },
  {
    id: 'plantilla-ficha-tecnica-imprimible',
    categoria: 'educacion',
    subcategoria: 'educacion',
    titulo: '📋 Ficha Técnica de Clienta (Pestañas, Uñas & Alergias)',
    subtitulo: 'Plantilla en PDF Imprimible & Digital',
    descripcion: 'Formato limpio para registrar datos clave de cada clienta: historial de curvaturas, marcas de pegamento, sensibilidad en ojos y tonos favoritos de esmalte.',
    badge: '📋 PLANTILLA GRATIS',
    icono: '📋',
    precio: 'GRATIS',
    mensaje_whatsapp: '¡Hola Martín! Quiero descargar la Plantilla de Ficha Técnica de Clienta para Lashistas y Manicuristas.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '📥 Solicitar Plantilla Gratis',
    contenido_detalle_markdown: `### 📋 Ficha Técnica de Clienta para Belleza
> 🎯 *"Atiende a tus clientas como en un salón de lujo recordando exactamente cada detalle de su servicio anterior."*

#### 📦 Lo que incluye la plantilla:
* 👁️ **Sección Lashista:** Mapeo de ojo izquierdo/derecho, curvatura, grosor, longitud y parche de prueba.
* 💅 **Sección Nails:** Técnica preferida, forma de uña, largos y códigos de esmaltes.
* ⚠️ **Consentimiento & Alergias:** Registro formal de cuidados posteriores y confirmación de salud ocular/cutánea.`,
    clics_count: 0,
    orden: 8,
    activo: true,
  },
];

const LOCAL_STORAGE_KEY_SOLUCIONES = 'korat_soluciones_catalog_v4';
const LOCAL_STORAGE_KEY_CATEGORIAS = 'korat_soluciones_categorias_v4';
const LOCAL_STORAGE_KEY_HEADER = 'korat_soluciones_header_v4';

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

