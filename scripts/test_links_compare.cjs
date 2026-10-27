const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- TEST: Sello 5 (Debe salir SIN link) ---');
  // Sello 5 en simular_respuesta_tiempo2_fidelizacion
  const res5 = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      p_business_id => '4b004ede-64e0-4f30-84fd-190a17b369eb'::uuid,
      p_telefono_cliente => '51926285289',
      p_nota => '5',
      p_nombre_cliente => 'Valeria'
    ) as result
  `);
  // Simulando que tiene 4 sellos y suma 1 -> llega a 5
  const nilah = await client.query(`SELECT tarjetas_club_glow FROM nilah_config LIMIT 1`);
  const s5 = nilah.rows[0].tarjetas_club_glow.find(t => t.sello === 5);
  console.log('Template Sello 5 tiene link?:', s5.copy_sugerido.includes('{link_tarjeta}'));
  console.log('Copy Sello 5:\n', s5.copy_sugerido.replace('{nombre}', 'Valeria'));

  console.log('\n--- TEST: Sello 7 (Debe salir CON link) ---');
  const s7 = nilah.rows[0].tarjetas_club_glow.find(t => t.sello === 7);
  console.log('Template Sello 7 tiene link?:', s7.copy_sugerido.includes('{link_tarjeta}'));
  console.log('Copy Sello 7:\n', s7.copy_sugerido.replace('{nombre}', 'Valeria').replace('{link_tarjeta}', 'https://app.koratflow.com/club/glamour-y-capricho?c=2228'));

  await client.end();
}
run().catch(e => console.error(e.message));
