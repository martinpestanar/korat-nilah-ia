const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  const r = await client.query(`UPDATE public."Clientes" SET telefono = $1 WHERE id = $2 RETURNING id, telefono;`, [' 987 654 321 ', 2259]);
  console.log('Resultado normalizado (debe ser 51987654321):', r.rows[0]);

  await client.query(`UPDATE public."Clientes" SET telefono = $1 WHERE id = $2;`, ['51981482289', 2259]);
  console.log('Teléfono restaurado a 51981482289.');

  await client.end();
}

main().catch(console.error);
