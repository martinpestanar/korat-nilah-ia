const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, business_id, cliente_id, cita_id, telefono, flujo, mensaje, estado, proximo_intento_at, created_at
    FROM cola_mensajes_salientes
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
      AND cliente_id = 2249
    ORDER BY id DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
