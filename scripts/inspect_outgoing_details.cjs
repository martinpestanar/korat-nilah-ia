const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function inspectOutgoingDetails() {
  await client.connect();

  const r = await client.query(`
    SELECT q.id, q.created_at, q.telefono, c.nombre as cliente_nombre, q.flujo, q.mensaje
    FROM cola_mensajes_salientes q
    LEFT JOIN "Clientes" c ON c.id = q.cliente_id
    WHERE q.created_at >= NOW() - INTERVAL '4 hours'
    ORDER BY q.id DESC
  `);
  console.log('Mensajes salientes últimas 4 horas:');
  for (const row of r.rows) {
    console.log(`[ID ${row.id}] A: ${row.cliente_nombre || 'N/A'} (${row.telefono}) | Flujo: ${row.flujo} | Msg: ${row.mensaje.substring(0, 60)}...`);
  }

  await client.end();
}
inspectOutgoingDetails().catch(console.error);
