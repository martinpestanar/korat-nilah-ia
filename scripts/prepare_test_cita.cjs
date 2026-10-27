const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, cliente_id, estado, encuesta_enviada, calificacion 
    FROM "Citas" 
    WHERE id = 1378;
  `);
  console.log('Cita 1378 en base de datos:', res.rows[0]);

  // Si encuesta_enviada no es true, lo marcamos true para que esté lista para recibir tu respuesta
  if (!res.rows[0]?.encuesta_enviada) {
    await client.query(`UPDATE "Citas" SET encuesta_enviada = true WHERE id = 1378;`);
    console.log('✓ Cita 1378 marcada con encuesta_enviada = true');
  }

  await client.end();
}

run().catch(console.error);
