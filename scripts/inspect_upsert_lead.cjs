const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT proname, pg_get_functiondef(oid) as def 
    FROM pg_proc 
    WHERE proname = 'upsert_lead_entrante'
  `);
  if (res.rows.length > 0) {
    console.log(res.rows[0].def);
  } else {
    console.log('Not found');
  }
  await client.end();
}
run().catch(console.error);
