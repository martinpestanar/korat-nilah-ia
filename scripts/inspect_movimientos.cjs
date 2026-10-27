const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT routine_name, routine_definition 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'fn_registrar_sello_visita';
  `);
  console.log('Definiciones de fn_registrar_sello_visita:', res.rows.length);
  for (const r of res.rows) {
    console.log(r.routine_definition);
  }

  // Ver columnas de sellos_movimientos
  const resMov = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sellos_movimientos';
  `);
  console.log('Columnas de sellos_movimientos:', resMov.rows.map(r => r.column_name));

  await client.end();
}

run().catch(console.error);
