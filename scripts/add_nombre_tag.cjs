const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  const res = await client.query('SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = \'procesar_respuesta_calificacion_fidelizacion\';');
  let code = res.rows[0].pg_get_functiondef;

  // Reemplazar para que siempre soporte {nombre} en los copys
  const targetReplace = `v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', v_negocio.nombre);`;
  const newReplace = `v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{nombre}', v_primer_nombre);
              v_mensaje_saliente := REPLACE(v_mensaje_saliente, '{salon}', v_negocio.nombre);`;

  code = code.split(targetReplace).join(newReplace);

  await client.query(code);
  console.log('Función procesar_respuesta_calificacion_fidelizacion actualizada con soporte para {nombre}.');

  await client.end();
}

main().catch(console.error);
