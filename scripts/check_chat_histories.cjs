const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkEvolutionOutgoing() {
  await client.connect();

  // Ver los últimos 20 mensajes de n8n_chat_histories o cualquier tabla de log entrante/saliente
  const chatHist = await client.query(`
    SELECT *
    FROM n8n_chat_histories
    ORDER BY id DESC
    LIMIT 10
  `);
  console.log('n8n_chat_histories últimos:');
  console.log(JSON.stringify(chatHist.rows, null, 2));

  // Ver copilot conversations
  const cp = await client.query(`
    SELECT id, business_id, cliente_id, created_at, updated_at
    FROM copilot_conversations
    ORDER BY id DESC
    LIMIT 5
  `);
  console.log('copilot_conversations:');
  console.log(cp.rows);

  await client.end();
}
checkEvolutionOutgoing().catch(console.error);
