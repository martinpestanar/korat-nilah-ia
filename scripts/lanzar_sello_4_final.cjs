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

  const sellosRes = await client.query('SELECT public.fn_sellos_activos($1, $2) as sellos', [clienteId, businessId]);
  console.log('Sellos activos actuales de Martin (confirmado):', sellosRes.rows[0].sellos);

  // 1. Limpiar pausas
  await client.query(`
    UPDATE "Clientes"
    SET bot_pausado = false,
        bot_pausado_hasta = NULL,
        bot_pausado_razon = NULL
    WHERE id = $1
  `, [clienteId]);

  // 2. Crear Cita #1403 con precio S/ 35 (que dará exactamente 1 sello: 3 -> 4)
  const citaInsert = await client.query(`
    INSERT INTO "Citas" (
      business_id, cliente_id, servicio, precio, fecha, estado,
      encuesta_enviada, fecha_encuesta_enviada, calificacion, feedback_cliente, created_at, updated_at
    ) VALUES (
      $1, $2, 'Corte & Peinado VIP', 35, NOW(), 'Completada',
      true, NOW(), NULL, NULL, NOW(), NOW()
    )
    RETURNING id
  `, [businessId, clienteId]);
  const nuevaCitaId = citaInsert.rows[0].id;
  console.log('Nueva Cita creada para Sello 4:', nuevaCitaId);

  // 3. Obtener credenciales de la instancia
  const instRes = await client.query(`
    SELECT instance_name, api_key 
    FROM instancias_evolution 
    WHERE business_id = $1 AND status = 'conectado'
    LIMIT 1
  `, [businessId]);

  const { instance_name, api_key } = instRes.rows[0];

  // 4. Enviar Tiempo 1 por Evolution API
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

  // 5. Registrar en mensajes
  await client.query(`
    INSERT INTO mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      $1, $2, $3, 'saliente', 'texto', 'enviado', 'encuesta_fidelizacion'
    )
  `, [businessId, clienteId, textoTiempo1]);

  console.log('Cita #%s armada. Martin está en 3 sellos. Esta cita lo llevará a 4 sellos.', nuevaCitaId);
  await client.end();
}

run().catch(console.error);
