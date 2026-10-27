const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Verificando funciones críticas en Postgres:');
  const fns = [
    'upsert_lead_entrante',
    'trg_fn_procesar_feedback_fidelizacion',
    'procesar_respuesta_calificacion_fidelizacion',
    'fn_registrar_sello_visita',
    'get_candidatos_calificacion_post_cita',
    'encolar_calificacion_post_cita'
  ];

  for (const fn of fns) {
    const res = await client.query('SELECT proname, prosrc FROM pg_proc WHERE proname = $1', [fn]);
    console.log(`✅ ${fn}: ${res.rows.length ? 'ACTIVA Y VÁLIDA' : 'FALTA'}`);
  }

  // Verificar tabla sellos_premios_ganados
  const colRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sellos_premios_ganados' AND column_name = 'cita_id'");
  console.log('✅ sellos_premios_ganados.cita_id:', colRes.rows.length ? 'PRESENTE' : 'FALTA');

  await client.end();
}
run().catch(console.error);
