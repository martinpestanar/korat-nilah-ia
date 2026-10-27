const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  // Get trigger function body
  const fn = await client.query(`
    SELECT proname, prosrc FROM pg_proc 
    WHERE proname = 'trg_fn_procesar_feedback_fidelizacion'
  `);
  if (fn.rows.length) {
    console.log('\n=== TRIGGER FUNCTION BODY ===');
    console.log(fn.rows[0].prosrc);
  } else {
    console.log('TRIGGER FUNCTION NOT FOUND');
  }

  // Also get procesar_respuesta_calificacion_fidelizacion
  const fn2 = await client.query(`
    SELECT proname, prosrc FROM pg_proc 
    WHERE proname = 'procesar_respuesta_calificacion_fidelizacion'
    LIMIT 1
  `);
  if (fn2.rows.length) {
    console.log('\n=== PROCESAR_RESPUESTA_CALIFICACION BODY (first 3000 chars) ===');
    console.log(fn2.rows[0].prosrc.substring(0, 3000));
  }

  // Check mensajes table columns
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'mensajes' ORDER BY ordinal_position
  `);
  console.log('\n=== MENSAJES COLUMNAS ===');
  cols.rows.forEach(r => console.log(r.column_name, '-', r.data_type));

  await client.end();
}
run().catch(e => console.error('ERROR:', e.message));
