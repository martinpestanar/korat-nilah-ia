const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, nombre, telefono, whatsapp_lid, "Estado"
    FROM "Clientes"
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
      AND (LOWER(nombre) LIKE '%martin%' OR telefono LIKE '%981482289%')
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
