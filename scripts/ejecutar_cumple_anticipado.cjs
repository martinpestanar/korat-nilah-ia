const https = require('https');
const { Client } = require('pg');

const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });
const BUSINESS_ID = '4b004ede-64e0-4f30-84fd-190a17b369eb';
const PHONE = '51926285289';

async function ejecutarCumpleAnticipado() {
  await client.connect();

  // 1. Simular fecha de nacimiento: Faltan exactamente 6 días para el cumple de Valeria
  const fechaCumple = new Date();
  fechaCumple.setDate(fechaCumple.getDate() + 6);
  const mm = String(fechaCumple.getMonth() + 1).padStart(2, '0');
  const dd = String(fechaCumple.getDate()).padStart(2, '0');
  const cumpleStr = `1998-${mm}-${dd}`;

  await client.query(`
    UPDATE "Clientes" 
    SET cumpleanos = $1, bot_pausado = false 
    WHERE telefono LIKE '%926285289%' AND business_id = $2;
  `, [cumpleStr, BUSINESS_ID]);

  console.log(`✅ Cumpleaños de Valeria fijado en: ${cumpleStr} (dentro de 6 días)`);

  // 2. Redactar copy optimizado de cumpleaños anticipado
  const mensajeCumpleAnticipado = `¡Hola Valeria! 🌸✨\n\nEn *Glamour y Capricho* ya estamos en modo celebración porque se acerca tu cumpleaños 🎂🎉\n\nQueremos consentirte como te mereces: te tenemos preparado un *Tratamiento Spa de cortesía* de regalo al reservar tu servicio favorito esta semana 🎁💅\n\n¿Qué día te gustaría agendar para dejarte radiante antes de tu día especial? 🗓️💕`;

  // 3. Registrar en tabla mensajes
  await client.query(`
    INSERT INTO public.mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      $1, 2228, $2, 'saliente', 'texto', 'enviado', 'cumpleanos_anticipado'
    );
  `, [BUSINESS_ID, mensajeCumpleAnticipado]);

  // 4. Enviar a tu WhatsApp real
  const postData = JSON.stringify({
    number: PHONE,
    linkPreview: false,
    text: mensajeCumpleAnticipado
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
      console.log('Mensaje de cumpleaños anticipado enviado a WhatsApp:', res.statusCode);
      client.end();
    });
  });
  req.write(postData);
  req.end();
}

ejecutarCumpleAnticipado().catch(console.error);
