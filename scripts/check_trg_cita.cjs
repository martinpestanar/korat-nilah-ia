const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const fn = await client.query(`
    SELECT prosrc FROM pg_proc 
    WHERE proname = 'fn_procesar_calificacion_cliente'
    LIMIT 1
  `);
  if (fn.rows.length) {
    console.log('\n=== FN_PROCESAR_CALIFICACION_CLIENTE ===');
    console.log(fn.rows[0].prosrc);
  } else {
    console.log('fn_procesar_calificacion_cliente not found');
  }

  // Also check trigger trg_cita_calificada_sellos definition
  const trg = await client.query(`
    SELECT p.proname, p.prosrc
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgname = 'trg_cita_calificada_sellos'
  `);
  if (trg.rows.length) {
    console.log('\n=== TRIGGER CITA CALIFICADA FUNC ===');
    console.log(trg.rows[0].proname, '\n', trg.rows[0].prosrc);
  }

  await client.end();
}
run().catch(e => console.error(e.message));
