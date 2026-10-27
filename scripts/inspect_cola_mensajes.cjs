const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function inspectCola() {
  await client.connect();

  // Ver los últimos mensajes en cola_mensajes
  const cm = await client.query(`
    SELECT id, business_id, tipo, estado, receptor, canal, created_at, error, payload
    FROM cola_mensajes
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log('Últimos 10 registros en cola_mensajes:');
  console.log(JSON.stringify(cm.rows, null, 2));

  // Ver últimos registros en sellos_movimientos
  const sm = await client.query(`
    SELECT *
    FROM sellos_movimientos
    ORDER BY id DESC
    LIMIT 5
  `);
  console.log('Últimos movimientos sellos:');
  console.log(JSON.stringify(sm.rows, null, 2));

  await client.end();
}
inspectCola().catch(console.error);
