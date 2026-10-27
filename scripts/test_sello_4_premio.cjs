const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- TEST SIMULACIÓN 3 SELLOS -> 4 SELLOS (HITO PREMIO 1) ---');
  // En simular_respuesta_tiempo2_fidelizacion
  const res = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      p_business_id => '4b004ede-64e0-4f30-84fd-190a17b369eb'::uuid,
      p_telefono_cliente => '51926285289',
      p_nota => '5',
      p_nombre_cliente => 'Valeria'
    ) as result
  `);
  console.log('Resultado simulación:', JSON.stringify(res.rows[0].result, null, 2));

  await client.end();
}
run().catch(e => console.error(e.message));
