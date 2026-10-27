const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function testScenario() {
  await client.connect();

  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb'; // Glamour y Capricho
  
  // 1. Check current valor_sello_base
  const configRes = await client.query(`SELECT valor_sello_base, total_sellos_roadmap FROM sellos_config WHERE business_id = $1`, [businessId]);
  console.log('Config Glamour:', configRes.rows[0]);

  // Check if unique constraint exists on sellos_sobrante (business_id, cliente_id)
  const constrRes = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid) 
    FROM pg_constraint c 
    JOIN pg_class t ON c.conrelid = t.oid 
    WHERE t.relname = 'sellos_sobrante';
  `);
  console.log('Constraints on sellos_sobrante:', constrRes.rows);

  await client.end();
}

testScenario().catch(console.error);
