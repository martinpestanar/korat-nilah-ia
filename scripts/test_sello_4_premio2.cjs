const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  // Insertar temporalmente 1 sello para que tenga 3 en total
  await client.query(`
    INSERT INTO sellos_movimientos (business_id, cliente_id, cantidad, motivo, total_post, created_at)
    VALUES ('4b004ede-64e0-4f30-84fd-190a17b369eb', 2228, 1, 'cita', 3, now())
  `);

  console.log('--- TEST SIMULACIÓN 3 -> 4 SELLOS (DESBLOQUEA META 1) ---');
  const res = await client.query(`
    SELECT simular_respuesta_tiempo2_fidelizacion(
      p_business_id => '4b004ede-64e0-4f30-84fd-190a17b369eb'::uuid,
      p_telefono_cliente => '51926285289',
      p_nota => '5',
      p_nombre_cliente => 'Valeria'
    ) as result
  `);
  console.log('Resultado simulación:', JSON.stringify(res.rows[0].result, null, 2));

  // Limpiar el test para dejar cliente limpio
  await client.query(`DELETE FROM sellos_movimientos WHERE cliente_id = 2228`);
  await client.query(`UPDATE "Citas" SET calificacion = '0', feedback_cliente = NULL WHERE id = 1378`);

  await client.end();
}
run().catch(e => console.error(e.message));
