const https = require('https');
const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
const BUSINESS_ID = '4b004ede-64e0-4f30-84fd-190a17b369eb';
const PHONE = '51926285289';

async function resetAndSend() {
  await client.connect();

  const cl = await client.query(`SELECT id FROM "Clientes" WHERE business_id = $1 AND telefono = $2;`, [BUSINESS_ID, PHONE]);
  const clienteId = cl.rows[0].id;

  // Limpiar citas y sellos
  await client.query(`DELETE FROM "Citas" WHERE cliente_id = $1 AND business_id = $2;`, [clienteId, BUSINESS_ID]);
  await client.query(`DELETE FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2;`, [clienteId, BUSINESS_ID]);
  await client.query(`DELETE FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2;`, [clienteId, BUSINESS_ID]);
  await client.query(`DELETE FROM sellos_premios_ganados WHERE cliente_id = $1 AND business_id = $2;`, [clienteId, BUSINESS_ID]);
  await client.query(`UPDATE "Clientes" SET bot_pausado = false, bot_pausado_hasta = null WHERE id = $1;`, [clienteId]);

  // Crear Cita #1 limpia en estado Completada, calificacion NULL
  const c = await client.query(`
    INSERT INTO "Citas" (business_id, cliente_id, servicio, precio, fecha, estado, encuesta_enviada, calificacion)
    VALUES ($1, $2, 'Lifting de Pestañas', 50.00, CURRENT_DATE, 'Completada', true, NULL)
    RETURNING id;
  `, [BUSINESS_ID, clienteId]);
  const citaId = c.rows[0].id;

  const msg = `¡Hola Valeria! 🌸 Esperamos que hayas disfrutado tu *Lifting de Pestañas* en *Glamour y Capricho* ✨\n\nDel *1 al 5*, ¿cómo calificarías tu atención hoy? (Responde solo con el número) 👇`;

  // Registrar en mensajes
  await client.query(`
    INSERT INTO public.mensajes (business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen)
    VALUES ($1, $2, $3, 'saliente', 'texto', 'enviado', 'fidelizacion_encuesta');
  `, [BUSINESS_ID, clienteId, msg]);

  // Enviar a WhatsApp via Evolution
  const postData = JSON.stringify({ number: PHONE, linkPreview: false, text: msg });
  const options = {
    hostname: 'evo.koratflow.agency',
    port: 443,
    path: '/message/sendText/glamour_y_capricho_1790187774',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': '63EDE79A-409B-4190-BB0E-299095BF59A2',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('Encuesta reenviada a Valeria con éxito. Status:', res.statusCode);
      client.end();
    });
  });
  req.write(postData);
  req.end();
}

resetAndSend().catch(console.error);
