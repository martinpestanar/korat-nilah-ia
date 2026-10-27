const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function testRatingAfterLowTicket() {
  await client.connect();
  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  await client.query('BEGIN');
  try {
    // 1. Cliente
    const cl = await client.query(`
      INSERT INTO "Clientes" (business_id, nombre, telefono, "Estado")
      VALUES ($1, 'Sofia Cejas', '51987654320', 'Activo')
      RETURNING id, nombre, telefono;
    `, [businessId]);
    const clienteId = cl.rows[0].id;

    // 2. Cita 1: S/ 15
    const c1 = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Depilación de Cejas', 15.00, CURRENT_DATE, 'Completada', true)
      RETURNING id;
    `, [businessId, clienteId]);
    const citaId = c1.rows[0].id;

    // Trigger already ran upon insert as 'Completada', but let's check sellos_sobrante
    const sob = await client.query(`SELECT * FROM sellos_sobrante WHERE cliente_id = $1`, [clienteId]);
    console.log('Sobrante tras Completada:', sob.rows);

    // Ahora simular que Sofia responde '5' a la encuesta
    const resp = await client.query(`
      SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '5 excelente atencion');
    `, [businessId, clienteId]);
    console.log('Respuesta de procesar_respuesta_calificacion_fidelizacion:', resp.rows);

    // Verificar si se le crearon movimientos
    const movs = await client.query(`SELECT * FROM sellos_movimientos WHERE cliente_id = $1`, [clienteId]);
    console.log('Movimientos creados para Sofia:', movs.rows);

  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
}

testRatingAfterLowTicket().catch(console.error);
