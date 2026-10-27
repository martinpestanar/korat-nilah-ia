const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT copys_calificacion_sellos FROM nilah_config LIMIT 1');
  console.log(JSON.stringify(res.rows[0], null, 2));
  await client.end();
}
run().catch(console.error);
