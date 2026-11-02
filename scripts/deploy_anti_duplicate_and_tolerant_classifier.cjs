const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("=== INICIANDO DESPLIEGUE QUIRÚRGICO DE BLINDAJE ANTI-DUPLICADOS Y CLASIFICADOR TOLERANTE ===");

  // 1. Actualizar public.fn_clasificar_respuesta_calificacion
  console.log("1. Actualizando public.fn_clasificar_respuesta_calificacion...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.fn_clasificar_respuesta_calificacion(p_texto text)
    RETURNS TABLE(nivel text, nota text)
    LANGUAGE plpgsql
    STABLE
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $function$
    DECLARE
      v_raw text;
      v_norm text;
      v_strict text;
    BEGIN
      v_raw := TRIM(REPLACE(COALESCE(p_texto, ''), chr(65039), ''));
      IF length(v_raw) = 0 THEN
        RETURN QUERY SELECT 'C'::text, NULL::text;
        RETURN;
      END IF;

      v_norm := LOWER(UNACCENT(v_raw));
      v_strict := TRIM(REGEXP_REPLACE(REGEXP_REPLACE(v_norm, '[.!¡?¿,;:]+', '', 'g'), '[[:space:]]+', ' ', 'g'));

      -- NIVEL A (100% seguro): nota directa o nota acompañada de elogio/calificativo
      IF length(v_strict) <= 45 THEN
        -- Caso A1: Número solo o con formato estándar de nota
        IF v_strict ~ '^(un |una |nota |le doy |le pongo |te doy |mi nota es |es un )?[1-5]( ?(estrellas?|estrellitas?|pts|puntos|/ ?5|de 5|[*]+|⭐|🌟))?$' THEN
          RETURN QUERY SELECT 'A'::text, substring(v_strict FROM '[1-5]');
          RETURN;
        -- Caso A2: Número del 1 al 5 acompañado de elogio común (ej: "5 exelente", "5 super", "excelente 5", "5 me encanto", "5 estrellas")
        ELSIF v_strict ~ '(^|[^0-9])[1-5]([^0-9]|$)' AND
              v_strict ~* '(exelente|excelente|eselente|ecselente|super|supper|perfecto|perfecta|genial|lindo|linda|bello|bella|divino|divina|hermoso|hermosa|bien|muy bien|bueno|buena|muy buena|muy bueno|gracias|atencion|servicio|todo bien|todo lindo|me encanto|me gusto)' THEN
          RETURN QUERY SELECT 'A'::text, substring(v_strict FROM '[1-5]');
          RETURN;
        ELSIF v_strict ~ '^(⭐|🌟)+$' AND char_length(v_strict) BETWEEN 1 AND 5 THEN
          RETURN QUERY SELECT 'A'::text, char_length(v_strict)::text;
          RETURN;
        ELSIF v_strict ~ '^(uno|dos|tres|cuatro|cinco)$' THEN
          RETURN QUERY SELECT 'A'::text, (CASE v_strict WHEN 'uno' THEN '1' WHEN 'dos' THEN '2' WHEN 'tres' THEN '3' WHEN 'cuatro' THEN '4' ELSE '5' END);
          RETURN;
        END IF;
      END IF;

      -- NIVEL B (probable): intención de nota / opinión pero SIN número explícito -> se repregunta amablemente
      IF v_norm ~* '(me encanto|me gusto mucho|quedo hermoso|quedo lindo|quedo bello|quedo divino|quedaron bellas|quedaron hermosas|excelente|exelente|eselente|ecselente|espectacular|maravilloso|impecable|perfecto|bellisimo|divino|super bien|10/10|un 10|las mejores|mejor atencion|muy buena atencion|no me gusto|se me cayo|se salio|se me despego|me dolio|me ardio|me mancho|chueco|mal hecho|demoraron|espere mucho|esperamos mucho|pesimo|mala atencion|no vuelvo|no me atendieron bien)' THEN
        RETURN QUERY SELECT 'B'::text, NULL::text;
        RETURN;
      END IF;
      IF v_norm ~ '(^|[^0-9])[1-5]([^0-9]|$)'
         AND v_norm ~* '(estrella|nota|califico|calificacion|puntos|pongo|doy|de 5|/ ?5|del 1 al 5|un [1-5]([^0-9]|$))' THEN
        RETURN QUERY SELECT 'B'::text, NULL::text;
        RETURN;
      END IF;

      -- NIVEL C: cualquier otra cosa (conversación normal) -> se ignora para calificar
      RETURN QUERY SELECT 'C'::text, NULL::text;
    END;
    $function$;
  `);
  console.log("   -> public.fn_clasificar_respuesta_calificacion actualizada.");

  // 2. Actualizar procesar_sellos_encuesta_omitida para cancelar cualquier pendiente de fidelización y no pisar fecha
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
      SET estado = 'cancelado',
          updated_at = now()
      WHERE cms.cliente_id = p_cliente_id AND cms.business_id = p_business_id
        AND cms.flujo IN ('club_glow_sellos', 'fidelizacion_sellos_recompensa', 'fidelizacion_recompensa')
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

      -- Marcar la encuesta como omitida_sellos en todas las citas de ese día sin pisar fecha histórica
      UPDATE public."Citas" c
      SET calificacion_origen = 'omitida_sellos',
          encuesta_enviada = true,
          fecha_encuesta_enviada = COALESCE(c.fecha_encuesta_enviada, now()),
          updated_at = now()
      WHERE c.cliente_id = p_cliente_id AND c.business_id = p_business_id
        AND (c.id = v_cita.id OR (c.fecha::date = v_cita.fecha::date AND c.estado ILIKE 'completada'))
        AND (c.calificacion IS NULL OR c.calificacion IN ('', '0'));

      -- Sanitizar y resolver teléfono
      v_tel := public.fn_sanitizar_y_resolver_telefono_cliente(p_business_id, p_cliente_id, v_cliente.telefono, v_cliente.nombre, v_negocio.pais);

      RETURN QUERY SELECT true, v_cita.id, v_tel, v_inst.instance_name, v_inst.api_key, v_msg, v_media;
    END;
    $function$;
  `);
  console.log("   -> public.procesar_sellos_encuesta_omitida actualizada.");

  // 3. Actualizar public.procesar_encuestas_omitidas con blindaje de ventana 2h
  console.log("3. Actualizando public.procesar_encuestas_omitidas...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.procesar_encuestas_omitidas(p_horas_espera numeric DEFAULT 3, p_dry_run boolean DEFAULT false)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public', 'extensions', 'pg_temp'
    AS $function$
    DECLARE
      v_c record; v_r record; v_enc int := 0; v_lista jsonb := '[]'::jsonb; v_delay int;
      v_vigente_desde CONSTANT timestamptz := '2026-10-29 17:00:00-05';
    BEGIN
      FOR v_c IN
        SELECT DISTINCT ON (c.business_id, c.cliente_id)
               c.business_id, c.cliente_id, c.id AS cita_id, c.fecha_encuesta_enviada, n.nombre AS salon
        FROM public."Citas" c
        JOIN public.negocios n ON n.id = c.business_id AND n.activo = true
        WHERE c.encuesta_enviada = true
          AND (c.calificacion IS NULL OR c.calificacion IN ('', '0'))
          AND (c.calificacion_origen IS NULL OR c.calificacion_origen NOT IN ('omitida_sellos', 'manual_superadmin'))
          AND c.fecha_encuesta_enviada >= v_vigente_desde
          AND c.fecha_encuesta_enviada >= now() - interval '48 hours'
          AND c.fecha_encuesta_enviada <= now() - (p_horas_espera * interval '1 hour')
          AND COALESCE(n.modo_fidelizacion, 'sellos') IN ('sellos', 'ambos')
          AND COALESCE((n.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, true) = true
          AND (now() AT TIME ZONE COALESCE(n.timezone, 'America/Lima'))::time BETWEEN '07:00' AND '22:00'
          -- Sin conversacion reciente con la clienta
          AND NOT EXISTS (
            SELECT 1 FROM public.mensajes m
            WHERE m.cliente_id = c.cliente_id AND m.business_id = c.business_id
              AND m.created_at > now() - interval '30 minutes'
          )
          -- Blindaje anti-duplicados: que no haya recibido recompensa o sellos en las ultimas 2 horas
          AND NOT EXISTS (
            SELECT 1 FROM public.mensajes m2
            WHERE m2.cliente_id = c.cliente_id AND m2.business_id = c.business_id
              AND m2.campana_origen IN ('recompensa_fidelizacion', 'atencion_queja_feedback', 'fidelizacion_recompensa', 'fidelizacion_queja')
              AND m2.created_at >= (now() - interval '2 hours')
          )
          AND NOT EXISTS (
            SELECT 1 FROM public.cola_mensajes_salientes q
            WHERE q.cliente_id = c.cliente_id AND q.business_id = c.business_id
              AND q.flujo IN ('fidelizacion_recompensa', 'fidelizacion_queja', 'fidelizacion_sellos_recompensa', 'club_glow_sellos')
              AND q.estado IN ('pendiente', 'procesando', 'enviado')
              AND q.created_at >= (now() - interval '2 hours')
          )
        ORDER BY c.business_id, c.cliente_id, c.fecha DESC, c.id DESC
      LOOP
        IF p_dry_run THEN
          v_lista := v_lista || jsonb_build_object('salon', v_c.salon, 'cliente_id', v_c.cliente_id, 'cita_id', v_c.cita_id, 'encuesta_enviada', v_c.fecha_encuesta_enviada);
          CONTINUE;
        END IF;

        BEGIN
          FOR v_r IN SELECT * FROM public.procesar_sellos_encuesta_omitida(v_c.business_id, v_c.cliente_id) LOOP
            IF v_r.r_debe_responder AND v_r.r_mensaje IS NOT NULL AND v_r.r_instance_name IS NOT NULL THEN
              v_delay := (public.calcular_delay_escritura_humana(v_r.r_mensaje) * 1000)::integer;
              INSERT INTO public.cola_mensajes_salientes (
                business_id, cliente_id, cita_id, telefono, flujo, mensaje, media_url, media_type,
                delay_ms, instance_name, api_key, estado, proximo_intento_at, metadata
              ) VALUES (
                v_c.business_id, v_c.cliente_id, v_r.r_cita_id, v_r.r_telefono, 'fidelizacion_recompensa', v_r.r_mensaje,
                v_r.r_media_url, CASE WHEN v_r.r_media_url IS NOT NULL THEN 'image' ELSE NULL END,
                v_delay, v_r.r_instance_name, v_r.r_api_key, 'pendiente', now(),
                jsonb_build_object('tipo', 'respuesta_calificacion_omitida', 'nota', 'omitida', 'cita_id', v_r.r_cita_id)
              );
              INSERT INTO public.calificacion_decision_log (business_id, cliente_id, contenido, nivel, decision)
              VALUES (v_c.business_id, v_c.cliente_id, NULL, 'OMITIDA', 'sellos_enviados_sin_nota');
              v_enc := v_enc + 1;
            END IF;
          END LOOP;
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'procesar_encuestas_omitidas cliente %: %', v_c.cliente_id, SQLERRM;
        END;
      END LOOP;

      RETURN jsonb_build_object('ok', true, 'dry_run', p_dry_run, 'encolados', v_enc, 'candidatos', v_lista);
    END;
    $function$;
  `);
  console.log("   -> public.procesar_encuestas_omitidas actualizada.");

  // 4. Actualizar public.despachar_cola_mensajes con Candado de Idempotencia Anti-Duplicado
  console.log("4. Blindando public.despachar_cola_mensajes con Candado de Idempotencia (15 min)...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.despachar_cola_mensajes(p_lote integer DEFAULT 5)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
        v_msg                record;
        v_http_res           extensions.http_response;
        v_enviados           integer := 0;
        v_fallidos           integer := 0;
        v_reintentados       integer := 0;
        v_http_status        integer;
        v_backoff_mins       integer;
        v_error_detalle      text;
        v_consecutive_errors integer := 0;
        v_circuit_broken     boolean := false;
        v_tel_auto           text;
    BEGIN
        FOR v_msg IN
            SELECT *
            FROM public.cola_mensajes_salientes
            WHERE estado = 'pendiente'
              AND proximo_intento_at <= now()
            ORDER BY proximo_intento_at ASC
            LIMIT p_lote
            FOR UPDATE SKIP LOCKED
        LOOP
            -- Circuit Breaker
            IF v_consecutive_errors >= 2 THEN
                v_circuit_broken := true;
                EXIT;
            END IF;

            -- Auto-sanitizar y auto-resolver teléfono si es inválido o LID
            SELECT public.fn_sanitizar_y_resolver_telefono_cliente(
                v_msg.business_id,
                v_msg.cliente_id,
                v_msg.telefono,
                (SELECT cl_sub.nombre FROM public."Clientes" cl_sub WHERE cl_sub.id = v_msg.cliente_id),
                (SELECT neg_sub.pais FROM public.negocios neg_sub WHERE neg_sub.id = v_msg.business_id)
            ) INTO v_tel_auto;

            IF v_tel_auto IS NOT NULL THEN
                IF v_tel_auto <> v_msg.telefono THEN
                    v_msg.telefono := v_tel_auto;
                    UPDATE public.cola_mensajes_salientes
                    SET telefono = v_tel_auto, updated_at = now()
                    WHERE id = v_msg.id;
                END IF;
            ELSE
                -- Si no tiene teléfono resoluble, omitir silenciosamente
                UPDATE public.cola_mensajes_salientes
                SET estado = 'omitido',
                    error_mensaje = 'Omitido automáticamente: Identificador LID sin número telefónico real vinculado',
                    updated_at = now()
                WHERE id = v_msg.id;
                CONTINUE;
            END IF;

            -- =========================================================================
            -- CANDADO CRÍTICO DE IDEMPOTENCIA / ANTI-DUPLICIDAD
            -- Si para este cliente ya se despachó un mensaje en los últimos 15 minutos
            -- del mismo flujo o con contenido equivalente, omitir este envío.
            -- =========================================================================
            IF EXISTS (
                SELECT 1 FROM public.mensajes m_recent
                WHERE m_recent.business_id = v_msg.business_id
                  AND m_recent.cliente_id = v_msg.cliente_id
                  AND m_recent.direccion = 'saliente'
                  AND m_recent.created_at >= (now() - interval '15 minutes')
                  AND (
                      m_recent.campana_origen = v_msg.flujo
                      OR LEFT(m_recent.contenido, 40) = LEFT(v_msg.mensaje, 40)
                  )
            ) OR EXISTS (
                SELECT 1 FROM public.cola_mensajes_salientes cms_recent
                WHERE cms_recent.id <> v_msg.id
                  AND cms_recent.business_id = v_msg.business_id
                  AND cms_recent.cliente_id = v_msg.cliente_id
                  AND cms_recent.estado = 'enviado'
                  AND cms_recent.enviado_at >= (now() - interval '15 minutes')
                  AND (
                      cms_recent.flujo = v_msg.flujo
                      OR LEFT(cms_recent.mensaje, 40) = LEFT(v_msg.mensaje, 40)
                  )
            ) THEN
                UPDATE public.cola_mensajes_salientes
                SET estado = 'omitido',
                    error_mensaje = 'Omitido automáticamente: Mensaje similar ya entregado en los últimos 15 min (anti-duplicado)',
                    updated_at = now()
                WHERE id = v_msg.id;
                CONTINUE;
            END IF;

            -- Pausa aleatoria para naturalidad
            IF v_enviados > 0 THEN
                PERFORM pg_sleep(3.0 + (random() * 4.0));
            END IF;

            UPDATE public.cola_mensajes_salientes
            SET estado = 'procesando', intentos = intentos + 1, updated_at = now()
            WHERE id = v_msg.id;

            BEGIN
                IF v_msg.media_url IS NOT NULL AND v_msg.media_url <> '' THEN
                    SELECT * INTO v_http_res FROM extensions.http((
                        'POST',
                        'https://evo.koratflow.agency/message/sendMedia/' || v_msg.instance_name,
                        ARRAY[
                            extensions.http_header('apikey',       v_msg.api_key),
                            extensions.http_header('Content-Type', 'application/json')
                        ],
                        'application/json',
                        jsonb_build_object(
                            'number',    v_msg.telefono,
                            'mediatype', COALESCE(v_msg.media_type, 'image'),
                            'mimetype',  'image/jpeg',
                            'caption',   v_msg.mensaje,
                            'media',     v_msg.media_url
                        )::text
                    )::extensions.http_request);
                ELSE
                    SELECT * INTO v_http_res FROM extensions.http((
                        'POST',
                        'https://evo.koratflow.agency/message/sendText/' || v_msg.instance_name,
                        ARRAY[
                            extensions.http_header('apikey',       v_msg.api_key),
                            extensions.http_header('Content-Type', 'application/json')
                        ],
                        'application/json',
                        jsonb_build_object(
                            'number',      v_msg.telefono,
                            'text',        v_msg.mensaje,
                            'linkPreview', false,
                            'options',     jsonb_build_object(
                                'delay',       v_msg.delay_ms,
                                'presence',    'composing',
                                'linkPreview', false
                            )
                        )::text
                    )::extensions.http_request);
                END IF;

                v_http_status := v_http_res.status;

                IF v_http_status BETWEEN 200 AND 299 THEN
                    v_consecutive_errors := 0;

                    UPDATE public.cola_mensajes_salientes
                    SET estado = 'enviado', enviado_at = now(), error_mensaje = NULL, updated_at = now()
                    WHERE id = v_msg.id;

                    IF v_msg.flujo = 'recordatorio_24h' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET recordatorio_24h_enviado = true, updated_at = now() WHERE id = v_msg.cita_id;
                    ELSIF v_msg.flujo = 'recordatorio_3h' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET recordatorio_3h_enviado = true, updated_at = now() WHERE id = v_msg.cita_id;
                    ELSIF v_msg.flujo = 'fidelizacion_encuesta' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET encuesta_enviada = true, fecha_encuesta_enviada = now(), updated_at = now() WHERE id = v_msg.cita_id;
                    ELSIF v_msg.flujo = 'calificacion_encuesta' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET encuesta_enviada = true, fecha_encuesta_enviada = now(), updated_at = now() WHERE id = v_msg.cita_id;
                    ELSIF v_msg.flujo = 'campana_masiva' AND v_msg.campana_id IS NOT NULL THEN
                        UPDATE public.campanas
                        SET enviados = COALESCE(enviados, 0) + 1, updated_at = now()
                        WHERE id = v_msg.campana_id;
                    END IF;

                    INSERT INTO public.mensajes (
                        business_id, cliente_id, contenido, tipo,
                        direccion, estado, campana_origen, created_at, updated_at
                    ) VALUES (
                        v_msg.business_id,
                        v_msg.cliente_id,
                        v_msg.mensaje,
                        CASE WHEN v_msg.media_url IS NOT NULL AND v_msg.media_url <> '' THEN 'media' ELSE 'texto' END,
                        'saliente',
                        'enviado',
                        v_msg.flujo,
                        now(),
                        now()
                    );

                    UPDATE public."Clientes"
                    SET ultimo_mensaje_enviado = now(),
                        tipo_ultimo_mensaje = v_msg.flujo,
                        mensajes_semana = COALESCE(mensajes_semana, 0) + 1
                    WHERE id = v_msg.cliente_id;

                    IF v_msg.flujo IN (
                        'campana_masiva', 'rescate_45d', 'rescate_75d',
                        'rescate_120d', 'fidelizacion_encuesta'
                    ) THEN
                        UPDATE public."Clientes"
                        SET ultimo_mensaje_marketing = now()
                        WHERE id = v_msg.cliente_id;
                    END IF;

                    v_enviados := v_enviados + 1;

                ELSIF v_http_status BETWEEN 400 AND 499 THEN
                    IF v_http_status IN (401, 403, 404) THEN
                        v_consecutive_errors := v_consecutive_errors + 1;
                    END IF;

                    UPDATE public.cola_mensajes_salientes
                    SET estado = 'fallido',
                        error_mensaje = 'HTTP ' || v_http_status || ' (cliente): ' || COALESCE(LEFT(v_http_res.content, 200), 'sin detalle'),
                        updated_at = now()
                    WHERE id = v_msg.id;
                    v_fallidos := v_fallidos + 1;

                ELSE
                    v_consecutive_errors := v_consecutive_errors + 1;
                    v_backoff_mins := LEAST(60, (2 ^ (v_msg.intentos - 1))::integer);

                    IF (v_msg.intentos + 1) > v_msg.max_intentos THEN
                        UPDATE public.cola_mensajes_salientes
                        SET estado = 'fallido',
                            error_mensaje = 'Agotados ' || v_msg.max_intentos || ' intentos. Ultimo HTTP: ' || v_http_status,
                            updated_at = now()
                        WHERE id = v_msg.id;
                        v_fallidos := v_fallidos + 1;
                    ELSE
                        UPDATE public.cola_mensajes_salientes
                        SET estado = 'pendiente',
                            proximo_intento_at = now() + (v_backoff_mins || ' minutes')::interval,
                            error_mensaje = 'HTTP ' || v_http_status || ' - reintento en ' || v_backoff_mins || 'min',
                            updated_at = now()
                        WHERE id = v_msg.id;
                        v_reintentados := v_reintentados + 1;
                    END IF;
                END IF;

            EXCEPTION WHEN OTHERS THEN
                v_consecutive_errors := v_consecutive_errors + 1;
                v_error_detalle := LEFT(SQLERRM, 300);
                v_backoff_mins  := LEAST(60, (2 ^ (v_msg.intentos - 1))::integer);

                IF (v_msg.intentos + 1) > v_msg.max_intentos THEN
                    UPDATE public.cola_mensajes_salientes
                    SET estado = 'fallido',
                        error_mensaje = 'Exception: ' || v_error_detalle,
                        updated_at = now()
                    WHERE id = v_msg.id;
                    v_fallidos := v_fallidos + 1;
                ELSE
                    UPDATE public.cola_mensajes_salientes
                    SET estado = 'pendiente',
                        proximo_intento_at = now() + (v_backoff_mins || ' minutes')::interval,
                        error_mensaje = 'Exception: ' || v_error_detalle,
                        updated_at = now()
                    WHERE id = v_msg.id;
                    v_reintentados := v_reintentados + 1;
                END IF;
            END;
        END LOOP;

        IF v_circuit_broken THEN
            INSERT INTO public.errores_bot (
                workflow_name, nodo_fallido, mensaje_error, mensaje_usuario
            ) VALUES (
                'despachar_cola_mensajes',
                'Circuit Breaker Activado',
                'Se detuvo el despacho del lote preventivamente tras fallos consecutivos de Evolution API.',
                'Lote pausado para proteger números e instancias.'
            );
        END IF;

        RETURN jsonb_build_object(
            'success',        true,
            'enviados',       v_enviados,
            'fallidos',       v_fallidos,
            'reintentados',   v_reintentados,
            'circuit_broken', v_circuit_broken,
            'timestamp',      now()
        );
    END;
    $function$;
  `);
  console.log("   -> public.despachar_cola_mensajes actualizada con blindaje de idempotencia.");

  // 5. Corregir y dejar limpia la Cita #1459 de Dunia Magali Cutipa
  console.log("5. Regularizando la nota 5 de Dunia Cutipa en Cita #1459...");
  await client.query(`
    UPDATE public."Citas"
    SET calificacion = '5',
        calificacion_origen = 'respuesta_whatsapp',
        feedback_cliente = '5 exelente',
        updated_at = now()
    WHERE id = 1459;
  `);
  console.log("   -> Cita #1459 actualizada a calificación 5⭐.");

  console.log("=== DESPLIEGUE FINALIZADO CON ÉXITO ===");
  await client.end();
}

main().catch(console.error);
