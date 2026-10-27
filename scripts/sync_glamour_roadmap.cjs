const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  // 1. Update total_sellos_roadmap = 12 for Glamour y Capricho
  await client.query(`
    UPDATE sellos_config
    SET total_sellos_roadmap = 12
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
  `);
  console.log('Updated total_sellos_roadmap to 12');

  // 2. Add Hito 12 if not exists
  const existsHito12 = await client.query(`
    SELECT id FROM sellos_roadmap 
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb' AND hito_sello = 12
  `);
  if (existsHito12.rows.length === 0) {
    await client.query(`
      INSERT INTO sellos_roadmap (
        business_id, hito_sello, nombre, descripcion, costo_interno, activo
      ) VALUES (
        '4b004ede-64e0-4f30-84fd-190a17b369eb',
        12,
        'Servicio Completo Estrella Totalmente Gratis',
        'Tu gran premio final por completar tu tarjeta dorada del Club Glow.',
        45.00,
        true
      )
    `);
    console.log('Created Hito 12 for Glamour y Capricho');
  }

  await client.end();
}
run().catch(e => console.error(e.message));
