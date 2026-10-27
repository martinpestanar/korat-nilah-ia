const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('--- ULTIMOS MENSAJES ---');
  const mRes = await client.query(`
    SELECT id, cliente_id, business_id, direccion, contenido, created_at
    FROM mensajes
    ORDER BY created_at DESC
    LIMIT 6
  `);
  console.log(JSON.stringify(mRes.rows, null, 2));

  console.log('--- CITA 1401 ---');
  const cRes = await client.query('SELECT * FROM "Citas" WHERE id = 1401');
  console.log(JSON.stringify(cRes.rows[0], null, 2));

  console.log('--- COLA MENSAJES SALIENTES ---');
  const colaRes = await client.query(`
    SELECT id, cita_id, flujo, estado, error_mensaje, media_url, created_at
    FROM cola_mensajes_salientes
    WHERE cita_id = 1401
    ORDER BY id DESC
  `);
  console.log(JSON.stringify(colaRes.rows, null, 2));

  await client.end();
}
run().catch(console.error);
