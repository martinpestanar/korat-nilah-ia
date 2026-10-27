const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function inspectLast2Hours() {
  await client.connect();

  console.log('--- MENSAJES CREADOS EN LAS ÚLTIMAS 4 HORAS (DESDE LAS 20:00 UTC / 15:00 LIMA) ---');
  const r = await client.query(`
    SELECT id, created_at, business_id, cliente_id, telefono, flujo, estado, mensaje
    FROM cola_mensajes_salientes
    WHERE created_at >= NOW() - INTERVAL '4 hours'
    ORDER BY id DESC
  `);
  console.log('Total mensajes en cola_mensajes_salientes:', r.rowCount);
  console.log(r.rows);

  console.log('--- CITAS CREADAS O COMPLETADAS EN LAS ÚLTIMAS 4 HORAS ---');
  const c = await client.query(`
    SELECT id, created_at, updated_at, business_id, cliente_id, estado, origen
    FROM "Citas"
    WHERE updated_at >= NOW() - INTERVAL '4 hours' OR created_at >= NOW() - INTERVAL '4 hours'
    ORDER BY id DESC
    LIMIT 20
  `);
  console.log('Total citas tocadas:', c.rowCount);
  console.log(c.rows);

  await client.end();
}
inspectLast2Hours().catch(console.error);
