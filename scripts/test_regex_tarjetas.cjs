const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const bizId = '4b004ede-64e0-4f30-84fd-190a17b369eb';

  console.log('--- TEST A: Respuesta con texto extra "le doy un 5 estuvo perfecto" ---');
  const tA = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      $1, '51981482289', 'le doy un 5 estuvo perfecto', 'Camila', 'Lifting de Pestañas', true
    ) as res;
  `, [bizId]);
  console.log(tA.rows[0]?.res);

  console.log('\n--- TEST B: Respuesta con nota 3 (Queja / Regular) "un 3 no me gustó mucho" ---');
  const tB = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      $1, '51981482289', 'un 3 no me gustó mucho', 'Camila', 'Lifting de Pestañas', true
    ) as res;
  `, [bizId]);
  console.log(tB.rows[0]?.res);

  console.log('\n--- TEST C: Respuesta con nota 4 (Bueno / Sellos) ---');
  const tC = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      $1, '51981482289', '4', 'Camila', 'Lifting de Pestañas', true
    ) as res;
  `, [bizId]);
  console.log(tC.rows[0]?.res);

  await client.end();
}

run().catch(console.error);
