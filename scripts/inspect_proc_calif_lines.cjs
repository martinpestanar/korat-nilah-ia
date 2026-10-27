const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const resProc = await client.query(`
    SELECT pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'procesar_respuesta_calificacion_fidelizacion';
  `);
  const lines = resProc.rows[0].def.split('\n');
  for (let i = 80; i < 220 && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
  await client.end();
}

check().catch(console.error);
