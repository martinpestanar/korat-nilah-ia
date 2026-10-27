const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT id, cita_id, cantidad, motivo, total_post, created_at
    FROM sellos_movimientos
    WHERE cliente_id = 2249 AND business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY id ASC
  `);
  console.log('Movimientos Martin:', JSON.stringify(res.rows, null, 2));

  const countRes = await client.query("SELECT public.fn_sellos_activos(2249, '4b004ede-64e0-4f30-84fd-190a17b369eb') as sellos");
  console.log('Total calculado por fn_sellos_activos:', countRes.rows[0].sellos);

  await client.end();
}
run().catch(console.error);
