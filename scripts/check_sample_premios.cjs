const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const sample = await client.query(`SELECT * FROM sellos_premios_ganados LIMIT 3`);
  console.log('Sample premios ganados:', JSON.stringify(sample.rows, null, 2));

  await client.end();
}
run().catch(e => console.error(e.message));
