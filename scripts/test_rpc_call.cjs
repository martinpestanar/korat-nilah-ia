const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function testRpc() {
  await client.connect();

  const bizId = '4b004ede-64e0-4f30-84fd-190a17b369eb';
  const res = await client.query(`
    SELECT public.disparar_prueba_autopilot_produccion(
      p_business_id => $1,
      p_flujo => 'fidelizacion',
      p_telefono_destino => '51926285289',
      p_nombre_cliente => 'Valeria',
      p_servicio => 'Lifting de Pestañas',
      p_fecha_cita => 'Hoy 25/10',
      p_hora_cita => '2:55 p. m.',
      p_especialista => 'Staff Glamour',
      p_cita_id => NULL,
      p_es_simulacion => true,
      p_precio => 80,
      p_plantilla_id => NULL
    ) as result;
  `, [bizId]);

  console.log('Resultado de la prueba RPC directa:', res.rows[0]?.result);
  await client.end();
}

testRpc().catch(console.error);
