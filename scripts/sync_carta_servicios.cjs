/**
 * Script para poblar carta_servicios y carta_categorias para los salones
 * que tenían vitrina vacía, asegurando destacados y fotos.
 */

const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function syncCartaServicios() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();

  const negRes = await client.query('SELECT id FROM negocios WHERE activo = true;');
  let agregados = 0;

  for (const row of negRes.rows) {
    const bId = row.id;
    // Chequear si tiene carta_servicios
    const csCheck = await client.query('SELECT count(*) as count FROM carta_servicios WHERE business_id = $1;', [bId]);
    if (parseInt(csCheck.rows[0].count) === 0) {
      // Tomar de servicios o de plantillas
      const srvRes = await client.query('SELECT * FROM servicios WHERE business_id = $1;', [bId]);
      let items = srvRes.rows;

      if (items.length === 0) {
        const plantillasRes = await client.query('SELECT * FROM plantillas_servicios LIMIT 6;');
        items = plantillasRes.rows.map(p => ({
          nombre: p.nombre,
          precio: Number(p.precio_sugerido) || 60,
          duracion: p.duracion_min || 45,
          categoria: p.categoria_nombre || 'Belleza & Estilo',
          imagen_url: p.media_url,
          descripcion_detallada: p.descripcion
        }));
      }

      // Agrupar por categoría
      const catMap = {};
      for (const item of items) {
        const cName = item.categoria || 'Servicios Destacados';
        if (!catMap[cName]) catMap[cName] = [];
        catMap[cName].push(item);
      }

      let cOrden = 0;
      for (const cName in catMap) {
        cOrden++;
        let catId;
        const existCat = await client.query('SELECT id FROM carta_categorias WHERE business_id = $1 AND nombre = $2 LIMIT 1;', [bId, cName]);
        if (existCat.rows.length > 0) {
          catId = existCat.rows[0].id;
        } else {
          const insCat = await client.query('INSERT INTO carta_categorias (business_id, nombre, emoji, orden, activo, created_at) VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id;', [bId, cName, '✨', cOrden]);
          catId = insCat.rows[0].id;
        }

        let sOrden = 0;
        for (const it of catMap[cName]) {
          sOrden++;
          const esDestacado = sOrden === 1;
          const insertSql = `
            INSERT INTO carta_servicios (
              business_id, categoria_id, nombre, descripcion, precio, 
              precio_original, duracion_min, media_url, destacado, orden, activo, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW()
            );
          `;

          await client.query(insertSql, [
            bId,
            catId,
            it.nombre,
            it.descripcion_detallada || 'Servicio profesional de ' + it.nombre + '.',
            Number(it.precio) || 50,
            Math.round((Number(it.precio) || 50) * 1.25),
            it.duracion || 45,
            it.imagen_url || null,
            esDestacado,
            sOrden
          ]);
          agregados++;
        }
      }
    }
  }

  console.log('✅ Sincronización completa. Servicios añadidos a carta_servicios:', agregados);
  await client.end();
}

syncCartaServicios().catch(e => { console.error('Error:', e); process.exit(1); });
