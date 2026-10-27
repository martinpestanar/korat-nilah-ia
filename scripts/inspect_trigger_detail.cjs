const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT proname, pg_get_functiondef(oid) as def 
    FROM pg_proc 
    WHERE proname IN ('trg_fn_procesar_feedback_fidelizacion', 'procesar_respuesta_calificacion_fidelizacion')
  `);
  for (const row of res.rows) {
    console.log('=== FUNCTION:', row.proname, '===');
    console.log(row.def);
  }
  await client.end();
}
run().catch(console.error);
