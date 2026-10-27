const fs = require('fs');
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();
  const res = await client.query(`SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'trg_fn_procesar_feedback_fidelizacion';`);
  fs.writeFileSync('scripts/current_feedback_trigger.sql', res.rows[0].def, 'utf8');
  console.log('Script current_feedback_trigger.sql exportado con éxito.');
  await client.end();
}

main().catch(console.error);
