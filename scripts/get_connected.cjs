const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function getConnected() {
  await client.connect();
  const r = await client.query(`
    SELECT ie.instance_name, ie.status, n.nombre, n.slug, n.id as business_id
    FROM instancias_evolution ie
    JOIN negocios n ON n.id = ie.business_id
    WHERE ie.status = 'conectado'
  `);
  console.log('Instancias actualmente conectadas:', r.rows);
  await client.end();
}
getConnected().catch(console.error);
