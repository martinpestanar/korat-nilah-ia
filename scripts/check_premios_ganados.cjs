const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'sellos_premios_ganados' ORDER BY ordinal_position
  `);
  console.log('sellos_premios_ganados cols:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
}
run().catch(e => console.error(e.message));
