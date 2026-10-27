const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  const res = await client.query(`
    SELECT routine_name, routine_definition 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'simular_respuesta_tiempo2_fidelizacion';
  `);
  console.log('=== ROUTINE: simular_respuesta_tiempo2_fidelizacion ===');
  console.log(res.rows[0]?.routine_definition);

  await client.end();
}

run().catch(console.error);
