const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  const roadmapRes = await client.query(`
    SELECT *
    FROM sellos_roadmap
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb' AND activo = true
    ORDER BY hito_sello ASC
  `);
  console.log('Roadmap Glamour:', JSON.stringify(roadmapRes.rows, null, 2));

  const configRes = await client.query('SELECT tarjetas_club_glow, copys_calificacion_sellos FROM nilah_config LIMIT 1');
  const tarjetas = configRes.rows[0].tarjetas_club_glow;
  if (Array.isArray(tarjetas)) {
    const s4 = tarjetas.find(t => t.sello === 4);
    console.log('Tarjeta Sello 4:', JSON.stringify(s4, null, 2));
  }

  const staffRes = await client.query(`
    SELECT id, nombre
    FROM staff
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    LIMIT 3
  `);
  console.log('Staff Glamour:', JSON.stringify(staffRes.rows, null, 2));

  await client.end();
}
run().catch(console.error);
