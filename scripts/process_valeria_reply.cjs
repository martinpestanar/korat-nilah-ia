const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function processIncoming() {
  await client.connect();

  const cl = await client.query(`
    SELECT id, business_id, telefono FROM public."Clientes" 
    WHERE telefono LIKE '%926285289%' AND business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  `);
  console.log('Cliente encontrado:', cl.rows[0]);
  const cliente = cl.rows[0];

  // Insertar mensaje entrante '4' exactamente como lo hace el webhook de WhatsApp
  const res = await client.query(`
    INSERT INTO public.mensajes (business_id, cliente_id, contenido, direccion, tipo, estado)
    VALUES ($1, $2, '4', 'entrante', 'texto', 'recibido')
    RETURNING id;
  `, [cliente.business_id, cliente.id]);
  console.log('Mensaje entrante registrado con ID:', res.rows[0].id);

  // Verificar si el trigger generó la respuesta
  const cola = await client.query(`
    SELECT id, flujo, mensaje, estado, media_url FROM public.cola_mensajes_salientes 
    WHERE cliente_id = $1 ORDER BY id DESC LIMIT 2;
  `, [cliente.id]);
  console.log('Cola mensajes generada por trigger:', cola.rows);

  const movs = await client.query(`
    SELECT id, cantidad, motivo, total_post FROM public.sellos_movimientos 
    WHERE cliente_id = $1 ORDER BY id DESC LIMIT 3;
  `, [cliente.id]);
  console.log('Movimientos de sellos actualizados:', movs.rows);

  await client.end();
}

processIncoming().catch(console.error);
