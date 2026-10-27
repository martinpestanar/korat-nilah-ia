const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const resCols = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('sellos_sobrante', 'sellos_config', 'sellos_movimientos') 
    ORDER BY table_name, ordinal_position;
  `);
  console.log('Columns:');
  console.log(JSON.stringify(resCols.rows, null, 2));

  const resFns = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND (routine_name LIKE '%sello%' OR routine_name LIKE '%sobrante%' OR routine_name LIKE '%fidelizacion%');
  `);
  console.log('Functions:', resFns.rows.map(r => r.routine_name));

  const sampleSobrante = await client.query(`SELECT * FROM sellos_sobrante LIMIT 10;`);
  console.log('Sample sellos_sobrante:', sampleSobrante.rows);

  const sampleConfig = await client.query(`SELECT * FROM sellos_config LIMIT 2;`);
  console.log('Sample sellos_config:', sampleConfig.rows);

  await client.end();
}

check().catch(console.error);
