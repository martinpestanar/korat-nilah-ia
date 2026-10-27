const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT DISTINCT flujo, tiempo, count(*) 
    FROM plantillas_automatizacion 
    GROUP BY flujo, tiempo 
    ORDER BY flujo;
  `);
  console.log('Flujos en plantillas_automatizacion:', res.rows);

  await client.end();
}

run().catch(console.error);
