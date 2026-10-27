const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Resetting Martin to 3 stamps and Cita 1401 to S/ 35...');

  // Eliminar movimiento 31 y premio 4
  await client.query('DELETE FROM sellos_movimientos WHERE id = 31');
  await client.query('DELETE FROM sellos_premios_ganados WHERE id = 4');

  // Asegurar que sellos activos sean exactamente 3
  const sRes = await client.query("SELECT public.fn_sellos_activos(2249, '4b004ede-64e0-4f30-84fd-190a17b369eb') as sellos");
  console.log('Sellos activos antes de cita:', sRes.rows[0].sellos);

  // Configurar Cita 1401 con precio S/ 35 para que sume exactamente 1 sello (3 -> 4)
  await client.query(`
    UPDATE "Citas"
    SET precio = 35,
        calificacion = NULL,
        feedback_cliente = NULL,
        encuesta_enviada = true,
        fecha_encuesta_enviada = NOW(),
        estado = 'Completada'
    WHERE id = 1401
  `);
  console.log('Cita 1401 configurada con precio S/ 35 (1 sello neto).');

  await client.end();
}
run().catch(console.error);
