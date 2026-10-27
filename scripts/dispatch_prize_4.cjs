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

  // 1. Obtener el premio generado para cita 1401
  const pRes = await client.query(`
    SELECT codigo_canje, roadmap_id
    FROM sellos_premios_ganados
    WHERE cita_id = 1401
    ORDER BY id DESC LIMIT 1
  `);

  let codigo = 'GLOW-9452EF';
  if (pRes.rows.length) {
    codigo = pRes.rows[0].codigo_canje;
  }

  // 2. Obtener instancia
  const instRes = await client.query(`
    SELECT instance_name, api_key 
    FROM instancias_evolution 
    WHERE business_id = $1 AND status = 'conectado'
    LIMIT 1
  `, [businessId]);

  const { instance_name, api_key } = instRes.rows[0];

  const mensajeTexto = `¡Sii, nos alegra un montón que te haya encantado! Y las buenas noticias siguen... 👑🥂\n\n¡Acabas de desbloquear tu primer premio del Club Glow! 🎉\n🎁 *Regalo:* Bono Consentida: S/ 10 en tu cuenta\n🎟️ *Código de canje:* \`${codigo}\`\n*(Solo muéstralo en recepción en tu próxima visita)*.\n\n📲 *Tu premio ya quedó guardado en tu tarjeta digital:*\nhttps://koratflow.agency/club/glamour-y-capricho?c=2249`;
  const mediaUrl = 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_4.jpg';

  console.log('Enviando imagen y premio por sendMedia a Evolution API...');
  const payload = JSON.stringify({
    number: telefono,
    mediatype: 'image',
    mimetype: 'image/jpeg',
    caption: mensajeTexto,
    media: mediaUrl
  });

  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'evo.koratflow.agency',
      path: `/message/sendMedia/${instance_name}`,
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
        console.log('Evolution sendMedia status:', res.statusCode, body.substring(0, 150));
        resolve(res.statusCode);
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  // 3. Registrar en mensajes
  await client.query(`
    INSERT INTO mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen, url_archivo
    ) VALUES (
      $1, $2, $3, 'saliente', 'imagen', 'enviado', 'recompensa_fidelizacion_premio', $4
    )
  `, [businessId, clienteId, mensajeTexto, mediaUrl]);

  // 4. Actualizar cita 1401 con calificacion 4
  await client.query(`
    UPDATE "Citas"
    SET calificacion = '4',
        fecha_feedback = NOW(),
        updated_at = NOW()
    WHERE id = 1401
  `);

  console.log('Mensaje de Premio enviado y registrado con éxito!');
  await client.end();
}
run().catch(console.error);
