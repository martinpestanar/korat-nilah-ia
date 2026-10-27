const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Fusionando cliente 2253 hacia 2249...');

  // 1. Reasignar cualquier mensaje de 2253 a 2249
  const mRes = await client.query(`
    UPDATE mensajes
    SET cliente_id = 2249
    WHERE cliente_id = 2253
  `);
  console.log('Mensajes reasignados:', mRes.rowCount);

  // 2. Reasignar citas si hubiera alguna
  const cRes = await client.query(`
    UPDATE "Citas"
    SET cliente_id = 2249
    WHERE cliente_id = 2253
  `);
  console.log('Citas reasignadas:', cRes.rowCount);

  // 3. Reasignar movimientos de sellos si hubiera
  const sRes = await client.query(`
    UPDATE sellos_movimientos
    SET cliente_id = 2249
    WHERE cliente_id = 2253
  `);
  console.log('Sellos reasignados:', sRes.rowCount);

  // 4. Asegurar que 2249 tenga el LID
  await client.query(`
    UPDATE "Clientes"
    SET whatsapp_lid = '255675141746866'
    WHERE id = 2249
  `);

  // 5. Eliminar el registro duplicado 2253
  const dRes = await client.query(`
    DELETE FROM "Clientes"
    WHERE id = 2253
  `);
  console.log('Cliente duplicado 2253 eliminado:', dRes.rowCount);

  await client.end();
}

run().catch(console.error);
