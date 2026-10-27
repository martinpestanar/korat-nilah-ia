const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function auditDeep() {
  await client.connect();

  // 1. El mensaje exacto que entró - todos los mensajes entrantes recientes de esta clienta
  console.log('=== MENSAJES ENTRANTES de clienta 2240 ===');
  const ent = await client.query(`
    SELECT id, created_at, contenido, direccion, estado
    FROM mensajes
    WHERE cliente_id = 2240 AND direccion = 'entrante'
    ORDER BY created_at DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(ent.rows, null, 2));

  // 2. Contar salientes del episodio
  console.log('\n=== TOTAL SALIENTES en el episodio (04:28 a 04:42 UTC) ===');
  const total = await client.query(`
    SELECT COUNT(*) as total, 
           MIN(created_at) as primer_envio, 
           MAX(created_at) as ultimo_envio
    FROM mensajes
    WHERE cliente_id = 2240 
    AND direccion = 'saliente'
    AND created_at >= '2026-10-26T04:28:00Z'
  `);
  console.log(JSON.stringify(total.rows, null, 2));

  // 3. Errores bot
  console.log('\n=== ERRORES BOT ===');
  const eb = await client.query(`SELECT * FROM errores_bot ORDER BY id DESC LIMIT 5`);
  console.log(JSON.stringify(eb.rows, null, 2));

  // 4. Verificar n8n_chat_histories con session_id basado en business_id
  console.log('\n=== N8N CHAT HISTORIES para Glamour ===');
  const ch = await client.query(`
    SELECT id, session_id, message->>'content' as content, message->>'type' as type
    FROM n8n_chat_histories
    WHERE session_id LIKE '%4b004ede%'
    ORDER BY id DESC
    LIMIT 15
  `);
  for (const r of ch.rows) {
    console.log(`  [ID ${r.id}] ${r.session_id} | ${r.type} | ${(r.content || '').substring(0, 100)}`);
  }

  // 5. Verificar si el webhook del bot estaba generando un loop (el bot enviaba, Evolution recibía su propio mensaje como entrante y re-ejecutaba el workflow)
  console.log('\n=== MENSAJES SALIENTES QUE PODRÍAN HABER SIDO RE-PROCESADOS ===');
  const salientes = await client.query(`
    SELECT id, created_at, contenido, estado
    FROM mensajes
    WHERE cliente_id = 2240
    AND direccion = 'saliente'
    AND created_at >= '2026-10-26T04:28:00Z'
    ORDER BY created_at ASC
  `);
  for (const m of salientes.rows) {
    const ts = m.created_at?.toISOString();
    const msg = (m.contenido || '').substring(0, 60);
    console.log(`  ${ts} | ${msg}`);
  }

  // 6. Buscar n8n chat histories por si el session_id usa el phone
  console.log('\n=== N8N HISTORIES con 994787498 o Glamour business_id ===');
  const ch2 = await client.query(`
    SELECT id, session_id, message->>'type' as type, LEFT(message->>'content', 80) as content
    FROM n8n_chat_histories
    WHERE session_id LIKE '%glamour%' OR session_id LIKE '%994787%' OR session_id LIKE '%2240%'
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log(ch2.rows);

  await client.end();
}
auditDeep().catch(console.error);
