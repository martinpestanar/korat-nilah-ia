const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function pauseAll() {
  await client.connect();

  // 1. Pausar bot_enabled y todos los flujos activos para Glamour y Capricho de inmediato
  const r1 = await client.query(`
    UPDATE negocios
    SET bot_config = jsonb_set(
      jsonb_set(COALESCE(bot_config, '{}'::jsonb), '{bot_enabled}', 'false'::jsonb, true),
      '{flujos_activos}',
      '{"fidelizacion": false, "recordatorios": false, "rescate": false, "cuidados": false, "cumpleanos": false, "retoques": false, "mantenimiento": false}'::jsonb,
      true
    )
    WHERE slug = 'glamour-y-capricho'
    RETURNING id, nombre, bot_config;
  `);
  console.log('Negocio pausado en BD:', r1.rows[0]?.nombre, 'bot_config:', JSON.stringify(r1.rows[0]?.bot_config));

  // 2. Apagar recursos_saas automatizaciones también para blindar todo
  await client.query(`
    UPDATE negocios
    SET recursos_saas = jsonb_set(
      jsonb_set(COALESCE(recursos_saas, '{}'::jsonb), '{automatizaciones,permitir_post_cita}', 'false'::jsonb, true),
      '{automatizaciones,post_cita_activo}', 'false'::jsonb, true
    )
    WHERE slug = 'glamour-y-capricho'
  `);
  console.log('recursos_saas automatizaciones post_cita apagado.');

  // 3. Revisar qué tablas de cola o mensajes existen y cancelar envíos pendientes
  const tables = ['cola_mensajes', 'mensajes_cola', 'mensajes_programados', 'campaign_queue', 'notificaciones_cola', 'sellos_cola'];
  for (const t of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`Tabla ${t}: ${res.rows[0].count} registros`);
      const upd = await client.query(`UPDATE ${t} SET estado = 'cancelado_emergencia' WHERE estado IN ('pendiente', 'ready', 'en_cola')`);
      console.log(`Cancelados en ${t}: ${upd.rowCount}`);
    } catch (e) {
      // Ignorar si no existe la tabla
    }
  }

  // 4. Ver los últimos 10 mensajes enviados por el sistema o salientes para saber a quién se le envió y qué
  const msgs = await client.query(`
    SELECT id, created_at, emisor, receptor, tipo, contenido, estado
    FROM mensajes
    ORDER BY created_at DESC
    LIMIT 10
  `);
  console.log('Últimos 10 mensajes en tabla mensajes:');
  console.log(JSON.stringify(msgs.rows, null, 2));

  await client.end();
}

pauseAll().catch(console.error);
