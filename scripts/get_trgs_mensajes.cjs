const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
async function run() {
  await client.connect();
  const trgs = await client.query("SELECT tgname, pg_get_triggerdef(oid) as def FROM pg_trigger WHERE tgrelid = 'public.mensajes'::regclass");
  console.log('Triggers en mensajes:', trgs.rows);
  await client.end();
}
run();
