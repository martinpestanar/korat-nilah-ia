const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkEvolutionOrIncoming() {
  await client.connect();

  console.log('--- REVISANDO MENSAJES SALIENTES DE TODAS LAS CLIENTAS HOY ---');
  const allToday = await client.query(`
    SELECT q.id, q.created_at, q.business_id, n.nombre as salon, q.telefono, c.nombre as cliente_nombre, q.flujo, q.mensaje
    FROM cola_mensajes_salientes q
    LEFT JOIN "Clientes" c ON c.id = q.cliente_id
    LEFT JOIN negocios n ON n.id = q.business_id
    WHERE q.created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY q.id DESC
    LIMIT 30
  `);
  console.log(allToday.rows.map(r => ({
    id: r.id,
    fecha: r.created_at,
    salon: r.salon,
    cliente: r.cliente_nombre,
    telefono: r.telefono,
    flujo: r.flujo,
    msg: r.mensaje ? r.mensaje.substring(0, 50) : null
  })));

  await client.end();
}
checkEvolutionOrIncoming().catch(console.error);
