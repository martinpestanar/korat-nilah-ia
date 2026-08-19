import { supabase } from './supabase';

export interface SolucionesHeaderConfig {
  statusBadge: string;
  nombrePersona: string;
  subtituloPersona: string;
  trustBadge1: string;
  trustBadge2: string;
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
  subcategoria?: 'plan_basico' | 'plan_pro' | 'addon' | 'standard';
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
  contenido_detalle_markdown?: string; // Contenido enriquecido para la sobre-pantalla (Modal/BottomSheet)
  clics_count?: number;
  orden: number;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export const HEADER_DEFAULT: SolucionesHeaderConfig = {
  statusBadge: '🟢 Disponible para instalaciones esta semana',
  nombrePersona: 'Martín Pestana',
  subtituloPersona: 'WhatsApp Marketing, Stand QR Reseñas & Automatización n8n',
  trustBadge1: 'Sin Bots Rígidos',
  trustBadge2: 'Instalación Exprés',
};

export const CATEGORIAS_DEFAULT: CategoriaPersonalizada[] = [
  { id: 'todos', label: 'Todos los Módulos', shortLabel: 'Todos', icon: '⚡', orden: 1, activo: true },
  { id: 'salones', label: '💇‍♀️ Salones & Estética', shortLabel: '💇‍♀️ Salones', icon: '💇‍♀️', orden: 2, activo: true },
  { id: 'restaurantes', label: '🍕 Restaurantes & Cafés', shortLabel: '🍕 Comida', icon: '🍕', orden: 3, activo: true },
  { id: 'servicios', label: '💼 Servicios & Venta', shortLabel: '💼 Servicios', icon: '💼', orden: 4, activo: true },
  { id: 'infoproductos', label: '📚 Ebooks & Recursos', shortLabel: '📚 Ebooks', icon: '📚', orden: 5, activo: true },
];

export const MODULOS_DEFAULT: Omit<SolucionItem, 'created_at' | 'updated_at'>[] = [
  // ── RESTAURANTES: PLAN BÁSICO ──
  {
    id: 'rest-plan-basico',
    categoria: 'restaurantes',
    subcategoria: 'plan_basico',
    titulo: 'PLAN BÁSICO — "Suna Starter & Pedidos WhatsApp"',
    subtitulo: 'La herramienta esencial para automatizar tus pedidos y quitarte las comisiones',
    descripcion: 'Carta WebApp interactiva + QR en mesa, Bot recepcionista 24/7 en WhatsApp (texto/voz), Auditoría IA Anti-Estafas de vouchers Yape/Plin, y alertas instantáneas a cocina.',
    badge: '🟢 Esencial',
    icono: '📱',
    precio: 'Plan Básico',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y me interesa solicitar información sobre el PLAN BÁSICO Suna Starter para mi restaurante/cafetería.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Plan Básico (WhatsApp)',
    contenido_detalle_markdown: `### 🟢 PLAN BÁSICO — "Suna Starter & Pedidos WhatsApp"
> 🎯 *"La herramienta esencial para automatizar tus pedidos y quitarte las comisiones de las apps de delivery."*

Ideal para cafeterías y restaurantes que están empezando y quieren ordenar sus ventas digitales sin complicaciones.

#### 📦 Lo que incluye el Plan Básico:
* **Menú Webapp Interactivo (PWA) + QR en Mesa:** Para salón, llevar y delivery.
* **Bot Recepcionista 24/7 en WhatsApp (n8n):** Atención de dudas frecuentes de la carta (Texto y Notas de Voz Whisper IA).
* **Auditoría de Vouchers de Pago con IA (Anti-Estafas):** Verificación automática de capturas Yape/Plin al momento del pedido.
* **Alertas Instantáneas a Cocina:** Envío del pedido detallado al grupo de WhatsApp del local.
* **Seguimiento de Estado en Vivo:** Notificación al cliente por WhatsApp (En preparación / Listo para entregar).
* **Módulos SaaS:** \`pedidos\`, \`carta\`, \`delivery\`, \`reservas\`.`,
    clics_count: 0,
    orden: 1,
    activo: true,
  },
  // ── RESTAURANTES: PLAN PRO ──
  {
    id: 'rest-plan-pro',
    categoria: 'restaurantes',
    subcategoria: 'plan_pro',
    titulo: 'PLAN PRO — "Restaurante PRO 360°" (⭐ EL QUE SE PAGA SOLO)',
    subtitulo: 'WhatsApp Marketing, Stand QR de Reseñas en Google, Pedidos & Caja Chica',
    descripcion: 'Todo lo del Plan Básico + Stand QR Físico de Mostrador (Reseñas 5★ Google + Puntos VIP), Marketplace de Audiencias & Campañas WhatsApp Persuasivas, Control de Stock, Insumos por receta y Arqueo de Caja.',
    badge: '🔥 RECOMENDADO POR MARTÍN',
    icono: '👑',
    precio: 'PRO 360°',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y me interesa solicitar el PLAN PRO Restaurante 360° (Con Stand QR de Reseñas Google y WhatsApp Marketing).',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '🔥 Probar Plan PRO en WhatsApp',
    contenido_detalle_markdown: `### 🔥 PLAN PRO — "Restaurante PRO 360°"
> 💡 **RECOMENDACIÓN DE MARTÍN PESTANA:** *"Este plan no es un simple sistema de comandas; es un motor de facturación que atrae clientes de Google Maps y los hace volver por WhatsApp."*

#### 📦 Lo que incluye el Plan PRO de Restaurantes:
* ✨ **Todo lo del PLAN BÁSICO (Menú QR + Bot WhatsApp 24/7 + Auditoría IA Yape/Plin + Alertas a Cocina)** $+$
* 🌟 **Stand QR Físico de Mostrador/Mesa:** Diseñado para tu local. Colector de Reseñas de 5 Estrellas en Google Maps + Sistema de Puntos VIP por WhatsApp.
* 📢 **Marketplace de Audiencias & WhatsApp Marketing Persuasivo:** Disparador de ofertas relámpago con mensajes no aburridos y gatillos mentales de alta conversión para días flojos.
* 📦 **Control de Inventario & Descuento por Receta:** Descuento automático de insumos por cada plato vendido.
* ⚠️ **Alertas de Stock Bajo en WhatsApp:** Notificación directa al dueño antes de quedarse sin insumos clave.
* 💰 **Arqueo de Caja Chica & Utilidad del Día:** Reporte diario de ingresos por Yape/Plin/Efectivo y utilidad neta.`,
    clics_count: 0,
    orden: 2,
    activo: true,
  },
  {
    id: 'rest-addon-cuponera-vip',
    categoria: 'restaurantes',
    subcategoria: 'addon',
    titulo: 'ðŸ�·ï¸� MÃ³dulo de Cuponera VIP & CatÃ¡logo de Premios',
    subtitulo: 'Complemento Extra / Add-On',
    descripcion: 'Habilita el canje de premios fÃ­sicos, platos gratis o descuentos por puntos acumulados directamente desde WhatsApp o WebApp.',
    badge: 'ðŸ§© Add-On Extra',
    icono: 'ðŸ�·ï¸�',
    precio: 'Add-On Opcional',
    mensaje_whatsapp: 'Hola MartÃ­n! Quisiera informaciÃ³n sobre la Cuponera VIP & CatÃ¡logo de Premios para mi restaurante.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: 'ðŸ’¬ Consultar Cuponera VIP',
    contenido_detalle_markdown: `### ðŸ�·ï¸� MÃ³dulo de Cuponera VIP & CatÃ¡logo de Premios
* Habilita el canje de premios fÃ­sicos o descuentos por puntos acumulados.
* Permite definir premios por niveles de consumo.`,
    clics_count: 0,
    orden: 4,
    activo: true,
  },
  {
    id: 'rest-addon-staff-comanderas',
    categoria: 'restaurantes',
    subcategoria: 'addon',
    titulo: 'ðŸ‘¥ Licencias de Staff Extra (Comanderas para Mozo)',
    subtitulo: 'Complemento Extra / Add-On',
    descripcion: 'Permisos y accesos segmentados para cajeros, mozos de salÃ³n y personal de cocina con vista tÃ¡ctil de toma de pedidos.',
    titulo: '👥 Licencias de Staff Extra (Comanderas para Mozo)',
    subtitulo: 'Complemento Extra / Add-On',
    descripcion: 'Permisos y accesos segmentados para cajeros, mozos de salón y personal de cocina con vista táctil de toma de pedidos.',
    badge: '🧩 Add-On Extra',
    icono: '👥',
    precio: 'Add-On Opcional',
    mensaje_whatsapp: 'Hola Martín! Quisiera información sobre las Licencias de Staff Extra (Comanderas Mozo/Caja).',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Licencias Staff',
    contenido_detalle_markdown: `### 👥 Licencias de Staff Extra (Comanderas para Mozo)
* Permisos segmentados para cajeros, mozos de salón y personal de cocina.
* Control de roles e historial de pedidos atendidos por mozo.`,
    clics_count: 0,
    orden: 5,
    activo: true,
  },
  // ── SALONES & ESTÉTICA (NILAH IA - MARTÍN PESTANA METHOD) ──
  {
    id: 'salon-plan-basico',
    categoria: 'salones',
    subcategoria: 'plan_basico',
    titulo: 'PLAN BÁSICO — "Nilah Starter & Agendamiento Móvil"',
    subtitulo: 'La herramienta esencial para organizar tu agenda y eliminar plantones',
    descripcion: 'Agenda completa interactiva de citas, Ficha técnica de clientas (fórmulas/tintes), Bot Informativo 24/7 en WhatsApp (entrega el link de citas) y Recordatorios Anti-Plantones (24h y 3h antes).',
    badge: '🟢 Esencial',
    icono: '💇‍♀️',
    precio: 'Plan Básico',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y me interesa solicitar información sobre el PLAN BÁSICO Nilah Starter para mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Plan Básico (WhatsApp)',
    contenido_detalle_markdown: '### 🟢 PLAN BÁSICO — "Nilah Starter & Agendamiento Móvil"\n> 🎯 *"La herramienta esencial para organizar tus citas, agendar por WhatsApp y eliminar los plantones."*\n\nIdeal para salones de belleza, spas, barberías y centros estéticos que quieren ordenar su agenda y atención sin complicaciones.\n\n#### 📦 Lo que incluye el Plan Básico Nilah:\n* **Agenda Interactiva & Portal Móvil de Citas:** Gestión clara por servicios, estilista/especialista y horario.\n* **Bot Informativo 24/7 en WhatsApp:** Responde precios, servicios y **entrega el link interactivo para que la clienta elija su cita de forma autónoma (sin bots rígidos)**.\n* **Recordatorios Anti-Plantones por WhatsApp:** Notificación automática a la clienta 24 horas y 3 horas antes de su cita.\n* **Ficha Técnica de Clientas (CRM Inicial):** Registro de visitas, fórmulas de tintes/tratamientos utilizados y preferencias de cada clienta.',
    clics_count: 0,
    orden: 6,
    activo: true,
  },
  {
    id: 'salon-plan-pro',
    categoria: 'salones',
    subcategoria: 'plan_pro',
    titulo: 'PLAN PRO — "Nilah Glow Pro 360°" (⭐ EL QUE SE PAGA SOLO)',
    subtitulo: 'WhatsApp Marketing, Stand QR de Reseñas Google, Reactivación & Caja Chica',
    descripcion: 'Todo lo del Plan Básico + Stand QR Físico (Reseñas 5★ Google + Puntos VIP), Marketplace de Audiencias & Campañas Persuasivas, Reactivación (35/60/90 días), Retoque Automático, Insumos y Nilah Creative.',
    badge: '🔥 RECOMENDADO POR MARTÍN',
    icono: '💎',
    precio: 'Glow Pro 360°',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y me interesa probar el PLAN PRO Nilah Glow Pro 360° (Con Stand QR Reseñas Google y WhatsApp Marketing) para mi salón.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '🔥 Probar Plan PRO en WhatsApp',
    contenido_detalle_markdown: '### 🔥 PLAN PRO — "Nilah Glow Pro 360°"\n> 💡 **RECOMENDACIÓN DE MARTÍN PESTANA:** *"El verdadero secreto para que tu salón no pare de facturar es combinar el Stand QR Físico para captar reseñas en Google Maps con campañas de WhatsApp Marketing no aburridas."*\n\n#### 📦 Lo que incluye el Plan PRO Nilah:\n* ✨ **Todo lo del PLAN BÁSICO (Agenda + Bot Informativo + Recordatorios Anti-Plantones + Ficha Técnica)** $+$\n* 🌟 **Stand QR Físico de Mostrador:** Acrílico de diseño para tu salón. Colector de Reseñas de 5 Estrellas en Google Maps + Club de Puntos VIP por WhatsApp.\n* 📢 **Marketplace de Audiencias & WhatsApp Marketing Persuasivo:** Campañas de impacto con copys no aburridos y gatillos mentales activadores de citas.\n* 🔄 **Sistema Anti-Fugas & Reactivación Automática (35/60/90 Días):** Envía mensajes VIP por WhatsApp a clientas que no han regresado para que vuelvan solas.\n* ⏰ **Recordatorios Automáticos de Retoque:** Nilah detecta cuándo toca mantenimiento (ej. uñas acrílicas a 20 días, tinte a 30 días) y les avisa a su WhatsApp.\n* 💰 **Finanzas del Día & Arqueo de Caja Chica:** Arqueo rápido de ingresos por método de pago (Yape/Plin/Efectivo) y reporte de utilidad real.\n* 💅 **Control de Insumos & Materiales de Cabina:** Stock de tintes, decolorantes, esmaltes y alertas de stock bajo enviadas a tu WhatsApp.\n* 📸 **Generador Nilah Creative:** Diseña fotos, banners y promociones para TikTok/Instagram en segundos sin Canva.\n* 💬 **Bandeja Inteligente con Notas Ocultas ("Whisper"):** Deja notas amarillas internas invisibles para la clienta para coordinar con tu equipo de estilistas.',
    clics_count: 0,
    orden: 7,
    activo: true,
  },
  {
    id: 'salon-addon-marketing-masivo',
    categoria: 'salones',
    subcategoria: 'addon',
    titulo: '📢 Motor de Envíos Masivos Promocionales (n8n)',
    subtitulo: 'Complemento Extra / Add-On',
    descripcion: 'Disparo de campañas promocionales masivas por WhatsApp a tu base de clientas para llenar el salón en días de baja demanda (ej. martes/miércoles).',
    badge: '🧩 Add-On Extra',
    icono: '📢',
    precio: 'Add-On Opcional',
    mensaje_whatsapp: 'Hola Martín! Quisiera información sobre el Add-on de Envíos Masivos para mi salón de belleza.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Add-On Envíos',
    contenido_detalle_markdown: '### 📢 Motor de Envíos Masivos Promocionales por WhatsApp (n8n)\n* Disparo seguro de ofertas relámpago con filtro anti-spam a tu base de clientas.\n* *Ideal para llenar los turnos libres de media semana.*',
    clics_count: 0,
    orden: 8,
    activo: true,
  },
  {
    id: 'salon-addon-nilah-creative',
    categoria: 'salones',
    subcategoria: 'addon',
    titulo: '📸 Nilah Creative: Generador de Contenido & Redes',
    subtitulo: 'Complemento Extra / Add-On',
    descripcion: 'Herramienta de creación visual de banners, ofertas y textos para TikTok e Instagram optimizados para salones de belleza.',
    badge: '🧩 Add-On Extra',
    icono: '📸',
    precio: 'Add-On Opcional',
    mensaje_whatsapp: 'Hola Martín! Quisiera información sobre Nilah Creative (Generador de fotos/ofertas redes).',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Nilah Creative',
    contenido_detalle_markdown: '### 📸 Nilah Creative: Generador de Contenido & Redes\n* Crea diseños y plantillas listas para publicar en TikTok o Instagram en segundos.\n* Generación de textos persuasivos y llamadas a la acción directas al WhatsApp de tu salón.',
    clics_count: 0,
    orden: 9,
    activo: true,
  },
  // ── OTROS NEGOCIOS & A MEDIDA ──
  {
    id: 'serv-ecommerce-carritos',
    categoria: 'servicios',
    subcategoria: 'standard',
    titulo: '🛍️ Recobro de Carritos Abandonados por WhatsApp',
    subtitulo: 'E-Commerce / Shopify / Woocommerce / Tiendanube',
    descripcion: 'Nilah detecta cuando un cliente deja su compra a medias y le envía un mensaje por WhatsApp 15 min después con un cupón relámpago para cerrar la venta.',
    badge: '🔥 Alto Impacto E-Commerce',
    icono: '🛍️',
    precio: 'Instalación DFY n8n',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y me interesa instalar el Recobro Automático de Carritos por WhatsApp para mi tienda online.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Bot E-Commerce (WhatsApp)',
    contenido_detalle_markdown: '### 🛍️ Recobro de Carritos Abandonados por WhatsApp (n8n + IA)\n> 🎯 *"El 70% de los visitantes en tiendas online agregan productos al carrito y se van sin pagar. Recupéralos en automático."*\n\n#### 📦 Lo que incluye este sistema para tu tienda:\n* 🛒 **Detección en Tiempo Real:** Conexión con Shopify, Woocommerce, Tiendanube o tu sistema actual.\n* 📲 **Disparo Inteligente por WhatsApp:** Envía un mensaje personalizado 15 a 30 minutos después del abandono.\n* 🏷️ **Cupón de Descuento Dinámico:** Opción de ofrecer un descuento relámpago con cuenta regresiva.\n* 📈 **Aumento directo del 15% al 30%** en la facturación mensual de tu tienda sin gastar más en anuncios.',
    clics_count: 0,
    orden: 10,
    activo: true,
  },
  {
    id: 'serv-clinicas-triaje',
    categoria: 'servicios',
    subcategoria: 'standard',
    titulo: '🏥 Agendador & Triaje de Citas Médicas / Spas',
    subtitulo: 'Consultorios, Clínicas Dentales, Estéticas & Spas',
    descripcion: 'Bot inteligente que califica el motivo de consulta del paciente, muestra especialidades/precios y le agenda cita directa en Google Calendar o tu CRM.',
    badge: '🏥 Especial Clínicas',
    icono: '🏥',
    precio: 'Proyecto A Medida',
    mensaje_whatsapp: 'Hola Martín! Me interesa implementar el Bot Agendador & Triaje de Citas para mi clínica / consultorio.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Sistema Clínicas',
    contenido_detalle_markdown: '### 🏥 Agendador de Citas & Triaje para Clínicas y Consultorios\n> 🎯 *"Evita que los pacientes pregunten precios y se vayan a la competencia por demoras en responder."*\n\n#### 📦 Lo que incluye esta automatización:\n* 📋 **Triaje de Consulta:** Identifica la especialidad que busca el paciente (ej. Ortodoncia, Estética, Consulta General).\n* 📅 **Sincronización con Agenda:** Muestra horarios libres en tiempo real y registra la cita en Google Calendar / CRM.\n* 🔔 **Recordatorio Anti-Ausencias:** Notificación automática por WhatsApp 24 horas antes con confirmación de asistencia.',
    clics_count: 0,
    orden: 11,
    activo: true,
  },
  {
    id: 'serv-inmobiliarias-filtro',
    categoria: 'servicios',
    subcategoria: 'standard',
    titulo: '🏢 Calificador de Prospectos Inmobiliarios (Filtro VIP)',
    subtitulo: 'Agencias Inmobiliarias & Asesores de Ventas',
    descripcion: 'Filtra curiosos sin presupuesto. El bot pregunta zona, presupuesto y plazo de compra; si califica VIP, le envía la ficha en PDF y transfiere al agente.',
    badge: '🏢 Especial Inmobiliarias',
    icono: '🏢',
    precio: 'Proyecto A Medida',
    mensaje_whatsapp: 'Hola Martín! Me interesa el Calificador de Prospectos Inmobiliarios por WhatsApp para mi agencia / proyecto.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Bot Inmobiliario',
    contenido_detalle_markdown: '### 🏢 Calificador de Prospectos Inmobiliarios por WhatsApp\n> 🎯 *"Tus asesores de ventas no deberían perder tiempo atendiendo curiosos sin presupuesto."*\n\n#### 📦 Lo que incluye este flujo n8n:\n* 🎯 **Filtro Calificador:** Califica presupuesto, tipo de inmueble (depa/casa/terreno) y plazo de compra.\n* 📄 **Entrega de Brochure / PDF:** Envía la ficha técnica del proyecto automáticamente en el chat.\n* 📲 **Transferencia al Asesor:** Notifica inmediatamente al asesor de ventas cuando un lead VIP está listo para agendar visita.',
    clics_count: 0,
    orden: 12,
    activo: true,
  },
  {
    id: 'serv-desarrollo-a-medida',
    categoria: 'servicios',
    subcategoria: 'standard',
    titulo: '🚀 Automatización & Bot de IA 100% A Medida',
    subtitulo: 'Desarrollo Rápido con n8n + Antigravity en 48h',
    descripcion: 'Si tu empresa tiene un flujo de trabajo especial, construimos un bot o automatización totalmente personalizada para tu modelo de negocio.',
    badge: '⚡ 100% Personalizado',
    icono: '⚡',
    precio: 'Cotización A Medida',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y quiero cotizar una automatización A MEDIDA personalizada para mi empresa.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Cotizar Proyecto A Medida',
    contenido_detalle_markdown: '### 🚀 Automatizaciones & Bots de IA 100% A Medida\n> 🎯 *"Desplegamos cualquier flujo de trabajo en n8n + Antigravity en tiempo récord."*\n\n* 🤖 **Agentes de IA con voz y texto** entrenados con la documentación de tu empresa.\n* 🔗 **Integración de APIs & CRMs:** Conexión con Hubspot, Sheets, Notion, Stripe, Yape/Plin, etc.\n* ⚡ **Entrega rápida en 48h a 72h.**',
    clics_count: 0,
    orden: 13,
    activo: true,
  },
  // ── RECURSOS & GUÍAS GRATIS (PDFs + LEAD MAGNETS + PREMIUM) ──
  {
    id: 'playbook-whatsapp-restaurantes',
    categoria: 'infoproductos',
    subcategoria: 'standard',
    titulo: '🍕 Playbook de WhatsApp Marketing para Restaurantes (Anti-Spam)',
    subtitulo: 'Recurso 100% Gratuito (Especial Gastronomía)',
    descripcion: 'Más de 35 copys de antojo diseñados para llenar mesas en días flojos (martes y miércoles), mover el delivery directo y reactivar clientes inactivos.',
    badge: '🍕 ESPECIAL RESTAURACIÓN',
    icono: '🍕',
    precio: '100% GRATIS',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y quiero descargar el Playbook de WhatsApp Marketing para Restaurantes & Gastronomía.',
    url_checkout: '/playbook-restaurantes',
    tipo_boton: 'descarga',
    texto_boton_personalizado: '🍕 Leer Playbook / Descargar PDF',
    contenido_detalle_markdown: `### 🍕 El Playbook de Activadores Gastronómicos por WhatsApp (Anti-Spam)
> 🎯 *"Deja de enviar listas aburridas de platos que se ignoran. Aprende a despertar el antojo y llenar tus mesas 45 minutos antes del pico de almuerzo y cena."*

#### 📊 Lo que incluye este Playbook Gastronómico:
* 🍕 **35+ Copys de antojo listos para copiar y pegar** para pizzerías, restobares, cafeterías, sushi y delivery.
* ⏰ **Regla del envío anticipado:** Por qué enviar el mensaje a las 11:30 am / 7:15 pm multiplica por 3 las órdenes.
* 🥩 **Anatomía del Detonador Sensorial:** Las 3 tarjetas (P1 Textura/Aroma, P2 La Mesa Guardada, P3 Cierre dicotómico).
* 🆚 **Comparativa visual:** Spam de PDF pesado vs Mensaje Activador de Antojo.
* 🛡️ **Reglas de Oro Anti-Spam:** Segmentación Salón vs Delivery, límite de peso en fotos y comando BAJA.
* 📋 **Checklist de 10 puntos:** Revisa tu campaña gastronómica antes de presionar enviar.`,
    clics_count: 0,
    orden: 12,
    activo: true,
  },
  {
    id: 'playbook-mensajes-activadores-whatsapp',
    categoria: 'infoproductos',
    subcategoria: 'standard',
    titulo: '📲 Playbook de Mensajes Activadores por WhatsApp (Anti-Spam)',
    subtitulo: 'Recurso 100% Gratuito (PDF + Vista Móvil)',
    descripcion: 'Más de 40 copys listos para copiar y pegar según tu rubro (salones, restaurantes, clínicas). Aprende la anatomía del mensaje activador anti-spam.',
    badge: '🔥 RECURSO TIKTOK DESTACADO',
    icono: '📲',
    precio: '100% GRATIS',
    mensaje_whatsapp: 'Hola Martín! Vi tu video en TikTok y quiero descargar el Playbook de Mensajes Activadores por WhatsApp (Anti-Spam).',
    url_checkout: '/playbook-whatsapp',
    tipo_boton: 'descarga',
    texto_boton_personalizado: '📲 Leer Playbook / Descargar PDF',
    contenido_detalle_markdown: `### 📲 El Playbook de Mensajes Activadores por WhatsApp (Anti-Spam)
> 🎯 *"Deja de enviar mensajes que se ignoran. Aprende la estructura de los mensajes que paran el scroll, generan respuesta y llenan tu agenda sin sonar a spam."*

#### 📊 Lo que incluye este Playbook:
* ✂️ **40+ Copys listos para copiar y pegar** organizados en 8 categorías.
* 💆 **Especializado por rubro:** Salones de belleza, restaurantes, clínicas y veterinarias.
* 🧠 **Anatomía del Activador:** Las 3 tarjetas (P1 Gancho, P2 Confidencia, P3 Cierre suave).
* 🆚 **Comparativa lado a lado:** Mensaje aburrido (Spam mental) vs Mensaje Activador.
* 🛡️ **Reglas Anti-Spam de Oro:** Cooldown de 21 días, comando BAJA, máximo 4 campañas/mes y segmentación.
* 📋 **Checklist de 10 puntos:** Revisa tu mensaje antes de presionar enviar.`,
    clics_count: 0,
    orden: 13,
    activo: true,
  },
  {
    id: 'pdf-50-mensajes-activadores',
    categoria: 'infoproductos',
    subcategoria: 'standard',
    titulo: '📄 Guía PDF: 50 Mensajes Activadores & Gatillos Mentales para WhatsApp',
    subtitulo: 'Recurso 100% Gratuito (PDF)',
    descripcion: 'Las 50 plantillas de mensajes persuasivos y gatillos mentales de alta conversión para reactivar clientes inactivos y vender en días flojos.',
    badge: '🎁 100% GRATIS',
    icono: '📄',
    precio: 'GRATIS',
    mensaje_whatsapp: 'Hola Martín! Quiero descargar la Guía PDF de 50 Mensajes Activadores para WhatsApp.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '📥 Descargar Guía PDF (Gratis)',
    contenido_detalle_markdown: `### 📄 Guía PDF: 50 Mensajes Activadores & Gatillos Mentales para WhatsApp
> 🎯 *"Los 50 mensajes probados que reactivan chats fríos y generan ventas inmediatas en WhatsApp."*

#### 📦 Lo que incluye esta guía en PDF:
* 🔥 **50 Plantillas Copiar y Pegar**: Mensajes de urgencia, escasez, curiosidad y exclusividad.
* 🧠 **Gatillos Mentales de Alta Conversión**: Cómo estructurar la oferta para que no parezca spam.
* 📲 **Ejemplos Reales por Rubro**: Gastronomía, Belleza, Mascotas, Servicios y Tiendas.`,
    clics_count: 0,
    orden: 14,
    activo: true,
  },
  {
    id: 'pdf-playbook-secuencias-activadoras',
    categoria: 'infoproductos',
    subcategoria: 'standard',
    titulo: '📖 Playbook PDF: Secuencias de Mensajes Activadores por Rubro',
    subtitulo: 'Recurso 100% Gratuito (PDF)',
    descripcion: 'El paso a paso estratégico para armar secuencias de mensajes de seguimiento y reactivación sin aburrir a tus clientes.',
    badge: '🎁 100% GRATIS',
    icono: '📖',
    precio: 'GRATIS',
    mensaje_whatsapp: 'Hola Martín! Quiero descargar el Playbook PDF de Secuencias de Mensajes Activadores por Rubro.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '📥 Descargar Playbook PDF (Gratis)',
    contenido_detalle_markdown: `### 📖 Playbook PDF: Secuencias de Mensajes Activadores por Rubro
> 💡 *"El mapa de ruta completo para enviar secuencias automáticas de 3 a 5 mensajes que convierten."*

#### 📦 Contenido del Playbook PDF:
* 🗓️ **Frecuencia y Tiempos de Envío**: Cuándo enviar el Día 1, Día 3 y Día 7.
* 🛡️ **Prevención Anti-Bloqueos**: Buenas prácticas para mantener la salud de tu línea de WhatsApp.
* 🤖 **Integración con n8n**: Cómo automatizar las secuencias paso a paso.`,
    clics_count: 0,
    orden: 15,
    activo: true,
  },
  {
    id: 'ebook-guias-n8n-ia',
    categoria: 'infoproductos',
    subcategoria: 'standard',
    titulo: '📚 Ebook Gratuito: Guía Práctica de n8n & IA',
    subtitulo: 'Recurso 100% Gratuito (PDF)',
    descripcion: 'Aprende a conectar WhatsApp con n8n en 15 minutos sin saber programar. Incluye plantillas descargables.',
    badge: '🎁 100% GRATIS',
    icono: '🎁',
    precio: 'GRATIS',
    mensaje_whatsapp: 'Hola Martín! Quiero descargar la Guía Práctica Gratuita de n8n & IA.',
    url_checkout: 'https://drive.google.com',
    tipo_boton: 'descarga',
    texto_boton_personalizado: '📥 Descargar Gratis (PDF)',
    contenido_detalle_markdown: '### 📚 Guía Práctica Gratuita: n8n & Automatización con IA\nAprende a automatizar tu negocio usando la combinación de **n8n** e **Inteligencia Artificial**:\n* ⚡ **Sin código complejo**: Diseña flujos lógicos visuales en minutos.\n* 🤖 **Agentes de IA**: Cómo conectar OpenAI/ChatGPT a tu WhatsApp oficial.\n* 📦 **3 Plantillas n8n incluidas**: Listas para importar y ejecutar.',
    clics_count: 0,
    orden: 16,
    activo: true,
  },
  {
    id: 'bundle-plantillas-n8n-premium',
    categoria: 'infoproductos',
    subcategoria: 'standard',
    titulo: '🔥 Bundle de 10 Plantillas n8n Listas para Importar',
    subtitulo: 'Recurso Premium / Plantillas Listas',
    descripcion: 'Pack completo con las 10 automatizaciones más rentables para WhatsApp: recordatorios, cotizaciones y rescate de clientes.',
    badge: '🔥 RECURSO PREMIUM',
    icono: '🚀',
    precio: 'S/ 49 / $14',
    mensaje_whatsapp: 'Hola Martín! Vi tu perfil en TikTok y me interesa comprar el Bundle de 10 Plantillas n8n Listas para Importar.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Comprar Bundle por WhatsApp',
    contenido_detalle_markdown: `### 🔥 Bundle de 10 Plantillas n8n Listas para Importar
> 🎯 *"Despliega en 5 minutos automatizaciones que a otras agencias les toma semanas programar."*

#### 📦 Lo que incluye este Bundle Premium:
* 📥 **Archivos JSON listos para importar** en tu propia instancia de n8n.
* 🤖 **Workflow de Agente de Ventas en WhatsApp** con memoria de conversación.
* 🔄 **Workflow de Reactivación de Clientes Inactivos** a los 30/60 días.
* 🔔 **Workflow de Recordatorios de Citas Anti-Plantones**.
* 🎥 **Videos tutoriales de instalación paso a paso (10 minutos por plantilla)**.`,
    clics_count: 0,
    orden: 17,
    activo: true,
  },
];


const LOCAL_STORAGE_KEY_SOLUCIONES = 'korat_soluciones_catalog';
const LOCAL_STORAGE_KEY_CATEGORIAS = 'korat_soluciones_categorias';
const LOCAL_STORAGE_KEY_HEADER = 'korat_soluciones_header';

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

  // Si no hay local, intentar Supabase opcionalmente
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
      if (Array.isArray(parsed) && !JSON.stringify(parsed).includes('Ã') && parsed.some(i => i.id === 'pdf-50-mensajes-activadores')) {
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

export async function saveSolucion(item: SolucionItem): Promise<void> {
  try {
    const { error } = await supabase
      .from('soluciones_catalog')
      .upsert(item);

    if (error) console.warn('Error upsert Supabase:', error.message);
  } catch (e) {
    console.warn('Fallback guardado local:', e);
  }

  const current = await getSoluciones();
  const index = current.findIndex(i => i.id === item.id);
  if (index >= 0) {
    current[index] = item;
  } else {
    current.push(item);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(current));
}

export async function deleteSolucion(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('soluciones_catalog')
      .delete()
      .eq('id', id);

    if (error) console.warn('Error delete Supabase:', error.message);
  } catch (e) {
    console.warn('Fallback delete local:', e);
  }

  const current = await getSoluciones();
  const updated = current.filter(i => i.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY_SOLUCIONES, JSON.stringify(updated));
}
