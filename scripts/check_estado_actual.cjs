const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  // Check cita 1378
  const cita = await client.query('SELECT id, calificacion, feedback_cliente, encuesta_enviada, staff_id FROM "Citas" WHERE id = 1378');
  console.log('\n=== CITA 1378 ===');
  console.log(JSON.stringify(cita.rows[0], null, 2));

  // Check sellos de cliente 2228
  const sellos = await client.query('SELECT cliente_id, sellos_actuales, sellos_acumulados_historico, negocio_id FROM sellos_config WHERE cliente_id = 2228');
  console.log('\n=== SELLOS CONFIG CLIENTE 2228 ===');
  console.log(JSON.stringify(sellos.rows[0], null, 2));

  // Ultimos movimientos de sellos
  const movs = await client.query('SELECT id, tipo, cantidad, motivo, created_at FROM sellos_movimientos WHERE cliente_id = 2228 ORDER BY created_at DESC LIMIT 5');
  console.log('\n=== ULTIMOS MOVIMIENTOS SELLOS ===');
  console.log(JSON.stringify(movs.rows, null, 2));

  // Recent messages for this client
  const msgs = await client.query(`
    SELECT id, direccion, left(contenido, 100) as contenido_short, created_at 
    FROM mensajes 
    WHERE cliente_id = 2228 
    ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\n=== ULTIMOS MENSAJES CLIENTE 2228 ===');
  console.log(JSON.stringify(msgs.rows, null, 2));

  // Check trigger exists
  const trigger = await client.query(`
    SELECT tgname, tgenabled FROM pg_trigger 
    WHERE tgname = 'trg_procesar_feedback_fidelizacion'
  `);
  console.log('\n=== TRIGGER STATUS ===');
  console.log(JSON.stringify(trigger.rows, null, 2));

  await client.end();
}
run().catch(e => console.error('ERROR:', e.message));
