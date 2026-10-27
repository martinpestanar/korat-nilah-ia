const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function checkStep6() {
  await client.connect();
  const citas = await client.query(`SELECT * FROM "Citas" WHERE cliente_id = 2228 ORDER BY id DESC LIMIT 2`);
  console.log('Últimas citas:', citas.rows);

  const movs = await client.query(`SELECT * FROM sellos_movimientos WHERE cliente_id = 2228 ORDER BY id DESC LIMIT 5`);
  console.log('Últimos movimientos:', movs.rows);

  const sob = await client.query(`SELECT * FROM sellos_sobrante WHERE cliente_id = 2228`);
  console.log('Sobrante:', sob.rows);

  await client.end();
}

checkStep6().catch(console.error);
