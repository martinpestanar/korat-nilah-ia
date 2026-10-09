import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PLANTILLAS_FIDELIZACION = [
  // ─────────────────────────────────────────────────────────────
  // 1. ENCUESTA DE CALIFICACIÓN (1 a 5 ⭐)
  // ─────────────────────────────────────────────────────────────
  {
    flujo: 'fidelizacion_encuesta',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Enfoque Calidez & Servicio',
    categoria_servicio: null,
    contenido: `🌸 Qué alegría haberte tenido con nosotras.\n\nUna preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'fidelizacion_encuesta',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Consentir & Emoción',
    categoria_servicio: null,
    contenido: `✨ Qué gusto haberte atendido hoy.\n\nNos encantaría saber tu opinión sincera: del 1 al 5, ¿cómo te fue con nosotras? (Responde solo con el número) 🌸`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_encuesta',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Experiencia Directa',
    categoria_servicio: null,
    contenido: `🌸 Gracias por visitarnos hoy.\n\nTu opinión nos ayuda a seguir mejorando ✨ Del 1 al 5, ¿cómo calificarías tu experiencia? (Solo el número, así de fácil) 👇`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_encuesta',
    tiempo: 'tiempo_1',
    titulo: 'Variación 4 — Cercanía & Feedback',
    categoria_servicio: null,
    contenido: `💖 Gracias por elegirnos para tu cita de hoy.\n\nTu feedback es súper valioso para nosotras 🙌 Del 1 al 5, ¿qué nota le pones al servicio? (Nomás el número) 👇`,
    activo: true,
    es_default: false,
  },

  // ─────────────────────────────────────────────────────────────
  // 2. SOLO CALIFICACIÓN — AGRADECIMIENTO (Sin Puntos / 4-5 ⭐)
  // ─────────────────────────────────────────────────────────────
  {
    flujo: 'calificacion_agradecimiento',
    tiempo: 'tiempo_2',
    titulo: 'Variación 1 — Gratitud & Amor por el Detalle',
    categoria_servicio: null,
    contenido: `¡Muchísimas gracias, {nombre_cliente}! 🥰✨\n\nNos alegra de corazón saber que tuviste una excelente experiencia en *{nombre_negocio}* con tu *{servicio}*. Tu opinión nos motiva a seguir cuidando cada detalle con mucho amor 💕.\n\n¡Que tengas un día increíble, cuídate mucho! 🌸`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'calificacion_agradecimiento',
    tiempo: 'tiempo_2',
    titulo: 'Variación 2 — Alegría & Confianza',
    categoria_servicio: null,
    contenido: `¡Qué linda, nos llena el corazón leerte! 💖✨\n\nSaber que saliste feliz de *{nombre_negocio}* es nuestra mayor satisfacción. Gracias infinitas por tu tiempo y por confiar en nuestras manos para tu *{servicio}* 🌸.\n\n¡Te mandamos un abrazo enorme y nos vemos pronto! 💫`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'calificacion_agradecimiento',
    tiempo: 'tiempo_2',
    titulo: 'Variación 3 — Consentirte Siempre',
    categoria_servicio: null,
    contenido: `¡Mil gracias por tu calificación tan bella, {nombre_cliente}! 🌸✨\n\nNos encanta consentirte y nos alegra que hayas disfrutado al máximo tu visita de hoy. Todo el equipo de *{nombre_negocio}* te espera con los brazos abiertos siempre 💕.\n\n¡Que tengas una semana hermosa! 🌷`,
    activo: true,
    es_default: false,
  },

  // ─────────────────────────────────────────────────────────────
  // 3. RECUPERACIÓN DE QUEJAS (1 a 3 ⭐)
  // ─────────────────────────────────────────────────────────────
  {
    flujo: 'fidelizacion_queja',
    tiempo: 'tiempo_3',
    titulo: 'Variación 1 — Empatía & Escucha Cercana',
    categoria_servicio: null,
    contenido: `Uy, lamento que tu experiencia no haya sido perfecta 🥺\n\nPara nosotras tu comodidad es prioridad. ¿Podrías darme un poquito más de detalle sobre lo que pasó para revisarlo juntas?\n\nQuedo súper pendiente de tu mensaje 💕`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'fidelizacion_queja',
    tiempo: 'tiempo_3',
    titulo: 'Variación 2 — Contacto Directo de la Dueña/Encargada',
    categoria_servicio: null,
    contenido: `Lamento de verdad que no salieras 100% satisfecha 🥺\n\nMe interesa mucho entender qué falló para solucionártelo a la brevedad. ¿Me escribes por aquí qué sucedió?\n\nAquí estoy para leerte y ayudarte 💕`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_queja',
    tiempo: 'tiempo_3',
    titulo: 'Variación 3 — Recuperación Inmediata',
    categoria_servicio: null,
    contenido: `Lamento mucho leer esto 🥺\n\nLo que más nos importa es que te vayas feliz. ¿Me cuentas qué ocurrió para ayudarte y solucionarlo de inmediato?\n\nQuedo atenta por aquí para leerte 💕`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_queja',
    tiempo: 'tiempo_3',
    titulo: 'Variación 4 — Solución y Compromiso',
    categoria_servicio: null,
    contenido: `Qué pena leer esto 🥺 no es la experiencia que queremos darte.\n\nCuéntame qué pasó, así lo reviso y te ayudo a solucionarlo lo antes posible.\n\nAquí estoy, leyendo tu mensaje 💕`,
    activo: true,
    es_default: false,
  },

  // ─────────────────────────────────────────────────────────────
  // 4. HÍBRIDO — AGRADECIMIENTO & PUNTOS (Tras Calificar 4-5 ⭐)
  // ─────────────────────────────────────────────────────────────
  {
    flujo: 'fidelizacion_recompensa',
    tiempo: 'tiempo_2',
    titulo: 'Recompensa — Progreso de Puntos (Variación 1)',
    categoria_servicio: null,
    contenido: `¡Qué bella, muchísimas gracias! 🙌💖\n\nPor cierto, sumaste +{puntos_ganados} pts con tu visita. Ya llevas {puntos_actuales}/{costo_premio} pts para canjear tu {premio_sugerido} 🎁.\n\nUn abrazo enorme, ¡que tengas un lindo día! 💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'fidelizacion_recompensa',
    tiempo: 'tiempo_2',
    titulo: 'Recompensa — Progreso de Puntos (Variación 2)',
    categoria_servicio: null,
    contenido: `¡Nos alegra un montón leerte! Gracias por tu confianza 🌸\n\nYa sumaste +{puntos_ganados} pts 🎉 Estás en {puntos_actuales}/{costo_premio} pts para tu {premio_sugerido} 🎁 ¡cada vez más cerca!\n\n¡Que tengas un día increíble! 💫`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_recompensa',
    tiempo: 'tiempo_2',
    titulo: 'Recompensa — Progreso de Puntos (Variación 3)',
    categoria_servicio: null,
    contenido: `¡Mil gracias por tu linda nota, {nombre_cliente}! 🥰✨\n\nCon la visita de hoy sumaste *+{puntos_ganados} pts*. Tu saldo acumulado es de *{puntos_actuales}/{costo_premio} pts* para consentirte con tu *{premio_sugerido}* 🎁.\n\n¡Que tengas un día hermoso! 🌸`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_recompensa',
    tiempo: 'tiempo_2',
    titulo: 'Recompensa — Meta Desbloqueada (Premio Ganado)',
    categoria_servicio: null,
    contenido: `¡Felicidades, {nombre_cliente}! 🥳🎉 Con tu visita de hoy sumaste +{puntos_ganados} pts y alcanzaste un total de {puntos_actuales} pts.\n\n🏆 ¡Acabas de desbloquear tu premio: {premio_sugerido}! 🎁✨\nYa está listo en tu cuenta. Puedes venir a canjearlo y consentirte en tu próxima visita al salón. Solo avísanos al agendar tu siguiente cita para tenerlo preparado para ti 💕💅\n\n¡Nos vemos pronto! 🌸`,
    activo: true,
    es_default: false,
  },

  // ─────────────────────────────────────────────────────────────
  // 5. SOLO FIDELIZACIÓN — PUNTOS DIRECTOS (Sin Encuesta Previa)
  // ─────────────────────────────────────────────────────────────
  {
    flujo: 'fidelizacion_directa',
    tiempo: 'tiempo_1',
    titulo: 'Fidelización Directa — Progreso de Puntos (Variación 1)',
    categoria_servicio: null,
    contenido: `✨ Gracias por visitarnos hoy.\n\nPor tu visita sumaste *+{puntos_ganados} pts* 💖. Ahora tienes *{puntos_actuales}/{costo_premio} pts* para canjear tu *{premio_sugerido}* 🎁.\n\n¡Un abrazo enorme y que tengas un lindo día! 🌸`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'fidelizacion_directa',
    tiempo: 'tiempo_1',
    titulo: 'Fidelización Directa — Progreso de Puntos (Variación 2)',
    categoria_servicio: null,
    contenido: `🎁 ¡Tus puntos ya están cargados!\n\n¡Muchas gracias por tu visita de hoy! Sumaste +{puntos_ganados} pts a tu cuenta 🌟.\n\n📊 Tu avance: Tienes {puntos_actuales}/{costo_premio} pts acumulados para tu {premio_sugerido}.\n\n¡Te esperamos pronto para consentirte de nuevo! Que tengas un día hermoso. ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_directa',
    tiempo: 'tiempo_1',
    titulo: 'Fidelización Directa — Progreso de Puntos (Variación 3)',
    categoria_servicio: null,
    contenido: `✨ ¡Gracias por venir hoy!\n\nSumaste +{puntos_ganados} pts y tu total actual es de {puntos_actuales}/{costo_premio} pts.\n\n🎯 Próximo premio: {premio_sugerido} 🎁.\n\n¡Que tengas un día genial y un abrazo enorme! 🌸`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'fidelizacion_directa',
    tiempo: 'tiempo_1',
    titulo: 'Fidelización Directa — Meta Desbloqueada (Premio Ganado)',
    categoria_servicio: null,
    contenido: `¡Felicidades, {nombre_cliente}! 🥳🎉 Con tu visita de hoy sumaste +{puntos_ganados} pts y alcanzaste un total de {puntos_actuales} pts.\n\n🏆 ¡Acabas de desbloquear tu premio: {premio_sugerido}! 🎁✨\nYa está listo en tu cuenta. Puedes venir a canjearlo y consentirte en tu próxima visita al salón. Solo avísanos al agendar tu siguiente cita para tenerlo preparado para ti 💕💅\n\n¡Nos vemos pronto! 🌸`,
    activo: true,
    es_default: false,
  },
];

async function run() {
  console.log('Sincronizando plantillas de fidelización respetando tus estructuras originales...');

  // 1. Limpiar flujos de fidelizacion existentes
  const flujosFidelizacion = [
    'fidelizacion_encuesta',
    'calificacion_agradecimiento',
    'fidelizacion_queja',
    'fidelizacion_recompensa',
    'fidelizacion_directa'
  ];

  await supabase.from('plantillas_automatizacion_globales').delete().in('flujo', flujosFidelizacion);
  await supabase.from('plantillas_automatizacion').delete().in('flujo', flujosFidelizacion);

  // 2. Insertar las maestras globales
  const { data: inserted, error: insErr } = await supabase
    .from('plantillas_automatizacion_globales')
    .insert(PLANTILLAS_FIDELIZACION)
    .select('id, titulo, flujo');

  if (insErr) {
    console.error('Error insertando globales de fidelizacion:', insErr);
    process.exit(1);
  }

  console.log(`✅ ${inserted.length} plantillas maestras globales de fidelización creadas.`);
}

run();
