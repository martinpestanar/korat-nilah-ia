import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmZ2dwcXBicXFlYXZkYmR6d296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2ODMwMjEsImV4cCI6MjA4MjI1OTAyMX0.hko2l8IaJjbHLnGI8j_8czxC6q_b--hliidWbg2a8fM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PLANTILLAS_CUIDADOS = [
  // =========================================================================
  // 1. 💅 UÑAS ACRÍLICAS / POLYGEL
  // =========================================================================
  // 24h:
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Uñas Acrílicas — Joyas no herramientas (Variación A)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `¡Hola {nombre_cliente}! 💅 Qué lindo fue consentirte ayer con tu set nuevo.\n\nUn secretito rápido para que te duren intactas semanas: acuérdate que son joyas, no herramientas. Evita hacer palanca para abrir latas o cajas, y si limpias con productos químicos en casa, ponte guantes para blindar el sellado ✨`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Uñas Acrílicas — Cuidado del largo (Variación B)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `¡Hola {nombre_cliente}! ✨ Espero que estés disfrutando muchísimo tus uñas.\n\nTip clave para este primer día: cuida el largo al abotonar ropa o teclear mientras te acostumbras a la estructura. Si sientes cualquier incomodidad o roce extraño, avísame por aquí de inmediato 💖`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Uñas Acrílicas — Sellado & Brillo (Variación C)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `¡Hola {nombre_cliente}! 🌸 Paso a saludarte y dejarte una recomendación de oro para tus acrílicas.\n\nEvita el contacto prolongado con agua hirviendo o solventes en estas primeras 24h para que el brillo quede blindado. ¡A lucir esas manos hermosas hoy! 💕`,
    activo: true,
    es_default: false,
  },
  // Día 4:
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Uñas Acrílicas — Hidratación de cutícula (Variación A)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `¡Hola {nombre_cliente}! ✨ ¿Cómo vas sintiendo tu set de acrílico estos días?\n\nTip de oro para mantenerlas como recién salidas del salón: una gotita de aceite hidratante en tus cutículas por las noches hace magia y evita que la piel se reseque alrededor del producto 💅💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Uñas Acrílicas — Prohibido limar en casa (Variación B)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `¡Hola {nombre_cliente}! 🌸 ¿Todo cómodo con el largo y la forma de tus uñas?\n\nRecuerda no limar los laterales ni la punta con limas de casa para no abrir el sellado acrílico. Si alguna esquinita te incomoda, con gusto te la retoco en un minuto en el salón ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Uñas Acrílicas — Check-in de comodidad (Variación C)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `Hola {nombre_cliente} 🥰 Paso a ver cómo te vas adaptando a tus uñas esta semana.\n\nYa deben sentirse súper naturales en tu rutina diaria. Cualquier duda con el mantenimiento o cuidado, escríbeme con total confianza 💕`,
    activo: true,
    es_default: false,
  },
  // Día 10:
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Uñas Acrílicas — Crecimiento y balance (Variación A)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `¡Hola {nombre_cliente}! 💅 Ya van casi 10 días y tu uña natural viene creciendo súper sana debajo del acrílico.\n\nCuídalas de golpes fuertes porque el peso de la estructura se va desplazando hacia la punta. ¡Que sigas teniendo una hermosa semana! ✨`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Uñas Acrílicas — Cero desprendimientos (Variación B)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `Hola {nombre_cliente} ✨ Llegamos al día 10 de tu set. Recuerda que si notas el crecimiento en la raíz, es señal de que tu uña natural está súper fuerte.\n\nMantenlas secas y limpias, y si se engancha alguna orilla jamás tires de ella. ¡Aquí estamos para cuidarlas! 💖`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Uñas Acrílicas — Brillo continuo (Variación C)',
    categoria_servicio: 'Uñas Acrílicas',
    contenido: `¡Hola {nombre_cliente}! 🌸 ¿Cómo siguen esas uñitas? Para devolverles el brillo del primer día, puedes lavarlas suavemente con un cepillito de cerdas suaves y jabón neutro.\n\n¡Siguen viéndose hermosas, un abrazo grande! 💕`,
    activo: true,
    es_default: false,
  },

  // =========================================================================
  // 2. 💅 BASE RUBBER / KAPPING
  // =========================================================================
  // 24h:
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Base Rubber — Blindaje natural 24h (Variación A)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `¡Hola {nombre_cliente}! 💅 Qué lindo quedó tu refuerzo de Base Rubber ayer.\n\nUn secretito clave: el rubber es un gel flexible que protege tu uña para que crezca larga y sana. Evita raspar superficies o usar las uñas como herramientas para no forzar la flexibilidad natural ✨`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Base Rubber — No arrancar orillas (Variación B)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `¡Hola {nombre_cliente}! ✨ Paso a dejarte la regla de oro de tu Base Rubber.\n\nSi con los días sientes alguna orillita flexible en la cutícula, ¡jamás la arranques con los dedos ni con los dientes! Al pelarla te llevas capas de tu uña real. Cualquier detalle, aquí te lo soluciono de inmediato 💖`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Base Rubber — Sellado elástico (Variación C)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `¡Hola {nombre_cliente}! 🌸 Espero que estés amando la firmeza que le dio el rubber a tus uñas.\n\nCuídalas del agua hirviendo directa hoy para que la adherencia quede blindada al 100%. ¡A disfrutar tus manos impecables! 💕`,
    activo: true,
    es_default: false,
  },
  // Día 4:
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Base Rubber — Aceite de cutículas (Variación A)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `¡Hola {nombre_cliente}! ✨ ¿Cómo vas sintiendo la fuerza de tu Base Rubber?\n\nTip para que el producto se mantenga elástico y no se quiebre: aplica una gotita de aceite en la cutícula cada noche. Mantiene la uña hidratada por debajo y el brillo como nuevo 💅💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Base Rubber — Cuidado con químicos (Variación B)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `Hola {nombre_cliente} 🌸 Paso a saludarte. Recuerda que aunque la Base Rubber es súper resistente, el cloro y los detergentes fuertes resecan el gel.\n\nUsar guantes para limpiar te asegura semanas de uñas intactas. ¡Que tengas un lindo día! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Base Rubber — Crecimiento flexible (Variación C)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `¡Hola {nombre_cliente}! 🥰 ¿Todo cómodo con tu kapping?\n\nTu uña natural ya está protegida y creciendo a su propio ritmo sin romperse. Si notas cualquier duda o consulta, avísame con confianza 💕`,
    activo: true,
    es_default: false,
  },
  // Día 10:
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Base Rubber — Uñas naturales creciendo (Variación A)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `¡Hola {nombre_cliente}! 💅 Ya van 10 días y el crecimiento de tu uña natural bajo el rubber es evidente.\n\nEse desnivel en la cutícula es señal de salud y fuerza. Sigue hidratando tus manos para que la transición siga impecable. ¡Un abrazo enorme! ✨`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Base Rubber — Mantenimiento de forma (Variación B)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `Hola {nombre_cliente} ✨ Llegamos al día 10 de tu base rubber.\n\nRecuerda no limar las puntas en casa para no romper el sellado del borde libre. Tus uñas siguen firmes y protegidas. ¡Que sigas teniendo una hermosa semana! 💖`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Base Rubber — Cero mordeduras (Variación C)',
    categoria_servicio: 'Base Rubber / Kapping',
    contenido: `¡Hola {nombre_cliente}! 🌸 ¿Cómo siguen esas uñas?\n\nEl objetivo del rubber es que tu uña crezca sin que tengas la tentación de tocarla o doblarla. ¡Vas súper bien! Cualquier cosita me avisas por aquí 💕`,
    activo: true,
    es_default: false,
  },

  // =========================================================================
  // 3. 👁️ EXTENSIONES DE PESTAÑAS (Punto a Punto / Volumen / Clásicas)
  // =========================================================================
  // 24h:
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Extensiones — Tip de Oro 24h (Variación A)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `¡Hola {nombre_cliente}! ✨ Qué lindo fue tenerte ayer con nosotras 🥰\n\nTe escribo rapidito para dejarte el tip de oro: ¡las primeras 24 horas son sagradas! Evita el vapor caliente y duchas hirviendo, y nada de desmaquillantes con aceite cerca de tus ojos para que el adhesivo selle blindado 🚫💧`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Extensiones — Durabilidad & Sellado (Variación B)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🌸 Paso a dejarte un secretito clave de hoy: cuida tus pestañitas del agua tibia directa y el vapor por estas primeras 24h para que el sellado quede blindado y te duren semanas intactas.\n\nSi tienes dudas con el cepillado o limpieza, ¡aquí estoy para ayudarte! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Extensiones — Cuidado Express (Variación C)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🥰 Espero que hayas descansado súper bien.\n\nRecordatorio express para cuidar tu set hoy: evita saunas, vapores y productos con aceite en la zona de los ojos. ¡A lucir esa mirada hermosa hoy! 💖`,
    activo: true,
    es_default: false,
  },
  // Día 4:
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Extensiones — Check-in & Tip Peinado (Variación A)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🌸 ¿Cómo vas sintiendo tus pestañitas? 👁️✨\n\nYa deben estar súper asentadas y cómodas. Paso a dejarte un tip clave: péinalas siempre de medios a puntas (nunca desde la raíz para no tocar la unión) y hazlo solo cuando estén completamente sequitas 🌬️💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Extensiones — Tip Limpieza & Espuma (Variación B)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `¡Hola {nombre_cliente}! ✨ ¿Todo cómodo con tu set?\n\nTip de oro para estos días: lavarlas suavemente con agüita o shampoo especial de pestañas y mantenerlas libres de oleosidad hace que duren mucho más tiempo alineadas. ¡Cualquier duda aquí estamos! 💖`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Extensiones — Check-in de Comodidad (Variación C)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `Hola {nombre_cliente} 🥰 Paso a saludarte y ver cómo te vas sintiendo con tus extensiones estos días.\n\nRecuerda girar tu cepillito suavemente cuando las acomodes por la mañana. Si sientes alguna molestia, me avisas sin dudarlo 🌸`,
    activo: true,
    es_default: false,
  },
  // Día 10:
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Extensiones — Ciclo de Muda Biológica (Variación A)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `¡Hola {nombre_cliente}! ✨ Paso por aquí con un dato súper importante: es normal que por estos días veas caer 2 o 3 pestañitas sueltas 👁️💫\n\n¡No te asustes! Es tu pestaña natural cumpliendo su ciclo biológico de muda. Como la extensión va adherida a tu pestaña real, cae con ella. Tu set sigue hermoso 💕`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Extensiones — Renovación Natural (Variación B)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🌸 Un tip biológico importante para estos días: nuestras pestañas naturales se renuevan solas a diario, así que si ves caer alguna con su extensión pegada, es totalmente normal.\n\n¡Nunca tires de ellas! ¿Cómo las sientes hoy? ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Extensiones — Acompañamiento & Rutina (Variación C)',
    categoria_servicio: 'Extensiones de Pestañas',
    contenido: `Hola {nombre_cliente} ✨ Llegamos al día 10 de tu set.\n\nRecuerda que la caída leve de pestañitas por día es el ciclo natural de tu cuerpo mientras pestañas nuevas van saliendo. ¡Tu mirada sigue bella! Cuéntame cómo vas sintiendo el set 💖`,
    activo: true,
    es_default: false,
  },

  // =========================================================================
  // 4. 👁️ LIFTING DE PESTAÑAS (Y ONDULACIÓN)
  // =========================================================================
  // 24h:
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Lifting — Fijación de Curva 24h (Variación A)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `¡Hola {nombre_cliente}! ✨ Qué lindo quedó tu Lifting de Pestañas ayer 🥰\n\nEl tip clave de hoy: ¡las primeras 24h son para fijar la curva! Evita mojar tus ojos, no uses rímel ni te expongas a vapor directo para que el efecto levantado te dure semanas intacto 👁️🌸`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Lifting — Cuidado al Dormir 24h (Variación B)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🌸 Paso rapidito a dejarte este secretito para tu lifting:\n\nDurante estas primeras 24 horas procura no frotarte los ojos ni dormir boca abajo aplastando las pestañas contra la almohada. ¡Así conservan su curvatura perfecta! 💕`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Lifting — Sellado de Queratina (Variación C)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🥰 Espero que te haya encantado cómo despertó tu mirada hoy.\n\nRecuerda mantenerlas secas hoy para que el tinte y la queratina sellen al 100%. ¡A presumir esa mirada abierta! ✨`,
    activo: true,
    es_default: false,
  },
  // Día 4:
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Lifting — Peinado hacia arriba (Variación A)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 👁️✨ ¿Cómo van esas pestañitas?\n\nYa puedes lavarte con total normalidad. Tip de oro: péinalas hacia arriba todas las mañanas con tu cepillito para mantenerlas bien separadas y estilizadas. ¡Se ven increíbles! 💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Lifting — Uso de Máscara de Pestañas (Variación B)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🌸 Si decides usar rímel estos días, te recomiendo que sea lavable con agua y no a prueba de agua (waterproof).\n\nAsí no tienes que frotar fuerte para desmaquillarte y proteges tu lifting. ¡Cualquier duda avísame! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Lifting — Check-in de Mirada (Variación C)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `Hola {nombre_cliente} 🥰 ¿Cómo te sientes al no tener que usar rizador por las mañanas?\n\nEs una maravilla levantarse lista. Si tienes cualquier consulta sobre cómo cuidarlas, aquí estoy para ayudarte 🌸`,
    activo: true,
    es_default: false,
  },
  // Día 10:
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Lifting — Hidratación & Keratina (Variación A)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `¡Hola {nombre_cliente}! ✨ Ya vamos 10 días con tu lifting impecable.\n\nPara que tus pestañas sigan sedosas y nutridas, puedes aplicarles una gotita de aceite de ricino o serum hidratante antes de dormir. ¡Le dará un brillo espectacular a tu mirada! 👁️💕`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Lifting — Pestañas Nuevas (Variación B)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `Hola {nombre_cliente} 🌸 A partir de estos días es normal que empiecen a nacer pestañitas nuevas con su forma natural recta.\n\nNo te preocupes, el lifting sigue activo en el resto del set. ¡Tu mirada sigue súper fresca! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Lifting — Cero Rizador Mecánico (Variación C)',
    categoria_servicio: 'Lifting de Pestañas',
    contenido: `¡Hola {nombre_cliente}! 🥰 Recordatorio cariñoso: mantén el rizador metálico guardado bien lejos.\n\nTus pestañas ya tienen su curvatura tratada y no necesitan calor ni presión mecánica. ¡Un abrazo enorme! 💖`,
    activo: true,
    es_default: false,
  },

  // =========================================================================
  // 5. 💇‍♀️ ALISADO ORGÁNICO
  // =========================================================================
  // 24h:
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Alisados — Sellado Térmico 24h (Variación A)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `¡Hola {nombre_cliente}! 🌸 Qué lindo tenerte ayer. Te dejo el tip clave de estos días:\n\nNada de ligas apretadas, moños ni ganchos por hoy para no marcar la memoria del cabello, y cuando te toque lavar, usa shampoo sin sal ni sulfatos. ¡Quedó un brillo soñado! ✨`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Alisados — No mojar 24h (Variación B)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `¡Hola {nombre_cliente}! ✨ Espero que estés amando la suavidad de tu cabello hoy.\n\nEvita mojarlo o sudar en exceso en estas primeras 24h para que los aminoácidos orgánicos sellen al 100%. ¡A lucir esa melena brillante! 💇‍♀️💖`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Alisados — Pelo tras las orejas (Variación C)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `¡Hola {nombre_cliente}! 🥰 Un detalle pequeñito pero importante para hoy:\n\nEvita ponerte el cabello detrás de las orejas de forma constante para que no se marque ninguna onda en los laterales. ¡Cualquier duda me escribes! 🌸`,
    activo: true,
    es_default: false,
  },
  // Día 4:
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Alisados — Secado Térmico (Variación A)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `¡Hola {nombre_cliente}! ✨ ¿Cómo se siente tu cabello después de su lavado?\n\nRecuerda que el aire tibio de la secadora hacia abajo es su mejor aliado: reactiva el sellado térmico y el brillo espejo en solo 5 minutos. Cuéntanos cualquier duda 💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Alisados — Cuidado con el shampoo (Variación B)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `¡Hola {nombre_cliente}! 🌸 Tip para que tu alisado te dure meses intacto:\n\nLávalo siempre con agua tibia a fría y productos libres de sal. El agua muy caliente abre la cutícula y le quita duración al tratamiento. ¡A cuidarlo mucho! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Alisados — Check-in de Brillo (Variación C)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `Hola {nombre_cliente} 🥰 Paso a ver cómo vas sintiendo la sedosidad de tu cabello esta semana.\n\n¿Verdad que peinarse en las mañanas ahora es un alivio total? Cualquier consulta sobre protectores o aceites, avísame 💕`,
    activo: true,
    es_default: false,
  },
  // Día 10:
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Alisados — Nutrición Semanal (Variación A)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `¡Hola {nombre_cliente}! 🌸 Para mantener esa nutrición profunda y suavidad como el primer día, aplícale una mascarilla hidratante una vez por semana.\n\n¡Tu cabello te lo va a agradecer y el brillo se mantendrá radiante! ✨`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Alisados — Protector Térmico (Variación B)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `Hola {nombre_cliente} ✨ Si vas a usar secadora o salir al sol fuerte, recuerda ponerte unas gotitas de serum o protector térmico en medios y puntas.\n\nBlindará tu alisado orgánico por mucho más tiempo. ¡Que tengas un lindo día! 💇‍♀️💖`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Alisados — Acompañamiento 10 Días (Variación C)',
    categoria_servicio: 'Alisado Orgánico',
    contenido: `¡Hola {nombre_cliente}! 🥰 Llegamos a los 10 días de tu tratamiento y tu cabello debe estar súper dócil y manejable.\n\nSigue mimándolo con su rutina sin sal. ¡Te mandamos un abrazo enorme desde el salón! 💕`,
    activo: true,
    es_default: false,
  },

  // =========================================================================
  // 6. 💇‍♀️ COLOR, MECHAS & RETOQUE DE RAÍZ
  // =========================================================================
  // 24h:
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Color — Fijación de Pigmento 24h (Variación A)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `¡Hola {nombre_cliente}! ✨ Qué hermoso quedó el color y el brillo de tu cabello ayer 🥰\n\nEl tip de oro de hoy: espera al menos 24 a 48h para tu primer lavado en casa. Así permites que los pigmentos se fijen profundamente en la fibra capilar 💇‍♀️🌸`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Color — Agua tibia y sin sulfatos (Variación B)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `¡Hola {nombre_cliente}! 🌸 Cuando te toque lavar tu cabello, hazlo con agua tibia a fresca y shampoo para cabello tinturado.\n\nEl agua muy caliente barre el matiz y deslava el tono mucho más rápido. ¡A lucir ese color radiante! 💕`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Color — Cuidado con el Sol (Variación C)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `¡Hola {nombre_cliente}! 🥰 Espero que estés amando cómo luce tu color hoy.\n\nSi sales al sol directo, unas gotitas de aceite capilar con filtro UV ayudarán a que el tono no se oxide ni pierda su matiz. ¡Un abrazo grande! ✨`,
    activo: true,
    es_default: false,
  },
  // Día 4:
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Color — Hidratación post-color (Variación A)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `¡Hola {nombre_cliente}! 💇‍♀️✨ ¿Cómo se siente tu cabello después de su primer lavado?\n\nTip clave: los procesos de color agradecen un shot de acondicionador nutritivo de medios a puntas para sellar las cutículas y mantener la suavidad al tacto. ¡Cualquier duda avísame! 💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Color — Protector Térmico (Variación B)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `¡Hola {nombre_cliente}! 🌸 Si vas a usar plancha o tenaza esta semana, aplica siempre protector térmico antes del calor.\n\nEl calor directo sin protección puede alterar los pigmentos del tinte. ¡A cuidar ese tono soñado! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Color — Check-in de Tono (Variación C)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `Hola {nombre_cliente} 🥰 Paso a saludarte y ver cómo vas disfrutando el nuevo tono de tu melena.\n\n¿Verdad que la luminosidad es hermosa? Si necesitas recomendación de mascarilla matizadora, avísame con gusto 💕`,
    activo: true,
    es_default: false,
  },
  // Día 10:
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Color — Mascarilla Nutritiva Semanal (Variación A)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `¡Hola {nombre_cliente}! ✨ Ya van 10 días de tu servicio de color.\n\nPara que la fibra se mantenga elástica y con movimiento, dale a tu cabello una mascarilla reparadora esta semana durante 15 minutos en el baño. ¡Verás cómo revive el brillo! 🌸💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Color — Mantenimiento de Raíz (Variación B)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `Hola {nombre_cliente} 🌸 Tu color sigue intacto y radiante.\n\nRecuerda que mantener el cabello hidratado evita las puntas abiertas y hace que el tinte dure semanas impecable. ¡Que tengas una excelente semana! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Color — Brillo & Luminosidad (Variación C)',
    categoria_servicio: 'Retoque de Raíz / Canas',
    contenido: `¡Hola {nombre_cliente}! 🥰 ¿Cómo sigue esa melena?\n\nUnas gotitas de serum en las puntas secas devuelven el brillo como recién salida de la peluquería. ¡Te mandamos un abrazo enorme desde el salón! 💕`,
    activo: true,
    es_default: false,
  },

  // =========================================================================
  // 7. ✨ LIMPIEZA FACIAL PROFUNDA & PEELINGS
  // =========================================================================
  // 24h:
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Facial — Cero Maquillaje 24h (Variación A)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `¡Hola {nombre_cliente}! ✨ Qué lindo fue consentir tu piel ayer en su sesión de limpieza profunda 🥰\n\nEl tip de oro de hoy: tus poros están limpios y oxigenándose, así que evita el maquillaje pesado y no toques tu rostro con las manos sucias durante estas 24 horas 🧖‍♀️🌸`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Facial — Bloqueador Solar Obligatorio (Variación B)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `¡Hola {nombre_cliente}! 🌸 Paso a dejarte una regla fundamental para hoy:\n\nTu piel está renovada y más sensible a la luz, así que el bloqueador solar es tu mejor amigo. Aplícalo aunque estés en casa o frente a pantallas. ¡A cuidar ese glow natural! 💕`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_24h',
    tiempo: 'tiempo_1',
    titulo: 'Facial — Cero Ejercicio Intenso / Sauna (Variación C)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `¡Hola {nombre_cliente}! 🥰 Espero que hayas descansado súper bien.\n\nEvita saunas, vapor caliente o ejercicio muy intenso por el día de hoy para que la piel no se irrite con el sudor. ¡Cualquier duda me escribes con confianza! ✨`,
    activo: true,
    es_default: false,
  },
  // Día 4:
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Facial — Hidratación profunda (Variación A)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `¡Hola {nombre_cliente}! 🌸 ¿Cómo vas sintiendo la textura de tu piel estos días?\n\nYa debe sentirse súper suave y libre de impurezas. Tip clave: refuerza tu crema hidratante mañana y noche; una piel hidratada produce menos grasita y se mantiene limpia por más tiempo ✨💖`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Facial — Absorción de Serums (Variación B)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `¡Hola {nombre_cliente}! ✨ Ahora que tus poros están 100% descongestionados, tus serums de vitamina C o ácido hialurónico se absorben el doble de mejor.\n\n¡Es el mejor momento para aprovecharlos al máximo! Cuéntame cómo vas sintiendo tu rostro 💕`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia4',
    tiempo: 'tiempo_2',
    titulo: 'Facial — Check-in de Luminosidad (Variación C)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `Hola {nombre_cliente} 🥰 Paso a saludarte. ¿Verdad que la piel se siente liviana y descansada?\n\nRecuerda tomar suficiente agüita durante el día para mantener la hidratación desde adentro. ¡Que tengas un día hermoso! 🌸`,
    activo: true,
    es_default: false,
  },
  // Día 10:
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Facial — Regeneración Celular (Variación A)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `¡Hola {nombre_cliente}! ✨ Llegamos a los 10 días de tu facial y tu piel está en su punto máximo de luminosidad.\n\nSigue constante con tu limpieza nocturna y protector solar para que los poros sigan cerrados y perfectos. ¡Un abrazo grande! 🧖‍♀️💕`,
    activo: true,
    es_default: true,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Facial — No Exfoliar Fuerte (Variación B)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `Hola {nombre_cliente} 🌸 Un recordatorio importante: no necesitas usar exfoliantes agresivos con gránulos en casa.\n\nTu barrera cutánea sigue equilibrada del tratamiento en cabina. ¡Sigue disfrutando esa piel de terciopelo! ✨`,
    activo: true,
    es_default: false,
  },
  {
    flujo: 'cuidados_dia10',
    tiempo: 'tiempo_3',
    titulo: 'Facial — Acompañamiento Skincare (Variación C)',
    categoria_servicio: 'Limpieza Facial Profunda',
    contenido: `¡Hola {nombre_cliente}! 🥰 ¿Cómo sigue tu piel hoy?\n\nNos encanta acompañarte en el cuidado de tu rostro. Si tienes cualquier consulta sobre tu rutina de skincare, escríbenos con total confianza 💖`,
    activo: true,
    es_default: false,
  },
];

async function run() {
  console.log('Iniciando despliegue de plantillas ultra específicas de Cuidados Post-Servicio...');

  // 1. Limpiar flujos de cuidados existentes
  const flujosCuidados = ['cuidados_24h', 'cuidados_dia4', 'cuidados_dia10'];

  await supabase.from('plantillas_automatizacion_globales').delete().in('flujo', flujosCuidados);
  await supabase.from('plantillas_automatizacion').delete().in('flujo', flujosCuidados);

  // 2. Insertar las maestras globales
  const { data: inserted, error: insErr } = await supabase
    .from('plantillas_automatizacion_globales')
    .insert(PLANTILLAS_CUIDADOS)
    .select('id, titulo, flujo, categoria_servicio');

  if (insErr) {
    console.error('Error insertando globales de cuidados:', insErr);
    process.exit(1);
  }

  console.log(`✅ ${inserted.length} plantillas maestras globales de cuidados creadas.`);
}

run();
