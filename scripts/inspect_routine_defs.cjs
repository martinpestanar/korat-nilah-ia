const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const fns = ['fn_registrar_sello_visita', 'trg_fn_cita_completada_sellos', 'procesar_respuesta_calificacion_fidelizacion'];
  for (const fn of fns) {
    const res = await client.query(`
      SELECT routine_name, routine_definition 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_name = $1;
    `, [fn]);
    console.log(`=== FUNCTION: ${fn} ===`);
    if (res.rows.length > 0) {
      console.log(res.rows[0].routine_definition);
    } else {
      // try pg_proc
      const resProc = await client.query(`
        SELECT p.proname, pg_get_functiondef(p.oid) as def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = $1;
      `, [fn]);
      if (resProc.rows.length > 0) {
        console.log(resProc.rows[0].def);
      } else {
        console.log('Not found');
      }
    }
  }
  await client.end();
}

check().catch(console.error);
