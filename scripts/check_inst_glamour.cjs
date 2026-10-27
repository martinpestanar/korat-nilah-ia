const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const inst = await client.query(`
    SELECT * 
    FROM instancias_evolution 
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
  `);
  console.log('\n=== INSTANCIA EVOLUTION GLAMOUR ===');
  console.log(JSON.stringify(inst.rows, null, 2));

  await client.end();
}
run().catch(e => console.error(e.message));
