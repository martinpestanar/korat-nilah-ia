const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const nilah = await client.query(`SELECT tarjetas_club_glow FROM nilah_config LIMIT 1`);
  const cards = nilah.rows[0].tarjetas_club_glow;
  console.log('Cards count:', cards.length);
  cards.forEach(c => {
    console.log(`Sello ${c.sello}: [${c.nombre_hito}] (es_premio: ${c.es_premio})`);
    console.log(`  Copy: ${c.copy_sugerido ? c.copy_sugerido.replace(/\n/g, ' ') : 'N/A'}`);
  });

  await client.end();
}
run().catch(e => console.error(e.message));
