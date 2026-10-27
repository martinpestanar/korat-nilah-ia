const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Probando procesar_respuesta_calificacion_fidelizacion directamente...');
  try {
    const res = await client.query(`
      SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion(
        '4b004ede-64e0-4f30-84fd-190a17b369eb'::uuid,
        2249::bigint,
        '4'
      )
    `);
    console.log('Resultado:', res.rows);
  } catch (err) {
    console.error('ERROR EN procesar_respuesta_calificacion_fidelizacion:', err);
  }

  await client.end();
}
run().catch(console.error);
