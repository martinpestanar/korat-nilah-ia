const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("=== DESPLEGANDO MOTOR OFICIAL DEFINITIVO DE CUMPLEAÑOS EN 2 TIEMPOS ===");

  // 1. Actualizar la función oficial public.encolar_cumpleanos()
  console.log("1. Creando función oficial public.encolar_cumpleanos()...");
  await client.query(`
CREATE OR REPLACE FUNCTION public.encolar_cumpleanos()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
DECLARE
  v_total_encolados INT := 0;
  v_negocio RECORD;
  v_cliente RECORD;
  v_mensaje TEXT;
  v_primer_nombre TEXT;
  v_telefono_limpio TEXT;
  v_hoy DATE;
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
  v_ya_estaba_a_uno BOOLEAN := FALSE;
  v_roadmap_rec RECORD;
  v_delay_ms INT;
BEGIN
  FOR v_negocio IN
    SELECT 
      n.id, 
      n.nombre, 
      n.pais,
      n.timezone,
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
        OR (n.recursos_saas->'automatizaciones'->>'permitir_cumpleanos')::boolean IS TRUE
        OR (n.bot_config->'flujos_activos'->>'cumpleanos')::boolean IS TRUE
      )
  LOOP
    IF v_negocio.instance_name IS NULL OR v_negocio.api_key IS NULL THEN
      CONTINUE;
    END IF;

    -- Fecha local respetuosa del salón
    v_hoy := (now() AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::date;

    -- 6 días de anticipación por defecto
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
        AND public.fn_coincide_dia_mes_cumpleanos(c.cumpleanos, v_fecha_anticipada) = true
        AND NOT EXISTS (
          SELECT 1 FROM public.mensajes m
          WHERE m.business_id = v_negocio.id
            AND m.cliente_id = c.id
            AND m.campana_origen = 'cumpleanos_anticipado'
            AND m.created_at >= (now() - interval '300 days')
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.cola_mensajes_salientes q
          WHERE q.business_id = v_negocio.id
            AND q.cliente_id = c.id
            AND q.flujo = 'cumpleanos_anticipado'
            AND q.created_at >= (now() - interval '300 days')
        )
    LOOP
      v_telefono_limpio := public.fn_sanitizar_y_resolver_telefono_cliente(
        v_negocio.id, v_cliente.id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais
      );
      IF v_telefono_limpio IS NULL THEN
        CONTINUE;
      END IF;

      v_primer_nombre := public.extraer_primer_nombre(COALESCE(v_cliente.nombre, 'linda'));
      v_sellos_actuales := public.fn_sellos_activos(v_cliente.id, v_negocio.id);
      
      -- Buscar dinámicamente el próximo hito real en sellos_roadmap del negocio
      SELECT r.id, r.hito_sello, r.nombre INTO v_roadmap_rec
      FROM public.sellos_roadmap r
      WHERE r.business_id = v_negocio.id AND r.activo = true AND r.hito_sello > v_sellos_actuales
      ORDER BY r.hito_sello ASC
      LIMIT 1;

      IF v_roadmap_rec.hito_sello IS NOT NULL THEN
        v_hito_objetivo := v_roadmap_rec.hito_sello;
        v_premio_nombre := v_roadmap_rec.nombre;
      ELSE
        -- Si ya superó todos los hitos, tomar el hito mayor
        SELECT r.id, r.hito_sello, r.nombre INTO v_roadmap_rec
        FROM public.sellos_roadmap r
        WHERE r.business_id = v_negocio.id AND r.activo = true
        ORDER BY r.hito_sello DESC
        LIMIT 1;
        v_hito_objetivo := COALESCE(v_roadmap_rec.hito_sello, 4);
        v_premio_nombre := COALESCE(v_roadmap_rec.nombre, 'Regalo VIP');
      END IF;

      v_media_premio_url := 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_' || v_hito_objetivo || '.jpg';
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || v_cliente.id;
      v_expira := now() + interval '3 months';

      -- =======================================================================
      -- EVALUACIÓN DE LAS 2 VERSIONES:
      -- =======================================================================
      -- VERSIÓN B: Ya estaba a solo 1 sello de ganar (ej. 3 de 4, 7 de 8, 11 de 12)
      IF v_sellos_actuales = (v_hito_objetivo - 1) THEN
        v_ya_estaba_a_uno := TRUE;
        v_sellos_regalo := 1;
        v_sellos_post := v_hito_objetivo;

        -- Registrar premio ganado (canje express con 1 clic en recepción, sin códigos alfanuméricos)
        IF v_roadmap_rec.id IS NOT NULL THEN
          INSERT INTO public.sellos_premios_ganados (
            business_id, cliente_id, roadmap_id, codigo_canje, estado, ganado_en, expira_en
          ) VALUES (
            v_negocio.id, v_cliente.id, v_roadmap_rec.id, '1-CLIC', 'pendiente', now(), now() + interval '60 days'
          ) ON CONFLICT DO NOTHING;
        END IF;

        -- Copy Versión B: Corto, directo, con tarjeta 3D
        v_mensaje := '¡Sorpresa de cumpleaños, *' || v_primer_nombre || '*! 🎁🎂👑' || E'\n\n' ||
          'En *' || v_negocio.nombre || '* te regalamos tu sello final y acabas de desbloquear tu regalo:' || E'\n\n' ||
          '🎉 *' || v_premio_nombre || '* ✨' || E'\n\n' ||
          'Ven a consentirte esta semana y pídelo directo en recepción con tu servicio favorito. 🌸' || E'\n\n' ||
          '📲 *Ver tu regalo en tu tarjeta digital:*' || E'\n' || v_card_url;

        -- Registrar movimiento de sellos
        INSERT INTO public.sellos_movimientos (
          business_id, cliente_id, cantidad, motivo, expira_en, total_post, notas
        ) VALUES (
          v_negocio.id, v_cliente.id, v_sellos_regalo, 'cumpleanos', v_expira, v_sellos_post,
          'Regalo de cumpleaños: Sello final para desbloquear premio'
        );

        v_delay_ms := (public.calcular_delay_escritura_humana(v_mensaje) * 1000)::int;

        -- Encolar con imagen 3D
        INSERT INTO public.cola_mensajes_salientes (
          business_id, cliente_id, telefono, flujo, mensaje,
          media_url, media_type, instance_name, api_key, delay_ms, estado, proximo_intento_at, metadata
        ) VALUES (
          v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_anticipado',
          v_mensaje,
          v_media_premio_url, 'image',
          v_negocio.instance_name, v_negocio.api_key, v_delay_ms, 'pendiente', now(),
          jsonb_build_object(
            'etapa', 'anticipado_6_dias',
            'version', 'B_premio_desbloqueado',
            'sellos_regalo', v_sellos_regalo,
            'sellos_post', v_sellos_post,
            'hito_objetivo', v_hito_objetivo
          )
        );

      -- VERSIÓN A: Le faltaban 2 o más sellos -> La dejamos a exactamente 1 paso de ganar
      ELSE
        v_ya_estaba_a_uno := FALSE;
        v_sellos_regalo := (v_hito_objetivo - v_sellos_actuales) - 1;
        IF v_sellos_regalo <= 0 THEN v_sellos_regalo := 1; END IF;
        v_sellos_post := v_sellos_actuales + v_sellos_regalo;

        -- Copy Versión A: Micro-copy minimalista y directo
        v_mensaje := '¡Hola *' || v_primer_nombre || '*! 🌸🎂 Se acerca tu cumple y en *' || v_negocio.nombre || '* queremos engreírte:' || E'\n\n' ||
          '🎁 Te regalamos *+' || v_sellos_regalo || ' Sello' || (CASE WHEN v_sellos_regalo > 1 THEN 's' ELSE '' END) || ' VIP* directo a tu tarjeta. ¡Ya tienes *' || v_sellos_post || ' de 12 sellos*!' || E'\n\n' ||
          '🎯 Estás a solo *1 sellito* de tu *' || v_premio_nombre || '*. ¿Qué día de esta semana te gustaría venir por tu regalo? ✨' || E'\n\n' ||
          '📲 *Tu tarjeta digital:*' || E'\n' || v_card_url;

        -- Registrar movimiento de sellos
        INSERT INTO public.sellos_movimientos (
          business_id, cliente_id, cantidad, motivo, expira_en, total_post, notas
        ) VALUES (
          v_negocio.id, v_cliente.id, v_sellos_regalo, 'cumpleanos', v_expira, v_sellos_post,
          'Acelerador de cumpleaños: Dejada a 1 sello de la meta'
        );

        v_delay_ms := (public.calcular_delay_escritura_humana(v_mensaje) * 1000)::int;

        -- Encolar texto
        INSERT INTO public.cola_mensajes_salientes (
          business_id, cliente_id, telefono, flujo, mensaje,
          instance_name, api_key, delay_ms, estado, proximo_intento_at, metadata
        ) VALUES (
          v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_anticipado',
          v_mensaje,
          v_negocio.instance_name, v_negocio.api_key, v_delay_ms, 'pendiente', now(),
          jsonb_build_object(
            'etapa', 'anticipado_6_dias',
            'version', 'A_a_un_paso',
            'sellos_regalo', v_sellos_regalo,
            'sellos_post', v_sellos_post,
            'hito_objetivo', v_hito_objetivo
          )
        );
      END IF;

      v_total_encolados := v_total_encolados + 1;
    END LOOP;

    -- =========================================================================
    -- TIEMPO 2: Día D (El Mismo Día de Cumpleaños) -> 100% Cariño y Humano
    -- =========================================================================
    FOR v_cliente IN
      SELECT c.id, c.nombre, c.telefono, c.cumpleanos
      FROM public."Clientes" c
      WHERE c.business_id = v_negocio.id
        AND c.telefono IS NOT NULL
        AND c.cumpleanos IS NOT NULL
        AND public.fn_coincide_dia_mes_cumpleanos(c.cumpleanos, v_hoy) = true
        AND NOT EXISTS (
          SELECT 1 FROM public.mensajes m
          WHERE m.business_id = v_negocio.id
            AND m.cliente_id = c.id
            AND m.campana_origen = 'cumpleanos_dia_d'
            AND m.created_at >= (now() - interval '300 days')
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.cola_mensajes_salientes q
          WHERE q.business_id = v_negocio.id
            AND q.cliente_id = c.id
            AND q.flujo = 'cumpleanos_dia_d'
            AND q.created_at >= (now() - interval '300 days')
        )
    LOOP
      v_telefono_limpio := public.fn_sanitizar_y_resolver_telefono_cliente(
        v_negocio.id, v_cliente.id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais
      );
      IF v_telefono_limpio IS NULL THEN
        CONTINUE;
      END IF;

      v_primer_nombre := public.extraer_primer_nombre(COALESCE(v_cliente.nombre, 'linda'));

      -- Mensaje 100% afectivo y cálido, sin ventas ni presiones
      v_mensaje := '¡Feliz cumpleaños, *' || v_primer_nombre || '*! 🥳🎂🎉✨' || E'\n\n' ||
        'De parte de todo el equipo de *' || v_negocio.nombre || '*, te deseamos un día absolutamente maravilloso, lleno de alegría, salud y mucho amor. 💕' || E'\n\n' ||
        '¡Que pases un día extraordinario y que todos tus deseos se cumplan! 🥂💖';

      v_delay_ms := (public.calcular_delay_escritura_humana(v_mensaje) * 1000)::int;

      INSERT INTO public.cola_mensajes_salientes (
        business_id, cliente_id, telefono, flujo, mensaje,
        instance_name, api_key, delay_ms, estado, proximo_intento_at, metadata
      ) VALUES (
        v_negocio.id, v_cliente.id, v_telefono_limpio, 'cumpleanos_dia_d',
        v_mensaje,
        v_negocio.instance_name, v_negocio.api_key, v_delay_ms, 'pendiente', now(),
        jsonb_build_object('etapa', 'dia_d_afectivo')
      );

      v_total_encolados := v_total_encolados + 1;
    END LOOP;

  END LOOP;

  RETURN jsonb_build_object('success', true, 'encolados', v_total_encolados, 'fecha', v_hoy);
END;
$function$;
  `);
  console.log("   -> public.encolar_cumpleanos() actualizada con Versión A, Versión B (sin códigos) y Día D.");

  // 2. Actualizar plantillas en plantillas_automatizacion para coherencia en interfaz de usuario
  console.log("2. Actualizando plantillas en tabla plantillas_automatizacion para Glamour y Capricho...");
  await client.query(`
    UPDATE public.plantillas_automatizacion
    SET contenido = '¡Hola *{nombre_cliente}*! 🌸🎂 Se acerca tu cumple y en *{nombre_negocio}* queremos engreírte:\n\n🎁 Te regalamos *+{sellos_regalo} Sellos VIP* directo a tu tarjeta. ¡Ya tienes *{sellos_post} de 12 sellos*!\n\n🎯 Estás a solo *1 sellito* de tu *{premio}*. ¿Qué día de esta semana te gustaría venir por tu regalo? ✨\n\n📲 *Tu tarjeta digital:*\n{card_url}',
        updated_at = now()
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb' AND flujo = 'cumpleanos_anticipado' AND es_default = true;

    UPDATE public.plantillas_automatizacion
    SET contenido = '¡Feliz cumpleaños, *{nombre_cliente}*! 🥳🎂🎉✨\n\nDe parte de todo el equipo de *{nombre_negocio}*, te deseamos un día absolutamente maravilloso, lleno de alegría, salud y mucho amor. 💕\n\n¡Que pases un día extraordinario y que todos tus deseos se cumplan! 🥂💖',
        updated_at = now()
    WHERE business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb' AND flujo = 'cumpleanos_dia_d' AND es_default = true;
  `);
  console.log("   -> Plantillas en base de datos sincronizadas.");

  // 3. Prueba controlada de encolamiento
  console.log("3. Verificando ejecución limpia...");
  const testRun = await client.query('SELECT public.encolar_cumpleanos() as res');
  console.log("   -> Resultado:", testRun.rows[0].res);

  console.log("=== DESPLIEGUE FINALIZADO EXITOSAMENTE ===");
  await client.end();
}

main().catch(console.error);
