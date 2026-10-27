const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const cols = await client.query(`
    SELECT column_name, udt_name FROM information_schema.columns 
    WHERE table_name = 'sellos_movimientos' AND column_name = 'motivo'
  `);
  console.log('Motivo column type:', cols.rows[0]);

  await client.end();
}
run().catch(e => console.error(e.message));
