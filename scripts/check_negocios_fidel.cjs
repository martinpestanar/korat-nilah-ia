const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'negocios' AND (column_name LIKE '%fidel%' OR column_name LIKE '%sello%')
  `);
  console.log('Columnas en negocios:', cols.rows);

  const sample = await client.query(`
    SELECT id, nombre, modo_fidelizacion, tipo_fidelizacion FROM negocios LIMIT 5
  `);
  console.log('Sample negocios:', sample.rows);

  await client.end();
}
run().catch(e => console.error(e.message));
