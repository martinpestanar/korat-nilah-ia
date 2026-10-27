const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  // sellos_config usa business_id (no negocio_id), y NO tiene cliente_id
  // sellos_movimientos usa business_id y cliente_id

  // Check sellos_config para negocio Glamour
  const sc = await client.query(`SELECT * FROM sellos_config WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'`);
  console.log('\n=== SELLOS CONFIG GLAMOUR ===');
  console.log(JSON.stringify(sc.rows, null, 2));

  // Check sellos_movimientos recientes
  const movs = await client.query(`
    SELECT * FROM sellos_movimientos 
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\n=== ULTIMOS MOVIMIENTOS GLAMOUR ===');
  console.log(JSON.stringify(movs.rows, null, 2));

  // Sellos del cliente 2228
  const movs2228 = await client.query(`
    SELECT * FROM sellos_movimientos WHERE cliente_id = 2228 ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\n=== MOVIMIENTOS CLIENTE 2228 ===');
  console.log(JSON.stringify(movs2228.rows, null, 2));

  // Total sellos acumulados para cliente 2228
  const total = await client.query(`SELECT SUM(cantidad) as total FROM sellos_movimientos WHERE cliente_id = 2228`);
  console.log('\n=== TOTAL SELLOS CLIENTE 2228 ===', total.rows[0]);

  // Recent messages for cliente 2228
  const msgs = await client.query(`
    SELECT id, direccion, left(contenido, 120) as c, created_at 
    FROM mensajes WHERE cliente_id = 2228 
    ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\n=== MENSAJES CLIENTE 2228 ===');
  msgs.rows.forEach(r => console.log(`[${r.direccion}] ${r.created_at}: ${r.c}`));

  // Check nilah_config
  const nilah = await client.query(`
    SELECT jsonb_array_length(tarjetas_club_glow) as total_tarjetas,
           tarjetas_club_glow->0 as primer_sello,
           tarjetas_club_glow->11 as ultimo_sello
    FROM nilah_config LIMIT 1
  `);
  console.log('\n=== NILAH CONFIG TARJETAS ===');
  console.log(JSON.stringify(nilah.rows[0], null, 2));

  // Check modo_fidelizacion Glamour
  const negocio = await client.query(`
    SELECT nombre, modo_fidelizacion, recursos_saas->>'sellos_addons' as sellos_addons
    FROM negocios WHERE id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
  `);
  console.log('\n=== NEGOCIO GLAMOUR ===');
  console.log(JSON.stringify(negocio.rows[0], null, 2));

  // Triggers
  const t = await client.query(`
    SELECT tgname, tgenabled FROM pg_trigger 
    WHERE tgname IN ('trg_procesar_feedback_fidelizacion','trg_cita_calificada_sellos')
  `);
  console.log('\n=== TRIGGERS ===');
  console.log(JSON.stringify(t.rows, null, 2));

  await client.end();
}
run().catch(e => console.error('ERROR:', e.message, e.stack));
