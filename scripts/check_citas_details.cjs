const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkAppointments() {
  await client.connect();

  console.log('--- REVISANDO ÚLTIMAS CITAS MODIFICADAS HOY EN GLAMOUR ---');
  const citas = await client.query(`
    SELECT c.id, c.business_id, c.cliente_id, cl.nombre as cliente, cl.telefono, c.estado, c.fecha, c.calificacion, c.calificacion_estado
    FROM "Citas" c
    LEFT JOIN "Clientes" cl ON cl.id = c.cliente_id
    WHERE c.business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY c.id DESC
    LIMIT 15
  `);
  console.log(citas.rows);

  console.log('--- BUSCANDO COLA MENSAJES SALIENTES CUALQUIER ESTADO PENDIENTE ---');
  const pend = await client.query(`
    SELECT * FROM cola_mensajes_salientes WHERE estado NOT IN ('enviado', 'cancelado', 'cancelado_emergencia')
  `);
  console.log('Pendientes en toda la BD:', pend.rows);

  await client.end();
}
checkAppointments().catch(console.error);
