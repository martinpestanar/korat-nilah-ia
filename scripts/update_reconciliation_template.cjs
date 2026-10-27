const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function updateProc() {
  await client.connect();

  const resProc = await client.query(`
    SELECT pg_get_functiondef(p.oid) as def
    FROM pg_proc p
    WHERE p.proname = 'fn_procesar_calificacion_cliente';
  `);
  let def = resProc.rows[0].def;

  const oldMsg = "'Hola ' || COALESCE(v_cliente.nombre, 'amiga') || ' 🌸, para nosotros tu experiencia es lo primero. Queremos confirmarte que los sellos de tu visita ya fueron acreditados a tu tarjeta VIP (' || v_sellos_despues || ' de ' || v_sellos_totales || '). Tu opinión nos ayuda a mejorar y esperamos consentirte pronto ✨ ' || v_card_url";

  const newMsg = "'Hola ' || COALESCE(v_cliente.nombre, 'amiga') || ' 🌸' || E'\\n\\n' || 'Tu opinión es lo más importante para nosotras. Queremos confirmarte que los sellos de tu visita ya fueron sumados a tu tarjeta:' || E'\\n\\n' || '✨ Llevas *' || v_sellos_despues || ' de ' || v_sellos_totales || ' sellos*' || E'\\n\\n' || 'Esperamos consentirte pronto con el servicio que mereces 💕' || E'\\n\\n' || '📲 *Tu tarjeta:* ' || v_card_url";

  if (def.includes(oldMsg)) {
    def = def.replace(oldMsg, newMsg);
    await client.query(def);
    console.log('fn_procesar_calificacion_cliente actualizado con mensaje corto y negritas!');
  } else {
    console.log('Target string not found in def.');
  }

  await client.end();
}

updateProc().catch(console.error);
