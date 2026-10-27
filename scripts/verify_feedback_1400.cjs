const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const cRes = await client.query('SELECT id, servicio, calificacion, feedback_cliente, updated_at FROM "Citas" WHERE id = 1400');
  console.log('CITA 1400:', JSON.stringify(cRes.rows[0], null, 2));

  const mRes = await client.query('SELECT contenido, direccion, created_at FROM mensajes WHERE cliente_id = 2249 ORDER BY created_at DESC LIMIT 4');
  console.log('ULTIMOS MENSAJES:', JSON.stringify(mRes.rows, null, 2));

  await client.end();
}
run().catch(console.error);
