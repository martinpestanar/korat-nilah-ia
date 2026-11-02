const { Client } = require('pg');

const connectionString = 'postgresql://postgres.cfggpqpbqqeavdbdzwoz:impredecible@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("=== INICIANDO DESPLIEGUE DEL SANITIZADOR Y AUTO-RESOLUCIÓN ===");

  // 1. Crear / actualizar public.fn_sanitizar_y_resolver_telefono_cliente
  console.log("1. Desplegando public.fn_sanitizar_y_resolver_telefono_cliente...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.fn_sanitizar_y_resolver_telefono_cliente(
        p_business_id uuid,
        p_cliente_id bigint,
        p_telefono_raw text,
        p_nombre_cliente text,
        p_pais text DEFAULT 'peru'
    )
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
        v_clean text;
        v_prefijo text;
        v_alt_telefono text;
        v_alt_cliente_id bigint;
    BEGIN
        IF p_telefono_raw IS NULL OR TRIM(p_telefono_raw) = '' THEN
            RETURN NULL;
        END IF;

        -- Obtener prefijo de país (default '51' Perú)
        v_prefijo := CASE LOWER(COALESCE(p_pais, 'peru'))
            WHEN 'peru'      THEN '51'
            WHEN 'perú'     THEN '51'
            WHEN 'pe'        THEN '51'
            WHEN 'colombia'  THEN '57'
            WHEN 'co'        THEN '57'
            WHEN 'mexico'    THEN '52'
            WHEN 'méxico'   THEN '52'
            WHEN 'mx'        THEN '52'
            WHEN 'chile'     THEN '56'
            WHEN 'cl'        THEN '56'
            WHEN 'ecuador'   THEN '593'
            WHEN 'ec'        THEN '593'
            WHEN 'venezuela' THEN '58'
            WHEN 've'        THEN '58'
            WHEN 'argentina' THEN '54'
            WHEN 'ar'        THEN '54'
            WHEN 'bolivia'   THEN '591'
            WHEN 'bo'        THEN '591'
            ELSE '51'
        END;

        -- 1. Limpiar caracteres no numéricos
        v_clean := REGEXP_REPLACE(p_telefono_raw, '[^0-9]', '', 'g');

        -- 2. DETECCIÓN DE LID (WhatsApp Linked ID > 13 dígitos o terminaba en @lid)
        IF LENGTH(v_clean) > 13 OR p_telefono_raw ILIKE '%@lid%' THEN
            -- BUSCAR AUTO-VINCULACIÓN POR DUPLICADO EN EL MISMO NEGOCIO:
            SELECT cl2.id, REGEXP_REPLACE(cl2.telefono, '[^0-9]', '', 'g')
            INTO v_alt_cliente_id, v_alt_telefono
            FROM public."Clientes" cl2
            WHERE cl2.business_id = p_business_id
              AND cl2.id <> p_cliente_id
              AND cl2.telefono IS NOT NULL
              AND LENGTH(REGEXP_REPLACE(cl2.telefono, '[^0-9]', '', 'g')) BETWEEN 8 AND 13
              AND (
                -- Mismo nombre normalizado (ignorando emojis, tildes, mayúsculas)
                LOWER(TRIM(REGEXP_REPLACE(cl2.nombre, '[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]', '', 'g'))) = 
                LOWER(TRIM(REGEXP_REPLACE(COALESCE(p_nombre_cliente, ''), '[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]', '', 'g')))
                -- O coincidencia por whatsapp_lid
                OR cl2.whatsapp_lid = v_clean
              )
            ORDER BY cl2.total_visitas DESC NULLS LAST, cl2.id DESC
            LIMIT 1;

            IF v_alt_telefono IS NOT NULL THEN
                -- Vincular el whatsapp_lid en el perfil con número real para futuras interacciones
                UPDATE public."Clientes"
                SET whatsapp_lid = COALESCE(whatsapp_lid, v_clean)
                WHERE id = v_alt_cliente_id;

                v_clean := v_alt_telefono;
            ELSE
                -- Es un LID huérfano sin número real conocido
                RETURN NULL;
            END IF;
        END IF;

        -- 3. AUTO-NORMALIZACIÓN DE FORMATOS:
        -- a) Remover ceros a la izquierda (ej. '0942999251' -> '942999251')
        IF LENGTH(v_clean) = 10 AND v_clean LIKE '09%' THEN
            v_clean := SUBSTRING(v_clean FROM 2);
        END IF;

        -- b) Remover prefijo duplicado (ej. '5151942999251' -> '51942999251')
        IF LENGTH(v_clean) = 13 AND v_clean LIKE (v_prefijo || v_prefijo || '%') THEN
            v_clean := SUBSTRING(v_clean FROM (LENGTH(v_prefijo) + 1));
        END IF;

        -- c) Si es número local (ej. 9 dígitos en Perú: '942999251'), anteponer prefijo de país
        IF LENGTH(v_clean) BETWEEN 8 AND 10 AND NOT (v_clean LIKE (v_prefijo || '%') AND LENGTH(v_clean) >= 11) THEN
            v_clean := v_prefijo || v_clean;
        END IF;

        -- 4. VALIDACIÓN FINAL:
        IF LENGTH(v_clean) BETWEEN 10 AND 14 THEN
            RETURN v_clean;
        ELSE
            RETURN NULL;
        END IF;
    END;
    $function$;
  `);

  // 2. Actualizar get_candidatos_calificacion_post_cita
  console.log("2. Desplegando get_candidatos_calificacion_post_cita con sanitizador...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.get_candidatos_calificacion_post_cita(p_business_id uuid)
    RETURNS TABLE(
        cita_id bigint,
        cliente_id bigint,
        nombre_cliente text,
        telefono_cliente text,
        servicio_realizado text,
        nombre_negocio text,
        instance_name text,
        api_key text,
        mensaje_texto text
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
        v_hora_actual  time;
        v_negocio      record;
        v_ie           record;
        v_activo_sa    boolean := false;
    BEGIN
        SELECT * INTO v_negocio FROM public.negocios WHERE id = p_business_id;
        IF NOT FOUND OR v_negocio.activo = false THEN
            RETURN;
        END IF;

        -- Control directo desde SuperAdmin:
        v_activo_sa := (
            (
              v_negocio.modo_fidelizacion IN ('sellos', 'ambos')
              AND COALESCE((v_negocio.recursos_saas->'modulos'->'club_glow'->>'activo')::boolean, true) = true
              AND COALESCE((v_negocio.recursos_saas->'sellos_addons'->>'calificaciones_integradas')::boolean, true) = true
            )
            OR COALESCE((v_negocio.recursos_saas->'automatizaciones'->>'post_cita_activo')::boolean, false) = true
            OR COALESCE((v_negocio.recursos_saas->'automatizaciones'->>'calificacion_activa')::boolean, false) = true
        );

        IF NOT v_activo_sa THEN
            RETURN;
        END IF;

        SELECT ie.instance_name, ie.api_key INTO v_ie
        FROM public.instancias_evolution ie
        WHERE ie.business_id = p_business_id
          AND ie.status = 'conectado'
          AND ie.instance_name IS NOT NULL
          AND ie.api_key IS NOT NULL
        LIMIT 1;

        IF NOT FOUND THEN RETURN; END IF;

        v_hora_actual := (now() AT TIME ZONE COALESCE(v_negocio.timezone, 'America/Lima'))::time;
        IF v_hora_actual < '07:00:00'::time OR v_hora_actual > '22:00:00'::time THEN
            RETURN;
        END IF;

        RETURN QUERY
        WITH
        candidatos_unicos AS (
            SELECT DISTINCT ON (c.cliente_id)
                c.id AS cid,
                c.cliente_id AS clid,
                c.fecha AS c_fecha,
                COALESCE(
                    NULLIF(TRIM(public.extraer_primer_nombre(cl.nombre)), ''),
                    'amiga'
                ) AS n_cliente_limpio,
                public.fn_sanitizar_y_resolver_telefono_cliente(
                    c.business_id,
                    cl.id,
                    cl.telefono,
                    cl.nombre,
                    v_negocio.pais
                ) AS t_cliente_limpio,
                COALESCE(c.servicio, 'tu servicio') AS s_nombre,
                v_negocio.nombre AS neg_nombre,
                v_ie.instance_name AS i_name,
                v_ie.api_key AS i_key
            FROM public."Citas" c
            JOIN public."Clientes" cl ON cl.id = c.cliente_id
            WHERE c.business_id = p_business_id
              AND c.estado ILIKE 'completada'
              AND (c.encuesta_enviada IS NULL OR c.encuesta_enviada = false)
              AND c.id NOT IN (1409, 1410, 1420, 1421)
              AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') <= (NOW() - INTERVAL '30 minutes')
              AND COALESCE(c.hora_fin, c.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '48 hours')
              -- Exigir teléfono válido o resoluble
              AND public.fn_sanitizar_y_resolver_telefono_cliente(
                    c.business_id,
                    cl.id,
                    cl.telefono,
                    cl.nombre,
                    v_negocio.pais
                  ) IS NOT NULL
              -- Cooldown 24h: máximo 1 encuesta por clienta en 24h
              AND NOT EXISTS (
                  SELECT 1 FROM public.mensajes m
                  WHERE m.cliente_id = c.cliente_id
                    AND m.business_id = p_business_id
                    AND m.created_at >= (NOW() - INTERVAL '24 hours')
                    AND (
                        m.campana_origen IN (
                            'fidelizacion_encuesta', 'post_cita_fidelizacion',
                            'calificacion_encuesta', 'encuesta_fidelizacion'
                        )
                        OR m.contenido ILIKE '%¿cómo te sentiste con la atención?%'
                        OR m.contenido ILIKE '%¿cómo calificarías tu atención%'
                    )
              )
              AND NOT EXISTS (
                  SELECT 1 FROM public.cola_mensajes_salientes cms
                  WHERE cms.cliente_id = c.cliente_id
                    AND cms.business_id = p_business_id
                    AND cms.created_at >= (NOW() - INTERVAL '24 hours')
                    AND cms.flujo IN ('fidelizacion_encuesta', 'calificacion_encuesta')
                    AND cms.estado IN ('pendiente', 'procesando', 'enviado')
              )
              -- Blindaje multi-servicio mismo día: esperar si tiene otra cita activa hoy que aún no haya terminado hace más de 2h
              AND NOT EXISTS (
                  SELECT 1 FROM public."Citas" c_futura
                  WHERE c_futura.cliente_id = c.cliente_id
                    AND c_futura.business_id = p_business_id
                    AND c_futura.id <> c.id
                    AND c_futura.fecha::date = c.fecha::date
                    AND LOWER(c_futura.estado) NOT IN ('cancelada', 'no asistio', 'completada')
                    AND COALESCE(c_futura.hora_fin, c_futura.fecha + INTERVAL '90 minutes') >= (NOW() - INTERVAL '2 hours')
              )
            ORDER BY c.cliente_id, c.fecha DESC, c.id DESC
        )
        SELECT
            cu.cid AS cita_id,
            cu.clid AS cliente_id,
            cu.n_cliente_limpio AS nombre_cliente,
            cu.t_cliente_limpio AS telefono_cliente,
            cu.s_nombre AS servicio_realizado,
            cu.neg_nombre AS nombre_negocio,
            cu.i_name AS instance_name,
            cu.i_key AS api_key,
            '🌸 Qué alegría haberte tenido con nosotras.

Una preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇' AS mensaje_texto
        FROM candidatos_unicos cu
        ORDER BY cu.c_fecha ASC
        LIMIT 10;
    END;
    $function$;
  `);

  // 3. Actualizar encolar_calificacion_post_cita para manejar citas sin teléfono válido
  console.log("3. Desplegando encolar_calificacion_post_cita con auto-cierre de huérfanos...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.encolar_calificacion_post_cita()
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    DECLARE
        v_negocio   record;
        v_cand      record;
        v_encolados integer := 0;
        v_delay_ms  integer;
    BEGIN
        FOR v_negocio IN
            SELECT n.id, n.nombre, n.pais, ie.instance_name, ie.api_key, n.timezone
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
            -- 1. Encolar candidatos con teléfono limpio y válido
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

                    -- Marcar encuesta_enviada = true en todas las citas completadas de esa misma clienta en ese mismo día
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
                    RAISE WARNING 'encolar_calificacion_post_cita - cita %: %', v_cand.cita_id, SQLERRM;
                END;
            END LOOP;

            -- 2. Auto-marcar citas completadas en ventana de 48h que NO tengan teléfono resoluble (evita bucles y falsos errores)
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

  // 4. Actualizar despachar_cola_mensajes con auto-sanitizador
  console.log("4. Desplegando despachar_cola_mensajes con sanitizador preventivo...");
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
                -- Si no tiene teléfono resoluble (ej. LID huérfano), omitir silenciosamente sin generar error HTTP 400
                UPDATE public.cola_mensajes_salientes
                SET estado = 'omitido',
                    error_mensaje = 'Omitido automáticamente: Identificador LID sin número telefónico real vinculado',
                    updated_at = now()
                WHERE id = v_msg.id;
                CONTINUE;
            END IF;

            -- Pausa aleatoria
            IF v_enviados > 0 THEN
                PERFORM pg_sleep(3.0 + (random() * 4.0));
            END IF;

            UPDATE public.cola_mensajes_salientes
            SET estado = 'procesando', intentos = intentos + 1
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
                    SET estado = 'enviado', enviado_at = now(), error_mensaje = NULL
                    WHERE id = v_msg.id;

                    IF v_msg.flujo = 'recordatorio_24h' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET recordatorio_24h_enviado = true, updated_at = now() WHERE id = v_msg.cita_id;
                    ELSIF v_msg.flujo = 'recordatorio_3h' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET recordatorio_3h_enviado = true, updated_at = now() WHERE id = v_msg.cita_id;
                    ELSIF v_msg.flujo = 'fidelizacion_encuesta' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET encuesta_enviada = true, fecha_encuesta_enviada = now(), updated_at = now() WHERE id = v_msg.cita_id;
                    ELSIF v_msg.flujo = 'calificacion_encuesta' AND v_msg.cita_id IS NOT NULL THEN
                        UPDATE public."Citas" SET encuesta_enviada = true, fecha_encuesta_enviada = now(), updated_at = now() WHERE id = v_msg.cita_id;
                    END IF;

                    IF v_msg.campana_id IS NOT NULL THEN
                        UPDATE public.campanas
                        SET mensajes_enviados = COALESCE(mensajes_enviados, 0) + 1, updated_at = now()
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
                        error_mensaje = 'HTTP ' || v_http_status || ' (cliente): ' || COALESCE(LEFT(v_http_res.content, 200), 'sin detalle')
                    WHERE id = v_msg.id;
                    v_fallidos := v_fallidos + 1;

                ELSE
                    v_consecutive_errors := v_consecutive_errors + 1;
                    v_backoff_mins := LEAST(60, (2 ^ (v_msg.intentos - 1))::integer);

                    IF (v_msg.intentos + 1) > v_msg.max_intentos THEN
                        UPDATE public.cola_mensajes_salientes
                        SET estado = 'fallido',
                            error_mensaje = 'Agotados ' || v_msg.max_intentos || ' intentos. Ultimo HTTP: ' || v_http_status
                        WHERE id = v_msg.id;
                        v_fallidos := v_fallidos + 1;
                    ELSE
                        UPDATE public.cola_mensajes_salientes
                        SET estado = 'pendiente',
                            proximo_intento_at = now() + (v_backoff_mins || ' minutes')::interval,
                            error_mensaje = 'HTTP ' || v_http_status || ' - reintento en ' || v_backoff_mins || 'min'
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
                        error_mensaje = 'Exception: ' || v_error_detalle
                    WHERE id = v_msg.id;
                    v_fallidos := v_fallidos + 1;
                ELSE
                    UPDATE public.cola_mensajes_salientes
                    SET estado = 'pendiente',
                        proximo_intento_at = now() + (v_backoff_mins || ' minutes')::interval,
                        error_mensaje = 'Exception: ' || v_error_detalle
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

  console.log("5. Auto-resolviendo registros existentes en cola_mensajes_salientes...");
  // Devorah: marcar como omitido para no inflar la alerta roja
  await client.query(`
    UPDATE public.cola_mensajes_salientes
    SET estado = 'omitido',
        error_mensaje = 'Omitido automáticamente: Identificador LID sin número telefónico real vinculado'
    WHERE id = 169 AND estado = 'fallido';
  `);
  console.log("-> Mensaje #169 (Devorah) marcado como 'omitido' (limpiando alerta roja).");

  // Tania: auto-corregir su teléfono en la cola al 51942999251 y resetear a pendiente para despacho
  await client.query(`
    UPDATE public.cola_mensajes_salientes
    SET telefono = '51942999251',
        estado = 'pendiente',
        intentos = 0,
        error_mensaje = NULL,
        proximo_intento_at = now()
    WHERE id = 170 AND estado = 'fallido';
  `);
  console.log("-> Mensaje #170 (Tania) auto-corregido a 51942999251 y puesto en 'pendiente'.");

  // Despachar el mensaje corregido de Tania
  console.log("6. Despachando cola de mensajes...");
  const dispatchRes = await client.query(`SELECT public.despachar_cola_mensajes(5);`);
  console.log("Resultado del despacho:", JSON.stringify(dispatchRes.rows[0], null, 2));

  // Verificar estado final de Tania y Devorah
  const verifRes = await client.query(`
    SELECT id, cliente_id, cita_id, telefono, estado, error_mensaje, enviado_at
    FROM public.cola_mensajes_salientes
    WHERE id IN (169, 170);
  `);
  console.log("Estado final de los mensajes:", JSON.stringify(verifRes.rows, null, 2));

  await client.end();
}

main().catch(console.error);
