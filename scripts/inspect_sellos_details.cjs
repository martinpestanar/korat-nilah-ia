const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  
  // 1. Ver tablas de sellos
  const resTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%sello%';
  `);
  console.log('Tablas sellos:', resTables.rows.map(r => r.table_name));

  // 2. Ver columnas de sellos_roadmap
  const resRoadmap = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sellos_roadmap';
  `);
  console.log('Columnas de sellos_roadmap:', resRoadmap.rows.map(r => r.column_name));

  // 3. Ver funciones o triggers de sellos existentes
  const resRpcs = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name LIKE '%sello%';
  `);
  console.log('RPCs sellos:', resRpcs.rows.map(r => r.routine_name));

  await client.end();
}

run().catch(console.error);
