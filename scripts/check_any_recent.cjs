const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkRecentAnyTable() {
  await client.connect();

  console.log('--- REVISANDO MENSAJES EN TABLA mensajes (ÚLTIMAS 24 HORAS) ---');
  try {
    const msgs = await client.query(`
      SELECT *
      FROM mensajes
      ORDER BY id DESC
      LIMIT 10
    `);
    console.log(msgs.rows);
  } catch(e) {
    console.log('Error mensajes:', e.message);
  }

  console.log('--- REVISANDO NOTIFICACIONES ---');
  try {
    const notifs = await client.query(`
      SELECT *
      FROM notificaciones
      ORDER BY id DESC
      LIMIT 10
    `);
    console.log(notifs.rows);
  } catch(e) {
    console.log('Error notificaciones:', e.message);
  }

  console.log('--- REVISANDO COPILOT ACTION LOGS ---');
  try {
    const cp = await client.query(`
      SELECT *
      FROM copilot_action_logs
      ORDER BY id DESC
      LIMIT 10
    `);
    console.log(cp.rows);
  } catch(e) {
    console.log('Error copilot_action_logs:', e.message);
  }

  await client.end();
}
checkRecentAnyTable().catch(console.error);
