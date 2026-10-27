const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const cfg = await client.query(`
    SELECT tarjetas_club_glow, jsonb_typeof(tarjetas_club_glow) as tipo
    FROM nilah_config LIMIT 1
  `);
  console.log('tarjetas_club_glow array length:', cfg.rows[0].tarjetas_club_glow.length);
  cfg.rows[0].tarjetas_club_glow.forEach(t => console.log('Sello:', t.sello, '-', t.nombre_hito));

  // Also check if there is tarjeta_zero in nilah_config
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'nilah_config'
  `);
  console.log('nilah_config columns:', cols.rows.map(r => r.column_name));

  await client.end();
}
run().catch(e => console.error(e.message));
