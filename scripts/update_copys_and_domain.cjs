const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

const nuevasTarjetas = [
  {
    "sello": 1,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 1 • ¡Bienvenida al Club Glow!",
    "copy_sugerido": "¡Bienvenida al Club {salon}, {nombre}! 🎁\n\nTe regalamos 1 sello de bienvenida y sumaste el de hoy: ¡ya tienes tus primeros *{sello_actual} de 12 sellos*! ✨\n\n🎯 Tu primer regalo está muy cerca: *{premio_proximo}*.\n\n📲 *Conoce tus premios y tarjeta:* {link_tarjeta}",
    "titulo_notificacion": "✨ ¡Bienvenida al Club!"
  },
  {
    "sello": 2,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 2 • Constancia & Brillo",
    "copy_sugerido": "¡Qué lindo consentirte hoy, {nombre}! 💕\n\nSumaste otro sellito y ya tienes *{sello_actual} de 12*.\n\nCada visita te deja más bella y más cerca de tu regalo 🌸",
    "titulo_notificacion": "💕 Sello 2 sumado"
  },
  {
    "sello": 3,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 3 • A un paso de la Meta 1",
    "copy_sugerido": "¡Estás a un solo pasito, {nombre}! 🌸\n\nHoy sumaste tu *sello 3 de 12*.\n\nEn tu próxima visita desbloqueas tu primer regalo: *{premio_proximo}* 🎁\n\n📲 *Mira qué poquito te falta:* {link_tarjeta}",
    "titulo_notificacion": "🌸 ¡A 1 paso de tu regalo!"
  },
  {
    "sello": 4,
    "es_premio": true,
    "imagen_url": "https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_4.jpg",
    "nombre_hito": "Sello 4 🎁 META 1: Primer Mimo Desbloqueado",
    "copy_sugerido": "¡Lo lograste, {nombre}! 🎉👑\n\nLlegaste al *sello 4 de 12* y ganaste tu:\n🎁 *{premio_proximo}*\n\n🎟️ Tu código de canje: `{codigo}`\n*(Muéstralo en recepción al visitarnos)*\n\n📲 *Ver tu tarjeta digital:* {link_tarjeta}",
    "titulo_notificacion": "🎉 ¡Primer Regalo Desbloqueado!"
  },
  {
    "sello": 5,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 5 • Nivel Plata Consolidado",
    "copy_sugerido": "¡Empezamos la siguiente meta con todo, {nombre}! ✨\n\nSumaste otro sellito a tu tarjeta y ya llevas *{sello_actual} de 12*.\n\nPróximo objetivo VIP: *{premio_proximo}* 💎",
    "titulo_notificacion": "✨ Sumaste otro sello"
  },
  {
    "sello": 6,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 6 • Mitad de Camino",
    "copy_sugerido": "¡Llegaste a la mitad del camino, {nombre}! 💖\n\nYa tienes *{sello_actual} de 12 sellos* acumulados.\n\nTu constancia se nota y nos encanta cuidarte ✨",
    "titulo_notificacion": "💖 Mitad de camino cumplida"
  },
  {
    "sello": 7,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 7 • A un paso de la Meta 2",
    "copy_sugerido": "¡A solo una visita de tu segundo premio, {nombre}! 🌸\n\nSumaste tu *sello 7 de 12*.\n\nEn tu próxima cita te llevas: *{premio_proximo}* 🎁\n\n📲 *Mira tu tarjeta casi lista:* {link_tarjeta}",
    "titulo_notificacion": "🌸 ¡A 1 paso de tu Meta 8!"
  },
  {
    "sello": 8,
    "es_premio": true,
    "imagen_url": "https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_8.jpg",
    "nombre_hito": "Sello 8 🎁 META 2: Tratamiento VIP Desbloqueado",
    "copy_sugerido": "¡Qué gran momento, {nombre}! 🥂💎\n\nDesbloqueaste tu *sello 8 de 12* y ganaste:\n🎁 *{premio_proximo}*\n\n🎟️ Código exclusivo: `{codigo}`\n\nEntras a la recta final por la Gran Corona VIP 👑\n\n📲 *Ver tu tarjeta:* {link_tarjeta}",
    "titulo_notificacion": "🎉 ¡Segundo Regalo Desbloqueado!"
  },
  {
    "sello": 9,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 9 • Nivel Glow Diamond",
    "copy_sugerido": "¡Bienvenida a la recta final, {nombre}! ✨\n\nSumaste tu *sello 9 de 12*.\n\nSolo 3 visitas te separan del premio máximo del salón 👑",
    "titulo_notificacion": "✨ Recta final"
  },
  {
    "sello": 10,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 10 • Clienta Embajadora",
    "copy_sugerido": "¡Eres de nuestras clientas más especiales, {nombre}! 💕\n\nYa tienes *{sello_actual} de 12 sellos*.\n\nEstás a punto de coronar tu tarjeta completa 🌟",
    "titulo_notificacion": "💕 10 sellos acumulados"
  },
  {
    "sello": 11,
    "es_premio": false,
    "imagen_url": "",
    "nombre_hito": "Sello 11 • A 1 Sello de la Corona Final",
    "copy_sugerido": "¡Solo una visita más y coronas, {nombre}! 👑✨\n\nTienes *11 de 12 sellos*.\n\nEn tu próxima visita completas la tarjeta y el premio mayor es todo tuyo 🎁\n\n📲 *Tu tarjeta a punto de brillar:* {link_tarjeta}",
    "titulo_notificacion": "👑 ¡A 1 paso de la Gran Corona!"
  },
  {
    "sello": 12,
    "es_premio": true,
    "imagen_url": "https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_12.jpg",
    "nombre_hito": "Sello 12 👑 META 3 FINAL: Tarjeta Dorada Coronada",
    "copy_sugerido": "¡CORONASTE LA TARJETA COMPLETA, {nombre}! 🏆👑🎉\n\nLlegaste al *sello 12 de 12* y ganaste tu:\n🎁 *{premio_proximo}*\n\n🎟️ Tu código de canje máximo: `{codigo}`\n\n🌟 Como premio a tu lealtad, tu nueva tarjeta ya inicia con *2 sellos de regalo* ✨\n\n📲 *Ver tu tarjeta dorada:* {link_tarjeta}",
    "titulo_notificacion": "🏆 ¡TARJETA 100% COMPLETADA!"
  }
];

async function updateAll() {
  await client.connect();

  // 1. Actualizar nilah_config con los nuevos copys
  await client.query(`UPDATE nilah_config SET tarjetas_club_glow = $1;`, [JSON.stringify(nuevasTarjetas)]);
  console.log('✅ nilah_config.tarjetas_club_glow actualizado!');

  // 2. Actualizar rutinas en postgres para usar https://koratflow.agency/club/
  const fns = ['fn_procesar_calificacion_cliente', 'procesar_respuesta_calificacion_fidelizacion', 'simular_respuesta_tiempo2_fidelizacion'];
  for (const fn of fns) {
    const res = await client.query(`SELECT pg_get_functiondef(p.oid) as def FROM pg_proc p WHERE p.proname = $1;`, [fn]);
    if (res.rows[0]) {
      let def = res.rows[0].def;
      if (def.includes('app.koratflow.com')) {
        def = def.replace(/app\.koratflow\.com/g, 'koratflow.agency');
        await client.query(def);
        console.log(`✅ ${fn} actualizado con koratflow.agency`);
      }
    }
  }

  await client.end();
}

updateAll().catch(console.error);
