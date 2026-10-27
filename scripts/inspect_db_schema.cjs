const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'.replace('cfggpqpqpbqqeavdbdzwoz', 'cfggpqpbqqeavdbdzwoz')
});

async function run() {
  await client.connect();
  const resSellos = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'sellos_config';
  `);
  console.log('Columnas de sellos_config:', resSellos.rows.map(r => r.column_name));

  const resCitas = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Citas' AND column_name IN ('staff_id', 'calificacion', 'feedback_cliente');
  `);
  console.log('Columnas en Citas:', resCitas.rows);

  await client.end();
}

run().catch(console.error);
