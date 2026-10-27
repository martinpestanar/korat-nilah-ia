const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkInstances2() {
  await client.connect();
  const r = await client.query(`SELECT * FROM instancias_evolution`);
  console.log('Instancias:', r.rows);
  await client.end();
}
checkInstances2().catch(console.error);
