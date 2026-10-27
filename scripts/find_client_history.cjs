const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- CITA 1404 ---');
  const c1404 = await client.query('SELECT calificacion, feedback_cliente FROM public."Citas" WHERE id = 1404;');
  console.log(c1404.rows);

  console.log('--- ULTIMOS MENSAJES DE 2228 ---');
  const msgs = await client.query('SELECT id, contenido, direccion, created_at FROM public.mensajes WHERE cliente_id = 2228 ORDER BY id DESC LIMIT 5;');
  console.log(msgs.rows);

  await client.end();
}

main().catch(console.error);
