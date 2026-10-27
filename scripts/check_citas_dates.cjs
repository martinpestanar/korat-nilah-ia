const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'Citas' AND (column_name LIKE '%encuesta%' OR column_name LIKE '%fecha%' OR column_name LIKE '%created%')
  `);
  console.log('Columnas de fecha en Citas:', cols.rows);

  await client.end();
}
run().catch(e => console.error(e.message));
