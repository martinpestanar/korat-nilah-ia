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
  subtituloPersona: 'Automatización con n8n, IA & Recursos',
  trustBadge1: 'Sin Bots Rígidos',
  trustBadge2: 'Instalación Exprés',
};

export const CATEGORIAS_DEFAULT: CategoriaPersonalizada[] = [
  { id: 'todos', label: 'Todos los Módulos', shortLabel: 'Todos', icon: '⚡', orden: 1, activo: true },
  { id: 'infoproductos', label: '📚 Ebooks & Recursos', shortLabel: '📚 Ebooks', icon: '📚', orden: 2, activo: true },
  { id: 'salones', label: '💇‍♀️ Salones & Estética', shortLabel: '💇‍♀️ Salones', icon: '💇‍♀️', orden: 3, activo: true },
  { id: 'restaurantes', label: '🍕 Restaurantes & Cafés', shortLabel: '🍕 Comida', icon: '🍕', orden: 4, activo: true },
  { id: 'servicios', label: '💼 Servicios & Venta', shortLabel: '💼 Servicios', icon: '💼', orden: 5, activo: true },
];

export const MODULOS_DEFAULT: Omit<SolucionItem, 'created_at' | 'updated_at'>[] = [
  {
    id: 'ebook-guias-n8n-ia',
    categoria: 'infoproductos',
    titulo: 'Ebook Gratuito: Guía Práctica de n8n & IA',
    subtitulo: 'Recurso Gratuito (PDF)',
    descripcion: 'Aprende a conectar WhatsApp con n8n en 15 minutos sin saber programar. Incluye plantillas descargables.',
    badge: '🎁 100% Gratis',
    icono: '📚',
    precio: 'GRATIS',
    mensaje_whatsapp: 'Hola Martín! Quiero descargar la Guía Práctica de n8n & IA.',
    url_checkout: 'https://drive.google.com',
    tipo_boton: 'descarga',
    texto_boton_personalizado: '📥 Obtener Gratis (PDF)',
    contenido_detalle_markdown: `### 📚 Lo que aprenderás en este Ebook

Aprende la metodología paso a paso para automatizar tu negocio usando la combinación de **n8n** e **Inteligencia Artificial**:

* ⚡ **Sin código complejo**: Diseña flujos lógicos visuales en minutos.
* 🤖 **Agentes de IA**: Cómo conectar OpenAI/ChatGPT a tu WhatsApp oficial o API.
* 📦 **3 Plantillas n8n incluidas**: Listas para importar y usar en tu cuenta.

> *"La automatización no reemplaza a tu equipo, le da superpoderes para responder en segundos."*

#### 🎁 ¿Qué incluye la descarga?
1. PDF de 25 páginas ilustrado paso a paso.
2. Archivos JSON de workflows listos para n8n.
3. Lista de prompts probados para atención al cliente.`,
    clics_count: 0,
    orden: 1,
    activo: true,
  },
  {
    id: 'salon-prefiltro-registro',
    categoria: 'salones',
    titulo: 'Pre-Filtro de Citas + Registro Exprés',
    subtitulo: 'Salones de Belleza & Estética',
    descripcion: 'Bot de WhatsApp que responde servicios y pre-selecciona turno, más un formulario móvil ultrarrápido de 3 campos para la recepcionista.',
    badge: '⚡ Más Popular',
    icono: '💇‍♀️',
    precio: 'Instalación DFY',
    mensaje_whatsapp: 'Hola Martín! Me interesa conocer más detalles sobre "Pre-Filtro de Citas + Registro Exprés". ¿Me das información?',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Ver Demo o Consultar (WhatsApp)',
    contenido_detalle_markdown: `### 💇‍♀️ Sistema de Pre-Filtro de Citas para Salones

Elimina los chats interminables respondiendo precios y disponibilidad manualmente. Tu WhatsApp trabajará en autopiloto:

#### 🔥 Beneficios Clave:
* 🌸 **Filtro Inteligente de Servicios**: Muestra tratamientos, precios y duraciones exactas.
* 📋 **Registro en 3 Clics**: Formulario móvil ultrarrápido para que la recepcionista reserve en 5 segundos.
* 🔔 **Recordatorio Anti-Plantones**: Notificación automática por WhatsApp 2 horas antes de la cita.

> *"Nuestros salones clientes han reducido un 70% el tiempo en WhatsApp y eliminado las inasistencias."*

#### 🚀 ¿Qué entregamos en la instalación?
* Configuración completa de n8n o tu plataforma preferida.
* Capacitación en video para tu personal de recepción.
* Soporte directo 1 a 1 por WhatsApp durante 30 días.`,
    clics_count: 0,
    orden: 2,
    activo: true,
  },
  {
    id: 'salon-reactivacion-60dias',
    categoria: 'salones',
    titulo: 'Motor de Reactivación de Clientas (60 Días)',
    subtitulo: 'Salones de Belleza & Estética',
    descripcion: 'Escanea tu base de datos y envía ofertas irresistibles por WhatsApp a clientas que no han regresado en 2 meses.',
    badge: '🔥 Alto Impacto',
    icono: '✨',
    precio: 'Mensual / Comisión',
    mensaje_whatsapp: 'Hola Martín! Me interesa activar el Motor de Reactivación de Clientas. ¿Me das más información?',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Sistema (WhatsApp)',
    contenido_detalle_markdown: `### ✨ Motor de Reactivación Automática a 60 Días

Recupera clientas perdidas de tu salón sin gastar un solo dólar en anuncios de Facebook o TikTok:

#### 📈 ¿Cómo funciona la magia?
1. **Detección Automática**: El sistema identifica clientas que no han asistido en los últimos 60 días.
2. **Mensaje Personalizado**: Envía un saludo por su nombre con una oferta VIP o descuento exclusivo.
3. **Conversión Inmediata**: La clienta responde al WhatsApp y agenda su turno al instante.

> *"Recuperar una clienta inactiva cuesta 5 veces menos que conseguir una clienta nueva."*`,
    clics_count: 0,
    orden: 3,
    activo: true,
  },
  {
    id: 'rest-pedidos-menu-webapp',
    categoria: 'restaurantes',
    titulo: 'Bot de Pedidos + Menú Interactivo WebApp',
    subtitulo: 'Restaurantes & Cafeterías',
    descripcion: 'Carta digital con fotos HD, cálculo automático de total, delivery y envío del pedido impecablemente formateado a tu WhatsApp de cocina.',
    badge: '🍕 Recomendado',
    icono: '🍕',
    precio: 'S/ 199 / mes',
    mensaje_whatsapp: 'Hola Martín! Quisiera solicitar información sobre el Bot de Pedidos + Menú Interactivo WebApp.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Solicitar Sistema (S/ 199 / mes)',
    contenido_detalle_markdown: `### 🍕 Carta Digital Interactiva & Pedidos por WhatsApp

Transforma el menú de tu restaurante en una WebApp ultrarrápida sin pagar comisiones por pedido:

#### 🍔 Características de Alto Nivel:
* 📸 **Menú con Fotos HD**: Visualización limpia, rápida y adaptable a cualquier smartphone.
* 🛵 **Cálculo de Delivery**: Suma de productos, agregados (salsas, bebidas) y tarifa de envío.
* 📥 **Comanda Impecable por WhatsApp**: Llega directo al área de cocina con el desglose exacto y nombre del cliente.`,
    clics_count: 0,
    orden: 4,
    activo: true,
  },
  {
    id: 'rest-rastreo-delivery-wa',
    categoria: 'restaurantes',
    titulo: 'Rastreo de Pedidos & Delivery por WhatsApp',
    subtitulo: 'Restaurantes & Cafeterías',
    descripcion: 'Notificaciones automáticas en tiempo real al cliente por WhatsApp cuando su pedido pasa a "En preparación" y luego "En camino".',
    badge: '🚀 Cero llamadas',
    icono: '🛵',
    precio: 'S/ 149 / mes',
    mensaje_whatsapp: 'Hola Martín! Me interesa el sistema de Rastreo de Pedidos por WhatsApp. ¿Me das información?',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Ver Detalles & Demo (WhatsApp)',
    contenido_detalle_markdown: `### 🛵 Rastreo de Delivery en Tiempo Real por WhatsApp

Tranquiliza a tus clientes hambrientos y elimina las llamadas a tu local preguntando *"¿dónde está mi pedido?"*:

#### 🚀 Estados Automáticos:
1. 👨‍🍳 **En Cocina**: *"Tu pedido ha ingresado a preparación."*
2. 🛵 **En Camino**: *"El motorizado ya salió a tu dirección."*
3. 🎉 **Entregado**: *"¡Que lo disfrutes! Déjanos una reseña."*`,
    clics_count: 0,
    orden: 5,
    activo: true,
  },
  {
    id: 'serv-fidelizacion-puntos',
    categoria: 'transversales',
    titulo: 'Sistema Digital de Fidelización por Puntos',
    subtitulo: 'Fidelización & Retención',
    descripcion: 'Consulta de saldo de puntos y recompensas automáticas por WhatsApp tras cada compra o consumo. Sin tarjetas de plástico.',
    badge: '🎁 Retención 3x',
    icono: '🎁',
    precio: 'Consultar Plan',
    mensaje_whatsapp: 'Hola Martín! Me interesa el Sistema Digital de Fidelización por Puntos. ¿Me das más información?',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Plan & Demo',
    contenido_detalle_markdown: `### 🎁 Sistema Digital de Puntos por WhatsApp

Premia la lealtad de tus clientes de forma 100% digital sin imprimir tarjetas físicas que terminan en la basura:

* 📱 **Consulta por WhatsApp**: El cliente escribe *"Mis Puntos"* y ve su saldo al instante.
* 🏆 **Canje de Premio**: Desbloquea recompensas automáticas al alcanzar 100 o 200 puntos.`,
    clics_count: 0,
    orden: 6,
    activo: true,
  },
  {
    id: 'serv-bot-capturador-247',
    categoria: 'servicios',
    titulo: 'Capturador Base + Bot Informativo 24/7',
    subtitulo: 'Servicios en General',
    descripcion: 'Responde precios, horarios, carta de servicios y ubicación automáticamente las 24 horas y guarda el contacto prospecto en tu BD.',
    badge: '🤖 24/7 Autopiloto',
    icono: '💼',
    precio: 'S/ 149 / mes',
    mensaje_whatsapp: 'Hola Martín! Quiero información sobre el Capturador Base + Bot Informativo 24/7.',
    tipo_boton: 'whatsapp',
    texto_boton_personalizado: '💬 Consultar Disponibilidad',
    contenido_detalle_markdown: `### 🤖 Bot Capturador 24/7 para Empresas de Servicios

No pierdas clientes nocturnos ni durante los fines de semana. Tu bot atenderá dudas y capturará leads al instante:

* ⏱️ **Respuesta Inmediata**: En menos de 3 segundos entrega PDF de servicios, ubicación y precios.
* 📊 **Guardado en Base de Datos**: Registra el nombre, teléfono y servicio de interés automáticamente.`,
    clics_count: 0,
    orden: 7,
    activo: true,
  },
];

const LOCAL_STORAGE_KEY_SOLUCIONES = 'korat_soluciones_catalog';
const LOCAL_STORAGE_KEY_CATEGORIAS = 'korat_soluciones_categorias';
const LOCAL_STORAGE_KEY_HEADER = 'korat_soluciones_header';

export async function getHeaderConfig(): Promise<SolucionesHeaderConfig> {
  try {
    const { data, error } = await supabase
      .from('soluciones_header_config')
      .select('*')
      .eq('id', 'main')
      .single();

    if (!error && data) {
      return {
        statusBadge: data.status_badge || HEADER_DEFAULT.statusBadge,
        nombrePersona: data.nombre_persona || HEADER_DEFAULT.nombrePersona,
        subtituloPersona: data.subtitulo_persona || HEADER_DEFAULT.subtituloPersona,
        trustBadge1: data.trust_badge1 || HEADER_DEFAULT.trustBadge1,
        trustBadge2: data.trust_badge2 || HEADER_DEFAULT.trustBadge2,
      };
    }
  } catch (e) {
    console.warn('Fallback local header:', e);
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY_HEADER);
  if (local) {
    try { return JSON.parse(local); } catch { /* ignore */ }
  }

  return HEADER_DEFAULT;
}

export async function saveHeaderConfig(config: SolucionesHeaderConfig): Promise<void> {
  try {
    const { error } = await supabase
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

    if (error) console.warn('Error upsert header config Supabase:', error.message);
  } catch (e) {
    console.warn('Fallback save local header:', e);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY_HEADER, JSON.stringify(config));
}

export async function getCategorias(): Promise<CategoriaPersonalizada[]> {
  try {
    const { data, error } = await supabase
      .from('soluciones_categorias')
      .select('*')
      .order('orden', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as CategoriaPersonalizada[];
    }
  } catch (e) {
    console.warn('Fallback local categorías:', e);
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIAS);
  if (local) {
    try { return JSON.parse(local); } catch { /* ignore */ }
  }

  return CATEGORIAS_DEFAULT;
}

export async function saveCategorias(categorias: CategoriaPersonalizada[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('soluciones_categorias')
      .upsert(categorias);

    if (error) console.warn('Error upsert categorías Supabase:', error.message);
  } catch (e) {
    console.warn('Fallback save local categorías:', e);
  }

  localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIAS, JSON.stringify(categorias));
}

export async function getSoluciones(): Promise<SolucionItem[]> {
  try {
    const { data, error } = await supabase
      .from('soluciones_catalog')
      .select('*')
      .order('orden', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as SolucionItem[];
    }
  } catch (e) {
    console.warn('Fallback a almacenamiento local para soluciones:', e);
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEY_SOLUCIONES);
  if (local) {
    try { return JSON.parse(local); } catch { /* ignore */ }
  }

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
