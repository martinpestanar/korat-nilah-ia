const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const resTrg = await client.query(`
    SELECT tgname, proname 
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE tgrelid = 'public.mensajes'::regclass;
  `);
  console.log('Triggers en mensajes:', resTrg.rows);

  const resInst = await client.query(`
    SELECT instance_name, status, webhook_url 
    FROM instancias_evolution 
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Instancia Glamour Evolution:', resInst.rows);

  await client.end();
}

run().catch(console.error);
