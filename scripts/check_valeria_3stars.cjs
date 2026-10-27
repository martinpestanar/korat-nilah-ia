const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const cl = await client.query(`SELECT bot_pausado, bot_pausado_razon, bot_pausado_hasta FROM "Clientes" WHERE id = 2228;`);
  console.log('Valeria bot status:', cl.rows[0]);

  const cita = await client.query(`SELECT id, calificacion, feedback_cliente FROM "Citas" WHERE cliente_id = 2228 ORDER BY id DESC LIMIT 1;`);
  console.log('Cita calificada:', cita.rows[0]);

  await client.end();
}
check().catch(console.error);
