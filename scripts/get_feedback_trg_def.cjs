const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  const f = await client.query("SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'trg_fn_procesar_feedback_fidelizacion'");
  console.log(f.rows[0].def);
  await client.end();
}
run();
