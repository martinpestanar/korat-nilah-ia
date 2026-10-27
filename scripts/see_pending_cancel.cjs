const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function seePending() {
  await client.connect();

  const pend = await client.query(`
    SELECT q.id, q.business_id, n.nombre as salon, q.telefono, q.flujo, q.estado, q.proximo_intento_at, q.mensaje
    FROM cola_mensajes_salientes q
    LEFT JOIN negocios n ON n.id = q.business_id
    WHERE q.estado NOT IN ('enviado', 'cancelado', 'cancelado_emergencia')
  `);
  console.log('Mensajes pendientes encontrados:');
  console.log(JSON.stringify(pend.rows, null, 2));

  // Cancelar absolutamente todos
  const cancelAll = await client.query(`
    UPDATE cola_mensajes_salientes
    SET estado = 'cancelado_emergencia'
    WHERE estado NOT IN ('enviado', 'cancelado', 'cancelado_emergencia')
    RETURNING id;
  `);
  console.log('Cancelados inmediatamente:', cancelAll.rows.map(r => r.id));

  await client.end();
}
seePending().catch(console.error);
