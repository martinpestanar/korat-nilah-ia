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

  // 1. Limpiar pausas
  await client.query(`
    UPDATE "Clientes"
    SET bot_pausado = false,
        bot_pausado_hasta = NULL,
        bot_pausado_razon = NULL
    WHERE id = $1
  `, [clienteId]);

  // 2. Crear Cita realista
  const citaInsert = await client.query(`
    INSERT INTO "Citas" (
      business_id, cliente_id, servicio, fecha, estado,
      encuesta_enviada, fecha_encuesta_enviada, calificacion, feedback_cliente, created_at, updated_at
    ) VALUES (
      $1, $2, 'Diseño de Cejas HD & Lifting de Pestañas', NOW(), 'Completada',
      true, NOW(), NULL, NULL, NOW(), NOW()
    )
    RETURNING id
  `, [businessId, clienteId]);
  const nuevaCitaId = citaInsert.rows[0].id;
  console.log('Cita realista creada:', nuevaCitaId);

  // 3. Obtener credenciales de la instancia
  const instRes = await client.query(`
    SELECT instance_name, api_key 
    FROM instancias_evolution 
    WHERE business_id = $1 AND status = 'conectado'
    LIMIT 1
  `, [businessId]);

  const { instance_name, api_key } = instRes.rows[0];

  // 4. Texto Tiempo 1
  const textoTiempo1 = '🌸 Qué alegría haberte tenido con nosotras.\n\nUna preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇';

  // 5. Enviar por Evolution API con linkPreview: false
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
        console.log('Evolution Tiempo 1 enviado (status ' + res.statusCode + '):', body.substring(0, 150));
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

  console.log('Cita #%s armada y encuesta enviada exitosamente.', nuevaCitaId);
  await client.end();
}

run().catch(console.error);
