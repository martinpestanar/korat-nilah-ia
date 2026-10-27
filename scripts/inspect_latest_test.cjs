const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, business_id, cliente_id, telefono, mensaje, flujo, created_at 
    FROM cola_mensajes_salientes 
    WHERE telefono LIKE '%926285289%' 
    ORDER BY id DESC LIMIT 3;
  `);
  console.log('Mensajes enviados a 926285289:', res.rows);

  if (res.rows[0]) {
    const resCita = await client.query(`
      SELECT id, cliente_id, business_id, estado, encuesta_enviada, calificacion 
      FROM "Citas" 
      WHERE cliente_id = $1 
      ORDER BY id DESC LIMIT 1;
    `, [res.rows[0].cliente_id]);
    console.log('Estado de la cita del test:', resCita.rows[0]);
  }

  await client.end();
}

run().catch(console.error);
