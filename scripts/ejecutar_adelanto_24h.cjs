const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();

  console.log('Ejecutando adelanto de 24 horas en MODO REAL (PRODUCCIÓN)...');

  const res = await client.query(`
    SELECT public.simular_respuesta_tiempo2_fidelizacion(
      p_business_id => '4b004ede-64e0-4f30-84fd-190a17b369eb',
      p_telefono_cliente => '51981482289',
      p_nota => '2',
      p_nombre_cliente => 'Martin',
      p_servicio => 'Balayage Iluminación & Matiz',
      p_es_simulacion => false,
      p_forzar_24h_resumen => true
    ) AS resultado
  `);

  console.log('Resultado 24h:', JSON.stringify(res.rows[0].resultado, null, 2));

  // Registrar en tabla mensajes para que conste en el historial de chat de CRM
  const mensajeTexto = res.rows[0].resultado.mensaje;
  await client.query(`
    INSERT INTO mensajes (
      business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
    ) VALUES (
      '4b004ede-64e0-4f30-84fd-190a17b369eb',
      2249,
      $1,
      'saliente',
      'texto',
      'enviado',
      'resumen_24h_fidelizacion'
    )
  `, [mensajeTexto]);
  console.log('Registrado en historial de mensajes.');

  await client.end();
}

run().catch(console.error);
