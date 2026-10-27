const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres' });

async function actualizarLogicaCumple2Versiones() {
  await client.connect();

  const sql = `
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
  v_cumple_sellos_activo BOOLEAN := TRUE;
  v_expira TIMESTAMPTZ;
  v_sellos_actuales INT;
  v_hito_objetivo INT;
  v_sellos_regalo INT;
  v_sellos_post INT;
  v_premio_nombre TEXT;
  v_vino_reciente BOOLEAN;
  v_card_url TEXT;
  v_media_premio_url TEXT;
  v_codigo_premio TEXT;
  v_ya_estaba_a_uno BOOLEAN := FALSE;
BEGIN
  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.bot_config, 
      n.recursos_saas,
      n.instance_name,
      n.api_key,
      n.slug
    FROM public.negocios n
    WHERE (n.bot_config->>'bot_enabled')::boolean IS TRUE
      AND (
        (n.recursos_saas->'automatizaciones'->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
        OR (n.bot_config->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
        OR (n.recursos_saas->'sellos_addons'->>'cumpleanos_vip')::boolean IS TRUE
        OR (n.recursos_saas->'sellos_addons'->>'cumpleanos')::boolean IS TRUE
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
    -- TIEMPO 1: Anticipado (6 días antes) -> 2 VERSIONES INTELIGENTES
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
      
      -- Determinar hito objetivo más próximo (4, 8, o 12)
      IF v_sellos_actuales < 4 THEN
        v_hito_objetivo := 4;
        v_premio_nombre := 'Spa Cutículas & Hidratación Express';
        v_media_premio_url := 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_4.jpg';
      ELSIF v_sellos_actuales < 8 THEN
        v_hito_objetivo := 8;
        v_premio_nombre := 'Tratamiento Capilar Profundo o Manicure Semipermanente';
        v_media_premio_url := 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_8.jpg';
      ELSE
        v_hito_objetivo := 12;
        v_premio_nombre := 'Servicio Completo Estrella Totalmente Gratis';
        v_media_premio_url := 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_12.jpg';
      END IF;

      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cliente.id;

      -- =======================================================================
      -- EVALUACIÓN DE LAS 2 VERSIONES:
      -- =======================================================================
      -- VERSIÓN B: Ya estaba a solo 1 sello de ganar (ej. 3 de 4, 7 de 8, 11 de 12)
      IF v_sellos_actuales = (v_hito_objetivo - 1) THEN
        v_ya_estaba_a_uno := TRUE;
        v_sellos_regalo := 1;
        v_sellos_post := v_hito_objetivo;

        -- Generar código de canje del premio
        v_codigo_premio := 'GLOW-CUMPLE-' || UPPER(SUBSTRING(MD5(RANDOM()::text || clock_timestamp()::text) FROM 1 FOR 4));

        -- Registrar premio ganado
        INSERT INTO sellos_premios_ganados (
          business_id, cliente_id, codigo_canje, estado, ganado_en, expira_en
        ) VALUES (
          v_negocio.id, v_cliente.id, v_codigo_premio, 'pendiente', now(), now() + interval '60 days'
        ) ON CONFLICT DO NOTHING;

        -- Copy Versión B: Premio Listo con imagen 3D
        v_mensaje := '¡Sorpresa de cumpleaños, ' || public.extraer_primer_nombre(v_cliente.nombre) || '! 🎁🎂👑' || E'\\n\\n' ||
          'En *' || v_negocio.nombre || '* ya estamos en modo celebración y te regalamos el *sello que te faltaba*.' || E'\\n\\n' ||
          '🎉 ¡DESBLOQUEASTE TU PREMIO DE CUMPLEAÑOS!' || E'\\n' ||
          '🎁 *' || v_premio_nombre || '*' || E'\\n\\n' ||
          '🎟️ Tu código de regalo: *' || v_codigo_premio || '*' || E'\\n\\n' ||
          'Ven a consentirte esta semana y llévatelo totalmente gratis al realizar tu servicio favorito ✨' || E'\\n\\n' ||
          '📲 *Ver tu premio en tu tarjeta:* ' || v_card_url;

      -- VERSIÓN A: Le faltaban 2 o más sellos -> Le regalamos sellos dejándola exactamente a 1 paso
      ELSE
        v_ya_estaba_a_uno := FALSE;
        v_sellos_regalo := (v_hito_objetivo - v_sellos_actuales) - 1;
        IF v_sellos_regalo <= 0 THEN v_sellos_regalo := 1; END IF;
        v_sellos_post := v_sellos_actuales + v_sellos_regalo;

        -- Copy Versión A: Dejarla a 1 sellito de su regalo
        v_mensaje := '¡Hola ' || public.extraer_primer_nombre(v_cliente.nombre) || '! 🌸🎂' || E'\\n\\n' ||
          'En *' || v_negocio.nombre || '* ya estamos celebrando porque se acerca tu cumpleaños ✨' || E'\\n\\n' ||
          '🎁 *Tu regalo anticipado del Club Glow:*' || E'\\n' ||
          '¡Te regalamos *+' || v_sellos_regalo || ' Sellos VIP* de cumpleaños directo a tu tarjeta! Ahora tienes *' || v_sellos_post || ' de 12 sellos*.' || E'\\n\\n' ||
          '🎯 Estás a solo *1 sellito* de desbloquear tu regalo: *' || v_premio_nombre || '* 💕' || E'\\n\\n' ||
          '¿Qué día de esta semana te gustaría agendar para consentirte y llevarte tu regalo?' || E'\\n\\n' ||
          '📲 *Mira tu tarjeta casi lista:* ' || v_card_url;
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
      v_mensaje := '¡Feliz cumpleaños, ' || public.extraer_primer_nombre(v_cliente.nombre) || '! 🥳🎂🎉✨' || E'\\n\\n' ||
        'De parte de todo el equipo de *' || v_negocio.nombre || '*, te deseamos un día absolutamente maravilloso, lleno de alegría, salud y mucho amor 💕' || E'\\n\\n' ||
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

  await client.query(sql);
  console.log('✅ Función encolar_cumpleanos actualizada con las 2 Versiones del Día 6 + Saludo Afectivo Día D');
  await client.end();
}

actualizarLogicaCumple2Versiones().catch(console.error);
