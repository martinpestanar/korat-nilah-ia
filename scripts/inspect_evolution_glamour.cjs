const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkEvolution() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'instancias_evolution';
  `);
  console.log('Columns:', res.rows.map(r => r.column_name));

  const inst = await client.query(`
    SELECT * FROM instancias_evolution WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Glamour instances:', inst.rows);

  const envios = await client.query(`
    SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%enviar%' OR routine_name LIKE '%evolution%';
  `);
  console.log('Routines:', envios.rows.map(r => r.routine_name));

  await client.end();
}

checkEvolution().catch(console.error);
