const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function auditRootCause() {
  await client.connect();

  // Todos los mensajes de esta clienta cronológicamente
  console.log('=== TIMELINE COMPLETA DE MENSAJES CLIENTA 2240 ===');
  const all = await client.query(`
    SELECT id, created_at, contenido, direccion, estado, tipo_mensaje, url_archivo
    FROM mensajes
    WHERE cliente_id = 2240
    ORDER BY created_at ASC
  `);
  for (const m of all.rows) {
    const ts = m.created_at?.toISOString();
    const dir = m.direccion === 'entrante' ? '⬅️ IN' : '➡️ OUT';
    const content = (m.contenido || '[vacío]').substring(0, 80);
    const hasMedia = m.url_archivo ? ' [+MEDIA]' : '';
    console.log(`${ts} | ${dir} | ${content}${hasMedia}`);
  }

  // Errores bot completos
  console.log('\n=== TODOS LOS ERRORES BOT DE HOY ===');
  const eb = await client.query(`
    SELECT id, created_at, nodo_fallido, mensaje_error, execution_id, business_id, mensaje_usuario
    FROM errores_bot
    WHERE created_at >= '2026-10-26T04:00:00Z'
    ORDER BY created_at ASC
  `);
  for (const e of eb.rows) {
    console.log(`  [${e.created_at?.toISOString()}] exec:${e.execution_id} nodo:${e.nodo_fallido} | ${e.mensaje_error} | usuario:"${e.mensaje_usuario}"`);
  }

  await client.end();
}
auditRootCause().catch(console.error);
