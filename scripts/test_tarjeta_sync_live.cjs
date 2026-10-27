const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkSync() {
  await client.connect();

  // Obtener el hito 4 de Glamour
  const hito4 = await client.query(`SELECT id FROM sellos_roadmap WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb' AND hito_sello = 4;`);

  // Insertar premio ganado vinculado a ese hito
  await client.query(`
    INSERT INTO sellos_premios_ganados (business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en)
    VALUES ('4b004ede-64e0-4f30-84fd-190a17b369eb', 2228, $1, 'GLOW-CUMPLE-VIP', 'pendiente', now(), now() + interval '60 days')
    ON CONFLICT DO NOTHING;
  `, [hito4.rows[0]?.id || null]);

  // Consultar RPC get_tarjeta_club_glow_publica
  const rpcRes = await client.query(`SELECT public.get_tarjeta_club_glow_publica('glamour-y-capricho', 2228);`);
  const data = rpcRes.rows[0].get_tarjeta_club_glow_publica;

  console.log('--- SINCRONIZACIÓN EN TIEMPO REAL DE LA TARJETA ---');
  console.log('Clienta:', data.cliente.nombre);
  console.log('Sellos activos en vivo:', data.sellos_activos, 'de', data.total_roadmap);
  console.log('Premios desbloqueados listos para canjear en la tarjeta:', data.premios);

  await client.end();
}

checkSync().catch(console.error);
