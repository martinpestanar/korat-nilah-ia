const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('--- TRIGGERS EN CITAS ---');
  const tRes = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'Citas'
  `);
  console.log(tRes.rows);

  console.log('--- CRON JOBS (PG_CRON) ---');
  try {
    const cRes = await client.query('SELECT jobid, schedule, command, active FROM cron.job');
    console.log(cRes.rows);
  } catch (e) {
    console.log('No pg_cron table or accessible:', e.message);
  }

  await client.end();
}
run().catch(console.error);
