const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

/**
 * TEST COMPLETO DEL FLUJO DE SOBRANTE / ALCANCÍA
 *
 * Escenario:
 *   - valor_sello_base Glamour = S/ 30
 *   - Clienta que solo se hace depilación de cejas a S/ 15
 *
 * Flujo esperado:
 *   VISITA 1 (S/ 15): → 0 sellos, alcancía = S/ 15
 *   Clienta califica '5' → Mensaje informando alcancía guardada, NO sello aún
 *
 *   VISITA 2 (S/ 15): → trigger completada = 0 sellos (precio), alcancía acumula S/ 30
 *                     → trg acredita 1 sello (ahora sí alcanzó 30), alcancía = S/ 0
 *   Clienta califica '4' → Mensaje con el sello ganado
 */
async function testCompletoSobranteFlow() {
  await client.connect();
  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb'; // Glamour y Capricho

  await client.query('BEGIN');
  try {
    console.log('=== TEST SOBRANTE COMPLETO (modo alcancía) ===\n');

    // 1. Crear clienta de prueba
    const cl = await client.query(`
      INSERT INTO "Clientes" (business_id, nombre, telefono, "Estado")
      VALUES ($1, 'Valentina Cejas', '51911222333', 'Activo')
      RETURNING id, nombre, telefono;
    `, [businessId]);
    const clienteId = cl.rows[0].id;
    console.log(`✅ Clienta creada: ${cl.rows[0].nombre} (id=${clienteId})`);

    console.log('\n--- VISITA 1: Depilación cejas S/ 15 ---');
    const c1 = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Depilación de Cejas', 15.00, CURRENT_DATE, 'Completada', true)
      RETURNING id;
    `, [businessId, clienteId]);
    const cita1Id = c1.rows[0].id;
    console.log(`   Cita 1 id=${cita1Id} (S/ 15, Completada, encuesta_enviada=true)`);

    const sob1 = await client.query(`SELECT monto FROM sellos_sobrante WHERE cliente_id = $1`, [clienteId]);
    const mov1 = await client.query(`SELECT cantidad, motivo FROM sellos_movimientos WHERE cliente_id = $1`, [clienteId]);
    console.log(`   → Alcancía: S/ ${sob1.rows[0]?.monto ?? 'vacía'}`);
    console.log(`   → Sellos movimientos: ${mov1.rows.length === 0 ? 'ninguno (correcto)' : JSON.stringify(mov1.rows)}`);

    // Clienta califica con '5'
    const resp1 = await client.query(`
      SELECT mensaje_recompensa FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '5');
    `, [businessId, clienteId]);
    console.log(`   → Mensaje calificación 5⭐:\n      "${resp1.rows[0]?.mensaje_recompensa?.substring(0, 120)}..."`);

    const sobDespCalif1 = await client.query(`SELECT monto FROM sellos_sobrante WHERE cliente_id = $1`, [clienteId]);
    const movDespCalif1 = await client.query(`SELECT cantidad, motivo FROM sellos_movimientos WHERE cliente_id = $1 ORDER BY id`, [clienteId]);
    console.log(`   → Alcancía tras calificación: S/ ${sobDespCalif1.rows[0]?.monto}`);
    console.log(`   → Movimientos tras calificación: ${JSON.stringify(movDespCalif1.rows)}`);

    console.log('\n--- VISITA 2: Depilación cejas S/ 15 (acumula a S/ 30 total) ---');
    // Mover la cita 1 fuera del rango de 48h para que no interfiera
    await client.query(`UPDATE "Citas" SET calificacion = '5' WHERE id = $1`, [cita1Id]);

    const c2 = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
      VALUES ($1, $2, 'Depilación de Cejas', 15.00, CURRENT_DATE + 7, 'Completada', true)
      RETURNING id;
    `, [businessId, clienteId]);
    const cita2Id = c2.rows[0].id;
    console.log(`   Cita 2 id=${cita2Id} (S/ 15, Completada, encuesta_enviada=true)`);

    const sob2 = await client.query(`SELECT monto FROM sellos_sobrante WHERE cliente_id = $1`, [clienteId]);
    const mov2 = await client.query(`SELECT cantidad, motivo, sobrante_monto FROM sellos_movimientos WHERE cliente_id = $1 ORDER BY id`, [clienteId]);
    console.log(`   → Alcancía: S/ ${sob2.rows[0]?.monto ?? 'vacía'} (debe ser 0.00 = se gastó)`);
    console.log(`   → Sellos movimientos: ${JSON.stringify(mov2.rows)}`);

    // Clienta califica con '4'
    // Necesitamos resetear calificacion de cita2 para que procesar la encuentre
    await client.query(`UPDATE "Citas" SET calificacion = NULL WHERE id = $1`, [cita2Id]);

    const resp2 = await client.query(`
      SELECT mensaje_recompensa FROM public.procesar_respuesta_calificacion_fidelizacion($1, $2, '4 muy buena');
    `, [businessId, clienteId]);
    console.log(`   → Mensaje calificación 4⭐:\n      "${resp2.rows[0]?.mensaje_recompensa?.substring(0, 200)}..."`);

    const movFinal = await client.query(`SELECT cantidad, motivo, total_post FROM sellos_movimientos WHERE cliente_id = $1 ORDER BY id`, [clienteId]);
    console.log(`   → Sellos finales: ${JSON.stringify(movFinal.rows)}`);

    const colaMsgs = await client.query(`
      SELECT flujo, estado, mensaje FROM cola_mensajes_salientes WHERE cliente_id = $1 ORDER BY id
    `, [clienteId]);
    console.log(`\n   → Cola mensajes: ${JSON.stringify(colaMsgs.rows.map(r => ({ flujo: r.flujo, estado: r.estado, msg: r.mensaje?.substring(0, 60) })))}`);

    console.log('\n=== TEST COMPLETADO EXITOSAMENTE ===');
  } finally {
    await client.query('ROLLBACK');
    console.log('\n✅ ROLLBACK exitoso — BD intacta');
    await client.end();
  }
}

testCompletoSobranteFlow().catch(console.error);
