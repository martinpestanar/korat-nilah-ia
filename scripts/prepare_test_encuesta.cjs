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

  // 1. Consultar sellos actuales
  const sellosRes = await client.query('SELECT public.fn_sellos_activos($1, $2) as sellos', [clienteId, businessId]);
  console.log('Sellos activos actuales de Martin:', sellosRes.rows[0].sellos);

  // 2. Resetear Cita 1398 para la prueba
  await client.query(`
    UPDATE "Citas"
    SET calificacion = NULL,
        feedback_cliente = NULL,
        encuesta_enviada = true,
        fecha_encuesta_enviada = NOW(),
        estado = 'Completada'
    WHERE id = 1398
  `);
  console.log('Cita 1398 reseteada para recibir calificación.');

  // 3. Obtener credenciales de la instancia
  const instRes = await client.query(`
    SELECT instance_name, api_key 
    FROM instancias_evolution 
    WHERE business_id = $1 AND status = 'conectado'
    LIMIT 1
  `, [businessId]);

  if (!instRes.rows.length) {
    throw new Error('No se encontró instancia conectada para Glamour y Capricho');
  }

  const { instance_name, api_key } = instRes.rows[0];
  console.log('Instancia Evolution:', instance_name);

  // 4. Mensaje Tiempo 1
  const textoTiempo1 = '🌸 Qué alegría haberte tenido con nosotras.\n\nUna preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇';

  // 5. Enviar mensaje por Evolution API con linkPreview: false
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

  const sendPromise = new Promise((resolve, reject) => {
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
        console.log('Respuesta Evolution Tiempo 1 (status ' + res.statusCode + '):', body.substring(0, 200));
        resolve(res.statusCode);
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  await sendPromise;

  // 6. Registrar en mensajes
  await client.query(`
    INSERT INTO mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      $1, $2, $3, 'saliente', 'texto', 'enviado', 'encuesta_fidelizacion'
    )
  `, [businessId, clienteId, textoTiempo1]);

  console.log('Mensaje Tiempo 1 registrado en la base de datos.');
  await client.end();
}

run().catch(console.error);
