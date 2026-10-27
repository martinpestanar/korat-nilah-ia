const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- RESETEANDO CLIENTE 981482289 ---');
  const res = await client.query(`SELECT public.fn_reset_cliente_fidelizacion('4b004ede-64e0-4f30-84fd-190a17b369eb', '981482289');`);
  console.log('Resultado Reset:', JSON.stringify(res.rows[0], null, 2));

  // Verificar cliente en BD
  const cl = await client.query(`
    SELECT id, nombre, telefono, bot_pausado, "Estado" 
    FROM public."Clientes" 
    WHERE telefono LIKE '%981482289%' AND business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Clientes encontrados en Glamour:', cl.rows);

  const ids = cl.rows.map(r => r.id);

  if (ids.length > 0) {
    const movs = await client.query(`SELECT * FROM public.sellos_movimientos WHERE cliente_id = ANY($1::bigint[]);`, [ids]);
    console.log('Movimientos de sellos en BD:', movs.rows.length);

    const citas = await client.query(`SELECT id, fecha, estado FROM public."Citas" WHERE cliente_id = ANY($1::bigint[]);`, [ids]);
    console.log('Citas existentes en BD:', citas.rows.length);

    const msgs = await client.query(`SELECT id FROM public.mensajes WHERE cliente_id = ANY($1::bigint[]);`, [ids]);
    console.log('Mensajes existentes en BD:', msgs.rows.length);

    const cola = await client.query(`SELECT id FROM public.cola_mensajes_salientes WHERE cliente_id = ANY($1::bigint[]);`, [ids]);
    console.log('Mensajes en cola:', cola.rows.length);
  }

  // Verificar que el trigger esté en AFTER INSERT OR UPDATE
  const trg = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'Citas' AND trigger_name = 'trg_cita_completada_sellos';
  `);
  console.log('Trigger citas:', trg.rows);

  await client.end();
}

main().catch(console.error);
