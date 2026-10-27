const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkEvolutionInstances() {
  await client.connect();

  const r = await client.query(`
    SELECT id, business_id, instance_name, status, phone_number, server_url
    FROM instancias_evolution
  `);
  console.log('Instancias evolution configuradas:');
  console.log(r.rows);

  await client.end();
}
checkEvolutionInstances().catch(console.error);
