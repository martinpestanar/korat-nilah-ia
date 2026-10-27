const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkN8nHist() {
  await client.connect();

  const r = await client.query(`
    SELECT id, session_id, message->'content' as content, message->'type' as type
    FROM n8n_chat_histories
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log('Últimos n8n_chat_histories:');
  for (const row of r.rows) {
    console.log(`[${row.session_id}] (${row.type}): ${typeof row.content === 'string' ? row.content.substring(0, 80) : JSON.stringify(row.content).substring(0, 80)}`);
  }

  await client.end();
}
checkN8nHist().catch(console.error);
