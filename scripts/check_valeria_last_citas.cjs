const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkCitas() {
  await client.connect();
  const r = await client.query(`SELECT id, servicio, precio, estado, calificacion, created_at FROM "Citas" WHERE cliente_id = 2228 ORDER BY id DESC LIMIT 3;`);
  console.log('Citas Valeria:', r.rows);
  await client.end();
}
checkCitas().catch(console.error);
