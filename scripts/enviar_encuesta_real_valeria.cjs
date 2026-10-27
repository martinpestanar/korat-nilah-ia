const https = require('https');
const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
const BUSINESS_ID = '4b004ede-64e0-4f30-84fd-190a17b369eb';
const PHONE = '51926285289';

function sendWhatsAppText(instanceName, apiKey, number, text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      number: number,
      linkPreview: false,
      text: text
    });

    const options = {
      hostname: 'evo.koratflow.agency',
      port: 443,
      path: `/message/sendText/${instanceName}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

async function startRealStep1() {
  await client.connect();

  // 1. Obtener cliente
  let cl = await client.query(`SELECT * FROM "Clientes" WHERE business_id = $1 AND telefono = $2`, [BUSINESS_ID, PHONE]);
  const cliente = cl.rows[0];

  // 2. Limpiar citas y sellos de prueba para empezar de cero
  await client.query(`DELETE FROM "Citas" WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
  await client.query(`DELETE FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
  await client.query(`DELETE FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
  await client.query(`DELETE FROM sellos_premios_ganados WHERE cliente_id = $1 AND business_id = $2`, [cliente.id, BUSINESS_ID]);
  await client.query(`UPDATE "Clientes" SET bot_pausado = false, bot_pausado_hasta = null, cumpleanos = null WHERE id = $1`, [cliente.id]);

  // 3. Crear Cita #1 en estado Completada con encuesta_enviada = true
  const cRes = await client.query(`
    INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada)
    VALUES ($1, $2, 'Lifting de Pestañas', 50.00, CURRENT_DATE, 'Completada', true)
    RETURNING id;
  `, [BUSINESS_ID, cliente.id]);
  const citaId = cRes.rows[0].id;

  // 4. Obtener instancia conectada
  const instRes = await client.query(`
    SELECT instance_name, api_key FROM instancias_evolution WHERE business_id = $1 AND status = 'conectado' LIMIT 1;
  `, [BUSINESS_ID]);
  const inst = instRes.rows[0];

  // 5. Redactar el mensaje oficial de encuesta de satisfacción
  const mensajeEncuesta = `¡Hola Valeria! 🌸 Esperamos que hayas disfrutado tu *Lifting de Pestañas* en *Glamour y Capricho* ✨\n\nDel *1 al 5*, ¿cómo calificarías tu atención hoy? (Responde solo con el número) 👇`;

  // Registrar en tabla mensajes
  await client.query(`
    INSERT INTO public.mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      $1, $2, $3, 'saliente', 'texto', 'enviado', 'fidelizacion_encuesta'
    );
  `, [BUSINESS_ID, cliente.id, mensajeEncuesta]);

  // 6. Enviar mensaje REAL por WhatsApp vía Evolution API
  console.log(`Enviando encuesta real a ${PHONE} via ${inst.instance_name}...`);
  const sendRes = await sendWhatsAppText(inst.instance_name, inst.api_key, PHONE, mensajeEncuesta);
  console.log('Resultado envío:', sendRes);

  await client.end();
}

startRealStep1().catch(console.error);
