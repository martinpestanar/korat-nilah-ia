const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function test() {
  await client.connect();

  const resBiz = await client.query(`
    SELECT id, nombre, modo_fidelizacion, slug 
    FROM negocios 
    WHERE nombre ILIKE '%glamour%' OR nombre ILIKE '%capricho%' 
    LIMIT 1;
  `);

  console.log('Negocio Glamour:', resBiz.rows[0]);

  if (resBiz.rows[0]) {
    const bizId = resBiz.rows[0].id;

    // Asegurar que tenga modo_fidelizacion = 'sellos'
    await client.query(`UPDATE negocios SET modo_fidelizacion = 'sellos' WHERE id = $1`, [bizId]);

    // Test 1: Simular respuesta 5 estrellas
    const sim5 = await client.query(`
      SELECT simular_respuesta_tiempo2_fidelizacion(
        $1, '51981482289', '5', 'Camila', 'Lifting de Pestañas', true
      ) as res;
    `, [bizId]);
    console.log('\n--- TEST 1: Simulación 5 Estrellas (Sellos) ---');
    console.log(sim5.rows[0]?.res);

    // Test 2: Simular respuesta 2 estrellas (Queja)
    const sim2 = await client.query(`
      SELECT simular_respuesta_tiempo2_fidelizacion(
        $1, '51981482289', '2', 'Camila', 'Lifting de Pestañas', true
      ) as res;
    `, [bizId]);
    console.log('\n--- TEST 2: Simulación 2 Estrellas (Queja) ---');
    console.log(sim2.rows[0]?.res);

    // Test 3: Simular cálculo sellos cumpleaños
    const clienteRes = await client.query(`SELECT id FROM "Clientes" WHERE business_id = $1 LIMIT 1`, [bizId]);
    const clienteId = clienteRes.rows[0]?.id || 1;

    const cumple = await client.query(`
      SELECT fn_calcular_sellos_regalo_cumpleanos($1, $2) as res;
    `, [clienteId, bizId]);
    console.log('\n--- TEST 3: Simulación Cumpleaños Sellos ---');
    console.log(cumple.rows[0]?.res);
  }

  await client.end();
}

test().catch(console.error);
