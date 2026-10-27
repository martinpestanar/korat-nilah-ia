const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Agendando encolar_calificacion_post_cita en pg_cron cada 5 minutos...');
  try {
    const res = await client.query(`
      SELECT cron.schedule(
        'encolar_calificacion_post_cita',
        '*/5 * * * *',
        'SELECT public.encolar_calificacion_post_cita();'
      );
    `);
    console.log('Cron job registrado con éxito:', res.rows[0]);
  } catch (e) {
    console.log('Error programando cron job:', e.message);
  }

  const jobsRes = await client.query('SELECT jobid, jobname, schedule, command, active FROM cron.job');
  console.log('Cron jobs activos:', jobsRes.rows);

  await client.end();
}
run().catch(console.error);
