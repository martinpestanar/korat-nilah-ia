const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT proname 
    FROM pg_proc 
    WHERE prosrc ILIKE '%encuesta_enviada%'
  `);
  console.log('Functions referencing encuesta_enviada:', res.rows.map(r => r.proname));
  await client.end();
}
run().catch(console.error);
