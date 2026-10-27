const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  const res = await client.query(`
    SELECT pg_get_functiondef(oid) as def 
    FROM pg_proc 
    WHERE proname = 'fn_registrar_sello_visita'
  `);
  let def = res.rows[0].def;

  def = def.replace(/'id',\s+v_roadmap_id,/g, "'id', v_premio_ganado_id,");
  def = def.replace(/v_roadmap_id/g, 'v_premio_ganado_id');

  await client.query(def);
  console.log('fn_registrar_sello_visita all v_roadmap_id replaced.');

  await client.end();
}
run().catch(console.error);
