const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  console.log('--- TEST: Cliente con 0 sellos ---');
  // Simulando llamada a procesar_respuesta_calificacion_fidelizacion para cliente 2228 (que tiene 0 sellos)
  const res = await client.query(`
    SELECT * FROM procesar_respuesta_calificacion_fidelizacion(
      '4b004ede-64e0-4f30-84fd-190a17b369eb'::uuid,
      2228::bigint,
      '5'
    )
  `);
  console.log('Resultado cliente 2228 (0 sellos):', JSON.stringify(res.rows[0], null, 2));

  // Verificar si se insertó el movimiento
  const movs = await client.query(`
    SELECT id, cliente_id, cantidad, motivo, total_post, created_at 
    FROM sellos_movimientos 
    WHERE cliente_id = 2228 
    ORDER BY created_at DESC
  `);
  console.log('Movimientos generados:', movs.rows);

  await client.end();
}
run().catch(e => console.error(e.message));
