const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  await client.query(`UPDATE "Citas" SET calificacion = NULL WHERE id = 1378;`);
  console.log('✓ Cita 1378 reseteada con calificacion = NULL');
  await client.end();
}

run().catch(console.error);
