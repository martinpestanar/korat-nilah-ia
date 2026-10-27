const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT routine_name, routine_definition 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'trg_fn_procesar_feedback_fidelizacion';
  `);
  console.log('=== ROUTINE: trg_fn_procesar_feedback_fidelizacion ===');
  console.log(res.rows[0]?.routine_definition);

  await client.end();
}

run().catch(console.error);
