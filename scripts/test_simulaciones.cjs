const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- TEST SIMULACIÓN 5 ESTRELLAS ---');
  const res5 = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      '4b004ede-64e0-4f30-84fd-190a17b369eb'::uuid,
      '51926285289',
      'Martin',
      'Le doy un 5 me encanto'
    ) as result
  `);
  console.log('Result 5 ⭐:', JSON.stringify(res5.rows[0].result, null, 2));

  console.log('\n--- TEST SIMULACIÓN 3 ESTRELLAS (QUEJA) ---');
  const res3 = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      '4b004ede-64e0-4f30-84fd-190a17b369eb'::uuid,
      '51926285289',
      'Martin',
      'Un 3 la verdad no me gusto tanto'
    ) as result
  `);
  console.log('Result 3 ⭐:', JSON.stringify(res3.rows[0].result, null, 2));

  await client.end();
}
run().catch(e => console.error(e.message));
