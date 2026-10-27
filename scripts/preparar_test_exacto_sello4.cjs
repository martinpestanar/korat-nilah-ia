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

  console.log('1. Ajustando a Martin exactamente a 2 sellos...');
  await client.query('DELETE FROM sellos_premios_ganados WHERE cliente_id = $1 AND business_id = $2', [clienteId, businessId]);
  await client.query('DELETE FROM sellos_sobrante WHERE cliente_id = $1 AND business_id = $2', [clienteId, businessId]);
  await client.query('DELETE FROM sellos_movimientos WHERE cliente_id = $1 AND business_id = $2', [clienteId, businessId]);

  // Insertar 2 sellos
  await client.query(`
    INSERT INTO sellos_movimientos (business_id, cliente_id, cantidad, motivo, total_post, created_at)
    VALUES ($1, $2, 2, 'cita', 2, now())
  `, [businessId, clienteId]);

  const sRes = await client.query('SELECT public.fn_sellos_activos($1, $2) as sellos', [clienteId, businessId]);
  console.log('Sellos base antes de la cita:', sRes.rows[0].sellos);

  // 2. Limpiar pausas
  await client.query(`
    UPDATE "Clientes"
    SET bot_pausado = false,
        bot_pausado_hasta = NULL,
        bot_pausado_razon = NULL
    WHERE id = $1
  `, [clienteId]);

  // 3. Resetear Cita 1402 (precio S/ 35: en martes doble da 1x2 = 2 sellos -> 2 + 2 = 4 exactos)
  await client.query(`
    UPDATE "Citas"
    SET precio = 35,
        calificacion = NULL,
        feedback_cliente = NULL,
        encuesta_enviada = true,
        fecha_encuesta_enviada = NOW(),
        estado = 'Completada'
    WHERE id = 1402
  `);
  console.log('Cita 1402 lista.');

  // 4. Enviar Tiempo 1 por Evolution API
  const instRes = await client.query(`
    SELECT instance_name, api_key 
    FROM instancias_evolution 
    WHERE business_id = $1 AND status = 'conectado'
    LIMIT 1
  `, [businessId]);

  const { instance_name, api_key } = instRes.rows[0];
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

  console.log('Listo. Cuando Martin responda 4 o 5, pasará de 2 a 4 sellos y desbloqueará el premio.');
  await client.end();
}

run().catch(console.error);
