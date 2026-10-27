const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function check() {
  await client.connect();

  const res = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'disparar_prueba_autopilot_produccion'
      AND n.nspname = 'public';
  `);
  console.log('Sobrecargas en pg_proc:');
  for (const r of res.rows) {
    console.log(r.proname + '(' + r.args + ')');
  }

  // Ver tipo de id en plantillas_automatizacion
  const colId = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'plantillas_automatizacion' AND column_name = 'id';
  `);
  console.log('Tipo real de id en plantillas_automatizacion:', colId.rows[0]);

  await client.end();
}

check().catch(console.error);
