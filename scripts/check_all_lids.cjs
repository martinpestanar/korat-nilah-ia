const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, nombre, telefono, business_id
    FROM "Clientes"
    WHERE length(regexp_replace(telefono, '\\D', '', 'g')) > 13
  `);
  console.log('LID clients found:', res.rows);
  await client.end();
}
run().catch(console.error);
