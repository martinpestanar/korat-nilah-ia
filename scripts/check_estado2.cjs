const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  // Check columnas de sellos_config
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'sellos_config' ORDER BY ordinal_position
  `);
  console.log('\n=== SELLOS_CONFIG COLUMNAS ===');
  cols.rows.forEach(r => console.log(r.column_name, '-', r.data_type));

  // Check columnas de sellos_movimientos
  const cols2 = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'sellos_movimientos' ORDER BY ordinal_position
  `);
  console.log('\n=== SELLOS_MOVIMIENTOS COLUMNAS ===');
  cols2.rows.forEach(r => console.log(r.column_name, '-', r.data_type));

  // Check sellos_config para negocio Glamour
  const sc = await client.query(`SELECT * FROM sellos_config WHERE negocio_id = '4b004ede-64e0-4f30-84fd-190a17b369eb' LIMIT 3`);
  console.log('\n=== SELLOS CONFIG GLAMOUR ===');
  console.log(JSON.stringify(sc.rows, null, 2));

  // Check sellos_movimientos recientes para negocio Glamour
  const movs = await client.query(`
    SELECT * FROM sellos_movimientos 
    WHERE negocio_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\n=== ULTIMOS MOVIMIENTOS GLAMOUR ===');
  console.log(JSON.stringify(movs.rows, null, 2));

  // Recent messages for cliente 2228
  const msgs = await client.query(`
    SELECT id, direccion, left(contenido, 120) as c, created_at 
    FROM mensajes WHERE cliente_id = 2228 
    ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\n=== MENSAJES CLIENTE 2228 ===');
  console.log(JSON.stringify(msgs.rows, null, 2));

  // Trigger check
  const t = await client.query(`
    SELECT tgname, tgenabled FROM pg_trigger 
    WHERE tgname IN ('trg_procesar_feedback_fidelizacion','trg_cita_calificada_sellos')
  `);
  console.log('\n=== TRIGGERS ===');
  console.log(JSON.stringify(t.rows, null, 2));

  await client.end();
}
run().catch(e => console.error('ERROR:', e.message));
