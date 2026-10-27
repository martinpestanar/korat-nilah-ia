const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT m.id, m.cliente_id, m.direccion, m.contenido, m.created_at, c.nombre, c.telefono
    FROM mensajes m
    LEFT JOIN "Clientes" c ON c.id = m.cliente_id
    WHERE m.business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY m.created_at DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
