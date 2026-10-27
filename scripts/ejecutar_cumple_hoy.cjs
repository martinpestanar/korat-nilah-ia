const https = require('https');
const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
const BUSINESS_ID = '4b004ede-64e0-4f30-84fd-190a17b369eb';
const PHONE = '51926285289';

async function ejecutarCumpleHoy() {
  await client.connect();

  const clienteId = 2228;

  // 1. Simular fecha de nacimiento: HOY es el cumpleaños de Valeria
  const hoy = new Date();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const cumpleHoyStr = `1998-${mm}-${dd}`;

  await client.query(`
    UPDATE "Clientes" 
    SET cumpleanos = $1, bot_pausado = false 
    WHERE id = $2;
  `, [cumpleHoyStr, clienteId]);
  console.log(`✅ Fecha de cumpleaños de Valeria actualizada a HOY (${cumpleHoyStr})`);

  // 2. Limpiar movimientos previos de cumpleaños para la prueba
  await client.query(`DELETE FROM sellos_movimientos WHERE cliente_id = $1 AND motivo = 'cumpleanos';`, [clienteId]);

  // 3. Ejecutar función de regalo de cumpleaños
  const resRegalo = await client.query(`
    SELECT public.fn_otorgar_sellos_cumpleanos($1, $2) as resultado;
  `, [clienteId, BUSINESS_ID]);
  const calculo = resRegalo.rows[0]?.resultado;
  console.log('Resultado cálculo cumpleaños:', calculo);

  const sellosPost = calculo.sellos_resultantes || 3;
  const premioNombre = calculo.premio_nombre || 'Spa Cutículas & Hidratación Express';
  const sellosFaltan = calculo.sellos_faltantes_post_regalo || 1;

  // 4. Redactar copy cálido de cumpleaños con sellos de regalo
  const cardUrl = `https://koratflow.agency/club/glamour-y-capricho?c=${clienteId}`;
  const mensajeCumpleHoy = `¡Feliz cumpleaños, Valeria! 🥳🎂🎉👑\n\nDe parte de todo el equipo de *Glamour y Capricho*, te deseamos un día maravilloso, lleno de amor, sonrisas y mucha magia ✨\n\n🎁 *Tu regalo de cumpleaños en el Club Glow:*\n¡Te regalamos *+1 Sello VIP* de cumpleaños directo a tu tarjeta! Ahora tienes *${sellosPost} de 12 sellos*.\n\n🎯 Estás a solo *${sellosFaltan} sello* de desbloquear tu premio: *${premioNombre}* 💕\n\n📲 *Mira tu tarjeta de regalo en vivo:* ${cardUrl}`;

  // 5. Registrar en tabla mensajes
  await client.query(`
    INSERT INTO public.mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      $1, $2, $3, 'saliente', 'texto', 'enviado', 'cumpleanos_dia_d'
    );
  `, [BUSINESS_ID, clienteId, mensajeCumpleHoy]);

  // 6. Enviar a tu WhatsApp con presencia simulada de mecanografía
  const postData = JSON.stringify({
    number: PHONE,
    linkPreview: false,
    text: mensajeCumpleHoy,
    options: {
      delay: 3200,
      presence: 'composing'
    }
  });

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
      console.log('Mensaje de cumpleaños con sellos enviado a WhatsApp:', res.statusCode);
      client.end();
    });
  });
  req.write(postData);
  req.end();
}

ejecutarCumpleHoy().catch(console.error);
