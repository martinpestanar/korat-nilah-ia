const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, jsonb_typeof(tarjetas_club_glow) as tipo, jsonb_array_length(tarjetas_club_glow) as len 
    FROM nilah_config 
    LIMIT 1;
  `);
  console.log('nilah_config.tarjetas_club_glow:', res.rows[0]);

  // Ver los primeros 3 sellos en tarjetas_club_glow
  const sellos = await client.query(`
    SELECT jsonb_path_query_array(tarjetas_club_glow, '$[0 to 2]') as sample
    FROM nilah_config
    LIMIT 1;
  `);
  console.log('Muestra de sellos en nilah_config:', JSON.stringify(sellos.rows[0]?.sample, null, 2));

  await client.end();
}

run().catch(console.error);
