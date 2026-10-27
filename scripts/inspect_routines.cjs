const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  // Ver definición de fn_sellos_activos y fn_registrar_sello_visita
  const res = await client.query(`
    SELECT routine_name, routine_definition 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name IN ('fn_sellos_activos', 'trg_fn_cita_completada_sellos');
  `);
  for (const r of res.rows) {
    console.log('=== ROUTINE:', r.routine_name);
    console.log(r.routine_definition);
  }

  // Ver vista v_sellos_dashboard
  const resView = await client.query(`
    SELECT definition FROM pg_views WHERE viewname = 'v_sellos_dashboard';
  `);
  console.log('=== VISTA v_sellos_dashboard:');
  console.log(resView.rows[0]?.definition);

  await client.end();
}

run().catch(console.error);
