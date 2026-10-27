const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

const nuevasPlantillas = [
  {
    sello: 1,
    etapa: "Apertura / Sello 1 (Sin Bienvenida)",
    descripcion: "Para cuando la clienta califica y acumula su primer sello.",
    copy: `¡Mil gracias por tu calificación, {nombre}! 🥰✨

Sumaste tu *sello 1 de 12* en tu *Club Glow* 👑
🎯 Próximo objetivo: *{premio_proximo}* 🌸

📲 *Tu tarjeta en vivo:* {link_tarjeta}

¡Que tengas un lindo día! 💖`
  },
  {
    sello: 2,
    etapa: "Apertura Especial (Bienvenida Activa = 2 de 12)",
    descripcion: "Se envía automáticamente cuando el salón tiene activo el Sello de Bienvenida (1 regalo + 1 cita).",
    copy: `¡Muchísimas gracias por tu nota, {nombre}! 🥰✨

Te regalamos *1 sello de bienvenida* + el de tu visita de hoy: ¡ya arrancas con *2 de 12 sellos* en tu *Club Glow*! 👑🎁

🎯 A solo 2 sellos de tu primer regalo: *{premio_1}* 🌸

📲 *Tu tarjeta en vivo:* {link_tarjeta}

¡Que tengas un lindo día! 💖`
  },
  {
    sello: 3,
    etapa: "Sello 3 • A 1 paso de la Meta 1",
    descripcion: "Crea anticipación y urgencia antes del primer premio.",
    copy: `¡Qué linda nota, mil gracias {nombre}! 💖✨

¡Ojo! Con el sellito de hoy llegaste a *3 de 12*... ¡y estás a *solo 1 visita* de tu primer regalo: *{premio_proximo}*! 🎁🎉

📲 *Revisa tu tarjeta casi lista:* {link_tarjeta}

¡Que tengas un hermoso día! 🌸`
  },
  {
    sello: 4,
    etapa: "Sello 4 🎁 META 1: Primer Mimo Desbloqueado",
    descripcion: "Celebración y entrega del cupón del primer regalo.",
    copy: `¡Sii, qué alegría leerte, {nombre}! Y las buenas noticias siguen... 👑🥂

¡Desbloqueaste tu primer regalo del Club Glow! 🎉
🎁 *Regalo:* {premio_proximo}
🎟️ *Código de canje:* \`{codigo}\`
*(Muéstralo en recepción en tu próxima visita)*.

📲 *Tu premio guardado en tu tarjeta:* {link_tarjeta}

¡Disfruta mucho tu día! 💖`
  },
  {
    sello: 5,
    etapa: "Sello 5 • Inicio Meta 2",
    descripcion: "Motivación tras reclamar la primera meta.",
    copy: `¡Muchas gracias por tu calificación, {nombre}! 💖

¡Sellito 5 de 12 acreditado! ✨ Arrancamos el camino hacia tu segundo regalo VIP.
🎯 Próximo objetivo: *{premio_proximo}* 💎

📲 *Tu tarjeta en vivo:* {link_tarjeta}

¡Que tengas un lindo día! 🌸`
  },
  {
    sello: 6,
    etapa: "Sello 6 • Mitad de Camino",
    descripcion: "Reconocimiento a la fidelidad al llegar a la mitad.",
    copy: `¡Mil gracias por tu calificación, {nombre}! 💕

¡Llegaste a la mitad del camino! Ya tienes *6 de 12 sellos* acumulados ✨
🎯 A solo 2 visitas de tu siguiente regalo: *{premio_proximo}* 🌸

📲 *Mira tu avance:* {link_tarjeta}

¡Te mandamos un abrazo y lindo día! 💖`
  },
  {
    sello: 7,
    etapa: "Sello 7 • A 1 paso de la Meta 2",
    descripcion: "Anticipación para el segundo premio.",
    copy: `¡Qué linda calificación, mil gracias {nombre}! 💖

¡Sellito acreditado! Ya tienes *7 de 12 sellos*... ¡y estás a *solo 1 visita* de tu segundo regalo: *{premio_proximo}*! 🎁✨

📲 *Tu tarjeta casi lista:* {link_tarjeta}

¡Que tengas un día maravilloso! 🌸`
  },
  {
    sello: 8,
    etapa: "Sello 8 🎁 META 2: Tratamiento VIP Desbloqueado",
    descripcion: "Entrega del segundo premio mayor.",
    copy: `¡Qué felicidad, {nombre}! Y hoy te vas con premio... 🥂✨

¡Desbloqueaste tu segundo regalo VIP del Club Glow! 👑
🎁 *Premio:* {premio_proximo}
🎟️ *Código:* \`{codigo}\`

¡Entras a la recta final por la Gran Corona! 🌟
📲 *Ver tarjeta con premio:* {link_tarjeta}

¡Disfruta tu día al máximo! 💖`
  },
  {
    sello: 9,
    etapa: "Sello 9 • Nivel Glow Diamond",
    descripcion: "Inicio de la recta final de la tarjeta.",
    copy: `¡Muchas gracias por tu nota, {nombre}! 💖

Sumaste tu *sello 9 de 12* ✨ ¡Ya estás en la recta final!
🎯 Solo 3 citas te separan del premio máximo: *{premio_proximo}* 👑

📲 *Revisa tu progreso:* {link_tarjeta}

¡Que tengas un lindo día! 🌸`
  },
  {
    sello: 10,
    etapa: "Sello 10 • Clienta Embajadora",
    descripcion: "Sentido de pertenencia y exclusividad.",
    copy: `¡Mil gracias por tu calificación, {nombre}! 🥰

¡Ya tienes *10 de 12 sellos*! Estás a solo 2 visitas de la Gran Corona VIP 👑✨
🎯 Próxima meta: *{premio_proximo}* 🌟

📲 *Tu tarjeta dorada:* {link_tarjeta}

¡Que sigas teniendo un lindo día! 💖`
  },
  {
    sello: 11,
    etapa: "Sello 11 • A 1 Sello de la Gran Corona",
    descripcion: "Máxima urgencia dopamínica antes de coronar.",
    copy: `¡Ayy, qué alegría leerte, {nombre}! 💕

👑 ¡SOLO TE FALTA 1 SELLO! Ya tienes *11 de 12 sellos*.
En tu próxima visita completas la tarjeta y te llevas el Gran Premio: *{premio_proximo}* 🏆🎁

📲 *Tu tarjeta a punto de coronar:* {link_tarjeta}

¡Que tengas un día radiante! ✨🌸`
  },
  {
    sello: 12,
    etapa: "Sello 12 👑 META 3 FINAL: Tarjeta Dorada Coronada",
    descripcion: "La graduación de oro: celebración final y renovación con ventaja.",
    copy: `¡Qué felicidad tan grande, {nombre}! 🏆👑🎉

¡CORONASTE LA TARJETA COMPLETA DEL CLUB GLOW (12 de 12)! ✨
🎁 *Gran Regalo Reina:* {premio_proximo}
🎟️ *Código exclusivo:* \`{codigo}\`

¡Gracias por tu lealtad infinita! 💖
📲 *Mira tu tarjeta coronada:* {link_tarjeta}

¡Que tengas un día inolvidable! 👑✨`
  }
];

async function main() {
  await client.connect();

  await client.query(`
    UPDATE public.nilah_config
    SET copys_calificacion_sellos = $1;
  `, [JSON.stringify(nuevasPlantillas)]);

  console.log('Todas las plantillas (sellos 1 al 12) actualizadas con estilo corto y dinámico.');
  await client.end();
}

main().catch(console.error);
