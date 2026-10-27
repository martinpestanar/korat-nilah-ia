const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const enums = await client.query(`
    SELECT t.typname, e.enumlabel
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname LIKE '%premio%'
  `);
  console.log('\n=== ENUM VALUES PREMIO ===');
  console.log(enums.rows);

  // Check columns of sellos_premios_ganados including udt_name
  const cols = await client.query(`
    SELECT column_name, data_type, udt_name FROM information_schema.columns 
    WHERE table_name = 'sellos_premios_ganados'
  `);
  console.log(cols.rows);

  await client.end();
}
run().catch(e => console.error(e.message));
