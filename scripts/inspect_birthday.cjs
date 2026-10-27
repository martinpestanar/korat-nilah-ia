const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkBirthday() {
  await client.connect();
  const fns = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name LIKE '%cumple%';
  `);
  console.log('Birthday functions:', fns.rows.map(r => r.routine_name));

  for (const fn of fns.rows) {
    const resProc = await client.query(`
      SELECT pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = $1;
    `, [fn.routine_name]);
    console.log(`=== ${fn.routine_name} ===`);
    console.log(resProc.rows[0]?.def?.substring(0, 500));
  }

  // Plantillas de cumpleanos
  const plantillas = await client.query(`
    SELECT flujo, activo, contenido 
    FROM plantillas_automatizacion 
    WHERE flujo LIKE '%cumple%';
  `);
  console.log('Plantillas cumple:', plantillas.rows);

  await client.end();
}

checkBirthday().catch(console.error);
