const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function updateTriggerDelay() {
  await client.connect();

  const r = await client.query(`SELECT pg_get_functiondef(p.oid) as def FROM pg_proc p WHERE p.proname = 'trg_fn_procesar_feedback_fidelizacion';`);
  let def = r.rows[0].def;

  const targetOld = `'delay', 1200`;
  const targetNew = `'delay', (public.calcular_delay_escritura_humana(v_res.mensaje_recompensa, 2.5, 6.0) * 1000)::int`;

  if (def.includes(targetOld)) {
    def = def.replace(targetOld, targetNew);
    await client.query(def);
    console.log('✅ Trigger actualizado: Ahora calcula delay orgánico basado en longitud de texto y presencia "composing"');
  } else {
    console.log('Target not found in trigger');
  }

  await client.end();
}

updateTriggerDelay().catch(console.error);
