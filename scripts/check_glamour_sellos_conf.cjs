const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function check() {
  await client.connect();
  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  const res = await client.query(`
    SELECT n.id, n.nombre, n.modo_fidelizacion, sc.id as sc_id, sc.valor_sello_base, sc.addons_activos
    FROM negocios n
    LEFT JOIN sellos_config sc ON sc.business_id = n.id
    WHERE n.id = $1
  `, [businessId]);
  console.log(res.rows);

  // Directly test calling fn_registrar_sello_visita on a cita
  const testRes = await client.query(`
    SELECT public.fn_registrar_sello_visita(1378, $1);
  `, [businessId]);
  console.log('Test call on 1378:', testRes.rows);

  await client.end();
}

check().catch(console.error);
