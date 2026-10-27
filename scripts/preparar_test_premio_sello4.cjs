const { Client } = require('pg');
const https = require('https');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  const businessId = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  const clienteId = 2249;
  const telefono = '51981482289';

  console.log('1. Limpiando movimientos posteriores para dejar a Martin exactamente con 3 sellos...');
  // Borrar cualquier premio ganado previo para que el hito 4 se desbloquee como nuevo
  await client.query('DELETE FROM sellos_premios_ganados WHERE cliente_id = $1 AND business_id = $2', [clienteId, businessId]);

  // Limpiar movimientos para que la suma sea exactamente 3
  // Revisamos los movimientos existentes
  const movs = await client.query('SELECT id, cantidad, motivo FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2 ORDER BY id ASC', [clienteId, businessId]);
  console.log('Movimientos actuales:', movs.rows);

  // Dejar únicamente los movimientos que suman 3 sellos (ej: mov 20=1 sello, mov 23=2 sellos, total=3)
  await client.query('DELETE FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2 AND id NOT IN (20, 23)', [clienteId, businessId]);

  const sellosRes = await client.query('SELECT public.fn_sellos_activos($1, $2) as sellos', [clienteId, businessId]);
  console.log('Sellos activos actuales de Martin:', sellosRes.rows[0].sellos);

  if (parseInt(sellosRes.rows[0].sellos) !== 3) {
    // Si no son 3, ajustamos directamente
    await client.query('DELETE FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2', [clienteId, businessId]);
    await client.query(`
      INSERT INTO sellos_movimientos (business_id, cliente_id, cantidad, motivo, total_post, created_at)
      VALUES ($1, $2, 3, 'cita', 3, now())
    `, [businessId, clienteId]);
    console.log('Ajustado directamente a 3 sellos.');
  }

  // 2. Limpiar pausas
  await client.query(`
    UPDATE "Clientes"
    SET bot_pausado = false,
        bot_pausado_hasta = NULL,
        bot_pausado_razon = NULL
    WHERE id = $1
  `, [clienteId]);

  // 3. Crear Cita realista #1402 con precio S/ 35 (1 sello exacto)
  const citaInsert = await client.query(`
    INSERT INTO "Citas" (
      business_id, cliente_id, servicio, precio, fecha, estado,
      encuesta_enviada, fecha_encuesta_enviada, calificacion, feedback_cliente, created_at, updated_at
    ) VALUES (
      $1, $2, 'Tratamiento Capilar Botox & Brushing', 35, NOW(), 'Completada',
      true, NOW(), NULL, NULL, NOW(), NOW()
    )
    RETURNING id
  `, [businessId, clienteId]);
  const nuevaCitaId = citaInsert.rows[0].id;
  console.log('Nueva Cita creada:', nuevaCitaId);

  // 4. Obtener credenciales de la instancia
  const instRes = await client.query(`
    SELECT instance_name, api_key 
    FROM instancias_evolution 
    WHERE business_id = $1 AND status = 'conectado'
    LIMIT 1
  `, [businessId]);

  const { instance_name, api_key } = instRes.rows[0];

  // 5. Enviar Tiempo 1 por Evolution API
  const textoTiempo1 = '🌸 Qué alegría haberte tenido con nosotras.\n\nUna preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇';

  const payload = JSON.stringify({
    number: telefono,
    text: textoTiempo1,
    linkPreview: false,
    options: {
      delay: 1000,
      presence: 'composing',
      linkPreview: false
    }
  });

  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'evo.koratflow.agency',
      path: `/message/sendText/${instance_name}`,
      method: 'POST',
      headers: {
        'apikey': api_key,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Evolution Tiempo 1 enviado (status ' + res.statusCode + ')');
        resolve(res.statusCode);
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  // 6. Registrar en mensajes
  await client.query(`
    INSERT INTO mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      $1, $2, $3, 'saliente', 'texto', 'enviado', 'encuesta_fidelizacion'
    )
  `, [businessId, clienteId, textoTiempo1]);

  console.log('Todo listo para la prueba del Sello 4 automático.');
  await client.end();
}

run().catch(console.error);
