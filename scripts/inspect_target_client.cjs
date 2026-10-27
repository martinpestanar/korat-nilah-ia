const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'Clientes' AND column_name LIKE '%cumple%';
  `);
  console.log('Columnas de cumple en Clientes:', cols.rows);

  const cl = await client.query(`
    SELECT id, business_id, nombre, telefono, bot_pausado, bot_pausado_hasta, puntos_acumulados 
    FROM "Clientes" 
    WHERE telefono LIKE '%926285289%' OR telefono LIKE '%926 285 289%';
  `);
  console.log('Cliente encontrado:', cl.rows);
  if (cl.rows.length > 0) {
    const cId = cl.rows[0].id;
    const bId = cl.rows[0].business_id;
    const sellos = await client.query('SELECT * FROM sellos_movimientos WHERE cliente_id = $1 ORDER BY id DESC LIMIT 5', [cId]);
    console.log('Movimientos sellos:', sellos.rows);
    const sob = await client.query('SELECT * FROM sellos_sobrante WHERE cliente_id = $1', [cId]);
    console.log('Sobrante:', sob.rows);
    const citas = await client.query('SELECT id, servicio, precio, fecha, estado, encuesta_enviada, calificacion FROM "Citas" WHERE cliente_id = $1 ORDER BY id DESC LIMIT 5', [cId]);
    console.log('Últimas citas:', citas.rows);
  }
  await client.end();
}

check().catch(console.error);
