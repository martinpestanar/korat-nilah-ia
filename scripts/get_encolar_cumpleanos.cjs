const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const fn = await client.query(`SELECT prosrc FROM pg_proc WHERE proname = 'encolar_cumpleanos' LIMIT 1`);
  console.log(fn.rows[0].prosrc);

  await client.end();
}
run().catch(e => console.error(e.message));
