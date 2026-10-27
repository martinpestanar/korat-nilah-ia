const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Citas' AND column_name IN ('precio', 'monto_total', 'servicio', 'servicio_id', 'estado')
  `);
  console.log('Citas price columns:', res.rows);

  const sampleCita = await client.query(`
    SELECT id, cliente_id, servicio, precio, estado 
    FROM "Citas" 
    ORDER BY id DESC LIMIT 5;
  `);
  console.log('Sample Citas:', sampleCita.rows);
  await client.end();
}

check().catch(console.error);
