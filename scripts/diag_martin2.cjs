const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('--- CITAS RECIENTES ---');
  const res = await client.query(`
    SELECT c.id, c.cliente_id, c.fecha, c.hora_fin, c.estado, c.encuesta_enviada, cl.nombre, cl.telefono, cl."Estado" as cliente_estado
    FROM "Citas" c
    LEFT JOIN "Clientes" cl ON cl.id = c.cliente_id
    WHERE c.business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
    ORDER BY c.id DESC LIMIT 5;
  `);
  console.log(res.rows);

  console.log('--- CANDIDATOS GET_CANDIDATOS ---');
  const cand = await client.query(`
    SELECT * FROM public.get_candidatos_calificacion_post_cita('4b004ede-64e0-4f30-84fd-190a17b369eb');
  `);
  console.log(cand.rows);

  console.log('--- COLA MENSAJES ---');
  const cola = await client.query(`
    SELECT * FROM public.cola_mensajes ORDER BY id DESC LIMIT 5;
  `);
  console.log(cola.rows);

  console.log('--- CRON RUNS ---');
  const cronRuns = await client.query(`
    SELECT jobid, runid, job_pid, database, username, command, status, return_message, start_time, end_time
    FROM cron.job_run_details
    ORDER BY start_time DESC LIMIT 6;
  `);
  console.log(cronRuns.rows);

  await client.end();
}

run().catch(console.error);
