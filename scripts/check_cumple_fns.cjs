const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const fns = await client.query(`
    SELECT proname FROM pg_proc 
    WHERE proname LIKE '%cumple%' OR proname LIKE '%autopilot%'
  `);
  console.log('Funciones autopilot / cumple:', fns.rows.map(r => r.proname));

  await client.end();
}
run().catch(e => console.error(e.message));
