const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("=== DESPLEGANDO AUTOMATIZACIÓN PERMANENTE DE SELLOS RETROACTIVOS ===");

  // 1. Desplegar función de horario respetuoso
  console.log("1. Creando función public.calcular_proximo_horario_respetuoso...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.calcular_proximo_horario_respetuoso(p_timezone text DEFAULT 'America/Lima')
    RETURNS timestamptz
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_tz text := COALESCE(p_timezone, 'America/Lima');
        v_local_now timestamp := now() AT TIME ZONE v_tz;
        v_target_date date;
    BEGIN
        -- Si es después de las 20:00 (8 PM), enviar mañana a las 9:15 AM
        IF v_local_now::time >= '20:00:00'::time THEN
            v_target_date := (v_local_now::date + INTERVAL '1 day')::date;
            RETURN (v_target_date::text || ' 09:15:00')::timestamp AT TIME ZONE v_tz;
        -- Si es antes de las 09:00 AM, enviar hoy a las 9:15 AM
        ELSIF v_local_now::time < '09:00:00'::time THEN
            v_target_date := v_local_now::date;
            RETURN (v_target_date::text || ' 09:15:00')::timestamp AT TIME ZONE v_tz;
        -- Si está en horario diurno respetuoso (09:00 AM a 20:00 PM), enviar de inmediato
        ELSE
            RETURN now();
        END IF;
    END;
    $$;
  `);

  // 2. Actualizar procesar_sellos_encuesta_omitida para admitir citas completadas retroactivas
  console.log("2. Actualizando public.procesar_sellos_encuesta_omitida...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.procesar_sellos_encuesta_omitida(p_business_id uuid, p_cliente_id bigint)
    RETURNS TABLE(r_debe_responder boolean, r_cita_id bigint, r_telefono text, r_instance_name text, r_api_key text, r_mensaje text, r_media_url text)
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
      v_cita record; v_cliente record; v_negocio record; v_inst record; v_config record;
      v_primer_nombre text; v_msg text; v_media text := NULL; v_tel text; v_plantilla text;
      v_totales int := 12; v_actuales int := 0; v_despues int := 1; v_faltantes int := 0;
      v_hito record; v_prem record;
      v_card_url text; v_codigo text := ''; v_premio_prox text := 'Regalo VIP Sorpresa'; v_premio_1 text := 'Regalo VIP';
      v_primera boolean := false; v_desbloq boolean := false; v_sello_desbloq int := 0; v_expira timestamptz;
    BEGIN
      -- Busca la cita más reciente completada donde la encuesta se haya omitido o no se haya enviado por ser retroactiva
      SELECT c.* INTO v_cita
      FROM public."Citas" c
      WHERE c.business_id = p_business_id AND c.cliente_id = p_cliente_id
        AND (
          (c.encuesta_enviada = true AND (c.calificacion IS NULL OR c.calificacion IN ('', '0')))
          OR (c.estado ILIKE 'completada' AND (c.encuesta_enviada IS NULL OR c.encuesta_enviada = false))
        )
        AND (c.calificacion_origen IS NULL OR c.calificacion_origen <> 'omitida_sellos')
      ORDER BY c.fecha DESC, c.id DESC LIMIT 1;
      
      IF v_cita.id IS NULL THEN RETURN; END IF;

      SELECT * INTO v_cliente FROM public."Clientes" cl WHERE cl.id = p_cliente_id;
      SELECT * INTO v_negocio FROM public.negocios neg WHERE neg.id = p_business_id;

      IF COALESCE(v_negocio.modo_fidelizacion, 'sellos') NOT IN ('sellos', 'ambos')
         OR COALESCE((v_negocio.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, true) = false THEN
        RETURN;
      END IF;

      SELECT * INTO v_inst FROM public.instancias_evolution ie
      WHERE ie.business_id = p_business_id AND ie.status = 'conectado'
      ORDER BY ie.updated_at DESC LIMIT 1;
      IF v_inst.instance_name IS NULL OR v_inst.api_key IS NULL THEN RETURN; END IF;

      v_primer_nombre := public.extraer_primer_nombre(COALESCE(v_cliente.nombre, 'linda'));
      IF v_primer_nombre IS NULL OR length(v_primer_nombre) < 2 THEN v_primer_nombre := 'Bella'; END IF;

      -- Registrar sello de la visita si aún no existe
      IF NOT EXISTS (
        SELECT 1 FROM public.sellos_movimientos sm
        LEFT JOIN public."Citas" c_prev ON c_prev.id = sm.cita_id
        WHERE sm.cliente_id = p_cliente_id AND sm.business_id = p_business_id
          AND sm.motivo = 'cita'::sello_motivo_enum
          AND (sm.cita_id = v_cita.id OR COALESCE(c_prev.fecha::date, sm.created_at::date) = v_cita.fecha::date)
      ) THEN
        PERFORM public.fn_registrar_sello_visita(v_cita.id, p_business_id);
      END IF;

      -- Cancelar mensajes diferidos pendientes previos para evitar duplicados
      UPDATE public.cola_mensajes_salientes cms
      SET estado = 'cancelado'
      WHERE cms.cliente_id = p_cliente_id AND cms.business_id = p_business_id
        AND cms.flujo IN ('club_glow_sellos', 'fidelizacion_sellos_recompensa')
        AND cms.estado = 'pendiente';

      SELECT * INTO v_config FROM public.sellos_config sc WHERE sc.business_id = p_business_id;
      v_totales := COALESCE(v_config.total_sellos_roadmap, 12);
      v_expira := CASE WHEN COALESCE(v_config.vencimiento_sellos_meses, 0) > 0
                       THEN now() + (v_config.vencimiento_sellos_meses || ' months')::interval ELSE NULL END;
      v_actuales := public.fn_sellos_activos(p_cliente_id, p_business_id);
      v_card_url := 'https://koratflow.agency/club/' || COALESCE(v_negocio.slug, v_negocio.id::text) || '?c=' || p_cliente_id;

      -- Sello de bienvenida si está configurado y aplica
      IF COALESCE(v_config.bienvenida_activo, true) AND v_actuales <= 1 THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.sellos_movimientos sm2
          WHERE sm2.cliente_id = p_cliente_id AND sm2.business_id = p_business_id AND sm2.motivo = 'bienvenida'::sello_motivo_enum
        ) THEN
          INSERT INTO public.sellos_movimientos (business_id, cliente_id, cita_id, cantidad, motivo, expira_en, total_post, created_at)
          VALUES (p_business_id, p_cliente_id, v_cita.id, 1, 'bienvenida'::sello_motivo_enum, v_expira, v_actuales + 1, now());
          v_actuales := v_actuales + 1;
          v_primera := true;
        END IF;
      END IF;

      v_despues := LEAST(v_totales, GREATEST(1, v_actuales));

      -- Verificar si desbloqueó premio en este hito
      SELECT spg.codigo_canje AS cod, r.nombre AS nom, r.hito_sello AS hit INTO v_prem
      FROM public.sellos_premios_ganados spg
      JOIN public.sellos_roadmap r ON r.id = spg.roadmap_id
      WHERE spg.cliente_id = p_cliente_id AND spg.business_id = p_business_id
        AND (spg.cita_id = v_cita.id OR spg.ganado_en >= now() - interval '24 hours')
        AND spg.estado = 'pendiente'
      ORDER BY spg.id DESC LIMIT 1;

      IF v_prem.cod IS NOT NULL AND v_prem.cod <> '' AND v_despues = v_prem.hit THEN
        v_desbloq := true; v_codigo := v_prem.cod; v_premio_prox := v_prem.nom; v_sello_desbloq := v_prem.hit;
      END IF;

      SELECT r.hito_sello AS hit, r.nombre AS nom INTO v_hito
      FROM public.sellos_roadmap r
      WHERE r.business_id = p_business_id AND r.activo = true AND r.hito_sello > v_despues
      ORDER BY r.hito_sello ASC LIMIT 1;

      v_faltantes := GREATEST(0, COALESCE(v_hito.hit, v_totales) - v_despues);
      IF NOT v_desbloq THEN v_premio_prox := COALESCE(v_hito.nom, 'Regalo VIP Sorpresa'); END IF;

      SELECT r.nombre INTO v_premio_1 FROM public.sellos_roadmap r
      WHERE r.business_id = p_business_id AND r.activo = true ORDER BY r.hito_sello ASC LIMIT 1;
      v_premio_1 := COALESCE(v_premio_1, 'Regalo VIP');

      -- Armar mensaje enfocado en beneficio y gratitud
      IF v_desbloq THEN
        SELECT elem->>'imagen_url' INTO v_media
        FROM public.nilah_config nc, jsonb_array_elements(nc.tarjetas_club_glow) elem
        WHERE (elem->>'sello')::int = v_sello_desbloq
          AND elem->>'imagen_url' IS NOT NULL AND length(trim(elem->>'imagen_url')) > 10
        LIMIT 1;
        v_msg := '¡Gracias por tu visita, ' || v_primer_nombre || '! 🥰✨' || E'\n\n' ||
                 '¡Acabas de desbloquear tu premio del Club Glow! 🎉' || E'\n' ||
                 '🎁 *Regalo:* ' || v_premio_prox || E'\n' ||
                 '🎟️ *Código de canje:* *' || v_codigo || '*' || E'\n' ||
                 '*(Solo muéstralo en recepción en tu próxima visita)*.' || E'\n\n' ||
                 '📲 *Tu premio ya quedó guardado en tu tarjeta digital:*' || E'\n' || v_card_url;
      ELSIF v_primera THEN
        v_msg := '¡Gracias por tu visita, ' || v_primer_nombre || '! 🥰✨' || E'\n\n' ||
                 'Te regalamos *1 sello de bienvenida* + el de tu visita: ¡ya tienes *' || v_despues || ' de ' || v_totales || ' sellos* en tu *Club Glow*! 👑🎁' || E'\n\n' ||
                 '🎯 A solo ' || v_faltantes || ' sellos de tu primer regalo: *' || v_premio_prox || '* 🌸' || E'\n\n' ||
                 '📲 *Tu tarjeta en vivo:* ' || v_card_url || E'\n\n' ||
                 '¡Que tengas un lindo día! 💖';
      ELSE
        v_msg := '¡Gracias por tu visita, ' || v_primer_nombre || '! 🥰✨' || E'\n\n' ||
                 'Tu visita sumó a tu *Club Glow* 👑 Ya llevas *' || v_despues || ' de ' || v_totales || ' sellos*.' || E'\n\n' ||
                 '🎯 Próximo objetivo: *' || v_premio_prox || '* 🌸💎' || E'\n\n' ||
                 '📲 *Mira tu tarjeta digital aquí:*' || E'\n' || v_card_url;
      END IF;

      -- Marcar la encuesta como omitida_sellos en todas las citas de ese día
      UPDATE public."Citas" c
      SET calificacion_origen = 'omitida_sellos',
          encuesta_enviada = true,
          fecha_encuesta_enviada = now()
      WHERE c.cliente_id = p_cliente_id AND c.business_id = p_business_id
        AND (c.id = v_cita.id OR (c.fecha::date = v_cita.fecha::date AND c.estado ILIKE 'completada'))
        AND (c.calificacion IS NULL OR c.calificacion IN ('', '0'));

      -- Sanitizar y resolver teléfono
      v_tel := public.fn_sanitizar_y_resolver_telefono_cliente(p_business_id, p_cliente_id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais);

      RETURN QUERY SELECT true, v_cita.id, v_tel, v_inst.instance_name, v_inst.api_key, v_msg, v_media;
    END;
    $function$;
  `);

  // 3. Modificar public.encolar_calificacion_post_cita para incorporar permanentemente los sellos retroactivos
  console.log("3. Integrando lógica permanente en public.encolar_calificacion_post_cita...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.encolar_calificacion_post_cita()
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
        v_negocio      record;
        v_cand         record;
        v_retro        record;
        v_r            record;
        v_encolados    integer := 0;
        v_delay_ms     integer;
        v_proximo_envio timestamptz;
        v_jitter_secs  integer := 0;
    BEGIN
        FOR v_negocio IN
            SELECT n.id, n.nombre, n.pais, ie.instance_name, ie.api_key, n.timezone, n.modo_fidelizacion, n.recursos_saas
            FROM public.negocios n
            JOIN public.instancias_evolution ie
                 ON ie.business_id = n.id AND ie.status = 'conectado'
            WHERE n.activo = true
              AND ie.instance_name IS NOT NULL
              AND ie.api_key IS NOT NULL
              AND (
                  (
                    n.modo_fidelizacion IN ('sellos', 'ambos')
                    AND COALESCE((n.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, true) = true
                    AND COALESCE((n.recursos_saas->'sellos_addons'->>'calificaciones_integradas')::boolean, true) = true
                  )
                  OR COALESCE((n.recursos_saas->'automatizaciones'->>'calificacion_activa')::boolean, false) = true
                  OR COALESCE((n.recursos_saas->'automatizaciones'->>'post_cita_activo')::boolean, false) = true
              )
        LOOP
            -- =========================================================================
            -- RAMA 1: Citas recientes (< 48h) -> Encuesta de Calificación normal
            -- =========================================================================
            FOR v_cand IN
                SELECT * FROM public.get_candidatos_calificacion_post_cita(v_negocio.id)
            LOOP
                BEGIN
                    v_delay_ms := (public.calcular_delay_escritura_humana(v_cand.mensaje_texto) * 1000)::integer;

                    INSERT INTO public.cola_mensajes_salientes (
                        business_id, cliente_id, cita_id, telefono,
                        flujo, mensaje, delay_ms,
                        instance_name, api_key,
                        estado, proximo_intento_at,
                        metadata
                    ) VALUES (
                        v_negocio.id,
                        v_cand.cliente_id,
                        v_cand.cita_id,
                        v_cand.telefono_cliente,
                        'calificacion_encuesta',
                        v_cand.mensaje_texto,
                        v_delay_ms,
                        v_cand.instance_name,
                        v_cand.api_key,
                        'pendiente',
                        now(),
                        jsonb_build_object(
                            'servicio', v_cand.servicio_realizado,
                            'canal', 'calificacion_encuesta'
                        )
                    )
                    ON CONFLICT DO NOTHING;

                    UPDATE public."Citas"
                    SET encuesta_enviada = true,
                        fecha_encuesta_enviada = now(),
                        updated_at = now()
                    WHERE cliente_id = v_cand.cliente_id
                      AND business_id = v_negocio.id
                      AND (
                        id = v_cand.cita_id
                        OR (
                          fecha::date = (SELECT c_orig.fecha::date FROM public."Citas" c_orig WHERE c_orig.id = v_cand.cita_id)
                          AND estado ILIKE 'completada'
                        )
                      );

                    v_encolados := v_encolados + 1;
                EXCEPTION WHEN OTHERS THEN
                    RAISE WARNING 'encolar_calificacion_post_cita (reciente) - cita %: %', v_cand.cita_id, SQLERRM;
                END;
            END LOOP;

            -- =========================================================================
            -- RAMA 2: LÓGICA PERMANENTE: Citas pasadas / retroactivas (> 48h) en salones con sellos
            -- Se omite la encuesta y se despachan SOLO los sellos en horario respetuoso (09:15 AM)
            -- =========================================================================
            IF COALESCE(v_negocio.modo_fidelizacion, 'sellos') IN ('sellos', 'ambos')
               AND COALESCE((v_negocio.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, true) = true THEN
               
                v_jitter_secs := 0;

                FOR v_retro IN
                    SELECT DISTINCT ON (c.cliente_id)
                        c.id AS cita_id,
                        c.cliente_id,
                        c.fecha
                    FROM public."Citas" c
                    JOIN public."Clientes" cl ON cl.id = c.cliente_id
                    WHERE c.business_id = v_negocio.id
                      AND c.estado ILIKE 'completada'
                      AND (c.encuesta_enviada IS NULL OR c.encuesta_enviada = false)
                      AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') < (NOW() - INTERVAL '48 hours')
                      -- Solo si la cita se cargó recientemente (en los últimos 7 días) para no revivir citas de hace meses
                      AND c.created_at >= (NOW() - INTERVAL '7 days')
                      -- Que tenga teléfono sanitizado válido
                      AND public.fn_sanitizar_y_resolver_telefono_cliente(
                            c.business_id,
                            c.cliente_id,
                            cl.telefono,
                            cl.nombre,
                            v_negocio.pais
                          ) IS NOT NULL
                      -- Evitar reenviar si ya tiene mensaje de sellos en cola o reciente
                      AND NOT EXISTS (
                          SELECT 1 FROM public.cola_mensajes_salientes cms
                          WHERE cms.cliente_id = c.cliente_id
                            AND cms.business_id = v_negocio.id
                            AND cms.flujo IN ('fidelizacion_recompensa', 'club_glow_sellos')
                            AND cms.created_at >= (NOW() - INTERVAL '24 hours')
                      )
                    ORDER BY c.cliente_id, c.fecha DESC, c.id DESC
                    LIMIT 20
                LOOP
                    BEGIN
                        -- Calcular horario respetuoso (mañana a las 09:15 AM si es de noche o madrugada)
                        v_proximo_envio := public.calcular_proximo_horario_respetuoso(v_negocio.timezone) + (v_jitter_secs || ' seconds')::interval;
                        v_jitter_secs := v_jitter_secs + 90; -- Espaciar 90 segundos entre clientas

                        -- Procesar sellos omitidos
                        FOR v_r IN SELECT * FROM public.procesar_sellos_encuesta_omitida(v_negocio.id, v_retro.cliente_id) LOOP
                            IF v_r.r_debe_responder AND v_r.r_mensaje IS NOT NULL AND v_r.r_telefono IS NOT NULL THEN
                                v_delay_ms := (public.calcular_delay_escritura_humana(v_r.r_mensaje) * 1000)::integer;

                                INSERT INTO public.cola_mensajes_salientes (
                                    business_id, cliente_id, cita_id, telefono,
                                    flujo, mensaje, media_url, media_type,
                                    delay_ms, instance_name, api_key,
                                    estado, proximo_intento_at,
                                    metadata
                                ) VALUES (
                                    v_negocio.id,
                                    v_retro.cliente_id,
                                    v_r.r_cita_id,
                                    v_r.r_telefono,
                                    'fidelizacion_recompensa',
                                    v_r.r_mensaje,
                                    v_r.r_media_url,
                                    CASE WHEN v_r.r_media_url IS NOT NULL THEN 'image' ELSE NULL END,
                                    v_delay_ms,
                                    v_r.r_instance_name,
                                    v_r.r_api_key,
                                    'pendiente',
                                    v_proximo_envio,
                                    jsonb_build_object(
                                        'tipo', 'sellos_retroactivos_respetuoso',
                                        'horario_programado', v_proximo_envio,
                                        'canal', 'club_glow'
                                    )
                                )
                                ON CONFLICT DO NOTHING;

                                v_encolados := v_encolados + 1;
                            END IF;
                        END LOOP;
                    EXCEPTION WHEN OTHERS THEN
                        RAISE WARNING 'encolar_calificacion_post_cita (retroactivo) - cliente %: %', v_retro.cliente_id, SQLERRM;
                    END;
                END LOOP;
            END IF;

            -- Auto-cerrar citas huérfanas sin teléfono
            UPDATE public."Citas" c
            SET encuesta_enviada = true,
                fecha_encuesta_enviada = now(),
                feedback_cliente = 'Auto-omitido: Sin teléfono celular resoluble',
                updated_at = now()
            WHERE c.business_id = v_negocio.id
              AND c.estado ILIKE 'completada'
              AND (c.encuesta_enviada IS NULL OR c.encuesta_enviada = false)
              AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') <= (NOW() - INTERVAL '30 minutes')
              AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '48 hours')
              AND public.fn_sanitizar_y_resolver_telefono_cliente(
                    c.business_id,
                    c.cliente_id,
                    (SELECT cl_sub.telefono FROM public."Clientes" cl_sub WHERE cl_sub.id = c.cliente_id),
                    (SELECT cl_sub.nombre FROM public."Clientes" cl_sub WHERE cl_sub.id = c.cliente_id),
                    v_negocio.pais
                  ) IS NULL;

        END LOOP;

        RETURN jsonb_build_object(
            'success', true,
            'encolados', v_encolados,
            'timestamp', now()
        );
    END;
    $function$;
  `);

  // 4. Ejecutar la función ahora mismo para que encole las 4 clientas de Glamour y Capricho
  console.log("4. Ejecutando public.encolar_calificacion_post_cita()...");
  const rEncolar = await client.query(`SELECT public.encolar_calificacion_post_cita();`);
  console.log("Resultado encolar:", JSON.stringify(rEncolar.rows[0], null, 2));

  // 5. Verificar cómo quedaron programados los mensajes en la cola
  console.log("\n5. Verificando cola de mensajes salientes para Glamour y Capricho:");
  const rCola = await client.query(`
    SELECT cms.id, cms.cliente_id, cl.nombre, cms.telefono, cms.flujo, cms.estado, 
           cms.proximo_intento_at, 
           to_char(cms.proximo_intento_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD HH12:MI:SS AM') as hora_peru,
           cms.mensaje
    FROM public.cola_mensajes_salientes cms
    JOIN public."Clientes" cl ON cl.id = cms.cliente_id
    WHERE cms.business_id = '4b004ede-64e0-4f30-84fd-190a17b369eb'
      AND cms.estado = 'pendiente'
    ORDER BY cms.proximo_intento_at ASC;
  `);
  console.log(JSON.stringify(rCola.rows, null, 2));

  await client.end();
}

main().catch(console.error);
