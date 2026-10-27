const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  // 1. Actualizar las plantillas de queja en Glamour y Capricho
  // Texto seleccionado: Opción 1 sin el nombre del salón:
  // "Ay {nombre_cliente}, qué pena tan grande leer esto 🥺 Queremos que siempre salgas feliz y consentida con nosotras.
  // ¿Me cuentas qué pasó con {servicio}? Ya pausé todo para leerte con atención y solucionarlo juntas de inmediato 🙏💕"

  const nuevoCopyQueja = `Ay {nombre_cliente}, qué pena tan grande leer esto 🥺 Queremos que siempre salgas feliz y consentida con nosotras.

¿Me cuentas qué pasó con {servicio}? Ya pausé todo para leerte con atención y solucionarlo juntas de inmediato 🙏💕`;

  await client.query(`
    UPDATE public.plantillas_automatizacion
    SET contenido = $1, updated_at = now()
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
      AND flujo IN ('fidelizacion_queja', 'calificacion_queja');
  `, [nuevoCopyQueja]);

  console.log('Plantillas de fidelizacion_queja actualizadas en Glamour y Capricho.');

  // Si no había, insertar una activa
  const check = await client.query(`
    SELECT id FROM public.plantillas_automatizacion
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
      AND flujo = 'fidelizacion_queja';
  `);

  if (check.rows.length === 0) {
    await client.query(`
      INSERT INTO public.plantillas_automatizacion (
        business_id, flujo, nombre, contenido, activo, canal
      ) VALUES (
        '4b004ede-64e0-4f30-84fd-190a17b369eb',
        'fidelizacion_queja',
        'Atención inmediata a calificación baja',
        $1,
        true,
        'whatsapp'
      );
    `, [nuevoCopyQueja]);
    console.log('Plantilla fidelizacion_queja creada.');
  }

  await client.end();
}

main().catch(console.error);
