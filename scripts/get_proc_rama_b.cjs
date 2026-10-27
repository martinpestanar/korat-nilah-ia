const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const fn = await client.query(`
    SELECT prosrc FROM pg_proc 
    WHERE proname = 'procesar_respuesta_calificacion_fidelizacion'
    LIMIT 1
  `);
  const src = fn.rows[0].prosrc;
  const idx = src.indexOf("RAMA B");
  if (idx !== -1) {
    console.log(src.substring(idx, idx + 2500));
  } else {
    console.log("RAMA B not found");
  }

  await client.end();
}
run().catch(e => console.error(e.message));
