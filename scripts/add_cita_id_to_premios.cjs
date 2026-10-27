const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Agregando columna cita_id a sellos_premios_ganados...');
  await client.query(`
    ALTER TABLE public.sellos_premios_ganados 
    ADD COLUMN IF NOT EXISTS cita_id bigint;
  `);
  console.log('Columna cita_id agregada.');

  await client.end();
}
run().catch(console.error);
