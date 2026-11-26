const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('=== INICIANDO DESPLIEGUE QUIRÚRGICO DE REFUERZO DE CALIFICACIÓN Y COLA ===\n');

  // =========================================================================
  // PASO 1: ACTUALIZAR public.fn_clasificar_respuesta_calificacion
  // =========================================================================
  console.log('1. Actualizando public.fn_clasificar_respuesta_calificacion con soporte para estrellas y emoticones...');
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
      v_solo_alfanum text;
      v_star_count int;
      v_num_match text;
      v_hearts_count int;
    BEGIN
      v_raw := TRIM(REPLACE(COALESCE(p_texto, ''), chr(65039), ''));
      IF length(v_raw) = 0 THEN
        RETURN QUERY SELECT 'C'::text, NULL::text;
        RETURN;
      END IF;

      -- Conteo seguro de estrellas nativas
      v_star_count := REGEXP_COUNT(v_raw, '[⭐🌟★]');

      v_norm := LOWER(UNACCENT(v_raw));
      v_strict := TRIM(REGEXP_REPLACE(REGEXP_REPLACE(v_norm, '[.!¡?¿,;:]+', '', 'g'), '[[:space:]]+', ' ', 'g'));
      v_solo_alfanum := TRIM(REGEXP_REPLACE(v_norm, '[^0-9a-z]', '', 'g'));

      -- =====================================================================
      -- 1. DETECCIÓN POR ESTRELLAS (Emojis de estrellas solos o con texto/emojis)
      -- =====================================================================
      IF v_star_count BETWEEN 1 AND 5 THEN
        -- Si viene acompañado de un número explícito del 1 al 5 (ej: "Les doy un 5 ⭐⭐⭐⭐⭐", "5 ⭐⭐⭐⭐⭐")
        v_num_match := substring(v_strict FROM '(?:^|[^0-9])([1-5])(?:[^0-9]|$)');
        IF v_num_match IS NOT NULL THEN
          RETURN QUERY SELECT 'A'::text, v_num_match;
          RETURN;
        END IF;

        -- Si no hay número pero hay entre 1 y 5 estrellas y el texto es breve/moderado (ej: "⭐⭐⭐⭐⭐", "⭐⭐⭐⭐⭐ gracias!")
        IF length(v_strict) <= 70 THEN
          RETURN QUERY SELECT 'A'::text, v_star_count::text;
          RETURN;
        END IF;
      END IF;

      -- Detección de corazones puros sin texto alfanumérico (ej: "❤️❤️❤️❤️❤️")
      IF length(v_solo_alfanum) = 0 THEN
        v_hearts_count := REGEXP_COUNT(v_raw, '[❤️❤💖💕]');
        IF v_hearts_count BETWEEN 1 AND 5 THEN
          RETURN QUERY SELECT 'A'::text, v_hearts_count::text;
          RETURN;
        END IF;
      END IF;

      -- =====================================================================
      -- 2. NIVEL A (100% seguro)
      -- =====================================================================
      IF length(v_strict) <= 55 THEN
        -- Caso A1: Escala 10/10 -> Equivale a 5 estrellas
        IF v_strict ~ '^(un |una |nota |le doy |les doy |le pongo |les pongo |te doy |mi nota es |es un )?10( ?(/ ?10|de 10|puntos?|pts?|estrellas?|[*]+|⭐|🌟|❤️|💖))?$'
           OR v_strict ~ '^10/10'
           OR v_strict ~ '10/10$'
           OR v_solo_alfanum IN ('10', '1010', 'un10', '10de10') THEN
          RETURN QUERY SELECT 'A'::text, '5'::text;
          RETURN;
        END IF;

        -- Caso A2: Número del 1 al 5 solo (o con emojis de afecto, ej: "5 ❤️", "5 🥰", "5 ✨")
        IF v_solo_alfanum IN ('1', '2', '3', '4', '5') THEN
          RETURN QUERY SELECT 'A'::text, v_solo_alfanum;
          RETURN;
        END IF;

        -- Caso A3: Número del 1 al 5 con prefijos/sufijos permisivos ("les doy un 5", "le doy 5", "un 5", "5 estrellas")
        IF v_strict ~ '^(un |una |nota |le doy |les doy |le doy un |les doy un |le pongo |les pongo |te doy |mi nota es |es un )?[1-5]( ?(estrellas?|estrellitas?|pts|puntos|/ ?5|de 5|[*]+|⭐|🌟))?$' THEN
          RETURN QUERY SELECT 'A'::text, substring(v_strict FROM '[1-5]');
          RETURN;
        END IF;

        -- Caso A4: Número del 1 al 5 acompañado de elogio común o emoticones positivos
        IF v_strict ~ '(^|[^0-9])[1-5]([^0-9]|$)' AND (
           v_strict ~* '(exelente|excelente|eselente|ecselente|super|supper|perfecto|perfecta|genial|lindo|linda|bello|bella|divino|divina|hermoso|hermosa|bien|muy bien|bueno|buena|muy buena|muy bueno|gracias|atencion|servicio|todo bien|todo lindo|me encanto|me gusto|doy|pongo|califico|estrella)'
           OR v_raw ~ '[🥰😍❤️💖💕✨👑👏🏻👏🏽👏🏼👏👍👌]'
        ) THEN
          RETURN QUERY SELECT 'A'::text, substring(v_strict FROM '[1-5]');
          RETURN;
        END IF;

        -- Caso A5: Palabras numéricas
        IF v_strict ~ '^(uno|dos|tres|cuatro|cinco)$' THEN
          RETURN QUERY SELECT 'A'::text, (CASE v_strict WHEN 'uno' THEN '1' WHEN 'dos' THEN '2' WHEN 'tres' THEN '3' WHEN 'cuatro' THEN '4' ELSE '5' END);
          RETURN;
        END IF;
      END IF;

      -- =====================================================================
      -- 3. NIVEL B (probable): intención de nota / opinión sin número explícito
      -- =====================================================================
      IF v_norm ~* '(me encanto|me gusto mucho|quedo hermoso|quedo lindo|quedo bello|quedo divino|quedaron bellas|quedaron hermosas|excelente|exelente|eselente|ecselente|espectacular|maravilloso|impecable|perfecto|bellisimo|divino|super bien|las mejores|mejor atencion|muy buena atencion|no me gusto|se me cayo|se salio|se me despego|me dolio|me ardio|me mancho|chueco|mal hecho|demoraron|espere mucho|esperamos mucho|pesimo|mala atencion|no vuelvo|no me atendieron bien)' THEN
        RETURN QUERY SELECT 'B'::text, NULL::text;
        RETURN;
      END IF;
      IF v_norm ~ '(^|[^0-9])[1-5]([^0-9]|$)'
         AND v_norm ~* '(estrella|nota|califico|calificacion|puntos|pongo|doy|de 5|/ ?5|del 1 al 5|un [1-5]([^0-9]|$))' THEN
        RETURN QUERY SELECT 'B'::text, NULL::text;
        RETURN;
      END IF;

      -- =====================================================================
      -- 4. NIVEL C: cualquier otra cosa (conversación normal)
      -- =====================================================================
      RETURN QUERY SELECT 'C'::text, NULL::text;
    END;
    $function$;
  `);
  console.log('   -> public.fn_clasificar_respuesta_calificacion actualizada con éxito.\n');

  // =========================================================================
  // PASO 2: ACTUALIZAR public.despachar_cola_mensajes (Blindaje Anti-Duplicado Inteligente)
  // =========================================================================
  console.log('2. Actualizando public.despachar_cola_mensajes con Candado Anti-Duplicado Inteligente...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.despachar_cola_mensajes(p_lote integer DEFAULT 5)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET statement_timeout TO '45s'
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
                UPDATE public.cola_mensajes_salientes
                SET estado = 'omitido',
                    error_mensaje = 'Omitido automáticamente: Identificador LID sin número telefónico real vinculado',
                    updated_at = now()
                WHERE id = v_msg.id;
                CONTINUE;
            END IF;

            -- =========================================================================
            -- CANDADO CRÍTICO DE IDEMPOTENCIA / ANTI-DUPLICIDAD INTELIGENTE
            -- Si para este cliente ya se despachó un mensaje en los últimos 15 minutos
            -- del mismo flujo o con contenido equivalente, omitir este envío.
            -- EXCEPCIÓN: Excluir el registro gemelo creado en la misma transacción (< 15 seg)
            -- para permitir reintentos legítimos tras fallas transitorias de red.
            -- =========================================================================
            IF EXISTS (
                SELECT 1 FROM public.mensajes m_recent
                WHERE m_recent.business_id = v_msg.business_id
                  AND m_recent.cliente_id = v_msg.cliente_id
                  AND m_recent.direccion = 'saliente'
                  AND m_recent.created_at >= (now() - interval '15 minutes')
                  AND NOT (
                      v_msg.flujo IN ('fidelizacion_recompensa', 'fidelizacion_sellos_recompensa', 'club_glow_sellos')
                      AND m_recent.campana_origen IN ('recompensa_fidelizacion', 'fidelizacion_recompensa')
                      AND ABS(EXTRACT(EPOCH FROM (m_recent.created_at - v_msg.created_at))) < 15
                  )
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
                    UPDATE public.cola_mensajes_salientes
                    SET estado = 'enviado',
                        enviado_at = now(),
                        error_mensaje = NULL,
                        updated_at = now()
                    WHERE id = v_msg.id;

                    -- Insertar en mensajes solo si no existe ya como espejo
                    IF NOT EXISTS (
                        SELECT 1 FROM public.mensajes m_dup
                        WHERE m_dup.cliente_id = v_msg.cliente_id
                          AND m_dup.business_id = v_msg.business_id
                          AND m_dup.direccion = 'saliente'
                          AND ABS(EXTRACT(EPOCH FROM (m_dup.created_at - v_msg.created_at))) < 15
                          AND LEFT(m_dup.contenido, 40) = LEFT(v_msg.mensaje, 40)
                    ) THEN
                        INSERT INTO public.mensajes (
                            business_id, cliente_id, contenido, tipo, direccion,
                            estado, campana_origen, created_at, updated_at
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
                    END IF;

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
  console.log('   -> public.despachar_cola_mensajes actualizada con éxito.\n');

  // =========================================================================
  // PASO 3: ACTUALIZAR public.trg_fn_procesar_feedback_fidelizacion (Captura de ID exacto)
  // =========================================================================
  console.log('3. Actualizando public.trg_fn_procesar_feedback_fidelizacion con aislamiento de ID...');
  await client.query(`
    CREATE OR REPLACE FUNCTION public.trg_fn_procesar_feedback_fidelizacion()
     RETURNS trigger
     LANGUAGE plpgsql
     SECURITY DEFINER
    AS $function$
    DECLARE
        v_res record;
        v_target_cliente_id bigint := NULL;
        v_target_phone text;
        v_raw_phone text;
        v_clean_content text;
        v_norm_content text;
        v_evo_phone text;
        v_http_res extensions.http_response;
        v_digit text;
        v_is_lid boolean := false;
        v_queja_cita_id bigint;
        v_cita_pendiente record;
        v_inst record;
        v_repregunta_msg text;
        v_repregunta_enviada boolean := false;
        v_nivel text;
        v_intencion_nota boolean := false;
        v_pendientes_count int := 0;
        v_inserted_cola_id bigint := NULL;
    BEGIN
        -- BLINDAJE CONTRA EXCEPCIONES: Un trigger jamás debe romper la inserción de un mensaje en n8n
        BEGIN
            v_clean_content := TRIM(NEW.contenido);
            v_norm_content := LOWER(UNACCENT(v_clean_content));

            -- Obtener el teléfono del cliente que envió el mensaje
            SELECT telefono, REGEXP_REPLACE(telefono, '[^0-9]', '', 'g')
            INTO v_raw_phone, v_target_phone
            FROM public."Clientes"
            WHERE id = NEW.cliente_id;

            IF (v_target_phone IS NOT NULL AND length(v_target_phone) > 13)
               OR COALESCE(v_raw_phone, '') ILIKE '%@lid%' THEN
                v_is_lid := true;
            END IF;

            -- Clasificación segura de la respuesta (Nivel A: nota segura, Nivel B: intención probable, Nivel C: conversación normal)
            IF NEW.direccion = 'entrante' THEN
                SELECT k.nivel, k.nota INTO v_nivel, v_digit
                FROM public.fn_clasificar_respuesta_calificacion(v_clean_content) k;
                v_intencion_nota := (v_nivel = 'B');
            END IF;

            -- CASO A: Mensaje entrante que contiene calificación (Nivel A)
            IF NEW.direccion = 'entrante' AND v_digit IS NOT NULL THEN

                -- Paso 1: Coincidencia directa por ID, por teléfono real (9 dígitos finales) o por whatsapp_lid legítimo (>13 dígitos)
                SELECT c.cliente_id INTO v_target_cliente_id
                FROM public."Citas" c
                JOIN public."Clientes" cl ON cl.id = c.cliente_id
                WHERE c.business_id = NEW.business_id
                  AND c.encuesta_enviada = true
                  AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                  AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                  AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '48 hours'
                  AND (
                      c.cliente_id = NEW.cliente_id
                      OR (
                          v_target_phone IS NOT NULL
                          AND (
                              REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') = v_target_phone
                              OR (
                                  NOT v_is_lid
                                  AND length(v_target_phone) BETWEEN 9 AND 13
                                  AND length(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 9 AND 13
                                  AND RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                              )
                              OR (
                                  v_is_lid
                                  AND cl.whatsapp_lid IS NOT NULL
                                  AND REGEXP_REPLACE(cl.whatsapp_lid, '[^0-9]', '', 'g') = v_target_phone
                              )
                          )
                      )
                  )
                ORDER BY c.id DESC
                LIMIT 1;

                -- BLINDAJE CRÍTICO ANTI-CRUCE: Rescate solo para LIDs
                IF v_target_cliente_id IS NULL AND v_is_lid THEN
                    SELECT c.cliente_id INTO v_target_cliente_id
                    FROM public."Citas" c
                    JOIN public."Clientes" cl ON cl.id = c.cliente_id
                    JOIN public."Clientes" sender ON sender.id = NEW.cliente_id
                    WHERE c.business_id = NEW.business_id
                      AND c.encuesta_enviada = true
                      AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                      AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                      AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '48 hours'
                      AND sender.push_name IS NOT NULL
                      AND TRIM(sender.push_name) <> ''
                      AND LOWER(TRIM(sender.push_name)) NOT IN ('cliente whatsapp', 'cliente', '.')
                      AND (
                          LOWER(TRIM(cl.nombre)) = LOWER(TRIM(sender.push_name))
                          OR LOWER(TRIM(cl.push_name)) = LOWER(TRIM(sender.push_name))
                      )
                    ORDER BY c.id DESC
                    LIMIT 1;
                END IF;

                IF v_target_cliente_id IS NULL AND v_is_lid THEN
                    SELECT COUNT(DISTINCT c.cliente_id) INTO v_pendientes_count
                    FROM public."Citas" c
                    WHERE c.business_id = NEW.business_id
                      AND c.encuesta_enviada = true
                      AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                      AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                      AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '2 hours';

                    IF v_pendientes_count = 1 THEN
                        SELECT c.cliente_id INTO v_target_cliente_id
                        FROM public."Citas" c
                        WHERE c.business_id = NEW.business_id
                          AND c.encuesta_enviada = true
                          AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                          AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                          AND COALESCE(c.fecha_encuesta_enviada, c.fecha_completada, c.fecha, c.created_at) >= NOW() - INTERVAL '2 hours'
                        ORDER BY c.id DESC
                        LIMIT 1;
                    END IF;
                END IF;

                -- VINCULACIÓN PERMANENTE SEGURA
                IF v_target_cliente_id IS NOT NULL AND v_target_cliente_id <> NEW.cliente_id AND v_is_lid AND length(v_target_phone) > 13 THEN
                    UPDATE public."Clientes"
                    SET whatsapp_lid = COALESCE(whatsapp_lid, v_target_phone)
                    WHERE id = v_target_cliente_id;

                    UPDATE public.mensajes
                    SET cliente_id = v_target_cliente_id
                    WHERE id = NEW.id;
                END IF;

                -- Si hay cita pendiente confirmada, procesar calificación y enviar respuesta
                IF v_target_cliente_id IS NOT NULL THEN
                    FOR v_res IN
                        SELECT * FROM public.procesar_respuesta_calificacion_fidelizacion(
                            NEW.business_id,
                            v_target_cliente_id,
                            v_digit
                        )
                    LOOP
                        IF v_res.debe_responder AND v_res.mensaje_recompensa IS NOT NULL THEN
                            v_evo_phone := v_res.telefono_cliente;

                            IF length(v_clean_content) > 2 AND v_clean_content !~ '^[1-5]$' THEN
                                UPDATE public."Citas"
                                SET feedback_cliente = v_clean_content, updated_at = now()
                                WHERE id = v_res.cita_id;
                            END IF;

                            INSERT INTO public.cola_mensajes_salientes (
                                business_id, cliente_id, cita_id, telefono,
                                flujo, mensaje, media_url, media_type, delay_ms, instance_name, api_key,
                                estado, enviado_at, proximo_intento_at, metadata
                            ) VALUES (
                                NEW.business_id, v_target_cliente_id, v_res.cita_id, v_evo_phone,
                                'fidelizacion_recompensa', v_res.mensaje_recompensa,
                                v_res.media_url, CASE WHEN v_res.media_url IS NOT NULL THEN 'image' ELSE NULL END,
                                1000, v_res.instance_name, v_res.api_key, 'enviado',
                                now(), now(),
                                jsonb_build_object(
                                    'tipo', 'respuesta_calificacion',
                                    'nota', v_res.nota_recibida,
                                    'cita_id', v_res.cita_id,
                                    'disparo_directo', true
                                )
                            )
                            RETURNING id INTO v_inserted_cola_id;

                            -- Disparo inmediato a Evolution API
                            IF v_res.instance_name IS NOT NULL AND v_res.api_key IS NOT NULL THEN
                                BEGIN
                                    IF v_res.media_url IS NOT NULL AND v_res.media_url <> '' THEN
                                        SELECT * INTO v_http_res FROM extensions.http((
                                            'POST',
                                            'https://evo.koratflow.agency/message/sendMedia/' || v_res.instance_name,
                                            ARRAY[
                                                extensions.http_header('apikey', v_res.api_key),
                                                extensions.http_header('Content-Type', 'application/json')
                                            ],
                                            'application/json',
                                            jsonb_build_object(
                                                'number', v_evo_phone,
                                                'mediatype', 'image',
                                                'mimetype', 'image/jpeg',
                                                'caption', v_res.mensaje_recompensa,
                                                'media', v_res.media_url
                                            )::text
                                        )::extensions.http_request);
                                    ELSE
                                        SELECT * INTO v_http_res FROM extensions.http((
                                            'POST',
                                            'https://evo.koratflow.agency/message/sendText/' || v_res.instance_name,
                                            ARRAY[
                                                extensions.http_header('apikey', v_res.api_key),
                                                extensions.http_header('Content-Type', 'application/json')
                                            ],
                                            'application/json',
                                            jsonb_build_object(
                                                'number', v_evo_phone,
                                                'text', v_res.mensaje_recompensa,
                                                'linkPreview', false,
                                                'options', jsonb_build_object(
                                                    'delay', (public.calcular_delay_escritura_humana(v_res.mensaje_recompensa, 1.5, 3.5) * 1000)::int,
                                                    'presence', 'composing',
                                                    'linkPreview', false
                                                )
                                            )::text
                                        )::extensions.http_request);
                                    END IF;

                                    -- Si la llamada HTTP falló (código no 2xx), marcar como pendiente para reintento seguro
                                    IF v_http_res.status IS NULL OR v_http_res.status NOT BETWEEN 200 AND 299 THEN
                                        IF v_inserted_cola_id IS NOT NULL THEN
                                            UPDATE public.cola_mensajes_salientes
                                            SET estado = 'pendiente',
                                                error_mensaje = 'HTTP ' || COALESCE(v_http_res.status::text, 'error') || ': ' || COALESCE(LEFT(v_http_res.content, 200), 'sin detalle'),
                                                updated_at = now()
                                            WHERE id = v_inserted_cola_id;
                                        END IF;
                                    END IF;

                                EXCEPTION WHEN OTHERS THEN
                                    IF v_inserted_cola_id IS NOT NULL THEN
                                        UPDATE public.cola_mensajes_salientes
                                        SET estado = 'pendiente', error_mensaje = SQLERRM, updated_at = now()
                                        WHERE id = v_inserted_cola_id;
                                    ELSE
                                        UPDATE public.cola_mensajes_salientes
                                        SET estado = 'pendiente', error_mensaje = SQLERRM, updated_at = now()
                                        WHERE telefono = v_evo_phone AND cita_id = v_res.cita_id AND flujo = 'fidelizacion_recompensa';
                                    END IF;
                                END;
                            END IF;
                        END IF;
                    END LOOP;
                END IF;

            -- CASO B: MENSAJE ENTRANTE SIN NOTA NI PALABRA CLAVE (Caso ambiguo)
            ELSIF NEW.direccion = 'entrante' AND v_digit IS NULL AND length(v_clean_content) > 1 THEN

                SELECT c.id INTO v_queja_cita_id
                FROM public."Citas" c
                JOIN public."Clientes" cl ON cl.id = c.cliente_id
                WHERE c.business_id = NEW.business_id
                  AND c.calificacion IN ('1', '2', '3')
                  AND (c.feedback_cliente IS NULL OR c.feedback_cliente ~ '^[1-5]$' OR TRIM(c.feedback_cliente) = '')
                  AND COALESCE(c.fecha_feedback, c.updated_at, c.created_at) >= NOW() - INTERVAL '24 hours'
                  AND (
                      c.cliente_id = NEW.cliente_id
                      OR (
                          v_target_phone IS NOT NULL
                          AND (
                              REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') = v_target_phone
                              OR (
                                  NOT v_is_lid
                                  AND length(v_target_phone) BETWEEN 9 AND 13
                                  AND length(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 9 AND 13
                                  AND RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                              )
                              OR (
                                  v_is_lid
                                  AND cl.whatsapp_lid IS NOT NULL
                                  AND REGEXP_REPLACE(cl.whatsapp_lid, '[^0-9]', '', 'g') = v_target_phone
                              )
                          )
                      )
                  )
                ORDER BY c.id DESC
                LIMIT 1;

                IF v_queja_cita_id IS NOT NULL THEN
                    UPDATE public."Citas"
                    SET feedback_cliente = v_clean_content, updated_at = now()
                    WHERE id = v_queja_cita_id;
                ELSE
                    SELECT c.* INTO v_cita_pendiente
                    FROM public."Citas" c
                    JOIN public."Clientes" cl ON cl.id = c.cliente_id
                    WHERE c.business_id = NEW.business_id
                      AND c.encuesta_enviada = true
                      AND (c.calificacion IS NULL OR c.calificacion = '0' OR c.calificacion = '')
                      AND (c.calificacion_origen IS NULL OR c.calificacion_origen IN ('solo_si_responde', 'recompensa_previa_enviada'))
                      AND COALESCE(c.fecha_encuesta_enviada, c.created_at) >= NOW() - INTERVAL '24 hours'
                      AND (
                          c.cliente_id = NEW.cliente_id
                          OR (
                              v_target_phone IS NOT NULL
                              AND (
                                  REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g') = v_target_phone
                                  OR (
                                      NOT v_is_lid
                                      AND length(v_target_phone) BETWEEN 9 AND 13
                                      AND length(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g')) BETWEEN 9 AND 13
                                      AND RIGHT(REGEXP_REPLACE(cl.telefono, '[^0-9]', '', 'g'), 9) = RIGHT(v_target_phone, 9)
                                  )
                                  OR (
                                      v_is_lid
                                      AND cl.whatsapp_lid IS NOT NULL
                                      AND REGEXP_REPLACE(cl.whatsapp_lid, '[^0-9]', '', 'g') = v_target_phone
                                  )
                              )
                          )
                      )
                    ORDER BY c.id DESC
                    LIMIT 1;

                    -- REPREGUNTA TÁCTICA NATURAL
                    IF v_cita_pendiente.id IS NOT NULL AND v_intencion_nota THEN
                        SELECT EXISTS (
                            SELECT 1 FROM public.mensajes m
                            WHERE m.cliente_id = v_cita_pendiente.cliente_id
                              AND m.business_id = NEW.business_id
                              AND m.campana_origen = 'repregunta_calificacion'
                              AND m.created_at >= NOW() - INTERVAL '24 hours'
                        ) INTO v_repregunta_enviada;

                        IF NOT v_repregunta_enviada THEN
                            SELECT ie.instance_name, ie.api_key INTO v_inst
                            FROM public.instancias_evolution ie
                            WHERE ie.business_id = NEW.business_id AND ie.status = 'conectado'
                            LIMIT 1;

                            IF v_inst.instance_name IS NOT NULL THEN
                                v_repregunta_msg := 'Para que el sistema pueda sumarte tus sellitos a tu tarjeta digital, ¿del *1 al 5* cuánto le pondrías a tu atención de hoy? (Porfis responde solo con el numerito, ej: *5*) 👇';

                                INSERT INTO public.calificacion_decision_log (business_id, cliente_id, contenido, nivel, decision)
                                VALUES (NEW.business_id, NEW.cliente_id, left(v_clean_content, 300), 'B', 'repregunta_enviada');

                                INSERT INTO public.mensajes (
                                    business_id, cliente_id, contenido, direccion, tipo, estado, campana_origen
                                ) VALUES (
                                    NEW.business_id, v_cita_pendiente.cliente_id, v_repregunta_msg, 'saliente', 'texto', 'enviado', 'repregunta_calificacion'
                                );

                                PERFORM extensions.http((
                                    'POST',
                                    'https://evo.koratflow.agency/message/sendText/' || v_inst.instance_name,
                                    ARRAY[
                                        extensions.http_header('apikey', v_inst.api_key),
                                        extensions.http_header('Content-Type', 'application/json')
                                    ],
                                    'application/json',
                                    jsonb_build_object(
                                        'number', COALESCE(
                                            CASE WHEN NOT v_is_lid THEN v_target_phone ELSE NULL END,
                                            (SELECT REGEXP_REPLACE(telefono, '[^0-9]', '', 'g') FROM public."Clientes" WHERE id = v_cita_pendiente.cliente_id)
                                        ),
                                        'text', v_repregunta_msg,
                                        'linkPreview', false
                                    )::text
                                )::extensions.http_request);
                            END IF;
                        END IF;
                    END IF;
                END IF;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error en trg_fn_procesar_feedback_fidelizacion: %', SQLERRM;
        END;

        RETURN NEW;
    END;
    $function$;
  `);
  console.log('   -> public.trg_fn_procesar_feedback_fidelizacion actualizada con éxito.\n');

  // =========================================================================
  // PASO 4: REACTIVAR Y REPARAR MENSAJE DE MERCEDES (ID 324)
  // =========================================================================
  console.log('4. Reparando estados de Mercedes en cola_mensajes_salientes...');
  // Fila 320 (encuesta): ya fue enviada a las 3:20pm, marcarla limpia como 'enviado'
  await client.query(`
    UPDATE public.cola_mensajes_salientes
    SET estado = 'enviado', error_mensaje = NULL, updated_at = now()
    WHERE id = 320;
  `);

  // Fila 324 (recompensa sellos): poner en 'pendiente' para despacho inmediato
  await client.query(`
    UPDATE public.cola_mensajes_salientes
    SET estado = 'pendiente',
        proximo_intento_at = now(),
        error_mensaje = NULL,
        updated_at = now()
    WHERE id = 324;
  `);
  console.log('   -> Mensaje 324 reactivado como pendiente.\n');

  // =========================================================================
  // PASO 5: EJECUTAR DESPACHO INMEDIATO PARA MERCEDES
  // =========================================================================
  console.log('5. Ejecutando public.despachar_cola_mensajes(5) para entregar el mensaje...');
  const dispatchRes = await client.query(`SELECT public.despachar_cola_mensajes(5) as resultado;`);
  console.log('   -> Resultado del despacho:', JSON.stringify(dispatchRes.rows[0].resultado, null, 2));

  // Verificar estado final de la fila 324
  const check324 = await client.query(`SELECT id, cliente_id, telefono, estado, enviado_at, error_mensaje FROM public.cola_mensajes_salientes WHERE id = 324;`);
  console.log('\n   -> Estado final fila 324:', JSON.stringify(check324.rows[0], null, 2));

  await client.end();
  console.log('\n=== DESPLIEGUE QUIRÚRGICO COMPLETADO CON ÉXITO ===');
}

main().catch(err => {
  console.error('ERROR EN DESPLIEGUE:', err);
  process.exit(1);
});
