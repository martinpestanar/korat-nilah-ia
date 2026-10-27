const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- CANDIDATOS GET_CANDIDATOS ---');
  const cand = await client.query(`
    SELECT * FROM public.get_candidatos_calificacion_post_cita('4b004ede-64e0-4f30-84fd-190a17b369eb');
  `);
  console.log('Candidatos:', cand.rows);

  console.log('--- COLA MENSAJES SALIENTES ---');
  const cola = await client.query(`
    SELECT id, cliente_id, telefono, flujo, estado, error_mensaje, created_at
    FROM public.cola_mensajes_salientes
    ORDER BY id DESC LIMIT 5;
  `);
  console.log('Cola:', cola.rows);

  await client.end();
}

main().catch(console.error);
