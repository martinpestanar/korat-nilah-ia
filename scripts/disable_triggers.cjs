const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function disableTriggers() {
  await client.connect();
  await client.query('ALTER TABLE "Citas" DISABLE TRIGGER trg_cita_calificada_sellos');
  await client.query('ALTER TABLE "Citas" DISABLE TRIGGER trg_encolar_fidelizacion');
  console.log('Triggers trg_cita_calificada_sellos y trg_encolar_fidelizacion DESACTIVADOS.');
  await client.end();
}
disableTriggers().catch(console.error);
