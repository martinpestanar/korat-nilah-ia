const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Fixing v_roadmap_id declaration in fn_registrar_sello_visita...');

  const res = await client.query(`
    SELECT pg_get_functiondef(oid) as def 
    FROM pg_proc 
    WHERE proname = 'fn_registrar_sello_visita'
  `);
  let def = res.rows[0].def;

  // Replace v_roadmap_id uuid; with v_premio_ganado_id bigint;
  def = def.replace('v_roadmap_id          uuid;', 'v_premio_ganado_id   bigint;');
  def = def.replace('RETURNING id INTO v_roadmap_id;', 'RETURNING id INTO v_premio_ganado_id;');

  await client.query(def);
  console.log('fn_registrar_sello_visita patched successfully!');

  await client.end();
}
run().catch(console.error);
