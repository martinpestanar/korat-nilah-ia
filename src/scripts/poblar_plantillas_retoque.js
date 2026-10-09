import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PLANTILLAS_MAESTRAS = [
  // 💅 1. Uñas Acrílicas
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Uñas Acrílicas',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `Dime que no estás mirando tus uñas con esa cara de "todavía aguantan" cuando ya pasaron {dias_pasados} días... 🧐 {nombre_cliente}, esa cutícula ya pide auxilio y por aquí te extrañamos. 💅\n\n¿Te gustaría que te guarde un espacio para estos días o prefieres ver la próxima semana?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Uñas Acrílicas',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `Confiesa: ¿cuántas veces escondiste las manos hoy para que no se note el crecimiento? 🙈 {nombre_cliente}, cuidemos esa estructura a tiempo antes de que se enganche o rompa. ✨\n\n¿Te viene mejor pasar a rellenar esta semana o prefieres que coordinemos para el finde?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Uñas Acrílicas',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `Ese largo ya está al límite de empezar a chocar con el teclado del teléfono, te conozco... 🤭 {nombre_cliente}, tus uñitas ya se ganaron su sesión de mimo y diseño fresco. 💅\n\n¿Te reservo un huequito estos días o te queda más cómodo chequear la siguiente semana?`,
    activo: true,
    es_default: false,
  },

  // 💅 2. Base Rubber / Kapping
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Base Rubber',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `Apuesto a que estás pasando el dedito por la cutícula sintiendo el desnivel del crecimiento... 🧐 Ya van {dias_pasados} días, {nombre_cliente}, y es el momento ideal para nivelar y proteger tu uña natural. 💅\n\n¿Te gustaría renovar tu refuerzo estos días o te acomoda mejor la próxima semana?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Base Rubber',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `Dime que no estás tentada a despegar esa esquinita levantada porque te veo venir... 🙈 {nombre_cliente}, cuidemos tu base rubber intacta para que no se debilite tu uña natural. ✨\n\n¿Prefieres pasar entre semana a retocar o te reservo un lugar para el sábado?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Base Rubber',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `Tus uñas naturales crecieron increíble, pero el peso del rubber ya se desplazó a la punta... 👀 {nombre_cliente}, hagamos ese mantenimiento express para que sigan fuertes y perfectas. 💅\n\n¿Te guardo un espacio para estos días o prefieres que veamos horarios la otra semana?`,
    activo: true,
    es_default: false,
  },

  // 💅 3. Esmaltado Semipermanente
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Semipermanente',
    categoria_servicio: 'Esmaltado Semipermanente',
    contenido: `Ese esmaltado aguantó como un guerrero, pero la cutícula ya no perdona los {dias_pasados} días... 🤭 {nombre_cliente}, por el salón ya tenemos colores nuevos hermosos esperando por ti. 💅\n\n¿Te gustaría cambiar de tono estos días o prefieres coordinar para el finde?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Semipermanente',
    categoria_servicio: 'Esmaltado Semipermanente',
    contenido: `Prohibido arrancar el esmalte si se levantó una orillita, promesa de honor... 🙈 {nombre_cliente}, retiremos con cuidado y dejemos tus manitas impecables y limpias otra vez. ✨\n\n¿Te viene bien una cita por la tarde estos días o prefieres la próxima semana?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Semipermanente',
    categoria_servicio: 'Esmaltado Semipermanente',
    contenido: `El brillo sigue ahí, pero ese espacio en la raíz delata que ya toca renovación... 🧐 {nombre_cliente}, regálate una horita de desconexión para dejar tus uñas como nuevas. 💅\n\n¿Te guardo un huequito esta semana o te queda más cómodo la que viene?`,
    activo: true,
    es_default: false,
  },

  // 💅 4. Soft Gel / Gel X
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Soft Gel',
    categoria_servicio: 'Soft Gel / Gel X',
    contenido: `Ese set de Soft Gel se lució increíble, pero el ápice ya creció y pierde su balance natural... 🧐 {nombre_cliente}, van {dias_pasados} días y es clave renovar para cuidar tu uña debajo. 💅\n\n¿Te gustaría hacer el cambio de set estos días o prefieres agendar para la próxima semana?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Soft Gel',
    categoria_servicio: 'Soft Gel / Gel X',
    contenido: `Dime que no estás usando las uñas como abrelatas ahora que están larguísimas... 🙈 {nombre_cliente}, evitemos que hagan palanca y renovemos con un diseño fresco de temporada. ✨\n\n¿Te acomoda pasar a mitad de semana o prefieres que coordinemos para el finde?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Soft Gel',
    categoria_servicio: 'Soft Gel / Gel X',
    contenido: `Tus tips de Soft Gel ya cumplieron su misión con honores en estas semanas... 🤭 {nombre_cliente}, hagamos retiro seguro y montemos set nuevo impecable sin maltratar tu base. 💅\n\n¿Prefieres que te aparte un espacio estos días o revisamos la siguiente semana?`,
    activo: true,
    es_default: false,
  },

  // 👁️ 5. Lifting de Pestañas
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Lifting de Pestañas',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `Dime que no estás volviendo a pelear con el rizador metálico por las mañanas... 🤭 {nombre_cliente}, ya pasaron {dias_pasados} días y tus pestañas nuevas ya piden su curva y tinte negro intacto. 👁️\n\n¿Te gustaría renovar tu curvatura estos días o prefieres que veamos la próxima semana?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Lifting de Pestañas',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `Ese efecto mirada descansada fue la gloria, pero ya se nota el cambio del ciclo natural... ✨ {nombre_cliente}, regalémonos esa horita de relax para dejar tus pestañas levantadas y nutridas. 🌸\n\n¿Te queda más cómodo pasar por la mañana o prefieres un horario de tarde?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Lifting de Pestañas',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `Confiesa: ¿cuántas capas de rímel tuviste que ponerte hoy para lograr el mismo efecto? 🙈 {nombre_cliente}, revivamos ese lifting con keratina para que despiertes lista sin maquillaje. 👁️\n\n¿Te guardo un espacio para estos días o te queda más fácil coordinar para el finde?`,
    activo: true,
    es_default: false,
  },

  // 👁️ 6. Extensiones de Pestañas
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Extensiones Pestañas',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `Confiesa: ¿cuántas veces te acomodaste las pestañas disimulando hoy frente al espejo? 🙈 Ya van {dias_pasados} días, {nombre_cliente}, y cuidemos ese set antes de que toque hacer aplicación completa de cero. ✨\n\n¿Te gustaría pasar estos días a rellenar o te queda más cómodo chequear la siguiente semana?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Extensiones Pestañas',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `Ese efecto volumen te quedó soñado, pero los huequitos del crecimiento ya empiezan a asomarse... 🧐 {nombre_cliente}, hagamos ese relleno a tiempo para mantener tu mirada tupida e impecable. 👁️\n\n¿Prefieres venir a retocar estos días o te reservo un espacio para el finde?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Extensiones Pestañas',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `Péinalas con cuidado y nada de tirar de las que queden sueltas, que te conozco... 🤭 {nombre_cliente}, limpiemos la línea y reforcemos tu set para que sigas lista en 5 minutos. ✨\n\n¿Te viene mejor pasar a media tarde estos días o coordinamos para la otra semana?`,
    activo: true,
    es_default: false,
  },

  // 👁️ 7. Laminado & Diseño de Cejas
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Laminado de Cejas',
    categoria_servicio: 'Laminado & Diseño de Cejas',
    contenido: `Apuesto a que tus vellitos rebeldes ya no se quedan peinados ni con el gel fijador más fuerte... 🤭 {nombre_cliente}, pasaron {dias_pasados} días y es hora de alinear y perfilar tu mirada. ✨\n\n¿Te gustaría renovar tu laminado estos días o prefieres que coordinemos para el finde?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Laminado de Cejas',
    categoria_servicio: 'Laminado & Diseño de Cejas',
    contenido: `Prohibido agarrar la pinza en casa para sacar esos pelitos que salieron alrededor... 🙈 {nombre_cliente}, limpiemos el diseño profesional y reorganicemos la forma perfecta de tus cejas. 🌸\n\n¿Te guardo un espacio esta semana o te queda más cómodo la siguiente?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Laminado de Cejas',
    categoria_servicio: 'Laminado & Diseño de Cejas',
    contenido: `Ese marco impecable en tu rostro ya cumplió sus semanas y los pelitos nuevos piden dirección... 🧐 {nombre_cliente}, hagamos un refresh con nutrición para que queden peinadas solitas. ✨\n\n¿Prefieres pasar por la mañana estos días o te acomoda más por la tarde?`,
    activo: true,
    es_default: false,
  },

  // 💇‍♀️ 8. Retoque de Raíz / Canas
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Retoque de Raíz',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `Esa línea de crecimiento ya no se tapa cambiando la raya del cabello de lado, te vi... 🤭 {nombre_cliente}, van {dias_pasados} días y tu cabello ya se ganó su ratito de color y café rico en el salón. ☕\n\n¿Te gustaría renovar el tono estos días o prefieres que coordinemos para el finde?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Retoque de Raíz',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `Ni se te ocurra caer en la tentación del tinte de cajita del súper en el baño de tu casa... 🙈 {nombre_cliente}, cuidemos tu fórmula exacta y el brillo sedoso con los productos profesionales de siempre. 💇‍♀️\n\n¿Te aparto un huequito entre semana o prefieres que veamos la próxima?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Retoque de Raíz',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `El color en las puntas sigue hermoso, pero esa raíz ya está lista para su emparejada perfecta... 🧐 {nombre_cliente}, ven a consentirte un ratito y sal con el cabello radiante de nuevo. ✨\n\n¿Te viene bien pasar estos días por la tarde o prefieres agendar el finde?`,
    activo: true,
    es_default: false,
  },

  // 💇‍♀️ 9. Terapia Capilar & Hidratación
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Terapia Capilar',
    categoria_servicio: 'Terapia Capilar & Hidratación',
    contenido: `Dime que las puntas no te están empezando a pedir un shot de rescate y nutrición profunda... 🧐 {nombre_cliente}, van {dias_pasados} días y tu melena ya extraña esa suavidad y movimiento ligero. 💇‍♀️\n\n¿Te gustaría reactivar el brillo estos días o prefieres que coordinemos para la otra semana?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Terapia Capilar',
    categoria_servicio: 'Terapia Capilar & Hidratación',
    contenido: `La secadora y el sol le pasan factura al pelo más rápido de lo que creemos... 🙈 {nombre_cliente}, hagamos ese cóctel reparador en el lavacabezas con su buen masaje relajante incluido. 💆‍♀️\n\n¿Te guardo un espacio para esta semana o te queda más cómodo el sábado?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Terapia Capilar',
    categoria_servicio: 'Terapia Capilar & Hidratación',
    contenido: `Esa textura de seda que te quedó en la última visita ya merece su refuerzo mensual... ✨ {nombre_cliente}, tómate esa hora para ti y dejemos tu cabello blindado contra el frizz. 🌸\n\n¿Prefieres venir por la mañana estos días o te queda más fácil por la tarde?`,
    activo: true,
    es_default: false,
  },

  // 💇‍♀️ 10. Alisado Orgánico
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Alisado Orgánico',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `Dime que no estás pasando la planchita en el flequillo a escondidas esperando que no nos demos cuenta... 🙄 {nombre_cliente}, van {dias_pasados} días y tu cabello ya pide renovar ese liso espejo sin esfuerzo. 🪞\n\n¿Le renovamos la nutrición y el liso perfecto esta semana o prefieres la próxima?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Alisado Orgánico',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `Esa comodidad de salir de la ducha y secar al aire sin frizz ya empieza a perder fuerza en la raíz... 🤭 {nombre_cliente}, hagamos retoque orgánico para que sigas ahorrando 30 minutos cada mañana. ✨\n\n¿Te gustaría reservar tu espacio estos días o prefieres coordinar con calma para el fin de semana?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Alisado Orgánico',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `El largo sigue disciplinado, pero el crecimiento nuevo ya empieza a ganar volumen rebelde... 🧐 {nombre_cliente}, sellemos brillo y sedosidad total sin formol para mantenerlo impecable. 💇‍♀️\n\n¿Prefieres que te aparte un lugar para esta semana o revisamos la siguiente?`,
    activo: true,
    es_default: false,
  },

  // 🦶 11. Pedicura Spa Completa
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Pedicura Spa',
    categoria_servicio: 'Pedicura Spa Completa',
    contenido: `Dime que no estás posponiendo el momento de consentir a tus pies cuando ya pasaron {dias_pasados} días... 🙄 {nombre_cliente}, tus pies ya están contando el tiempo para su exfoliación y relax merecido. 💆‍♀️\n\n¿Te reservo tu sesión de spa esta semana o prefieres que veamos la próxima?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Pedicura Spa',
    categoria_servicio: 'Pedicura Spa Completa',
    contenido: `Los zapatos cerrados y el trajín de la semana ya dejaron los talones pidiendo auxilio... 🙈 {nombre_cliente}, ven a desconectar media horita en el sillón de masajes mientras dejamos tus pies de seda. 🦶\n\n¿Te viene mejor pasar entre semana o prefieres apartar un huequito el sábado?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Pedicura Spa',
    categoria_servicio: 'Pedicura Spa Completa',
    contenido: `Ese tono en los pies lució hermoso en sandalias, pero el crecimiento ya está pidiendo renovación... 💅 {nombre_cliente}, hagamos limpieza profunda y esmaltado impecable para que camines en las nubes. ✨\n\n¿Te gustaría agendar estos días por la tarde o prefieres coordinar la otra semana?`,
    activo: true,
    es_default: false,
  },

  // ✨ 12. Limpieza Facial Profunda
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 1 — Limpieza Facial',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `Confiesa: ¿cuántas veces te miraste al espejo con ganas de apretarte un puntito negro esta semana? 🙈 {nombre_cliente}, pasaron {dias_pasados} días y es momento de descongestionar y oxigenar tus poros como se debe. ✨\n\n¿Te gustaría regalarte tu sesión de glow estos días o prefieres coordinar para el finde?`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 2 — Limpieza Facial',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `La contaminación y el maquillaje van opacando el brillo natural de la piel sin que nos demos cuenta... 🧐 {nombre_cliente}, hagamos esa extracción profesional con mascarilla hidratante para devolverte la luminosidad. 🧖‍♀️\n\n¿Te guardo un espacio esta semana o te queda más cómodo la siguiente?`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'retoque_mantenimiento',
    tiempo: 'tiempo_1',
    titulo: 'Variación 3 — Limpieza Facial',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `Tus cremas y serums se absorben el doble de rico cuando la piel está 100% libre de impurezas... 🌸 {nombre_cliente}, ven a relajarte una horita y sal con el rostro descansado y suave como terciopelo. ✨\n\n¿Prefieres venir por la mañana estos días o te acomoda mejor un horario de tarde?`,
    activo: true,
    es_default: false,
  },
];

async function run() {
  console.log('Iniciando poblamiento de 36 plantillas maestras...');
  
  // 1. Limpiar anteriores
  const { error: delErr1 } = await supabase
    .from('plantillas_automatizacion')
    .delete()
    .in('flujo', ['retoque', 'retoque_mantenimiento']);
  if (delErr1) console.error('Error borrando en plantillas_automatizacion:', delErr1);

  const { error: delErr2 } = await supabase
    .from('plantillas_automatizacion_globales')
    .delete()
    .in('flujo', ['retoque', 'retoque_mantenimiento']);
  if (delErr2) console.error('Error borrando en plantillas_automatizacion_globales:', delErr2);

  // 2. Insertar las 36 globales
  const { data: insertedGlobals, error: insErr } = await supabase
    .from('plantillas_automatizacion_globales')
    .insert(PLANTILLAS_MAESTRAS)
    .select('id, titulo, categoria_servicio');

  if (insErr) {
    console.error('Error insertando plantillas globales:', insErr);
    process.exit(1);
  }

  console.log(`✅ ${insertedGlobals.length} plantillas globales creadas con éxito.`);

  // 3. Propagar a todos los negocios
  const { data: negocios, error: negErr } = await supabase
    .from('negocios')
    .select('id');

  if (negErr || !negocios) {
    console.error('Error obteniendo negocios:', negErr);
    process.exit(1);
  }

  console.log(`Propagando a ${negocios.length} negocios...`);

  const filasParaNegocios = [];
  for (const n of negocios) {
    for (const p of PLANTILLAS_MAESTRAS) {
      filasParaNegocios.push({
        business_id: n.id,
        flujo: p.flujo,
        tiempo: p.tiempo,
        titulo: p.titulo,
        categoria_servicio: p.categoria_servicio,
        contenido: p.contenido,
        activo: p.activo,
        es_default: p.es_default,
      });
    }
  }

  // Insertar en lotes de 100
  for (let i = 0; i < filasParaNegocios.length; i += 100) {
    const lote = filasParaNegocios.slice(i, i + 100);
    const { error: batchErr } = await supabase
      .from('plantillas_automatizacion')
      .insert(lote);
    if (batchErr) {
      console.error(`Error en lote ${i}:`, batchErr);
    }
  }

  console.log(`🚀 ¡Completado! Total filas propagadas: ${filasParaNegocios.length}`);
}

run();
