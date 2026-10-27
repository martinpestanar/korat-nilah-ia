const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  // 1. Desactivar aceleradores de monto alto y fijar max 1 sello por visita en sellos_config
  await client.query(`
    UPDATE public.sellos_config
    SET max_sellos_por_visita = 1,
        acelerador_ticket_alto = false,
        acelerador_martes = false,
        updated_at = now()
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('sellos_config actualizado: max_sellos_por_visita = 1, acelerador_ticket_alto = false.');

  // 2. Modificar fn_registrar_sello_visita para que no otorgue sellos dobles por ticket alto
  // Revisamos si fn_registrar_sello_visita tiene el tope estricto de v_config.max_sellos_por_visita
  // y que no multiplique si ticket_alto está inactivo.

  // 3. Mejorar los copys en nilah_config agregando la despedida afectuosa con {nombre}
  const res = await client.query('SELECT copys_calificacion_sellos FROM public.nilah_config LIMIT 1;');
  let copys = res.rows[0].copys_calificacion_sellos;

  const despedidas = [
    '¡Que tengas un día maravilloso y radiante, {nombre}! ✨🌸',
    '¡Te mandamos un abrazo inmenso y que sigas teniendo un lindo día, {nombre}! 💖✨',
    '¡Disfruta mucho tu día y te esperamos pronto, {nombre}! 💕🌸',
    '¡Que tengas un hermoso y bendecido día, {nombre}! 🌸✨'
  ];

  copys = copys.map((c, idx) => {
    let despedida = despedidas[idx % despedidas.length];
    // Asegurar que el copy 2 (bienvenida especial) tenga la despedida
    if (!c.copy.includes('lindo día') && !c.copy.includes('día maravilloso') && !c.copy.includes('hermoso')) {
      c.copy = c.copy.trim() + '\n\n' + despedida;
    }
    return c;
  });

  await client.query('UPDATE public.nilah_config SET copys_calificacion_sellos = $1;', [JSON.stringify(copys)]);
  console.log('Copys en nilah_config actualizados con despedida personalizada {nombre}.');

  await client.end();
}

main().catch(console.error);
