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
  freemiumBotonUrl: '/nilah/login?tab=register',
  freemiumDisclaimer: 'Ideal para lashistas, manicuristas y salones. Sin tarjeta de crédito. Hasta 100 clientas 100% gratis.',

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
  { id: 'modulos_addons', label: 'Módulos & Herramientas', shortLabel: '⚡ Módulos', icon: '⚡', orden: 4, activo: true },
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
    descripcion: 'Por qué una clienta viene dos veces y nunca más regresa, y cómo activar tu club invisible por WhatsApp con mensajes activadores y puntos.',
    badge: '⭐ EBOOK FLAGSHIP',
    icono: '📖',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero leer el Ebook: Cómo hacer que tus clientas regresen (Edición oficial 2026).',
    url_demo: '/ebooks/como-hacer-que-tus-clientas-regresen',
    tipo_boton: 'enlace',
    texto_boton_personalizado: 'Leer online & Descargar',
    contenido_detalle_markdown: `### 📖 Ebook: Cómo hacer que tus clientas regresen
> 💡 *"No necesitas más clientas nuevas este mes. Necesitas menos clientas que se te escapen en silencio."*

#### 📦 En este Ebook descubrirás:
* 🚪 **El club invisible en tu WhatsApp:** La sala de espera de clientas con +60 días que ya confiaron en ti.
* 🔍 **Las 4 razones reales de abandono:** Por qué el silencio y la falta de seguimiento (no el mal trabajo) es la causa #1.
* 📊 **El costo real de no fidelizar:** Métricas verificadas de SalonWOP 2025 y Zenoti (5x más barato, 42% = 80% ingresos).
* 💬 **El seguimiento simple (Mensaje Activador):** Estructura de 3 pasos (Gancho, Confidencia y Cierre suave) con plantilla lista para copiar.
* 🏆 **Puntos y premios:** La psicología del juego y cómo opera el sistema automatizado de Nilah.
* 👥 **Las 3 audiencias:** Recién atendidas, retoque a tiempo y ausentes de 30/60/90 días.
* 📥 **Lectura online directa y descargas en PDF y Word (.doc).**`,
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
    descripcion: 'El protocolo de dos toques (24h y 3h antes) y las plantillas exactas que reducen inasistencias en más de 25%.',
    badge: '🛡️ GUÍA PRÁCTICA',
    icono: '🛡️',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero leer la Guía Anti no-show con las plantillas de recordatorios de 24h y 3h.',
    url_demo: '/ebooks/guia-anti-no-show',
    tipo_boton: 'enlace',
    texto_boton_personalizado: 'Leer online & Descargar',
    contenido_detalle_markdown: `### 🛡️ Guía Anti No-Show — Reduce inasistencias y citas olvidadas
> 🎯 *"La silla vacía cuesta más de lo que parece: no es solo el dinero, es el tiempo reservado, los productos listos y el ánimo del día."*

#### 📦 En esta guía descubrirás:
* ⏰ **El protocolo de los dos toques:** Por qué 1 solo aviso no basta y cómo los avisos 24h y 3h antes bajan 25% las faltas.
* 📱 **Plantillas listas de 24h:** Estándar, urgencia de mantenimiento (efecto que baja) y para clientas nuevas.
* 📍 **Plantillas listas de 3h:** Logística con ubicación exacta, recomendaciones de uñas limpias y sin rímel.
* 🤝 **Recuperación post no-show:** Cómo retomar el contacto sin reclamos ni vergüenza para salvar a la clienta.
* 📋 **Política de cancelación amable:** El texto exacto de 1 línea para fijar expectativas sin sonar estricta.
* 📥 **Lectura online interactiva con botones para copiar y descargas en Word y PDF.**`,
    clics_count: 0,
    orden: 2,
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
    url_demo: '/ebooks/de-aprendiz-a-duena',
    tipo_boton: 'enlace',
    texto_boton_personalizado: 'Leer online & Descargar',
    contenido_detalle_markdown: `### 👑 Ebook: Método completo — De aprendiz a dueña
> 🚀 *"No necesitas miles de dólares para independizarte, necesitas un método claro para conseguir y retener a tus primeras 30 clientas fieles."*

#### 📦 En este Ebook aprenderás:
* 🪜 **La escalera de independencia:** De comisionar en salón ajeno a montar tu propio estudio.
* 💰 **Presupuesto mínimo viable:** Qué materiales comprar primero y qué gastos evitar.
* 📅 **Organización desde el día 1:** Cómo llevar agenda y fichas desde tu celular sin depender de libretas.
* 📱 **Lectura online y descargas en PDF y Word** disponibles de inmediato.`,
    clics_count: 0,
    orden: 5,
    activo: true,
  },
  {
    id: 'tutorial-primeras-clientas-4dolares',
    categoria: 'quiero_independizarme',
    subcategoria: 'educacion',
    titulo: 'Ebook: El anuncio de $4',
    subtitulo: 'Pierde el miedo, gana tus primeras clientas',
    descripcion: 'Cómo pasar de cero a tus primeras 20 o 30 clientas con tu celular, CapCut y $4 al día en Meta Ads, sin depender de la suerte.',
    badge: '🎯 EBOOK GRATIS',
    icono: '🎯',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero leer el Ebook: El anuncio de $4 (Pierde el miedo, gana tus primeras clientas).',
    url_demo: '/ebooks/el-anuncio-de-4-dolares',
    tipo_boton: 'enlace',
    texto_boton_personalizado: 'Leer online & Descargar',
    contenido_detalle_markdown: `### 🎯 Ebook: El anuncio de $4 — Pierde el miedo, gana tus primeras clientas
> 💡 *"Encender tu primer anuncio con $4 al día (S/14 aprox.) es mucho menos riesgoso de lo que tu cabeza te está diciendo ahora mismo."*

#### 📦 En este Ebook aprenderás:
* 🧠 **Por qué el miedo es normal:** La diferencia entre la que consigue clientas y la que sigue esperando el momento perfecto.
* ⚖️ **Orgánico vs. Pagado:** Por qué apostarlo todo al orgánico al empezar te deja sin ingresos este mes.
* 📱 **El video que sí funciona:** 3 elementos clave sin cámara profesional ni efectos complicados.
* 🛠️ **Paso a paso en Meta Ads:** Los 6 pasos para configurar tu campaña en radio de 3 a 5 km directo a WhatsApp.
* ⏳ **Qué esperar los primeros días:** Métricas reales del día 1 al 7 y cómo ajustar.
* 📥 **Lectura online directa y descargas gratuitas en PDF y Word (.doc).**`,
    clics_count: 0,
    orden: 6,
    activo: true,
  },
  {
    id: 'guia-cuando-dar-el-salto',
    categoria: 'quiero_independizarme',
    subcategoria: 'educacion',
    titulo: 'Guía: ¿Ya es tu momento?',
    subtitulo: 'La guía honesta para decidir cuándo dejar de trabajar para otros',
    descripcion: 'Las señales reales para saber si ya estás lista para independizarte, o si te conviene seguir ganando experiencia con estrategia.',
    badge: '🧭 GUÍA ESTRATÉGICA',
    icono: '🧭',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero leer la Guía: ¿Ya es tu momento? (La guía honesta para independizarte).',
    url_demo: '/ebooks/ya-es-tu-momento',
    tipo_boton: 'enlace',
    texto_boton_personalizado: 'Leer online & Descargar',
    contenido_detalle_markdown: `### 🧭 Guía: ¿Ya es tu momento? — La guía honesta para independizarte
> 💡 *"Independizarte no es una carrera contra nadie más, ni un premio por ser buena técnicamente: es una decisión de negocio con su momento correcto."*

#### 📦 En esta guía descubrirás:
* ⚖️ **El trato real:** Qué sacrificas y qué ganas siendo empleada vs. independiente (comisión 35% vs. 100% responsabilidad).
* ✅ **Las 5 señales de que ya estás lista:** Velocidad técnica estable, cálculo de costos reales, colchón financiero y plan de captación.
* ⏳ **Las 5 señales de seguir ganando experiencia:** Por qué quedarse un poco más no es fracaso, es estrategia.
* 🧠 **El test de frustración vs. preparación:** Cómo evitar saltar por cansancio o un mal mes.
* 🚪 **Lo que nadie te dice del otro lado:** Soledad de decisiones, horario sin descanso automático y gestión total.
* 🌉 **El puente de 4 pasos:** Cómo prepararte paso a paso mientras sigues empleada.
* 📥 **Lectura online directa y descargas gratuitas en Word (.doc) y PDF.**`,
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
    titulo: 'Playbook: Mensajes activadores de WhatsApp',
    subtitulo: 'Para salones de pestañas, uñas y belleza',
    descripcion: 'Copys listos para retoques de 21 días, recordatorios 24h, rescate de clientas dormidas y huecos en días lentos.',
    badge: '📖 EBOOK & COPYS',
    icono: '💬',
    precio: 'Gratis',
    mensaje_whatsapp: '¡Hola Martín! Quiero ver el Playbook de Mensajes Activadores de WhatsApp para salones.',
    url_demo: '/ebooks/playbook-whatsapp',
    tipo_boton: 'enlace',
    texto_boton_personalizado: 'Leer online & Copiar',
    contenido_detalle_markdown: `### 💬 Playbook: Mensajes Activadores por WhatsApp
> 🎁 *"Especializado para lashistas, manicuristas y salones de belleza: copys probados que detienen el scroll y llenan tu agenda."*

#### 📦 Contenido incluido:
* 👁️ **Pestañas:** Retoque día 16-21 y preparación 24h sin rímel.
* 💅 **Uñas:** Retoque de acrílico/gel al día 21 y cuidado de cutículas.
* 💇‍♀️ **Salón & Color:** Matices, balayage y rescate de clientas de 30, 60 y 90 días.
* ⚡ **Días flojos:** Guión para llenar huecos de miércoles en 15 minutos.
* 📱 **Lectura online interactiva con botones para copiar al portapapeles y descargas en Word y PDF.**`,
    clics_count: 0,
    orden: 8,
    activo: true,
  },

  // ══════════════════════════════════════════
  // CATEGORÍA D: "MÓDULOS & ADD-ONS DE SOFTWARE"
  // ══════════════════════════════════════════
  {
    id: 'modulo-plan-pro-360',
    categoria: 'modulos_addons',
    subcategoria: 'plan_pro',
    titulo: 'Plan PRO 360° (Todo Incluido + Ilimitado)',
    subtitulo: 'El sistema completo que se paga solo: todas las automatizaciones + QR Reseñas Google',
    descripcion: 'Accede a los 5 módulos automáticos de WhatsApp, Stand QR para acrílico, Web App de cupones, clientas ilimitadas y configuración asistida en 24h.',
    badge: '⭐ EL QUE SE PAGA SOLO',
    icono: '💎',
    precio: '$100 USD /mes (S/ 335 PEN)',
    mensaje_whatsapp: '¡Hola Martín! Quiero activar el PLAN PRO 360° ($100 USD / S/ 335 PEN) con todas las automatizaciones de WhatsApp y soporte asistido en mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '🔥 Activar Plan PRO con Martín',
    contenido_detalle_markdown: `### 💎 Plan PRO 360° de Nilah IA (Todo Incluido)
> ⭐ *"Ahorra más de $70 USD al mes comparado con comprar cada módulo por separado. Todo lo que tu salón necesita en piloto automático."*

#### 📦 Todo lo que incluye tu Plan PRO:
* ⚡ **Recordatorios WhatsApp 24h y 3h antes** con botón de confirmación en tiempo real.
* ⏰ **Disparador Automático de Retoques (15-21d)** para pestañas y uñas.
* 💸 **Rescate Inteligente de Clientas Inactivas (+45d y +75d)** para reactivar dinero dormido.
* 📢 **WhatsApp Marketing Masivo** para llenar tus días flojos de martes y miércoles.
* 👑 **Encuesta de Calidad Post-Cita + Club de Puntos VIP** automatizado.
* 📍 **Kit QR Reseñas 5★ Google Maps + Web App de Cupones** listo para acrílico de recepción.
* ♾️ **Capacidad de Citas y Clientas 100% ILIMITADAS.**
* 🤝 **Instalación y soporte asistido directo con Martín:** te dejamos todo configurado y funcionando en 24h.`,
    clics_count: 0,
    orden: 9,
    activo: true,
  },
  {
    id: 'modulo-recordatorios-whatsapp',
    categoria: 'modulos_addons',
    subcategoria: 'addon',
    titulo: 'Recordatorios WhatsApp Anti-Plantones',
    subtitulo: 'Elimina el 90% de citas no asistidas u olvidadas',
    descripcion: 'Avisos automáticos 24h y 3h antes de la cita por WhatsApp con botón de confirmación en tiempo real.',
    badge: '⚡ MÓDULO POPULAR',
    icono: '⚡',
    precio: '$21 USD /mes (S/ 70 PEN)',
    mensaje_whatsapp: '¡Hola Martín! Quiero activar el módulo de Recordatorios WhatsApp Anti-Plantones ($21 USD / S/ 70 PEN /mes) para mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Solicitar módulo ($21 /mes)',
    contenido_detalle_markdown: `### ⚡ Recordatorios WhatsApp Anti-Plantones
> 🎯 *"1 de cada 3 clientas olvida su cita si no se le avisa. Recupera tu dinero y tiempo con avisos automáticos."*

#### 📦 Beneficios incluidos:
* ⏰ **Doble recordatorio automático:** 24h y 3h antes directo al WhatsApp de la clienta.
* 🔘 **Botón interactivo de confirmación:** la clienta confirma o pide reagendar con 1 toque.
* 🗓️ **Sincronización en vivo:** tu agenda se actualiza al instante marcando quién ya confirmó.
* 🚀 **Se paga solo:** con evitar 1 solo plantón de pestañas o uñas al mes ya recuperaste la inversión.`,
    clics_count: 0,
    orden: 10,
    activo: true,
  },
  {
    id: 'modulo-retoques-automaticos',
    categoria: 'modulos_addons',
    subcategoria: 'addon',
    titulo: 'Disparador de Retoques Automático (15-21d)',
    subtitulo: 'Asegura la siguiente cita antes de que se caigan las pestañas o uñas',
    descripcion: 'Nilah detecta los días desde el último servicio y le escribe un WhatsApp cordial recordando su mantenimiento.',
    badge: '⏰ ALTA RECURRENCIA',
    icono: '⏰',
    precio: '$21 USD /mes (S/ 70 PEN)',
    mensaje_whatsapp: '¡Hola Martín! Quiero activar el Disparador de Retoques a los 15-21 días ($21 USD / S/ 70 PEN /mes) para mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Solicitar módulo ($21 /mes)',
    contenido_detalle_markdown: `### ⏰ Disparador Automático de Retoques (15 a 21 Días)
> 💡 *"Tus clientas esperan al último momento para agendar su retoque y luego no encuentran horario libre. Anticípate."*

#### 📦 Beneficios incluidos:
* 📅 **Disparo automático inteligente:** al día 16 para pestañas o día 20 para uñas y acrílico.
* 💬 **Mensaje personalizado y cordial:** sin sonar invasivo ni desesperado por vender.
* 📈 **Aumento del 40% en frecuencia de visitas:** convierte clientas ocasionales en clientas fijas cada mes.`,
    clics_count: 0,
    orden: 11,
    activo: true,
  },
  {
    id: 'modulo-rescate-inactivas',
    categoria: 'modulos_addons',
    subcategoria: 'addon',
    titulo: 'Rescate de Clientas Dormidas (+45d)',
    subtitulo: 'Despierta a clientas que amaron tu servicio pero no han vuelto',
    descripcion: 'Filtra en automático clientas sin visita en 45, 75 o 120 días y les envía una oferta de bienvenida para reactivarlas.',
    badge: '💸 ALTO RETORNO',
    icono: '💸',
    precio: '$27 USD /mes (S/ 90 PEN)',
    mensaje_whatsapp: '¡Hola Martín! Me interesa activar el módulo de Rescate de Clientas Dormidas ($27 USD / S/ 90 PEN /mes) para mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Solicitar módulo ($27 /mes)',
    contenido_detalle_markdown: `### 💸 Rescate de Clientas Dormidas / Inactivas (+45 Días)
> 🎯 *"El 60% de las clientas que no vuelven no es por un mal trabajo, sino por falta de seguimiento. Hay dinero dormido en tu lista."*

#### 📦 Beneficios incluidos:
* 🔍 **Filtro automático de recencia:** detecta clientas con +45, +75 y +120 días sin agendar.
* 💌 **Plantillas con gatillos de valor:** ofertas VIP exclusivas para reactivarlas en días clave.
* 🛡️ **Control anti-spam:** espaciado inteligente para no saturar los contactos.`,
    clics_count: 0,
    orden: 12,
    activo: true,
  },
  {
    id: 'modulo-puntos-calificaciones',
    categoria: 'modulos_addons',
    subcategoria: 'addon',
    titulo: 'Calificaciones Post-Cita + Club VIP',
    subtitulo: 'Fideliza con puntos automáticos y métricas de satisfacción',
    descripcion: 'Envía encuesta de satisfacción post-atención por WhatsApp, acumula puntos VIP y detecta a tus mejores clientas.',
    badge: '👑 FIDELIZACIÓN',
    icono: '👑',
    precio: '$27 USD /mes (S/ 90 PEN)',
    mensaje_whatsapp: '¡Hola Martín! Quiero activar el módulo de Calificaciones Post-Cita y Club VIP ($27 USD / S/ 90 PEN /mes) para mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Solicitar módulo ($27 /mes)',
    contenido_detalle_markdown: `### 👑 Calificaciones Post-Cita & Club VIP de Puntos
> 🎁 *"Premia la lealtad de tus clientas y haz que vuelvan siempre a tu salón en lugar de irse con la competencia."*

#### 📦 Beneficios incluidos:
* ⭐ **Encuesta automática 2h post-servicio:** mide la calidad de atención de tus colaboradoras.
* 🏆 **Sistema de Puntos y Premios:** acumulación por cada sol/dólar gastado en el salón.
* 📊 **Métricas de satisfacción y ranking de clientas VIP:** identifica al 20% que genera el 80% de tus ventas.`,
    clics_count: 0,
    orden: 13,
    activo: true,
  },
  {
    id: 'modulo-marketing-masivo',
    categoria: 'modulos_addons',
    subcategoria: 'addon',
    titulo: 'WhatsApp Marketing Masivo & Días Flojos',
    subtitulo: 'Llena tus turnos vacíos de martes y miércoles en 1 clic',
    descripcion: 'Lanza campañas relámpago segmentadas por servicio directo al WhatsApp de tus clientas con copys de alta conversión.',
    badge: '📢 VENTAS ACTIVAS',
    icono: '📢',
    precio: '$35 USD /mes (S/ 120 PEN)',
    mensaje_whatsapp: '¡Hola Martín! Quiero activar el módulo de WhatsApp Marketing Masivo ($35 USD / S/ 120 PEN /mes) para llenar mis días flojos.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Solicitar módulo ($35 /mes)',
    contenido_detalle_markdown: `### 📢 WhatsApp Marketing Masivo & Promociones
> ⚡ *"Deja de publicar historias en Instagram que nadie ve. Llega directo al WhatsApp de todas tus clientas en segundos."*

#### 📦 Beneficios incluidos:
* 🎯 **Segmentación avanzada:** filtra por especialidad (pestañas, acrílicas, color) o clientas VIP.
* 🤖 **Generador de textos persuasivos con IA:** ganchos probados para llenar horas libres.
* 🛡️ **Envíos seguros:** temporizador anti-bloqueo para proteger tu línea de WhatsApp.`,
    clics_count: 0,
    orden: 14,
    activo: true,
  },
  {
    id: 'kit-qr-google-resenas',
    categoria: 'modulos_addons',
    subcategoria: 'addon',
    titulo: 'Kit QR Reseñas 5★ Google + App Cupones',
    subtitulo: 'Stand para acrílico de mostrador + Web App interactiva de cupones',
    descripcion: 'La clienta escanea en recepción, califica 5 estrellas en tu Google Maps y recibe su cupón de descuento automático.',
    badge: '📍 PRODUCTO + WEB APP',
    icono: '📍',
    precio: '$39 USD (S/ 130 PEN) · Pago único',
    mensaje_whatsapp: '¡Hola Martín! Quiero solicitar el Kit QR Reseñas 5★ Google Maps con Web App de Cupones ($39 USD / S/ 130 PEN) para mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'Pedir Kit QR ($39 único)',
    contenido_detalle_markdown: `### 📍 Kit QR Reseñas 5★ Google Maps + Web App de Cupones
> 🌟 *"Posiciona tu salón en el #1 de Google Maps en tu ciudad para que clientas nuevas te encuentren solas."*

#### 📦 Qué incluye este kit:
* 🖼️ **Diseño de flyer personalizado con tu logo:** listo en alta definición para imprimir y colocar en tu stand de acrílico de caja/recepción.
* 📲 **Mini Web App interactiva:** la clienta escanea con su celular, registra su nombre y califica con 5 estrellas en tu ficha de Google Maps.
* 🎟️ **Generador de Cupones de Descuento:** la clienta recibe en su pantalla un cupón exclusivo para canjear en su próxima visita.
* 💳 **Pago Único:** sin mensualidades obligatorias (o incluido de regalo en el Plan PRO).`,
    clics_count: 0,
    orden: 15,
    activo: true,
  },
];

const LOCAL_STORAGE_KEY_SOLUCIONES = 'korat_soluciones_catalog_v8';
const LOCAL_STORAGE_KEY_CATEGORIAS = 'korat_soluciones_categorias_v8';
const LOCAL_STORAGE_KEY_HEADER = 'korat_soluciones_header_v8';

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

const EXCLUDED_IDS = ['catalogo-disenos-suben-ticket', 'guion-mantenimiento-retoque'];

export async function getSoluciones(): Promise<SolucionItem[]> {
  const local = localStorage.getItem(LOCAL_STORAGE_KEY_SOLUCIONES);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && !JSON.stringify(parsed).includes('Ã') && parsed.length > 0) {
        return (parsed as SolucionItem[]).filter(i => !EXCLUDED_IDS.includes(i.id));
      }
    } catch { /* ignore */ }
  }

  try {
    const { data, error } = await supabase
      .from('soluciones_catalog')
      .select('*')
      .order('orden', { ascending: true });

    if (!error && data && data.length > 0 && !JSON.stringify(data).includes('Ã')) {
      const filtered = (data as SolucionItem[]).filter(i => !EXCLUDED_IDS.includes(i.id));
      localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(filtered));
      return filtered;
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

