const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  await client.connect();

  console.log('--- ACTUALIZANDO PLANTILLAS DE HITOS 4, 8 Y 12 SIN CÓDIGOS DE TEXTO ---');

  const res = await client.query('SELECT copys_calificacion_sellos FROM public.nilah_config LIMIT 1;');
  let copys = res.rows[0].copys_calificacion_sellos;

  copys = copys.map(item => {
    if (item.sello === 4) {
      item.copy = `¡Sii, qué alegría leerte, {nombre}! Y las buenas noticias siguen... 👑🥂

¡Desbloqueaste tu primer regalo del Club Glow! 🎉
🎁 *Regalo:* {premio_proximo}
*(Ya quedó activo en tu cuenta, solo pídelo en recepción en tu próxima visita)*.

📲 *Mira tu premio en tu tarjeta:* {link_tarjeta}

¡Disfruta mucho tu día! 💖`;
    } else if (item.sello === 8) {
      item.copy = `¡Qué felicidad, {nombre}! Y hoy te vas con premio... 🥂✨

¡Desbloqueaste tu segundo regalo VIP del Club Glow! 👑
🎁 *Premio:* {premio_proximo}
*(Listo en tu cuenta para disfrutarlo en tu próxima cita)*.

¡Entras a la recta final por la Gran Corona! 🌟
📲 *Ver tarjeta con premio:* {link_tarjeta}

¡Disfruta tu día al máximo! 💖`;
    } else if (item.sello === 12) {
      item.copy = `¡Qué felicidad tan grande, {nombre}! 🏆👑🎉

¡CORONASTE LA TARJETA COMPLETA DEL CLUB GLOW (12 de 12)! ✨
🎁 *Gran Regalo Reina:* {premio_proximo}
*(Listo en tu cuenta de clienta para reclamarlo en recepción)*.

¡Gracias por tu lealtad infinita! 💖
📲 *Mira tu tarjeta coronada:* {link_tarjeta}

¡Que tengas un día inolvidable! 👑✨`;
    }
    return item;
  });

  await client.query('UPDATE public.nilah_config SET copys_calificacion_sellos = $1;', [JSON.stringify(copys)]);
  console.log('Copys en nilah_config actualizados sin códigos.');

  // 2. Actualizar también la función encolar_cumpleanos (Versión B) para que no muestre el código
  const sqlCumple = `
CREATE OR REPLACE FUNCTION public.encolar_cumpleanos()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_total_encolados INT := 0;
  v_negocio RECORD;
  v_cliente RECORD;
  v_mensaje TEXT;
  v_telefono_limpio TEXT;
  v_hoy DATE := CURRENT_DATE;
  v_fecha_anticipada DATE;
  v_dias_anticipacion INT := 6;
  v_expira TIMESTAMPTZ;
  v_sellos_actuales INT;
  v_hito_objetivo INT;
  v_sellos_regalo INT;
  v_sellos_post INT;
  v_premio_nombre TEXT;
  v_card_url TEXT;
  v_media_premio_url TEXT;
  v_codigo_premio TEXT;
  v_ya_estaba_a_uno BOOLEAN := FALSE;
  v_roadmap_rec RECORD;
BEGIN
  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.bot_config, 
      n.recursos_saas,
      ie.instance_name,
      ie.api_key,
      n.slug
    FROM public.negocios n
    JOIN public.instancias_evolution ie ON ie.business_id = n.id AND ie.status = 'conectado'
    WHERE n.activo = true
      AND (
        (n.recursos_saas->'sellos_addons'->>'cumpleanos_vip')::boolean IS TRUE
        OR (n.recursos_saas->'sellos_addons'->>'cumpleanos')::boolean IS TRUE
        OR (n.bot_config->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
      )
  LOOP
    IF v_negocio.instance_name IS NULL OR v_negocio.api_key IS NULL THEN
      CONTINUE;
    END IF;

    v_dias_anticipacion := COALESCE(
      (v_negocio.bot_config->'cumpleanos_config'->>'dias_anticipacion')::int,
      6
    );
    v_fecha_anticipada := v_hoy + v_dias_anticipacion;

    -- =========================================================================
    -- TIEMPO 1: Anticipado (6 días antes) -> Dejarla a 1 sello o darle el premio
    -- =========================================================================
    FOR v_cliente IN
      SELECT c.id, c.nombre, c.telefono, c.cumpleanos
      FROM public."Clientes" c
      WHERE c.business_id = v_negocio.id
        AND c.telefono IS NOT NULL
        AND c.cumpleanos IS NOT NULL
        AND EXTRACT(MONTH FROM c.cumpleanos) = EXTRACT(MONTH FROM v_fecha_anticipada)
        AND EXTRACT(DAY FROM c.cumpleanos) = EXTRACT(DAY FROM v_fecha_anticipada)
        AND NOT EXISTS (
          SELECT 1 FROM public.mensajes m
          WHERE m.business_id = v_negocio.id
            AND m.cliente_id = c.id
            AND m.campana_origen = 'cumpleanos_anticipado'
            AND m.created_at >= (NOW() - INTERVAL '300 days')
        )
    LOOP
      v_telefono_limpio := REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g');
      IF LENGTH(v_telefono_limpio) < 8 THEN
        CONTINUE;
      END IF;

      v_sellos_actuales := public.fn_sellos_activos(v_cliente.id, v_negocio.id);
      
      -- Buscar dinámicamente el próximo hito real en sellos_roadmap del negocio
      SELECT r.hito_sello, r.nombre INTO v_roadmap_rec
      FROM public.sellos_roadmap r
      WHERE r.business_id = v_negocio.id AND r.activo = true AND r.hito_sello > v_sellos_actuales
      ORDER BY r.hito_sello ASC
      LIMIT 1;

      IF v_roadmap_rec.hito_sello IS NOT NULL THEN
        v_hito_objetivo := v_roadmap_rec.hito_sello;
        v_premio_nombre := v_roadmap_rec.nombre;
      ELSE
        -- Si ya superó todos los hitos, tomar el hito mayor
        SELECT r.hito_sello, r.nombre INTO v_roadmap_rec
        FROM public.sellos_roadmap r
        WHERE r.business_id = v_negocio.id AND r.activo = true
        ORDER BY r.hito_sello DESC
        LIMIT 1;
        v_hito_objetivo := COALESCE(v_roadmap_rec.hito_sello, 4);
        v_premio_nombre := COALESCE(v_roadmap_rec.nombre, 'Regalo VIP Sorpresa');
      END IF;

      -- Imagen 3D del hito (4, 8 o 12)
      v_media_premio_url := 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_' || v_hito_objetivo || '.jpg';
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cliente.id;

      -- =======================================================================
      -- EVALUACIÓN DE LAS 2 VERSIONES:
      -- =======================================================================
      -- VERSIÓN B: Ya estaba a solo 1 sello de ganar (ej. 3 de 4, 7 de 8, 11 de 12)
      IF v_sellos_actuales = (v_hito_objetivo - 1) THEN
        v_ya_estaba_a_uno := TRUE;
        v_sellos_regalo := 1;
        v_sellos_post := v_hito_objetivo;

        -- Generar código de canje interno
        v_codigo_premio := 'GLOW-CUMPLE-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 4));

        -- Registrar premio ganado
        INSERT INTO sellos_premios_ganados (
          business_id, cliente_id, codigo_canje, estado, ganado_en, expira_en
        ) VALUES (
          v_negocio.id, v_cliente.id, v_codigo_premio, 'pendiente', now(), now() + interval '60 days'
        ) ON CONFLICT DO NOTHING;

        -- Copy Versión B: Sin código textual, experiencia VIP limpia
        v_mensaje := '¡Sorpresa de cumpleaños, ' || public.extraer_primer_nombre(v_cliente.nombre) || '! 🎁🎂👑' || E'\n\n' ||
          'En *' || v_negocio.nombre || '* ya estamos en modo celebración y te regalamos el sellito que te faltaba.' || E'\n\n' ||
          '🎉 ¡DESBLOQUEASTE TU PREMIO DE CUMPLEAÑOS!' || E'\n' ||
          '🎁 *' || v_premio_nombre || '*' || E'\n' ||
          '*(Ya está activo en tu cuenta para tu próxima cita de esta semana)*.' || E'\n\n' ||
          'Ven a consentirte y te lo llevas totalmente gratis al realizar tu servicio favorito ✨' || E'\n\n' ||
          '📲 *Tu premio ya está guardado en tu tarjeta:*' || E'\n' || v_card_url || E'\n\n' ||
          '¡Que tengas un día maravilloso! 💖';

      -- VERSIÓN A: Le faltaban 2 o más sellos -> Le regalamos sellos dejándola exactamente a 1 paso
      ELSE
        v_ya_estaba_a_uno := FALSE;
        v_sellos_regalo := (v_hito_objetivo - v_sellos_actuales) - 1;
        IF v_sellos_regalo <= 0 THEN v_sellos_regalo := 1; END IF;
        v_sellos_post := v_sellos_actuales + v_sellos_regalo;

        -- Copy Versión A: Dejarla a 1 sellito de su regalo
        v_mensaje := '¡Hola ' || public.extraer_primer_nombre(v_cliente.nombre) || '! 🌸🎂' || E'\n\n' ||
          'En *' || v_negocio.nombre || '* ya estamos celebrando porque se acerca tu cumpleaños ✨' || E'\n\n' ||
          '🎁 *Tu regalo anticipado del Club Glow:*' || E'\n' ||
          '¡Te regalamos *+' || v_sellos_regalo || ' Sellos VIP* de cumpleaños directo a tu tarjeta! Ahora tienes *' || v_sellos_post || ' de 12 sellos*.' || E'\n\n' ||
          '🎯 Estás a solo *1 sellito* de desbloquear tu regalo: *' || v_premio_nombre || '* 💕' || E'\n\n' ||
          '¿Qué día de esta semana te gustaría agendar para consentirte y llevarte tu regalo?' || E'\n\n' ||
          '📲 *Mira tu tarjeta casi lista:*' || E'\n' || v_card_url || E'\n\n' ||
          '¡Que tengas un lindo día! 💖';
      END IF;

      -- Registrar movimiento de sellos regalados
      v_expira := now() + interval '3 months';
      INSERT INTO sellos_movimientos (
        business_id, cliente_id, cantidad, motivo, expira_en, total_post, notas
      ) VALUES (
        v_negocio.id, v_cliente.id, v_sellos_regalo, 'cumpleanos', v_expira, v_sellos_post,
        CASE WHEN v_ya_estaba_a_uno THEN 'Regalo de cumpleaños: Sello final para desbloquear premio' ELSE 'Acelerador de cumpleaños: Dejada a 1 sello de la meta' END
      );

      -- Encolar mensaje
      INSERT INTO public.cola_mensajes_salientes (
        business_id, cliente_id, telefono, flujo, mensaje,
        media_url, media_type, instance_name, api_key, estado, metadata
      ) VALUES (
        v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_anticipado',
        v_mensaje,
        CASE WHEN v_ya_estaba_a_uno THEN v_media_premio_url ELSE NULL END,
        CASE WHEN v_ya_estaba_a_uno THEN 'image' ELSE NULL END,
        v_negocio.instance_name, v_negocio.api_key, 'pendiente',
        jsonb_build_object(
          'etapa', 'anticipado_6_dias',
          'version', CASE WHEN v_ya_estaba_a_uno THEN 'B_premio_desbloqueado' ELSE 'A_a_un_paso' END,
          'sellos_regalo', v_sellos_regalo,
          'sellos_post', v_sellos_post,
          'hito_objetivo', v_hito_objetivo
        )
      );

      v_total_encolados := v_total_encolados + 1;
    END LOOP;

    -- =========================================================================
    -- TIEMPO 2: Día D (El Mismo Día de Cumpleaños) -> 100% Humano y de Cariño
    -- =========================================================================
    FOR v_cliente IN
      SELECT c.id, c.nombre, c.telefono, c.cumpleanos
      FROM public."Clientes" c
      WHERE c.business_id = v_negocio.id
        AND c.telefono IS NOT NULL
        AND c.cumpleanos IS NOT NULL
        AND EXTRACT(MONTH FROM c.cumpleanos) = EXTRACT(MONTH FROM v_hoy)
        AND EXTRACT(DAY FROM c.cumpleanos) = EXTRACT(DAY FROM v_hoy)
        AND NOT EXISTS (
          SELECT 1 FROM public.mensajes m
          WHERE m.business_id = v_negocio.id
            AND m.cliente_id = c.id
            AND m.campana_origen = 'cumpleanos_dia_d'
            AND m.created_at >= (NOW() - INTERVAL '300 days')
        )
    LOOP
      v_telefono_limpio := REGEXP_REPLACE(v_cliente.telefono, '[^0-9]', '', 'g');
      IF LENGTH(v_telefono_limpio) < 8 THEN
        CONTINUE;
      END IF;

      -- Mensaje 100% afectivo y cálido, sin ventas ni presiones
      v_mensaje := '¡Feliz cumpleaños, ' || public.extraer_primer_nombre(v_cliente.nombre) || '! 🥳🎂🎉✨' || E'\n\n' ||
        'De parte de todo el equipo de *' || v_negocio.nombre || '*, te deseamos un día absolutamente maravilloso, lleno de alegría, salud y mucho amor 💕' || E'\n\n' ||
        '¡Que pases un día extraordinario y que todos tus deseos se cumplan! 🥂💖';

      INSERT INTO public.cola_mensajes_salientes (
        business_id, cliente_id, telefono, flujo, mensaje,
        instance_name, api_key, estado, metadata
      ) VALUES (
        v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_dia_d',
        v_mensaje,
        v_negocio.instance_name, v_negocio.api_key, 'pendiente',
        jsonb_build_object('etapa', 'dia_d_afectivo')
      );

      v_total_encolados := v_total_encolados + 1;
    END LOOP;

  END LOOP;

  RETURN jsonb_build_object('success', true, 'encolados', v_total_encolados);
END;
$function$;
  `;

  await client.query(sqlCumple);
  console.log('Función encolar_cumpleanos actualizada sin códigos textuales.');

  await client.end();
}

main().catch(console.error);
