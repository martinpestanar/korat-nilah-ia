const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function testSobranteFlow() {
  await client.connect();
  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb'; // Glamour y Capricho
  
  await client.query('BEGIN');
  try {
    // 1. Create dummy client
    const clRes = await client.query(`
      INSERT INTO "Clientes" (business_id, nombre, telefono, "Estado")
      VALUES ($1, 'Clienta Prueba Cejas', '51999888777', 'Activo')
      RETURNING id, nombre, telefono;
    `, [businessId]);
    const clienteId = clRes.rows[0].id;
    console.log('Cliente creado:', clienteId);

    // 2. Visita 1: Depilación de cejas S/ 15
    const c1Res = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado)
      VALUES ($1, $2, 'Depilación de Cejas', 15.00, CURRENT_DATE, 'Pendiente')
      RETURNING id;
    `, [businessId, clienteId]);
    const cita1Id = c1Res.rows[0].id;
    console.log('Cita 1 creada (S/ 15):', cita1Id);

    // Marcar Cita 1 como Completada (dispara trg_fn_cita_completada_sellos -> fn_registrar_sello_visita)
    await client.query(`UPDATE "Citas" SET estado = 'Completada' WHERE id = $1`, [cita1Id]);

    // Verificar sellos_sobrante tras Cita 1
    const sob1 = await client.query(`SELECT * FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2`, [clienteId, businessId]);
    console.log('Sobrante tras Cita 1:', sob1.rows);

    // Verificar sellos_movimientos tras Cita 1
    const mov1 = await client.query(`SELECT * FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2`, [clienteId, businessId]);
    console.log('Movimientos tras Cita 1 (debe ser 0 sellos):', mov1.rows);

    // 3. Visita 2: Otra depilación de cejas S/ 15
    const c2Res = await client.query(`
      INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado)
      VALUES ($1, $2, 'Depilación de Cejas', 15.00, CURRENT_DATE + 7, 'Pendiente')
      RETURNING id;
    `, [businessId, clienteId]);
    const cita2Id = c2Res.rows[0].id;
    console.log('Cita 2 creada (S/ 15):', cita2Id);

    // Marcar Cita 2 como Completada
    await client.query(`UPDATE "Citas" SET estado = 'Completada' WHERE id = $1`, [cita2Id]);

    // Verificar sellos_sobrante tras Cita 2
    const sob2 = await client.query(`SELECT * FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2`, [clienteId, businessId]);
    console.log('Sobrante tras Cita 2 (debe ser 0 ya que 15+15=30):', sob2.rows);

    // Verificar sellos_movimientos tras Cita 2
    const mov2 = await client.query(`SELECT * FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2`, [clienteId, businessId]);
    console.log('Movimientos tras Cita 2 (debe tener el sello desbloqueado):', mov2.rows);

    // Verificar cola de mensajes salientes
    const cola = await client.query(`
      SELECT flujo, mensaje, proximo_intento_at, metadata 
      FROM cola_mensajes_salientes 
      WHERE cliente_id = $1 AND business_id = $2
    `, [clienteId, businessId]);
    console.log('Cola mensajes para clienta:', cola.rows);

  } finally {
    await client.query('ROLLBACK');
    console.log('Rollback exitoso (BD intacta)');
    await client.end();
  }
}

testSobranteFlow().catch(console.error);
