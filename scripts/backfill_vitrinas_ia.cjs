/**
 * Script de Backfill y Generación Masiva con IA para Vitrina Digital
 * Ejecuta el cruce de tablas en Supabase Korat.
 */

const { Client } = require('pg');

const CONNECTION_STRING = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

async function backfillVitrinas() {
  const client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
  console.log('⚡ Conectado a Supabase Korat...');

  // 1. Obtener todos los negocios activos
  const negRes = await client.query('SELECT * FROM negocios WHERE activo = true;');
  const negocios = negRes.rows;
  console.log('Total negocios activos:', negocios.length);

  // 2. Obtener los que ya tienen carta_config
  const cfgRes = await client.query('SELECT DISTINCT business_id FROM carta_config;');
  const conCarta = new Set(cfgRes.rows.map(r => r.business_id));

  let creados = 0;
  for (const neg of negocios) {
    const bId = neg.id;
    const yaTieneCarta = conCarta.has(bId);

    // Obtener servicios del negocio
    const srvRes = await client.query('SELECT * FROM servicios WHERE business_id = $1;', [bId]);
    let catalogo = srvRes.rows;

    if (catalogo.length === 0) {
      const plantillasRes = await client.query('SELECT * FROM plantillas_servicios LIMIT 6;');
      catalogo = plantillasRes.rows.map(p => ({
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio_sugerido) || 60,
        duracion: p.duracion_min || 45,
        categoria: p.categoria_nombre || 'Belleza & Estilo',
        imagen_url: p.media_url,
        descripcion_detallada: p.descripcion
      }));
    }

    // Ordenar servicios por precio
    const sorted = [...catalogo].sort((a,b) => (Number(b.precio)||0) - (Number(a.precio)||0));
    const servicioEstrella = sorted[0] || { nombre: 'Experiencia Glow VIP', precio: 120, categoria: 'Cuidado Facial' };
    const servicioFrecuente = catalogo[Math.floor(catalogo.length / 2)] || sorted[0] || { nombre: 'Corte & Estilo Personalizado', precio: 50, categoria: 'Cabello' };
    const servicioFlash = catalogo[catalogo.length - 1] || sorted[0] || { nombre: 'Manicura Express & Glow', precio: 35, categoria: 'Uñas' };

    // Horarios
    const horarioTexto = neg.hora_apertura && neg.hora_cierre
      ? 'Lunes a Sábado: ' + String(neg.hora_apertura).slice(0, 5) + ' - ' + String(neg.hora_cierre).slice(0, 5)
      : 'Lunes a Sábado: 09:00 - 19:00';

    // Fomo Banner (Promo Flash)
    const precioFlash = Number(servicioFlash.precio) || 40;
    const precioFlashOrig = Math.round(precioFlash * 1.3);
    const fomoBanner = {
      activo: true,
      titulo: '⚡ Promo Flash: ' + servicioFlash.nombre,
      subtitulo: 'Solo 3 cupos disponibles para hoy en tarifa exclusiva. Reserva en 1 clic.',
      descuento_tag: Math.round(((precioFlashOrig - precioFlash) / precioFlashOrig) * 100) + '% OFF',
      badge_emoji: '⚡',
      expira_en: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      enlace_whatsapp: true,
      cupos_activos: true,
      cupos_totales: 4,
      cupos_ocupados: 1
    };

    // Promo Dia (Martes de Glow)
    const precioFrec = Number(servicioFrecuente.precio) || 50;
    const promoDia = {
      id: 'dia_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      dia_semana: 2, // Martes
      activo: true,
      titulo: '✨ Martes Especial de ' + (servicioFrecuente.categoria || 'Glow'),
      badge_emoji: '✨',
      descripcion: 'Aprovecha tu martes con atención personalizada y diagnóstico de cortesía en ' + servicioFrecuente.nombre + '.',
      precio_regular: Math.round(precioFrec * 1.25),
      precio_promo: precioFrec,
      cupos_activos: true,
      cupos_totales: 6,
      cupos_ocupados: 2,
      servicios_nombres: servicioFrecuente.nombre
    };

    // Oferta Semana
    const ofertaSemana = {
      activa: true,
      titulo: 'Pack Semanal: ' + servicioFrecuente.nombre + ' + Cuidado Exprés',
      descripcion: 'Tratamiento completo diseñado para renovar tu imagen y mantener el resultado por semanas.',
      precio_original: Math.round(precioFrec * 1.35),
      precio_oferta: precioFrec,
      expira_en: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      duracion_tipo: '7_dias',
      etiqueta_tipo: 'combo',
      cupos_activos: true,
      cupos_totales: 5,
      cupos_ocupados: 2
    };

    // Promo Mes
    const promoMes = {
      activa: true,
      badge_texto: 'Experiencia VIP del Mes',
      badge_emoji: '👑',
      titulo: 'Transformación Premium: ' + servicioEstrella.nombre,
      descripcion: 'Protocolo de alta gama con productos de primera línea y resultados garantizados.',
      duracion_tipo: 'fin_de_mes',
      etiqueta_tipo: 'promo_mes'
    };

    // Si no tiene carta_config, crearla
    if (!yaTieneCarta) {
      const insertSql = `
        INSERT INTO carta_config (
          business_id, nombre_salon, logo_url, descripcion_header, 
          telefono_whatsapp, direccion, horario, paleta, layout_estilo, 
          tema_estacional, efectos_animados, fomo_banner, promos_dias, 
          oferta_semana, promo_mes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        );
      `;

      await client.query(insertSql, [
        bId,
        neg.nombre || 'Salón de Belleza',
        neg.logo_url || null,
        'Bienvenida a ' + (neg.nombre || 'nuestro salón') + '. Reserva tus citas online de forma rápida y segura.',
        neg.telefono_recepcionista || neg.booking_yape_numero || '',
        neg.ubicacion || '',
        horarioTexto,
        'rose',
        'pinterest',
        'normal',
        true,
        JSON.stringify(fomoBanner),
        JSON.stringify([promoDia]),
        JSON.stringify(ofertaSemana),
        JSON.stringify(promoMes)
      ]);
      creados++;
    }

    // Activar mes PRO en recursos_saas a todos los salones activos
    const rec = neg.recursos_saas || {};
    const mod = rec.modulos || {};
    const cDig = mod.carta_digital || {};
    const subP = cDig.sub_pestanas || {};

    const nuevoRec = {
      ...rec,
      vitrina_trial: {
        activo: true,
        iniciado_en: new Date().toISOString(),
        expira_en: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        tipo: 'primer_mes_pro_gratis'
      },
      modulos: {
        ...mod,
        carta_digital: {
          ...cDig,
          activo: true,
          sub_pestanas: {
            ...subP,
            branding_pro: true,
            antes_despues: true,
            fomo_countdown: true,
            agendamiento_directo: true
          }
        }
      }
    };

    await client.query('UPDATE negocios SET recursos_saas = $1 WHERE id = $2;', [JSON.stringify(nuevoRec), bId]);
  }

  console.log('✅ Finalizado con éxito. Nuevas vitrinas creadas:', creados);
  await client.end();
}

backfillVitrinas().catch(e => { console.error('Error en backfill:', e); process.exit(1); });
