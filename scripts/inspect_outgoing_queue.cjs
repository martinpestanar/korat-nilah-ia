const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function inspectOutgoingQueue() {
  await client.connect();

  console.log('--- COLA MENSAJES SALIENTES ---');
  const cm = await client.query(`
    SELECT *
    FROM cola_mensajes_salientes
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(cm.rows, null, 2));

  // Cancelar pendientes si hubiera en cola_mensajes_salientes
  const upd = await client.query(`
    UPDATE cola_mensajes_salientes
    SET estado = 'cancelado_emergencia'
    WHERE estado IN ('pendiente', 'ready', 'en_cola', 'procesando')
  `);
  console.log('Mensajes cancelados de emergencia en cola_mensajes_salientes:', upd.rowCount);

  console.log('--- MENSAJE LOG ---');
  const ml = await client.query(`
    SELECT *
    FROM mensaje_log
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(ml.rows, null, 2));

  console.log('--- NILAH AUTOPILOT LOG ---');
  const al = await client.query(`
    SELECT *
    FROM nilah_autopilot_log
    ORDER BY id DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(al.rows, null, 2));

  await client.end();
}
inspectOutgoingQueue().catch(console.error);
