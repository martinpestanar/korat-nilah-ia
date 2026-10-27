const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- CLIENTE 2228 ---');
  const cl = await client.query('SELECT id, nombre, telefono, total_visitas, "Estado" FROM public."Clientes" WHERE id = 2228;');
  console.log(cl.rows);

  console.log('--- SELLOS CLIENTE 2228 ---');
  const sc = await client.query('SELECT * FROM public.sellos_clientes WHERE cliente_id = 2228;');
  console.log(sc.rows);

  console.log('--- SELLOS HISTORIAL 2228 ---');
  const sh = await client.query('SELECT * FROM public.sellos_historial WHERE cliente_id = 2228 ORDER BY id DESC;');
  console.log(sh.rows);

  console.log('--- PREMIOS GANADOS 2228 ---');
  const pg = await client.query('SELECT * FROM public.sellos_premios_ganados WHERE cliente_id = 2228;');
  console.log(pg.rows);

  console.log('--- ROADMAP ---');
  const rm = await client.query('SELECT id, sellos_requeridos, nombre_premio FROM public.sellos_roadmap WHERE business_id = \'4b004ede-64e0-4f30-84fd-190a17b369eb\' ORDER BY orden ASC;');
  console.log(rm.rows);

  console.log('--- MENSAJES COLA CLIENTE 2228 ---');
  const cola = await client.query('SELECT id, flujo, mensaje, estado, metadata FROM public.cola_mensajes_salientes WHERE cliente_id = 2228 ORDER BY id DESC;');
  console.log(cola.rows);

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
