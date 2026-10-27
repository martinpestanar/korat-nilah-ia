const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function run() {
  await client.connect();

  const cfg = await client.query(`SELECT tarjetas_club_glow FROM nilah_config LIMIT 1`);
  const list = cfg.rows[0].tarjetas_club_glow;
  
  console.log('=== ANALISIS DE LINKS EN SELLOS ===');
  list.forEach(item => {
    const hasLink = (item.copy_sugerido || '').includes('{link_tarjeta}');
    console.log(`Sello ${item.sello}: [${hasLink ? 'CON LINK 🔗' : 'SIN LINK 🚫'}]`);
    console.log(`  Texto:\n${item.copy_sugerido}\n-----------------------------`);
  });

  await client.end();
}
run().catch(e => console.error(e.message));
