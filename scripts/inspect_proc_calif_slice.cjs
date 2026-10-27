const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT proname, pg_get_functiondef(oid) as def 
    FROM pg_proc 
    WHERE proname = 'procesar_respuesta_calificacion_fidelizacion'
  `);
  const lines = res.rows[0].def.split('\n');
  console.log(lines.slice(70, 160).join('\n'));
  await client.end();
}
run().catch(console.error);
