const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function testFix() {
  await client.connect();
  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb'; // Glamour y Capricho
  
  await client.query('BEGIN');
  try {
    // Reemplazar temporalmente fn_registrar_sello_visita con la corrección v_sobrante := COALESCE(v_sobrante, 0)
    // y probar la simulación completa
    console.log('Testing in transaction...');

    // 1. Crear cliente
    const cl = await client.query(`
      INSERT INTO "Clientes" (business_id, nombre, telefono, "Estado")
      VALUES ($1, 'Ana Depilación Cejas', '51987654321', 'Activo')
      RETURNING id, nombre;
    `, [businessId]);
    const clienteId = cl.rows[0].id;

    // Ejecutar lógica de sobrante directamente
    const valorBase = 30.00;
    const maxSellos = 2;

    // Visita 1: S/ 15
    let precioCita1 = 15.00;
    let sobrantePrevio = 0.00;
    let montoEfectivo1 = precioCita1 + sobrantePrevio;
    let sellosRaw1 = Math.floor(montoEfectivo1 / valorBase);
    let sellosNuevos1 = Math.min(sellosRaw1, maxSellos);
    let nuevoSobrante1 = montoEfectivo1 - (sellosNuevos1 * valorBase);

    console.log(`Visita 1: Gasto S/${precioCita1} + Sobrante Previo S/${sobrantePrevio} = Total S/${montoEfectivo1}`);
    console.log(`-> Sellos otorgados: ${sellosNuevos1}`);
    console.log(`-> Saldo guardado en alcancía: S/${nuevoSobrante1}`);

    // Visita 2: S/ 15
    let precioCita2 = 15.00;
    let sobrantePrevio2 = nuevoSobrante1; // S/ 15
    let montoEfectivo2 = precioCita2 + sobrantePrevio2; // S/ 30
    let sellosRaw2 = Math.floor(montoEfectivo2 / valorBase); // 1
    let sellosNuevos2 = Math.min(sellosRaw2, maxSellos); // 1
    let nuevoSobrante2 = montoEfectivo2 - (sellosNuevos2 * valorBase); // 0

    console.log(`Visita 2: Gasto S/${precioCita2} + Sobrante Previo S/${sobrantePrevio2} = Total S/${montoEfectivo2}`);
    console.log(`-> Sellos otorgados: ${sellosNuevos2}`);
    console.log(`-> Saldo guardado en alcancía: S/${nuevoSobrante2}`);

    // Visita 3: S/ 50 (ticket alto)
    let precioCita3 = 50.00;
    let sobrantePrevio3 = nuevoSobrante2; // S/ 0
    let montoEfectivo3 = precioCita3 + sobrantePrevio3; // S/ 50
    let sellosRaw3 = Math.floor(montoEfectivo3 / valorBase); // 1 sello (50 / 30)
    let sellosNuevos3 = Math.min(sellosRaw3, maxSellos); // 1
    let nuevoSobrante3 = montoEfectivo3 - (sellosNuevos3 * valorBase); // 50 - 30 = 20

    console.log(`Visita 3: Gasto S/${precioCita3} + Sobrante Previo S/${sobrantePrevio3} = Total S/${montoEfectivo3}`);
    console.log(`-> Sellos otorgados: ${sellosNuevos3}`);
    console.log(`-> Saldo guardado en alcancía: S/${nuevoSobrante3}`);

  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
}

testFix().catch(console.error);
