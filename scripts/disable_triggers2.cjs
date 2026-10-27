const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function disableTriggers2() {
  await client.connect();
  await client.query('ALTER TABLE "Citas" DISABLE TRIGGER trg_cita_calificada_sellos');
  try {
    await client.query('ALTER TABLE "Citas" DISABLE TRIGGER trg_post_cita_fidelizacion');
  } catch(e) {}
  console.log('Triggers deshabilitados con éxito.');
  await client.end();
}
disableTriggers2().catch(console.error);
