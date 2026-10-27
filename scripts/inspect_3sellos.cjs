const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- CLIENTES RECIENTES CON 981482289 ---');
  const cl = await client.query(`
    SELECT id, nombre, telefono, business_id FROM public."Clientes"
    WHERE telefono LIKE '%981482289%';
  `);
  console.log('Clientes:', cl.rows);

  const clientIds = cl.rows.map(r => r.id);

  console.log('--- MOVIMIENTOS DE SELLOS ---');
  const movs = await client.query(`
    SELECT id, cliente_id, cita_id, cantidad, motivo, total_post, notas, created_at
    FROM public.sellos_movimientos
    WHERE cliente_id = ANY($1::bigint[])
    ORDER BY id ASC;
  `, [clientIds]);
  console.log('Movimientos:', movs.rows);

  console.log('--- CITA 1405 ---');
  const cita = await client.query(`
    SELECT id, cliente_id, precio, servicio, calificacion, created_at
    FROM public."Citas"
    WHERE id = 1405;
  `);
  console.log('Cita 1405:', cita.rows);

  console.log('--- ULTIMOS MENSAJES COLA ---');
  const msgs = await client.query(`
    SELECT id, cliente_id, telefono, flujo, mensaje, estado, error_mensaje, created_at
    FROM public.cola_mensajes_salientes
    WHERE telefono LIKE '%981482289%'
    ORDER BY id DESC LIMIT 5;
  `);
  console.log('Mensajes cola:', msgs.rows);

  await client.end();
}

main().catch(console.error);
