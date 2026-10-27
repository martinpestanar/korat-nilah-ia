const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- SELLOS MOVIMIENTOS 2228 ---');
  const sm = await client.query('SELECT * FROM public.sellos_movimientos WHERE cliente_id = 2228 ORDER BY id ASC;');
  console.log(sm.rows);

  console.log('--- PREMIOS GANADOS 2228 ---');
  const pg = await client.query('SELECT * FROM public.sellos_premios_ganados WHERE cliente_id = 2228;');
  console.log(pg.rows);

  console.log('--- ROADMAP ---');
  const rm = await client.query('SELECT id, sellos_requeridos, orden, nombre_premio FROM public.sellos_roadmap WHERE business_id = \'4b004ede-64e0-4f30-84fd-190a17b369eb\' ORDER BY orden ASC;');
  console.log(rm.rows);

  console.log('--- COLA MENSAJES SALIENTES 2228 ---');
  const cm = await client.query('SELECT id, flujo, mensaje, estado, metadata FROM public.cola_mensajes_salientes WHERE cliente_id = 2228 ORDER BY id DESC LIMIT 5;');
  console.log(cm.rows);

  console.log('--- CITAS 2228 ---');
  const citas = await client.query('SELECT id, fecha, estado, calificacion, servicio, total, precio_cobrado, business_id FROM public."Citas" WHERE cliente_id = 2228;');
  console.log(citas.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
