const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function fix() {
  await client.connect();

  // 1. Eliminar la sobrecarga vieja con p_plantilla_id bigint
  console.log('Eliminando sobrecarga con p_plantilla_id bigint...');
  await client.query(`
    DROP FUNCTION IF EXISTS public.disparar_prueba_autopilot_produccion(
      uuid, text, text, text, text, text, text, text, bigint, boolean, numeric, bigint
    );
  `);
  console.log('✓ Sobrecarga bigint eliminada.');

  // 2. Eliminar la sobrecarga de 10 argumentos si es obsoleta o dejarla sólo si es necesaria
  await client.query(`
    DROP FUNCTION IF EXISTS public.disparar_prueba_autopilot_produccion(
      uuid, text, text, text, text, text, text, text, bigint, boolean
    );
  `);
  console.log('✓ Sobrecarga de 10 argumentos eliminada.');

  // 3. Verificar que solo quede una función con p_plantilla_id uuid y defaults
  const res = await client.query(`
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'disparar_prueba_autopilot_produccion'
      AND n.nspname = 'public';
  `);
  console.log('\nSobrecarga final activa:');
  for (const r of res.rows) {
    console.log(r.proname + '(' + r.args + ')');
  }

  await client.end();
}

fix().catch(console.error);
