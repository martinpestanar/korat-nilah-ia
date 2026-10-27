const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const r1 = await p.query("SELECT id, nombre, instance_name FROM negocios WHERE nombre ILIKE '%glamour%' OR nombre ILIKE '%capricho%'");
  console.log('Negocios:', r1.rows);
  const r2 = await p.query("SELECT id, instance_name, business_id, status, telefono, label FROM instancias_evolution WHERE instance_name ILIKE '%glamour%' OR instance_name ILIKE '%capricho%'");
  console.log('Instancias:', r2.rows);
  await p.end();
}

check().catch(e => { console.error(e); p.end(); });
