const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  // Check recent incoming messages in general across any salon
  const recentIncoming = await client.query(`
    SELECT id, business_id, cliente_id, direccion, left(contenido, 60) as cont, created_at 
    FROM mensajes 
    WHERE direccion = 'entrante' 
    ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\n=== ULTIMOS MENSAJES ENTRANTES EN EL SISTEMA ===');
  console.log(JSON.stringify(recentIncoming.rows, null, 2));

  // Check instancia evolution de Glamour y Capricho
  const inst = await client.query(`
    SELECT instance_name, status, webhook_url, created_at, updated_at 
    FROM instancias_evolution 
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
  `);
  console.log('\n=== INSTANCIA EVOLUTION GLAMOUR ===');
  console.log(JSON.stringify(inst.rows, null, 2));

  await client.end();
}
run().catch(e => console.error(e.message));
