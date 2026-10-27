const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function audit() {
  await client.connect();

  const PHONE = '51994787498';

  // 1. Buscar la clienta por teléfono
  console.log('=== 1. CLIENTE CON TELÉFONO', PHONE, '===');
  const cl = await client.query(`
    SELECT c.id, c.nombre, c.telefono, c.business_id, n.nombre as salon, n.slug
    FROM "Clientes" c
    JOIN negocios n ON n.id = c.business_id
    WHERE c.telefono LIKE '%994787498%'
  `);
  console.log(JSON.stringify(cl.rows, null, 2));

  // 2. Buscar mensajes salientes a este teléfono
  console.log('\n=== 2. COLA MENSAJES SALIENTES A ESTE TELÉFONO ===');
  const cms = await client.query(`
    SELECT id, created_at, business_id, cliente_id, telefono, flujo, estado, mensaje, delay_ms, instance_name
    FROM cola_mensajes_salientes
    WHERE telefono LIKE '%994787498%'
    ORDER BY created_at DESC
  `);
  console.log('Total mensajes en cola:', cms.rowCount);
  console.log(JSON.stringify(cms.rows, null, 2));

  // 3. Buscar en tabla mensajes
  console.log('\n=== 3. TABLA MENSAJES ===');
  const msgs = await client.query(`
    SELECT id, created_at, business_id, cliente_id, contenido, direccion, estado, tipo_mensaje
    FROM mensajes
    WHERE cliente_id IN (SELECT id::text FROM "Clientes" WHERE telefono LIKE '%994787498%')
    ORDER BY created_at DESC
    LIMIT 20
  `);
  console.log('Total mensajes:', msgs.rowCount);
  console.log(JSON.stringify(msgs.rows, null, 2));

  // 4. Buscar en mensaje_log
  console.log('\n=== 4. MENSAJE_LOG ===');
  const ml = await client.query(`
    SELECT id, created_at, business_id, cliente_id, telefono, flujo_origen, tipo_mensaje, estado, metadata, mensaje_completo
    FROM mensaje_log
    WHERE telefono LIKE '%994787498%'
    ORDER BY created_at DESC
    LIMIT 20
  `);
  console.log('Total en mensaje_log:', ml.rowCount);
  console.log(JSON.stringify(ml.rows, null, 2));

  // 5. Buscar errores_bot recientes
  console.log('\n=== 5. ERRORES BOT RECIENTES ===');
  const eb = await client.query(`
    SELECT *
    FROM errores_bot
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(eb.rows, null, 2));

  // 6. Chat histories de n8n con este session_id
  console.log('\n=== 6. N8N CHAT HISTORIES ===');
  const ch = await client.query(`
    SELECT id, session_id, message->>'content' as content, message->>'type' as type
    FROM n8n_chat_histories
    WHERE session_id LIKE '%994787498%'
    ORDER BY id DESC
    LIMIT 20
  `);
  console.log('Total chat histories:', ch.rowCount);
  for (const row of ch.rows) {
    console.log(`[${row.session_id}] (${row.type}): ${(row.content || '').substring(0, 100)}`);
  }

  await client.end();
}
audit().catch(console.error);
