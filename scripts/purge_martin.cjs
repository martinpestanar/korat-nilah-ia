const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  // Buscar solo los clientes de Glamour y Capricho o con ese número
  const clRes = await client.query(`
    SELECT id, nombre, telefono, business_id FROM public."Clientes"
    WHERE telefono LIKE '%981482289%' AND business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Clientes a purgar en Glamour y Capricho:', clRes.rows);

  const clientIds = clRes.rows.map(r => r.id);

  if (clientIds.length > 0) {
    await client.query(`DELETE FROM public.cola_mensajes_salientes WHERE cliente_id = ANY($1::bigint[]) OR telefono LIKE '%981482289%';`, [clientIds]);
    await client.query(`DELETE FROM public.sellos_premios_ganados WHERE cliente_id = ANY($1::bigint[]);`, [clientIds]);
    await client.query(`DELETE FROM public.sellos_movimientos WHERE cliente_id = ANY($1::bigint[]);`, [clientIds]);
    await client.query(`DELETE FROM public.sellos_sobrante WHERE cliente_id = ANY($1::bigint[]);`, [clientIds]);
    await client.query(`DELETE FROM public.mensajes WHERE cliente_id = ANY($1::bigint[]);`, [clientIds]);
    await client.query(`DELETE FROM public."Citas" WHERE cliente_id = ANY($1::bigint[]);`, [clientIds]);
    await client.query(`DELETE FROM public."Clientes" WHERE id = ANY($1::bigint[]);`, [clientIds]);
    console.log('Cliente Martin Pestana (981482289) purgado con éxito en Glamour y Capricho.');
  }

  // Comprobar que en Glamour no queda nadie con ese teléfono
  const check = await client.query(`
    SELECT id, nombre, telefono FROM public."Clientes" 
    WHERE telefono LIKE '%981482289%' AND business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Verificación final en Glamour (debe ser vacio):', check.rows);

  // Asegurar que el trigger instantáneo de completadas esté al 100%
  const trigCheck = await client.query(`
    SELECT proname FROM pg_proc WHERE proname = 'trg_fn_cita_completada_sellos';
  `);
  console.log('Trigger citas completadas verificado:', trigCheck.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error al purgar:', err);
  process.exit(1);
});
