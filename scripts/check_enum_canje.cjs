const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const enums = await client.query(`
    SELECT e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'estado_canje_enum'
  `);
  console.log('estado_canje_enum values:', enums.rows.map(r => r.enumlabel));

  await client.end();
}
run().catch(e => console.error(e.message));
