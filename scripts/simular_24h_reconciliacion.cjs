const https = require('https');
const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
const BUSINESS_ID = '4b004ede-64e0-4f30-84fd-190a17b369eb';
const PHONE = '51926285289';

async function simular24HorasReconciliacion() {
  await client.connect();

  const clienteId = 2228;
  const citaId = 1394;

  // 1. Simular paso de 24 horas: despausar el bot de Valeria
  await client.query(`
    UPDATE "Clientes" 
    SET bot_pausado = false, 
        bot_pausado_hasta = NULL,
        bot_pausado_razon = '24 horas cumplidas tras atención de feedback'
    WHERE id = $1;
  `, [clienteId]);
  console.log('✅ Bot de Valeria despausado (simulación de 24 horas cumplidas).');

  // 2. Registrar el sello de cortesía/visita diferido
  const sellosAntes = await client.query(`SELECT public.fn_sellos_activos($1, $2);`, [clienteId, BUSINESS_ID]);
  const sAntes = parseInt(sellosAntes.rows[0].fn_sellos_activos || 0);

  // Dar 1 de bienvenida si tenía 0 + 1 de la cita = 2 sellos
  if (sAntes === 0) {
    await client.query(`
      INSERT INTO sellos_movimientos (business_id, cliente_id, cantidad, motivo, total_post, created_at)
      VALUES ($1, $2, 1, 'bienvenida', 1, now());
    `, [BUSINESS_ID, clienteId]);
  }

  const nuevoTotal = (sAntes === 0 ? 2 : sAntes + 1);
  await client.query(`
    INSERT INTO sellos_movimientos (business_id, cliente_id, cita_id, cantidad, motivo, total_post, created_at, notas)
    VALUES ($1, $2, $3, 1, 'cita', $4, now(), 'Acreditación diferida 24h tras atención de feedback');
  `, [BUSINESS_ID, clienteId, citaId, nuevoTotal]);

  const cardUrl = `https://app.koratflow.com/club/glamour-y-capricho?c=${clienteId}`;
  const mensajeReconciliacion = `Hola Valeria 🌸, para nosotros tu experiencia es lo primero. Queremos confirmarte que los sellos de tu visita ya fueron acreditados a tu tarjeta VIP (${nuevoTotal} de 12 sellos). Tu opinión nos ayuda a mejorar cada día y esperamos volver a consentirte pronto con el servicio de excelencia que mereces ✨\n\n📲 *Tu tarjeta digital:* ${cardUrl}`;

  // 3. Registrar mensaje en tabla mensajes
  await client.query(`
    INSERT INTO public.mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      $1, $2, $3, 'saliente', 'texto', 'enviado', 'reconciliacion_24h'
    );
  `, [BUSINESS_ID, clienteId, mensajeReconciliacion]);

  // 4. Enviar directamente a tu WhatsApp por Evolution API
  const postData = JSON.stringify({ number: PHONE, linkPreview: false, text: mensajeReconciliacion });
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
      console.log('Mensaje de reconciliación enviado a WhatsApp:', res.statusCode);
      client.end();
    });
  });
  req.write(postData);
  req.end();
}

simular24HorasReconciliacion().catch(console.error);
