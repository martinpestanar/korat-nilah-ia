const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const c = await client.query(`SELECT id, cliente_id, business_id, calificacion, encuesta_enviada FROM "Citas" WHERE id = 1378`);
  console.log('CITA 1378:', c.rows[0]);

  // Reset calificacion to NULL or '0' if it had anything, ensuring it can receive
  await client.query(`UPDATE "Citas" SET calificacion = '0', feedback_cliente = NULL WHERE id = 1378`);
  console.log('CITA 1378 LISTA PARA RECIBIR RESPUESTA EN WHATSAPP!');

  await client.end();
}
run().catch(e => console.error(e.message));
