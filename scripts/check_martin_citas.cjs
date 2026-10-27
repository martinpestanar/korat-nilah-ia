const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT c.id, c.cliente_id, c.business_id, c.servicio, c.estado, c.encuesta_enviada, c.calificacion, c.created_at, cl.nombre, cl.telefono, cl.whatsapp_lid
    FROM "Citas" c
    JOIN "Clientes" cl ON cl.id = c.cliente_id
    WHERE c.business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
      AND (cl.id = 2249 OR cl.telefono LIKE '%981482289%')
    ORDER BY c.id DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
