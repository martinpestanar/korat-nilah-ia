const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const bizId = '4b004ede-64e0-4f30-84fd-190a17b369eb';

  // 1. Activar sellos en el negocio
  await client.query(`
    UPDATE negocios
    SET modo_fidelizacion = 'sellos',
        recursos_saas = jsonb_set(
          COALESCE(recursos_saas, '{}'::jsonb),
          '{sellos_addons}',
          '{"calificaciones_integradas": true, "cumpleanos_vip": true, "iman_rescate": true, "guardian_cierre": true}'::jsonb
        )
    WHERE id = $1;
  `, [bizId]);

  // 2. Activar sellos_config si no existe
  await client.query(`
    INSERT INTO sellos_config (
      business_id, valor_sello_base, moneda, max_sellos_por_visita,
      vencimiento_sellos_meses, vencimiento_premio_dias, bienvenida_activo, total_sellos_roadmap
    )
    VALUES (
      $1, 30, 'PEN', 2, 6, 60, true, 8
    )
    ON CONFLICT (business_id) DO UPDATE SET
      total_sellos_roadmap = 8,
      addons_activos = '{"cumpleanos": true, "calificaciones": true}'::jsonb;
  `, [bizId]);

  // 3. Crear roadmap básico si no tiene (Hito 4 y Hito 8)
  const roadmapCount = await client.query(`
    SELECT count(*) FROM sellos_roadmap WHERE business_id = $1;
  `, [bizId]);

  if (parseInt(roadmapCount.rows[0].count) === 0) {
    await client.query(`
      INSERT INTO sellos_roadmap (business_id, hito_sello, nombre, descripcion, costo_interno, activo)
      VALUES 
        ($1, 4, 'Spa Cutículas & Hidratación Express', 'Tratamiento exprés de nutrición y brillo para tus manos.', 8, true),
        ($1, 8, 'Manicure Ruso / Servicio VIP', 'Servicio completo de consentirte con acabado de lujo.', 20, true);
    `, [bizId]);
    console.log('✓ Roadmap de 2 hitos (4 y 8 sellos) creado para Glamour y Capricho');
  } else {
    console.log('✓ Glamour y Capricho ya tenía hitos configurados:', roadmapCount.rows[0].count);
  }

  console.log('✓ Paquete Club Glow + Calificaciones + Cumpleaños activado al 100% para Glamour y Capricho');
  await client.end();
}

run().catch(console.error);
