const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const fn = await client.query(`
    SELECT proname, pg_get_function_arguments(oid) as args 
    FROM pg_proc WHERE proname = 'simular_respuesta_tiempo2_fidelizacion'
  `);
  console.log(fn.rows);

  await client.end();
}
run().catch(e => console.error(e.message));
