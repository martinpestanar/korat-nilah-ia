const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function auditFull() {
  await client.connect();

  const PHONE = '51994787498';
  const CLIENTE_ID = (await client.query(`SELECT id FROM "Clientes" WHERE telefono LIKE '%994787498%'`)).rows[0]?.id;
  console.log('Cliente ID:', CLIENTE_ID);

  // 1. Mensajes en tabla mensajes para esta clienta
  console.log('\n=== 1. MENSAJES RECIENTES DE ESTA CLIENTA ===');
  const msgs = await client.query(`
    SELECT id, created_at, business_id, contenido, direccion, estado, tipo_mensaje
    FROM mensajes
    WHERE cliente_id = $1
    ORDER BY created_at DESC
    LIMIT 30
  `, [CLIENTE_ID]);
  console.log('Total mensajes:', msgs.rowCount);
  for (const m of msgs.rows) {
    const content = (m.contenido || '').substring(0, 80);
    console.log(`  [${m.created_at?.toISOString()}] ${m.direccion} | ${m.estado} | ${content}...`);
  }

  // 2. n8n chat histories para este teléfono
  console.log('\n=== 2. N8N CHAT HISTORIES (session con este teléfono) ===');
  const ch = await client.query(`
    SELECT id, session_id, message->>'content' as content, message->>'type' as type
    FROM n8n_chat_histories
    WHERE session_id LIKE '%994787498%'
    ORDER BY id DESC
    LIMIT 30
  `);
  console.log('Total entries:', ch.rowCount);
  for (const r of ch.rows) {
    console.log(`  [ID ${r.id}] session: ${r.session_id} | ${r.type} | ${(r.content || '').substring(0, 100)}`);
  }

  // 3. Errores de bot de hoy
  console.log('\n=== 3. ERRORES BOT ÚLTIMAS 24H ===');
  const eb = await client.query(`
    SELECT id, created_at, business_id, tipo_error, mensaje, metadata
    FROM errores_bot
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY created_at DESC
    LIMIT 20
  `);
  console.log('Total errores:', eb.rowCount);
  for (const e of eb.rows) {
    console.log(`  [${e.created_at?.toISOString()}] ${e.tipo_error} | ${(e.mensaje || '').substring(0, 100)}`);
  }

  // 4. Mensaje log para este teléfono
  console.log('\n=== 4. MENSAJE_LOG ===');
  const ml = await client.query(`
    SELECT id, created_at, flujo_origen, tipo_mensaje, estado, metadata, mensaje_completo
    FROM mensaje_log
    WHERE telefono LIKE '%994787498%'
    ORDER BY created_at DESC
    LIMIT 10
  `);
  console.log('Total:', ml.rowCount);
  console.log(JSON.stringify(ml.rows, null, 2));

  // 5. Citas de esta clienta
  console.log('\n=== 5. CITAS DE ESTA CLIENTA ===');
  const citas = await client.query(`
    SELECT id, fecha, estado, calificacion, created_at
    FROM "Citas"
    WHERE cliente_id = $1
    ORDER BY id DESC
    LIMIT 10
  `, [CLIENTE_ID]);
  console.log(JSON.stringify(citas.rows, null, 2));

  await client.end();
}
auditFull().catch(console.error);
